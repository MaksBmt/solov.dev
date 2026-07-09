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

/**
 * Living Background — THE.LAB / Backgrounds.
 *
 * Органические «амёбы» через SVG gooey-фильтр: blob-ы дышат,
 * пульсируют и притягиваются к курсору с инерцией.
 */
const BREATH_SPEED = 0.55;
const BREATH_AMOUNT = 0.18;
const ATTRACT_FORCE = 0.52;
const POSITION_LERP = 0.13;
const GOO_BLUR = 18;

interface LivingBlob {
  id: number;
  hue: number;
  baseX: number;
  baseY: number;
  x: number;
  y: number;
  scale: number;
  phase: number;
  radius: number;
}

@Component({
  selector: 'app-living-background',
  standalone: true,
  imports: [CommonModule, LabDemoLayoutComponent],
  styleUrls: ['./living-background.component.scss'],
  templateUrl: './living-background.component.html',
})
export class LivingBackgroundComponent implements AfterViewInit, OnDestroy {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly ngZone = inject(NgZone);

  @ViewChild('sceneHost') sceneHostRef!: ElementRef<HTMLElement>;

  breathSpeed = BREATH_SPEED;
  breathAmount = BREATH_AMOUNT;
  attractForce = ATTRACT_FORCE;
  positionLerp = POSITION_LERP;
  gooBlur = GOO_BLUR;

  readonly blobs: LivingBlob[] = [
    { id: 0, hue: 32, baseX: 0.35, baseY: 0.4, x: 0.35, y: 0.4, scale: 1, phase: 0, radius: 140 },
    { id: 1, hue: 270, baseX: 0.65, baseY: 0.35, x: 0.65, y: 0.35, scale: 1, phase: 1.2, radius: 120 },
    { id: 2, hue: 160, baseX: 0.5, baseY: 0.65, x: 0.5, y: 0.65, scale: 1, phase: 2.4, radius: 130 },
    { id: 3, hue: 340, baseX: 0.25, baseY: 0.7, x: 0.25, y: 0.7, scale: 1, phase: 3.6, radius: 100 },
    { id: 4, hue: 200, baseX: 0.78, baseY: 0.68, x: 0.78, y: 0.68, scale: 1, phase: 4.8, radius: 90 },
  ];

  private sceneEl: HTMLElement | null = null;
  private blobEls: HTMLElement[] = [];
  private pointer = { x: 0.5, y: 0.5, active: false };
  private time = 0;
  private rafId: number | null = null;
  private readonly boundOnPointerMove = (e: PointerEvent) => this.onPointerMove(e);
  private readonly boundOnPointerLeave = () => this.onPointerLeave();

  ngAfterViewInit() {
    if (!isPlatformBrowser(this.platformId)) return;
    this.sceneEl = this.sceneHostRef?.nativeElement ?? null;
    if (!this.sceneEl) return;

    this.blobEls = Array.from(this.sceneEl.querySelectorAll<HTMLElement>('.js-living-blob'));
    this.sceneEl.addEventListener('pointermove', this.boundOnPointerMove, { passive: true });
    this.sceneEl.addEventListener('pointerleave', this.boundOnPointerLeave);
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
    this.sceneEl?.removeEventListener('pointermove', this.boundOnPointerMove);
    this.sceneEl?.removeEventListener('pointerleave', this.boundOnPointerLeave);
  }

  reset() {
    this.breathSpeed = BREATH_SPEED;
    this.breathAmount = BREATH_AMOUNT;
    this.attractForce = ATTRACT_FORCE;
    this.positionLerp = POSITION_LERP;
    this.gooBlur = GOO_BLUR;
    this.blobs.forEach((b) => {
      b.x = b.baseX;
      b.y = b.baseY;
      b.scale = 1;
    });
    this.applyVars();
  }

  onParamChange(detail: { id: string; value: number }) {
    if (detail.id === 'breathSpeed') this.breathSpeed = detail.value;
    if (detail.id === 'breathAmount') this.breathAmount = detail.value;
    if (detail.id === 'attractForce') this.attractForce = detail.value;
    if (detail.id === 'positionLerp') this.positionLerp = detail.value;
    if (detail.id === 'gooBlur') this.gooBlur = detail.value;
    this.applyVars();
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
  }

  private tick() {
    this.time += 0.016;

    const w = this.sceneEl?.clientWidth ?? 800;
    const h = this.sceneEl?.clientHeight ?? 600;

    this.blobs.forEach((blob, index) => {
      const breath = 1 + Math.sin(this.time * this.breathSpeed + blob.phase) * this.breathAmount;
      blob.scale = breath;

      const idleX = blob.baseX + Math.sin(this.time * 0.3 + blob.phase) * 0.06;
      const idleY = blob.baseY + Math.cos(this.time * 0.25 + blob.phase) * 0.06;

      let targetX = idleX;
      let targetY = idleY;

      if (this.pointer.active) {
        targetX = idleX + (this.pointer.x - idleX) * this.attractForce;
        targetY = idleY + (this.pointer.y - idleY) * this.attractForce;
      }

      blob.x += (targetX - blob.x) * this.positionLerp;
      blob.y += (targetY - blob.y) * this.positionLerp;

      const el = this.blobEls[index];
      if (!el) return;

      const size = blob.radius * 2 * blob.scale;
      el.style.width = `${size}px`;
      el.style.height = `${size}px`;
      el.style.left = `${blob.x * w}px`;
      el.style.top = `${blob.y * h}px`;
      el.style.borderRadius = `${40 + Math.sin(this.time * this.breathSpeed + blob.phase) * 18}% ${60 - Math.cos(this.time * this.breathSpeed * 0.8 + blob.phase) * 15}% ${55 + Math.sin(this.time * this.breathSpeed * 1.1 + blob.phase * 1.3) * 20}% ${45 - Math.cos(this.time * this.breathSpeed * 0.9 + blob.phase * 0.7) * 16}% / ${50 + Math.cos(this.time * this.breathSpeed + blob.phase) * 22}% ${48 - Math.sin(this.time * this.breathSpeed * 1.2 + blob.phase) * 18}%`;
    });

    this.applyVars();
  }

  private applyVars() {
    const el = this.sceneHostRef?.nativeElement;
    if (!el) return;
    el.style.setProperty('--goo-blur', String(this.gooBlur));
    el.style.setProperty('--pointer-x', String((this.pointer.x * 100).toFixed(1)));
    el.style.setProperty('--pointer-y', String((this.pointer.y * 100).toFixed(1)));
  }
}
