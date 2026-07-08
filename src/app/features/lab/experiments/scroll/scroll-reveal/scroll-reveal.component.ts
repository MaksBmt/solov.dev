import {
  Component,
  AfterViewInit,
  OnDestroy,
  PLATFORM_ID,
  ViewChild,
  ElementRef,
  inject,
  NgZone,
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { LabDemoLayoutComponent } from '../../../shell/lab-demo-layout/lab-demo-layout.component';

/**
 * Scroll Reveal — THE.LAB / Scroll.
 *
 * IntersectionObserver на scroll-контейнере demo: блоки получают
 * is-visible при входе в viewport и анимируют opacity + transform.
 */
const THRESHOLD = 0.22;
const ROOT_MARGIN_BOTTOM = -8;
const REVEAL_DISTANCE = 36;
const DURATION = 620;
const STAGGER = 80;
const ITEM_COUNT = 12;

const DEBUG_STROKE = 'rgba(245, 158, 11, 0.55)';
const DEBUG_SOFT = 'rgba(245, 158, 11, 0.22)';
const DEBUG_VISIBLE = 'rgba(52, 211, 153, 0.28)';

type RevealVariant = 'fade-up' | 'fade-left' | 'fade-right' | 'scale';

interface RevealItem {
  index: number;
  label: string;
  title: string;
  subtitle: string;
  variant: RevealVariant;
  tone: 'amber' | 'violet' | 'emerald' | 'cyan' | 'rose' | 'zinc';
  visible: boolean;
}

const ITEM_CONTENT: Omit<RevealItem, 'index' | 'visible'>[] = [
  {
    label: '01',
    title: 'Fade up',
    subtitle: 'Классика: блок поднимается снизу и проявляется',
    variant: 'fade-up',
    tone: 'amber',
  },
  {
    label: '02',
    title: 'Fade left',
    subtitle: 'Смещение по X — контент «въезжает» слева',
    variant: 'fade-left',
    tone: 'violet',
  },
  {
    label: '03',
    title: 'Fade right',
    subtitle: 'Зеркальный вариант для чередования ритма',
    variant: 'fade-right',
    tone: 'emerald',
  },
  {
    label: '04',
    title: 'Scale in',
    subtitle: 'Лёгкое увеличение + opacity — акцент на появлении',
    variant: 'scale',
    tone: 'cyan',
  },
  {
    label: '05',
    title: 'Stagger',
    subtitle: 'Задержка по индексу — каскад между соседними блоками',
    variant: 'fade-up',
    tone: 'rose',
  },
  {
    label: '06',
    title: 'One-shot',
    subtitle: 'После reveal observer отписывается — без повторной анимации',
    variant: 'fade-up',
    tone: 'zinc',
  },
  {
    label: '07',
    title: 'Observer root',
    subtitle: 'Root = scroll-контейнер demo, а не window — локальный viewport',
    variant: 'fade-left',
    tone: 'amber',
  },
  {
    label: '08',
    title: 'Root margin',
    subtitle: 'Сдвиг границы срабатывания — reveal раньше или позже',
    variant: 'fade-right',
    tone: 'violet',
  },
  {
    label: '09',
    title: 'Threshold',
    subtitle: 'Часть блока должна войти в зону, прежде чем стартует анимация',
    variant: 'scale',
    tone: 'emerald',
  },
  {
    label: '10',
    title: 'CSS transition',
    subtitle: 'Opacity и transform — без JS на каждый кадр',
    variant: 'fade-up',
    tone: 'cyan',
  },
  {
    label: '11',
    title: 'Reduced motion',
    subtitle: 'При prefers-reduced-motion блоки видны сразу, без анимации',
    variant: 'fade-left',
    tone: 'rose',
  },
  {
    label: '12',
    title: 'Scroll rhythm',
    subtitle: 'Чередование направлений держит внимание при длинной ленте',
    variant: 'fade-right',
    tone: 'zinc',
  },
  {
    label: '13',
    title: 'Progress track',
    subtitle: 'Счётчик revealed и scroll progress — в Debug и внизу списка',
    variant: 'scale',
    tone: 'amber',
  },
  {
    label: '14',
    title: 'Finale',
    subtitle: 'Последний блок — проверка, что цепочка reveal не обрывается',
    variant: 'fade-up',
    tone: 'violet',
  },
];

@Component({
  selector: 'app-scroll-reveal',
  standalone: true,
  imports: [CommonModule, LabDemoLayoutComponent],
  styleUrls: ['./scroll-reveal.component.scss'],
  templateUrl: './scroll-reveal.component.html',
})
export class ScrollRevealComponent implements AfterViewInit, OnDestroy {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly ngZone = inject(NgZone);

  @ViewChild('scrollHost') scrollHostRef!: ElementRef<HTMLElement>;
  @ViewChild('varsHost') varsHostRef!: ElementRef<HTMLElement>;

  threshold = THRESHOLD;
  rootMarginBottom = ROOT_MARGIN_BOTTOM;
  revealDistance = REVEAL_DISTANCE;
  duration = DURATION;
  stagger = STAGGER;
  itemCount = ITEM_COUNT;

  items: RevealItem[] = this.buildItems(ITEM_COUNT);
  visibleCount = 0;
  scrollProgress = 0;

  private scrollEl: HTMLElement | null = null;
  private varsEl: HTMLElement | null = null;
  private itemElements: HTMLElement[] = [];
  private observer: IntersectionObserver | null = null;
  private reducedMotion = false;
  private rafId: number | null = null;
  private scrollScheduled = false;

  private readonly boundOnScroll = () => this.scheduleScrollUpdate();

  ngAfterViewInit() {
    if (!isPlatformBrowser(this.platformId)) return;

    this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.scrollEl = this.scrollHostRef?.nativeElement ?? null;
    this.varsEl = this.varsHostRef?.nativeElement ?? null;

    if (!this.scrollEl) return;

    this.collectItems();
    this.applyMotionVars();
    this.scrollEl.addEventListener('scroll', this.boundOnScroll, { passive: true });

    if (this.reducedMotion) {
      this.revealAllImmediately();
    } else {
      this.setupObserver();
    }

    this.updateScrollProgress();
  }

  ngOnDestroy() {
    if (!isPlatformBrowser(this.platformId)) return;

    if (this.rafId !== null) cancelAnimationFrame(this.rafId);
    this.observer?.disconnect();
    this.scrollEl?.removeEventListener('scroll', this.boundOnScroll);
  }

  reset() {
    this.threshold = THRESHOLD;
    this.rootMarginBottom = ROOT_MARGIN_BOTTOM;
    this.revealDistance = REVEAL_DISTANCE;
    this.duration = DURATION;
    this.stagger = STAGGER;
    this.itemCount = ITEM_COUNT;
    this.items = this.buildItems(ITEM_COUNT);
    this.visibleCount = 0;

    queueMicrotask(() => {
      this.collectItems();
      this.applyMotionVars();
      if (this.scrollEl) this.scrollEl.scrollTop = 0;

      this.observer?.disconnect();
      if (this.reducedMotion) {
        this.revealAllImmediately();
      } else {
        this.setupObserver();
      }

      this.updateScrollProgress();
      this.syncVars();
    });
  }

  onParamChange(detail: { id: string; value: number; silent?: boolean }) {
    if (detail.id === 'threshold') this.threshold = detail.value;
    else if (detail.id === 'rootMarginBottom') this.rootMarginBottom = detail.value;
    else if (detail.id === 'revealDistance') this.revealDistance = detail.value;
    else if (detail.id === 'duration') this.duration = detail.value;
    else if (detail.id === 'stagger') this.stagger = detail.value;
    else if (detail.id === 'itemCount') {
      this.itemCount = Math.round(detail.value);
      this.items = this.buildItems(this.itemCount);
      this.visibleCount = 0;
    }

    queueMicrotask(() => {
      this.collectItems();
      this.applyMotionVars();

      if (detail.id === 'itemCount') {
        if (this.scrollEl) this.scrollEl.scrollTop = 0;
        this.observer?.disconnect();
        if (this.reducedMotion) {
          this.revealAllImmediately();
        } else {
          this.setupObserver();
        }
      } else if (!this.reducedMotion) {
        this.observer?.disconnect();
        this.setupObserver();
      }

      this.updateScrollProgress();
      this.syncVars();
    });
  }

  private buildItems(count: number): RevealItem[] {
    return Array.from({ length: count }, (_, index) => {
      const source = ITEM_CONTENT[index % ITEM_CONTENT.length];
      const cycle = Math.floor(index / ITEM_CONTENT.length);
      const label = cycle > 0
        ? `${String((index % ITEM_CONTENT.length) + 1).padStart(2, '0')}.${cycle + 1}`
        : source.label;

      return {
        ...source,
        label,
        index,
        visible: false,
      };
    });
  }

  private collectItems() {
    if (!this.scrollEl) {
      this.itemElements = [];
      return;
    }

    this.itemElements = Array.from(this.scrollEl.querySelectorAll<HTMLElement>('.js-reveal-item'));
  }

  private applyMotionVars() {
    if (!this.scrollEl) return;

    this.scrollEl.style.setProperty('--reveal-distance', `${this.revealDistance}px`);
    this.scrollEl.style.setProperty('--reveal-duration', `${this.duration}ms`);
    this.scrollEl.style.setProperty('--reveal-stagger', `${this.stagger}ms`);
    this.scrollEl.style.setProperty('--reveal-threshold', String(this.threshold));
  }

  private setupObserver() {
    if (!this.scrollEl) return;

    this.observer?.disconnect();

    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;

          const element = entry.target as HTMLElement;
          const index = Number(element.dataset['index'] ?? -1);
          if (index < 0) return;

          this.ngZone.run(() => {
            const item = this.items[index];
            if (!item || item.visible) return;

            item.visible = true;
            this.visibleCount += 1;
            this.syncVars();
          });

          this.observer?.unobserve(element);
        });
      },
      {
        root: this.scrollEl,
        threshold: this.threshold,
        rootMargin: `0px 0px ${this.rootMarginBottom}% 0px`,
      },
    );

    this.itemElements.forEach((element) => {
      const index = Number(element.dataset['index'] ?? -1);
      const item = this.items[index];
      if (item?.visible) return;
      this.observer?.observe(element);
    });
  }

  private revealAllImmediately() {
    this.items.forEach((item) => {
      item.visible = true;
    });
    this.visibleCount = this.items.length;
    this.syncVars();
  }

  private scheduleScrollUpdate() {
    if (this.scrollScheduled) return;
    this.scrollScheduled = true;
    this.rafId = requestAnimationFrame(() => {
      this.scrollScheduled = false;
      this.rafId = null;
      this.updateScrollProgress();
    });
  }

  private updateScrollProgress() {
    if (!this.scrollEl) return;

    const maxScroll = Math.max(1, this.scrollEl.scrollHeight - this.scrollEl.clientHeight);
    this.scrollProgress = this.scrollEl.scrollTop / maxScroll;
    this.syncVars();
  }

  private syncVars() {
    if (!this.varsEl) return;

    this.varsEl.style.setProperty('--scroll-progress', this.scrollProgress.toFixed(3));
    this.varsEl.style.setProperty('--visible-count', String(this.visibleCount));
    this.varsEl.style.setProperty('--item-count', String(this.items.length));
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
    const rootBottom = scrollRect.height * (1 + this.rootMarginBottom / 100);

    ctx.beginPath();
    ctx.setLineDash([6, 4]);
    ctx.strokeStyle = DEBUG_SOFT;
    ctx.lineWidth = 1;
    ctx.moveTo(12, rootBottom);
    ctx.lineTo(width - 12, rootBottom);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = DEBUG_SOFT;
    ctx.font = '10px monospace';
    ctx.fillText(`threshold ${this.threshold.toFixed(2)} · rootMargin bottom ${this.rootMarginBottom}%`, 14, rootBottom - 6);

    this.itemElements.forEach((element) => {
      const rect = element.getBoundingClientRect();
      const x = rect.left - scrollRect.left;
      const y = rect.top - scrollRect.top;
      const index = Number(element.dataset['index'] ?? -1);
      const item = this.items[index];
      const isVisible = item?.visible ?? false;

      if (isVisible) {
        ctx.fillStyle = DEBUG_VISIBLE;
        ctx.fillRect(x, y, rect.width, rect.height);
      }

      ctx.strokeStyle = isVisible ? 'rgba(52, 211, 153, 0.75)' : DEBUG_STROKE;
      ctx.lineWidth = isVisible ? 2 : 1;
      ctx.strokeRect(x, y, rect.width, rect.height);

      ctx.fillStyle = isVisible ? 'rgba(52, 211, 153, 0.9)' : DEBUG_STROKE;
      ctx.font = '10px monospace';
      ctx.fillText(`${item?.variant ?? '?'} · ${isVisible ? 'visible' : 'hidden'}`, x + 8, y + 16);
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
