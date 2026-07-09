import { Component, AfterViewInit, OnDestroy, PLATFORM_ID, NgZone, ViewChild, ElementRef, inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { LabDemoLayoutComponent } from '../../../shell/lab-demo-layout/lab-demo-layout.component';

/**
 * Tooltip — THE.LAB / Components.
 *
 * Магнитный тултип с пружинным следованием за курсором и светящимся лучом.
 */
const SPRING_STIFFNESS = 0.14;
const DAMPING = 0.72;
const BEAM_OPACITY = 0.45;

const DEBUG_STROKE = 'rgba(245, 158, 11, 0.55)';
const DEBUG_SOFT = 'rgba(245, 158, 11, 0.22)';

interface TooltipTrigger {
  icon: string;
  label: string;
  tip: string;
}

@Component({
  selector: 'app-tooltip',
  standalone: true,
  imports: [CommonModule, LabDemoLayoutComponent],
  styleUrls: ['./tooltip.component.scss'],
  templateUrl: './tooltip.component.html',
})
export class TooltipComponent implements AfterViewInit, OnDestroy {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly ngZone = inject(NgZone);

  @ViewChild('sceneHost') sceneHostRef!: ElementRef<HTMLElement>;

  triggers: TooltipTrigger[] = [
    { icon: '◈', label: 'Layers', tip: 'Organize content into stacked layers with z-index control.' },
    { icon: '⚡', label: 'Speed', tip: 'Optimize animations with RAF and CSS containment.' },
    { icon: '◎', label: 'Focus', tip: 'Keyboard navigation and focus trap for accessibility.' },
    { icon: '✦', label: 'Effects', tip: 'Spring physics and clip-path for premium micro-interactions.' },
  ];

  activeIndex: number | null = null;
  springStiffness = SPRING_STIFFNESS;
  damping = DAMPING;
  beamOpacity = BEAM_OPACITY;

  tipX = 0;
  tipY = 0;
  beamX1 = 0;
  beamY1 = 0;
  beamX2 = 0;
  beamY2 = 0;

  private sceneEl: HTMLElement | null = null;
  private triggerEls: HTMLElement[] = [];
  private tipEl: HTMLElement | null = null;
  private beamLineEl: SVGLineElement | null = null;
  private targetX = 0;
  private targetY = 0;
  private velX = 0;
  private velY = 0;
  private anchorX = 0;
  private anchorY = 0;
  private rafId: number | null = null;
  private reducedMotion = false;
  private readonly boundTick = () => this.tick();
  private readonly boundMove = (e: PointerEvent) => this.onPointerMove(e);

  ngAfterViewInit() {
    if (!isPlatformBrowser(this.platformId)) return;

    this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.sceneEl = this.sceneHostRef?.nativeElement ?? null;
    if (!this.sceneEl) return;

    this.triggerEls = Array.from(this.sceneEl.querySelectorAll<HTMLElement>('.js-tip-trigger'));
    this.tipEl = this.sceneEl.querySelector<HTMLElement>('.js-tip-box');
    this.beamLineEl = this.sceneEl.querySelector<SVGLineElement>('.js-tip-beam');
    this.applyVars();

    this.ngZone.runOutsideAngular(() => {
      this.rafId = requestAnimationFrame(this.boundTick);
    });
  }

  ngOnDestroy() {
    if (this.rafId !== null) cancelAnimationFrame(this.rafId);
    this.sceneEl?.removeEventListener('pointermove', this.boundMove);
  }

  onEnter(index: number) {
    this.activeIndex = index;
    const trigger = this.triggerEls[index];
    if (!trigger || !this.sceneEl) return;

    const sceneRect = this.sceneEl.getBoundingClientRect();
    const rect = trigger.getBoundingClientRect();
    this.anchorX = rect.left + rect.width / 2 - sceneRect.left;
    this.anchorY = rect.top - sceneRect.top - 8;
    this.targetX = this.anchorX;
    this.targetY = this.anchorY - 48;
    this.tipX = this.targetX;
    this.tipY = this.targetY;
    this.sceneEl.addEventListener('pointermove', this.boundMove);

    requestAnimationFrame(() => {
      this.tipEl = this.sceneEl?.querySelector<HTMLElement>('.js-tip-box') ?? null;
      this.beamLineEl = this.sceneEl?.querySelector<SVGLineElement>('.js-tip-beam') ?? null;
      this.applyVars();
    });
  }

  onLeave() {
    this.activeIndex = null;
    this.sceneEl?.removeEventListener('pointermove', this.boundMove);
  }

  reset() {
    this.activeIndex = null;
    this.springStiffness = SPRING_STIFFNESS;
    this.damping = DAMPING;
    this.beamOpacity = BEAM_OPACITY;
    this.velX = 0;
    this.velY = 0;
    this.sceneEl?.removeEventListener('pointermove', this.boundMove);
    this.applyVars();
  }

  onParamChange(detail: { id: string; value: number }) {
    if (detail.id === 'springStiffness') this.springStiffness = detail.value;
    else if (detail.id === 'damping') this.damping = detail.value;
    else if (detail.id === 'beamOpacity') this.beamOpacity = detail.value;
    this.applyVars();
  }

  get activeTip(): string {
    return this.activeIndex !== null ? this.triggers[this.activeIndex].tip : '';
  }

  private onPointerMove(event: PointerEvent) {
    if (!this.sceneEl || this.activeIndex === null) return;

    const sceneRect = this.sceneEl.getBoundingClientRect();
    const trigger = this.triggerEls[this.activeIndex];
    const rect = trigger.getBoundingClientRect();

    const localX = event.clientX - sceneRect.left;
    const localY = event.clientY - sceneRect.top;
    const centerX = rect.left + rect.width / 2 - sceneRect.left;

    this.targetX = centerX + (localX - centerX) * 0.35;
    this.targetY = Math.min(localY - 56, rect.top - sceneRect.top - 40);
  }

  private applyVars() {
    const el = this.sceneHostRef?.nativeElement;
    if (!el) return;
    el.style.setProperty('--beam-opacity', String(this.beamOpacity));
    this.tipEl?.style.setProperty('--tip-x', `${this.tipX}px`);
    this.tipEl?.style.setProperty('--tip-y', `${this.tipY}px`);
    if (this.beamLineEl) {
      this.beamLineEl.setAttribute('x1', String(this.beamX1));
      this.beamLineEl.setAttribute('y1', String(this.beamY1));
      this.beamLineEl.setAttribute('x2', String(this.beamX2));
      this.beamLineEl.setAttribute('y2', String(this.beamY2));
    }
  }

  private tick() {
    if (this.activeIndex !== null && !this.reducedMotion) {
      const forceX = (this.targetX - this.tipX) * this.springStiffness;
      const forceY = (this.targetY - this.tipY) * this.springStiffness;
      this.velX = (this.velX + forceX) * this.damping;
      this.velY = (this.velY + forceY) * this.damping;
      this.tipX += this.velX;
      this.tipY += this.velY;
    } else if (this.activeIndex !== null) {
      this.tipX = this.targetX;
      this.tipY = this.targetY;
    }

    this.beamX1 = this.anchorX;
    this.beamY1 = this.anchorY;
    this.beamX2 = this.tipX;
    this.beamY2 = this.tipY + 36;

    this.applyVars();
    this.rafId = requestAnimationFrame(this.boundTick);
  }

  drawDebug({ ctx, width, height }: { ctx: CanvasRenderingContext2D; width: number; height: number }) {
    ctx.clearRect(0, 0, width, height);
    if (!this.sceneEl) return;

    const sceneRect = this.sceneEl.getBoundingClientRect();

    this.triggerEls.forEach((trigger, i) => {
      const rect = trigger.getBoundingClientRect();
      ctx.strokeStyle = i === this.activeIndex ? DEBUG_STROKE : DEBUG_SOFT;
      ctx.lineWidth = i === this.activeIndex ? 2 : 1;
      ctx.strokeRect(rect.left - sceneRect.left, rect.top - sceneRect.top, rect.width, rect.height);
    });

    if (this.activeIndex !== null) {
      ctx.beginPath();
      ctx.moveTo(this.beamX1, this.beamY1);
      ctx.lineTo(this.beamX2, this.beamY2);
      ctx.strokeStyle = DEBUG_STROKE;
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.strokeStyle = DEBUG_STROKE;
      ctx.strokeRect(this.tipX - 80, this.tipY, 160, 36);
    }
  }
}
