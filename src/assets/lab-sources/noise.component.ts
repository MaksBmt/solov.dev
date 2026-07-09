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

/**
 * Noise — THE.LAB / Backgrounds.
 *
 * Процедурный film grain на Canvas 2D: каждый кадр
 * генерирует новый шум, курсор усиливает зернистость и chromatic shift.
 */
const GRAIN_INTENSITY = 0.42;
const GRAIN_SCALE = 1.8;
const CHROMA_SHIFT = 2.4;
const POINTER_BOOST = 1.65;
const POSITION_LERP = 0.14;

@Component({
  selector: 'app-noise',
  standalone: true,
  imports: [CommonModule, LabDemoLayoutComponent],
  styleUrls: ['./noise.component.scss'],
  templateUrl: './noise.component.html',
  encapsulation: ViewEncapsulation.None,
})
export class NoiseComponent implements AfterViewInit, OnDestroy {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly ngZone = inject(NgZone);

  @ViewChild('sceneHost') sceneHostRef!: ElementRef<HTMLElement>;

  grainIntensity = GRAIN_INTENSITY;
  grainScale = GRAIN_SCALE;
  chromaShift = CHROMA_SHIFT;
  pointerBoost = POINTER_BOOST;

  private sceneEl: HTMLElement | null = null;
  private canvasEl: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private imageData: ImageData | null = null;
  private pointer = { x: 0.5, y: 0.5, active: false };
  private smooth = { x: 0.5, y: 0.5 };
  private rafId: number | null = null;
  private resizeObserver: ResizeObserver | null = null;
  private reducedMotion = false;
  private frame = 0;
  private readonly boundOnPointerMove = (e: PointerEvent) => this.onPointerMove(e);
  private readonly boundOnPointerLeave = () => this.onPointerLeave();

  ngAfterViewInit() {
    if (!isPlatformBrowser(this.platformId)) return;
    this.initScene();
  }

  ngOnDestroy() {
    if (!isPlatformBrowser(this.platformId)) return;
    if (this.rafId !== null) cancelAnimationFrame(this.rafId);
    this.resizeObserver?.disconnect();
    this.sceneEl?.removeEventListener('pointermove', this.boundOnPointerMove);
    this.sceneEl?.removeEventListener('pointerleave', this.boundOnPointerLeave);
  }

  reset() {
    this.grainIntensity = GRAIN_INTENSITY;
    this.grainScale = GRAIN_SCALE;
    this.chromaShift = CHROMA_SHIFT;
    this.pointerBoost = POINTER_BOOST;
    this.pointer.active = false;
    this.applyVars();
  }

  onParamChange(detail: { id: string; value: number }) {
    if (detail.id === 'grainIntensity') this.grainIntensity = detail.value;
    if (detail.id === 'grainScale') this.grainScale = detail.value;
    if (detail.id === 'chromaShift') this.chromaShift = detail.value;
    if (detail.id === 'pointerBoost') this.pointerBoost = detail.value;
    this.applyVars();
  }

  private initScene() {
    this.sceneEl = this.sceneHostRef?.nativeElement ?? null;
    this.canvasEl = this.sceneEl?.querySelector<HTMLCanvasElement>('.js-noise-canvas') ?? null;
    this.ctx = this.canvasEl?.getContext('2d', { alpha: true }) ?? null;
    if (!this.sceneEl || !this.canvasEl || !this.ctx) return;

    this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.resizeCanvas();
    this.applyVars();

    this.resizeObserver = new ResizeObserver(() => this.resizeCanvas());
    this.resizeObserver.observe(this.sceneEl);

    this.sceneEl.addEventListener('pointermove', this.boundOnPointerMove, { passive: true });
    this.sceneEl.addEventListener('pointerleave', this.boundOnPointerLeave);

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
    this.pointer.x = (event.clientX - rect.left) / rect.width;
    this.pointer.y = (event.clientY - rect.top) / rect.height;
    this.pointer.active = true;
  }

  private onPointerLeave() {
    this.pointer.active = false;
  }

  private tick() {
    if (!this.ctx || !this.canvasEl || !this.imageData) return;

    this.smooth.x += (this.pointer.x - this.smooth.x) * POSITION_LERP;
    this.smooth.y += (this.pointer.y - this.smooth.y) * POSITION_LERP;

    const w = this.imageData.width;
    const h = this.imageData.height;
    const data = this.imageData.data;
    const px = this.smooth.x * w;
    const py = this.smooth.y * h;
    const boostRadius = Math.min(w, h) * 0.28;
    const base = this.grainIntensity * 255;
    const frameSeed = this.frame * 0.017;

    for (let y = 0; y < h; y += 1) {
      for (let x = 0; x < w; x += 1) {
        const i = (y * w + x) * 4;
        const dist = Math.hypot(x - px, y - py);
        const boost = this.pointer.active
          ? Math.max(0, 1 - dist / boostRadius) * this.pointerBoost
          : 0;
        const n = (Math.sin(x * 12.9898 + y * 78.233 + frameSeed) * 43758.5453) % 1;
        const grain = (n - 0.5) * base * (1 + boost) * this.grainScale;
        const chroma = this.chromaShift * boost;

        data[i] = 128 + grain + chroma;
        data[i + 1] = 128 + grain;
        data[i + 2] = 128 + grain - chroma;
        data[i + 3] = Math.min(255, 38 + Math.abs(grain) * 0.55 + boost * 80);
      }
    }

    this.ctx.putImageData(this.imageData, 0, 0);
    this.frame += 1;
    this.applyVars();
  }

  private resizeCanvas() {
    if (!this.sceneEl || !this.canvasEl || !this.ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const width = this.sceneEl.clientWidth;
    const height = this.sceneEl.clientHeight;
    if (width === 0 || height === 0) return;

    const cw = Math.round(width * dpr * 0.5);
    const ch = Math.round(height * dpr * 0.5);

    this.canvasEl.width = cw;
    this.canvasEl.height = ch;
    this.canvasEl.style.width = `${width}px`;
    this.canvasEl.style.height = `${height}px`;
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.imageData = this.ctx.createImageData(cw, ch);
  }

  private applyVars() {
    if (!this.sceneEl) return;
    this.sceneEl.style.setProperty('--grain-intensity', String(this.grainIntensity.toFixed(2)));
    this.sceneEl.style.setProperty('--pointer-x', String((this.smooth.x * 100).toFixed(1)));
    this.sceneEl.style.setProperty('--pointer-y', String((this.smooth.y * 100).toFixed(1)));
    this.sceneEl.style.setProperty('--frame', String(this.frame));
  }

  drawDebug({ ctx, width, height }: { ctx: CanvasRenderingContext2D; width: number; height: number }) {
    ctx.clearRect(0, 0, width, height);
    const px = this.smooth.x * width;
    const py = this.smooth.y * height;
    const r = Math.min(width, height) * 0.28;

    ctx.beginPath();
    ctx.setLineDash([4, 6]);
    ctx.strokeStyle = 'rgba(245, 158, 11, 0.4)';
    ctx.arc(px, py, r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
  }
}
