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
 * Pinned Elements — THE.LAB / Scroll.
 *
 * В каждой секции sticky-элемент «прилипает» к верху,
 * пока длинное тело секции проходит мимо viewport.
 */
const PIN_TOP = 24;
const SECTION_HEIGHT = 480;
const SECTION_COUNT = 5;

const DEBUG_STROKE = 'rgba(245, 158, 11, 0.55)';
const DEBUG_SOFT = 'rgba(245, 158, 11, 0.22)';
const DEBUG_ACTIVE = 'rgba(253, 186, 116, 0.28)';

interface PinnedSection {
  index: number;
  label: string;
  title: string;
  body: string;
  detail: string;
  tone: 'amber' | 'violet' | 'emerald' | 'cyan' | 'rose' | 'zinc';
}

const SECTION_CONTENT: Omit<PinnedSection, 'index'>[] = [
  {
    label: 'A',
    title: 'Pinned label',
    body: 'Пока эта секция прокручивается, метка остаётся на линии pin.',
    detail: 'position: sticky + заданный top удерживают элемент в кадре.',
    tone: 'amber',
  },
  {
    label: 'B',
    title: 'Section runway',
    body: 'Высота секции создаёт «взлётную полосу» для sticky-поведения.',
    detail: 'Когда секция уходит — pin отпускает и берётся следующий.',
    tone: 'violet',
  },
  {
    label: 'C',
    title: 'Stack handoff',
    body: 'Соседние секции передают эстафету без overlap-конфликтов.',
    detail: 'Каждый блок — отдельный scroll-контекст внутри demo.',
    tone: 'emerald',
  },
  {
    label: 'D',
    title: 'Scroll sync',
    body: 'activeIndex показывает, чья секция сейчас у pin-линии.',
    detail: 'CSS Variables обновляются на scroll через rAF.',
    tone: 'cyan',
  },
  {
    label: 'E',
    title: 'Long copy',
    body: 'Длинный текст справа имитирует реальный контент секции landing page.',
    detail: 'Pin помогает держать контекст (заголовок, номер, метку) на экране.',
    tone: 'rose',
  },
  {
    label: 'F',
    title: 'Final pin',
    body: 'Последняя секция — проверка корректного отлипания в конце списка.',
    detail: 'После неё остаётся только хвост прокрутки.',
    tone: 'zinc',
  },
  {
    label: 'G',
    title: 'Extra section',
    body: 'Дополнительная секция для более длинного сценария прокрутки.',
    detail: 'Увеличьте count в Debug, чтобы добавить ещё.',
    tone: 'amber',
  },
];

@Component({
  selector: 'app-pinned-elements',
  standalone: true,
  imports: [CommonModule, LabDemoLayoutComponent],
  styleUrls: ['./pinned-elements.component.scss'],
  templateUrl: './pinned-elements.component.html',
})
export class PinnedElementsComponent implements AfterViewInit, OnDestroy {
  private readonly platformId = inject(PLATFORM_ID);

  @ViewChild('scrollHost') scrollHostRef!: ElementRef<HTMLElement>;
  @ViewChild('varsHost') varsHostRef!: ElementRef<HTMLElement>;

  pinTop = PIN_TOP;
  sectionHeight = SECTION_HEIGHT;
  sectionCount = SECTION_COUNT;

  sections: PinnedSection[] = this.buildSections(SECTION_COUNT);
  activeIndex = 0;
  scrollProgress = 0;

  private scrollEl: HTMLElement | null = null;
  private varsEl: HTMLElement | null = null;
  private sectionElements: HTMLElement[] = [];
  private rafId: number | null = null;
  private scrollScheduled = false;

  private readonly boundOnScroll = () => this.scheduleUpdate();

  ngAfterViewInit() {
    if (!isPlatformBrowser(this.platformId)) return;

    this.scrollEl = this.scrollHostRef?.nativeElement ?? null;
    this.varsEl = this.varsHostRef?.nativeElement ?? null;

    if (!this.scrollEl) return;

    this.collectSections();
    this.applyLayoutVars();
    this.scrollEl.addEventListener('scroll', this.boundOnScroll, { passive: true });
    this.updatePinned();
  }

  ngOnDestroy() {
    if (!isPlatformBrowser(this.platformId)) return;

    if (this.rafId !== null) cancelAnimationFrame(this.rafId);
    this.scrollEl?.removeEventListener('scroll', this.boundOnScroll);
  }

