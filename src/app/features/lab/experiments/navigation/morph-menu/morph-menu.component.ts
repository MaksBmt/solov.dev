import { Component, AfterViewInit, OnDestroy, PLATFORM_ID, NgZone, ViewChild, ElementRef, inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { LabDemoLayoutComponent } from '../../../shell/lab-demo-layout/lab-demo-layout.component';

/**
 * Morph Menu — THE.LAB / Navigation.
 *
 * Плавающий «blob»-индикатор плавно морфится между пунктами меню:
 * позиция и размер догоняют цель через lerp в requestAnimationFrame.
 */
const MORPH_LERP = 0.14;
const MORPH_RADIUS = 22;
const MORPH_DURATION = 420;

const DEBUG_STROKE = 'rgba(245, 158, 11, 0.55)';
const DEBUG_SOFT = 'rgba(245, 158, 11, 0.22)';

interface MenuItem {
  label: string;
  icon: string;
}

@Component({
  selector: 'app-morph-menu',
  standalone: true,
  imports: [CommonModule, LabDemoLayoutComponent],
  styleUrls: ['./morph-menu.component.scss'],
  templateUrl: './morph-menu.component.html',
})
export class MorphMenuComponent implements AfterViewInit, OnDestroy {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly ngZone = inject(NgZone);

  @ViewChild('sceneHost') sceneHostRef!: ElementRef<HTMLElement>;

  items: MenuItem[] = [
    { label: 'Home', icon: '⌂' },
    { label: 'Work', icon: '◈' },
    { label: 'Lab', icon: '⚗' },
    { label: 'About', icon: '◎' },
    { label: 'Contact', icon: '✉' },
  ];

  activeIndex = 0;
  hoverIndex: number | null = null;
  morphLerp = MORPH_LERP;
  morphRadius = MORPH_RADIUS;
  morphDuration = MORPH_DURATION;

  private sceneEl: HTMLElement | null = null;
  private barEl: HTMLElement | null = null;
  private blobEl: HTMLElement | null = null;
  private itemEls: HTMLElement[] = [];
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

    this.barEl = this.sceneEl.querySelector<HTMLElement>('.js-morph-bar');
    this.blobEl = this.sceneEl.querySelector<HTMLElement>('.js-morph-blob');
    this.itemEls = Array.from(this.sceneEl.querySelectorAll<HTMLElement>('.js-morph-item'));

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

  selectItem(index: number) {
    this.activeIndex = index;
    this.syncTarget(index);
  }

  onItemEnter(index: number) {
    this.hoverIndex = index;
    this.syncTarget(index);
  }

  onItemLeave() {
    this.hoverIndex = null;
    this.syncTarget(this.activeIndex);
  }

  reset() {
    this.activeIndex = 0;
    this.hoverIndex = null;
    this.morphLerp = MORPH_LERP;
    this.morphRadius = MORPH_RADIUS;
    this.morphDuration = MORPH_DURATION;
    this.applyVars();
    this.syncTarget(0);
    this.snapBlob();
  }

  onParamChange(detail: { id: string; value: number }) {
    if (detail.id === 'morphLerp') this.morphLerp = detail.value;
    else if (detail.id === 'morphRadius') this.morphRadius = detail.value;
    else if (detail.id === 'morphDuration') this.morphDuration = detail.value;
    this.applyVars();
  }

  private applyVars() {
    const el = this.sceneHostRef?.nativeElement;
    if (!el) return;
    el.style.setProperty('--morph-lerp', String(this.morphLerp));
    el.style.setProperty('--morph-radius', `${this.morphRadius}px`);
    el.style.setProperty('--morph-duration', `${this.morphDuration}ms`);
  }

  private syncTarget(index: number) {
    const item = this.itemEls[index];
    if (!item || !this.barEl) return;

    const barRect = this.barEl.getBoundingClientRect();
    const rect = item.getBoundingClientRect();
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

    ctx.strokeStyle = DEBUG_SOFT;
    ctx.lineWidth = 1;
    ctx.strokeRect(barX, barY, barRect.width, barRect.height);

    ctx.setLineDash([4, 4]);
    ctx.strokeRect(barX + this.currentX, barY + this.currentY, this.currentW, this.currentH);
    ctx.setLineDash([]);

    ctx.strokeStyle = DEBUG_STROKE;
    ctx.strokeRect(barX + this.targetX, barY + this.targetY, this.targetW, this.targetH);

    this.itemEls.forEach((item, i) => {
      const rect = item.getBoundingClientRect();
      const x = rect.left - sceneRect.left;
      const y = rect.top - sceneRect.top;
      const active = i === (this.hoverIndex ?? this.activeIndex);

      ctx.strokeStyle = active ? DEBUG_STROKE : DEBUG_SOFT;
      ctx.lineWidth = active ? 2 : 1;
      ctx.strokeRect(x, y, rect.width, rect.height);
    });
  }
}
