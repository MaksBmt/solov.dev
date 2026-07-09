import { Component, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LabDemoLayoutComponent } from '../../../shell/lab-demo-layout/lab-demo-layout.component';

/**
 * Context Menu — THE.LAB / Components.
 *
 * Frosted glass контекстное меню по правому клику с каскадным появлением.
 */
const STAGGER_MS = 40;
const DURATION = 380;
const GLASS_BLUR = 18;

const DEBUG_STROKE = 'rgba(245, 158, 11, 0.55)';
const DEBUG_SOFT = 'rgba(245, 158, 11, 0.22)';

interface ContextMenuItem {
  label: string;
  icon: string;
  danger?: boolean;
}

@Component({
  selector: 'app-context-menu',
  standalone: true,
  imports: [CommonModule, LabDemoLayoutComponent],
  styleUrls: ['./context-menu.component.scss'],
  templateUrl: './context-menu.component.html',
})
export class ContextMenuComponent implements AfterViewInit {
  @ViewChild('sceneHost') sceneHostRef!: ElementRef<HTMLElement>;

  items: ContextMenuItem[] = [
    { label: 'Copy', icon: '⧉' },
    { label: 'Paste', icon: '▤' },
    { label: 'Duplicate', icon: '⧈' },
    { label: 'Rename', icon: '✎' },
    { label: 'Share', icon: '↗' },
    { label: 'Delete', icon: '✕', danger: true },
  ];

  isOpen = false;
  menuX = 0;
  menuY = 0;
  clickX = 0;
  clickY = 0;
  staggerMs = STAGGER_MS;
  duration = DURATION;
  glassBlur = GLASS_BLUR;

  ngAfterViewInit() {
    this.applyVars();
  }

  onContextMenu(event: MouseEvent) {
    event.preventDefault();
    const scene = this.sceneHostRef?.nativeElement;
    if (!scene) return;

    const rect = scene.getBoundingClientRect();
    this.clickX = event.clientX - rect.left;
    this.clickY = event.clientY - rect.top;

    const menuW = 200;
    const menuH = 260;
    this.menuX = Math.min(this.clickX, rect.width - menuW - 12);
    this.menuY = Math.min(this.clickY, rect.height - menuH - 12);

    this.isOpen = true;
    this.applyVars();
  }

  closeMenu() {
    this.isOpen = false;
  }

  reset() {
    this.isOpen = false;
    this.staggerMs = STAGGER_MS;
    this.duration = DURATION;
    this.glassBlur = GLASS_BLUR;
    this.applyVars();
  }

  onParamChange(detail: { id: string; value: number }) {
    if (detail.id === 'staggerMs') this.staggerMs = detail.value;
    else if (detail.id === 'duration') this.duration = detail.value;
    else if (detail.id === 'glassBlur') this.glassBlur = detail.value;
    this.applyVars();
  }

  getItemDelay(index: number): string {
    return `${index * this.staggerMs}ms`;
  }

  private applyVars() {
    const el = this.sceneHostRef?.nativeElement;
    if (!el) return;
    el.style.setProperty('--menu-x', `${this.menuX}px`);
    el.style.setProperty('--menu-y', `${this.menuY}px`);
    el.style.setProperty('--click-x', `${this.clickX}px`);
    el.style.setProperty('--click-y', `${this.clickY}px`);
    el.style.setProperty('--glass-blur', `${this.glassBlur}px`);
    el.style.setProperty('--ctx-duration', `${this.duration}ms`);
  }

  drawDebug({ ctx, width, height }: { ctx: CanvasRenderingContext2D; width: number; height: number }) {
    ctx.clearRect(0, 0, width, height);
    if (!this.isOpen) return;

    ctx.fillStyle = DEBUG_STROKE;
    ctx.beginPath();
    ctx.arc(this.clickX, this.clickY, 4, 0, Math.PI * 2);
    ctx.fill();

    const scene = this.sceneHostRef?.nativeElement;
    const menu = scene?.querySelector<HTMLElement>('.js-context-menu');
    if (menu) {
      const sceneRect = scene!.getBoundingClientRect();
      const rect = menu.getBoundingClientRect();
      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = DEBUG_STROKE;
      ctx.strokeRect(rect.left - sceneRect.left, rect.top - sceneRect.top, rect.width, rect.height);
      ctx.setLineDash([]);
    }
  }
}
