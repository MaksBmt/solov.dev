import {
  Component,
  AfterViewInit,
  OnDestroy,
  PLATFORM_ID,
  NgZone,
  ViewChild,
  ElementRef,
  inject,
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { LabDemoLayoutComponent } from '../../../shell/lab-demo-layout/lab-demo-layout.component';

/**
 * Variable Fonts — THE.LAB / Typography.
 *
 * Оси variable font (wght, wdth, slnt) плавно следуют за курсором
 * через font-variation-settings и CSS-переменные.
 */
const POSITION_LERP = 0.12;
const MIN_WEIGHT = 100;
const MAX_WEIGHT = 900;
const MIN_WIDTH = 75;
const MAX_WIDTH = 125;
const MIN_SLANT = -12;
const MAX_SLANT = 0;
const GRADIENT_SHIFT = 18;

@Component({
  selector: 'app-variable-fonts',
  standalone: true,
  imports: [CommonModule, LabDemoLayoutComponent],
  styleUrls: ['./variable-fonts.component.scss'],
  templateUrl: './variable-fonts.component.html',
})
export class VariableFontsComponent implements AfterViewInit, OnDestroy {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly ngZone = inject(NgZone);

  @ViewChild('sceneHost') sceneHostRef!: ElementRef<HTMLElement>;

  positionLerp = POSITION_LERP;
  minWeight = MIN_WEIGHT;
  maxWeight = MAX_WEIGHT;
  gradientShift = GRADIENT_SHIFT;

  readonly samples = [
    { label: '01', word: 'FLUID', note: 'weight + width' },
    { label: '02', word: 'MORPH', note: 'slant axis' },
    { label: '03', word: 'TYPE', note: 'live axes' },
  ];

  private sceneEl: HTMLElement | null = null;
  private typeEl: HTMLElement | null = null;
  private pointer = { x: 0.5, y: 0.5, active: false };
  private current = { weight: 520, width: 100, slant: -4, gradX: 50, gradY: 50 };
  private rafId: number | null = null;
  private reducedMotion = false;
  private readonly boundOnPointerMove = (e: PointerEvent) => this.onPointerMove(e);
  private readonly boundOnPointerLeave = () => this.onPointerLeave();

  ngAfterViewInit() {
    if (!isPlatformBrowser(this.platformId)) return;

    this.sceneEl = this.sceneHostRef?.nativeElement ?? null;
    this.typeEl = this.sceneEl?.querySelector<HTMLElement>('.js-variable-type') ?? null;
    if (!this.sceneEl || !this.typeEl) return;

    this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.sceneEl.addEventListener('pointermove', this.boundOnPointerMove, { passive: true });
    this.sceneEl.addEventListener('pointerleave', this.boundOnPointerLeave);
    this.reset(false);

    this.ngZone.runOutsideAngular(() => {
      const loop = () => {
        this.tick();
        this.rafId = requestAnimationFrame(loop);
      };
      this.rafId = requestAnimationFrame(loop);
    });
  }

  ngOnDestroy() {
    if (!isPlatformBrowser(this.platformId)) return;
    if (this.rafId !== null) cancelAnimationFrame(this.rafId);
    this.sceneEl?.removeEventListener('pointermove', this.boundOnPointerMove);
    this.sceneEl?.removeEventListener('pointerleave', this.boundOnPointerLeave);
  }

  onPointerMove(event: PointerEvent) {
    if (!this.sceneEl) return;
    const rect = this.sceneEl.getBoundingClientRect();
    this.pointer = {
      x: (event.clientX - rect.left) / rect.width,
      y: (event.clientY - rect.top) / rect.height,
      active: true,
    };
  }

  onPointerLeave() {
    this.pointer.active = false;
  }

  reset(reapply = true) {
    this.positionLerp = POSITION_LERP;
    this.minWeight = MIN_WEIGHT;
    this.maxWeight = MAX_WEIGHT;
    this.gradientShift = GRADIENT_SHIFT;
    this.pointer = { x: 0.5, y: 0.5, active: false };
    this.current = { weight: 520, width: 100, slant: -4, gradX: 50, gradY: 50 };
    if (reapply) this.applyVars();
  }

  onParamChange(detail: { id: string; value: number }) {
    if (detail.id === 'positionLerp') this.positionLerp = detail.value;
    if (detail.id === 'minWeight') this.minWeight = detail.value;
    if (detail.id === 'maxWeight') this.maxWeight = detail.value;
    if (detail.id === 'gradientShift') this.gradientShift = detail.value;
  }

  private tick() {
    const targetX = this.pointer.active ? this.pointer.x : 0.5;
    const targetY = this.pointer.active ? this.pointer.y : 0.5;
    const lerp = this.reducedMotion ? 1 : this.positionLerp;

    const targetWeight = this.minWeight + targetX * (this.maxWeight - this.minWeight);
    const targetWidth = MIN_WIDTH + targetY * (MAX_WIDTH - MIN_WIDTH);
    const targetSlant = MIN_SLANT + targetX * (MAX_SLANT - MIN_SLANT);
    const targetGradX = targetX * 100;
    const targetGradY = targetY * 100;

    this.current.weight += (targetWeight - this.current.weight) * lerp;
    this.current.width += (targetWidth - this.current.width) * lerp;
    this.current.slant += (targetSlant - this.current.slant) * lerp;
    this.current.gradX += (targetGradX - this.current.gradX) * lerp;
    this.current.gradY += (targetGradY - this.current.gradY) * lerp;

    this.applyVars();
  }

  private applyVars() {
    if (!this.typeEl) return;

    const w = Math.round(this.current.weight);
    const wd = this.current.width.toFixed(1);
    const sl = this.current.slant.toFixed(1);

    this.typeEl.style.setProperty('--vf-wght', String(w));
    this.typeEl.style.setProperty('--vf-wdth', wd);
    this.typeEl.style.setProperty('--vf-slnt', sl);
    this.typeEl.style.setProperty('--grad-x', `${this.current.gradX.toFixed(1)}%`);
    this.typeEl.style.setProperty('--grad-y', `${this.current.gradY.toFixed(1)}%`);
    this.typeEl.style.setProperty('--grad-shift', `${this.gradientShift}px`);
  }
}
