import {
  Component,
  computed,
  input,
  ViewChild,
  ElementRef,
  AfterViewInit,
  PLATFORM_ID,
  Injector,
  inject,
  afterNextRender,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { RouterModule } from '@angular/router';
import { getCategory, getExperiment, getExperimentsByCategory } from '../../data/experiments';

interface LabExperimentNavItem {
  slug: string;
  title: string;
  category: string;
}

interface LabExperimentNavState {
  categorySlug: string;
  categoryTitle: string;
  siblings: LabExperimentNavItem[];
  prev: LabExperimentNavItem | null;
  next: LabExperimentNavItem | null;
  counter: string;
}

@Component({
  selector: 'app-lab-experiment-nav',
  standalone: true,
  imports: [RouterModule],
  templateUrl: './lab-experiment-nav.component.html',
  styleUrls: ['./lab-experiment-nav.component.scss'],
})
export class LabExperimentNavComponent implements AfterViewInit {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly injector = inject(Injector);

  @ViewChild('navList') navListRef?: ElementRef<HTMLUListElement>;

  readonly currentSlug = input.required<string>();

  readonly nav = computed((): LabExperimentNavState | null => {
    const current = getExperiment(this.currentSlug());
    if (!current) return null;

    const siblings = getExperimentsByCategory(current.category).filter((item) => item.status === 'ready');
    const index = siblings.findIndex((item) => item.slug === current.slug);
    if (index < 0 || siblings.length < 2) return null;

    const category = getCategory(current.category);
    if (!category) return null;

    const items: LabExperimentNavItem[] = siblings.map((item) => ({
      slug: item.slug,
      title: item.title,
      category: item.category,
    }));

    return {
      categorySlug: category.slug,
      categoryTitle: category.title,
      siblings: items,
      prev: index > 0 ? items[index - 1] : null,
      next: index < items.length - 1 ? items[index + 1] : null,
      counter: `${String(index + 1).padStart(2, '0')} / ${String(items.length).padStart(2, '0')}`,
    };
  });

  routeFor(slug: string, category: string): string[] {
    return ['/lab', category, slug];
  }

  ngAfterViewInit() {
    if (!isPlatformBrowser(this.platformId)) return;

    afterNextRender(() => this.scrollCurrentIntoView(), { injector: this.injector });
  }

  private scrollCurrentIntoView() {
    const list = this.navListRef?.nativeElement;
    if (!list) return;

    const current = list.querySelector('.lab-experiment-nav__link--current') as HTMLElement | null;
    if (!current) return;

    const listRect = list.getBoundingClientRect();
    const itemRect = current.getBoundingClientRect();
    const itemCenter = itemRect.left - listRect.left + itemRect.width / 2;
    const targetScroll = list.scrollLeft + itemCenter - list.clientWidth / 2;

    list.scrollLeft = Math.max(0, Math.min(targetScroll, list.scrollWidth - list.clientWidth));
  }
}
