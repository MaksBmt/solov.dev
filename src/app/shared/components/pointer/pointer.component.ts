import { Component, ElementRef, OnInit, OnDestroy, Inject, PLATFORM_ID, NgZone, ViewChild, AfterViewInit } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { MouseTrackerService } from '../../../core/services/mouse-tracker.service';

const CURSOR_LERP = 0.35;
const BEAD_COUNT = 22;
const TRAIL_FADE = 0.32;

@Component({
  selector: 'app-pointer',
  standalone: true,
  templateUrl: './pointer.component.html',
  styleUrls: ['./pointer.component.scss'],
})
export class PointerComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('trailCanvas') trailCanvasRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('pointerDiv') pointerDivRef!: ElementRef<HTMLDivElement>;

  private trailCtx: CanvasRenderingContext2D | null = null;
  private cursorX: number = 0;
  private cursorY: number = 0;
  private prevX: number = 0;
  private prevY: number = 0;
  private intensity: number = 0;
  private time: number = 0;
  private rafId: number | null = null;
  private beads: any[] = [];
  private boundOnResize!: () => void;
  private boundOnMouseLeave!: () => void;
  private boundOnMouseEnter!: () => void;

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private ngZone: NgZone,
    private mouseTracker: MouseTrackerService
  ) {}

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.cursorX = window.innerWidth / 2;
      this.cursorY = window.innerHeight / 2;
      this.prevX = this.cursorX;
      this.prevY = this.cursorY;
    }
  }

  ngAfterViewInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.trailCtx = this.trailCanvasRef.nativeElement.getContext('2d');
      this.createBeads();
      this.resizeTrail();
      this.bindEvents();
      this.ngZone.runOutsideAngular(() => {
        this.startLoop();
      });
      this.setupMagneticTargets();
    }
  }

  ngOnDestroy() {
    if (isPlatformBrowser(this.platformId)) {
      if (this.rafId) {
        cancelAnimationFrame(this.rafId);
      }
      window.removeEventListener('resize', this.boundOnResize);
      document.documentElement.removeEventListener('mouseleave', this.boundOnMouseLeave);
      document.documentElement.removeEventListener('mouseenter', this.boundOnMouseEnter);
    }
  }

  private createBeads() {
    this.beads = Array.from({ length: BEAD_COUNT }, () => ({
      angle: Math.random() * Math.PI * 2,
      speed: (Math.random() * 0.06 + 0.02) * (Math.random() < 0.5 ? 1 : -1),
      orbit: Math.random() * 26 + 14,
      wobble: Math.random() * Math.PI * 2,
      size: Math.random() * 0.8 + 0.4,
      hue: 30 + Math.random() * 18,
      lag: Math.random() * 0.25 + 0.1,
      x: this.cursorX,
      y: this.cursorY,
    }));
  }

  private bindEvents() {
    this.boundOnResize = () => this.resizeTrail();
    window.addEventListener('resize', this.boundOnResize);

    this.boundOnMouseLeave = () => {
      this.pointerDivRef.nativeElement.classList.add('pointer--hidden');
    };
    this.boundOnMouseEnter = () => {
      this.pointerDivRef.nativeElement.classList.remove('pointer--hidden');
    };

    document.documentElement.addEventListener('mouseleave', this.boundOnMouseLeave);
    document.documentElement.addEventListener('mouseenter', this.boundOnMouseEnter);
  }

  public setupMagneticTargets() {
    // This can be called when new content is added, or we can use a directive instead.
    // To match original behavior exactly for now without rewriting the HTML:
    document.querySelectorAll('.js-magnetic-target').forEach((target) => {
      // Avoid duplicate listeners
      const oldEnter = (target as any)['_ptr_enter'];
      if (oldEnter) target.removeEventListener('mouseenter', oldEnter);
      const oldLeave = (target as any)['_ptr_leave'];
      if (oldLeave) target.removeEventListener('mouseleave', oldLeave);

      const enterFn = () => this.pointerDivRef.nativeElement.classList.add('pointer--magnetic');
      const leaveFn = () => this.pointerDivRef.nativeElement.classList.remove('pointer--magnetic');
      
      (target as any)['_ptr_enter'] = enterFn;
      (target as any)['_ptr_leave'] = leaveFn;

      target.addEventListener('mouseenter', enterFn);
      target.addEventListener('mouseleave', leaveFn);
    });
  }

  private resizeTrail() {
    if (!this.trailCanvasRef) return;
    const canvas = this.trailCanvasRef.nativeElement;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  private startLoop() {
    const tick = () => {
      const { x, y } = this.mouseTracker.getMousePosition();

      this.cursorX += (x - this.cursorX) * CURSOR_LERP;
      this.cursorY += (y - this.cursorY) * CURSOR_LERP;
      
      if (this.pointerDivRef?.nativeElement) {
        this.pointerDivRef.nativeElement.style.transform = `translate3d(${this.cursorX}px, ${this.cursorY}px, 0)`;
      }

      this.drawBeads();

      this.rafId = requestAnimationFrame(tick);
    };

    tick();
  }

  private drawBeads() {
    if (!this.trailCtx || !this.trailCanvasRef) return;

    const ctx = this.trailCtx;
    const canvas = this.trailCanvasRef.nativeElement;
    const { width, height } = canvas;

    this.time += 0.016;

    const Math_hypot = Math.hypot || function(a: number, b: number) { return Math.sqrt(a*a + b*b); };
    const speed = Math_hypot(this.cursorX - this.prevX, this.cursorY - this.prevY);
    this.prevX = this.cursorX;
    this.prevY = this.cursorY;

    const targetIntensity = Math.min(1, speed / 14);
    const ease = targetIntensity > this.intensity ? 0.3 : 0.16;
    this.intensity += (targetIntensity - this.intensity) * ease;

    ctx.globalCompositeOperation = 'destination-out';
    ctx.fillStyle = `rgba(0, 0, 0, ${TRAIL_FADE})`;
    ctx.fillRect(0, 0, width, height);

    if (this.intensity < 0.01) return;

    ctx.globalCompositeOperation = 'lighter';

    this.beads.forEach((bead) => {
      bead.angle += bead.speed;

      const orbit = bead.orbit * (0.75 + 0.25 * Math.sin(this.time * 2 + bead.wobble));
      const targetX = this.cursorX + Math.cos(bead.angle) * orbit;
      const targetY = this.cursorY + Math.sin(bead.angle) * orbit * 0.9;

      bead.x += (targetX - bead.x) * bead.lag;
      bead.y += (targetY - bead.y) * bead.lag;

      const flicker = 0.65 + 0.35 * Math.sin(this.time * 6 + bead.wobble * 3);
      const alpha = this.intensity * flicker;

      ctx.beginPath();
      ctx.arc(bead.x, bead.y, bead.size * 2.6, 0, Math.PI * 2);
      ctx.fillStyle = `hsla(${bead.hue}, 95%, 60%, ${alpha * 0.18})`;
      ctx.fill();

      ctx.beginPath();
      ctx.arc(bead.x, bead.y, bead.size, 0, Math.PI * 2);
      ctx.fillStyle = `hsla(${bead.hue}, 95%, 70%, ${alpha})`;
      ctx.fill();
    });

    ctx.globalCompositeOperation = 'source-over';
  }
}
