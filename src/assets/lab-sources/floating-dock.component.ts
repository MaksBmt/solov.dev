import { Component, AfterViewInit, OnDestroy, PLATFORM_ID, NgZone, ViewChild, ElementRef, inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { LabDemoLayoutComponent } from '../../../shell/lab-demo-layout/lab-demo-layout.component';

/**
 * Floating Dock — THE.LAB / Navigation.
 *
 * macOS-подобный dock: иконки масштабируются по близости курсора
 * с плавной интерполяцией в requestAnimationFrame.
 */
const DOCK_LERP = 0.18;
const ICON_SCALE = 1.65;
const MAGNET_RADIUS = 120;

const DEBUG_STROKE = 'rgba(245, 158, 11, 0.55)';
const DEBUG_SOFT = 'rgba(245, 158, 11, 0.22)';

interface DockItem {
  label: string;
  icon: string;
  color: string;
}

interface DockElement {
  element: HTMLElement;
  currentScale: number;
  targetScale: number;
}

@Component({
  selector: 'app-floating-dock',
  standalone: true,
  imports: [CommonModule, LabDemoLayoutComponent],
  styleUrls: ['./floating-dock.component.scss'],
  templateUrl: './floating-dock.component.html',
})
export class FloatingDockComponent implements AfterViewInit, OnDestroy {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly ngZone = inject(NgZone);

  @ViewChild('sceneHost') sceneHostRef!: ElementRef<HTMLElement>;

  items: DockItem[] = [
    { label: 'Finder', icon: '◆', color: 'cyan' },
    { label: 'Safari', icon: '◎', color: 'blue' },
    { label: 'Mail', icon: '✉', color: 'amber' },
    { label: 'Photos', icon: '▣', color: 'violet' },
    { label: 'Music', icon: '♫', color: 'rose' },
    { label: 'Settings', icon: '⚙', color: 'zinc' },
  ];

  dockLerp = DOCK_LERP;
  iconScale = ICON_SCALE;
  magnetRadius = MAGNET_RADIUS;
  activeIndex = 2;

  private sceneEl: HTMLElement | null = null;
  private dockEls: DockElement[] = [];
  private pointer: { x: number; y: number } | null = null;
  private rafId: number | null = null;
  private reducedMotion = false;
  private readonly boundTick = () => this.tick();
  private readonly boundOnPointerMove = (e: PointerEvent) => this.onPointerMove(e);
  private readonly boundOnPointerLeave = () => this.onPointerLeave();

  ngAfterViewInit() {
    if (!isPlatformBrowser(this.platformId)) return;

    this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.sceneEl = this.sceneHostRef?.nativeElement ?? null;
    if (!this.sceneEl) return;

    this.dockEls = Array.from(this.sceneEl.querySelectorAll<HTMLElement>('.js-dock-item')).map((element) => ({
      element,
      currentScale: 1,
      targetScale: 1,
    }));

    this.applyVars();

    this.sceneEl.addEventListener('pointermove', this.boundOnPointerMove);
    this.sceneEl.addEventListener('pointerleave', this.boundOnPointerLeave);

    this.ngZone.runOutsideAngular(() => {
      this.rafId = requestAnimationFrame(this.boundTick);
    });
  }

  ngOnDestroy() {
    if (!isPlatformBrowser(this.platformId)) return;
    if (this.rafId !== null) cancelAnimationFrame(this.rafId);
    if (!this.sceneEl) return;
    this.sceneEl.removeEventListener('pointermove', this.boundOnPointerMove);
    this.sceneEl.removeEventListener('pointerleave', this.boundOnPointerLeave);
  }

  selectItem(index: number) {
    this.activeIndex = index;
  }

  onPointerMove(event: PointerEvent) {
    this.pointer = { x: event.clientX, y: event.clientY };
  }

  onPointerLeave() {
    this.pointer = null;
  }

  reset() {
    this.pointer = null;
    this.activeIndex = 2;
    this.dockLerp = DOCK_LERP;
    this.iconScale = ICON_SCALE;
    this.magnetRadius = MAGNET_RADIUS;
    this.dockEls.forEach((item) => {
      item.currentScale = 1;
      item.targetScale = 1;
      this.applyScale(item);
    });
    this.applyVars();
  }

  onParamChange(detail: { id: string; value: number }) {
    if (detail.id === 'dockLerp') this.dockLerp = detail.value;
    else if (detail.id === 'iconScale') this.iconScale = detail.value;
    else if (detail.id === 'magnetRadius') this.magnetRadius = detail.value;
    this.applyVars();
  }

  private applyVars() {
    const el = this.sceneHostRef?.nativeElement;
    if (!el) return;
    el.style.setProperty('--dock-lerp', String(this.dockLerp));
    el.style.setProperty('--icon-scale', String(this.iconScale));
    el.style.setProperty('--magnet-radius', `${this.magnetRadius}px`);
  }

  private tick() {
    this.dockEls.forEach((item) => {
      this.updateTarget(item);
      const lerp = this.reducedMotion ? 1 : this.dockLerp;
      item.currentScale += (item.targetScale - item.currentScale) * lerp;
      this.applyScale(item);
    });
    this.rafId = requestAnimationFrame(this.boundTick);
  }

  private updateTarget(item: DockElement) {
    if (!this.pointer || this.reducedMotion) {
      item.targetScale = 1;
      return;
    }

    const rect = item.element.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const distance = Math.hypot(this.pointer.x - cx, this.pointer.y - cy);

    if (distance > this.magnetRadius) {
      item.targetScale = 1;
      return;
    }

    const falloff = 1 - distance / this.magnetRadius;
    const eased = falloff * falloff;
    item.targetScale = 1 + (this.iconScale - 1) * eased;
  }

  private applyScale(item: DockElement) {
    item.element.style.setProperty('--item-scale', item.currentScale.toFixed(3));
  }

  drawDebug({ ctx, width, height }: { ctx: CanvasRenderingContext2D; width: number; height: number }) {
    ctx.clearRect(0, 0, width, height);
    if (!this.sceneEl) return;

    const sceneRect = this.sceneEl.getBoundingClientRect();

    this.dockEls.forEach((item) => {
      const rect = item.element.getBoundingClientRect();
      const cx = rect.left - sceneRect.left + rect.width / 2;
      const cy = rect.top - sceneRect.top + rect.height / 2;
      const scaled = rect.height * item.currentScale;

      ctx.beginPath();
      ctx.setLineDash([4, 6]);
      ctx.strokeStyle = DEBUG_SOFT;
      ctx.lineWidth = 1;
      ctx.arc(cx, cy, this.magnetRadius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.strokeStyle = item.currentScale > 1.05 ? DEBUG_STROKE : DEBUG_SOFT;
      ctx.lineWidth = item.currentScale > 1.05 ? 2 : 1;
      ctx.strokeRect(cx - rect.width / 2, cy - scaled / 2, rect.width, scaled);
    });

    if (this.pointer) {
      const px = this.pointer.x - sceneRect.left;
      const py = this.pointer.y - sceneRect.top;
      ctx.strokeStyle = 'rgba(244, 244, 245, 0.5)';
      ctx.beginPath();
      ctx.moveTo(px - 8, py);
      ctx.lineTo(px + 8, py);
      ctx.moveTo(px, py - 8);
      ctx.lineTo(px, py + 8);
      ctx.stroke();
    }
  }
}
