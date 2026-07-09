import { Component, AfterViewInit, OnDestroy, PLATFORM_ID, NgZone, ViewChild, ElementRef, inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { LabDemoLayoutComponent } from '../../../shell/lab-demo-layout/lab-demo-layout.component';

/**
 * Tabs — THE.LAB / Components.
 *
 * Blob-индикатор морфится между табами, контент переключается clip-path wipe.
 */
const MORPH_LERP = 0.14;
const WIPE_DURATION = 480;
const MORPH_RADIUS = 18;

const DEBUG_STROKE = 'rgba(245, 158, 11, 0.55)';
const DEBUG_SOFT = 'rgba(245, 158, 11, 0.22)';

interface TabPanel {
  label: string;
  title: string;
  body: string;
}

@Component({
  selector: 'app-tabs',
  standalone: true,
  imports: [CommonModule, LabDemoLayoutComponent],
  styleUrls: ['./tabs.component.scss'],
  templateUrl: './tabs.component.html',
})
export class TabsComponent implements AfterViewInit, OnDestroy {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly ngZone = inject(NgZone);

  @ViewChild('sceneHost') sceneHostRef!: ElementRef<HTMLElement>;

  tabs: TabPanel[] = [
    { label: 'Design', title: 'Design tokens', body: 'Color, spacing and typography scales form the foundation of every component in the system.' },
    { label: 'Motion', title: 'Motion specs', body: 'Spring stiffness, damping and stagger values define how interfaces feel alive and responsive.' },
    { label: 'Code', title: 'Implementation', body: 'Standalone Angular components with CSS variables and RAF loops — no animation libraries.' },
  ];

  activeIndex = 0;
  prevIndex = 0;
  wipeDirection = 1;
  morphLerp = MORPH_LERP;
  wipeDuration = WIPE_DURATION;
  morphRadius = MORPH_RADIUS;

  private sceneEl: HTMLElement | null = null;
  private barEl: HTMLElement | null = null;
  private blobEl: HTMLElement | null = null;
  private tabEls: HTMLElement[] = [];
  private currentX = 0;
  private currentY = 0;
  private currentW = 0;
  private currentH = 0;
  private targetX = 0;
  private targetY = 0;
  private targetW = 0;
  private targetH = 0;
  private rafId: number | null = null;
  private reducedMotion = false;
  private readonly boundTick = () => this.tick();

  ngAfterViewInit() {
    if (!isPlatformBrowser(this.platformId)) return;

    this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.sceneEl = this.sceneHostRef?.nativeElement ?? null;
    if (!this.sceneEl) return;

    this.barEl = this.sceneEl.querySelector<HTMLElement>('.js-tabs-bar');
    this.blobEl = this.sceneEl.querySelector<HTMLElement>('.js-tabs-blob');
    this.tabEls = Array.from(this.sceneEl.querySelectorAll<HTMLElement>('.js-tabs-tab'));

    this.applyVars();
    this.syncTarget(this.activeIndex);
    this.snapBlob();

    this.ngZone.runOutsideAngular(() => {
      this.rafId = requestAnimationFrame(this.boundTick);
    });
  }

  ngOnDestroy() {
    if (this.rafId !== null) cancelAnimationFrame(this.rafId);
  }

  selectTab(index: number) {
    if (index === this.activeIndex) return;
    this.wipeDirection = index > this.activeIndex ? 1 : -1;
    this.prevIndex = this.activeIndex;
    this.activeIndex = index;
    this.syncTarget(index);
    this.applyVars();
  }

  reset() {
    this.activeIndex = 0;
    this.prevIndex = 0;
    this.wipeDirection = 1;
    this.morphLerp = MORPH_LERP;
    this.wipeDuration = WIPE_DURATION;
    this.morphRadius = MORPH_RADIUS;
    this.applyVars();
    this.syncTarget(0);
    this.snapBlob();
  }

  onParamChange(detail: { id: string; value: number }) {
    if (detail.id === 'morphLerp') this.morphLerp = detail.value;
    else if (detail.id === 'wipeDuration') this.wipeDuration = detail.value;
    else if (detail.id === 'morphRadius') this.morphRadius = detail.value;
    this.applyVars();
  }

  private applyVars() {
    const el = this.sceneHostRef?.nativeElement;
    if (!el) return;
    el.style.setProperty('--morph-radius', `${this.morphRadius}px`);
    el.style.setProperty('--wipe-duration', `${this.wipeDuration}ms`);
    el.style.setProperty('--active-index', String(this.activeIndex));
    el.style.setProperty('--wipe-direction', String(this.wipeDirection));
  }

  private syncTarget(index: number) {
    const tab = this.tabEls[index];
    if (!tab || !this.barEl) return;

    const barRect = this.barEl.getBoundingClientRect();
    const rect = tab.getBoundingClientRect();
    const pad = 4;

    this.targetX = rect.left - barRect.left - pad;
    this.targetY = rect.top - barRect.top - pad;
    this.targetW = rect.width + pad * 2;
    this.targetH = rect.height + pad * 2;
  }

  private snapBlob() {
    this.currentX = this.targetX;
    this.currentY = this.targetY;
    this.currentW = this.targetW;
    this.currentH = this.targetH;
    this.applyBlob();
  }

  private tick() {
    const lerp = this.reducedMotion ? 1 : this.morphLerp;

    this.currentX += (this.targetX - this.currentX) * lerp;
    this.currentY += (this.targetY - this.currentY) * lerp;
    this.currentW += (this.targetW - this.currentW) * lerp;
    this.currentH += (this.targetH - this.currentH) * lerp;

    this.applyBlob();
    this.rafId = requestAnimationFrame(this.boundTick);
  }

  private applyBlob() {
    if (!this.blobEl) return;
    this.blobEl.style.setProperty('--blob-x', `${this.currentX}px`);
    this.blobEl.style.setProperty('--blob-y', `${this.currentY}px`);
    this.blobEl.style.setProperty('--blob-w', `${this.currentW}px`);
    this.blobEl.style.setProperty('--blob-h', `${this.currentH}px`);
  }

  drawDebug({ ctx, width, height }: { ctx: CanvasRenderingContext2D; width: number; height: number }) {
    ctx.clearRect(0, 0, width, height);
    if (!this.sceneEl || !this.barEl) return;

    const sceneRect = this.sceneEl.getBoundingClientRect();
    const barRect = this.barEl.getBoundingClientRect();
    const barX = barRect.left - sceneRect.left;
    const barY = barRect.top - sceneRect.top;

    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = DEBUG_SOFT;
    ctx.strokeRect(barX + this.currentX, barY + this.currentY, this.currentW, this.currentH);
    ctx.setLineDash([]);

    ctx.strokeStyle = DEBUG_STROKE;
    ctx.strokeRect(barX + this.targetX, barY + this.targetY, this.targetW, this.targetH);

    this.tabEls.forEach((tab, i) => {
      const rect = tab.getBoundingClientRect();
      ctx.strokeStyle = i === this.activeIndex ? DEBUG_STROKE : DEBUG_SOFT;
      ctx.lineWidth = i === this.activeIndex ? 2 : 1;
      ctx.strokeRect(rect.left - sceneRect.left, rect.top - sceneRect.top, rect.width, rect.height);
    });
  }
}
