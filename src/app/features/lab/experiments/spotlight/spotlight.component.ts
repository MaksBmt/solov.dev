import { Component, AfterViewInit, OnDestroy, Inject, PLATFORM_ID, NgZone, ViewChild, ElementRef } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { LabDemoLayoutComponent } from '../lab-demo-layout/lab-demo-layout.component';

const POSITION_LERP = 0.12;
const RADIUS_LERP = 0.08;
const ACTIVE_RADIUS = 220;

@Component({
  selector: 'app-spotlight-content',
  standalone: true,
  templateUrl: './spotlight-content.component.html'
})
export class SpotlightContentComponent {}

@Component({
  selector: 'app-spotlight',
  standalone: true,
  imports: [CommonModule, LabDemoLayoutComponent, SpotlightContentComponent],
  styleUrls: ['./spotlight.component.scss'],
  templateUrl: './spotlight.component.html'
})
export class SpotlightComponent implements AfterViewInit, OnDestroy {
  @ViewChild('spotlight') spotlightRef!: ElementRef<HTMLDivElement>;

  positionLerp = POSITION_LERP;
  radiusLerp = RADIUS_LERP;
  activeRadius = ACTIVE_RADIUS;
  
  private pointer: { x: number, y: number } | null = null;
  current = { x: 0, y: 0, radius: 0 };
  private rafId: number | null = null;
  private boundTick!: () => void;
  private boundOnPointerMove!: (e: PointerEvent) => void;
  private boundOnPointerLeave!: () => void;

  sourceCode = `export class SpotlightComponent {
  positionLerp = 0.12;
  radiusLerp = 0.08;
  activeRadius = 220;

  tick() {
    const targetRadius = this.pointer ? this.activeRadius : 0;

    if (this.pointer) {
      this.current.x += (this.pointer.x - this.current.x) * this.positionLerp;
      this.current.y += (this.pointer.y - this.current.y) * this.positionLerp;
    }
    this.current.radius += (targetRadius - this.current.radius) * this.radiusLerp;

    if (this.current.radius < 0.5 && targetRadius === 0) {
      this.current.radius = 0;
    }

    this.applyVars();
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
      const scene = document.querySelector('.js-lab-spotlight-scene');
      if (scene) {
        this.current.x = scene.clientWidth / 2;
        this.current.y = scene.clientHeight / 2;
        this.applyVars();

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
      const scene = document.querySelector('.js-lab-spotlight-scene');
      if (scene) {
        scene.removeEventListener('pointermove', this.boundOnPointerMove as EventListener);
        scene.removeEventListener('pointerdown', this.boundOnPointerMove as EventListener);
        scene.removeEventListener('pointerleave', this.boundOnPointerLeave as EventListener);
      }
    }
  }

  onPointerMove(event: PointerEvent) {
    const scene = document.querySelector('.js-lab-spotlight-scene') as HTMLElement;
    if (scene) {
      const rect = scene.getBoundingClientRect();
      this.pointer = {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
      };
    }
  }

  onPointerLeave() {
    this.pointer = null;
  }

  reset() {
    this.pointer = null;
    this.positionLerp = POSITION_LERP;
    this.radiusLerp = RADIUS_LERP;
    this.activeRadius = ACTIVE_RADIUS;
    
    const scene = document.querySelector('.js-lab-spotlight-scene') as HTMLElement;
    if (scene) {
      this.current.x = scene.clientWidth / 2;
      this.current.y = scene.clientHeight / 2;
      this.current.radius = 0;
      this.applyVars();
    }
  }

  onParamChange(detail: any) {
    if (detail.id === 'positionLerp') this.positionLerp = detail.value;
    if (detail.id === 'activeRadius') this.activeRadius = detail.value;
    if (detail.id === 'radiusLerp') this.radiusLerp = detail.value;
  }

  tick() {
    const targetRadius = this.pointer ? this.activeRadius : 0;

    if (this.pointer) {
      this.current.x += (this.pointer.x - this.current.x) * this.positionLerp;
      this.current.y += (this.pointer.y - this.current.y) * this.positionLerp;
    }
    this.current.radius += (targetRadius - this.current.radius) * this.radiusLerp;

    if (this.current.radius < 0.5 && targetRadius === 0) {
      this.current.radius = 0;
    }

    this.applyVars();
    this.rafId = requestAnimationFrame(this.boundTick);
  }

  applyVars() {
    if (this.spotlightRef?.nativeElement) {
      this.spotlightRef.nativeElement.style.setProperty('--sx', `${this.current.x.toFixed(1)}px`);
      this.spotlightRef.nativeElement.style.setProperty('--sy', `${this.current.y.toFixed(1)}px`);
      this.spotlightRef.nativeElement.style.setProperty('--sr', `${this.current.radius.toFixed(1)}px`);
    }
  }

  drawDebug({ ctx, width, height }: any) {
    ctx.clearRect(0, 0, width, height);

    const { x, y, radius } = this.current;

    ctx.beginPath();
    ctx.setLineDash([4, 6]);
    ctx.strokeStyle = 'rgba(245, 158, 11, 0.5)';
    ctx.lineWidth = 1;
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.stroke();

    ctx.beginPath();
    ctx.strokeStyle = 'rgba(245, 158, 11, 0.25)';
    ctx.arc(x, y, radius * 0.35, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = 'rgba(253, 186, 116, 0.9)';
    ctx.beginPath();
    ctx.arc(x, y, 3, 0, Math.PI * 2);
    ctx.fill();

    if (this.pointer) {
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(244, 244, 245, 0.4)';
      ctx.moveTo(x, y);
      ctx.lineTo(this.pointer.x, this.pointer.y);
      ctx.stroke();

      ctx.strokeStyle = 'rgba(244, 244, 245, 0.6)';
      ctx.beginPath();
      ctx.moveTo(this.pointer.x - 8, this.pointer.y);
      ctx.lineTo(this.pointer.x + 8, this.pointer.y);
      ctx.moveTo(this.pointer.x, this.pointer.y - 8);
      ctx.lineTo(this.pointer.x, this.pointer.y + 8);
      ctx.stroke();
    }
  }
}
