import { Component, AfterViewInit, OnDestroy, PLATFORM_ID, NgZone, ViewChild, ElementRef, inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { LabDemoLayoutComponent } from '../../../shell/lab-demo-layout/lab-demo-layout.component';

/**
 * Elastic Navigation — THE.LAB / Navigation.
 *
 * Индикатор активного таба движется с пружинной физикой:
 * позиция и скорость интегрируются каждый кадр с overshoot.
 */
const SPRING_STIFFNESS = 0.14;
const DAMPING = 0.72;
const OVERSHOOT = 1.15;

const DEBUG_STROKE = 'rgba(245, 158, 11, 0.55)';
const DEBUG_SOFT = 'rgba(245, 158, 11, 0.22)';

interface TabItem {
  label: string;
}

@Component({
  selector: 'app-elastic-navigation',
  standalone: true,
  imports: [CommonModule, LabDemoLayoutComponent],
  styleUrls: ['./elastic-navigation.component.scss'],
  templateUrl: './elastic-navigation.component.html',
})
export class ElasticNavigationComponent implements AfterViewInit, OnDestroy {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly ngZone = inject(NgZone);

  @ViewChild('sceneHost') sceneHostRef!: ElementRef<HTMLElement>;

  tabs: TabItem[] = [
    { label: 'Overview' },
    { label: 'Analytics' },
    { label: 'Reports' },
    { label: 'Settings' },
  ];

  activeIndex = 0;
  springStiffness = SPRING_STIFFNESS;
  damping = DAMPING;
  overshoot = OVERSHOOT;

  private sceneEl: HTMLElement | null = null;
  private indicatorEl: HTMLElement | null = null;
  private tabEls: HTMLElement[] = [];
  private posX = 0;
  private posW = 0;
  private velX = 0;
  private velW = 0;
  private targetX = 0;
  private targetW = 0;
  private rafId: number | null = null;
  private reducedMotion = false;
  private readonly boundTick = () => this.tick();

  ngAfterViewInit() {
    if (!isPlatformBrowser(this.platformId)) return;

    this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.sceneEl = this.sceneHostRef?.nativeElement ?? null;
    if (!this.sceneEl) return;

    this.indicatorEl = this.sceneEl.querySelector<HTMLElement>('.js-elastic-indicator');
    this.tabEls = Array.from(this.sceneEl.querySelectorAll<HTMLElement>('.js-elastic-tab'));

    this.applyVars();
    this.syncTarget(this.activeIndex);
    this.snapIndicator();

    this.ngZone.runOutsideAngular(() => {
      this.rafId = requestAnimationFrame(this.boundTick);
    });
  }

  ngOnDestroy() {
    if (this.rafId !== null) cancelAnimationFrame(this.rafId);
  }

  selectTab(index: number) {
    this.activeIndex = index;
    this.syncTarget(index);
  }

  reset() {
    this.activeIndex = 0;
    this.springStiffness = SPRING_STIFFNESS;
    this.damping = DAMPING;
    this.overshoot = OVERSHOOT;
    this.velX = 0;
    this.velW = 0;
    this.applyVars();
    this.syncTarget(0);
    this.snapIndicator();
  }

  onParamChange(detail: { id: string; value: number }) {
    if (detail.id === 'springStiffness') this.springStiffness = detail.value;
    else if (detail.id === 'damping') this.damping = detail.value;
    else if (detail.id === 'overshoot') this.overshoot = detail.value;
    this.applyVars();
  }

  private applyVars() {
    const el = this.sceneHostRef?.nativeElement;
    if (!el) return;
    el.style.setProperty('--spring-stiffness', String(this.springStiffness));
    el.style.setProperty('--damping', String(this.damping));
    el.style.setProperty('--overshoot', String(this.overshoot));
  }

  private syncTarget(index: number) {
    const tab = this.tabEls[index];
    if (!tab || !this.sceneEl) return;

    const nav = this.sceneEl.querySelector<HTMLElement>('.js-elastic-nav');
    if (!nav) return;

    const navRect = nav.getBoundingClientRect();
    const rect = tab.getBoundingClientRect();
    const pad = 4;

    this.targetX = rect.left - navRect.left - pad;
    this.targetW = rect.width + pad * 2;
  }

  private snapIndicator() {
    this.posX = this.targetX;
    this.posW = this.targetW;
    this.applyIndicator();
  }

  private tick() {
    if (!this.reducedMotion) {
      const stiffness = this.springStiffness * this.overshoot;
      const forceX = (this.targetX - this.posX) * stiffness;
      const forceW = (this.targetW - this.posW) * stiffness;

      this.velX = (this.velX + forceX) * this.damping;
      this.velW = (this.velW + forceW) * this.damping;

      this.posX += this.velX;
      this.posW += this.velW;

      if (Math.abs(this.targetX - this.posX) < 0.3 && Math.abs(this.velX) < 0.05) {
        this.posX = this.targetX;
        this.velX = 0;
      }
      if (Math.abs(this.targetW - this.posW) < 0.3 && Math.abs(this.velW) < 0.05) {
        this.posW = this.targetW;
        this.velW = 0;
      }
    } else {
      this.posX = this.targetX;
      this.posW = this.targetW;
    }

    this.applyIndicator();
    this.rafId = requestAnimationFrame(this.boundTick);
  }

  private applyIndicator() {
    if (!this.indicatorEl) return;
    this.indicatorEl.style.setProperty('--indicator-x', `${this.posX}px`);
    this.indicatorEl.style.setProperty('--indicator-w', `${this.posW}px`);
  }

  drawDebug({ ctx, width, height }: { ctx: CanvasRenderingContext2D; width: number; height: number }) {
    ctx.clearRect(0, 0, width, height);
    if (!this.sceneEl) return;

    const nav = this.sceneEl.querySelector<HTMLElement>('.js-elastic-nav');
    if (!nav) return;

    const sceneRect = this.sceneEl.getBoundingClientRect();
    const navRect = nav.getBoundingClientRect();
    const navX = navRect.left - sceneRect.left;
    const navY = navRect.top - sceneRect.top;

    ctx.strokeStyle = DEBUG_SOFT;
    ctx.strokeRect(navX, navY, navRect.width, navRect.height);

    ctx.strokeStyle = DEBUG_STROKE;
    ctx.strokeRect(navX + this.targetX, navY + 4, this.targetW, navRect.height - 8);

    ctx.setLineDash([3, 3]);
    ctx.strokeStyle = 'rgba(253, 186, 116, 0.7)';
    ctx.strokeRect(navX + this.posX, navY + 4, this.posW, navRect.height - 8);
    ctx.setLineDash([]);

    this.tabEls.forEach((tab, i) => {
      const rect = tab.getBoundingClientRect();
      const x = rect.left - sceneRect.left;
      const y = rect.top - sceneRect.top;
      ctx.strokeStyle = i === this.activeIndex ? DEBUG_STROKE : DEBUG_SOFT;
      ctx.lineWidth = i === this.activeIndex ? 2 : 1;
      ctx.strokeRect(x, y, rect.width, rect.height);
    });
  }
}
