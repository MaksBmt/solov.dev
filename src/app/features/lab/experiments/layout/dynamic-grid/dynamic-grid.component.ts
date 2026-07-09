import { Component, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LabDemoLayoutComponent } from '../../../shell/lab-demo-layout/lab-demo-layout.component';

/**
 * Dynamic Grid — THE.LAB / Layout.
 *
 * Сетка 3×3: клик разворачивает ячейку в 2×2, перекрытые слоты исчезают,
 * активная карточка плавно занимает четверть сетки.
 */
const MORPH_DURATION = 520;
const GLOW_INTENSITY = 0.65;
const GRID_GAP = 10;

const DEBUG_STROKE = 'rgba(245, 158, 11, 0.55)';
const DEBUG_SOFT = 'rgba(245, 158, 11, 0.22)';

interface ExpandLayout {
  colStart: number;
  rowStart: number;
  covered: Set<number>;
}

@Component({
  selector: 'app-dynamic-grid',
  standalone: true,
  imports: [CommonModule, LabDemoLayoutComponent],
  styleUrls: ['./dynamic-grid.component.scss'],
  templateUrl: './dynamic-grid.component.html',
})
export class DynamicGridComponent implements AfterViewInit {
  @ViewChild('sceneHost') sceneHostRef!: ElementRef<HTMLElement>;

  cells = Array.from({ length: 9 }, (_, i) => ({
    id: i,
    label: String(i + 1).padStart(2, '0'),
    tone: ['amber', 'violet', 'emerald', 'cyan', 'rose', 'zinc', 'amber', 'violet', 'emerald'][i],
  }));

  /** -1 = равномерная сетка 3×3 */
  activeIndex = -1;
  morphDuration = MORPH_DURATION;
  glowIntensity = GLOW_INTENSITY;
  gridGap = GRID_GAP;

  ngAfterViewInit() {
    this.applyVars();
  }

  selectCell(index: number) {
    this.activeIndex = this.activeIndex === index ? -1 : index;
    this.applyVars();
  }

  reset() {
    this.activeIndex = -1;
    this.morphDuration = MORPH_DURATION;
    this.glowIntensity = GLOW_INTENSITY;
    this.gridGap = GRID_GAP;
    this.applyVars();
  }

  onParamChange(detail: { id: string; value: number }) {
    if (detail.id === 'cellLerp') this.morphDuration = Math.round(400 + (0.35 - detail.value) * 1200);
    else if (detail.id === 'expandScale') this.glowIntensity = Math.min(1, detail.value / 2.5);
    else if (detail.id === 'gridGap') this.gridGap = detail.value;
    this.applyVars();
  }

  isExpanded(): boolean {
    return this.activeIndex >= 0;
  }

  isActive(index: number): boolean {
    return this.activeIndex === index;
  }

  isCovered(index: number): boolean {
    if (!this.isExpanded()) return false;
    return this.getExpandLayout().covered.has(index);
  }

  getGridColumn(index: number): string {
    if (!this.isActive(index)) return String((index % 3) + 1);
    const { colStart } = this.getExpandLayout();
    return `${colStart} / span 2`;
  }

  getGridRow(index: number): string {
    if (!this.isActive(index)) return String(Math.floor(index / 3) + 1);
    const { rowStart } = this.getExpandLayout();
    return `${rowStart} / span 2`;
  }

  private getExpandLayout(): ExpandLayout {
    const ar = Math.floor(this.activeIndex / 3);
    const ac = this.activeIndex % 3;
    const colStart = ac === 2 ? 2 : ac + 1;
    const rowStart = ar === 2 ? 2 : ar + 1;
    const covered = new Set<number>();

    for (let r = rowStart - 1; r <= rowStart; r++) {
      for (let c = colStart - 1; c <= colStart; c++) {
        const i = r * 3 + c;
        if (i !== this.activeIndex) covered.add(i);
      }
    }

    return { colStart, rowStart, covered };
  }

  private applyVars() {
    const el = this.sceneHostRef?.nativeElement;
    if (!el) return;
    el.style.setProperty('--grid-gap', `${this.gridGap}px`);
    el.style.setProperty('--morph-duration', `${this.morphDuration}ms`);
    el.style.setProperty('--glow-intensity', String(this.glowIntensity));
    el.style.setProperty('--active-cell', String(this.activeIndex));
  }

  drawDebug({ ctx, width, height }: { ctx: CanvasRenderingContext2D; width: number; height: number }) {
    ctx.clearRect(0, 0, width, height);
    const scene = this.sceneHostRef?.nativeElement;
    if (!scene) return;

    const sceneRect = scene.getBoundingClientRect();
    scene.querySelectorAll<HTMLElement>('.js-grid-cell').forEach((cell, i) => {
      const rect = cell.getBoundingClientRect();
      if (rect.width < 2 || rect.height < 2) return;
      ctx.strokeStyle = i === this.activeIndex ? DEBUG_STROKE : DEBUG_SOFT;
      ctx.lineWidth = i === this.activeIndex ? 2 : 1;
      ctx.strokeRect(rect.left - sceneRect.left, rect.top - sceneRect.top, rect.width, rect.height);
    });
  }
}
