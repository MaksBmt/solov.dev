import { Component, AfterViewInit, OnDestroy, Inject, PLATFORM_ID, NgZone, ViewChild, ElementRef } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { LabDemoLayoutComponent } from '../lab-demo-layout/lab-demo-layout.component';

const BLOB_COUNT = 14;
const HEAD_SIZE = 46;
const TAIL_SIZE = 8;

@Component({
  selector: 'app-liquid-cursor',
  standalone: true,
  imports: [CommonModule, LabDemoLayoutComponent],
  styleUrls: ['./liquid-cursor.component.scss'],
  templateUrl: './liquid-cursor.component.html'
})
export class LiquidCursorComponent implements AfterViewInit, OnDestroy {
  @ViewChild('liquid') liquidRef!: ElementRef<HTMLDivElement>;
  @ViewChild('field') fieldRef!: ElementRef<HTMLDivElement>;

  blobs: { size: number, x: number, y: number, transform: string }[] = [];
  blurAmount = 12;
  headLerp = 0.35;
  tailLerp = 0.32;
  
  private pointer: { x: number, y: number } | null = null;
  private rafId: number | null = null;
  private boundTick!: () => void;
  private boundOnPointerMove!: (e: PointerEvent) => void;
  private boundOnPointerLeave!: () => void;
  private sceneWidth = 0;
  private sceneHeight = 0;

