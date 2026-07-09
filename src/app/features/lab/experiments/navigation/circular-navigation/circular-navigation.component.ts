import { Component, AfterViewInit, OnDestroy, PLATFORM_ID, NgZone, ViewChild, ElementRef, inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { LabDemoLayoutComponent } from '../../../shell/lab-demo-layout/lab-demo-layout.component';

/**
 * Circular Navigation — THE.LAB / Navigation.
 *
 * Кольцо пунктов вращается к активному элементу
 * с плавной интерполяцией угла в requestAnimationFrame.
 */
const ROTATION_SPEED = 0.28;
const ACTIVE_SCALE = 1.2;
const RING_RADIUS = 130;

const DEBUG_STROKE = 'rgba(245, 158, 11, 0.55)';
const DEBUG_SOFT = 'rgba(245, 158, 11, 0.22)';

interface RingItem {
  label: string;
  icon: string;
}

@Component({
  selector: 'app-circular-navigation',
  standalone: true,
  imports: [CommonModule, LabDemoLayoutComponent],
  styleUrls: ['./circular-navigation.component.scss'],
  templateUrl: './circular-navigation.component.html',
})
export class CircularNavigationComponent implements AfterViewInit, OnDestroy {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly ngZone = inject(NgZone);

  @ViewChild('sceneHost') sceneHostRef!: ElementRef<HTMLElement>;
  @ViewChild('ringHost') ringHostRef!: ElementRef<HTMLElement>;

  items: RingItem[] = [
    { label: 'Design', icon: '◈' },
    { label: 'Code', icon: '{ }' },
    { label: 'Motion', icon: '〜' },
    { label: '3D', icon: '△' },
    { label: 'Audio', icon: '♫' },
    { label: 'Data', icon: '▤' },
  ];

  activeIndex = 0;
  rotationSpeed = ROTATION_SPEED;
  activeScale = ACTIVE_SCALE;
  ringRadius = RING_RADIUS;

  currentAngle = 0;
  targetAngle = 0;

  private rafId: number | null = null;
  private reducedMotion = false;
  private readonly boundTick = () => this.tick();

  ngAfterViewInit() {
    if (!isPlatformBrowser(this.platformId)) return;

    this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.applyVars();
    this.syncTarget();
    this.snapAngle();

    this.ngZone.runOutsideAngular(() => {
      this.rafId = requestAnimationFrame(this.boundTick);
    });
  }

  ngOnDestroy() {
    if (this.rafId !== null) cancelAnimationFrame(this.rafId);
  }

  selectItem(index: number) {
    this.activeIndex = index;
    this.syncTarget();
  }

  reset() {
    this.activeIndex = 0;
    this.rotationSpeed = ROTATION_SPEED;
    this.activeScale = ACTIVE_SCALE;
    this.ringRadius = RING_RADIUS;
    this.applyVars();
    this.syncTarget();
    this.snapAngle();
  }

  onParamChange(detail: { id: string; value: number }) {
    if (detail.id === 'rotationSpeed') this.rotationSpeed = detail.value;
    else if (detail.id === 'activeScale') this.activeScale = detail.value;
    else if (detail.id === 'ringRadius') {
      this.ringRadius = detail.value;
      this.applyVars();
    }
  }

  getItemStyle(index: number): Record<string, string> {
    const step = 360 / this.items.length;
    const angle = step * index;
    const rad = (angle * Math.PI) / 180;
    const x = Math.sin(rad) * this.ringRadius;
    const y = -Math.cos(rad) * this.ringRadius;
    const isActive = index === this.activeIndex;

    return {
      '--ring-x': `${x}px`,
      '--ring-y': `${y}px`,
      '--item-scale': isActive ? String(this.activeScale) : '1',
    };
  }

  private applyVars() {
    const el = this.sceneHostRef?.nativeElement;
    if (!el) return;
    el.style.setProperty('--ring-radius', `${this.ringRadius}px`);
    el.style.setProperty('--ring-angle', `${this.currentAngle}deg`);
    el.style.setProperty('--active-scale', String(this.activeScale));
  }

  private syncTarget() {
    const step = 360 / this.items.length;
    this.targetAngle = -step * this.activeIndex;
  }

  private snapAngle() {
    this.currentAngle = this.targetAngle;
    this.applyVars();
  }

  private tick() {
    const lerp = this.reducedMotion ? 1 : this.rotationSpeed;
    let delta = this.targetAngle - this.currentAngle;

    while (delta > 180) delta -= 360;
    while (delta < -180) delta += 360;

    this.currentAngle += delta * lerp;
    this.applyVars();
    this.rafId = requestAnimationFrame(this.boundTick);
  }

  drawDebug({ ctx, width, height }: { ctx: CanvasRenderingContext2D; width: number; height: number }) {
    ctx.clearRect(0, 0, width, height);
    const scene = this.sceneHostRef?.nativeElement;
    const ring = this.ringHostRef?.nativeElement;
    if (!scene || !ring) return;

    const sceneRect = scene.getBoundingClientRect();
    const ringRect = ring.getBoundingClientRect();
    const cx = ringRect.left - sceneRect.left + ringRect.width / 2;
    const cy = ringRect.top - sceneRect.top + ringRect.height / 2;

    ctx.beginPath();
    ctx.setLineDash([4, 6]);
    ctx.strokeStyle = DEBUG_SOFT;
    ctx.lineWidth = 1;
    ctx.arc(cx, cy, this.ringRadius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    this.items.forEach((_, index) => {
      const style = this.getItemStyle(index);
      const x = cx + parseFloat(style['--ring-x']);
      const y = cy + parseFloat(style['--ring-y']);

      ctx.beginPath();
      ctx.strokeStyle = index === this.activeIndex ? DEBUG_STROKE : DEBUG_SOFT;
      ctx.lineWidth = index === this.activeIndex ? 2 : 1;
      ctx.moveTo(cx, cy);
      ctx.lineTo(x, y);
      ctx.stroke();

      ctx.beginPath();
      ctx.fillStyle = index === this.activeIndex ? DEBUG_STROKE : DEBUG_SOFT;
      ctx.arc(x, y, index === this.activeIndex ? 6 : 4, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate((this.currentAngle * Math.PI) / 180);
    ctx.strokeStyle = DEBUG_STROKE;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, -this.ringRadius - 16);
    ctx.stroke();
    ctx.restore();
  }
}
