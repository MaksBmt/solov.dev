import { Injectable, Inject, PLATFORM_ID, NgZone } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class MouseTrackerService {
  private mouseX: number = 0;
  private mouseY: number = 0;

  constructor(@Inject(PLATFORM_ID) private platformId: Object, private ngZone: NgZone) {
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
