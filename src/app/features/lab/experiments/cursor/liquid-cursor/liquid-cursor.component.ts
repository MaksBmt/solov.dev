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
 * Liquid Cursor — THE.LAB / Cursor.
 *
 * Цепочка из N частиц: голова догоняет указатель, каждая следующая
 * частица догоняет предыдущую (покадровая линейная интерполяция).
 * Частицы — DOM-элементы; «жидкое» слияние делает SVG-фильтр:
 * feGaussianBlur + feColorMatrix (gooey-эффект).
 */
const BLOB_COUNT = 14;
const HEAD_SIZE = 46;
const TAIL_SIZE = 8;
const HEAD_LERP = 0.35;
const TAIL_LERP = 0.32;
const SCENE_INIT_MAX_ATTEMPTS = 30;

interface LiquidBlob {
  element: HTMLElement;
  size: number;
  x: number;
  y: number;
}

@Component({
  selector: 'app-liquid-cursor',
  standalone: true,
  imports: [CommonModule, LabDemoLayoutComponent],
  styleUrls: ['./liquid-cursor.component.scss'],
  templateUrl: './liquid-cursor.component.html',
  encapsulation: ViewEncapsulation.None,
})
export class LiquidCursorComponent implements AfterViewInit, OnDestroy {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly ngZone = inject(NgZone);

  @ViewChild('sceneHost') sceneHostRef!: ElementRef<HTMLElement>;

  blobs: LiquidBlob[] = [];
  blurAmount = 12;
  headLerp = HEAD_LERP;
  tailLerp = TAIL_LERP;

  private sceneEl: HTMLElement | null = null;
  private liquidEl: HTMLElement | null = null;
  private fieldEl: HTMLElement | null = null;
  private blurNode: Element | null = null;
  private pointer: { x: number; y: number } | null = null;
  private rafId: number | null = null;
  private reducedMotion = false;
  private initialized = false;
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

