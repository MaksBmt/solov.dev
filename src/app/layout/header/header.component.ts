import { Component, HostListener, ViewChild, ElementRef, OnInit, Inject, PLATFORM_ID, NgZone } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { BrandComponent } from '../brand.component';
import { filter } from 'rxjs/operators';
import { NavigationComponent } from '../../shared/components/navigation/navigation.component';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule, BrandComponent, NavigationComponent],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
})
export class HeaderComponent implements OnInit {
  @ViewChild('drawer') drawerRef!: ElementRef<HTMLDivElement>;
  @ViewChild('toggleBtn') toggleBtnRef!: ElementRef<HTMLButtonElement>;

  isOpen = false;
  isHidden = true;
  private isClosing = false;
  private isBrowser: boolean;

  constructor(@Inject(PLATFORM_ID) platformId: Object, private router: Router) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngOnInit() {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      this.close();
      this.markCurrentNavigation(event.urlAfterRedirects);
    });
  }

  // To support original /lab-*.html highlighting
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
    if (this.isOpen) {
      this.close();
    } else {
      this.open();
    }
  }

  open() {
    if (this.isClosing && this.drawerRef?.nativeElement) {
      this.isClosing = false;
    }
    this.isHidden = false;
    
    if (this.isBrowser) {
      requestAnimationFrame(() => {
        this.isOpen = true;
      });
    } else {
      this.isOpen = true;
    }
  }

  close(instant = false) {
    if (instant || this.isHidden) {
      this.isOpen = false;
      this.isHidden = true;
      return;
    }

    if (!this.isOpen) return;

    this.isClosing = true;
    this.isOpen = false;
    
    if (this.isBrowser && this.drawerRef?.nativeElement) {
      const el = this.drawerRef.nativeElement;
      const onEnd = (e: TransitionEvent) => {
        if (e.target !== el || !this.isClosing || e.propertyName !== 'opacity') return;
        el.removeEventListener('transitionend', onEnd);
        this.isClosing = false;
        this.isHidden = true;
      };
      el.addEventListener('transitionend', onEnd);
      setTimeout(() => {
        if (this.isClosing) {
          this.isClosing = false;
          this.isHidden = true;
        }
      }, 300);
    } else {
      this.isHidden = true;
    }
  }

  @HostListener('document:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent) {
    if (event.key === 'Escape' && this.isOpen) {
      this.close();
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event) {
    if (!this.isOpen) return;
    
    const clickInsideDrawer = this.drawerRef?.nativeElement.contains(event.target as Node);
    const clickOnToggle = this.toggleBtnRef?.nativeElement.contains(event.target as Node);

    if (!clickInsideDrawer && !clickOnToggle) {
      this.close();
    }
  }
}
