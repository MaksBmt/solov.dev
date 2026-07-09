import { Component, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LabDemoLayoutComponent } from '../../../shell/lab-demo-layout/lab-demo-layout.component';

/**
 * Dropdown — THE.LAB / Components.
 *
 * Каскадный dropdown с elastic bounce и stagger.
 */
const STAGGER_MS = 55;
const DURATION = 520;
const BOUNCE = 0.65;

const DEBUG_STROKE = 'rgba(245, 158, 11, 0.55)';
const DEBUG_SOFT = 'rgba(245, 158, 11, 0.22)';

interface DropdownItem {
  label: string;
  icon: string;
}

@Component({
  selector: 'app-dropdown',
  standalone: true,
  imports: [CommonModule, LabDemoLayoutComponent],
  styleUrls: ['./dropdown.component.scss'],
  templateUrl: './dropdown.component.html',
})
export class DropdownComponent implements AfterViewInit {
  @ViewChild('sceneHost') sceneHostRef!: ElementRef<HTMLElement>;

  items: DropdownItem[] = [
    { label: 'New project', icon: '＋' },
    { label: 'Duplicate', icon: '⧉' },
    { label: 'Export', icon: '↗' },
    { label: 'Archive', icon: '▣' },
    { label: 'Delete', icon: '✕' },
  ];

  isOpen = false;
  staggerMs = STAGGER_MS;
  duration = DURATION;
  bounce = BOUNCE;

  ngAfterViewInit() {
    this.applyVars();
  }

  toggle() {
    this.isOpen = !this.isOpen;
  }

  reset() {
    this.isOpen = false;
    this.staggerMs = STAGGER_MS;
    this.duration = DURATION;
    this.bounce = BOUNCE;
    this.applyVars();
  }

  onParamChange(detail: { id: string; value: number }) {
    if (detail.id === 'staggerMs') this.staggerMs = detail.value;
    else if (detail.id === 'duration') this.duration = detail.value;
    else if (detail.id === 'bounce') this.bounce = detail.value;
    this.applyVars();
  }

  getItemDelay(index: number): string {
    return `${index * this.staggerMs}ms`;
  }

  private applyVars() {
    const el = this.sceneHostRef?.nativeElement;
    if (!el) return;
    el.style.setProperty('--stagger-ms', `${this.staggerMs}ms`);
    el.style.setProperty('--dropdown-duration', `${this.duration}ms`);
    el.style.setProperty('--bounce', String(this.bounce));
  }

  drawDebug({ ctx, width, height }: { ctx: CanvasRenderingContext2D; width: number; height: number }) {
    ctx.clearRect(0, 0, width, height);
    const scene = this.sceneHostRef?.nativeElement;
    if (!scene) return;

    const sceneRect = scene.getBoundingClientRect();
    scene.querySelectorAll<HTMLElement>('.js-dropdown-item').forEach((item) => {
      const rect = item.getBoundingClientRect();
      ctx.strokeStyle = this.isOpen ? DEBUG_STROKE : DEBUG_SOFT;
      ctx.strokeRect(rect.left - sceneRect.left, rect.top - sceneRect.top, rect.width, rect.height);
    });
  }
}
