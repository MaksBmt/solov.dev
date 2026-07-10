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
 * Gradient Mesh — THE.LAB / Backgrounds.
 *
 * Четыре «blob»-якоря с radial-gradient и blur создают
 * живой mesh-фон; позиции догоняют курсор через lerp.
 */
const BLOB_LERP = 0.08;
const BLOB_SIZE = 52;
const BLUR_AMOUNT = 72;
const SATURATION = 1.15;

interface Blob {
  id: number;
  hue: number;
  targetX: number;
  targetY: number;
  x: number;
  y: number;
  offsetAngle: number;
}

@Component({
  selector: 'app-gradient-mesh',
  standalone: true,
  imports: [CommonModule, LabDemoLayoutComponent],
  styleUrls: ['./gradient-mesh.component.scss'],
  templateUrl: './gradient-mesh.component.html',
})
export class GradientMeshComponent implements AfterViewInit, OnDestroy {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly ngZone = inject(NgZone);

  @ViewChild('sceneHost') sceneHostRef!: ElementRef<HTMLElement>;

  blobLerp = BLOB_LERP;
  blobSize = BLOB_SIZE;
  blurAmount = BLUR_AMOUNT;
  saturation = SATURATION;

  readonly blobs: Blob[] = [
    { id: 0, hue: 32, targetX: 0.25, targetY: 0.3, x: 0.25, y: 0.3, offsetAngle: 0 },
    { id: 1, hue: 280, targetX: 0.75, targetY: 0.25, x: 0.75, y: 0.25, offsetAngle: Math.PI * 0.5 },
    { id: 2, hue: 165, targetX: 0.3, targetY: 0.75, x: 0.3, y: 0.75, offsetAngle: Math.PI },
    { id: 3, hue: 340, targetX: 0.8, targetY: 0.7, x: 0.8, y: 0.7, offsetAngle: Math.PI * 1.5 },
  ];

  private sceneEl: HTMLElement | null = null;
  private blobEls: HTMLElement[] = [];
  private pointer = { x: 0.5, y: 0.5, active: false };
  private rafId: number | null = null;
  private time = 0;
  private pointerBinding: ScenePointerBinding | null = null;

  ngAfterViewInit() {
    if (!isPlatformBrowser(this.platformId)) return;
    this.sceneEl = this.sceneHostRef?.nativeElement ?? null;
    if (!this.sceneEl) return;

    this.blobEls = Array.from(this.sceneEl.querySelectorAll<HTMLElement>('.js-mesh-blob'));
    this.pointerBinding = bindScenePointer(this.sceneEl, {
      onMove: (e) => this.onPointerMove(e),
      onLeave: () => this.onPointerLeave(),
    });
    this.applyVars();

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
    this.pointerBinding?.unbind();
  }

  reset() {
    this.blobLerp = BLOB_LERP;
    this.blobSize = BLOB_SIZE;
    this.blurAmount = BLUR_AMOUNT;
    this.saturation = SATURATION;
    this.pointer.active = false;
    this.blobs.forEach((b, i) => {
      const positions = [[0.25, 0.3], [0.75, 0.25], [0.3, 0.75], [0.8, 0.7]];
      b.targetX = positions[i][0];
      b.targetY = positions[i][1];
      b.x = positions[i][0];
      b.y = positions[i][1];
    });
    this.applyVars();
  }

  onParamChange(detail: { id: string; value: number }) {
    if (detail.id === 'blobLerp') this.blobLerp = detail.value;
    if (detail.id === 'blobSize') this.blobSize = detail.value;
    if (detail.id === 'blurAmount') this.blurAmount = detail.value;
    if (detail.id === 'saturation') this.saturation = detail.value;
    this.applyVars();
  }

  private onPointerMove(event: PointerEvent) {
    if (!this.sceneEl) return;
    const rect = this.sceneEl.getBoundingClientRect();
    this.pointer.x = (event.clientX - rect.left) / rect.width;
    this.pointer.y = (event.clientY - rect.top) / rect.height;
    this.pointer.active = true;

    this.blobs.forEach((blob) => {
      const orbit = 0.22;
      blob.targetX = 0.5 + Math.cos(blob.offsetAngle + this.time * 0.4) * orbit
        + (this.pointer.x - 0.5) * 0.35;
      blob.targetY = 0.5 + Math.sin(blob.offsetAngle + this.time * 0.35) * orbit
        + (this.pointer.y - 0.5) * 0.35;
    });
  }

  private onPointerLeave() {
    this.pointer.active = false;
    const defaults = [[0.25, 0.3], [0.75, 0.25], [0.3, 0.75], [0.8, 0.7]];
    this.blobs.forEach((blob, i) => {
      blob.targetX = defaults[i][0];
      blob.targetY = defaults[i][1];
    });
  }

  private tick() {
    this.time += 0.016;

    if (!this.pointer.active) {
      this.blobs.forEach((blob) => {
        blob.targetX = 0.5 + Math.cos(blob.offsetAngle + this.time * 0.5) * 0.28;
        blob.targetY = 0.5 + Math.sin(blob.offsetAngle + this.time * 0.45) * 0.28;
      });
    }

    this.blobs.forEach((blob, index) => {
      blob.x += (blob.targetX - blob.x) * this.blobLerp;
      blob.y += (blob.targetY - blob.y) * this.blobLerp;

      const el = this.blobEls[index];
      if (el) {
        el.style.left = `${blob.x * 100}%`;
        el.style.top = `${blob.y * 100}%`;
      }
    });

    this.applyVars();
  }

  private applyVars() {
    const el = this.sceneHostRef?.nativeElement;
    if (!el) return;

    el.style.setProperty('--blob-size', `${this.blobSize}%`);
    el.style.setProperty('--blur-amount', `${this.blurAmount}px`);
    el.style.setProperty('--saturation', String(this.saturation.toFixed(2)));
    el.style.setProperty('--pointer-x', String((this.pointer.x * 100).toFixed(1)));
    el.style.setProperty('--pointer-y', String((this.pointer.y * 100).toFixed(1)));
  }
}
