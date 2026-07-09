import { Component, AfterViewInit, ViewChild, ElementRef, PLATFORM_ID, inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { LabDemoLayoutComponent } from '../../../shell/lab-demo-layout/lab-demo-layout.component';

/**
 * Underline Reveal — THE.LAB / Hover.
 *
 * Подчёркивание ссылок через scaleX на ::after.
 * У каждой ссылки свой transform-origin; Debug-слайдер
 * временно выравнивает все линии к одной точке.
 */
const THICKNESS = 2;
const OFFSET = 6;
const DURATION = 320;
const ORIGIN_MODE = 1;

const ORIGINS = ['0%', '50%', '100%'] as const;

interface UnderlineLink {
  label: string;
  href: string;
  origin: (typeof ORIGINS)[number];
  badge: string;
}

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

  /** null = у каждой ссылки свой origin из пресета */
  private globalOrigin: (typeof ORIGINS)[number] | null = null;

  readonly links: UnderlineLink[] = [
    { label: 'Overview', href: '#', origin: '0%', badge: 'left' },
    { label: 'Experiments', href: '#', origin: '50%', badge: 'center' },
    { label: 'Debug panel', href: '#', origin: '100%', badge: 'right' },
    { label: 'View code', href: '#', origin: '0%', badge: 'left' },
    { label: 'Passport', href: '#', origin: '50%', badge: 'center' },
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
    this.globalOrigin = null;
    this.applyVars();
  }

  onParamChange(detail: { id: string; value: number }) {
    if (detail.id === 'thickness') this.thickness = detail.value;
    else if (detail.id === 'offset') this.offset = detail.value;
    else if (detail.id === 'duration') this.duration = detail.value;
    else if (detail.id === 'originMode') {
      this.originMode = Math.round(detail.value);
      this.globalOrigin = ORIGINS[Math.max(0, Math.min(2, this.originMode))] ?? '50%';
    }
    this.applyVars();
  }

  linkOrigin(link: UnderlineLink): string {
    return this.globalOrigin ?? link.origin;
  }

  private applyVars() {
    const el = this.sceneHostRef?.nativeElement;
    if (!el) return;

    el.style.setProperty('--thickness', `${this.thickness}px`);
    el.style.setProperty('--underline-offset', `${this.offset}px`);
    el.style.setProperty('--underline-duration', `${this.duration}ms`);
    el.style.setProperty('--origin-x', this.globalOrigin ?? '50%');
  }
}
