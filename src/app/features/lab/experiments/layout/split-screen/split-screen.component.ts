import { Component, AfterViewInit, OnDestroy, PLATFORM_ID, NgZone, ViewChild, ElementRef, inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { LabDemoLayoutComponent } from '../../../shell/lab-demo-layout/lab-demo-layout.component';

/**
 * Split Screen — THE.LAB / Layout.
 *
 * Перетаскиваемый разделитель: при отпускании snap к ближайшей точке
 * с пружинным overshoot и инерцией броска.
 */
const SPRING_STIFFNESS = 0.14;
const DAMPING = 0.68;
const MIN_SPLIT = 0.2;
const OVERSHOOT = 1.22;
const VELOCITY_SCALE = 0.12;

const DEBUG_STROKE = 'rgba(245, 158, 11, 0.55)';
const DEBUG_SOFT = 'rgba(245, 158, 11, 0.22)';

@Component({
  selector: 'app-split-screen',
  standalone: true,
  imports: [CommonModule, LabDemoLayoutComponent],
  styleUrls: ['./split-screen.component.scss'],
  templateUrl: './split-screen.component.html',
})
export class SplitScreenComponent implements AfterViewInit, OnDestroy {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly ngZone = inject(NgZone);

  @ViewChild('sceneHost') sceneHostRef!: ElementRef<HTMLElement>;
  @ViewChild('frameHost') frameHostRef!: ElementRef<HTMLElement>;

  springStiffness = SPRING_STIFFNESS;
  damping = DAMPING;
  minSplit = MIN_SPLIT;
  overshoot = OVERSHOOT;

  splitRatio = 0.5;
  displayRatio = 0.5;
  isDragging = false;

  private targetRatio = 0.5;
  private velRatio = 0;
  private dragVelocity = 0;
  private prevRatio = 0.5;
  private prevMoveTime = 0;
  private sceneEl: HTMLElement | null = null;
  private frameEl: HTMLElement | null = null;
  private dividerEl: HTMLElement | null = null;
  private rafId: number | null = null;
  private reducedMotion = false;
  private destroyed = false;
  private activePointerId: number | null = null;
  private readonly boundTick = () => this.tick();
  private readonly boundMove = (e: PointerEvent) => this.onPointerMove(e);
  private readonly boundUp = (e: PointerEvent) => this.onPointerUp(e);

  ngAfterViewInit() {
    if (!isPlatformBrowser(this.platformId)) return;

    this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.sceneEl = this.sceneHostRef?.nativeElement ?? null;
    this.frameEl = this.frameHostRef?.nativeElement ?? null;
    this.applyVars();

    this.ngZone.runOutsideAngular(() => {
      this.rafId = requestAnimationFrame(this.boundTick);
    });
  }

  ngOnDestroy() {
    this.destroyed = true;
    this.isDragging = false;

    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }

    if (isPlatformBrowser(this.platformId)) {
      this.releasePointerCaptureSafe();
      this.unbindDrag();
    }

    this.dividerEl = null;
    this.sceneEl = null;
    this.frameEl = null;
  }

  onDividerDown(event: PointerEvent) {
    event.preventDefault();
    this.isDragging = true;
    this.dividerEl = event.currentTarget as HTMLElement;
    this.velRatio = 0;
    this.dragVelocity = 0;
    this.prevMoveTime = 0;
    this.dividerEl.setPointerCapture(event.pointerId);
    this.activePointerId = event.pointerId;
    if (isPlatformBrowser(this.platformId)) {
      window.addEventListener('pointermove', this.boundMove);
      window.addEventListener('pointerup', this.boundUp);
      window.addEventListener('pointercancel', this.boundUp);
    }
    this.onPointerMove(event);
  }

  reset() {
    this.springStiffness = SPRING_STIFFNESS;
    this.damping = DAMPING;
    this.minSplit = MIN_SPLIT;
    this.overshoot = OVERSHOOT;
    this.splitRatio = 0.5;
    this.displayRatio = 0.5;
    this.targetRatio = 0.5;
    this.velRatio = 0;
    this.dragVelocity = 0;
    this.isDragging = false;
    this.unbindDrag();
    this.applyVars();
  }

  onParamChange(detail: { id: string; value: number }) {
    if (detail.id === 'springStiffness') this.springStiffness = detail.value;
    else if (detail.id === 'damping') this.damping = detail.value;
    else if (detail.id === 'minSplit') this.minSplit = detail.value;
    this.applyVars();
  }

  private onPointerMove(event: PointerEvent) {
    if (!this.isDragging || !this.frameEl) return;

    const ratio = this.ratioFromPointer(event.clientX);
    const now = performance.now();

    if (this.prevMoveTime > 0) {
      const dt = (now - this.prevMoveTime) / 1000;
      if (dt > 0) {
        const instant = (ratio - this.prevRatio) / dt;
        this.dragVelocity = this.dragVelocity * 0.55 + instant * 0.45;
      }
    }

    this.prevRatio = ratio;
    this.prevMoveTime = now;
    this.displayRatio = ratio;
    this.splitRatio = ratio;
    this.applyVars();
  }

  private onPointerUp(event: PointerEvent) {
    if (!this.isDragging) return;

    this.isDragging = false;
    this.targetRatio = this.nearestSnap(this.displayRatio);
    this.velRatio += this.dragVelocity * VELOCITY_SCALE;
    this.dragVelocity = 0;
    this.prevMoveTime = 0;
    this.unbindDrag();
    this.releasePointerCaptureSafe();
    this.activePointerId = null;
    this.dividerEl = null;
  }

  private ratioFromPointer(clientX: number): number {
    if (!this.frameEl) return this.displayRatio;

    const rect = this.frameEl.getBoundingClientRect();
    const maxSplit = 1 - this.minSplit;
    return Math.max(this.minSplit, Math.min(maxSplit, (clientX - rect.left) / rect.width));
  }

  private nearestSnap(ratio: number): number {
    const snaps = [this.minSplit, 0.5, 1 - this.minSplit];
    return snaps.reduce((best, snap) =>
      Math.abs(snap - ratio) < Math.abs(best - ratio) ? snap : best,
    );
  }

  private unbindDrag() {
    if (!isPlatformBrowser(this.platformId)) return;

    window.removeEventListener('pointermove', this.boundMove);
    window.removeEventListener('pointerup', this.boundUp);
    window.removeEventListener('pointercancel', this.boundUp);
  }

  private releasePointerCaptureSafe() {
    if (!isPlatformBrowser(this.platformId) || !this.dividerEl || this.activePointerId === null) return;

    try {
      if (this.dividerEl.isConnected && this.dividerEl.hasPointerCapture(this.activePointerId)) {
        this.dividerEl.releasePointerCapture(this.activePointerId);
      }
    } catch {
      // элемент уже уничтожен
    }
  }

  private applyVars() {
    if (this.destroyed) return;

    const el = this.sceneHostRef?.nativeElement;
    if (!el) return;
    el.style.setProperty('--split-ratio', String(this.displayRatio.toFixed(4)));
    el.style.setProperty('--split-target', String(this.targetRatio.toFixed(4)));
  }

  private tick() {
    if (this.destroyed) return;

    if (!this.isDragging && !this.reducedMotion) {
      const stiffness = this.springStiffness * this.overshoot;
      const force = (this.targetRatio - this.displayRatio) * stiffness;

      this.velRatio = (this.velRatio + force) * this.damping;
      this.displayRatio += this.velRatio;

      if (Math.abs(this.targetRatio - this.displayRatio) < 0.001 && Math.abs(this.velRatio) < 0.0004) {
        this.displayRatio = this.targetRatio;
        this.velRatio = 0;
      }
    } else if (!this.isDragging) {
      this.displayRatio = this.targetRatio;
      this.velRatio = 0;
    }

    this.splitRatio = this.displayRatio;
    this.applyVars();
    this.rafId = requestAnimationFrame(this.boundTick);
  }

  drawDebug({ ctx, width, height }: { ctx: CanvasRenderingContext2D; width: number; height: number }) {
    ctx.clearRect(0, 0, width, height);
    if (!this.sceneEl || !this.frameEl) return;

    const sceneRect = this.sceneEl.getBoundingClientRect();
    const frameRect = this.frameEl.getBoundingClientRect();
    const frameX = frameRect.left - sceneRect.left;
    const dividerX = frameX + this.displayRatio * frameRect.width;
    const targetX = frameX + this.targetRatio * frameRect.width;

    ctx.strokeStyle = DEBUG_SOFT;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(targetX, frameRect.top - sceneRect.top);
    ctx.lineTo(targetX, frameRect.top - sceneRect.top + frameRect.height);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.strokeStyle = DEBUG_STROKE;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(dividerX, frameRect.top - sceneRect.top);
    ctx.lineTo(dividerX, frameRect.top - sceneRect.top + frameRect.height);
    ctx.stroke();

    ctx.lineWidth = 1;
    ctx.strokeRect(frameX, frameRect.top - sceneRect.top, frameRect.width, frameRect.height);
  }
}
