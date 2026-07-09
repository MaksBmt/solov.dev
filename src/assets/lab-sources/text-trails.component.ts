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
 * Text Trails — THE.LAB / Typography.
 *
 * Canvas 2D: буквы-частицы следуют за курсором
 * и растворяются через destination-out fade.
 */
const MAX_GLYPHS = 90;
const TRAIL_FADE = 0.055;
const SPAWN_GAP = 14;
const POSITION_LERP = 0.35;
const LIFE_DECAY = 0.018;
const FONT_SIZE = 22;
const GLYPHS = 'TYPELABαβ∞';

interface GlyphParticle {
  x: number;
  y: number;
  char: string;
  size: number;
  life: number;
  rotation: number;
  hue: number;
}

@Component({
  selector: 'app-text-trails',
  standalone: true,
  imports: [CommonModule, LabDemoLayoutComponent],
  styleUrls: ['./text-trails.component.scss'],
  templateUrl: './text-trails.component.html',
  encapsulation: ViewEncapsulation.None,
})
export class TextTrailsComponent implements AfterViewInit, OnDestroy {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly ngZone = inject(NgZone);

  @ViewChild('sceneHost') sceneHostRef!: ElementRef<HTMLElement>;

  trailFade = TRAIL_FADE;
  spawnGap = SPAWN_GAP;
  fontSize = FONT_SIZE;
  lifeDecay = LIFE_DECAY;

  private sceneEl: HTMLElement | null = null;
  private trailsEl: HTMLElement | null = null;
  private canvasEl: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private particles: GlyphParticle[] = [];
  private pointer: { x: number; y: number } | null = null;
  private emit = { x: 0, y: 0 };
  private emitReady = false;
  private lastSpawn: { x: number; y: number } | null = null;
  private rafId: number | null = null;
  private resizeObserver: ResizeObserver | null = null;
  private reducedMotion = false;
  private initialized = false;
  private readonly boundOnPointerMove = (e: PointerEvent) => this.onPointerMove(e);
  private readonly boundOnPointerLeave = () => this.onPointerLeave();

  ngAfterViewInit() {
    if (!isPlatformBrowser(this.platformId)) return;
    this.scheduleInit();
  }

  ngOnDestroy() {
    if (!isPlatformBrowser(this.platformId)) return;
    if (this.rafId !== null) cancelAnimationFrame(this.rafId);
    this.resizeObserver?.disconnect();
    this.sceneEl?.removeEventListener('pointermove', this.boundOnPointerMove);
    this.sceneEl?.removeEventListener('pointerleave', this.boundOnPointerLeave);
  }

  private scheduleInit(attempt = 0) {
    if (this.initScene() || attempt >= 30) return;
    requestAnimationFrame(() => this.scheduleInit(attempt + 1));
  }

  private initScene(): boolean {
    if (this.initialized) return true;

    this.sceneEl = this.sceneHostRef?.nativeElement ?? null;
    this.trailsEl = this.sceneEl?.querySelector<HTMLElement>('.js-text-trails') ?? null;
    this.canvasEl = this.sceneEl?.querySelector<HTMLCanvasElement>('.js-text-trails-canvas') ?? null;
    this.ctx = this.canvasEl?.getContext('2d', { alpha: true }) ?? null;

    if (!this.sceneEl || !this.trailsEl || !this.canvasEl || !this.ctx) return false;
    if (this.sceneEl.clientWidth === 0) return false;

    this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.resizeCanvas();
    this.reset(false);

    this.resizeObserver = new ResizeObserver(() => this.resizeCanvas());
    this.resizeObserver.observe(this.sceneEl);

    this.ngZone.runOutsideAngular(() => {
      this.sceneEl!.addEventListener('pointermove', this.boundOnPointerMove, { passive: true });
      this.sceneEl!.addEventListener('pointerleave', this.boundOnPointerLeave);
      const loop = () => {
        this.tick();
        this.rafId = requestAnimationFrame(loop);
      };
      this.rafId = requestAnimationFrame(loop);
    });

    this.initialized = true;
    return true;
  }

  onPointerMove(event: PointerEvent) {
    if (!this.sceneEl || this.reducedMotion) return;
    const x = event.offsetX;
    const y = event.offsetY;
    this.pointer = { x, y };
    if (!this.emitReady) {
      this.emit.x = x;
      this.emit.y = y;
      this.emitReady = true;
    }
  }

