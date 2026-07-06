import { Component, HostBinding, Input, ViewChild, ElementRef } from '@angular/core';

@Component({
  selector: 'div[appDemoScene]',
  standalone: true,
  templateUrl: './demo-scene.component.html',
})
export class DemoSceneComponent {
  @Input() isImmersive = false;
  @Input() showDebug = false;

  @ViewChild('sceneArea') sceneAreaRef!: ElementRef<HTMLElement>;
  @ViewChild('debugCanvas') debugCanvasRef!: ElementRef<HTMLCanvasElement>;

  @HostBinding('class.demo-scene') isDemoScene = true;
}
