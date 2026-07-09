import { Component, AfterViewInit, OnDestroy, PLATFORM_ID, NgZone, ViewChild, ElementRef, inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { LabDemoLayoutComponent } from '../../../shell/lab-demo-layout/lab-demo-layout.component';

/**
 * Modal — THE.LAB / Components.
 *
 * Portal modal: radial clip-path reveal от точки клика + spring scale.
 */
const REVEAL_DURATION = 560;
const SPRING_STIFFNESS = 0.18;
const BLUR_AMOUNT = 14;

const DEBUG_STROKE = 'rgba(245, 158, 11, 0.55)';
const DEBUG_SOFT = 'rgba(245, 158, 11, 0.22)';

@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [CommonModule, LabDemoLayoutComponent],
  styleUrls: ['./modal.component.scss'],
  templateUrl: './modal.component.html',
})
export class ModalComponent implements AfterViewInit, OnDestroy {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly ngZone = inject(NgZone);

  @ViewChild('sceneHost') sceneHostRef!: ElementRef<HTMLElement>;

  isOpen = false;
  revealDuration = REVEAL_DURATION;
  springStiffness = SPRING_STIFFNESS;
  blurAmount = BLUR_AMOUNT;

  revealR = 0;
  modalScale = 0;
  clickX = 50;
  clickY = 50;

  private targetRevealR = 0;
  private targetScale = 0;
  private velScale = 0;
  private revealStart = 0;
  private sceneEl: HTMLElement | null = null;
  private rafId: number | null = null;
  private reducedMotion = false;
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

  openModal(event: MouseEvent) {
    const scene = this.sceneHostRef?.nativeElement;
    if (!scene) return;

    const rect = scene.getBoundingClientRect();
    this.clickX = ((event.clientX - rect.left) / rect.width) * 100;
    this.clickY = ((event.clientY - rect.top) / rect.height) * 100;

    this.isOpen = true;
    this.revealStart = performance.now();
    this.targetRevealR = 150;
    this.targetScale = 1;
    this.velScale = 0;
    this.applyVars();
  }

  closeModal() {
    this.isOpen = false;
    this.targetRevealR = 0;
    this.targetScale = 0;
    this.revealStart = performance.now();
  }

  reset() {
    this.isOpen = false;
    this.revealDuration = REVEAL_DURATION;
    this.springStiffness = SPRING_STIFFNESS;
    this.blurAmount = BLUR_AMOUNT;
    this.revealR = 0;
    this.modalScale = 0;
    this.targetRevealR = 0;
    this.targetScale = 0;
    this.velScale = 0;
    this.applyVars();
  }

  onParamChange(detail: { id: string; value: number }) {
    if (detail.id === 'revealDuration') this.revealDuration = detail.value;
    else if (detail.id === 'springStiffness') this.springStiffness = detail.value;
    else if (detail.id === 'blurAmount') this.blurAmount = detail.value;
    this.applyVars();
  }

  private applyVars() {
    const el = this.sceneHostRef?.nativeElement;
    if (!el) return;
    el.style.setProperty('--reveal-r', `${this.revealR}%`);
    el.style.setProperty('--reveal-x', `${this.clickX}%`);
    el.style.setProperty('--reveal-y', `${this.clickY}%`);
    el.style.setProperty('--modal-scale', String(this.modalScale.toFixed(3)));
    el.style.setProperty('--blur-amount', `${this.blurAmount}px`);
    el.style.setProperty('--reveal-duration', `${this.revealDuration}ms`);
  }

  private tick() {
    const elapsed = performance.now() - this.revealStart;
    const progress = Math.min(1, elapsed / this.revealDuration);
    const eased = 1 - Math.pow(1 - progress, 3);

    if (this.isOpen) {
      this.revealR = this.targetRevealR * eased;
    } else {
      this.revealR = this.targetRevealR * (1 - eased);
    }

    if (!this.reducedMotion) {
      const force = (this.targetScale - this.modalScale) * this.springStiffness;
      this.velScale = (this.velScale + force) * 0.72;
      this.modalScale += this.velScale;

      if (Math.abs(this.targetScale - this.modalScale) < 0.005 && Math.abs(this.velScale) < 0.005) {
        this.modalScale = this.targetScale;
        this.velScale = 0;
      }
    } else {
      this.modalScale = this.targetScale;
    }

    this.applyVars();
    this.rafId = requestAnimationFrame(this.boundTick);
  }

  drawDebug({ ctx, width, height }: { ctx: CanvasRenderingContext2D; width: number; height: number }) {
    ctx.clearRect(0, 0, width, height);
    if (!this.sceneEl || !this.isOpen) return;

    const sceneRect = this.sceneEl.getBoundingClientRect();
    const cx = (this.clickX / 100) * sceneRect.width;
    const cy = (this.clickY / 100) * sceneRect.height;
    const r = (this.revealR / 100) * Math.max(sceneRect.width, sceneRect.height);

    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.strokeStyle = DEBUG_SOFT;
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = DEBUG_STROKE;
    ctx.beginPath();
    ctx.arc(cx, cy, 4, 0, Math.PI * 2);
    ctx.fill();

    const modal = this.sceneEl.querySelector<HTMLElement>('.js-modal-card');
    if (modal) {
      const rect = modal.getBoundingClientRect();
      ctx.strokeStyle = DEBUG_STROKE;
      ctx.strokeRect(rect.left - sceneRect.left, rect.top - sceneRect.top, rect.width, rect.height);
    }
  }
}
