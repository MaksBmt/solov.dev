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
 * Tilt Card — THE.LAB / Hover.
 *
 * Три карточки с разными пресетами: резкий perspective-tilt,
 * вязкий lerp и акцент на hover lift.
 */
const MAX_TILT = 10;
const PERSPECTIVE = 900;
const TILT_LERP = 0.14;
const HOVER_LIFT = 6;

const DEBUG_STROKE = 'rgba(245, 158, 11, 0.55)';
const DEBUG_SOFT = 'rgba(245, 158, 11, 0.22)';

type TiltPresetKey = 'perspective' | 'lerp' | 'lift';

interface TiltPreset {
  maxTilt: number;
  lerp: number;
  perspective: number;
  lift: number;
  scale: number;
}

const PRESETS: Record<TiltPresetKey, TiltPreset> = {
  perspective: { maxTilt: 18, lerp: 0.34, perspective: 520, lift: 2, scale: 1.04 },
  lerp: { maxTilt: 14, lerp: 0.07, perspective: 900, lift: 2, scale: 1.01 },
  lift: { maxTilt: 2, lerp: 0.2, perspective: 1100, lift: 18, scale: 1.07 },
};

interface TiltItem {
  element: HTMLElement;
  presetKey: TiltPresetKey;
  currentX: number;
  currentY: number;
  targetX: number;
  targetY: number;
  hovered: boolean;
}

@Component({
  selector: 'app-tilt-card',
  standalone: true,
  imports: [CommonModule, LabDemoLayoutComponent],
  styleUrls: ['./tilt-card.component.scss'],
  templateUrl: './tilt-card.component.html',
})
export class TiltCardComponent implements AfterViewInit, OnDestroy {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly ngZone = inject(NgZone);

  @ViewChild('sceneHost') sceneHostRef!: ElementRef<HTMLElement>;

  maxTilt = MAX_TILT;
  perspective = PERSPECTIVE;
  lerp = TILT_LERP;
  lift = HOVER_LIFT;

  readonly cards = [
    {
      label: '01',
      title: 'Sharp tilt',
      subtitle: 'Сильная перспектива · наклон почти без задержки',
      hint: 'Проведите курсором по углам — карточка резко «смотрит» за указателем.',
      tone: 'amber',
      preset: 'perspective' as TiltPresetKey,
      badge: '18° · lerp 0.34',
    },
    {
      label: '02',
      title: 'Smooth lerp',
      subtitle: 'Тот же наклон, но углы догоняют медленно',
      hint: 'Быстро чертите диагональ между углами — заметное отставание и плавный догон.',
      tone: 'violet',
      preset: 'lerp' as TiltPresetKey,
      badge: '14° · lerp 0.07',
    },
    {
      label: '03',
      title: 'Hover lift',
      subtitle: 'Минимальный tilt · сильный подъём и масштаб',
      hint: 'Наведите и слегка двигайте курсор — карточка «всплывает», почти не наклоняясь.',
      tone: 'emerald',
      preset: 'lift' as TiltPresetKey,
      badge: 'lift 18px · scale 1.07',
    },
  ];

  private sceneEl: HTMLElement | null = null;
  private items: TiltItem[] = [];
  private pointer: { x: number; y: number } | null = null;
  private rafId: number | null = null;
  private reducedMotion = false;

  private readonly boundTick = () => this.tick();
  private readonly boundOnPointerMove = (e: PointerEvent) => this.onPointerMove(e);
  private readonly boundOnPointerLeave = () => this.onPointerLeave();

  ngAfterViewInit() {
    if (!isPlatformBrowser(this.platformId)) return;

    this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.sceneEl = this.sceneHostRef?.nativeElement ?? null;
    if (!this.sceneEl) return;

    this.collectItems();

    this.sceneEl.addEventListener('pointermove', this.boundOnPointerMove);
    this.sceneEl.addEventListener('pointerleave', this.boundOnPointerLeave);

    this.items.forEach((item) => {
      item.element.addEventListener('pointerenter', () => {
        item.hovered = true;
      });
      item.element.addEventListener('pointerleave', () => {
        item.hovered = false;
        item.targetX = 0;
        item.targetY = 0;
      });
    });

    this.ngZone.runOutsideAngular(() => {
      this.rafId = requestAnimationFrame(this.boundTick);
    });
  }

  ngOnDestroy() {
    if (!isPlatformBrowser(this.platformId)) return;

    if (this.rafId !== null) cancelAnimationFrame(this.rafId);
    this.sceneEl?.removeEventListener('pointermove', this.boundOnPointerMove);
    this.sceneEl?.removeEventListener('pointerleave', this.boundOnPointerLeave);
  }

  reset() {
    this.maxTilt = MAX_TILT;
    this.perspective = PERSPECTIVE;
    this.lerp = TILT_LERP;
    this.lift = HOVER_LIFT;
    this.pointer = null;

    this.items.forEach((item) => {
      item.currentX = 0;
      item.currentY = 0;
      item.targetX = 0;
      item.targetY = 0;
      item.hovered = false;
      this.applyTilt(item);
    });
  }

  onParamChange(detail: { id: string; value: number }) {
    if (detail.id === 'maxTilt') this.maxTilt = detail.value;
    else if (detail.id === 'perspective') this.perspective = detail.value;
    else if (detail.id === 'lerp') this.lerp = detail.value;
    else if (detail.id === 'lift') this.lift = detail.value;

    this.items.forEach((item) => this.updateTarget(item));
  }

