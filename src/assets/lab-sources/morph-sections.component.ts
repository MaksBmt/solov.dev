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
 * Morph Sections — THE.LAB / Scroll.
 *
 * Sticky-viewport: clip-path и фон морфятся между секциями
 * по scroll progress внутри длинного track.
 */
const SECTION_COUNT = 5;
const SCENE_HEIGHT = 1900;
const MORPH_INTENSITY = 1;
const CORNER_BASE = 18;

const DEBUG_STROKE = 'rgba(245, 158, 11, 0.55)';
const DEBUG_SOFT = 'rgba(245, 158, 11, 0.22)';

interface MorphSection {
  index: number;
  title: string;
  subtitle: string;
  hue: number;
}

const SECTION_CONTENT: Omit<MorphSection, 'index'>[] = [
  { title: 'Square frame', subtitle: 'Старт — мягкий прямоугольник с большим radius', hue: 38 },
  { title: 'Tilt left', subtitle: 'clip-path смещается — верхний край «наклонён»', hue: 265 },
  { title: 'Tilt right', subtitle: 'Зеркальный морф — форма тянется в другую сторону', hue: 155 },
  { title: 'Soft blob', subtitle: 'Углы разъезжаются — ощущение органической формы', hue: 190 },
  { title: 'Wide stage', subtitle: 'Широкая сцена перед финальным кадром', hue: 330 },
  { title: 'Finale', subtitle: 'Последний preset clip-path', hue: 45 },
];

const CLIP_PRESETS = [
  'inset(8% 10% 8% 10% round 22px)',
  'polygon(6% 0%, 100% 4%, 94% 100%, 0% 96%)',
  'polygon(0% 4%, 94% 0%, 100% 96%, 6% 100%)',
  'polygon(12% 8%, 88% 0%, 100% 88%, 0% 92%)',
  'inset(4% 4% 4% 4% round 40px)',
  'polygon(0% 12%, 100% 0%, 100% 88%, 0% 100%)',
];

@Component({
  selector: 'app-morph-sections',
  standalone: true,
  imports: [CommonModule, LabDemoLayoutComponent],
  styleUrls: ['./morph-sections.component.scss'],
  templateUrl: './morph-sections.component.html',
})
export class MorphSectionsComponent implements AfterViewInit, OnDestroy {
  private readonly platformId = inject(PLATFORM_ID);

  @ViewChild('scrollHost') scrollHostRef!: ElementRef<HTMLElement>;
  @ViewChild('varsHost') varsHostRef!: ElementRef<HTMLElement>;
  @ViewChild('panelHost') panelHostRef!: ElementRef<HTMLElement>;

  sectionCount = SECTION_COUNT;
  sceneHeight = SCENE_HEIGHT;
  morphIntensity = MORPH_INTENSITY;
  cornerBase = CORNER_BASE;

  sections: MorphSection[] = this.buildSections(SECTION_COUNT);
  activeIndex = 0;
  sectionProgress = 0;
  scrollProgress = 0;
  currentClipPath = CLIP_PRESETS[0];

  private scrollEl: HTMLElement | null = null;
  private varsEl: HTMLElement | null = null;
  private panelEl: HTMLElement | null = null;
  private rafId: number | null = null;
  private scrollScheduled = false;
  private resizeObserver: ResizeObserver | null = null;

  private readonly boundOnScroll = () => this.scheduleUpdate();

  ngAfterViewInit() {
    if (!isPlatformBrowser(this.platformId)) return;

    this.scrollEl = this.scrollHostRef?.nativeElement ?? null;
    this.varsEl = this.varsHostRef?.nativeElement ?? null;
    this.panelEl = this.panelHostRef?.nativeElement ?? null;

    if (!this.scrollEl) return;

    this.applyLayoutVars();
    this.scrollEl.addEventListener('scroll', this.boundOnScroll, { passive: true });

    this.resizeObserver = new ResizeObserver(() => {
      this.updateViewportHeight();
      this.updateMorph();
    });
    this.resizeObserver.observe(this.scrollEl);

    this.updateMorph();
  }

  ngOnDestroy() {
    if (!isPlatformBrowser(this.platformId)) return;

    if (this.rafId !== null) cancelAnimationFrame(this.rafId);
    this.resizeObserver?.disconnect();
    this.scrollEl?.removeEventListener('scroll', this.boundOnScroll);
  }

  reset() {
    this.sectionCount = SECTION_COUNT;
    this.sceneHeight = SCENE_HEIGHT;
    this.morphIntensity = MORPH_INTENSITY;
    this.cornerBase = CORNER_BASE;
    this.sections = this.buildSections(SECTION_COUNT);

    queueMicrotask(() => {
      this.applyLayoutVars();
      if (this.scrollEl) this.scrollEl.scrollTop = 0;
      this.updateMorph();
    });
  }

