import {
  Component,
  AfterViewInit,
  OnDestroy,
  PLATFORM_ID,
  NgZone,
  ViewChild,
  ElementRef,
  ViewEncapsulation,
  inject,
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { LabDemoLayoutComponent } from '../../../shell/lab-demo-layout/lab-demo-layout.component';
import { bindScenePointer, ScenePointerBinding } from '../../../utils/scene-pointer';

/**
 * Glass Refraction — THE.LAB / Backgrounds.
 *
 * Живой gradient-фон за frosted glass-панелями;
 * SVG feDisplacementMap искажает стекло вокруг курсора — эффект линзы.
 */
const POSITION_LERP = 0.12;
const RADIUS_LERP = 0.09;
const DISTORT_RADIUS = 180;
const DISTORT_SCALE = 48;
const GLASS_BLUR = 16;
const GRADIENT_SPEED = 0.4;
const LENS_AMOUNT = 0.85;
const MAP_MAX_SIZE = 320;

@Component({
  selector: 'app-glass-refraction',
  standalone: true,
  imports: [CommonModule, LabDemoLayoutComponent],
  styleUrls: ['./glass-refraction.component.scss'],
  templateUrl: './glass-refraction.component.html',
  encapsulation: ViewEncapsulation.None,
})
export class GlassRefractionComponent implements AfterViewInit, OnDestroy {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly ngZone = inject(NgZone);

  @ViewChild('sceneHost') sceneHostRef!: ElementRef<HTMLElement>;

  positionLerp = POSITION_LERP;
  radiusLerp = RADIUS_LERP;
  distortRadius = DISTORT_RADIUS;
  distortScale = DISTORT_SCALE;
  glassBlur = GLASS_BLUR;
  gradientSpeed = GRADIENT_SPEED;

  readonly panels = [
    { title: 'Design', hue: 32 },
    { title: 'Code', hue: 200 },
    { title: 'Motion', hue: 280 },
  ];

  private sceneEl: HTMLElement | null = null;
  private glassEl: HTMLElement | null = null;
  private mapCanvas: HTMLCanvasElement | null = null;
  private mapCtx: CanvasRenderingContext2D | null = null;
  private mapImageData: ImageData | null = null;
  private feImageNode: SVGImageElement | null = null;
  private pointer: { x: number; y: number } | null = null;
  private current = { x: 0, y: 0, radius: 0 };
  private mapScaleX = 1;
  private mapScaleY = 1;
  private time = 0;
  private rafId: number | null = null;
  private resizeObserver: ResizeObserver | null = null;
  private mapDirty = true;
  private lastMapDataUrl = '';
  private pointerBinding: ScenePointerBinding | null = null;

  ngAfterViewInit() {
    if (!isPlatformBrowser(this.platformId)) return;
    this.initScene();
  }

  ngOnDestroy() {
    if (!isPlatformBrowser(this.platformId)) return;
    if (this.rafId !== null) cancelAnimationFrame(this.rafId);
    this.resizeObserver?.disconnect();
    this.pointerBinding?.unbind();
  }

  reset() {
    this.positionLerp = POSITION_LERP;
    this.radiusLerp = RADIUS_LERP;
    this.distortRadius = DISTORT_RADIUS;
    this.distortScale = DISTORT_SCALE;
    this.glassBlur = GLASS_BLUR;
    this.gradientSpeed = GRADIENT_SPEED;
    this.pointer = null;
    this.current.radius = 0;
    if (this.sceneEl) {
      this.current.x = this.sceneEl.clientWidth / 2;
      this.current.y = this.sceneEl.clientHeight / 2;
    }
    this.mapDirty = true;
    this.applyVars();
  }

  onParamChange(detail: { id: string; value: number }) {
    if (detail.id === 'positionLerp') this.positionLerp = detail.value;
    if (detail.id === 'distortRadius') this.distortRadius = detail.value;
    if (detail.id === 'distortScale') this.distortScale = detail.value;
    if (detail.id === 'glassBlur') this.glassBlur = detail.value;
    if (detail.id === 'gradientSpeed') this.gradientSpeed = detail.value;
    this.mapDirty = true;
    this.applyVars();
  }

  private initScene() {
    this.sceneEl = this.sceneHostRef?.nativeElement ?? null;
    this.glassEl = this.sceneEl?.querySelector<HTMLElement>('.js-glass-layer') ?? null;
    this.mapCanvas = this.sceneEl?.querySelector<HTMLCanvasElement>('.js-disp-map') ?? null;
    this.mapCtx = this.mapCanvas?.getContext('2d', { willReadFrequently: true }) ?? null;
    this.feImageNode = this.sceneEl?.querySelector<SVGImageElement>('.js-glass-feimage') ?? null;
    if (!this.sceneEl || !this.glassEl || !this.mapCanvas || !this.mapCtx || !this.feImageNode) return;

    this.current.x = this.sceneEl.clientWidth / 2;
    this.current.y = this.sceneEl.clientHeight / 2;
    this.resizeMapCanvas();
    this.applyVars();

    this.resizeObserver = new ResizeObserver(() => {
      this.resizeMapCanvas();
      this.mapDirty = true;
    });
    this.resizeObserver.observe(this.sceneEl);

    this.pointerBinding = bindScenePointer(this.sceneEl, {
      onMove: (e) => this.onPointerMove(e),
      onLeave: () => this.onPointerLeave(),
    });

    this.ngZone.runOutsideAngular(() => {
      const loop = () => {
        this.tick();
        this.rafId = requestAnimationFrame(loop);
      };
      this.rafId = requestAnimationFrame(loop);
    });
  }

  private onPointerMove(event: PointerEvent) {
    if (!this.sceneEl) return;
    const rect = this.sceneEl.getBoundingClientRect();
    this.pointer = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
  }

  private onPointerLeave() {
    this.pointer = null;
  }

  private tick() {
    this.time += 0.016;
    const targetRadius = this.pointer ? this.distortRadius : 0;

    if (this.pointer) {
      this.current.x += (this.pointer.x - this.current.x) * this.positionLerp;
      this.current.y += (this.pointer.y - this.current.y) * this.positionLerp;
    }

    this.current.radius += (targetRadius - this.current.radius) * this.radiusLerp;
    if (this.current.radius < 0.5 && targetRadius === 0) this.current.radius = 0;

    if (this.mapDirty || this.current.radius > 0.5) {
      this.drawDisplacementMap();
    }

    this.applyVars();
  }

  private resizeMapCanvas() {
    if (!this.sceneEl || !this.mapCanvas || !this.mapCtx) return;

    const sceneWidth = this.sceneEl.clientWidth;
    const sceneHeight = this.sceneEl.clientHeight;
    if (sceneWidth === 0 || sceneHeight === 0) return;

    const longest = Math.max(sceneWidth, sceneHeight);
    const scale = Math.min(1, MAP_MAX_SIZE / longest);
    const width = Math.max(1, Math.round(sceneWidth * scale));
    const height = Math.max(1, Math.round(sceneHeight * scale));

    this.mapCanvas.width = width;
    this.mapCanvas.height = height;
    this.mapScaleX = width / sceneWidth;
    this.mapScaleY = height / sceneHeight;
    this.mapImageData = this.mapCtx.createImageData(width, height);
    this.mapDirty = true;
  }

  private drawDisplacementMap() {
    if (!this.mapCanvas || !this.mapCtx || !this.mapImageData || !this.feImageNode) return;

    const width = this.mapCanvas.width;
    const height = this.mapCanvas.height;
    const data = this.mapImageData.data;
    const cx = this.current.x * this.mapScaleX;
    const cy = this.current.y * this.mapScaleY;
    const radius = this.current.radius * Math.min(this.mapScaleX, this.mapScaleY);

    for (let i = 0; i < data.length; i += 4) {
      data[i] = 128;
      data[i + 1] = 128;
      data[i + 2] = 128;
      data[i + 3] = 255;
    }

    if (radius > 0.5) {
      const bound = Math.ceil(radius);
      const x0 = Math.max(0, Math.floor(cx - bound));
      const x1 = Math.min(width - 1, Math.ceil(cx + bound));
      const y0 = Math.max(0, Math.floor(cy - bound));
      const y1 = Math.min(height - 1, Math.ceil(cy + bound));

      for (let y = y0; y <= y1; y += 1) {
        for (let x = x0; x <= x1; x += 1) {
          const dx = x - cx;
          const dy = y - cy;
          const dist = Math.hypot(dx, dy);
          if (dist >= radius || dist < 0.5) continue;

          const t = 1 - dist / radius;
          const mag = t * t * LENS_AMOUNT;
          const nx = dx / dist;
          const ny = dy / dist;
          const idx = (y * width + x) * 4;

          data[idx] = 128 + nx * mag * 127;
          data[idx + 1] = 128 + ny * mag * 127;
        }
      }
    }

    this.mapCtx.putImageData(this.mapImageData, 0, 0);
    const dataUrl = this.mapCanvas.toDataURL('image/png');
    if (dataUrl !== this.lastMapDataUrl) {
      this.feImageNode.setAttribute('href', dataUrl);
      this.lastMapDataUrl = dataUrl;
    }
    this.mapDirty = false;
  }

  private applyVars() {
    const el = this.sceneHostRef?.nativeElement;
    if (!el) return;

    el.style.setProperty('--glass-blur', `${this.glassBlur}px`);
    el.style.setProperty('--gradient-speed', String(this.gradientSpeed.toFixed(2)));
    el.style.setProperty('--disp-x', String((this.current.x / (this.sceneEl?.clientWidth || 1) * 100).toFixed(1)));
    el.style.setProperty('--disp-y', String((this.current.y / (this.sceneEl?.clientHeight || 1) * 100).toFixed(1)));
    el.style.setProperty('--disp-r', String(this.current.radius.toFixed(0)));
  }

  drawDebug({ ctx, width, height }: { ctx: CanvasRenderingContext2D; width: number; height: number }) {
    ctx.clearRect(0, 0, width, height);
    const px = this.current.x;
    const py = this.current.y;

    ctx.beginPath();
    ctx.setLineDash([4, 6]);
    ctx.strokeStyle = 'rgba(245, 158, 11, 0.4)';
    ctx.arc(px, py, this.current.radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
  }
}
