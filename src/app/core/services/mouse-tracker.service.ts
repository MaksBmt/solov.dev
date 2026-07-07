import { Injectable, NgZone, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
  providedIn: 'root',
})
export class MouseTrackerService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly ngZone = inject(NgZone);

  private mouseX = 0;
  private mouseY = 0;

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      this.mouseX = window.innerWidth / 2;
      this.mouseY = window.innerHeight / 2;

      this.ngZone.runOutsideAngular(() => {
        window.addEventListener('mousemove', (event) => {
          this.mouseX = event.clientX;
          this.mouseY = event.clientY;
        });
      });
    }
  }

  getMousePosition(): { x: number; y: number } {
    return { x: this.mouseX, y: this.mouseY };
  }
}
