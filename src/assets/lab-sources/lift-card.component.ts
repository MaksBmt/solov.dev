import { Component, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LabDemoLayoutComponent } from '../../../shell/lab-demo-layout/lab-demo-layout.component';

/**
 * Lift Card — THE.LAB / Hover.
 *
 * Подъём и тень при :hover через CSS-переменные,
 * которые обновляет debug-панель.
 */
const LIFT_Y = 8;
const HOVER_SCALE = 1.02;
const SHADOW_BLUR = 28;
const DURATION = 280;

const DEBUG_STROKE = 'rgba(245, 158, 11, 0.55)';
const DEBUG_SOFT = 'rgba(245, 158, 11, 0.22)';

@Component({
  selector: 'app-lift-card',
  standalone: true,
  imports: [CommonModule, LabDemoLayoutComponent],
  styleUrls: ['./lift-card.component.scss'],
  templateUrl: './lift-card.component.html',
})
export class LiftCardComponent implements AfterViewInit {
  @ViewChild('sceneHost') sceneHostRef!: ElementRef<HTMLElement>;

  liftY = LIFT_Y;
  scale = HOVER_SCALE;
  shadowBlur = SHADOW_BLUR;
  duration = DURATION;

  ngAfterViewInit() {
    this.applyVars();
  }

  reset() {
    this.liftY = LIFT_Y;
    this.scale = HOVER_SCALE;
    this.shadowBlur = SHADOW_BLUR;
    this.duration = DURATION;
    this.applyVars();
  }

  onParamChange(detail: { id: string; value: number }) {
    if (detail.id === 'liftY') this.liftY = detail.value;
    else if (detail.id === 'scale') this.scale = detail.value;
    else if (detail.id === 'shadowBlur') this.shadowBlur = detail.value;
    else if (detail.id === 'duration') this.duration = detail.value;
    this.applyVars();
  }

  private applyVars() {
    const el = this.sceneHostRef?.nativeElement;
    if (!el) return;

    el.style.setProperty('--lift-y', `${this.liftY}px`);
    el.style.setProperty('--hover-scale', String(this.scale.toFixed(3)));
    el.style.setProperty('--shadow-blur', `${this.shadowBlur}px`);
    el.style.setProperty('--lift-duration', `${this.duration}ms`);
  }

  drawDebug({ ctx, width, height }: { ctx: CanvasRenderingContext2D; width: number; height: number }) {
    ctx.clearRect(0, 0, width, height);
    const scene = this.sceneHostRef?.nativeElement;
    if (!scene) return;

    const sceneRect = scene.getBoundingClientRect();
    scene.querySelectorAll<HTMLElement>('.js-lift-card').forEach((card) => {
      const rect = card.getBoundingClientRect();
      const x = rect.left - sceneRect.left;
      const y = rect.top - sceneRect.top;
      const hovered = card.matches(':hover');

      ctx.strokeStyle = hovered ? DEBUG_STROKE : DEBUG_SOFT;
      ctx.lineWidth = hovered ? 2 : 1;
      ctx.strokeRect(x, y, rect.width, rect.height);

      if (hovered) {
        ctx.setLineDash([4, 4]);
        ctx.strokeRect(x, y - this.liftY, rect.width, rect.height);
        ctx.setLineDash([]);
      }
    });
  }
}