  onPointerLeave() {
    this.pointer = null;
    this.lastSpawn = null;
    this.emitReady = false;
  }

  reset(clear = true) {
    this.trailFade = TRAIL_FADE;
    this.spawnGap = SPAWN_GAP;
    this.fontSize = FONT_SIZE;
    this.lifeDecay = LIFE_DECAY;
    this.pointer = null;
    this.lastSpawn = null;
    this.emitReady = false;
    this.particles = [];

    if (clear && this.ctx && this.canvasEl) {
      this.ctx.clearRect(0, 0, this.canvasEl.width, this.canvasEl.height);
    }

    this.applyVars();
  }

  onParamChange(detail: { id: string; value: number }) {
    if (detail.id === 'trailFade') this.trailFade = detail.value;
    if (detail.id === 'spawnGap') this.spawnGap = detail.value;
    if (detail.id === 'fontSize') this.fontSize = detail.value;
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

    if (this.pointer) {
      this.emit.x += (this.pointer.x - this.emit.x) * POSITION_LERP;
      this.emit.y += (this.pointer.y - this.emit.y) * POSITION_LERP;
      this.emitGlyphs(this.emit.x, this.emit.y);
    }

    let write = 0;
    for (let i = 0; i < this.particles.length; i += 1) {
      const p = this.particles[i];
      p.life -= this.lifeDecay;
      if (p.life > 0) {
        this.particles[write] = p;
        write += 1;
        this.drawGlyph(p);
      }
    }
    this.particles.length = write;
    this.applyVars();
  }

  private emitGlyphs(x: number, y: number) {
    if (!this.lastSpawn) {
      this.spawnGlyph(x, y);
      return;
    }

    const dx = x - this.lastSpawn.x;
    const dy = y - this.lastSpawn.y;
    const dist = Math.hypot(dx, dy);
    if (dist < this.spawnGap) return;

    const steps = Math.min(3, Math.max(1, Math.floor(dist / this.spawnGap)));
    for (let i = 1; i <= steps; i += 1) {
      const t = i / steps;
      this.spawnGlyph(this.lastSpawn.x + dx * t, this.lastSpawn.y + dy * t);
    }
  }

  private spawnGlyph(x: number, y: number) {
    if (this.particles.length >= MAX_GLYPHS) this.particles.shift();

    this.particles.push({
      x,
      y,
      char: GLYPHS[Math.floor(Math.random() * GLYPHS.length)],
      size: this.fontSize * (0.85 + Math.random() * 0.35),
      life: 1,
      rotation: (Math.random() - 0.5) * 0.8,
      hue: 32 + Math.random() * 280,
    });
    this.lastSpawn = { x, y };
  }

  private drawGlyph(p: GlyphParticle) {
    if (!this.ctx) return;

    this.ctx.save();
    this.ctx.translate(p.x, p.y);
    this.ctx.rotate(p.rotation * p.life);
    this.ctx.font = `600 ${p.size}px "Roboto Flex", system-ui, sans-serif`;
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillStyle = `hsla(${p.hue}, 85%, 62%, ${p.life * 0.55})`;
    this.ctx.shadowColor = `hsla(${p.hue}, 90%, 55%, ${p.life * 0.35})`;
    this.ctx.shadowBlur = 12;
    this.ctx.fillText(p.char, 0, 0);
    this.ctx.restore();
  }

  private resizeCanvas() {
    if (!this.sceneEl || !this.canvasEl || !this.ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = this.sceneEl.clientWidth;
    const h = this.sceneEl.clientHeight;
    if (w === 0 || h === 0) return;

    this.canvasEl.width = Math.round(w * dpr);
    this.canvasEl.height = Math.round(h * dpr);
    this.canvasEl.style.width = `${w}px`;
    this.canvasEl.style.height = `${h}px`;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  private applyVars() {
    if (!this.trailsEl) return;
    this.trailsEl.style.setProperty('--glyph-count', String(this.particles.length));
  }

  drawDebug({ ctx, width, height }: { ctx: CanvasRenderingContext2D; width: number; height: number }) {
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = 'rgba(253, 186, 116, 0.9)';
    ctx.font = '11px monospace';
    ctx.fillText(`glyphs: ${this.particles.length}`, 12, 18);
  }
}
