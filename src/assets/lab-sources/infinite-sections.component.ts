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
 * Infinite Sections — THE.LAB / Layout.
 *
 * Seamless scroll loop внутри demo-области с parallax-слоями.
 */
const SECTION_COUNT = 6;
const SECTION_HEIGHT = 160;
const PARALLAX_STRENGTH = 0.18;

const DEBUG_STROKE = 'rgba(245, 158, 11, 0.55)';

interface LoopSection {
  id: number;
  label: string;
  tone: string;
}

const TONES = ['amber', 'violet', 'emerald', 'cyan', 'rose', 'zinc'];

@Component({
  selector: 'app-infinite-sections',
  standalone: true,
  imports: [CommonModule, LabDemoLayoutComponent],
  styleUrls: ['./infinite-sections.component.scss'],
  templateUrl: './infinite-sections.component.html',
})
export class InfiniteSectionsComponent implements AfterViewInit, OnDestroy {
  private readonly platformId = inject(PLATFORM_ID);

  @ViewChild('scrollHost') scrollHostRef!: ElementRef<HTMLElement>;
  @ViewChild('varsHost') varsHostRef!: ElementRef<HTMLElement>;

  sectionCount = SECTION_COUNT;
  sectionHeight = SECTION_HEIGHT;
  parallaxStrength = PARALLAX_STRENGTH;

  sections: LoopSection[] = [];
  loopCount = 0;
  scrollOffset = 0;

  private scrollEl: HTMLElement | null = null;
  private varsEl: HTMLElement | null = null;
  private blockHeight = 0;
  private rafId: number | null = null;
  private scrollScheduled = false;
  private readonly boundOnScroll = () => this.scheduleUpdate();

  ngAfterViewInit() {
    if (!isPlatformBrowser(this.platformId)) return;

    this.rebuildSections();
    this.scrollEl = this.scrollHostRef?.nativeElement ?? null;
    this.varsEl = this.varsHostRef?.nativeElement ?? null;

    requestAnimationFrame(() => {
      this.initScroll();
    });
  }

  ngOnDestroy() {
    this.scrollEl?.removeEventListener('scroll', this.boundOnScroll);
    if (this.rafId !== null) cancelAnimationFrame(this.rafId);
  }

  reset() {
    this.sectionCount = SECTION_COUNT;
    this.sectionHeight = SECTION_HEIGHT;
    this.parallaxStrength = PARALLAX_STRENGTH;
    this.loopCount = 0;
    this.rebuildSections();
    this.applyVars();

    if (this.scrollEl) {
      this.scrollEl.scrollTop = this.blockHeight;
      this.scrollOffset = this.blockHeight;
    }
  }

  onParamChange(detail: { id: string; value: number }) {
    if (detail.id === 'sectionCount') this.sectionCount = detail.value;
    else if (detail.id === 'sectionHeight') this.sectionHeight = detail.value;
    else if (detail.id === 'parallaxStrength') this.parallaxStrength = detail.value;
    this.rebuildSections();
    this.applyVars();
  }

  private rebuildSections() {
    const base = Array.from({ length: this.sectionCount }, (_, i) => ({
      id: i,
      label: String(i + 1).padStart(2, '0'),
      tone: TONES[i % TONES.length],
    }));
    this.sections = [...base, ...base, ...base];
    this.blockHeight = this.sectionCount * this.sectionHeight;
  }

  private initScroll() {
    if (!this.scrollEl) return;

    this.blockHeight = this.sectionCount * this.sectionHeight;
    this.scrollEl.scrollTop = this.blockHeight;
    this.scrollOffset = this.blockHeight;
    this.scrollEl.addEventListener('scroll', this.boundOnScroll, { passive: true });
    this.applyVars();
  }

  private scheduleUpdate() {
    if (this.scrollScheduled) return;
    this.scrollScheduled = true;
    this.rafId = requestAnimationFrame(() => {
      this.scrollScheduled = false;
      this.updateScroll();
    });
  }

  private updateScroll() {
    if (!this.scrollEl) return;

    const top = this.scrollEl.scrollTop;
    this.scrollOffset = top;

    if (top <= 0) {
      this.scrollEl.scrollTop = top + this.blockHeight;
      this.loopCount++;
    } else if (top >= this.blockHeight * 2) {
      this.scrollEl.scrollTop = top - this.blockHeight;
      this.loopCount++;
    }

    this.applyVars();
  }

  private applyVars() {
    const el = this.varsEl ?? this.scrollHostRef?.nativeElement;
    if (!el) return;
    el.style.setProperty('--section-height', `${this.sectionHeight}px`);
    el.style.setProperty('--scroll-offset', `${this.scrollOffset}px`);
    el.style.setProperty('--loop-count', String(this.loopCount));
    el.style.setProperty('--parallax-strength', String(this.parallaxStrength));
  }

  getParallaxStyle(index: number): Record<string, string> {
    if (!this.scrollEl) return {};
    const localOffset = index * this.sectionHeight;
    const shift = (this.scrollOffset - localOffset) * this.parallaxStrength * 0.1;
    return { transform: `translateY(${shift}px)` };
  }

  drawDebug({ ctx, width, height }: { ctx: CanvasRenderingContext2D; width: number; height: number }) {
    ctx.clearRect(0, 0, width, height);
    const scroll = this.scrollHostRef?.nativeElement;
    if (!scroll) return;

    const scrollRect = scroll.getBoundingClientRect();
    scroll.querySelectorAll<HTMLElement>('.js-loop-section').forEach((section) => {
      const rect = section.getBoundingClientRect();
      if (rect.bottom < scrollRect.top || rect.top > scrollRect.bottom) return;
      ctx.strokeStyle = DEBUG_STROKE;
      ctx.strokeRect(rect.left - scrollRect.left, rect.top - scrollRect.top, rect.width, rect.height);
    });
  }
}
