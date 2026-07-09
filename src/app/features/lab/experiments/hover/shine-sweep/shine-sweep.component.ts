import { Component, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LabDemoLayoutComponent } from '../../../shell/lab-demo-layout/lab-demo-layout.component';
import { ButtonComponent } from '../../../../../shared/components/button/button.component';

/**
 * Shine Sweep — THE.LAB / Hover.
 *
 * Диагональный блик: градиент на всю кнопку, проход через background-position.
 */
const SHINE_WIDTH = 38;
const SHINE_ANGLE = 25;
const DURATION = 700;
const SHINE_INTENSITY = 0.7;

@Component({
  selector: 'app-shine-sweep',
  standalone: true,
  imports: [CommonModule, LabDemoLayoutComponent, ButtonComponent],
  styleUrls: ['./shine-sweep.component.scss'],
  templateUrl: './shine-sweep.component.html',
})
export class ShineSweepComponent implements AfterViewInit {
  @ViewChild('sceneHost') sceneHostRef!: ElementRef<HTMLElement>;

  shineWidth = SHINE_WIDTH;
  angle = SHINE_ANGLE;
  duration = DURATION;
  intensity = SHINE_INTENSITY;

  ngAfterViewInit() {
    this.applyVars();
  }

  reset() {
    this.shineWidth = SHINE_WIDTH;
    this.angle = SHINE_ANGLE;
    this.duration = DURATION;
    this.intensity = SHINE_INTENSITY;
    this.applyVars();
  }

  onParamChange(detail: { id: string; value: number }) {
    if (detail.id === 'shineWidth') this.shineWidth = detail.value;
    else if (detail.id === 'angle') this.angle = detail.value;
    else if (detail.id === 'duration') this.duration = detail.value;
    else if (detail.id === 'intensity') this.intensity = detail.value;
    this.applyVars();
  }

  private applyVars() {
    const el = this.sceneHostRef?.nativeElement;
    if (!el) return;

    const spread = this.shineWidth * 0.32;
    const core = spread * 0.45;

    el.style.setProperty('--shine-width', `${this.shineWidth}%`);
    el.style.setProperty('--shine-angle', `${this.angle}deg`);
    el.style.setProperty('--shine-duration', `${this.duration}ms`);
    el.style.setProperty('--shine-intensity', String(this.intensity.toFixed(2)));
    el.style.setProperty('--shine-stop-a', `${50 - spread}%`);
    el.style.setProperty('--shine-stop-b', `${50 - core}%`);
    el.style.setProperty('--shine-stop-c', `${50 + core}%`);
    el.style.setProperty('--shine-stop-d', `${50 + spread}%`);
  }
}
