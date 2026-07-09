import {
  Component,
  AfterViewInit,
  OnDestroy,
  PLATFORM_ID,
  NgZone,
  ViewChild,
  ElementRef,
  inject,
  afterNextRender,
  Injector,
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { LabDemoLayoutComponent } from '../../../shell/lab-demo-layout/lab-demo-layout.component';

/**
 * Animated Shapes — THE.LAB / Backgrounds.
 *
 * Плавающие геометрические фигуры с parallax от курсора
 * и независимыми CSS-анимациями — многослойный depth-фон.
 */
const PARALLAX_STRENGTH = 28;
const POSITION_LERP = 0.1;
const FLOAT_SPEED = 1;
const SHAPE_COUNT = 14;
const DEFAULT_SHAPE_SEED = 7319;

interface Shape {
  id: number;
  type: 'circle' | 'square' | 'triangle' | 'ring';
  x: number;
  y: number;
  size: number;
  hue: number;
  depth: number;
  rotation: number;
  delay: number;
}

@Component({
  selector: 'app-animated-shapes',
  standalone: true,
  imports: [CommonModule, LabDemoLayoutComponent],
  styleUrls: ['./animated-shapes.component.scss'],
  templateUrl: './animated-shapes.component.html',
})
export class AnimatedShapesComponent implements AfterViewInit, OnDestroy {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly ngZone = inject(NgZone);
  private readonly injector = inject(Injector);

  @ViewChild('sceneHost') sceneHostRef!: ElementRef<HTMLElement>;

  parallaxStrength = PARALLAX_STRENGTH;
  positionLerp = POSITION_LERP;
  floatSpeed = FLOAT_SPEED;
  shapeCount = SHAPE_COUNT;

  shapes: Shape[] = createShapes(SHAPE_COUNT, DEFAULT_SHAPE_SEED);

  private shapeSeed = DEFAULT_SHAPE_SEED;

  private sceneEl: HTMLElement | null = null;
  private shapeEls: HTMLElement[] = [];
  private pointer = { x: 0.5, y: 0.5, active: false };
  private smooth = { x: 0.5, y: 0.5 };
  private rafId: number | null = null;
  private readonly boundOnPointerMove = (e: PointerEvent) => this.onPointerMove(e);
  private readonly boundOnPointerLeave = () => this.onPointerLeave();

  ngAfterViewInit() {
    if (!isPlatformBrowser(this.platformId)) return;

    afterNextRender(() => this.initScene(), { injector: this.injector });
  }

  private initScene() {
    this.sceneEl = this.sceneHostRef?.nativeElement ?? null;
    if (!this.sceneEl) return;

    this.scheduleShapeElsInit();
    this.applyVars();

    this.sceneEl.addEventListener('pointermove', this.boundOnPointerMove, { passive: true });
    this.sceneEl.addEventListener('pointerleave', this.boundOnPointerLeave);

    this.ngZone.runOutsideAngular(() => {
      const loop = () => {
        this.tick();
        this.rafId = requestAnimationFrame(loop);
      };
      this.rafId = requestAnimationFrame(loop);
    });
  }

  ngOnDestroy() {
    if (!isPlatformBrowser(this.platformId)) return;
    if (this.rafId !== null) cancelAnimationFrame(this.rafId);
    this.sceneEl?.removeEventListener('pointermove', this.boundOnPointerMove);
    this.sceneEl?.removeEventListener('pointerleave', this.boundOnPointerLeave);
  }

  reset() {
    this.parallaxStrength = PARALLAX_STRENGTH;
    this.positionLerp = POSITION_LERP;
    this.floatSpeed = FLOAT_SPEED;
    this.shapeCount = SHAPE_COUNT;
    this.shapeSeed = (Date.now() % 100000) + 1;
    this.shapes = createShapes(this.shapeCount, this.shapeSeed);
    this.scheduleShapeElsInit();
    this.applyVars();
  }

  onParamChange(detail: { id: string; value: number; silent?: boolean }) {
    if (detail.id === 'parallaxStrength') this.parallaxStrength = detail.value;
    if (detail.id === 'positionLerp') this.positionLerp = detail.value;
    if (detail.id === 'floatSpeed') this.floatSpeed = detail.value;
    if (detail.id === 'shapeCount') {
      const count = Math.round(detail.value);
      this.shapeCount = count;

      if (detail.silent && count === this.shapes.length) {
        this.applyVars();
        return;
      }

      if (count !== this.shapes.length) {
        this.shapes = createShapes(count, this.shapeSeed);
        this.scheduleShapeElsInit();
      }
    }
    this.applyVars();
  }

  private scheduleShapeElsInit() {
    this.ngZone.runOutsideAngular(() => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (!this.sceneEl) return;
          this.shapeEls = Array.from(this.sceneEl.querySelectorAll<HTMLElement>('.js-shape'));
          this.applyShapeParallax();
        });
      });
    });
  }

  private onPointerMove(event: PointerEvent) {
    if (!this.sceneEl) return;
    const rect = this.sceneEl.getBoundingClientRect();
    this.pointer.x = (event.clientX - rect.left) / rect.width;
    this.pointer.y = (event.clientY - rect.top) / rect.height;
    this.pointer.active = true;
  }

  private onPointerLeave() {
    this.pointer.active = false;
    this.pointer.x = 0.5;
    this.pointer.y = 0.5;
  }

  private tick() {
    const targetX = this.pointer.active ? this.pointer.x : 0.5;
    const targetY = this.pointer.active ? this.pointer.y : 0.5;
    this.smooth.x += (targetX - this.smooth.x) * this.positionLerp;
    this.smooth.y += (targetY - this.smooth.y) * this.positionLerp;
    this.applyShapeParallax();
    this.applyVars();
  }

  private applyShapeParallax() {
    this.shapes.forEach((shape, index) => {
      const el = this.shapeEls[index];
      if (!el) return;
      const px = (this.smooth.x - 0.5) * this.parallaxStrength * shape.depth;
      const py = (this.smooth.y - 0.5) * this.parallaxStrength * shape.depth;
      el.style.setProperty('--parallax-x', `${px}px`);
      el.style.setProperty('--parallax-y', `${py}px`);
    });
  }

  private applyVars() {
    const el = this.sceneHostRef?.nativeElement;
    if (!el) return;
    el.style.setProperty('--parallax-strength', String(this.parallaxStrength));
    el.style.setProperty('--shape-count', String(this.shapes.length));
    el.style.setProperty('--pointer-x', String((this.smooth.x * 100).toFixed(1)));
    el.style.setProperty('--pointer-y', String((this.smooth.y * 100).toFixed(1)));
  }
}

function createShapes(count: number, seed: number): Shape[] {
  const types: Shape['type'][] = ['circle', 'square', 'triangle', 'ring'];
  let state = seed;
  const rnd = () => {
    state = (state * 16807) % 2147483647;
    return (state - 1) / 2147483646;
  };

  return Array.from({ length: count }, (_, i) => ({
    id: i,
    type: types[i % types.length],
    x: 0.08 + rnd() * 0.84,
    y: 0.08 + rnd() * 0.84,
    size: 24 + rnd() * 56,
    hue: 25 + rnd() * 280,
    depth: 0.3 + rnd() * 0.7,
    rotation: rnd() * 360,
    delay: rnd() * -8,
  }));
}
