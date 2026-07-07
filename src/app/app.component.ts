import { Component, PLATFORM_ID, Renderer2, inject } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { CommonModule, isPlatformBrowser, DOCUMENT } from '@angular/common';
import { filter } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FaviconAnimatorService } from './core/services/favicon-animator.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule],
  templateUrl: './app.component.html',
})
export class AppComponent {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly document = inject(DOCUMENT);
  private readonly renderer = inject(Renderer2);
  private readonly router = inject(Router);
  private readonly faviconAnimator = inject(FaviconAnimatorService);

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      this.faviconAnimator.init();
    }

    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      takeUntilDestroyed()
    ).subscribe((event) => {
      this.updateBodyClasses(event.urlAfterRedirects);
    });
  }

  private updateBodyClasses(url: string) {
    if (!isPlatformBrowser(this.platformId)) return;

    const body = this.document.body;
    this.renderer.removeClass(body, 'page');
    this.renderer.removeClass(body, 'page--home');
    this.renderer.removeClass(body, 'page--no-scroll');
    this.renderer.removeClass(body, 'page--lab');

    this.renderer.addClass(body, 'page');

    if (url === '/' || url === '') {
      this.renderer.addClass(body, 'page--home');
      this.renderer.addClass(body, 'page--no-scroll');
    } else if (url.startsWith('/lab')) {
      this.renderer.addClass(body, 'page--lab');
    } else {
      this.renderer.addClass(body, 'page--home');
    }
  }
}
