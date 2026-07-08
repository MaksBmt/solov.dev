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
 * Timeline — THE.LAB / Scroll.
 *
 * Вертикальная лента: линия прогресса и узлы активируются
 * по scroll progress внутри demo-контейнера.
 */
const NODE_COUNT = 7;
const NODE_GAP = 132;
const LINE_WIDTH = 3;
const ACTIVATION_BIAS = 0.42;

const DEBUG_STROKE = 'rgba(245, 158, 11, 0.55)';
const DEBUG_SOFT = 'rgba(245, 158, 11, 0.22)';
const DEBUG_ACTIVE = 'rgba(52, 211, 153, 0.35)';

interface TimelineNode {
  index: number;
  label: string;
  title: string;
  subtitle: string;
  tone: 'amber' | 'violet' | 'emerald' | 'cyan' | 'rose' | 'zinc';
}

const NODE_CONTENT: Omit<TimelineNode, 'index'>[] = [
  { label: '01', title: 'Brief', subtitle: 'Старт ленты — scroll progress = 0', tone: 'amber' },
  { label: '02', title: 'Wireframe', subtitle: 'Линия растёт вместе с прокруткой', tone: 'violet' },
  { label: '03', title: 'Design', subtitle: 'Узел активируется у линии активации', tone: 'emerald' },
  { label: '04', title: 'Prototype', subtitle: 'CSS Variables: --timeline-progress', tone: 'cyan' },
  { label: '05', title: 'Review', subtitle: 'requestAnimationFrame на scroll', tone: 'rose' },
  { label: '06', title: 'Launch', subtitle: 'Предыдущие узлы остаются «пройденными»', tone: 'zinc' },
  { label: '07', title: 'Iterate', subtitle: 'Финал — progress близок к 1', tone: 'amber' },
  { label: '08', title: 'Scale', subtitle: 'Расширение сценария через debug', tone: 'violet' },
  { label: '09', title: 'Done', subtitle: 'Последний milestone', tone: 'emerald' },
];

@Component({
  selector: 'app-timeline',
  standalone: true,
  imports: [CommonModule, LabDemoLayoutComponent],
  styleUrls: ['./timeline.component.scss'],
  templateUrl: './timeline.component.html',
})
export class TimelineComponent implements AfterViewInit, OnDestroy {
  private readonly platformId = inject(PLATFORM_ID);

  @ViewChild('scrollHost') scrollHostRef!: ElementRef<HTMLElement>;
  @ViewChild('varsHost') varsHostRef!: ElementRef<HTMLElement>;
  @ViewChild('railHost') railHostRef!: ElementRef<HTMLElement>;

  nodeCount = NODE_COUNT;
  nodeGap = NODE_GAP;
  lineWidth = LINE_WIDTH;
  activationBias = ACTIVATION_BIAS;

  nodes: TimelineNode[] = this.buildNodes(NODE_COUNT);
  activeIndex = 0;
  lineProgress = 0;
  scrollProgress = 0;

  private scrollEl: HTMLElement | null = null;
  private varsEl: HTMLElement | null = null;
  private railEl: HTMLElement | null = null;
  private nodeElements: HTMLElement[] = [];
  private rafId: number | null = null;
  private scrollScheduled = false;

  private readonly boundOnScroll = () => this.scheduleUpdate();

  ngAfterViewInit() {
    if (!isPlatformBrowser(this.platformId)) return;

    this.scrollEl = this.scrollHostRef?.nativeElement ?? null;
    this.varsEl = this.varsHostRef?.nativeElement ?? null;
    this.railEl = this.railHostRef?.nativeElement ?? null;

    if (!this.scrollEl) return;

    this.collectNodes();
    this.applyLayoutVars();
    this.scrollEl.addEventListener('scroll', this.boundOnScroll, { passive: true });
    this.updateTimeline();
  }

  ngOnDestroy() {
    if (!isPlatformBrowser(this.platformId)) return;

    if (this.rafId !== null) cancelAnimationFrame(this.rafId);
    this.scrollEl?.removeEventListener('scroll', this.boundOnScroll);
  }

  reset() {
    this.nodeCount = NODE_COUNT;
    this.nodeGap = NODE_GAP;
    this.lineWidth = LINE_WIDTH;
    this.activationBias = ACTIVATION_BIAS;
    this.nodes = this.buildNodes(NODE_COUNT);

    queueMicrotask(() => {
      this.collectNodes();
      this.applyLayoutVars();
      if (this.scrollEl) this.scrollEl.scrollTop = 0;
      this.updateTimeline();
    });
  }

