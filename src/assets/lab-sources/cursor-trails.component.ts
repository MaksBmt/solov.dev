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
 * Cursor Trails — THE.LAB / Cursor.
 *
 * Canvas 2D: частицы рисуются при спавне, каждый кадр холст
 * слегка «стирается» через destination-out — получается шлейф
 * без перерисовки всего пула частиц.
 */
const MAX_PARTICLES = 120;
const MAX_SPAWN_STEPS = 20;
const TRAIL_FADE = 0.07;
const PARTICLE_SIZE = 5;
const SPAWN_GAP = 6;
const LIFE_DECAY = 0.028;
const SCENE_INIT_MAX_ATTEMPTS = 30;

interface TrailParticle {
  x: number;
  y: number;
  size: number;
  life: number;
}

@Component({
  selector: 'app-cursor-trails',
  standalone: true,
  imports: [CommonModule, LabDemoLayoutComponent],
  styleUrls: ['./cursor-trails.component.scss'],
  templateUrl: './cursor-trails.component.html',
  encapsulation: ViewEncapsulation.None,
})
export class CursorTrailsComponent implements AfterViewInit, OnDestroy {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly ngZone = inject(NgZone);

  @ViewChild('sceneHost') sceneHostRef!: ElementRef<HTMLElement>;

  trailFade = TRAIL_FADE;
  particleSize = PARTICLE_SIZE;
  spawnGap = SPAWN_GAP;
  lifeDecay = LIFE_DECAY;

  private sceneEl: HTMLElement | null = null;
  private trailsEl: HTMLElement | null = null;
  private canvasEl: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private particles: TrailParticle[] = [];
  private pointer: { x: number; y: number } | null = null;
  private lastSpawn: { x: number; y: number } | null = null;
  private rafId: number | null = null;
  private resizeObserver: ResizeObserver | null = null;
  private resizeRafId: number | null = null;
  private reducedMotion = false;
  private initialized = false;
  private lastParticleCount = -1;
  private loopFn: (() => void) | null = null;
  private readonly boundOnPointerMove = (e: PointerEvent) => this.onPointerMove(e);
  private readonly boundOnPointerLeave = () => this.onPointerLeave();

  ngAfterViewInit() {
    if (!isPlatformBrowser(this.platformId)) return;
    this.scheduleSceneInit();
  }

  ngOnDestroy() {
    if (!isPlatformBrowser(this.platformId)) return;

    if (this.rafId !== null) cancelAnimationFrame(this.rafId);
    if (this.resizeRafId !== null) cancelAnimationFrame(this.resizeRafId);
    this.resizeObserver?.disconnect();

    if (!this.sceneEl) return;

    this.sceneEl.removeEventListener('pointermove', this.boundOnPointerMove);
    this.sceneEl.removeEventListener('pointerdown', this.boundOnPointerMove);
    this.sceneEl.removeEventListener('pointerleave', this.boundOnPointerLeave);
  }

  private scheduleSceneInit(attempt = 0) {
    if (!isPlatformBrowser(this.platformId)) return;
    if (this.initScene() || attempt >= SCENE_INIT_MAX_ATTEMPTS) return;
    requestAnimationFrame(() => this.scheduleSceneInit(attempt + 1));
  }

  private initScene(): boolean {
    if (this.initialized) return true;

    this.sceneEl = this.sceneHostRef?.nativeElement ?? null;
    this.trailsEl = this.sceneEl?.querySelector<HTMLElement>('.js-trails') ?? null;
    this.canvasEl = this.sceneEl?.querySelector<HTMLCanvasElement>('.js-trails-canvas') ?? null;
    this.ctx = this.canvasEl?.getContext('2d', { alpha: true }) ?? null;

    if (!this.sceneEl || !this.trailsEl || !this.canvasEl || !this.ctx) return false;
    if (this.sceneEl.clientWidth === 0 || this.sceneEl.clientHeight === 0) return false;

    this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.resizeCanvas();
    this.reset(false);

    this.resizeObserver = new ResizeObserver(() => {
      if (this.resizeRafId !== null) return;
      this.resizeRafId = requestAnimationFrame(() => {
        this.resizeRafId = null;
        this.resizeCanvas();
      });
    });
    this.resizeObserver.observe(this.sceneEl);

    this.ngZone.runOutsideAngular(() => {
      this.sceneEl!.addEventListener('pointermove', this.boundOnPointerMove);
      this.sceneEl!.addEventListener('pointerdown', this.boundOnPointerMove);
      this.sceneEl!.addEventListener('pointerleave', this.boundOnPointerLeave);

      this.loopFn = () => {
        this.tick();
        this.rafId = requestAnimationFrame(this.loopFn!);
      };
      this.rafId = requestAnimationFrame(this.loopFn);
    });

    this.initialized = true;
    return true;
  }

  onPointerMove(event: PointerEvent) {
    if (!this.sceneEl || !this.ctx || this.reducedMotion) return;

    const x = event.offsetX;
    const y = event.offsetY;

    this.pointer = { x, y };
    this.spawnAlongPath(x, y);
  }

  onPointerLeave() {
    this.pointer = null;
    this.lastSpawn = null;
  }

