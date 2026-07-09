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
 * Particles — THE.LAB / Backgrounds.
 *
 * Сеть частиц на Canvas 2D: курсор создаёт поле отталкивания,
 * близкие точки соединяются линиями — «constellation» фон.
 */
const PARTICLE_COUNT = 90;
const LINK_DISTANCE = 120;
const REPULSION_RADIUS = 140;
const REPULSION_FORCE = 0.85;
const DRIFT_SPEED = 0.35;
const LINK_OPACITY = 0.45;

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  hue: number;
}

@Component({
  selector: 'app-particles',
  standalone: true,
  imports: [CommonModule, LabDemoLayoutComponent],
  styleUrls: ['./particles.component.scss'],
  templateUrl: './particles.component.html',
  encapsulation: ViewEncapsulation.None,
})
export class ParticlesComponent implements AfterViewInit, OnDestroy {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly ngZone = inject(NgZone);

  @ViewChild('sceneHost') sceneHostRef!: ElementRef<HTMLElement>;

  particleCount = PARTICLE_COUNT;
  linkDistance = LINK_DISTANCE;
  repulsionRadius = REPULSION_RADIUS;
  repulsionForce = REPULSION_FORCE;
  driftSpeed = DRIFT_SPEED;
  linkOpacity = LINK_OPACITY;

  private sceneEl: HTMLElement | null = null;
  private canvasEl: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private particles: Particle[] = [];
  private pointer = { x: -999, y: -999, active: false };
  private rafId: number | null = null;
  private resizeObserver: ResizeObserver | null = null;
  private width = 0;
  private height = 0;
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
    this.particleCount = PARTICLE_COUNT;
    this.linkDistance = LINK_DISTANCE;
    this.repulsionRadius = REPULSION_RADIUS;
    this.repulsionForce = REPULSION_FORCE;
    this.driftSpeed = DRIFT_SPEED;
    this.linkOpacity = LINK_OPACITY;
    this.spawnParticles();
    this.applyVars();
  }

  onParamChange(detail: { id: string; value: number }) {
    if (detail.id === 'particleCount') {
      this.particleCount = Math.round(detail.value);
      this.spawnParticles();
    }
    if (detail.id === 'linkDistance') this.linkDistance = detail.value;
    if (detail.id === 'repulsionRadius') this.repulsionRadius = detail.value;
    if (detail.id === 'repulsionForce') this.repulsionForce = detail.value;
    if (detail.id === 'driftSpeed') this.driftSpeed = detail.value;
    if (detail.id === 'linkOpacity') this.linkOpacity = detail.value;
  }

  private initScene() {
    this.sceneEl = this.sceneHostRef?.nativeElement ?? null;
    this.canvasEl = this.sceneEl?.querySelector<HTMLCanvasElement>('.js-particles-canvas') ?? null;
    this.ctx = this.canvasEl?.getContext('2d', { alpha: true }) ?? null;
    if (!this.sceneEl || !this.canvasEl || !this.ctx) return;

    this.resizeCanvas();
    this.spawnParticles();
    this.applyVars();

    this.resizeObserver = new ResizeObserver(() => {
      this.resizeCanvas();
      this.spawnParticles();
    });
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

  private spawnParticles() {
    this.particles = [];
    for (let i = 0; i < this.particleCount; i += 1) {
      this.particles.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        vx: (Math.random() - 0.5) * this.driftSpeed,
        vy: (Math.random() - 0.5) * this.driftSpeed,
        size: 1.2 + Math.random() * 2.2,
        hue: 30 + Math.random() * 40,
      });
    }
  }

  private onPointerMove(event: PointerEvent) {
    if (!this.sceneEl) return;
    const rect = this.sceneEl.getBoundingClientRect();
    this.pointer.x = event.clientX - rect.left;
    this.pointer.y = event.clientY - rect.top;
    this.pointer.active = true;
  }

  private onPointerLeave() {
    this.pointer.active = false;
    this.pointer.x = -999;
    this.pointer.y = -999;
  }

  private tick() {
    if (!this.ctx) return;

    this.ctx.clearRect(0, 0, this.width, this.height);

    for (const p of this.particles) {
      if (this.pointer.active) {
        const dx = p.x - this.pointer.x;
        const dy = p.y - this.pointer.y;
        const dist = Math.hypot(dx, dy);
        if (dist < this.repulsionRadius && dist > 0.1) {
          const force = (1 - dist / this.repulsionRadius) * this.repulsionForce;
          p.vx += (dx / dist) * force * 0.6;
          p.vy += (dy / dist) * force * 0.6;
        }
      }

      p.vx *= 0.98;
      p.vy *= 0.98;
      p.vx += (Math.random() - 0.5) * 0.02 * this.driftSpeed;
      p.vy += (Math.random() - 0.5) * 0.02 * this.driftSpeed;
      p.x += p.vx;
      p.y += p.vy;

      if (p.x < 0) { p.x = 0; p.vx *= -1; }
      if (p.x > this.width) { p.x = this.width; p.vx *= -1; }
      if (p.y < 0) { p.y = 0; p.vy *= -1; }
      if (p.y > this.height) { p.y = this.height; p.vy *= -1; }
    }

    for (let i = 0; i < this.particles.length; i += 1) {
      for (let j = i + 1; j < this.particles.length; j += 1) {
        const a = this.particles[i];
        const b = this.particles[j];
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const dist = Math.hypot(dx, dy);
        if (dist > this.linkDistance) continue;

        const alpha = (1 - dist / this.linkDistance) * this.linkOpacity;
        this.ctx.beginPath();
        this.ctx.strokeStyle = `rgba(245, 158, 11, ${alpha})`;
        this.ctx.lineWidth = 0.8;
        this.ctx.moveTo(a.x, a.y);
        this.ctx.lineTo(b.x, b.y);
        this.ctx.stroke();
      }
    }

    for (const p of this.particles) {
      const gradient = this.ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 3);
      gradient.addColorStop(0, `hsla(${p.hue}, 85%, 62%, 0.9)`);
      gradient.addColorStop(1, `hsla(${p.hue}, 85%, 62%, 0)`);
      this.ctx.fillStyle = gradient;
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.size * 2.5, 0, Math.PI * 2);
      this.ctx.fill();
    }

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
    this.sceneEl.style.setProperty('--particles', String(this.particles.length));
    this.sceneEl.style.setProperty('--link-distance', String(Math.round(this.linkDistance)));
  }

  drawDebug({ ctx, width, height }: { ctx: CanvasRenderingContext2D; width: number; height: number }) {
    ctx.clearRect(0, 0, width, height);
    if (!this.pointer.active) return;

    ctx.beginPath();
    ctx.setLineDash([4, 6]);
    ctx.strokeStyle = 'rgba(245, 158, 11, 0.35)';
    ctx.arc(this.pointer.x, this.pointer.y, this.repulsionRadius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
  }
}
