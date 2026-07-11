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
 * Stack Cards — THE.LAB / Scroll.
 *
 * Все карточки — sticky-сiblings в одном контейнере. У каждой свой top
 * (каскад), между ними margin-bottom создаёт прокрутку. Пока контейнер
 * не закончился — предыдущие слои остаются в стопке.
 */
const STICKY_TOP = 20;
const STACK_OFFSET = 28;
const SCALE_STEP = 0.04;
const SECTION_HEIGHT = 520;
const CARD_HEIGHT = 172;
const CARD_COUNT = 5;
const MIN_SCALE = 0.84;

const DEBUG_STROKE = 'rgba(245, 158, 11, 0.55)';
const DEBUG_SOFT = 'rgba(245, 158, 11, 0.22)';
const DEBUG_ACTIVE = 'rgba(253, 186, 116, 0.35)';

interface StackCardData {
  index: number;
  label: string;
  title: string;
  subtitle: string;
  tone: 'amber' | 'zinc' | 'emerald' | 'violet' | 'rose' | 'cyan';
}

const CARD_CONTENT: Omit<StackCardData, 'index'>[] = [
  { label: '01', title: 'Первая карточка', subtitle: 'Прилипнет первой — жёлтая вкладка', tone: 'amber' },
  { label: '02', title: 'Вторая поверх', subtitle: 'Фиолетовая ляжет на жёлтую', tone: 'violet' },
  { label: '03', title: 'Третий слой', subtitle: 'Стопка растёт вверх', tone: 'emerald' },
  { label: '04', title: 'Четвёртый слой', subtitle: 'Видны все цветные вкладки', tone: 'cyan' },
  { label: '05', title: 'Финал', subtitle: 'Последняя карточка наверху', tone: 'rose' },
  { label: '06', title: 'Шестой слой', subtitle: 'Длинная стопка', tone: 'zinc' },
];

@Component({
  selector: 'app-stack-cards',
  standalone: true,
  imports: [CommonModule, LabDemoLayoutComponent],
  styleUrls: ['./stack-cards.component.scss'],
  templateUrl: './stack-cards.component.html',
})
export class StackCardsComponent implements AfterViewInit, OnDestroy {
  private readonly platformId = inject(PLATFORM_ID);

  @ViewChild('scrollHost') scrollHostRef!: ElementRef<HTMLElement>;
  @ViewChild('varsHost') varsHostRef!: ElementRef<HTMLElement>;

  stickyTop = STICKY_TOP;
  stackOffset = STACK_OFFSET;
  scaleStep = SCALE_STEP;
  sectionHeight = SECTION_HEIGHT;
  cardCount = CARD_COUNT;
  sectionGap = SECTION_HEIGHT - CARD_HEIGHT;

  cards: StackCardData[] = this.buildCards(CARD_COUNT);

  activeIndex = 0;
  maxStackDepth = 0;
  scrollProgress = 0;

  private scrollEl: HTMLElement | null = null;
  private varsEl: HTMLElement | null = null;
  private cardElements: HTMLElement[] = [];
  private rafId: number | null = null;
  private scrollScheduled = false;
  private reducedMotion = false;
  private maxSafeScroll: number | null = null;
  private clampingScroll = false;

  private readonly boundOnScroll = () => this.scheduleUpdate();

  ngAfterViewInit() {
    if (!isPlatformBrowser(this.platformId)) return;

    this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.scrollEl = this.scrollHostRef?.nativeElement ?? null;
    this.varsEl = this.varsHostRef?.nativeElement ?? null;

    if (!this.scrollEl) return;

    this.collectCards();
    this.applyLayoutVars();
    this.measureMaxSafeScroll();
    this.scrollEl.addEventListener('scroll', this.boundOnScroll, { passive: true });
    this.updateStack();
  }

  ngOnDestroy() {
    if (!isPlatformBrowser(this.platformId)) return;

    if (this.rafId !== null) cancelAnimationFrame(this.rafId);
    this.scrollEl?.removeEventListener('scroll', this.boundOnScroll);
  }

  cardStickyTop(index: number): number {
    return this.stickyTop + index * this.stackOffset;
  }

  reset() {
    this.stickyTop = STICKY_TOP;
    this.stackOffset = STACK_OFFSET;
    this.scaleStep = SCALE_STEP;
    this.sectionHeight = SECTION_HEIGHT;
    this.cardCount = CARD_COUNT;
    this.sectionGap = SECTION_HEIGHT - CARD_HEIGHT;
    this.cards = this.buildCards(CARD_COUNT);

    queueMicrotask(() => {
      this.collectCards();
      this.applyLayoutVars();
      this.measureMaxSafeScroll();
      if (this.scrollEl) this.scrollEl.scrollTop = 0;
      this.updateStack();
    });
  }

  onParamChange(detail: { id: string; value: number; silent?: boolean }) {
    if (detail.id === 'stickyTop') {
      this.stickyTop = detail.value;
    } else if (detail.id === 'stackOffset') {
      this.stackOffset = detail.value;
    } else if (detail.id === 'scaleStep') {
      this.scaleStep = detail.value;
    } else if (detail.id === 'sectionHeight') {
      this.sectionHeight = detail.value;
      this.sectionGap = this.sectionHeight - CARD_HEIGHT;
    } else if (detail.id === 'cardCount') {
      const nextCount = Math.round(detail.value);
      if (nextCount !== this.cardCount) {
        this.cardCount = nextCount;
        this.cards = this.buildCards(nextCount);
        if (!detail.silent && this.scrollEl) {
          this.scrollEl.scrollTop = 0;
        }
        queueMicrotask(() => {
          this.collectCards();
          this.applyLayoutVars();
          this.measureMaxSafeScroll();
          this.updateStack();
        });
        return;
      }
    }

    this.applyLayoutVars();
    this.measureMaxSafeScroll();
    this.updateStack();
  }