  private collectItems() {
    if (!this.sceneEl) {
      this.items = [];
      return;
    }

    this.items = Array.from(this.sceneEl.querySelectorAll<HTMLElement>('.js-tilt-card')).map((element) => {
      const presetKey = (element.dataset['preset'] ?? 'perspective') as TiltPresetKey;
      return {
        element,
        presetKey: PRESETS[presetKey] ? presetKey : 'perspective',
        currentX: 0,
        currentY: 0,
        targetX: 0,
        targetY: 0,
        hovered: false,
      };
    });
  }

  private getEffectivePreset(item: TiltItem): TiltPreset {
    const base = PRESETS[item.presetKey];
    const maxTiltScale = this.maxTilt / MAX_TILT;
    const perspectiveScale = this.perspective / PERSPECTIVE;
    const lerpScale = this.lerp / TILT_LERP;
    const liftScale = this.lift / HOVER_LIFT;

    return {
      maxTilt: base.maxTilt * maxTiltScale,
      lerp: Math.max(0.04, Math.min(0.45, base.lerp * lerpScale)),
      perspective: Math.max(420, base.perspective * perspectiveScale),
      lift: base.lift * liftScale,
      scale: base.scale,
    };
  }

  onPointerMove(event: PointerEvent) {
    this.pointer = { x: event.clientX, y: event.clientY };
    this.items.forEach((item) => this.updateTarget(item));
  }

  onPointerLeave() {
    this.pointer = null;
    this.items.forEach((item) => {
      item.targetX = 0;
      item.targetY = 0;
    });
  }

  private updateTarget(item: TiltItem) {
    if (!this.pointer || !item.hovered || this.reducedMotion) {
      item.targetX = 0;
      item.targetY = 0;
      return;
    }

    const preset = this.getEffectivePreset(item);
    const rect = item.element.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const ratioX = (this.pointer.x - centerX) / (rect.width / 2);
    const ratioY = (this.pointer.y - centerY) / (rect.height / 2);

    item.targetY = Math.max(-preset.maxTilt, Math.min(preset.maxTilt, ratioX * preset.maxTilt));
    item.targetX = Math.max(-preset.maxTilt, Math.min(preset.maxTilt, -ratioY * preset.maxTilt));
  }

  private tick() {
    this.items.forEach((item) => {
      const preset = this.getEffectivePreset(item);
      item.currentX += (item.targetX - item.currentX) * preset.lerp;
      item.currentY += (item.targetY - item.currentY) * preset.lerp;

      if (Math.abs(item.currentX) < 0.02 && Math.abs(item.targetX) < 0.02) item.currentX = 0;
      if (Math.abs(item.currentY) < 0.02 && Math.abs(item.targetY) < 0.02) item.currentY = 0;

      this.applyTilt(item);
    });

    this.rafId = requestAnimationFrame(this.boundTick);
  }

  private applyTilt(item: TiltItem) {
    const preset = this.getEffectivePreset(item);
    const lift = item.hovered && !this.reducedMotion ? preset.lift : 0;
    const scale = item.hovered && !this.reducedMotion ? preset.scale : 1;

    item.element.style.setProperty('--rx', `${item.currentX.toFixed(2)}deg`);
    item.element.style.setProperty('--ry', `${item.currentY.toFixed(2)}deg`);
    item.element.style.setProperty('--lift', `${lift.toFixed(1)}px`);
    item.element.style.setProperty('--card-scale', scale.toFixed(3));
    item.element.style.setProperty('--card-perspective', `${preset.perspective}px`);
    item.element.style.transform =
      `perspective(var(--card-perspective, ${preset.perspective}px)) `
      + `rotateX(var(--rx, 0deg)) rotateY(var(--ry, 0deg)) `
      + `translateY(calc(-1 * var(--lift, 0px))) `
      + `scale(var(--card-scale, 1))`;
  }

  drawDebug({
    ctx,
    width,
    height,
    pointer,
  }: {
    ctx: CanvasRenderingContext2D;
    width: number;
    height: number;
    pointer: { x: number; y: number } | null;
  }) {
    ctx.clearRect(0, 0, width, height);
    if (!this.sceneEl) return;

    const sceneRect = this.sceneEl.getBoundingClientRect();

    this.items.forEach((item) => {
      const preset = this.getEffectivePreset(item);
      const rect = item.element.getBoundingClientRect();
      const x = rect.left - sceneRect.left;
      const y = rect.top - sceneRect.top;
      const cx = x + rect.width / 2;
      const cy = y + rect.height / 2;

      ctx.strokeStyle = item.hovered ? DEBUG_STROKE : DEBUG_SOFT;
      ctx.lineWidth = item.hovered ? 2 : 1;
      ctx.strokeRect(x, y, rect.width, rect.height);

      ctx.fillStyle = item.hovered ? 'rgba(253, 186, 116, 0.9)' : 'rgba(244, 244, 245, 0.55)';
      ctx.font = '10px monospace';
      ctx.fillText(`${item.presetKey} · lerp ${preset.lerp.toFixed(2)}`, x + 8, y + 16);

      if (item.hovered) {
        ctx.beginPath();
        ctx.strokeStyle = DEBUG_STROKE;
        ctx.lineWidth = 1.5;
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + item.currentY * 4, cy - item.currentX * 4);
        ctx.stroke();
      }
    });

    if (pointer) {
      const px = pointer.x - sceneRect.left;
      const py = pointer.y - sceneRect.top;
      ctx.strokeStyle = 'rgba(244, 244, 245, 0.5)';
      ctx.beginPath();
      ctx.moveTo(px - 8, py);
      ctx.lineTo(px + 8, py);
      ctx.moveTo(px, py - 8);
      ctx.lineTo(px, py + 8);
      ctx.stroke();
    }
  }
}
