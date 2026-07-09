import { Component, AfterViewInit, ViewChild, ElementRef, PLATFORM_ID, inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { LabDemoLayoutComponent } from '../../../shell/lab-demo-layout/lab-demo-layout.component';

/**
 * Flip Card — THE.LAB / Hover.
 *
 * Двусторонние карточки с 3D flip по оси X или Y.
 */
const FLIP_DURATION = 520;
const PERSPECTIVE = 1000;
const FLIP_AXIS = 0;
const HOVER_LIFT = 4;

@Component({
  selector: 'app-flip-card',
  standalone: true,
  imports: [CommonModule, LabDemoLayoutComponent],
  styleUrls: ['./flip-card.component.scss'],
  templateUrl: './flip-card.component.html',
})
export class FlipCardComponent implements AfterViewInit {
  private readonly platformId = inject(PLATFORM_ID);

  @ViewChild('sceneHost') sceneHostRef!: ElementRef<HTMLElement>;

  flipDuration = FLIP_DURATION;
  perspective = PERSPECTIVE;
  flipAxis = FLIP_AXIS;
  hoverLift = HOVER_LIFT;

  readonly cards = [
    { front: 'Front · 01', back: 'Back · specs', detail: 'rotateY flip' },
    { front: 'Front · 02', back: 'Back · debug', detail: 'perspective' },
    { front: 'Front · 03', back: 'Back · code', detail: 'backface hidden' },
    { front: 'Front · 04', back: 'Back · lab', detail: 'pure CSS 3D' },
  ];

  ngAfterViewInit() {
    if (!isPlatformBrowser(this.platformId)) return;
    this.applyVars();
  }

  reset() {
    this.flipDuration = FLIP_DURATION;
    this.perspective = PERSPECTIVE;
    this.flipAxis = FLIP_AXIS;
    this.hoverLift = HOVER_LIFT;
    this.applyVars();
  }

  onParamChange(detail: { id: string; value: number }) {
    if (detail.id === 'flipDuration') this.flipDuration = detail.value;
    else if (detail.id === 'perspective') this.perspective = detail.value;
    else if (detail.id === 'flipAxis') this.flipAxis = Math.round(detail.value);
    else if (detail.id === 'hoverLift') this.hoverLift = detail.value;
    this.applyVars();
  }

  private applyVars() {
    const el = this.sceneHostRef?.nativeElement;
    if (!el) return;

    const axis = Math.round(this.flipAxis) === 1 ? 'X' : 'Y';
    el.style.setProperty('--flip-duration', `${this.flipDuration}ms`);
    el.style.setProperty('--perspective', `${this.perspective}px`);
    el.style.setProperty('--flip-axis', axis);
    el.style.setProperty('--flip-deg', '180deg');
    el.style.setProperty('--hover-lift', `${this.hoverLift}px`);
    el.dataset['flipAxis'] = axis;
  }
}
