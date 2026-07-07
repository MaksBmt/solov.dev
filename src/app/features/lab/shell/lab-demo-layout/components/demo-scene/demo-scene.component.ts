import { Component, input, ViewChild, ElementRef } from '@angular/core';

@Component({
  selector: 'div[appDemoScene]',
  standalone: true,
  templateUrl: './demo-scene.component.html',
  styleUrls: ['./demo-scene.component.scss'],
  host: {
    class: 'demo-scene',
  },
})
export class DemoSceneComponent {
  readonly isImmersive = input(false);
  readonly showDebug = input(false);

  @ViewChild('sceneArea') sceneAreaRef!: ElementRef<HTMLElement>;
  @ViewChild('debugCanvas') debugCanvasRef!: ElementRef<HTMLCanvasElement>;
}
