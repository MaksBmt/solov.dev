import {
  Component,
  AfterViewInit,
  OnDestroy,
  PLATFORM_ID,
  ViewChild,
  ElementRef,
  inject,
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { LabDemoLayoutComponent } from '../../../shell/lab-demo-layout/lab-demo-layout.component';

/**
 * Horizontal Scroll — THE.LAB / Scroll.
 *
 * Вертикальная прокрутка demo управляет translateX
 * горизонтальной ленты внутри sticky-viewport.
 */
const PANEL_COUNT = 6;
const SCENE_HEIGHT = 2100;
const PANEL_WIDTH = 260;
const PANEL_GAP = 18;

const DEBUG_STROKE = 'rgba(245, 158, 11, 0.55)';
const DEBUG_SOFT = 'rgba(245, 158, 11, 0.22)';

interface HorizontalPanel {
  index: number;
  label: string;
  title: string;
  subtitle: string;
  tone: 'amber' | 'violet' | 'emerald' | 'cyan' | 'rose' | 'zinc';
}

const PANEL_CONTENT: Omit<HorizontalPanel, 'index'>[] = [
  { label: '01', title: 'Start', subtitle: 'Вертикальный scroll → горизонтальный drift', tone: 'amber' },
  { label: '02', title: 'Gallery', subtitle: 'Sticky viewport держит сцену на месте', tone: 'violet' },
  { label: '03', title: 'Panels', subtitle: 'translate3d по оси X без scroll-snap', tone: 'emerald' },
  { label: '04', title: 'Progress', subtitle: 'scrollTop / maxScroll → progress 0…1', tone: 'cyan' },
  { label: '05', title: 'Momentum', subtitle: 'Плавное движение через requestAnimationFrame', tone: 'rose' },
  { label: '06', title: 'Finale', subtitle: 'Последняя панель у правого края', tone: 'zinc' },
  { label: '07', title: 'Extra', subtitle: 'Дополнительный кадр для длинной ленты', tone: 'amber' },
  { label: '08', title: 'End', subtitle: 'Конец горизонтального маршрута', tone: 'violet' },
];

@Component({
  selector: 'app-horizontal-scroll',
  standalone: true,
  imports: [CommonModule, LabDemoLayoutComponent],
  styleUrls: ['./horizontal-scroll.component.scss'],
  templateUrl: './horizontal-scroll.component.html',
})
export class HorizontalScrollComponent implements AfterViewInit, OnDestroy {
  private readonly platformId = inject(PLATFORM_ID);

  @ViewChild('scrollHost') scrollHostRef!: ElementRef<HTMLElement>;
  @ViewChild('varsHost') varsHostRef!: ElementRef<HTMLElement>;
  @ViewChild('stripHost') stripHostRef!: ElementRef<HTMLElement>;

  panelCount = PANEL_COUNT;
  sceneHeight = SCENE_HEIGHT;
  panelWidth = PANEL_WIDTH;
  panelGap = PANEL_GAP;

  panels: HorizontalPanel[] = this.buildPanels(PANEL_COUNT);
  activeIndex = 0;
  translateX = 0;
  scrollProgress = 0;

  private scrollEl: HTMLElement | null = null;
  private varsEl: HTMLElement | null = null;
  private stripEl: HTMLElement | null = null;
  private rafId: number | null = null;
  private scrollScheduled = false;
  private resizeObserver: ResizeObserver | null = null;

  private readonly boundOnScroll = () => this.scheduleUpdate();

  ngAfterViewInit() {
    if (!isPlatformBrowser(this.platformId)) return;

    this.scrollEl = this.scrollHostRef?.nativeElement ?? null;
    this.varsEl = this.varsHostRef?.nativeElement ?? null;
    this.stripEl = this.stripHostRef?.nativeElement ?? null;

    if (!this.scrollEl) return;

    this.applyLayoutVars();
    this.scrollEl.addEventListener('scroll', this.boundOnScroll, { passive: true });

    this.resizeObserver = new ResizeObserver(() => {
      this.updateViewportSize();
      this.updateHorizontal();
    });
    this.resizeObserver.observe(this.scrollEl);

    this.updateHorizontal();
  }

  ngOnDestroy() {
    if (!isPlatformBrowser(this.platformId)) return;

    if (this.rafId !== null) cancelAnimationFrame(this.rafId);
    this.resizeObserver?.disconnect();
    this.scrollEl?.removeEventListener('scroll', this.boundOnScroll);
  }

  reset() {
    this.panelCount = PANEL_COUNT;
    this.sceneHeight = SCENE_HEIGHT;
    this.panelWidth = PANEL_WIDTH;
    this.panelGap = PANEL_GAP;
    this.panels = this.buildPanels(PANEL_COUNT);

    queueMicrotask(() => {
      this.applyLayoutVars();
      if (this.scrollEl) this.scrollEl.scrollTop = 0;
      this.updateHorizontal();
    });
  }

  onParamChange(detail: { id: string; value: number }) {
    if (detail.id === 'panelCount') {
      this.panelCount = Math.round(detail.value);
      this.panels = this.buildPanels(this.panelCount);
    } else if (detail.id === 'sceneHeight') this.sceneHeight = detail.value;
    else if (detail.id === 'panelWidth') this.panelWidth = detail.value;
    else if (detail.id === 'panelGap') this.panelGap = detail.value;

    this.applyLayoutVars();
    if (detail.id === 'panelCount' && this.scrollEl) this.scrollEl.scrollTop = 0;
    this.updateHorizontal();
  }

  private buildPanels(count: number): HorizontalPanel[] {
    return Array.from({ length: count }, (_, index) => ({
      ...PANEL_CONTENT[index % PANEL_CONTENT.length],
      index,
    }));
  }

  private applyLayoutVars() {
    if (!this.scrollEl) return;

    this.scrollEl.style.setProperty('--scene-height', `${this.sceneHeight}px`);
    this.scrollEl.style.setProperty('--panel-width', `${this.panelWidth}px`);
    this.scrollEl.style.setProperty('--panel-gap', `${this.panelGap}px`);
    this.updateViewportSize();
  }

  private updateViewportSize() {
    if (!this.scrollEl) return;
    this.scrollEl.style.setProperty('--viewport-h', `${this.scrollEl.clientHeight}px`);
    this.scrollEl.style.setProperty('--viewport-w', `${this.scrollEl.clientWidth}px`);
  }

  private scheduleUpdate() {
    if (this.scrollScheduled) return;
    this.scrollScheduled = true;
    this.rafId = requestAnimationFrame(() => {
      this.scrollScheduled = false;
      this.rafId = null;
      this.updateHorizontal();
    });
  }

  private updateHorizontal() {
    if (!this.scrollEl) return;

    const scrollTop = this.scrollEl.scrollTop;
    const maxScroll = Math.max(1, this.scrollEl.scrollHeight - this.scrollEl.clientHeight);
    this.scrollProgress = scrollTop / maxScroll;

    const viewportW = this.scrollEl.clientWidth;
    const stripWidth = this.panelCount * this.panelWidth + (this.panelCount - 1) * this.panelGap;
    const maxShift = Math.max(0, stripWidth - viewportW + 32);
    this.translateX = -this.scrollProgress * maxShift;

    const panelSpan = this.panelWidth + this.panelGap;
    this.activeIndex = maxShift > 0
      ? Math.min(this.panelCount - 1, Math.round((Math.abs(this.translateX) / maxShift) * (this.panelCount - 1)))
      : 0;

    if (this.stripEl) {
      this.stripEl.style.transform = this.translateX === 0
        ? ''
        : `translate3d(${this.translateX.toFixed(2)}px, 0, 0)`;
    }

    if (this.varsEl) {
      this.varsEl.style.setProperty('--scroll-progress', this.scrollProgress.toFixed(3));
      this.varsEl.style.setProperty('--translate-x', `${this.translateX.toFixed(1)}px`);
      this.varsEl.style.setProperty('--active-index', String(this.activeIndex));
    }
  }

  drawDebug({
    ctx,
    width,
    height,
  }: {
    ctx: CanvasRenderingContext2D;
    width: number;
    height: number;
    pointer: { x: number; y: number } | null;
  }) {
    ctx.clearRect(0, 0, width, height);
    if (!this.scrollEl) return;

    const scrollRect = this.scrollEl.getBoundingClientRect();
    const panels = Array.from(this.scrollEl.querySelectorAll<HTMLElement>('.js-horizontal-panel'));

    panels.forEach((panel, index) => {
      const rect = panel.getBoundingClientRect();
      const x = rect.left - scrollRect.left;
      const y = rect.top - scrollRect.top;
      const isActive = index === this.activeIndex;

      ctx.strokeStyle = isActive ? DEBUG_STROKE : DEBUG_SOFT;
      ctx.lineWidth = isActive ? 2 : 1;
      ctx.strokeRect(x, y, rect.width, rect.height);
    });

    ctx.fillStyle = DEBUG_STROKE;
    ctx.font = '10px monospace';
    ctx.fillText(`x ${this.translateX.toFixed(0)}px · panel ${this.activeIndex + 1}`, 12, height - 14);
  }
}
