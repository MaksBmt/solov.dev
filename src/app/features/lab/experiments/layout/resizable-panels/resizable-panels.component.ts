import { Component, AfterViewInit, OnDestroy, PLATFORM_ID, NgZone, ViewChild, ElementRef, inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { LabDemoLayoutComponent } from '../../../shell/lab-demo-layout/lab-demo-layout.component';

/**
 * Resizable Panels — THE.LAB / Layout.
 *
 * Три панели с drag-handles и spring physics ширины.
 */
const SPRING_STIFFNESS = 0.16;
const DAMPING = 0.74;
const MIN_PANEL = 15;

const DEBUG_STROKE = 'rgba(245, 158, 11, 0.55)';
const DEBUG_SOFT = 'rgba(245, 158, 11, 0.22)';

@Component({
  selector: 'app-resizable-panels',
  standalone: true,
  imports: [CommonModule, LabDemoLayoutComponent],
  styleUrls: ['./resizable-panels.component.scss'],
  templateUrl: './resizable-panels.component.html',
})
export class ResizablePanelsComponent implements AfterViewInit, OnDestroy {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly ngZone = inject(NgZone);

  @ViewChild('sceneHost') sceneHostRef!: ElementRef<HTMLElement>;

  springStiffness = SPRING_STIFFNESS;
  damping = DAMPING;
  minPanel = MIN_PANEL;

  panelA = 33;
  panelB = 34;
  panelC = 33;
  displayA = 33;
  displayB = 34;
  displayC = 33;

  private targetA = 33;
  private targetB = 34;
  private targetC = 33;
  private velA = 0;
  private velB = 0;
  private velC = 0;
  private draggingHandle: 1 | 2 | null = null;
  private sceneEl: HTMLElement | null = null;
  private rafId: number | null = null;
  private reducedMotion = false;
  private destroyed = false;
  private handleEl: HTMLElement | null = null;
  private activePointerId: number | null = null;
  private readonly boundTick = () => this.tick();
  private readonly boundMove = (e: PointerEvent) => this.onPointerMove(e);
  private readonly boundUp = () => this.onPointerUp();

  ngAfterViewInit() {
    if (!isPlatformBrowser(this.platformId)) return;

    this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.sceneEl = this.sceneHostRef?.nativeElement ?? null;
    this.applyVars();

    this.ngZone.runOutsideAngular(() => {
      this.rafId = requestAnimationFrame(this.boundTick);
    });
  }

  ngOnDestroy() {
    this.destroyed = true;
    this.draggingHandle = null;

    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }

    if (isPlatformBrowser(this.platformId)) {
      this.releasePointerCaptureSafe();
      this.unbindDrag();
    }

    this.handleEl = null;
    this.sceneEl = null;
  }

  onHandleDown(handle: 1 | 2, event: PointerEvent) {
    this.draggingHandle = handle;
    this.handleEl = event.currentTarget as HTMLElement;
    this.activePointerId = event.pointerId;
    this.handleEl.setPointerCapture(event.pointerId);
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
    this.minPanel = MIN_PANEL;
    this.targetA = 33;
    this.targetB = 34;
    this.targetC = 33;
    this.velA = this.velB = this.velC = 0;
    this.draggingHandle = null;
    this.unbindDrag();
    this.applyVars();
  }

  onParamChange(detail: { id: string; value: number }) {
    if (detail.id === 'springStiffness') this.springStiffness = detail.value;
    else if (detail.id === 'damping') this.damping = detail.value;
    else if (detail.id === 'minPanel') this.minPanel = detail.value;
    this.applyVars();
  }

  private onPointerMove(event: PointerEvent) {
    if (!this.draggingHandle || !this.sceneEl) return;

    const rect = this.sceneEl.querySelector<HTMLElement>('.js-panels-frame')?.getBoundingClientRect();
    if (!rect) return;

    const pct = ((event.clientX - rect.left) / rect.width) * 100;

    if (this.draggingHandle === 1) {
      const maxA = 100 - this.minPanel * 2;
      const a = Math.max(this.minPanel, Math.min(maxA, pct));
      const remaining = 100 - a;
      const ratio = this.targetB / (this.targetB + this.targetC) || 0.5;
      this.targetA = a;
      this.targetB = remaining * ratio;
      this.targetC = remaining * (1 - ratio);
    } else {
      const minB = this.minPanel;
      const maxB = 100 - this.minPanel - this.targetA;
      const b = Math.max(minB, Math.min(maxB, pct - this.targetA));
      this.targetB = b;
      this.targetC = 100 - this.targetA - b;
    }
  }

  private onPointerUp() {
    this.draggingHandle = null;
    this.unbindDrag();
    this.releasePointerCaptureSafe();
    this.handleEl = null;
    this.activePointerId = null;
  }

  private unbindDrag() {
    if (!isPlatformBrowser(this.platformId)) return;

    window.removeEventListener('pointermove', this.boundMove);
    window.removeEventListener('pointerup', this.boundUp);
    window.removeEventListener('pointercancel', this.boundUp);
  }

  private releasePointerCaptureSafe() {
    if (!isPlatformBrowser(this.platformId) || !this.handleEl || this.activePointerId === null) return;

    try {
      if (this.handleEl.isConnected && this.handleEl.hasPointerCapture(this.activePointerId)) {
        this.handleEl.releasePointerCapture(this.activePointerId);
      }
    } catch {
      // элемент уже уничтожен
    }
  }

  private applyVars() {
    if (this.destroyed) return;

    const el = this.sceneHostRef?.nativeElement;
    if (!el) return;
    el.style.setProperty('--panel-a', `${this.displayA.toFixed(2)}%`);
    el.style.setProperty('--panel-b', `${this.displayB.toFixed(2)}%`);
    el.style.setProperty('--panel-c', `${this.displayC.toFixed(2)}%`);
  }

  private tick() {
    if (this.destroyed) return;

    if (!this.reducedMotion) {
      this.displayA = this.springStep(this.displayA, this.targetA, 'velA');
      this.displayB = this.springStep(this.displayB, this.targetB, 'velB');
      this.displayC = this.springStep(this.displayC, this.targetC, 'velC');
    } else {
      this.displayA = this.targetA;
      this.displayB = this.targetB;
      this.displayC = this.targetC;
    }

    this.panelA = this.displayA;
    this.panelB = this.displayB;
    this.panelC = this.displayC;
    this.applyVars();
    this.rafId = requestAnimationFrame(this.boundTick);
  }

  private springStep(current: number, target: number, velKey: 'velA' | 'velB' | 'velC'): number {
    const vel = this[velKey];
    const force = (target - current) * this.springStiffness;
    const newVel = (vel + force) * this.damping;
    const newVal = current + newVel;

    if (Math.abs(target - newVal) < 0.05 && Math.abs(newVel) < 0.02) {
      this[velKey] = 0;
      return target;
    }

    this[velKey] = newVel;
    return newVal;
  }

  drawDebug({ ctx, width, height }: { ctx: CanvasRenderingContext2D; width: number; height: number }) {
    ctx.clearRect(0, 0, width, height);
    if (!this.sceneEl) return;

    const sceneRect = this.sceneEl.getBoundingClientRect();
    this.sceneEl.querySelectorAll<HTMLElement>('.js-panel').forEach((panel, i) => {
      const rect = panel.getBoundingClientRect();
      ctx.strokeStyle = i === 1 ? DEBUG_STROKE : DEBUG_SOFT;
      ctx.lineWidth = i === 1 ? 2 : 1;
      ctx.strokeRect(rect.left - sceneRect.left, rect.top - sceneRect.top, rect.width, rect.height);
    });
  }
}
