import { Component, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LabDemoLayoutComponent } from '../../../shell/lab-demo-layout/lab-demo-layout.component';

/**
 * Radial Menu — THE.LAB / Navigation.
 *
 * Пункты раскрываются по дуге от центральной кнопки
 * с каскадной задержкой и transform.
 */
const SPREAD_ANGLE = 140;
const RADIUS = 110;
const STAGGER_MS = 55;
const DURATION = 480;

const DEBUG_STROKE = 'rgba(245, 158, 11, 0.55)';
const DEBUG_SOFT = 'rgba(245, 158, 11, 0.22)';

interface RadialItem {
  label: string;
  icon: string;
}

@Component({
  selector: 'app-radial-menu',
  standalone: true,
  imports: [CommonModule, LabDemoLayoutComponent],
  styleUrls: ['./radial-menu.component.scss'],
  templateUrl: './radial-menu.component.html',
})
export class RadialMenuComponent implements AfterViewInit {
  @ViewChild('sceneHost') sceneHostRef!: ElementRef<HTMLElement>;

  items: RadialItem[] = [
    { label: 'Home', icon: '⌂' },
    { label: 'Search', icon: '⌕' },
    { label: 'Add', icon: '+' },
    { label: 'Star', icon: '★' },
    { label: 'Share', icon: '↗' },
    { label: 'Settings', icon: '⚙' },
  ];

  isOpen = false;
  spreadAngle = SPREAD_ANGLE;
  radius = RADIUS;
  staggerMs = STAGGER_MS;
  duration = DURATION;

  ngAfterViewInit() {
    this.applyVars();
    this.applyPositions();
  }

  toggle() {
    this.isOpen = !this.isOpen;
  }

  reset() {
    this.isOpen = false;
    this.spreadAngle = SPREAD_ANGLE;
    this.radius = RADIUS;
    this.staggerMs = STAGGER_MS;
    this.duration = DURATION;
    this.applyVars();
    this.applyPositions();
  }

  onParamChange(detail: { id: string; value: number }) {
    if (detail.id === 'spreadAngle') this.spreadAngle = detail.value;
    else if (detail.id === 'radius') this.radius = detail.value;
    else if (detail.id === 'staggerMs') this.staggerMs = detail.value;
    else if (detail.id === 'duration') this.duration = detail.value;
    this.applyVars();
    this.applyPositions();
  }

  getItemStyle(index: number): Record<string, string> {
    const count = this.items.length;
    const startAngle = -90 - this.spreadAngle / 2;
    const step = count > 1 ? this.spreadAngle / (count - 1) : 0;
    const angle = startAngle + step * index;
    const rad = (angle * Math.PI) / 180;
    const x = Math.cos(rad) * this.radius;
    const y = Math.sin(rad) * this.radius;

    return {
      '--item-x': `${x}px`,
      '--item-y': `${y}px`,
      '--item-delay': `${index * this.staggerMs}ms`,
    };
  }

  private applyVars() {
    const el = this.sceneHostRef?.nativeElement;
    if (!el) return;
    el.style.setProperty('--radial-radius', `${this.radius}px`);
    el.style.setProperty('--radial-duration', `${this.duration}ms`);
    el.style.setProperty('--radial-stagger', `${this.staggerMs}ms`);
    el.style.setProperty('--spread-angle', `${this.spreadAngle}deg`);
  }

  private applyPositions() {
    const el = this.sceneHostRef?.nativeElement;
    if (!el) return;

    const items = el.querySelectorAll<HTMLElement>('.js-radial-item');
    items.forEach((item, index) => {
      const style = this.getItemStyle(index);
      Object.entries(style).forEach(([key, value]) => {
        item.style.setProperty(key, value);
      });
    });
  }

  drawDebug({ ctx, width, height }: { ctx: CanvasRenderingContext2D; width: number; height: number }) {
    ctx.clearRect(0, 0, width, height);
    const scene = this.sceneHostRef?.nativeElement;
    if (!scene) return;

    const hub = scene.querySelector<HTMLElement>('.js-radial-hub');
    if (!hub) return;

    const sceneRect = scene.getBoundingClientRect();
    const hubRect = hub.getBoundingClientRect();
    const cx = hubRect.left - sceneRect.left + hubRect.width / 2;
    const cy = hubRect.top - sceneRect.top + hubRect.height / 2;

    ctx.beginPath();
    ctx.setLineDash([4, 6]);
    ctx.strokeStyle = DEBUG_SOFT;
    ctx.lineWidth = 1;
    ctx.arc(cx, cy, this.radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    const startRad = ((-90 - this.spreadAngle / 2) * Math.PI) / 180;
    const endRad = ((-90 + this.spreadAngle / 2) * Math.PI) / 180;

    ctx.beginPath();
    ctx.strokeStyle = DEBUG_STROKE;
    ctx.lineWidth = 2;
    ctx.arc(cx, cy, this.radius + 4, startRad, endRad);
    ctx.stroke();

    this.items.forEach((_, index) => {
      const style = this.getItemStyle(index);
      const x = cx + parseFloat(style['--item-x']);
      const y = cy + parseFloat(style['--item-y']);

      ctx.beginPath();
      ctx.strokeStyle = this.isOpen ? DEBUG_STROKE : DEBUG_SOFT;
      ctx.moveTo(cx, cy);
      ctx.lineTo(x, y);
      ctx.stroke();

      ctx.beginPath();
      ctx.fillStyle = DEBUG_STROKE;
      ctx.arc(x, y, 5, 0, Math.PI * 2);
      ctx.fill();
    });
  }
}
