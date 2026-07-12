import {
  Component,
  AfterViewInit,
  OnDestroy,
  PLATFORM_ID,
  NgZone,
  ViewChild,
  ElementRef,
  ViewEncapsulation,
  inject,
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { LabDemoLayoutComponent } from '../../../shell/lab-demo-layout/lab-demo-layout.component';
import { bindScenePointer, ScenePointerBinding } from '../../../utils/scene-pointer';

/**
 * Interactive Grid — THE.LAB / Cursor.
 *
 * CSS Grid из ячеек: расстояние до курсора задаёт целевой «подъём»
 * и свечение, текущие значения догоняют цель через lerp в rAF.
 * Результат — CSS-переменные --lift / --glow на каждой ячейке.
 */
const WAVE_RADIUS = 180;
const WAVE_STRENGTH = 0.65;
const CELL_LERP = 0.18;
const GRID_GAP = 8;
const MIN_CELL_SIZE = 44;
const SCENE_INIT_MAX_ATTEMPTS = 30;

interface GridCell {
  element: HTMLElement;
  x: number;
  y: number;
  current: number;
  target: number;
}

@Component({
  selector: 'app-interactive-grid',
  standalone: true,
  imports: [CommonModule, LabDemoLayoutComponent],
  styleUrls: ['./interactive-grid.component.scss'],
  templateUrl: './interactive-grid.component.html',
  encapsulation: ViewEncapsulation.None,
})
export class InteractiveGridComponent implements AfterViewInit, OnDestroy {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly ngZone = inject(NgZone);

  @ViewChild('sceneHost') sceneHostRef!: ElementRef<HTMLElement>;

  waveRadius = WAVE_RADIUS;
  waveStrength = WAVE_STRENGTH;
  cellLerp = CELL_LERP;
  gridGap = GRID_GAP;

  private sceneEl: HTMLElement | null = null;
  private gridEl: HTMLElement | null = null;
  private fieldEl: HTMLElement | null = null;
  private cells: GridCell[] = [];
  private pointer: { x: number; y: number } | null = null;
  private gridCols = 0;
  private gridRows = 0;
  private rafId: number | null = null;
  private resizeObserver: ResizeObserver | null = null;
  private resizeRafId: number | null = null;
  private reducedMotion = false;
  private initialized = false;
  private lastActiveCount = -1;
  private readonly boundTick = () => this.tick();
  private pointerBinding: ScenePointerBinding | null = null;
  private initRafId: number | null = null;
  private destroyed = false;

  ngAfterViewInit() {
    if (!isPlatformBrowser(this.platformId)) return;
    this.scheduleSceneInit();
  }

  ngOnDestroy() {
    this.destroyed = true;
    if (!isPlatformBrowser(this.platformId)) return;

    if (this.initRafId !== null) cancelAnimationFrame(this.initRafId);
    if (this.rafId !== null) cancelAnimationFrame(this.rafId);
    if (this.resizeRafId !== null) cancelAnimationFrame(this.resizeRafId);
    this.resizeObserver?.disconnect();
    this.pointerBinding?.unbind();
    this.clearCells();
  }

  private scheduleSceneInit(attempt = 0) {
    if (!isPlatformBrowser(this.platformId) || this.destroyed) return;
    if (this.initScene() || attempt >= SCENE_INIT_MAX_ATTEMPTS) return;
    this.initRafId = requestAnimationFrame(() => this.scheduleSceneInit(attempt + 1));
  }

  private initScene(): boolean {
    if (this.initialized) return true;

    this.sceneEl = this.sceneHostRef?.nativeElement ?? null;
    this.gridEl = this.sceneEl?.querySelector<HTMLElement>('.js-grid') ?? null;
    this.fieldEl = this.sceneEl?.querySelector<HTMLElement>('.js-grid-field') ?? null;

    if (!this.sceneEl || !this.gridEl || !this.fieldEl) return false;
    if (this.sceneEl.clientWidth === 0 || this.sceneEl.clientHeight === 0) return false;

    this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.buildGrid();

    this.resizeObserver = new ResizeObserver(() => {
      if (this.resizeRafId !== null) return;
      this.resizeRafId = requestAnimationFrame(() => {
        this.resizeRafId = null;
        this.buildGrid();
      });
    });
    this.resizeObserver.observe(this.sceneEl);

    this.pointerBinding = bindScenePointer(
      this.sceneEl,
      {
        onMove: (e) => this.onPointerMove(e),
        onLeave: () => this.onPointerLeave(),
      },
      { passive: true },
    );

    this.ngZone.runOutsideAngular(() => {
      this.rafId = requestAnimationFrame(this.boundTick);
    });

    this.initialized = true;
    return true;
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
  }

  reset() {
    this.pointer = null;
    this.waveRadius = WAVE_RADIUS;
    this.waveStrength = WAVE_STRENGTH;
    this.cellLerp = CELL_LERP;
    this.gridGap = GRID_GAP;
    this.applyGridGap();

    this.cells.forEach((cell) => {
      cell.current = 0;
      cell.target = 0;
      this.applyCellVars(cell);
    });

    this.applyGridVars(0);
  }

  onParamChange(detail: { id: string; value: number }) {
    if (detail.id === 'waveRadius') this.waveRadius = detail.value;
    if (detail.id === 'waveStrength') this.waveStrength = detail.value;
    if (detail.id === 'cellLerp') this.cellLerp = detail.value;
    if (detail.id === 'gridGap') {
      this.gridGap = detail.value;
      this.applyGridGap();
      this.buildGrid();
    }
  }

  tick() {
    const lerp = this.reducedMotion ? 1 : this.cellLerp;
    let activeCount = 0;

    this.cells.forEach((cell) => {
      cell.target = this.computeTarget(cell);
      cell.current += (cell.target - cell.current) * lerp;

      if (cell.current < 0.005 && cell.target === 0) {
        cell.current = 0;
      }

      if (cell.current > 0.05) activeCount += 1;
      this.applyCellVars(cell);
    });

    this.applyGridVars(activeCount);
    this.rafId = requestAnimationFrame(this.boundTick);
  }

  private computeTarget(cell: GridCell): number {
    if (!this.pointer || this.reducedMotion) return 0;

    const distance = Math.hypot(this.pointer.x - cell.x, this.pointer.y - cell.y);
    if (distance >= this.waveRadius) return 0;

    const falloff = 1 - distance / this.waveRadius;
    return falloff * falloff * this.waveStrength;
  }

  private buildGrid() {
    if (!this.sceneEl || !this.fieldEl) return;

    const width = this.fieldEl.clientWidth;
    const height = this.fieldEl.clientHeight;
    if (width === 0 || height === 0) return;

    const gap = this.gridGap;
    const cols = Math.max(4, Math.floor((width + gap) / (MIN_CELL_SIZE + gap)));
    const rows = Math.max(3, Math.floor((height + gap) / (MIN_CELL_SIZE + gap)));

    if (cols === this.gridCols && rows === this.gridRows && this.cells.length === cols * rows) {
      this.updateCellCenters();
      return;
    }

    this.gridCols = cols;
    this.gridRows = rows;
    this.clearCells();
    this.applyGridGap();

    this.fieldEl.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
    this.fieldEl.style.gridTemplateRows = `repeat(${rows}, 1fr)`;

    for (let i = 0; i < cols * rows; i += 1) {
      const element = document.createElement('span');
      element.className = 'grid__cell js-grid-cell';
      element.setAttribute('aria-hidden', 'true');
      this.fieldEl.appendChild(element);

      this.cells.push({
        element,
        x: 0,
        y: 0,
        current: 0,
        target: 0,
      });
    }

    this.updateCellCenters();
  }

  private updateCellCenters() {
    if (!this.sceneEl) return;

    const sceneRect = this.sceneEl.getBoundingClientRect();

    this.cells.forEach((cell) => {
      const rect = cell.element.getBoundingClientRect();
      cell.x = rect.left + rect.width / 2 - sceneRect.left;
      cell.y = rect.top + rect.height / 2 - sceneRect.top;
    });
  }

  private clearCells() {
    this.cells.forEach((cell) => cell.element.remove());
    this.cells = [];
    this.gridCols = 0;
    this.gridRows = 0;
  }

  private applyGridGap() {
    if (!this.fieldEl) return;
    this.fieldEl.style.gap = `${this.gridGap}px`;
  }

  private applyCellVars(cell: GridCell) {
    const lift = cell.current;
    cell.element.style.setProperty('--lift', lift.toFixed(3));
    cell.element.style.setProperty('--glow', lift.toFixed(3));
  }

  private applyGridVars(activeCount: number) {
    if (!this.gridEl) return;

    if (this.pointer) {
      this.gridEl.style.setProperty('--gx', `${this.pointer.x.toFixed(1)}px`);
      this.gridEl.style.setProperty('--gy', `${this.pointer.y.toFixed(1)}px`);
    }

    if (activeCount === this.lastActiveCount) return;

    this.lastActiveCount = activeCount;
    this.gridEl.style.setProperty('--active', String(activeCount));
  }

  drawDebug({ ctx, width, height }: { ctx: CanvasRenderingContext2D; width: number; height: number }) {
    ctx.clearRect(0, 0, width, height);

    if (this.pointer) {
      ctx.beginPath();
      ctx.setLineDash([4, 6]);
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.45)';
      ctx.lineWidth = 1;
      ctx.arc(this.pointer.x, this.pointer.y, this.waveRadius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.strokeStyle = 'rgba(244, 244, 245, 0.6)';
      ctx.beginPath();
      ctx.moveTo(this.pointer.x - 8, this.pointer.y);
      ctx.lineTo(this.pointer.x + 8, this.pointer.y);
      ctx.moveTo(this.pointer.x, this.pointer.y - 8);
      ctx.lineTo(this.pointer.x, this.pointer.y + 8);
      ctx.stroke();
    }

    this.cells.forEach((cell) => {
      if (cell.current < 0.08) return;

      ctx.beginPath();
      ctx.strokeStyle = `rgba(245, 158, 11, ${cell.current * 0.55})`;
      ctx.strokeRect(cell.x - 10, cell.y - 10, 20, 20);
    });

    ctx.fillStyle = 'rgba(253, 186, 116, 0.9)';
    ctx.font = '11px monospace';
    ctx.fillText(`active: ${this.lastActiveCount}`, 12, 18);
  }
}
