import { Component, PLATFORM_ID, ChangeDetectorRef, ViewChild, ElementRef, AfterViewInit, OnDestroy, inject, input, signal } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { LabGalleryComponent } from '../lab-gallery/lab-gallery.component';
import EmblaCarousel, { EmblaCarouselType } from 'embla-carousel';

@Component({
  selector: 'app-lab-carousel',
  standalone: true,
  imports: [CommonModule, LabGalleryComponent],
  templateUrl: './lab-carousel.component.html',
  styleUrls: ['./lab-carousel.component.scss'],
})
export class LabCarouselComponent implements AfterViewInit, OnDestroy {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly cdr = inject(ChangeDetectorRef);

  readonly experiments = input<any[]>([]);
  @ViewChild('viewport') viewportRef!: ElementRef<HTMLDivElement>;

  private emblaApi: EmblaCarouselType | null = null;
  readonly activeIndex = signal(0);
  readonly canScrollPrev = signal(false);
  readonly canScrollNext = signal(true);
  readonly progress = signal(0);
  readonly counterText = signal('01 / 01');

  ngAfterViewInit() {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    const total = Math.max(1, this.experiments().length);
    this.counterText.set(`01 / ${String(total).padStart(2, '0')}`);

    if (this.experiments().length <= 1) {
      this.canScrollPrev.set(false);
      this.canScrollNext.set(false);
      this.progress.set(100);
      return;
    }

    this.emblaApi = EmblaCarousel(this.viewportRef.nativeElement, {
      align: 'center',
      containScroll: 'trimSnaps',
      dragFree: false,
      loop: false,
    });

    this.emblaApi.on('select', () => this.updateState());
    this.emblaApi.on('reInit', () => this.updateState());

    queueMicrotask(() => {
      this.updateState();
      this.cdr.markForCheck();
    });
  }

  ngOnDestroy() {
    if (!isPlatformBrowser(this.platformId)) return;

    if (this.emblaApi) {
      this.emblaApi.destroy();
    }
  }

  scrollPrev() {
    if (this.emblaApi) this.emblaApi.scrollPrev();
  }

  scrollNext() {
    if (this.emblaApi) this.emblaApi.scrollNext();
  }

  private updateState() {
    if (!this.emblaApi) return;
    this.activeIndex.set(this.emblaApi.selectedScrollSnap());
    this.canScrollPrev.set(this.emblaApi.canScrollPrev());
    this.canScrollNext.set(this.emblaApi.canScrollNext());

    const total = this.emblaApi.scrollSnapList().length;
    if (total > 1) {
      this.progress.set(((this.activeIndex() + 1) / total) * 100);
    } else {
      this.progress.set(100);
    }

    const current = this.activeIndex() + 1;
    this.counterText.set(
      `${String(current).padStart(2, '0')} / ${String(Math.max(1, total)).padStart(2, '0')}`
    );
  }
}
