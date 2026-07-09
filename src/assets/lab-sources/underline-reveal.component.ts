import { Component, AfterViewInit, ViewChild, ElementRef, PLATFORM_ID, inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { LabDemoLayoutComponent } from '../../../shell/lab-demo-layout/lab-demo-layout.component';

/**
 * Underline Reveal — THE.LAB / Hover.
 *
 * Три демо-строки с разным transform-origin у ::after.
 * Debug Origin: 0 = три разных направления, 1–3 = одно для всех.
 */
const THICKNESS = 2;
const OFFSET = 6;
const DURATION = 320;
/** 0 = у каждой строки своё · 1 = left · 2 = center · 3 = right */
const ORIGIN_MODE = 0;

type OriginSide = 'left' | 'center' | 'right';

@Component({
  selector: 'app-underline-reveal',
  standalone: true,
  imports: [CommonModule, LabDemoLayoutComponent],
  styleUrls: ['./underline-reveal.component.scss'],
  templateUrl: './underline-reveal.component.html',
})
export class UnderlineRevealComponent implements AfterViewInit {
  private readonly platformId = inject(PLATFORM_ID);

  @ViewChild('sceneHost') sceneHostRef!: ElementRef<HTMLElement>;

  thickness = THICKNESS;
  offset = OFFSET;
  duration = DURATION;
  originMode = ORIGIN_MODE;

  /** null = у каждой строки своё направление */
  forcedOrigin: OriginSide | null = null;

  readonly demos: { caption: string; origin: OriginSide; label: string }[] = [
    {
      caption: 'Слева →',
      origin: 'left',
      label: 'Линия выезжает слева направо',
    },
    {
      caption: 'Из центра ↔',
      origin: 'center',
      label: 'Линия расходится из середины',
    },
    {
      caption: '← Справа',
      origin: 'right',
      label: 'Линия выезжает справа налево',
    },
  ];

  ngAfterViewInit() {
    if (!isPlatformBrowser(this.platformId)) return;
    this.applyVars();
  }

  reset() {
    this.thickness = THICKNESS;
    this.offset = OFFSET;
    this.duration = DURATION;
    this.originMode = ORIGIN_MODE;
    this.forcedOrigin = null;
    this.applyVars();
  }

  onParamChange(detail: { id: string; value: number; silent?: boolean }) {
    if (detail.id === 'thickness') this.thickness = detail.value;
    else if (detail.id === 'offset') this.offset = detail.value;
    else if (detail.id === 'duration') this.duration = detail.value;
    else if (detail.id === 'originMode') {
      this.originMode = Math.round(detail.value);
      this.forcedOrigin = this.resolveForcedOrigin(this.originMode);
    }
    this.applyVars();
  }

  private resolveForcedOrigin(mode: number): OriginSide | null {
    if (mode <= 0) return null;
    const map: OriginSide[] = ['left', 'center', 'right'];
    return map[Math.min(mode - 1, 2)] ?? null;
  }

  linkOriginClass(origin: OriginSide): string {
    const side = this.forcedOrigin ?? origin;
    return `underline-reveal__link--from-${side}`;
  }

  private applyVars() {
    const el = this.sceneHostRef?.nativeElement;
    if (!el) return;

    el.style.setProperty('--thickness', `${this.thickness}px`);
    el.style.setProperty('--underline-offset', `${this.offset}px`);
    el.style.setProperty('--underline-duration', `${this.duration}ms`);

    const originX = this.forcedOrigin === 'left'
      ? '0%'
      : this.forcedOrigin === 'right'
        ? '100%'
        : this.forcedOrigin === 'center'
          ? '50%'
          : 'mixed';
    el.style.setProperty('--origin-x', originX);
  }
}
