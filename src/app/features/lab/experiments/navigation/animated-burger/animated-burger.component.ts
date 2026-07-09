import { Component, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LabDemoLayoutComponent } from '../../../shell/lab-demo-layout/lab-demo-layout.component';

/**
 * Animated Burger — THE.LAB / Navigation.
 *
 * Три линии гамбургера трансформируются в крестик с каскадной задержкой,
 * вращением и масштабом — параметры через CSS-переменные.
 */
const LINE_WIDTH = 28;
const LINE_GAP = 8;
const TRANSITION_MS = 520;
const OPEN_ROTATION = 45;
const STAGGER_MS = 60;

const DEBUG_STROKE = 'rgba(245, 158, 11, 0.55)';
const DEBUG_SOFT = 'rgba(245, 158, 11, 0.22)';

@Component({
  selector: 'app-animated-burger',
  standalone: true,
  imports: [CommonModule, LabDemoLayoutComponent],
  styleUrls: ['./animated-burger.component.scss'],
  templateUrl: './animated-burger.component.html',
})
export class AnimatedBurgerComponent implements AfterViewInit {
  @ViewChild('sceneHost') sceneHostRef!: ElementRef<HTMLElement>;

  isOpen = false;
  lineWidth = LINE_WIDTH;
  lineGap = LINE_GAP;
  transitionMs = TRANSITION_MS;
  openRotation = OPEN_ROTATION;
  staggerMs = STAGGER_MS;

  ngAfterViewInit() {
    this.applyVars();
  }

  toggle() {
    this.isOpen = !this.isOpen;
  }

  reset() {
    this.isOpen = false;
    this.lineWidth = LINE_WIDTH;
    this.lineGap = LINE_GAP;
    this.transitionMs = TRANSITION_MS;
    this.openRotation = OPEN_ROTATION;
    this.staggerMs = STAGGER_MS;
    this.applyVars();
  }

  onParamChange(detail: { id: string; value: number }) {
    if (detail.id === 'lineWidth') this.lineWidth = detail.value;
    else if (detail.id === 'lineGap') this.lineGap = detail.value;
    else if (detail.id === 'transitionMs') this.transitionMs = detail.value;
    else if (detail.id === 'openRotation') this.openRotation = detail.value;
    else if (detail.id === 'staggerMs') this.staggerMs = detail.value;
    this.applyVars();
  }

  private applyVars() {
    const el = this.sceneHostRef?.nativeElement;
    if (!el) return;

    el.style.setProperty('--line-width', `${this.lineWidth}px`);
    el.style.setProperty('--line-gap', `${this.lineGap}px`);
    el.style.setProperty('--burger-duration', `${this.transitionMs}ms`);
    el.style.setProperty('--open-rotation', `${this.openRotation}deg`);
    el.style.setProperty('--stagger-1', `${this.staggerMs}ms`);
    el.style.setProperty('--stagger-2', `${this.staggerMs * 2}ms`);
    el.style.setProperty('--stagger-3', `${this.staggerMs * 3}ms`);
  }

  drawDebug({ ctx, width, height }: { ctx: CanvasRenderingContext2D; width: number; height: number }) {
    ctx.clearRect(0, 0, width, height);
    const scene = this.sceneHostRef?.nativeElement;
    if (!scene) return;

    const btn = scene.querySelector<HTMLElement>('.js-burger-btn');
    if (!btn) return;

    const sceneRect = scene.getBoundingClientRect();
    const rect = btn.getBoundingClientRect();
    const x = rect.left - sceneRect.left;
    const y = rect.top - sceneRect.top;

    ctx.strokeStyle = this.isOpen ? DEBUG_STROKE : DEBUG_SOFT;
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, rect.width, rect.height);

    const cx = x + rect.width / 2;
    const cy = y + rect.height / 2;
    const lines = [-this.lineGap, 0, this.lineGap];

    lines.forEach((offset, i) => {
      ctx.beginPath();
      ctx.strokeStyle = DEBUG_STROKE;
      ctx.lineWidth = 2;
      ctx.moveTo(cx - this.lineWidth / 2, cy + offset);
      ctx.lineTo(cx + this.lineWidth / 2, cy + offset);
      ctx.stroke();

      ctx.fillStyle = 'rgba(253, 186, 116, 0.8)';
      ctx.font = '10px monospace';
      ctx.fillText(`L${i + 1}`, cx + this.lineWidth / 2 + 6, cy + offset + 3);
    });
  }
}
