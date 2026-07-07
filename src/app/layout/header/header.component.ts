import { Component, HostListener, ViewChild, ElementRef, PLATFORM_ID, inject, signal } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { BrandComponent } from '../brand/brand.component';
import { filter } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationComponent } from '../../shared/components/navigation/navigation.component';
import { ToggleComponent } from '../../shared/components/toggle/toggle.component';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule, BrandComponent, NavigationComponent, ToggleComponent],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
})
export class HeaderComponent {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly router = inject(Router);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  @ViewChild('drawer') drawerRef!: ElementRef<HTMLDivElement>;
  @ViewChild('toggleBtn', { read: ElementRef }) toggleBtnRef!: ElementRef<HTMLElement>;

  readonly isOpen = signal(false);
  readonly isHidden = signal(true);

  private isClosing = false;

  constructor() {
    this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      takeUntilDestroyed()
    ).subscribe((event) => {
      this.close();
      this.markCurrentNavigation((event as NavigationEnd).urlAfterRedirects);
    });
  }

  markCurrentNavigation(url: string) {
    if (!this.isBrowser) return;
    const isLabPage = url.startsWith('/lab');
    setTimeout(() => {
      document.querySelectorAll('.navigation__link').forEach((link) => {
        const href = link.getAttribute('href');
        if (href === '/lab' && isLabPage) {
          link.classList.add('navigation__link--current');
        }
      });
    }, 0);
  }

  toggleMenu(event: Event) {
    event.stopPropagation();
    if (this.isOpen()) {
      this.close();
    } else {
      this.open();
    }
  }

  open() {
    if (this.isClosing && this.drawerRef?.nativeElement) {
      this.isClosing = false;
    }
    this.isHidden.set(false);

    if (this.isBrowser) {
      requestAnimationFrame(() => {
        this.isOpen.set(true);
      });
    } else {
      this.isOpen.set(true);
    }
  }

  close(instant = false) {
    if (instant || this.isHidden()) {
      this.isOpen.set(false);
      this.isHidden.set(true);
      return;
    }

    if (!this.isOpen()) return;

    this.isClosing = true;
    this.isOpen.set(false);

    if (this.isBrowser && this.drawerRef?.nativeElement) {
      const el = this.drawerRef.nativeElement;
      const onEnd = (e: TransitionEvent) => {
        if (e.target !== el || !this.isClosing || e.propertyName !== 'opacity') return;
        el.removeEventListener('transitionend', onEnd);
        this.isClosing = false;
        this.isHidden.set(true);
      };
      el.addEventListener('transitionend', onEnd);
      setTimeout(() => {
        if (this.isClosing) {
          this.isClosing = false;
          this.isHidden.set(true);
        }
      }, 300);
    } else {
      this.isHidden.set(true);
    }
  }

  @HostListener('document:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent) {
    if (!this.isBrowser) return;
    if (event.key === 'Escape' && this.isOpen()) {
      this.close();
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event) {
    if (!this.isBrowser || !this.isOpen()) return;

    const clickInsideDrawer = this.drawerRef?.nativeElement.contains(event.target as Node);
    const clickOnToggle = this.toggleBtnRef?.nativeElement.contains(event.target as Node);

    if (!clickInsideDrawer && !clickOnToggle) {
      this.close();
    }
  }
}
