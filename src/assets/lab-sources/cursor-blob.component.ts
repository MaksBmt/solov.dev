import { Component, AfterViewInit, OnDestroy, Inject, PLATFORM_ID, NgZone, ViewChild, ElementRef } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { LabDemoLayoutComponent } from '../../../shell/lab-demo-layout/lab-demo-layout.component';

/**
 * Cursor Blob — THE.LAB / Cursor.
 *
 * Одна SVG-капля: центр догоняет курсор через lerp, скорость
 * Скорость берётся из движения курсора, капля вытягивается эллипсом
 * по направлению velocity. Замкнутый path — кубические Безье между точками.
 *
 * POSITION_LERP — скорость следования центра за курсором (0.08…0.5).
 * STRETCH — сила деформации от скорости (0.3…2.5).
 * BASE_RADIUS — радиус капли в покое (20…56 px).
 * VELOCITY_LERP — сглаживание скорости курсора (0.05…0.5).
 */
const POINT_COUNT = 8;
const POSITION_LERP = 0.38;
const VELOCITY_LERP = 0.28;
const BASE_RADIUS = 34;
const STRETCH = 1.35;
const MIN_RADIUS = 10;

interface BlobPoint {
  x: number;
  y: number;
}

@Component({
  selector: 'app-cursor-blob',
  standalone: true,
  imports: [LabDemoLayoutComponent],
  styleUrls: ['./cursor-blob.component.scss'],
  templateUrl: './cursor-blob.component.html'
})
export class CursorBlobComponent implements AfterViewInit, OnDestroy {
  @ViewChild('sceneHost') sceneHostRef!: ElementRef<HTMLElement>;

  positionLerp = POSITION_LERP;
  velocityLerp = VELOCITY_LERP;
  baseRadius = BASE_RADIUS;
  stretch = STRETCH;

