import { Component, Input, OnInit, AfterViewInit, ViewChild, ElementRef, OnDestroy, Inject, PLATFORM_ID, NgZone, Output, EventEmitter } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { HeaderComponent } from '../../../../layout/header/header.component';
import { BreadcrumbsComponent } from '../../../../shared/components/breadcrumbs/breadcrumbs.component';
import { LabPassportComponent } from '../../components/lab-passport/lab-passport.component';
import { CodeViewComponent } from '../../components/code-view/code-view.component';
import { LabDebugPanelComponent } from '../../components/lab-debug-panel/lab-debug-panel.component';

import { getExperiment, getCategory } from '../../data/experiments';
import { MouseTrackerService } from '../../../../core/services/mouse-tracker.service';

import { LabTopbarComponent } from './components/lab-topbar/lab-topbar.component';
import { LabSwitchComponent } from './components/lab-switch/lab-switch.component';
import { DemoLayoutComponent } from './components/demo-layout/demo-layout.component';
import { DemoSceneComponent } from './components/demo-scene/demo-scene.component';
import { DemoInfoComponent } from './components/demo-info/demo-info.component';
import { LabActionsComponent } from './components/lab-actions/lab-actions.component';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { MarkComponent } from '../../../../shared/components/mark/mark.component';
import { LayoutComponent } from '../../../../shared/components/layout/layout.component';
import { PageMetaService } from '../../../../core/services/page-meta.service';

@Component({
  selector: 'app-lab-demo-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    HeaderComponent,
    BreadcrumbsComponent,
    LabPassportComponent,
    CodeViewComponent,
    LabDebugPanelComponent,
    LabTopbarComponent,
    LabSwitchComponent,
    DemoLayoutComponent,
    DemoSceneComponent,
    DemoInfoComponent,
    LabActionsComponent,
    ButtonComponent,
    MarkComponent,
    LayoutComponent,
  ],
  styleUrls: ['./lab-demo-layout.component.scss'],
  templateUrl: './lab-demo-layout.component.html'
})
export class LabDemoLayoutComponent implements OnInit, AfterViewInit, OnDestroy {
  @Input() experimentSlug!: string;
  @Input() isImmersive: boolean = false;

  @Output() onReset = new EventEmitter<void>();
  @Output() onParamChange = new EventEmitter<{id: string, value: number, control: any, silent?: boolean}>();
  @Output() onDrawDebug = new EventEmitter<{ctx: CanvasRenderingContext2D, width: number, height: number, pointer: any}>();

  @ViewChild(DemoSceneComponent) demoScene!: DemoSceneComponent;
  @ViewChild('labDemoSection') labDemoSectionRef!: ElementRef<HTMLElement>;
  @ViewChild(CodeViewComponent, { read: ElementRef }) codeViewRef!: ElementRef<HTMLElement>;

  experiment: any;
  showDebug = false;
  showCode = false;
  codeName = '';
  sourceCode = '';
  codeLines: {text: string, key?: string, highlight: boolean}[] = [];

  controlValues: Record<string, number> = {};
  monitorValues: Record<string, string> = {};