  sourceCode = `export class LiquidCursorComponent {
  headLerp = 0.35;
  tailLerp = 0.32;
  blurAmount = 12;

  tick() {
    const head = this.blobs[0];
    const target = this.pointer || { x: head.x, y: head.y };
    
    head.x += (target.x - head.x) * this.headLerp;
    head.y += (target.y - head.y) * this.headLerp;
    this.applyPosition(head);

    for (let i = 1; i < this.blobs.length; i += 1) {
      const blob = this.blobs[i];
      const leader = this.blobs[i - 1];
      blob.x += (leader.x - blob.x) * this.tailLerp;
      blob.y += (leader.y - blob.y) * this.tailLerp;
      this.applyPosition(blob);
    }
    
    this.applyVars(head.x, head.y);
  }
}`;

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private ngZone: NgZone
  ) {
    this.boundTick = this.tick.bind(this);
    this.boundOnPointerMove = this.onPointerMove.bind(this);
    this.boundOnPointerLeave = this.onPointerLeave.bind(this);
    this.createBlobs();
  }

  createBlobs() {
    this.blobs = [];
    for (let i = 0; i < BLOB_COUNT; i += 1) {
      const progress = i / (BLOB_COUNT - 1);
      const size = HEAD_SIZE - (HEAD_SIZE - TAIL_SIZE) * progress;
      this.blobs.push({ size, x: 0, y: 0, transform: '' });
    }
  }

  ngAfterViewInit() {
    if (isPlatformBrowser(this.platformId)) {
      const scene = document.querySelector('.js-lab-liquid-scene');
      if (scene) {
        scene.addEventListener('pointermove', this.boundOnPointerMove as EventListener);
        scene.addEventListener('pointerdown', this.boundOnPointerMove as EventListener);
        scene.addEventListener('pointerleave', this.boundOnPointerLeave as EventListener);
      }
      
      this.reset();

      this.ngZone.runOutsideAngular(() => {
        this.rafId = requestAnimationFrame(this.boundTick);
      });
    }
  }

  ngOnDestroy() {
    if (this.rafId !== null) cancelAnimationFrame(this.rafId);
    if (isPlatformBrowser(this.platformId)) {
      const scene = document.querySelector('.js-lab-liquid-scene');
      if (scene) {
        scene.removeEventListener('pointermove', this.boundOnPointerMove as EventListener);
        scene.removeEventListener('pointerdown', this.boundOnPointerMove as EventListener);
        scene.removeEventListener('pointerleave', this.boundOnPointerLeave as EventListener);
      }
    }
  }

  onPointerMove(event: PointerEvent) {
    const scene = document.querySelector('.js-lab-liquid-scene') as HTMLElement;
    if (scene) {
      const rect = scene.getBoundingClientRect();
      this.sceneWidth = scene.clientWidth;
      this.sceneHeight = scene.clientHeight;
      this.pointer = {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
      };
    }
  }

  onPointerLeave() {
    this.pointer = null;
  }

  reset() {
    this.pointer = null;
    this.headLerp = 0.35;
    this.tailLerp = 0.32;
    this.blurAmount = 12;

    const scene = document.querySelector('.js-lab-liquid-scene') as HTMLElement;
    const centerX = scene ? scene.clientWidth / 2 : window.innerWidth / 2;
    const centerY = scene ? scene.clientHeight / 2 : window.innerHeight / 2;

    this.blobs.forEach((blob) => {
      blob.x = centerX;
      blob.y = centerY;
      this.applyPosition(blob);
    });
    this.applyVars(centerX, centerY);
  }

  onParamChange(detail: any) {
    if (detail.id === 'headLerp') this.headLerp = detail.value;
    if (detail.id === 'tailLerp') this.tailLerp = detail.value;
    if (detail.id === 'blur') this.blurAmount = detail.value;
  }

  tick() {
    if (!this.blobs.length) return;

    const head = this.blobs[0];
    const target = this.pointer || { x: head.x, y: head.y };

    head.x += (target.x - head.x) * this.headLerp;
    head.y += (target.y - head.y) * this.headLerp;
    this.applyPosition(head);

    for (let i = 1; i < this.blobs.length; i += 1) {
      const blob = this.blobs[i];
      const leader = this.blobs[i - 1];
      blob.x += (leader.x - blob.x) * this.tailLerp;
      blob.y += (leader.y - blob.y) * this.tailLerp;
      this.applyPosition(blob);
    }

    this.applyVars(head.x, head.y);
    this.rafId = requestAnimationFrame(this.boundTick);
  }

  applyPosition(blob: any) {
    const offset = blob.size / 2;
    blob.transform = `translate3d(${(blob.x - offset).toFixed(1)}px, ${(blob.y - offset).toFixed(1)}px, 0)`;
  }

  applyVars(x: number, y: number) {
    if (this.liquidRef?.nativeElement) {
      this.liquidRef.nativeElement.style.setProperty('--lx', `${x.toFixed(1)}px`);
      this.liquidRef.nativeElement.style.setProperty('--ly', `${y.toFixed(1)}px`);
    }
  }

  drawDebug({ ctx, width, height, pointer }: any) {
    ctx.clearRect(0, 0, width, height);

    ctx.beginPath();
    ctx.strokeStyle = 'rgba(244, 244, 245, 0.4)';
    ctx.lineWidth = 1;
    this.blobs.forEach((blob, index) => {
      if (index === 0) ctx.moveTo(blob.x, blob.y);
      else ctx.lineTo(blob.x, blob.y);
    });
    ctx.stroke();

    this.blobs.forEach((blob, index) => {
      ctx.beginPath();
      ctx.setLineDash([3, 4]);
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.45)';
      ctx.arc(blob.x, blob.y, blob.size / 2, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = index === 0 ? 'rgba(253, 186, 116, 0.95)' : 'rgba(245, 158, 11, 0.6)';
      ctx.beginPath();
      ctx.arc(blob.x, blob.y, 2, 0, Math.PI * 2);
      ctx.fill();
    });

    if (this.pointer) {
      const head = this.blobs[0];
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(244, 244, 245, 0.3)';
      ctx.moveTo(head.x, head.y);
      ctx.lineTo(this.pointer.x, this.pointer.y);
      ctx.stroke();

      ctx.strokeStyle = 'rgba(244, 244, 245, 0.6)';
      ctx.beginPath();
      ctx.moveTo(this.pointer.x - 8, this.pointer.y);
      ctx.lineTo(this.pointer.x + 8, this.pointer.y);
      ctx.moveTo(this.pointer.x, this.pointer.y - 8);
      ctx.lineTo(this.pointer.x, this.pointer.y + 8);
      ctx.stroke();
    }
  }
}
