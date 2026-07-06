import { Component, AfterViewInit, OnDestroy, Inject, PLATFORM_ID, NgZone, ViewChild, ElementRef, ViewChildren, QueryList } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { LabDemoLayoutComponent } from '../lab-demo-layout/lab-demo-layout.component';

const LERP_FACTOR = 0.16;
const DEBUG_STROKE = 'rgba(245, 158, 11, 0.55)';
const DEBUG_SOFT = 'rgba(245, 158, 11, 0.22)';

import { ButtonComponent } from '../../../../shared/components/button/button.component';

@Component({
  selector: 'app-magnetic-button',
  standalone: true,
  imports: [CommonModule, LabDemoLayoutComponent, ButtonComponent],
  styleUrls: ['./magnetic-button.component.scss'],
  templateUrl: './magnetic-button.component.html'
})
export class MagneticButtonComponent implements AfterViewInit, OnDestroy {
  @ViewChild('majorBtn') majorBtnRef!: ElementRef<HTMLButtonElement>;
  @ViewChildren('minorBtn1, majorBtn, minorBtn2') btnRefs!: QueryList<ElementRef<HTMLButtonElement>>;

  items: any[] = [];
  lerpFactor = LERP_FACTOR;
  private pointer: { x: number, y: number } | null = null;
  private rafId: number | null = null;
  private boundTick!: () => void;
  private boundOnPointerMove!: (e: PointerEvent) => void;
  private boundOnPointerLeave!: () => void;

  sourceCode = `export class MagneticButtonComponent {
  lerpFactor = 0.16;
  
  tick() {
    this.items.forEach(item => {
      this.updateTarget(item);

      item.currentX += (item.targetX - item.currentX) * this.lerpFactor;
      item.currentY += (item.targetY - item.currentY) * this.lerpFactor;

      if (Math.abs(item.currentX) < 0.01 && Math.abs(item.targetX) === 0) item.currentX = 0;
      if (Math.abs(item.currentY) < 0.01 && Math.abs(item.targetY) === 0) item.currentY = 0;

      this.applyOffset(item);
    });
  }

  updateTarget(item) {
    if (!this.pointer) {
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
}`;

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private ngZone: NgZone
  ) {
    this.boundTick = this.tick.bind(this);
    this.boundOnPointerMove = this.onPointerMove.bind(this);
    this.boundOnPointerLeave = this.onPointerLeave.bind(this);
  }

  ngAfterViewInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.btnRefs.forEach((ref, index) => {
        const isMajor = index === 1;
        this.items.push({
          element: ref.nativeElement,
          radius: isMajor ? 170 : 110,
          strength: isMajor ? 0.5 : 0.4,
          initialRadius: isMajor ? 170 : 110,
          initialStrength: isMajor ? 0.5 : 0.4,
          currentX: 0,
          currentY: 0,
          targetX: 0,
          targetY: 0,
        });
      });

      const scene = document.querySelector('.js-lab-magnetic');
      if (scene) {
        scene.addEventListener('pointermove', this.boundOnPointerMove as EventListener);
        scene.addEventListener('pointerdown', this.boundOnPointerMove as EventListener);
        scene.addEventListener('pointerleave', this.boundOnPointerLeave as EventListener);
      }

      this.ngZone.runOutsideAngular(() => {
        this.rafId = requestAnimationFrame(this.boundTick);
      });
    }
  }

  ngOnDestroy() {
    if (this.rafId !== null) cancelAnimationFrame(this.rafId);
    if (isPlatformBrowser(this.platformId)) {
      const scene = document.querySelector('.js-lab-magnetic');
      if (scene) {
        scene.removeEventListener('pointermove', this.boundOnPointerMove as EventListener);
        scene.removeEventListener('pointerdown', this.boundOnPointerMove as EventListener);
        scene.removeEventListener('pointerleave', this.boundOnPointerLeave as EventListener);
      }
    }
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
      this.applyOffset(item);
    });
  }

  onParamChange(detail: any) {
    if (detail.id === 'lerp') this.lerpFactor = detail.value;
    if (detail.id === 'radius') {
      this.items.forEach(item => item.radius = detail.value);
    }
    if (detail.id === 'strength') {
      this.items.forEach(item => item.strength = detail.value);
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

  updateTarget(item: any) {
    if (!this.pointer) {
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

  getBaseCenter(item: any) {
    const rect = item.element.getBoundingClientRect();
    return {
      x: rect.left + rect.width / 2 - item.currentX,
      y: rect.top + rect.height / 2 - item.currentY,
    };
  }

  applyOffset(item: any) {
    item.element.style.setProperty('--mx', `${item.currentX.toFixed(1)}px`);
    item.element.style.setProperty('--my', `${item.currentY.toFixed(1)}px`);
  }

  drawDebug({ ctx, width, height }: any) {
    ctx.clearRect(0, 0, width, height);

    const scene = document.querySelector('.js-lab-magnetic');
    if (!scene) return;
    const sceneRect = scene.getBoundingClientRect();

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