  private sceneEl: HTMLElement | null = null;
  private blobEl: HTMLElement | null = null;
  private pathEl: SVGPathElement | null = null;
  private pointer: { x: number; y: number } | null = null;
  private lastPointer: { x: number; y: number } | null = null;
  private center = { x: 0, y: 0 };
  private velocity = { x: 0, y: 0 };
  private anchorPoints: BlobPoint[] = [];
  private rafId: number | null = null;
  private reducedMotion = false;
  private boundTick!: () => void;
  private boundOnPointerMove!: (e: PointerEvent) => void;
  private boundOnPointerLeave!: () => void;

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private ngZone: NgZone
  ) {
    this.boundTick = this.tick.bind(this);
    this.boundOnPointerMove = this.onPointerMove.bind(this);
    this.boundOnPointerLeave = this.onPointerLeave.bind(this);
  }

  ngAfterViewInit() {
    if (!isPlatformBrowser(this.platformId)) return;

    this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.sceneEl = this.sceneHostRef?.nativeElement ?? null;
    this.blobEl = this.sceneEl?.querySelector<HTMLElement>('.js-blob') ?? null;
    this.pathEl = this.sceneEl?.querySelector<SVGPathElement>('.js-blob-path') ?? null;

    if (!this.sceneEl || !this.blobEl || !this.pathEl) return;

    this.reset();
    this.sceneEl.addEventListener('pointermove', this.boundOnPointerMove);
    this.sceneEl.addEventListener('pointerdown', this.boundOnPointerMove);
    this.sceneEl.addEventListener('pointerleave', this.boundOnPointerLeave);

    this.ngZone.runOutsideAngular(() => {
      this.rafId = requestAnimationFrame(this.boundTick);
    });
  }

  ngOnDestroy() {
    if (this.rafId !== null) cancelAnimationFrame(this.rafId);
    if (!this.sceneEl) return;

    this.sceneEl.removeEventListener('pointermove', this.boundOnPointerMove);
    this.sceneEl.removeEventListener('pointerdown', this.boundOnPointerMove);
    this.sceneEl.removeEventListener('pointerleave', this.boundOnPointerLeave);
  }

  onPointerMove(event: PointerEvent) {
    if (!this.sceneEl) return;

    const rect = this.sceneEl.getBoundingClientRect();
    this.pointer = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
  }

  onPointerLeave() {
    this.pointer = null;
    this.lastPointer = null;
  }

  reset() {
    this.pointer = null;
    this.lastPointer = null;
    this.positionLerp = POSITION_LERP;
    this.velocityLerp = VELOCITY_LERP;
    this.baseRadius = BASE_RADIUS;
    this.stretch = STRETCH;
    this.velocity = { x: 0, y: 0 };

    const centerX = this.sceneEl ? this.sceneEl.clientWidth / 2 : 0;
    const centerY = this.sceneEl ? this.sceneEl.clientHeight / 2 : 0;
    this.center = { x: centerX, y: centerY };
    this.updateShape(0, 0);
    this.applyVars();
  }

  onParamChange(detail: { id: string; value: number }) {
    if (detail.id === 'positionLerp') this.positionLerp = detail.value;
    if (detail.id === 'velocityLerp') this.velocityLerp = detail.value;
    if (detail.id === 'baseRadius') this.baseRadius = detail.value;
    if (detail.id === 'stretch') this.stretch = detail.value;
  }

  tick() {
    const target = this.pointer || this.center;
    const positionLerp = this.reducedMotion ? 1 : this.positionLerp;

    this.center.x += (target.x - this.center.x) * positionLerp;
    this.center.y += (target.y - this.center.y) * positionLerp;

    let rawVx = 0;
    let rawVy = 0;

    if (this.pointer) {
      if (this.lastPointer) {
        rawVx = this.pointer.x - this.lastPointer.x;
        rawVy = this.pointer.y - this.lastPointer.y;
      }
      this.lastPointer = { x: this.pointer.x, y: this.pointer.y };
    } else {
      this.lastPointer = null;
      rawVx = this.velocity.x * 0.78;
      rawVy = this.velocity.y * 0.78;
    }

    const velocityLerp = this.reducedMotion ? 1 : this.velocityLerp;
    this.velocity.x += (rawVx - this.velocity.x) * velocityLerp;
    this.velocity.y += (rawVy - this.velocity.y) * velocityLerp;

    this.updateShape(this.velocity.x, this.velocity.y);
    this.applyVars();
    this.rafId = requestAnimationFrame(this.boundTick);
  }

  private updateShape(vx: number, vy: number) {
    this.anchorPoints = [];

    const speed = Math.hypot(vx, vy);
    const heading = speed > 0.01 ? Math.atan2(vy, vx) : 0;
    const stretchAmount = Math.min(speed * this.stretch, this.baseRadius * 1.35);
    const radiusX = this.baseRadius + stretchAmount;
    const radiusY = Math.max(MIN_RADIUS, this.baseRadius - stretchAmount * 0.42);
    const cosH = Math.cos(heading);
    const sinH = Math.sin(heading);

    for (let i = 0; i < POINT_COUNT; i += 1) {
      const localAngle = (i / POINT_COUNT) * Math.PI * 2 - Math.PI / 2;
      const localX = Math.cos(localAngle) * radiusX;
      const localY = Math.sin(localAngle) * radiusY;

      this.anchorPoints.push({
        x: this.center.x + localX * cosH - localY * sinH,
        y: this.center.y + localX * sinH + localY * cosH,
      });
    }

    this.pathEl?.setAttribute('d', this.pointsToPath(this.anchorPoints));
  }

  private pointsToPath(points: BlobPoint[]): string {
    const count = points.length;
    if (count < 3) return '';

    let path = `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;

    for (let i = 0; i < count; i += 1) {
      const p0 = points[(i - 1 + count) % count];
      const p1 = points[i];
      const p2 = points[(i + 1) % count];
      const p3 = points[(i + 2) % count];

      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;

      path += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
    }

    return `${path} Z`;
  }

  private applyVars() {
    if (!this.blobEl) return;

    this.blobEl.style.setProperty('--bx', `${this.center.x.toFixed(1)}px`);
    this.blobEl.style.setProperty('--by', `${this.center.y.toFixed(1)}px`);
  }

  drawDebug({ ctx, width, height }: { ctx: CanvasRenderingContext2D; width: number; height: number }) {
    ctx.clearRect(0, 0, width, height);

    ctx.beginPath();
    ctx.setLineDash([4, 6]);
    ctx.strokeStyle = 'rgba(245, 158, 11, 0.25)';
    ctx.lineWidth = 1;
    ctx.arc(this.center.x, this.center.y, this.baseRadius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    this.anchorPoints.forEach((point, index) => {
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.45)';
      ctx.moveTo(this.center.x, this.center.y);
      ctx.lineTo(point.x, point.y);
      ctx.stroke();

      ctx.fillStyle = index === 0 ? 'rgba(253, 186, 116, 0.95)' : 'rgba(245, 158, 11, 0.65)';
      ctx.beginPath();
      ctx.arc(point.x, point.y, 3, 0, Math.PI * 2);
      ctx.fill();
    });

    const speed = Math.hypot(this.velocity.x, this.velocity.y);
    if (speed > 0.5) {
      const scale = Math.min(speed * 4, 80);
      const endX = this.center.x + (this.velocity.x / speed) * scale;
      const endY = this.center.y + (this.velocity.y / speed) * scale;

      ctx.beginPath();
      ctx.strokeStyle = 'rgba(244, 244, 245, 0.55)';
      ctx.lineWidth = 1.5;
      ctx.moveTo(this.center.x, this.center.y);
      ctx.lineTo(endX, endY);
      ctx.stroke();
    }

    ctx.fillStyle = 'rgba(253, 186, 116, 0.9)';
    ctx.beginPath();
    ctx.arc(this.center.x, this.center.y, 3, 0, Math.PI * 2);
    ctx.fill();

    if (this.pointer) {
      ctx.strokeStyle = 'rgba(244, 244, 245, 0.6)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(this.pointer.x - 8, this.pointer.y);
      ctx.lineTo(this.pointer.x + 8, this.pointer.y);
      ctx.moveTo(this.pointer.x, this.pointer.y - 8);
      ctx.lineTo(this.pointer.x, this.pointer.y + 8);
      ctx.stroke();
    }
  }
}
