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
 * Mouse Distortion — THE.LAB / Typography.
 *
 * Крупная типографика искажается вокруг курсора через SVG feDisplacementMap.
 */
const POSITION_LERP = 0.14;
const RADIUS_LERP = 0.09;
const DISTORT_RADIUS = 220;
const DISTORT_SCALE = 88;
const LENS_AMOUNT = 1.05;
const MAP_MAX_SIZE = 360;
const SCENE_INIT_MAX_ATTEMPTS = 30;

@Component({
  selector: 'app-mouse-distortion',
  standalone: true,
  imports: [CommonModule, LabDemoLayoutComponent],
  styleUrls: ['./mouse-distortion.component.scss'],
  templateUrl: './mouse-distortion.component.html',
  encapsulation: ViewEncapsulation.None,
})
export class MouseDistortionComponent implements AfterViewInit, OnDestroy {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly ngZone = inject(NgZone);

  @ViewChild('sceneHost') sceneHostRef!: ElementRef<HTMLElement>;

  positionLerp = POSITION_LERP;
  radiusLerp = RADIUS_LERP;
  distortRadius = DISTORT_RADIUS;
  distortScale = DISTORT_SCALE;

  private sceneEl: HTMLElement | null = null;
  private distortionEl: HTMLElement | null = null;
  private mapCanvas: HTMLCanvasElement | null = null;
  private mapCtx: CanvasRenderingContext2D | null = null;
  private mapImageData: ImageData | null = null;
  private feImageNode: SVGImageElement | null = null;
  private pointer: { x: number; y: number } | null = null;
  private current = { x: 0, y: 0, radius: 0 };
  private mapScaleX = 1;
  private mapScaleY = 1;
  private rafId: number | null = null;
  private resizeObserver: ResizeObserver | null = null;
  private resizeRafId: number | null = null;
  private reducedMotion = false;
  private initialized = false;
  private mapDirty = true;
  private lastMapDataUrl = '';
  private readonly boundTick = () => this.tick();
  private pointerBinding: ScenePointerBinding | null = null;
  private initRafId: number | null = null;
  private destroyed = false;

  ngAfterViewInit() {
    if (!isPlatformBrowser(this.platformId)) return;
    this.scheduleSceneInit();
  }

  ngOnDestroy() {
    this.destroyed = true;
    if (!isPlatformBrowser(this.platformId)) return;
    if (this.initRafId !== null) cancelAnimationFrame(this.initRafId);
    if (this.rafId !== null) cancelAnimationFrame(this.rafId);
    if (this.resizeRafId !== null) cancelAnimationFrame(this.resizeRafId);
    this.resizeObserver?.disconnect();
    this.pointerBinding?.unbind();
  }

  private scheduleSceneInit(attempt = 0) {
    if (!isPlatformBrowser(this.platformId) || this.destroyed) return;
    if (this.initScene() || attempt >= SCENE_INIT_MAX_ATTEMPTS) return;
    this.initRafId = requestAnimationFrame(() => this.scheduleSceneInit(attempt + 1));
  }

  private initScene(): boolean {
    if (this.initialized) return true;

    this.sceneEl = this.sceneHostRef?.nativeElement ?? null;
    this.distortionEl = this.sceneEl?.querySelector<HTMLElement>('.js-typo-distort') ?? null;
    this.mapCanvas = this.sceneEl?.querySelector<HTMLCanvasElement>('.js-typo-distort-map') ?? null;
    this.mapCtx = this.mapCanvas?.getContext('2d', { willReadFrequently: true }) ?? null;
    this.feImageNode = this.sceneEl?.querySelector<SVGImageElement>('.js-typo-distort-feimage') ?? null;

    if (!this.sceneEl || !this.distortionEl || !this.mapCanvas || !this.mapCtx || !this.feImageNode) {
      return false;
    }
    if (this.sceneEl.clientWidth === 0 || this.sceneEl.clientHeight === 0) return false;

    this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.resizeMapCanvas();
    this.reset(false);

    this.resizeObserver = new ResizeObserver(() => {
      if (this.resizeRafId !== null) return;
      this.resizeRafId = requestAnimationFrame(() => {
        this.resizeRafId = null;
        this.resizeMapCanvas();
        this.mapDirty = true;
      });
    });
    this.resizeObserver.observe(this.sceneEl);

    this.pointerBinding = bindScenePointer(this.sceneEl, {
      onMove: (e) => this.onPointerMove(e),
      onLeave: () => this.onPointerLeave(),
    });

    this.ngZone.runOutsideAngular(() => {
      this.rafId = requestAnimationFrame(this.boundTick);
    });

    this.initialized = true;
    return true;
  }

