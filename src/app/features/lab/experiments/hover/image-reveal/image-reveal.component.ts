import { Component, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LabDemoLayoutComponent } from '../../../shell/lab-demo-layout/lab-demo-layout.component';

/**
 * Image Reveal — THE.LAB / Hover.
 *
 * Масштаб изображения и подъём оверлея
 * при :hover через CSS-переменные.
 */
const IMAGE_SCALE = 1.08;
const OVERLAY_SHIFT = 10;
const OVERLAY_OPACITY = 0.35;
const DURATION = 420;

@Component({
  selector: 'app-image-reveal',
  standalone: true,
  imports: [CommonModule, LabDemoLayoutComponent],
  styleUrls: ['./image-reveal.component.scss'],
  templateUrl: './image-reveal.component.html',
})
export class ImageRevealComponent implements AfterViewInit {
  @ViewChild('sceneHost') sceneHostRef!: ElementRef<HTMLElement>;

  imageScale = IMAGE_SCALE;
  overlayShift = OVERLAY_SHIFT;
  overlayOpacity = OVERLAY_OPACITY;
  duration = DURATION;

  readonly cards = [
    { title: 'Amber frame', hue: 38, label: '01' },
    { title: 'Violet frame', hue: 265, label: '02' },
    { title: 'Emerald frame', hue: 155, label: '03' },
  ];

  ngAfterViewInit() {
    this.applyVars();
  }

  reset() {
    this.imageScale = IMAGE_SCALE;
    this.overlayShift = OVERLAY_SHIFT;
    this.overlayOpacity = OVERLAY_OPACITY;
    this.duration = DURATION;
    this.applyVars();
  }

  onParamChange(detail: { id: string; value: number }) {
    if (detail.id === 'imageScale') this.imageScale = detail.value;
    else if (detail.id === 'overlayShift') this.overlayShift = detail.value;
    else if (detail.id === 'overlayOpacity') this.overlayOpacity = detail.value;
    else if (detail.id === 'duration') this.duration = detail.value;
    this.applyVars();
  }

  private applyVars() {
    const el = this.sceneHostRef?.nativeElement;
    if (!el) return;

    el.style.setProperty('--image-scale', String(this.imageScale.toFixed(2)));
    el.style.setProperty('--overlay-shift', `${this.overlayShift}px`);
    el.style.setProperty('--overlay-opacity', String(this.overlayOpacity.toFixed(2)));
    el.style.setProperty('--reveal-duration', `${this.duration}ms`);
  }
}
