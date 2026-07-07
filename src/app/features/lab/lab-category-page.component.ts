import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { HeaderComponent } from '../../layout/header/header.component';
import { LayoutComponent } from '../../shared/components/layout/layout.component';
import { BreadcrumbsComponent } from '../../shared/components/breadcrumbs/breadcrumbs.component';
import { LabCarouselComponent } from './components/lab-carousel/lab-carousel.component';
import { LabCategoryComponent } from './components/lab-category/lab-category.component';
import { categories, getCategory, getExperimentsByCategory } from './data/experiments';
import { PageMetaService } from '../../core/services/page-meta.service';
import { Experiment } from './models/experiment.model';

@Component({
  selector: 'app-lab-category-page',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    HeaderComponent,
    LayoutComponent,
    BreadcrumbsComponent,
    LabCarouselComponent,
    LabCategoryComponent,
  ],
  templateUrl: './lab-category-page.component.html',
  styleUrls: ['./lab-category-page.component.scss'],
})
export class LabCategoryPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly pageMeta = inject(PageMetaService);

  readonly categorySlug = signal('');
  readonly category = signal<(typeof categories)[number] | null>(null);
  readonly experiments = signal<Experiment[]>([]);
  readonly readyCount = computed(() =>
    this.experiments().filter((item) => item.status === 'ready').length
  );

  constructor() {
    const slug = this.route.snapshot.paramMap.get('category') ?? '';
    const category = getCategory(slug);

    this.categorySlug.set(slug);
    this.category.set(category);
    this.experiments.set(getExperimentsByCategory(slug) as Experiment[]);

    if (category) {
      this.pageMeta.setPageMeta({
        title: `${category.title} — THE.LAB`,
        description: category.description,
      });
    }
  }
}
