import {
  Component,
  AfterViewInit,
  OnDestroy,
  PLATFORM_ID,
  NgZone,
  ViewChild,
  ElementRef,
  inject,
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { LabDemoLayoutComponent } from '../../../shell/lab-demo-layout/lab-demo-layout.component';
import { bindScenePointer, ScenePointerBinding } from '../../../utils/scene-pointer';

/**
 * Letter Physics — THE.LAB / Typography.
 *
 * Каждая буква — пружинная частица: отталкивается от курсора,
 * возвращается к исходной позиции с damping.
 */
const SPRING = 0.08;
const DAMPING = 0.82;
const REPULSION = 420;
const REPULSION_RADIUS = 140;
const POINTER_LERP = 0.22;

interface LetterBody {
  char: string;
  baseX: number;
  baseY: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
}

@Component({
  selector: 'app-letter-physics',
  standalone: true,
  imports: [CommonModule, LabDemoLayoutComponent],
  styleUrls: ['./letter-physics.component.scss'],
  templateUrl: './letter-physics.component.html',
})
export class LetterPhysicsComponent implements AfterViewInit, OnDestroy {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly ngZone = inject(NgZone);

  @ViewChild('sceneHost') sceneHostRef!: ElementRef<HTMLElement>;

  spring = SPRING;
  damping = DAMPING;
  repulsion = REPULSION;
  repulsionRadius = REPULSION_RADIUS;

  readonly phrase = 'PHYSICS';
  letters: LetterBody[] = [];

  private sceneEl: HTMLElement | null = null;
  private fieldEl: HTMLElement | null = null;
  private letterEls: HTMLElement[] = [];
  private pointer = { x: 0, y: 0, active: false };
  private smoothPointer = { x: 0, y: 0 };
  private rafId: number | null = null;
  private resizeObserver: ResizeObserver | null = null;
  private reducedMotion = false;
  private pointerBinding: ScenePointerBinding | null = null;

  ngAfterViewInit() {
    if (!isPlatformBrowser(this.platformId)) return;

    this.sceneEl = this.sceneHostRef?.nativeElement ?? null;
    this.fieldEl = this.sceneEl?.querySelector<HTMLElement>('.js-letter-field') ?? null;
    if (!this.sceneEl || !this.fieldEl) return;

    this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.pointerBinding = bindScenePointer(this.sceneEl, {
      onMove: (e) => this.onPointerMove(e),
      onLeave: () => this.onPointerLeave(),
    });

    this.resizeObserver = new ResizeObserver(() => this.layoutLetters());
    this.resizeObserver.observe(this.fieldEl);

    queueMicrotask(() => this.layoutLetters());

    if (!this.reducedMotion) {
      this.ngZone.runOutsideAngular(() => {
        const loop = () => {
          this.tick();
          this.rafId = requestAnimationFrame(loop);
        };
        this.rafId = requestAnimationFrame(loop);
      });
    }
  }

  ngOnDestroy() {
    if (!isPlatformBrowser(this.platformId)) return;
    if (this.rafId !== null) cancelAnimationFrame(this.rafId);
    this.resizeObserver?.disconnect();
    this.pointerBinding?.unbind();
  }

  onPointerMove(event: PointerEvent) {
    if (!this.fieldEl) return;
    const rect = this.fieldEl.getBoundingClientRect();
    this.pointer = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
      active: true,
    };
  }

  onPointerLeave() {
    this.pointer.active = false;
  }

  reset() {
    this.spring = SPRING;
    this.damping = DAMPING;
    this.repulsion = REPULSION;
    this.repulsionRadius = REPULSION_RADIUS;
    this.layoutLetters();
  }

  onParamChange(detail: { id: string; value: number }) {
    if (detail.id === 'spring') this.spring = detail.value;
    if (detail.id === 'damping') this.damping = detail.value;
    if (detail.id === 'repulsion') this.repulsion = detail.value;
    if (detail.id === 'repulsionRadius') this.repulsionRadius = detail.value;
  }

  letterTransform(letter: LetterBody) {
    const dx = letter.x - letter.baseX;
    const dy = letter.y - letter.baseY;
    const tilt = Math.max(-18, Math.min(18, dx * 0.12));
    return `translate(${dx.toFixed(2)}px, ${dy.toFixed(2)}px) rotate(${tilt.toFixed(2)}deg)`;
  }

  private layoutLetters() {
    if (!this.fieldEl) return;

    this.letterEls = Array.from(this.fieldEl.querySelectorAll<HTMLElement>('.js-letter'));
    const fieldRect = this.fieldEl.getBoundingClientRect();
    this.letters = this.letterEls.map((el, index) => {
      const rect = el.getBoundingClientRect();
      const baseX = rect.left - fieldRect.left + rect.width / 2;
      const baseY = rect.top - fieldRect.top + rect.height / 2;
      return {
        char: this.phrase[index] ?? '?',
        baseX,
        baseY,
        x: baseX,
        y: baseY,
        vx: 0,
        vy: 0,
      };
    });

    this.smoothPointer.x = fieldRect.width / 2;
    this.smoothPointer.y = fieldRect.height / 2;
  }

  private tick() {
    if (!this.fieldEl || this.letters.length === 0) return;

    if (this.pointer.active) {
      this.smoothPointer.x += (this.pointer.x - this.smoothPointer.x) * POINTER_LERP;
      this.smoothPointer.y += (this.pointer.y - this.smoothPointer.y) * POINTER_LERP;
    }

    const px = this.smoothPointer.x;
    const py = this.smoothPointer.y;

    this.letters.forEach((letter, index) => {
      let fx = (letter.baseX - letter.x) * this.spring;
      let fy = (letter.baseY - letter.y) * this.spring;

      if (this.pointer.active) {
        const dx = letter.x - px;
        const dy = letter.y - py;
        const dist = Math.hypot(dx, dy);
        if (dist < this.repulsionRadius && dist > 0.5) {
          const force = (1 - dist / this.repulsionRadius) * this.repulsion;
          fx += (dx / dist) * force * 0.016;
          fy += (dy / dist) * force * 0.016;
        }
      }

      letter.vx = (letter.vx + fx) * this.damping;
      letter.vy = (letter.vy + fy) * this.damping;
      letter.x += letter.vx;
      letter.y += letter.vy;

      const el = this.letterEls[index];
      if (el) {
        el.style.transform = this.letterTransform(letter);
      }
    });
  }

  drawDebug({ ctx, width, height }: { ctx: CanvasRenderingContext2D; width: number; height: number }) {
    ctx.clearRect(0, 0, width, height);

    if (this.pointer.active) {
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.35)';
      ctx.arc(this.smoothPointer.x, this.smoothPointer.y, this.repulsionRadius, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.fillStyle = 'rgba(253, 186, 116, 0.9)';
    ctx.font = '11px monospace';
    ctx.fillText(`letters: ${this.letters.length}`, 12, 18);
  }
}
