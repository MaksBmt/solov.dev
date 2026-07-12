import { Component, AfterViewInit, OnDestroy, PLATFORM_ID, NgZone, ViewChild, ElementRef, inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { LabDemoLayoutComponent } from '../../../shell/lab-demo-layout/lab-demo-layout.component';
import { ButtonComponent } from '../../../../../shared/components/button/button.component';
import { bindScenePointer, ScenePointerBinding } from '../../../utils/scene-pointer';

/**
 * Magnetic Button — THE.LAB / Cursor.
 *
 * В радиусе действия кнопка тянется за указателем: целевое смещение
 * пропорционально вектору «центр → курсор» с затуханием к краю радиуса,
 * текущее смещение догоняет целевое через линейную интерполяцию (lerp)
 * в цикле requestAnimationFrame. Результат пишется в CSS-переменные
 * --mx / --my, transform выполняет CSS.
 *
 * LERP_FACTOR — скорость догоняния (0.05…0.4): меньше = плавнее, больше = резче.
 * radius / strength — радиус поля и сила притяжения (data-атрибуты кнопки).
 */
const LERP_FACTOR = 0.16;
const DEBUG_STROKE = 'rgba(245, 158, 11, 0.55)';
const DEBUG_SOFT = 'rgba(245, 158, 11, 0.22)';

interface MagneticItem {
  element: HTMLElement;
  radius: number;
  strength: number;
  initialRadius: number;
  initialStrength: number;
  currentX: number;
  currentY: number;
  targetX: number;
  targetY: number;
}

@Component({
  selector: 'app-magnetic-button',
  standalone: true,
  imports: [CommonModule, LabDemoLayoutComponent, ButtonComponent],
  styleUrls: ['./magnetic-button.component.scss'],
  templateUrl: './magnetic-button.component.html'
})
export class MagneticButtonComponent implements AfterViewInit, OnDestroy {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly ngZone = inject(NgZone);

  @ViewChild('sceneHost') sceneHostRef!: ElementRef<HTMLElement>;

  items: MagneticItem[] = [];
  lerpFactor = LERP_FACTOR;

  private sceneEl: HTMLElement | null = null;
  private pointer: { x: number; y: number } | null = null;
  private rafId: number | null = null;
  private reducedMotion = false;
  private readonly boundTick = () => this.tick();
  private pointerBinding: ScenePointerBinding | null = null;

  ngAfterViewInit() {
    if (!isPlatformBrowser(this.platformId)) return;

    this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.sceneEl = this.sceneHostRef?.nativeElement ?? null;
    if (!this.sceneEl) return;

    this.items = Array.from(this.sceneEl.querySelectorAll<HTMLElement>('.js-magnetic-item')).map((element) => {
      const radius = Number(element.dataset['radius']) || 140;
      const strength = Number(element.dataset['strength']) || 0.45;
      return {
        element,
        radius,
        strength,
        initialRadius: radius,
        initialStrength: strength,
        currentX: 0,
        currentY: 0,
        targetX: 0,
        targetY: 0,
      };
    });

    if (this.items.length === 0) return;

    this.pointerBinding = bindScenePointer(this.sceneEl, {
      onMove: (e) => this.onPointerMove(e),
      onLeave: () => this.onPointerLeave(),
    });

    this.ngZone.runOutsideAngular(() => {
      this.rafId = requestAnimationFrame(this.boundTick);
    });
  }

  ngOnDestroy() {
    if (!isPlatformBrowser(this.platformId)) return;

    if (this.rafId !== null) cancelAnimationFrame(this.rafId);
    if (!this.sceneEl) return;

    this.pointerBinding?.unbind();
  }

  onPointerMove(event: PointerEvent) {
    this.pointer = { x: event.clientX, y: event.clientY };
  }

  onPointerLeave() {
    this.pointer = null;
  }

  reset() {
    this.pointer = null;
    this.lerpFactor = LERP_FACTOR;
    this.items.forEach((item) => {
      item.currentX = 0;
      item.currentY = 0;
      item.targetX = 0;
      item.targetY = 0;
      item.radius = item.initialRadius;
      item.strength = item.initialStrength;
      item.element.dataset['radius'] = String(item.initialRadius);
      item.element.dataset['strength'] = String(item.initialStrength);
      this.applyOffset(item);
    });
  }

  onParamChange(detail: { id: string; value: number }) {
    if (detail.id === 'lerp') {
      this.lerpFactor = detail.value;
      return;
    }

    if (detail.id === 'radius') {
      this.items.forEach((item) => {
        item.radius = detail.value;
        item.element.dataset['radius'] = String(detail.value);
      });
      return;
    }

    if (detail.id === 'strength') {
      this.items.forEach((item) => {
        item.strength = detail.value;
        item.element.dataset['strength'] = String(detail.value);
      });
    }
  }

  tick() {
    this.items.forEach((item) => {
      this.updateTarget(item);

      item.currentX += (item.targetX - item.currentX) * this.lerpFactor;
      item.currentY += (item.targetY - item.currentY) * this.lerpFactor;

      if (Math.abs(item.currentX) < 0.01 && Math.abs(item.targetX) === 0) item.currentX = 0;
      if (Math.abs(item.currentY) < 0.01 && Math.abs(item.targetY) === 0) item.currentY = 0;

      this.applyOffset(item);
    });

    this.rafId = requestAnimationFrame(this.boundTick);
  }

  updateTarget(item: MagneticItem) {
    if (!this.pointer || this.reducedMotion) {
      item.targetX = 0;
      item.targetY = 0;
      return;
    }

    const center = this.getBaseCenter(item);
    const deltaX = this.pointer.x - center.x;
    const deltaY = this.pointer.y - center.y;
    const distance = Math.hypot(deltaX, deltaY);

    if (distance > item.radius) {
      item.targetX = 0;
      item.targetY = 0;
      return;
    }

    const falloff = 1 - distance / item.radius;
    item.targetX = deltaX * item.strength * falloff * 2;
    item.targetY = deltaY * item.strength * falloff * 2;
  }

  getBaseCenter(item: MagneticItem) {
    const rect = item.element.getBoundingClientRect();
    return {
      x: rect.left + rect.width / 2 - item.currentX,
      y: rect.top + rect.height / 2 - item.currentY,
    };
  }

  applyOffset(item: MagneticItem) {
    item.element.style.setProperty('--mx', `${item.currentX.toFixed(1)}px`);
    item.element.style.setProperty('--my', `${item.currentY.toFixed(1)}px`);
  }

  drawDebug({ ctx, width, height }: { ctx: CanvasRenderingContext2D; width: number; height: number }) {
    ctx.clearRect(0, 0, width, height);
    if (!this.sceneEl) return;

    const sceneRect = this.sceneEl.getBoundingClientRect();

    this.items.forEach((item) => {
      const center = this.getBaseCenter(item);
      const x = center.x - sceneRect.left;
      const y = center.y - sceneRect.top;

      ctx.beginPath();
      ctx.setLineDash([4, 6]);
      ctx.strokeStyle = DEBUG_SOFT;
      ctx.lineWidth = 1;
      ctx.arc(x, y, item.radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.beginPath();
      ctx.fillStyle = DEBUG_STROKE;
      ctx.arc(x, y, 3, 0, Math.PI * 2);
      ctx.fill();

      if (Math.abs(item.currentX) > 0.5 || Math.abs(item.currentY) > 0.5) {
        ctx.beginPath();
        ctx.strokeStyle = DEBUG_STROKE;
        ctx.lineWidth = 1.5;
        ctx.moveTo(x, y);
        ctx.lineTo(x + item.currentX, y + item.currentY);
        ctx.stroke();

        ctx.fillStyle = 'rgba(253, 186, 116, 0.9)';
        ctx.beginPath();
        ctx.arc(x + item.currentX, y + item.currentY, 4, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    if (this.pointer) {
      const px = this.pointer.x - sceneRect.left;
      const py = this.pointer.y - sceneRect.top;
      ctx.strokeStyle = 'rgba(244, 244, 245, 0.5)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(px - 8, py);
      ctx.lineTo(px + 8, py);
      ctx.moveTo(px, py - 8);
      ctx.lineTo(px, py + 8);
      ctx.stroke();
    }
  }
}