  onPointerMove(event: PointerEvent) {
    if (!this.sceneEl) return;
    const rect = this.sceneEl.getBoundingClientRect();
    this.pointer = { x: event.clientX - rect.left, y: event.clientY - rect.top };
  }

  onPointerLeave() {
    this.pointer = null;
  }

  reset(rebuildMap = true) {
    this.pointer = null;
    this.positionLerp = POSITION_LERP;
    this.radiusLerp = RADIUS_LERP;
    this.distortRadius = DISTORT_RADIUS;
    this.distortScale = DISTORT_SCALE;

    if (this.sceneEl) {
      this.current.x = this.sceneEl.clientWidth / 2;
      this.current.y = this.sceneEl.clientHeight / 2;
      this.current.radius = 0;
    }

    this.applyVars();
    if (rebuildMap) {
      this.mapDirty = true;
      this.drawDisplacementMap(true);
    }
  }

  onParamChange(detail: { id: string; value: number }) {
    if (detail.id === 'positionLerp') this.positionLerp = detail.value;
    if (detail.id === 'radiusLerp') this.radiusLerp = detail.value;
    if (detail.id === 'distortRadius') this.distortRadius = detail.value;
    if (detail.id === 'distortScale') this.distortScale = detail.value;
    this.mapDirty = true;
  }

  tick() {
    const targetRadius = this.pointer && !this.reducedMotion ? this.distortRadius : 0;

    if (this.pointer && !this.reducedMotion) {
      this.current.x += (this.pointer.x - this.current.x) * this.positionLerp;
      this.current.y += (this.pointer.y - this.current.y) * this.positionLerp;
    }

    this.current.radius += (targetRadius - this.current.radius) * this.radiusLerp;
    if (this.current.radius < 0.5 && targetRadius === 0) this.current.radius = 0;

    this.applyVars();

    if (!this.reducedMotion && (this.mapDirty || this.current.radius > 0.5)) {
      this.drawDisplacementMap();
    }

    this.rafId = requestAnimationFrame(this.boundTick);
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

  private drawDisplacementMap(force = false) {
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

    if (!force && !this.mapDirty && radius < 0.5) return;

    const dataUrl = this.mapCanvas.toDataURL('image/png');
    if (force || dataUrl !== this.lastMapDataUrl) {
      this.feImageNode.setAttribute('href', dataUrl);
      this.lastMapDataUrl = dataUrl;
    }

    this.mapDirty = false;
  }

  private applyVars() {
    if (!this.distortionEl) return;
    this.distortionEl.style.setProperty('--dx', `${this.current.x.toFixed(1)}px`);
    this.distortionEl.style.setProperty('--dy', `${this.current.y.toFixed(1)}px`);
    this.distortionEl.style.setProperty('--dr', `${this.current.radius.toFixed(1)}px`);
  }

  drawDebug({ ctx, width, height }: { ctx: CanvasRenderingContext2D; width: number; height: number }) {
    ctx.clearRect(0, 0, width, height);
    const { x, y, radius } = this.current;

    ctx.beginPath();
    ctx.setLineDash([4, 6]);
    ctx.strokeStyle = 'rgba(245, 158, 11, 0.5)';
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = 'rgba(253, 186, 116, 0.9)';
    ctx.font = '11px monospace';
    ctx.fillText(`scale: ${this.distortScale}`, 12, 18);
  }
}
