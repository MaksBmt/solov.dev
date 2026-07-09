import { Component, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LabDemoLayoutComponent } from '../../../shell/lab-demo-layout/lab-demo-layout.component';

/**
 * Glow Border — THE.LAB / Hover.
 *
 * Вращающийся conic-gradient на псевдоэлементе
 * с маской для «чистой» внутренней области.
 */
const BORDER_WIDTH = 2;
const SPIN_DURATION = 3.5;
const GLOW_OPACITY = 0.55;
const CORNER_RADIUS = 18;

const DEBUG_STROKE = 'rgba(245, 158, 11, 0.55)';

@Component({
  selector: 'app-glow-border',
  standalone: true,
  imports: [CommonModule, LabDemoLayoutComponent],
  styleUrls: ['./glow-border.component.scss'],
  templateUrl: './glow-border.component.html',
})
export class GlowBorderComponent implements AfterViewInit {
  @ViewChild('sceneHost') sceneHostRef!: ElementRef<HTMLElement>;

  borderWidth = BORDER_WIDTH;
  spinDuration = SPIN_DURATION;
  glowOpacity = GLOW_OPACITY;
  cornerRadius = CORNER_RADIUS;

  ngAfterViewInit() {
    this.applyVars();
  }

  reset() {
    this.borderWidth = BORDER_WIDTH;
    this.spinDuration = SPIN_DURATION;
    this.glowOpacity = GLOW_OPACITY;
    this.cornerRadius = CORNER_RADIUS;
    this.applyVars();
  }

  onParamChange(detail: { id: string; value: number }) {
    if (detail.id === 'borderWidth') this.borderWidth = detail.value;
    else if (detail.id === 'spinDuration') this.spinDuration = detail.value;
    else if (detail.id === 'glowOpacity') this.glowOpacity = detail.value;
    else if (detail.id === 'cornerRadius') this.cornerRadius = detail.value;
    this.applyVars();
  }

  private applyVars() {
    const el = this.sceneHostRef?.nativeElement;
    if (!el) return;

    el.style.setProperty('--border-width', `${this.borderWidth}px`);
    el.style.setProperty('--spin-duration', `${this.spinDuration}s`);
    el.style.setProperty('--glow-opacity', String(this.glowOpacity.toFixed(2)));
    el.style.setProperty('--corner-radius', `${this.cornerRadius}px`);
  }

  drawDebug({ ctx, width, height }: { ctx: CanvasRenderingContext2D; width: number; height: number }) {
    ctx.clearRect(0, 0, width, height);
    const scene = this.sceneHostRef?.nativeElement;
    if (!scene) return;

    const sceneRect = scene.getBoundingClientRect();
    scene.querySelectorAll<HTMLElement>('.js-glow-card').forEach((card) => {
      const rect = card.getBoundingClientRect();
      const x = rect.left - sceneRect.left;
      const y = rect.top - sceneRect.top;

      ctx.strokeStyle = card.matches(':hover') ? DEBUG_STROKE : 'rgba(245, 158, 11, 0.22)';
      ctx.lineWidth = 2;
      ctx.strokeRect(x - 4, y - 4, rect.width + 8, rect.height + 8);
    });
  }
}