  reset(clearCanvas = true) {
    this.pointer = null;
    this.lastSpawn = null;
    this.trailFade = TRAIL_FADE;
    this.particleSize = PARTICLE_SIZE;
    this.spawnGap = SPAWN_GAP;
    this.lifeDecay = LIFE_DECAY;
    this.particles = [];

    if (clearCanvas && this.ctx && this.canvasEl) {
      this.ctx.clearRect(0, 0, this.canvasEl.width, this.canvasEl.height);
    }

    this.lastParticleCount = -1;
    this.applyVars();
  }

  onParamChange(detail: { id: string; value: number }) {
    if (detail.id === 'trailFade') this.trailFade = detail.value;
    if (detail.id === 'particleSize') this.particleSize = detail.value;
    if (detail.id === 'spawnGap') this.spawnGap = detail.value;
    if (detail.id === 'lifeDecay') this.lifeDecay = detail.value;
  }

  private tick() {
    if (!this.ctx || !this.canvasEl) return;

    const width = this.canvasEl.clientWidth;
    const height = this.canvasEl.clientHeight;

    if (!this.reducedMotion) {
      this.ctx.globalCompositeOperation = 'destination-out';
      this.ctx.fillStyle = `rgba(0, 0, 0, ${this.trailFade})`;
      this.ctx.fillRect(0, 0, width, height);
      this.ctx.globalCompositeOperation = 'source-over';
    }

    let writeIndex = 0;
    for (let i = 0; i < this.particles.length; i += 1) {
      const particle = this.particles[i];
      particle.life -= this.lifeDecay;
      if (particle.life > 0) {
        this.particles[writeIndex] = particle;
        writeIndex += 1;
      }
    }
    this.particles.length = writeIndex;

    this.applyVars();
  }

  private spawnAlongPath(x: number, y: number) {
    if (!this.lastSpawn) {
      this.spawnParticle(x, y);
      return;
    }

    const dx = x - this.lastSpawn.x;
    const dy = y - this.lastSpawn.y;
    const distance = Math.hypot(dx, dy);

    if (distance < this.spawnGap) return;

    const steps = Math.min(MAX_SPAWN_STEPS, Math.max(1, Math.floor(distance / this.spawnGap)));
    for (let i = 1; i <= steps; i += 1) {
      const t = i / steps;
      this.spawnParticle(this.lastSpawn.x + dx * t, this.lastSpawn.y + dy * t);
    }
  }

  private spawnParticle(x: number, y: number) {
    if (this.particles.length >= MAX_PARTICLES) {
      this.particles.shift();
    }

    const size = this.particleSize * (0.75 + Math.random() * 0.5);
    const particle: TrailParticle = { x, y, size, life: 1 };
    this.particles.push(particle);
    this.lastSpawn = { x, y };
    this.drawParticle(particle);
  }

  private drawParticle(particle: TrailParticle) {
    if (!this.ctx) return;

    const radius = particle.size;

    this.ctx.globalCompositeOperation = 'lighter';
    this.ctx.beginPath();
    this.ctx.arc(particle.x, particle.y, radius * 2, 0, Math.PI * 2);
    this.ctx.fillStyle = 'rgba(245, 158, 11, 0.16)';
    this.ctx.fill();

    this.ctx.beginPath();
    this.ctx.arc(particle.x, particle.y, radius, 0, Math.PI * 2);
    this.ctx.fillStyle = 'rgba(253, 186, 116, 0.92)';
    this.ctx.fill();
    this.ctx.globalCompositeOperation = 'source-over';
  }

  private resizeCanvas() {
    if (!this.sceneEl || !this.canvasEl || !this.ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const width = this.sceneEl.clientWidth;
    const height = this.sceneEl.clientHeight;

    if (width === 0 || height === 0) return;

    this.canvasEl.width = Math.round(width * dpr);
    this.canvasEl.height = Math.round(height * dpr);
    this.canvasEl.style.width = `${width}px`;
    this.canvasEl.style.height = `${height}px`;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  private applyVars() {
    if (!this.trailsEl) return;

    const count = this.particles.length;
    if (count === this.lastParticleCount) return;

    this.lastParticleCount = count;
    this.trailsEl.style.setProperty('--particles', String(count));
  }

  drawDebug({ ctx, width, height }: { ctx: CanvasRenderingContext2D; width: number; height: number }) {
    ctx.clearRect(0, 0, width, height);

    if (this.pointer) {
      ctx.beginPath();
      ctx.setLineDash([4, 6]);
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.35)';
      ctx.arc(this.pointer.x, this.pointer.y, this.spawnGap, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.strokeStyle = 'rgba(244, 244, 245, 0.6)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(this.pointer.x - 8, this.pointer.y);
      ctx.lineTo(this.pointer.x + 8, this.pointer.y);
      ctx.moveTo(this.pointer.x, this.pointer.y - 8);
      ctx.lineTo(this.pointer.x, this.pointer.y + 8);
      ctx.stroke();
    }

    this.particles.forEach((particle, index) => {
      if (index % 4 !== 0) return;

      ctx.beginPath();
      ctx.strokeStyle = `rgba(245, 158, 11, ${particle.life * 0.45})`;
      ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      ctx.stroke();
    });

    ctx.fillStyle = 'rgba(253, 186, 116, 0.9)';
    ctx.font = '11px monospace';
    ctx.fillText(`particles: ${this.particles.length}`, 12, 18);
  }
}