  onParamChange(detail: { id: string; value: number }) {
    if (detail.id === 'sectionCount') {
      this.sectionCount = Math.round(detail.value);
      this.sections = this.buildSections(this.sectionCount);
    } else if (detail.id === 'sceneHeight') this.sceneHeight = detail.value;
    else if (detail.id === 'morphIntensity') this.morphIntensity = detail.value;
    else if (detail.id === 'cornerBase') this.cornerBase = detail.value;

    this.applyLayoutVars();
    if (detail.id === 'sectionCount' && this.scrollEl) this.scrollEl.scrollTop = 0;
    this.updateMorph();
  }

  sectionHue(index: number): number {
    return this.sections[index]?.hue ?? 38;
  }

  private buildSections(count: number): MorphSection[] {
    return Array.from({ length: count }, (_, index) => ({
      ...SECTION_CONTENT[index % SECTION_CONTENT.length],
      index,
    }));
  }

  private applyLayoutVars() {
    if (!this.scrollEl) return;

    this.scrollEl.style.setProperty('--scene-height', `${this.sceneHeight}px`);
    this.scrollEl.style.setProperty('--morph-intensity', String(this.morphIntensity));
    this.scrollEl.style.setProperty('--corner-base', `${this.cornerBase}px`);
    this.updateViewportHeight();
  }

  private updateViewportHeight() {
    if (!this.scrollEl) return;
    this.scrollEl.style.setProperty('--viewport-h', `${this.scrollEl.clientHeight}px`);
  }

  private scheduleUpdate() {
    if (this.scrollScheduled) return;
    this.scrollScheduled = true;
    this.rafId = requestAnimationFrame(() => {
      this.scrollScheduled = false;
      this.rafId = null;
      this.updateMorph();
    });
  }

  private updateMorph() {
    if (!this.scrollEl) return;

    const scrollTop = this.scrollEl.scrollTop;
    const maxScroll = Math.max(1, this.scrollEl.scrollHeight - this.scrollEl.clientHeight);
    this.scrollProgress = scrollTop / maxScroll;

    const segments = Math.max(1, this.sectionCount - 1);
    const scaled = this.scrollProgress * segments;
    this.activeIndex = Math.min(this.sectionCount - 1, Math.floor(scaled));
    this.sectionProgress = scaled - this.activeIndex;

    const fromClip = CLIP_PRESETS[this.activeIndex % CLIP_PRESETS.length];
    const toClip = CLIP_PRESETS[Math.min(this.activeIndex + 1, CLIP_PRESETS.length - 1)];
    this.currentClipPath = this.sectionProgress < 0.02 ? fromClip : toClip;

    const fromHue = this.sections[this.activeIndex]?.hue ?? 38;
    const toHue = this.sections[Math.min(this.activeIndex + 1, this.sections.length - 1)]?.hue ?? fromHue;
    const hue = fromHue + (toHue - fromHue) * this.sectionProgress;

    if (this.panelEl) {
      this.panelEl.style.clipPath = this.currentClipPath;
      this.panelEl.style.setProperty('--panel-hue', String(hue.toFixed(1)));
    }

    if (this.varsEl) {
      this.varsEl.style.setProperty('--scroll-progress', this.scrollProgress.toFixed(3));
      this.varsEl.style.setProperty('--section-index', String(this.activeIndex));
      this.varsEl.style.setProperty('--section-progress', this.sectionProgress.toFixed(3));
      this.varsEl.style.setProperty('--panel-hue', String(hue.toFixed(1)));
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
    if (!this.panelEl || !this.scrollEl) return;

    const scrollRect = this.scrollEl.getBoundingClientRect();
    const rect = this.panelEl.getBoundingClientRect();
    const x = rect.left - scrollRect.left;
    const y = rect.top - scrollRect.top;

    ctx.strokeStyle = DEBUG_STROKE;
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, rect.width, rect.height);

    ctx.fillStyle = DEBUG_STROKE;
    ctx.font = '10px monospace';
    ctx.fillText(
      `section ${this.activeIndex + 1}/${this.sectionCount} · local ${this.sectionProgress.toFixed(2)}`,
      x + 10,
      y + 18,
    );

    const barX = width - 18;
    const barTop = 16;
    const barHeight = height - 32;
    ctx.fillStyle = 'rgba(244, 244, 245, 0.08)';
    ctx.fillRect(barX, barTop, 6, barHeight);
    ctx.fillStyle = DEBUG_SOFT;
    const segmentHeight = barHeight / Math.max(1, this.sectionCount);
    for (let i = 0; i < this.sectionCount; i += 1) {
      if (i <= this.activeIndex) {
        ctx.fillStyle = i === this.activeIndex ? DEBUG_STROKE : DEBUG_SOFT;
        ctx.fillRect(barX, barTop + barHeight - segmentHeight * (i + 1), 6, segmentHeight - 2);
      }
    }
  }
}
