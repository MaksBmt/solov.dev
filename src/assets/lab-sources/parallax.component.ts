import {
  Component,
  AfterViewInit,
  OnDestroy,
  PLATFORM_ID,
  ViewChild,
  ElementRef,
  inject,
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { LabDemoLayoutComponent } from '../../../shell/lab-demo-layout/lab-demo-layout.component';

/**
 * Parallax — THE.LAB / Scroll.
 *
 * Sticky-viewport + progress-based смещение: слои двигаются
 * пропорционально scroll progress, но не более TRAVEL_LIMIT viewport.
 */
const FAR_SPEED = 0.3;
const MID_SPEED = 0.55;
const NEAR_SPEED = 0.78;
const FG_SPEED = 1;
const SCENE_HEIGHT = 1150;
const TRAVEL_LIMIT = 0.14;

const DEBUG_STROKE = 'rgba(245, 158, 11, 0.55)';
const DEBUG_SOFT = 'rgba(245, 158, 11, 0.22)';

interface ParallaxLayer {
  key: 'far' | 'mid' | 'near' | 'fg';
  element: HTMLElement;
  speed: number;
  offsetY: number;
}

@Component({
  selector: 'app-parallax',
  standalone: true,
  imports: [CommonModule, LabDemoLayoutComponent],
  styleUrls: ['./parallax.component.scss'],
  templateUrl: './parallax.component.html',
})
export class ParallaxComponent implements AfterViewInit, OnDestroy {
  private readonly platformId = inject(PLATFORM_ID);

  @ViewChild('scrollHost') scrollHostRef!: ElementRef<HTMLElement>;
  @ViewChild('varsHost') varsHostRef!: ElementRef<HTMLElement>;

  farSpeed = FAR_SPEED;
  midSpeed = MID_SPEED;
  nearSpeed = NEAR_SPEED;
  fgSpeed = FG_SPEED;
  travelLimit = TRAVEL_LIMIT;
  sceneHeight = SCENE_HEIGHT;

  scrollProgress = 0;

  private scrollEl: HTMLElement | null = null;
  private varsEl: HTMLElement | null = null;
  private layers: ParallaxLayer[] = [];
  private rafId: number | null = null;
  private scrollScheduled = false;
  private reducedMotion = false;
  private resizeObserver: ResizeObserver | null = null;

  private readonly boundOnScroll = () => this.scheduleUpdate();

  ngAfterViewInit() {
    if (!isPlatformBrowser(this.platformId)) return;

    this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.scrollEl = this.scrollHostRef?.nativeElement ?? null;
    this.varsEl = this.varsHostRef?.nativeElement ?? null;

    if (!this.scrollEl) return;

    this.collectLayers();
    this.updateViewportHeight();
    this.applyLayoutVars();
    this.scrollEl.addEventListener('scroll', this.boundOnScroll, { passive: true });

    this.resizeObserver = new ResizeObserver(() => {
      this.updateViewportHeight();
      this.updateParallax();
    });
    this.resizeObserver.observe(this.scrollEl);

    this.updateParallax();
  }

  ngOnDestroy() {
    if (!isPlatformBrowser(this.platformId)) return;

    if (this.rafId !== null) cancelAnimationFrame(this.rafId);
    this.resizeObserver?.disconnect();
    this.scrollEl?.removeEventListener('scroll', this.boundOnScroll);
  }

  reset() {
    this.farSpeed = FAR_SPEED;
    this.midSpeed = MID_SPEED;
    this.nearSpeed = NEAR_SPEED;
    this.fgSpeed = FG_SPEED;
    this.travelLimit = TRAVEL_LIMIT;
    this.sceneHeight = SCENE_HEIGHT;

    queueMicrotask(() => {
      this.collectLayers();
      this.updateViewportHeight();
      this.applyLayoutVars();
      if (this.scrollEl) this.scrollEl.scrollTop = 0;
      this.updateParallax();
    });
  }

  onParamChange(detail: { id: string; value: number; silent?: boolean }) {
    if (detail.id === 'farSpeed') this.farSpeed = detail.value;
    else if (detail.id === 'midSpeed') this.midSpeed = detail.value;
    else if (detail.id === 'nearSpeed') this.nearSpeed = detail.value;
    else if (detail.id === 'fgSpeed') this.fgSpeed = detail.value;
    else if (detail.id === 'travelLimit') this.travelLimit = detail.value;
    else if (detail.id === 'sceneHeight') this.sceneHeight = detail.value;

    this.syncLayerSpeeds();
    this.applyLayoutVars();
    this.updateParallax();
  }

  private collectLayers() {
    if (!this.scrollEl) {
      this.layers = [];
      return;
    }

    const speedMap: Record<string, number> = {
      far: this.farSpeed,
      mid: this.midSpeed,
      near: this.nearSpeed,
      fg: this.fgSpeed,
    };

    this.layers = Array.from(this.scrollEl.querySelectorAll<HTMLElement>('.js-parallax-layer')).map((element) => {
      const key = (element.dataset['layer'] ?? 'far') as ParallaxLayer['key'];
      return {
        key,
        element,
        speed: speedMap[key] ?? this.farSpeed,
        offsetY: 0,
      };
    });
  }

  private syncLayerSpeeds() {
    const speedMap: Record<ParallaxLayer['key'], number> = {
      far: this.farSpeed,
      mid: this.midSpeed,
      near: this.nearSpeed,
      fg: this.fgSpeed,
    };

    this.layers.forEach((layer) => {
      layer.speed = speedMap[layer.key];
    });
  }

  private applyLayoutVars() {
    if (!this.scrollEl) return;
    this.scrollEl.style.setProperty('--scene-height', `${this.sceneHeight}px`);
    this.updateViewportHeight();
  }

  private updateViewportHeight() {
    if (!this.scrollEl) return;
    this.scrollEl.style.setProperty('--viewport-h', `${this.scrollEl.clientHeight}px`);
  }

  private scheduleUpdate() {
    if (this.scrollScheduled) return;
    this.scrollScheduled = true;
    this.rafId = requestAnimationFrame(() => {
      this.scrollScheduled = false;
      this.rafId = null;
      this.updateParallax();
    });
  }

  private getSpeedForLayer(key: ParallaxLayer['key']): number {
    if (key === 'far') return this.farSpeed;
    if (key === 'mid') return this.midSpeed;
    if (key === 'near') return this.nearSpeed;
    return this.fgSpeed;
  }

  private updateParallax() {
    if (!this.scrollEl || this.layers.length === 0) return;

    const scrollTop = this.scrollEl.scrollTop;
    const viewportH = this.scrollEl.clientHeight;
    const maxScroll = Math.max(1, this.scrollEl.scrollHeight - viewportH);
    const progress = scrollTop / maxScroll;
    this.scrollProgress = progress;

    const maxTravel = viewportH * this.travelLimit;
    const fgNorm = Math.max(0.01, this.fgSpeed);
    const offsets: Record<string, number> = {};

    this.layers.forEach((layer) => {
      const speed = this.getSpeedForLayer(layer.key);
      const ratio = speed / fgNorm;
      const offsetY = this.reducedMotion ? 0 : -progress * maxTravel * ratio;
      layer.offsetY = offsetY;
      layer.element.style.transform = offsetY === 0 ? '' : `translate3d(0, ${offsetY.toFixed(2)}px, 0)`;
      offsets[layer.key] = offsetY;
    });

    if (this.varsEl) {
      this.varsEl.style.setProperty('--scroll-progress', this.scrollProgress.toFixed(3));
      this.varsEl.style.setProperty('--layer-far-y', `${(offsets['far'] ?? 0).toFixed(1)}px`);
      this.varsEl.style.setProperty('--layer-mid-y', `${(offsets['mid'] ?? 0).toFixed(1)}px`);
      this.varsEl.style.setProperty('--layer-near-y', `${(offsets['near'] ?? 0).toFixed(1)}px`);
      this.varsEl.style.setProperty('--layer-fg-y', `${(offsets['fg'] ?? 0).toFixed(1)}px`);
    }
  }

  drawDebug({
    ctx,
    width,
    height,
  }: {
    ctx: CanvasRenderingContext2D;
    width: number;
    height: number;
    pointer: { x: number; y: number } | null;
  }) {
    ctx.clearRect(0, 0, width, height);
    if (!this.scrollEl) return;

    const scrollRect = this.scrollEl.getBoundingClientRect();

    this.layers.forEach((layer) => {
      const rect = layer.element.getBoundingClientRect();
      const x = rect.left - scrollRect.left;
      const y = rect.top - scrollRect.top;

      ctx.strokeStyle = DEBUG_SOFT;
      ctx.lineWidth = 1;
      ctx.strokeRect(x, y, rect.width, rect.height);

      ctx.fillStyle = DEBUG_STROKE;
      ctx.font = '10px monospace';
      ctx.fillText(`${layer.key} · ${layer.speed.toFixed(2)}x · y ${layer.offsetY.toFixed(0)}`, x + 8, y + 16);

      ctx.beginPath();
      ctx.strokeStyle = DEBUG_STROKE;
      ctx.lineWidth = 1.5;
      ctx.moveTo(x + rect.width / 2, y + rect.height / 2);
      ctx.lineTo(x + rect.width / 2, y + rect.height / 2 + layer.offsetY * 0.25);
      ctx.stroke();
    });

    const barX = width - 18;
    const barTop = 16;
    const barHeight = height - 32;
    ctx.fillStyle = 'rgba(244, 244, 245, 0.08)';
    ctx.fillRect(barX, barTop, 6, barHeight);
    ctx.fillStyle = DEBUG_STROKE;
    ctx.fillRect(barX, barTop + barHeight * (1 - this.scrollProgress), 6, barHeight * this.scrollProgress);
  }
}