  private buildCards(count: number): StackCardData[] {
    return Array.from({ length: count }, (_, index) => ({
      index,
      ...CARD_CONTENT[index % CARD_CONTENT.length],
    }));
  }

  private collectCards() {
    if (!this.scrollEl) {
      this.cardElements = [];
      return;
    }
    this.cardElements = Array.from(this.scrollEl.querySelectorAll<HTMLElement>('.js-stack-card'));
  }

  private applyLayoutVars() {
    if (!this.scrollEl) return;

    this.sectionGap = this.sectionHeight - CARD_HEIGHT;
    this.scrollEl.style.setProperty('--card-height', `${CARD_HEIGHT}px`);
    this.scrollEl.style.setProperty('--tail-height', `${this.sectionGap}px`);
  }

  private measureMaxSafeScroll() {
    if (!this.scrollEl || this.cardElements.length === 0) {
      this.maxSafeScroll = null;
      return;
    }

    const savedScroll = this.scrollEl.scrollTop;
    const maxScroll = this.scrollEl.scrollHeight - this.scrollEl.clientHeight;
    const scrollRect = this.scrollEl.getBoundingClientRect();
    let bestScroll = 0;
    let bestError = Number.POSITIVE_INFINITY;

    for (let scrollTop = 0; scrollTop <= maxScroll; scrollTop += 6) {
      this.scrollEl.scrollTop = scrollTop;
      const error = this.cardElements.reduce((sum, card, index) => {
        const top = card.getBoundingClientRect().top - scrollRect.top;
        return sum + Math.abs(top - this.cardStickyTop(index));
      }, 0);

      if (error < bestError) {
        bestError = error;
        bestScroll = scrollTop;
      }
    }

    this.scrollEl.scrollTop = savedScroll;
    this.maxSafeScroll = bestScroll;
  }

  private clampScrollPosition() {
    if (!this.scrollEl || this.maxSafeScroll === null || this.clampingScroll) return;

    if (this.scrollEl.scrollTop > this.maxSafeScroll) {
      this.clampingScroll = true;
      this.scrollEl.scrollTop = this.maxSafeScroll;
      this.clampingScroll = false;
    }
  }

  private scheduleUpdate() {
    if (this.scrollScheduled) return;
    this.scrollScheduled = true;
    this.rafId = requestAnimationFrame(() => {
      this.scrollScheduled = false;
      this.rafId = null;
      this.updateStack();
    });
  }

  private updateStack() {
    if (!this.scrollEl || this.cardElements.length === 0) return;

    this.clampScrollPosition();

    const scrollRect = this.scrollEl.getBoundingClientRect();
    let topCardIndex = 0;

    this.cardElements.forEach((card, index) => {
      const top = card.getBoundingClientRect().top - scrollRect.top;
      const stickyLine = this.cardStickyTop(index);
      if (top <= stickyLine + 2) {
        topCardIndex = index;
      }
    });

    this.activeIndex = topCardIndex;
    this.maxStackDepth = 0;

    this.cardElements.forEach((card, index) => {
      const depth = topCardIndex - index;
      card.dataset['stackDepth'] = String(Math.max(0, depth));

      if (depth > 0 && !this.reducedMotion) {
        const scale = Math.max(MIN_SCALE, 1 - depth * this.scaleStep);
        card.style.transform = `scale(${scale.toFixed(4)})`;
        card.style.filter = depth > 1 ? `brightness(${Math.max(0.82, 1 - depth * 0.04).toFixed(2)})` : '';
        this.maxStackDepth = Math.max(this.maxStackDepth, depth);
      } else {
        card.style.transform = '';
        card.style.filter = '';
      }

      card.style.zIndex = String(index + 1);
    });

    const maxScroll = this.maxSafeScroll ?? (this.scrollEl.scrollHeight - this.scrollEl.clientHeight);
    this.scrollProgress = maxScroll > 0 ? Math.min(1, this.scrollEl.scrollTop / maxScroll) : 0;

    if (this.varsEl) {
      this.varsEl.style.setProperty('--scroll-progress', this.scrollProgress.toFixed(3));
      this.varsEl.style.setProperty('--active-index', String(this.activeIndex));
      this.varsEl.style.setProperty('--stack-depth', String(this.maxStackDepth));
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

    for (let level = 0; level < this.cardCount; level += 1) {
      const y = this.cardStickyTop(level);
      ctx.beginPath();
      ctx.setLineDash([5, 5]);
      ctx.strokeStyle = level === this.activeIndex ? DEBUG_STROKE : DEBUG_SOFT;
      ctx.lineWidth = level === this.activeIndex ? 1.5 : 1;
      ctx.moveTo(12, y);
      ctx.lineTo(width - 12, y);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    this.cardElements.forEach((card, index) => {
      const rect = card.getBoundingClientRect();
      const x = rect.left - scrollRect.left;
      const y = rect.top - scrollRect.top;
      const isActive = index === this.activeIndex;

      ctx.strokeStyle = isActive ? DEBUG_STROKE : DEBUG_SOFT;
      ctx.lineWidth = isActive ? 2 : 1;
      ctx.strokeRect(x, y, rect.width, rect.height);

      if (isActive) {
        ctx.fillStyle = DEBUG_ACTIVE;
        ctx.fillRect(x, y, rect.width, rect.height);
      }
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
