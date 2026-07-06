import { Component, OnInit, Inject, PLATFORM_ID, Renderer2 } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { CommonModule, isPlatformBrowser, DOCUMENT } from '@angular/common';
import { filter } from 'rxjs/operators';
import { MouseTrackerService } from './core/services/mouse-tracker.service';
import { FaviconAnimatorService } from './core/services/favicon-animator.service';

import { PointerComponent } from './shared/components/pointer/pointer.component';
import { AmbientCanvasComponent } from './shared/components/ambient-canvas/ambient-canvas.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule],
  templateUrl: './app.component.html',
})
export class AppComponent implements OnInit {
  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    @Inject(DOCUMENT) private document: Document,
    private renderer: Renderer2,
    private router: Router,
    private mouseTracker: MouseTrackerService,
    private faviconAnimator: FaviconAnimatorService
  ) {}

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.faviconAnimator.init();
    }

    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd)
    ).subscribe((event) => {
      this.updateBodyClasses(event.urlAfterRedirects);
    });
  }

  private updateBodyClasses(url: string) {
    const body = this.document.body;
    // Remove old classes
    this.renderer.removeClass(body, 'page');
    this.renderer.removeClass(body, 'page--home');
    this.renderer.removeClass(body, 'page--no-scroll');
    this.renderer.removeClass(body, 'page--lab');

    // Add new classes
    this.renderer.addClass(body, 'page');
    
    if (url === '/' || url === '') {
      this.renderer.addClass(body, 'page--home');
      this.renderer.addClass(body, 'page--no-scroll');
    } else if (url.startsWith('/lab')) {
      this.renderer.addClass(body, 'page--lab');
    } else {
      // Default for other pages if any
      this.renderer.addClass(body, 'page--home'); // fallback
    }
  }
}
