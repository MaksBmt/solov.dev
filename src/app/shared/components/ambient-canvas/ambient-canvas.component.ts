import { Component, ElementRef, OnDestroy, PLATFORM_ID, NgZone, ViewChild, AfterViewInit, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { MouseTrackerService } from '../../../core/services/mouse-tracker.service';
import SphereLine, { createBundle } from '../../../core/utils/sphere-line';

const BUNDLES = [
  ['glow', 24, 42, 90],
  ['glow', 22, 28, 85],
  ['glow', 20, 16, 65],
  ['glow', 20, 48, 55],
  ['glow', 16, 222, 14],
  ['smoke', 8, 30, 20],
  ['smoke', 6, 220, 12],
  ['dots', 6, 38, 85],
  ['dots', 5, 20, 75],
] as const;

const FOG_DOWNSCALE = 7;
const FOG_ALPHA = 0.85;
const BACKGROUND_COLOR = '#0a0b0e';

@Component({
  selector: 'app-ambient-canvas',
  standalone: true,
  templateUrl: './ambient-canvas.component.html',
  styleUrls: ['./ambient-canvas.component.scss'],
})
export class AmbientCanvasComponent implements AfterViewInit, OnDestroy {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly ngZone = inject(NgZone);
  private readonly mouseTracker = inject(MouseTrackerService);

  @ViewChild('canvasRef') canvasRef!: ElementRef<HTMLCanvasElement>;

  private ctx: CanvasRenderingContext2D | null = null;
  private lines: SphereLine[] = [];
  private time = 0;
  private rafId: number | null = null;
  private rotX = 0;
  private rotY = 0;
  private viewport = { width: 0, height: 0 };
  private fogCanvas!: HTMLCanvasElement;
  private fogCtx!: CanvasRenderingContext2D;
  private boundOnResize = () => this.resize();

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      this.viewport.width = window.innerWidth;
      this.viewport.height = window.innerHeight;
    }
  }

  ngAfterViewInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.ctx = this.canvasRef.nativeElement.getContext('2d');
      this.fogCanvas = document.createElement('canvas');
      this.fogCtx = this.fogCanvas.getContext('2d')!;

      this.resize();
      this.createLines();
      this.bindResize();

      this.ngZone.runOutsideAngular(() => {
        this.startLoop();
      });
    }
  }

  ngOnDestroy() {
    if (isPlatformBrowser(this.platformId)) {
      if (this.rafId) cancelAnimationFrame(this.rafId);
      window.removeEventListener('resize', this.boundOnResize);
    }
  }

  private createLines() {
    this.lines = [];
    BUNDLES.forEach(([layer, count, hue, saturation]) => {
      const bundle = createBundle(layer as string, hue as number, saturation as number);
      for (let i = 0; i < (count as number); i += 1) {
        this.lines.push(new SphereLine(this.viewport, bundle, i, count as number));
      }
    });
  }

  private bindResize() {
    window.addEventListener('resize', this.boundOnResize);
  }

  private resize() {
    this.viewport.width = window.innerWidth;
    this.viewport.height = window.innerHeight;

    if (this.canvasRef?.nativeElement) {
      this.canvasRef.nativeElement.width = this.viewport.width;
      this.canvasRef.nativeElement.height = this.viewport.height;
    }

    if (this.fogCanvas) {
      this.fogCanvas.width = Math.max(2, Math.round(this.viewport.width / FOG_DOWNSCALE));
      this.fogCanvas.height = Math.max(2, Math.round(this.viewport.height / FOG_DOWNSCALE));
    }

    this.lines.forEach((line) => line.setViewport(this.viewport));
  }

  private startLoop() {
    const tick = () => {
      const { x, y } = this.mouseTracker.getMousePosition();
      const { width, height } = this.viewport;

      this.time += 0.016;

      const targetRotY = this.time * 0.05 + ((x / width) - 0.5) * 0.4;
      const targetRotX = ((y / height) - 0.5) * 0.3;
      this.rotY += (targetRotY - this.rotY) * 0.05;
      this.rotX += (targetRotX - this.rotX) * 0.05;

      if (!this.ctx) return;

      this.ctx.globalCompositeOperation = 'source-over';
      this.ctx.fillStyle = BACKGROUND_COLOR;
      this.ctx.fillRect(0, 0, width, height);

      this.lines.forEach((line) => line.update(this.time, this.rotX, this.rotY, x, y));

      this.lines.forEach((line) => {
        if (line.layer === 'smoke') line.draw(this.ctx!, this.time);
      });

      this.ctx.globalCompositeOperation = 'lighter';
      this.lines.forEach((line) => {
        if (line.layer !== 'smoke') line.draw(this.ctx!, this.time);
      });

      this.fogCtx.globalCompositeOperation = 'source-over';
      this.fogCtx.clearRect(0, 0, this.fogCanvas.width, this.fogCanvas.height);
      this.fogCtx.drawImage(this.canvasRef.nativeElement, 0, 0, this.fogCanvas.width, this.fogCanvas.height);

      this.fogCtx.globalCompositeOperation = 'difference';
      this.fogCtx.fillStyle = BACKGROUND_COLOR;
      this.fogCtx.fillRect(0, 0, this.fogCanvas.width, this.fogCanvas.height);

      this.ctx.globalAlpha = FOG_ALPHA;
      this.ctx.drawImage(this.fogCanvas, 0, 0, width, height);
      this.ctx.globalAlpha = 1;
      this.ctx.globalCompositeOperation = 'source-over';

      this.rafId = requestAnimationFrame(tick);
    };

    tick();
  }
}