  onParamChange(detail: { id: string; value: number }) {
    if (detail.id === 'nodeCount') {
      this.nodeCount = Math.round(detail.value);
      this.nodes = this.buildNodes(this.nodeCount);
    } else if (detail.id === 'nodeGap') this.nodeGap = detail.value;
    else if (detail.id === 'lineWidth') this.lineWidth = detail.value;
    else if (detail.id === 'activationBias') this.activationBias = detail.value;

    queueMicrotask(() => {
      if (detail.id === 'nodeCount' && this.scrollEl) this.scrollEl.scrollTop = 0;
      this.collectNodes();
      this.applyLayoutVars();
      this.updateTimeline();
    });
  }

  private buildNodes(count: number): TimelineNode[] {
    return Array.from({ length: count }, (_, index) => ({
      ...NODE_CONTENT[index % NODE_CONTENT.length],
      index,
    }));
  }

  private collectNodes() {
    if (!this.scrollEl) {
      this.nodeElements = [];
      return;
    }

    this.nodeElements = Array.from(this.scrollEl.querySelectorAll<HTMLElement>('.js-timeline-node'));
  }

  private applyLayoutVars() {
    if (!this.scrollEl) return;

    this.scrollEl.style.setProperty('--node-gap', `${this.nodeGap}px`);
    this.scrollEl.style.setProperty('--line-width', `${this.lineWidth}px`);
    this.scrollEl.style.setProperty('--activation-bias', String(this.activationBias));
  }

  private scheduleUpdate() {
    if (this.scrollScheduled) return;
    this.scrollScheduled = true;
    this.rafId = requestAnimationFrame(() => {
      this.scrollScheduled = false;
      this.rafId = null;
      this.updateTimeline();
    });
  }

  private updateTimeline() {
    if (!this.scrollEl || this.nodeElements.length === 0) return;

    const scrollTop = this.scrollEl.scrollTop;
    const viewportH = this.scrollEl.clientHeight;
    const maxScroll = Math.max(1, this.scrollEl.scrollHeight - viewportH);
    this.scrollProgress = scrollTop / maxScroll;

    const activationY = scrollTop + viewportH * this.activationBias;
    let activeIndex = 0;

    const firstCenter = this.getNodeCenterY(this.nodeElements[0]);
    const lastCenter = this.getNodeCenterY(this.nodeElements[this.nodeElements.length - 1]);
    const span = Math.max(1, lastCenter - firstCenter);
    this.lineProgress = Math.min(1, Math.max(0, (activationY - firstCenter) / span));

    this.nodeElements.forEach((element, index) => {
      const centerY = this.getNodeCenterY(element);
      if (centerY <= activationY + 2) activeIndex = index;
    });

    this.activeIndex = activeIndex;

    if (this.railEl) {
      this.railEl.style.setProperty('--timeline-progress', this.lineProgress.toFixed(3));
    }

    if (this.varsEl) {
      this.varsEl.style.setProperty('--scroll-progress', this.scrollProgress.toFixed(3));
      this.varsEl.style.setProperty('--timeline-progress', this.lineProgress.toFixed(3));
      this.varsEl.style.setProperty('--active-index', String(this.activeIndex));
    }
  }

  private getNodeCenterY(element: HTMLElement): number {
    if (!this.scrollEl) return 0;
    const scrollTop = this.scrollEl.scrollTop;
    const hostTop = this.scrollEl.getBoundingClientRect().top;
    const rect = element.getBoundingClientRect();
    return rect.top - hostTop + scrollTop + rect.height / 2;
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
    const activationViewportY = this.scrollEl.clientHeight * this.activationBias;

    ctx.beginPath();
    ctx.setLineDash([5, 4]);
    ctx.strokeStyle = DEBUG_SOFT;
    ctx.lineWidth = 1;
    ctx.moveTo(12, activationViewportY);
    ctx.lineTo(width - 12, activationViewportY);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = DEBUG_SOFT;
    ctx.font = '10px monospace';
    ctx.fillText('activation line', 14, activationViewportY - 6);

    this.nodeElements.forEach((element, index) => {
      const rect = element.getBoundingClientRect();
      const x = rect.left - scrollRect.left;
      const y = rect.top - scrollRect.top;
      const isActive = index === this.activeIndex;
      const isPassed = index <= this.activeIndex;

      if (isPassed) {
        ctx.fillStyle = DEBUG_ACTIVE;
        ctx.fillRect(x, y, rect.width, rect.height);
      }

      ctx.strokeStyle = isActive ? 'rgba(52, 211, 153, 0.85)' : DEBUG_STROKE;
      ctx.lineWidth = isActive ? 2 : 1;
      ctx.strokeRect(x, y, rect.width, rect.height);
    });

    const barX = width - 18;
    const barTop = 16;
    const barHeight = height - 32;
    ctx.fillStyle = 'rgba(244, 244, 245, 0.08)';
    ctx.fillRect(barX, barTop, 6, barHeight);
    ctx.fillStyle = DEBUG_STROKE;
    ctx.fillRect(barX, barTop + barHeight * (1 - this.scrollProgress), 6, barHeight * this.scrollProgress);
  }
}