  reset() {
    this.pinTop = PIN_TOP;
    this.sectionHeight = SECTION_HEIGHT;
    this.sectionCount = SECTION_COUNT;
    this.sections = this.buildSections(SECTION_COUNT);

    queueMicrotask(() => {
      this.collectSections();
      this.applyLayoutVars();
      if (this.scrollEl) this.scrollEl.scrollTop = 0;
      this.updatePinned();
    });
  }

  onParamChange(detail: { id: string; value: number }) {
    if (detail.id === 'pinTop') this.pinTop = detail.value;
    else if (detail.id === 'sectionHeight') this.sectionHeight = detail.value;
    else if (detail.id === 'sectionCount') {
      this.sectionCount = Math.round(detail.value);
      this.sections = this.buildSections(this.sectionCount);
    }

    queueMicrotask(() => {
      if (detail.id === 'sectionCount' && this.scrollEl) this.scrollEl.scrollTop = 0;
      this.collectSections();
      this.applyLayoutVars();
      this.updatePinned();
    });
  }

  private buildSections(count: number): PinnedSection[] {
    return Array.from({ length: count }, (_, index) => ({
      ...SECTION_CONTENT[index % SECTION_CONTENT.length],
      index,
    }));
  }

  private collectSections() {
    if (!this.scrollEl) {
      this.sectionElements = [];
      return;
    }

    this.sectionElements = Array.from(this.scrollEl.querySelectorAll<HTMLElement>('.js-pinned-section'));
  }

  private applyLayoutVars() {
    if (!this.scrollEl) return;

    this.scrollEl.style.setProperty('--pin-top', `${this.pinTop}px`);
    this.scrollEl.style.setProperty('--section-height', `${this.sectionHeight}px`);
  }

  private scheduleUpdate() {
    if (this.scrollScheduled) return;
    this.scrollScheduled = true;
    this.rafId = requestAnimationFrame(() => {
      this.scrollScheduled = false;
      this.rafId = null;
      this.updatePinned();
    });
  }

  private updatePinned() {
    if (!this.scrollEl || this.sectionElements.length === 0) return;

    const scrollTop = this.scrollEl.scrollTop;
    const maxScroll = Math.max(1, this.scrollEl.scrollHeight - this.scrollEl.clientHeight);
    this.scrollProgress = scrollTop / maxScroll;

    const scrollRect = this.scrollEl.getBoundingClientRect();
    const pinLine = scrollRect.top + this.pinTop;
    let activeIndex = 0;

    this.sectionElements.forEach((section, index) => {
      const rect = section.getBoundingClientRect();
      const pin = section.querySelector<HTMLElement>('.js-pinned-pin');
      const pinRect = pin?.getBoundingClientRect();
      const pinTop = pinRect?.top ?? rect.top;

      if (rect.top <= pinLine + 2 && rect.bottom > pinLine + 40) {
        activeIndex = index;
      } else if (pinTop <= pinLine + 2 && rect.bottom > pinLine) {
        activeIndex = index;
      }
    });

    this.activeIndex = activeIndex;

    if (this.varsEl) {
      this.varsEl.style.setProperty('--scroll-progress', this.scrollProgress.toFixed(3));
      this.varsEl.style.setProperty('--active-index', String(this.activeIndex));
      this.varsEl.style.setProperty('--pin-top', `${this.pinTop}px`);
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

    ctx.beginPath();
    ctx.setLineDash([5, 5]);
    ctx.strokeStyle = DEBUG_STROKE;
    ctx.lineWidth = 1.5;
    ctx.moveTo(12, this.pinTop);
    ctx.lineTo(width - 12, this.pinTop);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = DEBUG_SOFT;
    ctx.font = '10px monospace';
    ctx.fillText(`pin line · top ${this.pinTop}px`, 14, this.pinTop - 6);

    this.sectionElements.forEach((section, index) => {
      const rect = section.getBoundingClientRect();
      const x = rect.left - scrollRect.left;
      const y = rect.top - scrollRect.top;
      const isActive = index === this.activeIndex;

      if (isActive) {
        ctx.fillStyle = DEBUG_ACTIVE;
        ctx.fillRect(x, y, rect.width, rect.height);
      }

      ctx.strokeStyle = isActive ? DEBUG_STROKE : DEBUG_SOFT;
      ctx.lineWidth = isActive ? 2 : 1;
      ctx.strokeRect(x, y, rect.width, rect.height);
    });
  }
}
