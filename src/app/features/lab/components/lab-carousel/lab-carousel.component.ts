import { Component, Input, ViewChild, ElementRef, AfterViewInit, OnDestroy, Inject, PLATFORM_ID, ChangeDetectorRef } from '@angular/core';
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
  @Input() experiments: any[] = [];
  @ViewChild('viewport') viewportRef!: ElementRef<HTMLDivElement>;

  private emblaApi: EmblaCarouselType | null = null;
  activeIndex = 0;
  canScrollPrev = false;
  canScrollNext = true;
  progress = 0;

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private cdr: ChangeDetectorRef
  ) {}

  ngAfterViewInit() {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    if (this.experiments.length <= 1) {
      this.canScrollPrev = false;
      this.canScrollNext = false;
      this.progress = 100;
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

    // Embla init updates snaps synchronously — defer to avoid NG0100 in dev mode.
    queueMicrotask(() => {
      this.updateState();
      this.cdr.markForCheck();
    });
  }

  ngOnDestroy() {
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
    this.activeIndex = this.emblaApi.selectedScrollSnap();
    this.canScrollPrev = this.emblaApi.canScrollPrev();
    this.canScrollNext = this.emblaApi.canScrollNext();

    const total = this.emblaApi.scrollSnapList().length;
    if (total > 1) {
      this.progress = ((this.activeIndex + 1) / total) * 100;
    } else {
      this.progress = 100;
    }
  }

  formatCounter(): string {
    const total = this.emblaApi ? this.emblaApi.scrollSnapList().length : Math.max(1, this.experiments.length);
    const current = this.activeIndex + 1;
    return `${String(current).padStart(2, '0')} / ${String(total).padStart(2, '0')}`;
  }
}
