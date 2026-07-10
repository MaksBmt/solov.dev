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
 * Wave Background — THE.LAB / Backgrounds.
 *
 * Многослойные синусоидальные волны на Canvas 2D;
 * курсор создаёт ripple-возмущения в поле высот.
 */
const WAVE_COUNT = 5;
const WAVE_SPEED = 0.9;
const WAVE_AMPLITUDE = 28;
const RIPPLE_STRENGTH = 1.4;
const RIPPLE_DECAY = 0.018;

interface Ripple {
  x: number;
  y: number;
  radius: number;
  strength: number;
}

@Component({
  selector: 'app-wave-background',
  standalone: true,
  imports: [CommonModule, LabDemoLayoutComponent],
  styleUrls: ['./wave-background.component.scss'],
  templateUrl: './wave-background.component.html',
  encapsulation: ViewEncapsulation.None,
})
export class WaveBackgroundComponent implements AfterViewInit, OnDestroy {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly ngZone = inject(NgZone);

  @ViewChild('sceneHost') sceneHostRef!: ElementRef<HTMLElement>;

  waveCount = WAVE_COUNT;
  waveSpeed = WAVE_SPEED;
  waveAmplitude = WAVE_AMPLITUDE;
  rippleStrength = RIPPLE_STRENGTH;
  rippleDecay = RIPPLE_DECAY;

  private sceneEl: HTMLElement | null = null;
  private canvasEl: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private ripples: Ripple[] = [];
  private pointer = { x: 0, y: 0, active: false };
  private time = 0;
  private rafId: number | null = null;
  private resizeObserver: ResizeObserver | null = null;
  private width = 0;
  private height = 0;
  private lastRippleTime = 0;
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
    this.waveCount = WAVE_COUNT;
    this.waveSpeed = WAVE_SPEED;
    this.waveAmplitude = WAVE_AMPLITUDE;
    this.rippleStrength = RIPPLE_STRENGTH;
    this.rippleDecay = RIPPLE_DECAY;
    this.ripples = [];
    this.applyVars();
  }

  onParamChange(detail: { id: string; value: number }) {
    if (detail.id === 'waveCount') this.waveCount = Math.round(detail.value);
    if (detail.id === 'waveSpeed') this.waveSpeed = detail.value;
    if (detail.id === 'waveAmplitude') this.waveAmplitude = detail.value;
    if (detail.id === 'rippleStrength') this.rippleStrength = detail.value;
    if (detail.id === 'rippleDecay') this.rippleDecay = detail.value;
  }

  private initScene() {
    this.sceneEl = this.sceneHostRef?.nativeElement ?? null;
    this.canvasEl = this.sceneEl?.querySelector<HTMLCanvasElement>('.js-wave-canvas') ?? null;
    this.ctx = this.canvasEl?.getContext('2d', { alpha: true }) ?? null;
    if (!this.sceneEl || !this.canvasEl || !this.ctx) return;

    this.resizeCanvas();
    this.applyVars();

    this.resizeObserver = new ResizeObserver(() => this.resizeCanvas());
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
    this.pointer.x = event.clientX - rect.left;
    this.pointer.y = event.clientY - rect.top;
    this.pointer.active = true;

    const now = performance.now();
    if (now - this.lastRippleTime > 80) {
      this.ripples.push({
        x: this.pointer.x,
        y: this.pointer.y,
        radius: 0,
        strength: this.rippleStrength,
      });
      this.lastRippleTime = now;
    }
  }

  private onPointerLeave() {
    this.pointer.active = false;
  }

  private getWaveOffset(x: number, y: number, layer: number): number {
    const freq = 0.012 + layer * 0.004;
    const phase = this.time * this.waveSpeed * (0.6 + layer * 0.15);
    let offset = Math.sin(x * freq + phase) * this.waveAmplitude * (0.5 + layer * 0.12);
    offset += Math.cos(y * freq * 0.7 + phase * 1.3) * this.waveAmplitude * 0.35;

    for (const ripple of this.ripples) {
      const dist = Math.hypot(x - ripple.x, y - ripple.y);
      const wave = Math.sin((dist - ripple.radius) * 0.08) * ripple.strength * 12;
      const falloff = Math.max(0, 1 - Math.abs(dist - ripple.radius) / 80);
      offset += wave * falloff;
    }

    return offset;
  }

  private tick() {
    if (!this.ctx) return;

    this.time += 0.016;
    this.ctx.clearRect(0, 0, this.width, this.height);

    const baseY = this.height * 0.55;

    for (let layer = 0; layer < this.waveCount; layer += 1) {
      const hue = 200 + layer * 18;
      const alpha = 0.15 + layer * 0.08;
      const yOffset = layer * 18;

      this.ctx.beginPath();
      this.ctx.moveTo(0, this.height);

      for (let x = 0; x <= this.width; x += 4) {
        const y = baseY + yOffset + this.getWaveOffset(x, baseY, layer);
        this.ctx.lineTo(x, y);
      }

      this.ctx.lineTo(this.width, this.height);
      this.ctx.closePath();

      const gradient = this.ctx.createLinearGradient(0, baseY - 60, 0, this.height);
      gradient.addColorStop(0, `hsla(${hue}, 75%, 55%, ${alpha})`);
      gradient.addColorStop(1, `hsla(${hue}, 60%, 35%, ${alpha * 0.3})`);
      this.ctx.fillStyle = gradient;
      this.ctx.fill();
    }

    this.ripples = this.ripples.filter((r) => {
      r.radius += 3.5;
      r.strength -= this.rippleDecay;
      return r.strength > 0.05;
    });

    this.applyVars();
  }

  private resizeCanvas() {
    if (!this.sceneEl || !this.canvasEl || !this.ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.width = this.sceneEl.clientWidth;
    this.height = this.sceneEl.clientHeight;
    if (this.width === 0 || this.height === 0) return;

    this.canvasEl.width = Math.round(this.width * dpr);
    this.canvasEl.height = Math.round(this.height * dpr);
    this.canvasEl.style.width = `${this.width}px`;
    this.canvasEl.style.height = `${this.height}px`;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  private applyVars() {
    if (!this.sceneEl) return;
    this.sceneEl.style.setProperty('--wave-count', String(this.waveCount));
    this.sceneEl.style.setProperty('--ripples', String(this.ripples.length));
  }

  drawDebug({ ctx, width, height }: { ctx: CanvasRenderingContext2D; width: number; height: number }) {
    ctx.clearRect(0, 0, width, height);
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.35)';
    ctx.setLineDash([4, 6]);
    ctx.beginPath();
    ctx.moveTo(0, height * 0.55);
    ctx.lineTo(width, height * 0.55);
    ctx.stroke();
    ctx.setLineDash([]);

    this.ripples.forEach((r) => {
      ctx.beginPath();
      ctx.strokeStyle = `rgba(56, 189, 248, ${r.strength * 0.4})`;
      ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
      ctx.stroke();
    });
  }
}
