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
 * Reveal Text — THE.LAB / Typography.
 *
 * Строки текста проявляются через clip-path и mask
 * при входе в viewport scroll-контейнера demo.
 */
const THRESHOLD = 0.35;
const REVEAL_DURATION = 780;
const STAGGER = 120;
const CLIP_INSET = 8;

interface RevealLine {
  index: number;
  tag: string;
  text: string;
  tone: 'amber' | 'violet' | 'emerald' | 'zinc';
  visible: boolean;
}

const LINES: Omit<RevealLine, 'index' | 'visible'>[] = [
  { tag: '01', text: 'Words arrive in silence', tone: 'amber' },
  { tag: '02', text: 'Then the mask slides away', tone: 'violet' },
  { tag: '03', text: 'Line by line, rhythm builds', tone: 'emerald' },
  { tag: '04', text: 'Typography becomes motion', tone: 'zinc' },
  { tag: '05', text: 'Scroll to choreograph reveal', tone: 'amber' },
  { tag: '06', text: 'Each threshold is a beat', tone: 'violet' },
  { tag: '07', text: 'Clip-path cuts the curtain', tone: 'emerald' },
  { tag: '08', text: 'Stagger keeps the pulse', tone: 'zinc' },
];

@Component({
  selector: 'app-reveal-text',
  standalone: true,
  imports: [CommonModule, LabDemoLayoutComponent],
  styleUrls: ['./reveal-text.component.scss'],
  templateUrl: './reveal-text.component.html',
})
export class RevealTextComponent implements AfterViewInit, OnDestroy {
  private readonly platformId = inject(PLATFORM_ID);

  @ViewChild('scrollHost') scrollHostRef!: ElementRef<HTMLElement>;
  @ViewChild('varsHost') varsHostRef!: ElementRef<HTMLElement>;

  threshold = THRESHOLD;
  revealDuration = REVEAL_DURATION;
  stagger = STAGGER;
  clipInset = CLIP_INSET;

  lines: RevealLine[] = LINES.map((line, index) => ({ ...line, index, visible: false }));
  visibleCount = 0;

  private scrollEl: HTMLElement | null = null;
  private varsEl: HTMLElement | null = null;
  private lineElements: HTMLElement[] = [];
  private observer: IntersectionObserver | null = null;
  private reducedMotion = false;

  ngAfterViewInit() {
    if (!isPlatformBrowser(this.platformId)) return;

    this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.scrollEl = this.scrollHostRef?.nativeElement ?? null;
    this.varsEl = this.varsHostRef?.nativeElement ?? null;
    if (!this.scrollEl) return;

    this.collectLines();
    this.applyVars();

    if (this.reducedMotion) {
      this.revealAll();
    } else {
      this.setupObserver();
    }
  }

  ngOnDestroy() {
    this.observer?.disconnect();
  }

  reset() {
    this.threshold = THRESHOLD;
    this.revealDuration = REVEAL_DURATION;
    this.stagger = STAGGER;
    this.clipInset = CLIP_INSET;
    this.lines = LINES.map((line, index) => ({ ...line, index, visible: false }));
    this.visibleCount = 0;

    queueMicrotask(() => {
      this.collectLines();
      this.applyVars();
      if (this.scrollEl) this.scrollEl.scrollTop = 0;
      this.observer?.disconnect();

      if (this.reducedMotion) {
        this.revealAll();
      } else {
        this.setupObserver();
      }

      this.syncVars();
    });
  }

  onParamChange(detail: { id: string; value: number }) {
    if (detail.id === 'threshold') this.threshold = detail.value;
    if (detail.id === 'revealDuration') this.revealDuration = detail.value;
    if (detail.id === 'stagger') this.stagger = detail.value;
    if (detail.id === 'clipInset') this.clipInset = detail.value;

    this.applyVars();
    if (!this.reducedMotion) {
      this.observer?.disconnect();
      this.setupObserver();
    }
  }

  private collectLines() {
    if (!this.scrollEl) {
      this.lineElements = [];
      return;
    }
    this.lineElements = Array.from(this.scrollEl.querySelectorAll<HTMLElement>('.js-reveal-line'));
  }

  private applyVars() {
    if (!this.scrollEl) return;
    this.scrollEl.style.setProperty('--reveal-duration', `${this.revealDuration}ms`);
    this.scrollEl.style.setProperty('--reveal-stagger', `${this.stagger}ms`);
    this.scrollEl.style.setProperty('--clip-inset', `${this.clipInset}px`);
  }

  private setupObserver() {
    if (!this.scrollEl) return;

    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const element = entry.target as HTMLElement;
          const index = Number(element.dataset['index'] ?? -1);
          if (index < 0 || this.lines[index]?.visible) return;

          this.lines[index].visible = true;
          this.visibleCount += 1;
          this.syncVars();
          this.observer?.unobserve(element);
        });
      },
      { root: this.scrollEl, threshold: this.threshold },
    );

    this.lineElements.forEach((element) => {
      const index = Number(element.dataset['index'] ?? -1);
      if (this.lines[index]?.visible) return;
      this.observer?.observe(element);
    });
  }

  private revealAll() {
    this.lines.forEach((line) => { line.visible = true; });
    this.visibleCount = this.lines.length;
    this.syncVars();
  }

  private syncVars() {
    if (!this.varsEl) return;
    this.varsEl.style.setProperty('--visible-count', String(this.visibleCount));
  }
}
