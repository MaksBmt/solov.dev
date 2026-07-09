import { Component, AfterViewInit, OnDestroy, PLATFORM_ID, NgZone, ViewChild, ElementRef, inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { LabDemoLayoutComponent } from '../../../shell/lab-demo-layout/lab-demo-layout.component';

/**
 * Accordion — THE.LAB / Components.
 *
 * Панели раскрываются с пружинной физикой высоты и светящимся разделителем.
 */
const SPRING_STIFFNESS = 0.12;
const DAMPING = 0.68;
const GLOW_INTENSITY = 0.65;

const DEBUG_STROKE = 'rgba(245, 158, 11, 0.55)';
const DEBUG_SOFT = 'rgba(245, 158, 11, 0.22)';

interface AccordionPanel {
  title: string;
  body: string;
}

@Component({
  selector: 'app-accordion',
  standalone: true,
  imports: [CommonModule, LabDemoLayoutComponent],
  styleUrls: ['./accordion.component.scss'],
  templateUrl: './accordion.component.html',
})
export class AccordionComponent implements AfterViewInit, OnDestroy {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly ngZone = inject(NgZone);

  @ViewChild('sceneHost') sceneHostRef!: ElementRef<HTMLElement>;

  panels: AccordionPanel[] = [
    { title: 'Design System', body: 'Tokens, spacing, typography scales and component primitives that keep the UI consistent across products.' },
    { title: 'Motion Language', body: 'Spring curves, stagger timing and easing presets — every animation follows the same physical vocabulary.' },
    { title: 'Accessibility', body: 'Focus rings, reduced-motion fallbacks and ARIA patterns baked into every interactive component.' },
    { title: 'Performance', body: 'requestAnimationFrame loops, CSS containment and will-change only where it matters.' },
  ];

  activeIndex = 0;
  springStiffness = SPRING_STIFFNESS;
  damping = DAMPING;
  glowIntensity = GLOW_INTENSITY;

  panelHeights: number[] = [];
  displayHeight = 0;

  private sceneEl: HTMLElement | null = null;
  private bodyEls: HTMLElement[] = [];
  private targetHeight = 0;
  private velHeight = 0;
  private rafId: number | null = null;
  private reducedMotion = false;
  private readonly boundTick = () => this.tick();

  ngAfterViewInit() {
    if (!isPlatformBrowser(this.platformId)) return;

    this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.sceneEl = this.sceneHostRef?.nativeElement ?? null;
    if (!this.sceneEl) return;

    this.bodyEls = Array.from(this.sceneEl.querySelectorAll<HTMLElement>('.js-acc-body-inner'));
    requestAnimationFrame(() => {
      this.measureHeights();
      this.syncTarget(this.activeIndex);
      this.displayHeight = this.targetHeight;
      this.applyVars();
    });

    this.ngZone.runOutsideAngular(() => {
      this.rafId = requestAnimationFrame(this.boundTick);
    });
  }

  ngOnDestroy() {
    if (this.rafId !== null) cancelAnimationFrame(this.rafId);
  }

  togglePanel(index: number) {
    this.activeIndex = this.activeIndex === index ? -1 : index;
    requestAnimationFrame(() => {
      this.measureHeights();
      this.syncTarget(this.activeIndex);
    });
    this.applyVars();
  }

  reset() {
    this.activeIndex = 0;
    this.springStiffness = SPRING_STIFFNESS;
    this.damping = DAMPING;
    this.glowIntensity = GLOW_INTENSITY;
    this.velHeight = 0;
    this.measureHeights();
    this.syncTarget(0);
    this.displayHeight = this.targetHeight;
    this.applyVars();
  }

  onParamChange(detail: { id: string; value: number }) {
    if (detail.id === 'springStiffness') this.springStiffness = detail.value;
    else if (detail.id === 'damping') this.damping = detail.value;
    else if (detail.id === 'glowIntensity') this.glowIntensity = detail.value;
    this.applyVars();
  }

  private measureHeights() {
    this.panelHeights = this.bodyEls.map((el) => el.scrollHeight);
  }

  private syncTarget(index: number) {
    this.targetHeight = index >= 0 ? (this.panelHeights[index] ?? 0) : 0;
  }

  private applyVars() {
    const el = this.sceneHostRef?.nativeElement;
    if (!el) return;
    el.style.setProperty('--panel-height', `${this.displayHeight}px`);
    el.style.setProperty('--spring-stiffness', String(this.springStiffness));
    el.style.setProperty('--active-index', String(this.activeIndex));
    el.style.setProperty('--glow-intensity', String(this.glowIntensity));
  }

  private tick() {
    if (!this.reducedMotion) {
      const force = (this.targetHeight - this.displayHeight) * this.springStiffness;
      this.velHeight = (this.velHeight + force) * this.damping;
      this.displayHeight += this.velHeight;

      if (Math.abs(this.targetHeight - this.displayHeight) < 0.4 && Math.abs(this.velHeight) < 0.05) {
        this.displayHeight = this.targetHeight;
        this.velHeight = 0;
      }
    } else {
      this.displayHeight = this.targetHeight;
    }

    this.applyVars();
    this.rafId = requestAnimationFrame(this.boundTick);
  }

  drawDebug({ ctx, width, height }: { ctx: CanvasRenderingContext2D; width: number; height: number }) {
    ctx.clearRect(0, 0, width, height);
    if (!this.sceneEl) return;

    const sceneRect = this.sceneEl.getBoundingClientRect();
    this.sceneEl.querySelectorAll<HTMLElement>('.js-acc-item').forEach((item, i) => {
      const rect = item.getBoundingClientRect();
      const x = rect.left - sceneRect.left;
      const y = rect.top - sceneRect.top;
      const active = i === this.activeIndex;

      ctx.strokeStyle = active ? DEBUG_STROKE : DEBUG_SOFT;
      ctx.lineWidth = active ? 2 : 1;
      ctx.strokeRect(x, y, rect.width, rect.height);
    });

    const bodyWrap = this.sceneEl.querySelector<HTMLElement>('.js-acc-body-wrap');
    if (bodyWrap) {
      const rect = bodyWrap.getBoundingClientRect();
      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = DEBUG_STROKE;
      ctx.strokeRect(rect.left - sceneRect.left, rect.top - sceneRect.top, rect.width, rect.height);
      ctx.setLineDash([]);
    }
  }
}
