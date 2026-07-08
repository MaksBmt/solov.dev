import { Component, computed, input } from '@angular/core';
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
export class LabExperimentNavComponent {
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
}
