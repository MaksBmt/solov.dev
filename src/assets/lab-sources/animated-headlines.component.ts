import {
  Component,
  AfterViewInit,
  OnDestroy,
  PLATFORM_ID,
  NgZone,
  ViewChild,
  ElementRef,
  inject,
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { LabDemoLayoutComponent } from '../../../shell/lab-demo-layout/lab-demo-layout.component';

/**
 * Animated Headlines — THE.LAB / Typography.
 *
 * Циклическая смена заголовков: каждая буква анимируется
 * с stagger через transform и opacity.
 */
const CYCLE_MS = 2800;
const STAGGER_MS = 38;
const ENTER_Y = 110;
const EXIT_Y = -90;
const DURATION = 520;

interface Headline {
  id: number;
  text: string;
  accent: string;
}

@Component({
  selector: 'app-animated-headlines',
  standalone: true,
  imports: [CommonModule, LabDemoLayoutComponent],
  styleUrls: ['./animated-headlines.component.scss'],
  templateUrl: './animated-headlines.component.html',
})
export class AnimatedHeadlinesComponent implements AfterViewInit, OnDestroy {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly ngZone = inject(NgZone);

  @ViewChild('sceneHost') sceneHostRef!: ElementRef<HTMLElement>;

  cycleMs = CYCLE_MS;
  staggerMs = STAGGER_MS;
  enterY = ENTER_Y;
  duration = DURATION;

  readonly headlines: Headline[] = [
    { id: 0, text: 'DESIGN', accent: 'amber' },
    { id: 1, text: 'MOTION', accent: 'violet' },
    { id: 2, text: 'IMPACT', accent: 'emerald' },
    { id: 3, text: 'FUTURE', accent: 'cyan' },
  ];

  activeIndex = 0;
  prevIndex = -1;
  phase: 'enter' | 'exit' = 'enter';
  chars: string[] = [];
  prevChars: string[] = [];

  private sceneEl: HTMLElement | null = null;
  private timerId: ReturnType<typeof setTimeout> | null = null;
  private cycleTimerId: ReturnType<typeof setInterval> | null = null;
  private reducedMotion = false;

  ngAfterViewInit() {
    if (!isPlatformBrowser(this.platformId)) return;

    this.sceneEl = this.sceneHostRef?.nativeElement ?? null;
    this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.chars = this.headlines[0].text.split('');
    this.applyVars();

    if (!this.reducedMotion) {
      this.cycleTimerId = setInterval(() => this.nextHeadline(), this.cycleMs);
    }
  }

  ngOnDestroy() {
    if (this.timerId !== null) clearTimeout(this.timerId);
    if (this.cycleTimerId !== null) clearInterval(this.cycleTimerId);
  }

  nextHeadline() {
    this.prevIndex = this.activeIndex;
    this.prevChars = this.headlines[this.activeIndex].text.split('');
    this.phase = 'enter';

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        this.phase = 'exit';
      });
    });

    if (this.timerId !== null) clearTimeout(this.timerId);
    this.timerId = setTimeout(() => {
      this.activeIndex = (this.activeIndex + 1) % this.headlines.length;
      this.chars = this.headlines[this.activeIndex].text.split('');
      this.phase = 'enter';
      this.prevIndex = -1;
      this.prevChars = [];
    }, this.duration * 0.55);
  }

  reset() {
    if (this.cycleTimerId !== null) clearInterval(this.cycleTimerId);
    if (this.timerId !== null) clearTimeout(this.timerId);

    this.cycleMs = CYCLE_MS;
    this.staggerMs = STAGGER_MS;
    this.enterY = ENTER_Y;
    this.duration = DURATION;
    this.activeIndex = 0;
    this.prevIndex = -1;
    this.phase = 'enter';
    this.chars = this.headlines[0].text.split('');
    this.prevChars = [];
    this.applyVars();

    if (!this.reducedMotion) {
      this.cycleTimerId = setInterval(() => this.nextHeadline(), this.cycleMs);
    }
  }

  onParamChange(detail: { id: string; value: number }) {
    if (detail.id === 'cycleMs') {
      this.cycleMs = detail.value;
      if (this.cycleTimerId !== null) clearInterval(this.cycleTimerId);
      if (!this.reducedMotion) {
        this.cycleTimerId = setInterval(() => this.nextHeadline(), this.cycleMs);
      }
    }
    if (detail.id === 'staggerMs') this.staggerMs = detail.value;
    if (detail.id === 'enterY') this.enterY = detail.value;
    if (detail.id === 'duration') this.duration = detail.value;
    this.applyVars();
  }

  charDelay(index: number, mode: 'enter' | 'exit') {
    const base = index * this.staggerMs;
    return mode === 'exit' ? `${base * 0.7}ms` : `${base}ms`;
  }

  activeAccent() {
    return this.headlines[this.activeIndex]?.accent ?? 'amber';
  }

  private applyVars() {
    if (!this.sceneEl) return;
    this.sceneEl.style.setProperty('--headline-enter-y', `${this.enterY}%`);
    this.sceneEl.style.setProperty('--headline-exit-y', `${ENTER_Y * -0.8}%`);
    this.sceneEl.style.setProperty('--headline-duration', `${this.duration}ms`);
  }
}