    this.pointerBinding?.unbind();
    this.blobs.forEach((blob) => blob.element.remove());
    this.blobs = [];
  }

  private scheduleSceneInit(attempt = 0) {
    if (!isPlatformBrowser(this.platformId) || this.destroyed) return;
    if (this.initScene() || attempt >= SCENE_INIT_MAX_ATTEMPTS) return;
    this.initRafId = requestAnimationFrame(() => this.scheduleSceneInit(attempt + 1));
  }

  private initScene(): boolean {
    if (this.initialized) return true;

    this.sceneEl = this.sceneHostRef?.nativeElement ?? null;
    this.liquidEl = this.sceneEl?.querySelector<HTMLElement>('.js-liquid') ?? null;
    this.fieldEl = this.sceneEl?.querySelector<HTMLElement>('.js-liquid-field') ?? null;
    this.blurNode = this.sceneEl?.querySelector('#lab-goo feGaussianBlur') ?? null;

    if (!this.sceneEl || !this.liquidEl || !this.fieldEl) return false;
    if (this.sceneEl.clientWidth === 0 || this.sceneEl.clientHeight === 0) return false;

    this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.createBlobs();
    this.pointerBinding = bindScenePointer(this.sceneEl, {
      onMove: (e) => this.onPointerMove(e),
      onLeave: () => this.onPointerLeave(),
    });
    this.reset();

    this.initialized = true;
    this.ngZone.runOutsideAngular(() => {
      this.rafId = requestAnimationFrame(this.boundTick);
    });

    return true;
  }

  private createBlobs() {
    if (!this.fieldEl) return;

    this.blobs.forEach((blob) => blob.element.remove());
    this.blobs = [];

    for (let i = 0; i < BLOB_COUNT; i += 1) {
      const progress = i / (BLOB_COUNT - 1);
      const size = HEAD_SIZE - (HEAD_SIZE - TAIL_SIZE) * progress;

      const element = document.createElement('span');
      element.className = 'liquid__blob';
      element.style.width = `${size}px`;
      element.style.height = `${size}px`;
      this.fieldEl.appendChild(element);

      this.blobs.push({ element, size, x: 0, y: 0 });
    }
  }

  onPointerMove(event: PointerEvent) {
    if (!this.sceneEl) return;

    const rect = this.sceneEl.getBoundingClientRect();
    this.pointer = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
  }

  onPointerLeave() {
    this.pointer = null;
  }

  reset() {
    this.pointer = null;
    this.headLerp = HEAD_LERP;
    this.tailLerp = TAIL_LERP;
    this.blurAmount = 12;
    this.blurNode?.setAttribute('stdDeviation', String(this.blurAmount));

    const centerX = this.sceneEl ? this.sceneEl.clientWidth / 2 : 0;
    const centerY = this.sceneEl ? this.sceneEl.clientHeight / 2 : 0;

    this.blobs.forEach((blob) => {
      blob.x = centerX;
      blob.y = centerY;
      this.applyPosition(blob);
    });
    this.applyVars(centerX, centerY);
  }

  onParamChange(detail: { id: string; value: number }) {
    if (detail.id === 'headLerp') this.headLerp = detail.value;
    if (detail.id === 'tailLerp') this.tailLerp = detail.value;
    if (detail.id === 'blur') {
      this.blurAmount = detail.value;
      this.blurNode?.setAttribute('stdDeviation', String(detail.value));
    }
  }

  tick() {
    if (!this.blobs.length) return;

    const head = this.blobs[0];
    const target = this.pointer || { x: head.x, y: head.y };
    const headLerp = this.reducedMotion ? 1 : this.headLerp;
    const tailLerp = this.reducedMotion ? 1 : this.tailLerp;

    head.x += (target.x - head.x) * headLerp;
    head.y += (target.y - head.y) * headLerp;
    this.applyPosition(head);

    for (let i = 1; i < this.blobs.length; i += 1) {
      const blob = this.blobs[i];
      const leader = this.blobs[i - 1];
      blob.x += (leader.x - blob.x) * tailLerp;
      blob.y += (leader.y - blob.y) * tailLerp;
      this.applyPosition(blob);
    }

    this.applyVars(head.x, head.y);
    this.rafId = requestAnimationFrame(this.boundTick);
  }

  applyPosition(blob: LiquidBlob) {
    const offset = blob.size / 2;
    blob.element.style.transform =
      `translate3d(${(blob.x - offset).toFixed(1)}px, ${(blob.y - offset).toFixed(1)}px, 0)`;
  }

  applyVars(x: number, y: number) {
    if (!this.liquidEl) return;

    this.liquidEl.style.setProperty('--lx', `${x.toFixed(1)}px`);
    this.liquidEl.style.setProperty('--ly', `${y.toFixed(1)}px`);
  }

  drawDebug({ ctx, pointer }: { ctx: CanvasRenderingContext2D; pointer: { x: number; y: number } | null }) {
    if (!this.sceneEl) return;

    const width = this.sceneEl.clientWidth;
    const height = this.sceneEl.clientHeight;
    ctx.clearRect(0, 0, width, height);

    ctx.beginPath();
    ctx.strokeStyle = 'rgba(244, 244, 245, 0.4)';
    ctx.lineWidth = 1;
    this.blobs.forEach((blob, index) => {
      if (index === 0) ctx.moveTo(blob.x, blob.y);
      else ctx.lineTo(blob.x, blob.y);
    });
    ctx.stroke();

    this.blobs.forEach((blob, index) => {
      ctx.beginPath();
      ctx.setLineDash([3, 4]);
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.45)';
      ctx.arc(blob.x, blob.y, blob.size / 2, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = index === 0 ? 'rgba(253, 186, 116, 0.95)' : 'rgba(245, 158, 11, 0.6)';
      ctx.beginPath();
      ctx.arc(blob.x, blob.y, 2, 0, Math.PI * 2);
      ctx.fill();
    });

    if (this.pointer) {
      const head = this.blobs[0];
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(244, 244, 245, 0.3)';
      ctx.moveTo(head.x, head.y);
      ctx.lineTo(this.pointer.x, this.pointer.y);
      ctx.stroke();

      ctx.strokeStyle = 'rgba(244, 244, 245, 0.6)';
      ctx.beginPath();
      ctx.moveTo(this.pointer.x - 8, this.pointer.y);
      ctx.lineTo(this.pointer.x + 8, this.pointer.y);
      ctx.moveTo(this.pointer.x, this.pointer.y - 8);
      ctx.lineTo(this.pointer.x, this.pointer.y + 8);
      ctx.stroke();
    }
  }
}