  private rafId: number | null = null;
  private resizeObserver: ResizeObserver | null = null;
  private frames = 0;
  private fpsWindowStart = 0;
  private boundTick!: () => void;
  private pointer: any = null;
  private scenePointerMoveHandler?: (e: PointerEvent) => void;
  private scenePointerLeaveHandler?: () => void;

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private ngZone: NgZone,
    private mouseTracker: MouseTrackerService,
    private pageMeta: PageMetaService
  ) {
    this.boundTick = this.tick.bind(this);
  }

  ngOnInit() {
    this.experiment = getExperiment(this.experimentSlug);
    if (this.experiment) {
      const category = getCategory(this.experiment.category);
      this.pageMeta.setExperimentMeta(
        this.experiment.title,
        this.experiment.description,
        category?.title ?? 'THE.LAB'
      );
    }
    this.resetControlsToDefaults();
    this.loadSourceCode();
  }

  ngAfterViewInit() {
    if (!isPlatformBrowser(this.platformId)) return;

    this.initDebugCanvas();
    this.bindScenePointerTracking();
  }

  ngOnDestroy() {
    if (this.rafId !== null) cancelAnimationFrame(this.rafId);
    if (this.resizeObserver) this.resizeObserver.disconnect();
    this.unbindScenePointerTracking();
  }

  onDebugToggle(enabled: boolean) {
    this.showDebug = enabled;

    if (enabled) {
      this.frames = 0;
      this.fpsWindowStart = performance.now();
      this.ngZone.runOutsideAngular(() => {
        this.rafId = requestAnimationFrame(this.boundTick);
      });
    } else {
      if (this.rafId !== null) cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  resetScene() {
    this.resetControlsToDefaults();
    this.onReset.emit();
  }

  toggleCode() {
    this.showCode = !this.showCode;
    if (this.showCode && !this.codeLines.length && this.sourceCode) {
      this.initCodeLines();
    }
  }

  openCode() {
    this.showCode = true;
    if (!this.codeLines.length && this.sourceCode) {
      this.initCodeLines();
    }
    setTimeout(() => {
      this.codeViewRef?.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 50);
  }

  private loadSourceCode() {
    const sourceFile = this.experiment?.sourceFile;
    if (!sourceFile || !isPlatformBrowser(this.platformId)) return;

    this.codeName = sourceFile;

    fetch(`assets/lab-sources/${sourceFile}`)
      .then((response) => response.text())
      .then((code) => {
        this.sourceCode = code.replace(/\r\n/g, '\n');
        if (this.showCode) {
          this.initCodeLines();
        }
      })
      .catch(() => {
        this.sourceCode = '';
        this.codeLines = [];
      });
  }

  initCodeLines() {
    if (!this.sourceCode) return;
    const codeKeys = (this.experiment?.debugControls || [])
      .filter((c: any) => c.codeKey)
      .map((c: any) => c.codeKey);

    this.codeLines = this.sourceCode.replace(/\r\n/g, '\n').split('\n').map(line => {
      let key = undefined;
      for (const codeKey of codeKeys) {
        if (line.includes(codeKey)) {
          key = codeKey;
          break;
        }
      }
      return { text: line === '' ? ' ' : line, key, highlight: false };
    });
  }

  resetControlsToDefaults() {
    (this.experiment?.debugControls || []).forEach((control: any) => {
      this.controlValues[control.id] = control.default;
      this.onParamChange.emit({ id: control.id, value: control.default, control, silent: true });
    });
  }

  onControlChange(control: any, event: Event) {
    const val = Number((event.target as HTMLInputElement).value);
    this.controlValues[control.id] = val;
    this.onParamChange.emit({ id: control.id, value: val, control });
    this.syncCodeLine(control.codeKey, val);
  }

  syncCodeLine(codeKey: string, value: number) {
    if (!codeKey) return;
    const line = this.codeLines.find(l => l.key === codeKey);
    if (line) {
      line.text = line.text.replace(/(=\s*)[\d.]+/, (_, prefix) => `${prefix}${this.formatCodeValue(value)}`);
      line.highlight = true;
      setTimeout(() => line.highlight = false, 1500);
    }
  }

  formatCodeValue(value: number) {
    return Number.isInteger(value) ? String(value) : String(Number(value.toFixed(2)));
  }

  private getSceneElement(): HTMLElement | null {
    return this.demoScene?.sceneAreaRef?.nativeElement ?? null;
  }

  private getVarsTargetElement(): HTMLElement | null {
    return this.labDemoSectionRef?.nativeElement.querySelector('[data-debug-vars]') ?? null;
  }

  private bindScenePointerTracking() {
    const sceneEl = this.getSceneElement();
    if (!sceneEl) return;

    this.scenePointerMoveHandler = (e: PointerEvent) => {
      const rect = sceneEl.getBoundingClientRect();
      this.pointer = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    };
    this.scenePointerLeaveHandler = () => {
      this.pointer = null;
    };

    sceneEl.addEventListener('pointermove', this.scenePointerMoveHandler);
    sceneEl.addEventListener('pointerleave', this.scenePointerLeaveHandler);
  }

  private unbindScenePointerTracking() {
    const sceneEl = this.getSceneElement();
    if (!sceneEl) return;

    if (this.scenePointerMoveHandler) {
      sceneEl.removeEventListener('pointermove', this.scenePointerMoveHandler);
    }
    if (this.scenePointerLeaveHandler) {
      sceneEl.removeEventListener('pointerleave', this.scenePointerLeaveHandler);
    }
  }

  initDebugCanvas() {
    const canvas = this.demoScene?.debugCanvasRef?.nativeElement;
    const scene = this.getSceneElement();
    if (!canvas || !scene) return;

    this.resizeObserver = new ResizeObserver(() => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = scene.clientWidth * dpr;
      canvas.height = scene.clientHeight * dpr;
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    });
    this.resizeObserver.observe(scene);
  }

  tick() {
    if (!this.showDebug) return;

    const now = performance.now();
    this.frames += 1;
    const elapsed = now - this.fpsWindowStart;

    if (elapsed >= 500) {
      const fps = Math.round((this.frames * 1000) / elapsed);
      this.monitorValues['fps'] = String(fps);
      this.frames = 0;
      this.fpsWindowStart = now;
    }

    const sceneEl = this.getSceneElement();
    const mouse = this.mouseTracker.getMousePosition();
    if (sceneEl) {
      const rect = sceneEl.getBoundingClientRect();
      const x = Math.round(mouse.x - rect.left);
      const y = Math.round(mouse.y - rect.top);
      this.monitorValues['pointer'] = `${x} : ${y}`;
    }

    if (this.getVarsTargetElement()) {
      const styles = getComputedStyle(this.getVarsTargetElement()!);
      (this.experiment?.debugMonitor || []).forEach((item: any) => {
        if (item.type === 'cssVar') {
          const raw = styles.getPropertyValue(item.id).trim();
          this.monitorValues[item.id] = raw || '—';
        }
      });
    }

    if (this.demoScene?.debugCanvasRef && sceneEl) {
      const canvas = this.demoScene.debugCanvasRef.nativeElement;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        this.onDrawDebug.emit({ ctx, width: sceneEl.clientWidth, height: sceneEl.clientHeight, pointer: this.pointer });
      }
    }

    this.rafId = requestAnimationFrame(this.boundTick);
  }
}
