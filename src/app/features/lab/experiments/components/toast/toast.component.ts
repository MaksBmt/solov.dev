import { Component, AfterViewInit, OnDestroy, PLATFORM_ID, NgZone, ViewChild, ElementRef, inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { LabDemoLayoutComponent } from '../../../shell/lab-demo-layout/lab-demo-layout.component';

/**
 * Toast — THE.LAB / Components.
 *
 * Стек тостов с пружинной физикой позиций и slide-out dismiss.
 */
const SPRING_STIFFNESS = 0.16;
const DAMPING = 0.74;
const MAX_VISIBLE = 4;
const TOAST_GAP = 10;
const TOAST_HEIGHT = 56;

const DEBUG_STROKE = 'rgba(245, 158, 11, 0.55)';
const DEBUG_SOFT = 'rgba(245, 158, 11, 0.22)';

interface ToastItem {
  id: number;
  message: string;
  type: 'success' | 'info' | 'warning';
  dismissing: boolean;
}

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule, LabDemoLayoutComponent],
  styleUrls: ['./toast.component.scss'],
  templateUrl: './toast.component.html',
})
export class ToastComponent implements AfterViewInit, OnDestroy {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly ngZone = inject(NgZone);

  @ViewChild('sceneHost') sceneHostRef!: ElementRef<HTMLElement>;

  toasts: ToastItem[] = [];
  springStiffness = SPRING_STIFFNESS;
  damping = DAMPING;
  maxVisible = MAX_VISIBLE;

  positions: Record<number, number> = {};
  velocities: Record<number, number> = {};

  private nextId = 1;
  private messages = [
    { message: 'Changes saved successfully', type: 'success' as const },
    { message: 'New update available', type: 'info' as const },
    { message: 'Storage almost full', type: 'warning' as const },
    { message: 'Profile synced', type: 'success' as const },
    { message: 'Connection restored', type: 'info' as const },
  ];
  private msgIndex = 0;
  private rafId: number | null = null;
  private reducedMotion = false;
  private sceneEl: HTMLElement | null = null;
  private readonly boundTick = () => this.tick();

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
    if (this.rafId !== null) cancelAnimationFrame(this.rafId);
  }

  pushToast() {
    const src = this.messages[this.msgIndex % this.messages.length];
    this.msgIndex++;

    const toast: ToastItem = {
      id: this.nextId++,
      message: src.message,
      type: src.type,
      dismissing: false,
    };

    this.toasts = [toast, ...this.toasts].slice(0, this.maxVisible + 2);
    this.positions[toast.id] = -TOAST_HEIGHT;
    this.velocities[toast.id] = 0;
    this.applyVars();
  }

  dismiss(id: number) {
    const toast = this.toasts.find((t) => t.id === id);
    if (toast) toast.dismissing = true;

    setTimeout(() => {
      this.toasts = this.toasts.filter((t) => t.id !== id);
      delete this.positions[id];
      delete this.velocities[id];
      this.applyVars();
    }, 320);
  }

  reset() {
    this.toasts = [];
    this.positions = {};
    this.velocities = {};
    this.springStiffness = SPRING_STIFFNESS;
    this.damping = DAMPING;
    this.maxVisible = MAX_VISIBLE;
    this.applyVars();
  }

  onParamChange(detail: { id: string; value: number }) {
    if (detail.id === 'springStiffness') this.springStiffness = detail.value;
    else if (detail.id === 'damping') this.damping = detail.value;
    else if (detail.id === 'maxVisible') this.maxVisible = detail.value;
    this.applyVars();
  }

  private applyVars() {
    const el = this.sceneHostRef?.nativeElement;
    if (!el) return;
    el.style.setProperty('--toast-count', String(this.toasts.length));
    el.style.setProperty('--spring-stiffness', String(this.springStiffness));
  }

  private tick() {
    this.toasts.forEach((toast, index) => {
      if (toast.dismissing) return;

      const targetY = index * (TOAST_HEIGHT + TOAST_GAP);
      const el = this.sceneEl?.querySelector<HTMLElement>(`[data-toast-id="${toast.id}"]`);

      if (!this.reducedMotion) {
        const pos = this.positions[toast.id] ?? targetY;
        const vel = this.velocities[toast.id] ?? 0;
        const force = (targetY - pos) * this.springStiffness;
        const newVel = (vel + force) * this.damping;
        const newPos = pos + newVel;

        this.positions[toast.id] = newPos;
        this.velocities[toast.id] = newVel;
        el?.style.setProperty('--toast-y', `${newPos}px`);
      } else {
        this.positions[toast.id] = targetY;
        el?.style.setProperty('--toast-y', `${targetY}px`);
      }
    });

    this.rafId = requestAnimationFrame(this.boundTick);
  }

  drawDebug({ ctx, width, height }: { ctx: CanvasRenderingContext2D; width: number; height: number }) {
    ctx.clearRect(0, 0, width, height);
    const scene = this.sceneHostRef?.nativeElement;
    if (!scene) return;

    const sceneRect = scene.getBoundingClientRect();
    scene.querySelectorAll<HTMLElement>('.js-toast').forEach((toast, i) => {
      const rect = toast.getBoundingClientRect();
      ctx.strokeStyle = i === 0 ? DEBUG_STROKE : DEBUG_SOFT;
      ctx.lineWidth = i === 0 ? 2 : 1;
      ctx.strokeRect(rect.left - sceneRect.left, rect.top - sceneRect.top, rect.width, rect.height);
    });
  }
}
