import { Component, AfterViewInit, OnDestroy, ViewChild, ElementRef, PLATFORM_ID, inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { LabDemoLayoutComponent } from '../../../shell/lab-demo-layout/lab-demo-layout.component';

/**
 * Responsive Tricks — THE.LAB / Layout.
 *
 * Container queries: layout морфится при изменении ширины контейнера.
 */
const CONTAINER_WIDTH = 72;
const TRANSITION_MS = 480;
const CARD_GAP = 14;

const DEBUG_STROKE = 'rgba(245, 158, 11, 0.55)';
const DEBUG_SOFT = 'rgba(245, 158, 11, 0.22)';

@Component({
  selector: 'app-responsive-tricks',
  standalone: true,
  imports: [CommonModule, LabDemoLayoutComponent],
  styleUrls: ['./responsive-tricks.component.scss'],
  templateUrl: './responsive-tricks.component.html',
})
export class ResponsiveTricksComponent implements AfterViewInit, OnDestroy {
  private readonly platformId = inject(PLATFORM_ID);

  @ViewChild('sceneHost') sceneHostRef!: ElementRef<HTMLElement>;
  @ViewChild('stageHost') stageHostRef!: ElementRef<HTMLElement>;

  cards = [
    { title: 'Layout', icon: '▦' },
    { title: 'Grid', icon: '▤' },
    { title: 'Flex', icon: '☰' },
    { title: 'Flow', icon: '↔' },
    { title: 'Stack', icon: '▥' },
    { title: 'Fluid', icon: '◈' },
  ];

  containerWidth = CONTAINER_WIDTH;
  transitionMs = TRANSITION_MS;
  cardGap = CARD_GAP;

  private draggingWidth = false;
  private handleEl: HTMLElement | null = null;
  private activePointerId: number | null = null;
  private readonly boundMove = (e: PointerEvent) => this.onWidthPointerMove(e);
  private readonly boundUp = () => this.onWidthPointerUp();

  ngAfterViewInit() {
    this.applyVars();
  }

  ngOnDestroy() {
    this.draggingWidth = false;
    if (isPlatformBrowser(this.platformId)) {
      this.releasePointerCaptureSafe();
      this.unbindDrag();
    }
    this.handleEl = null;
  }

  reset() {
    this.containerWidth = CONTAINER_WIDTH;
    this.transitionMs = TRANSITION_MS;
    this.cardGap = CARD_GAP;
    this.applyVars();
  }

  onWidthInput(event: Event) {
    const value = Number((event.target as HTMLInputElement).value);
    this.setContainerWidth(value);
  }

  onWidthHandleDown(event: PointerEvent) {
    event.preventDefault();
    this.draggingWidth = true;
    this.handleEl = event.currentTarget as HTMLElement;
    this.activePointerId = event.pointerId;
    this.handleEl.setPointerCapture(event.pointerId);

    if (isPlatformBrowser(this.platformId)) {
      window.addEventListener('pointermove', this.boundMove);
      window.addEventListener('pointerup', this.boundUp);
      window.addEventListener('pointercancel', this.boundUp);
    }

    this.onWidthPointerMove(event);
  }

  onParamChange(detail: { id: string; value: number }) {
    if (detail.id === 'containerWidth') this.setContainerWidth(detail.value);
    else if (detail.id === 'transitionMs') this.transitionMs = detail.value;
    else if (detail.id === 'cardGap') this.cardGap = detail.value;
    this.applyVars();
  }

  private onWidthPointerMove(event: PointerEvent) {
    if (!this.draggingWidth) return;

    const stageEl = this.stageHostRef?.nativeElement;
    if (!stageEl) return;

    const rect = stageEl.getBoundingClientRect();
    const pct = ((event.clientX - rect.left) / rect.width) * 100;
    this.setContainerWidth(Math.round(Math.max(35, Math.min(100, pct))));
  }

  private onWidthPointerUp() {
    this.draggingWidth = false;
    this.unbindDrag();
    this.releasePointerCaptureSafe();
    this.handleEl = null;
    this.activePointerId = null;
  }

  private setContainerWidth(value: number) {
    this.containerWidth = value;
    this.applyVars();
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
    const el = this.sceneHostRef?.nativeElement;
    if (!el) return;
    el.style.setProperty('--container-width', `${this.containerWidth}%`);
    el.style.setProperty('--transition-ms', `${this.transitionMs}ms`);
    el.style.setProperty('--card-gap', `${this.cardGap}px`);
  }

  drawDebug({ ctx, width, height }: { ctx: CanvasRenderingContext2D; width: number; height: number }) {
    ctx.clearRect(0, 0, width, height);
    const scene = this.sceneHostRef?.nativeElement;
    if (!scene) return;

    const sceneRect = scene.getBoundingClientRect();
    const container = scene.querySelector<HTMLElement>('.js-rq-container');
    if (container) {
      const rect = container.getBoundingClientRect();
      ctx.strokeStyle = DEBUG_STROKE;
      ctx.lineWidth = 2;
      ctx.strokeRect(rect.left - sceneRect.left, rect.top - sceneRect.top, rect.width, rect.height);
    }

    scene.querySelectorAll<HTMLElement>('.js-rq-card').forEach((card) => {
      const rect = card.getBoundingClientRect();
      ctx.strokeStyle = DEBUG_SOFT;
      ctx.strokeRect(rect.left - sceneRect.left, rect.top - sceneRect.top, rect.width, rect.height);
    });
  }
}
