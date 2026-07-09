import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HeaderComponent } from '../../layout/header/header.component';
import { LabCarouselComponent } from './components/lab-carousel/lab-carousel.component';
import { categories, getExperimentsByCategory } from './data/experiments';
import { BreadcrumbsComponent } from '../../shared/components/breadcrumbs/breadcrumbs.component';
import { TitleComponent } from '../../shared/components/title/title.component';
import { HighlightComponent } from '../../shared/components/highlight/highlight.component';
import { MarkComponent } from '../../shared/components/mark/mark.component';
import { LabCatalogComponent } from './components/lab-catalog/lab-catalog.component';
import { LabCategoryComponent } from './components/lab-category/lab-category.component';
import { LabRoadmapComponent } from './components/lab-roadmap/lab-roadmap.component';
import { LayoutComponent } from '../../shared/components/layout/layout.component';
import { PageMetaService } from '../../core/services/page-meta.service';
import { getSitePage } from '../../core/config/site-pages.config';

@Component({
  selector: 'app-lab-overview',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    HeaderComponent,
    LabCarouselComponent,
    BreadcrumbsComponent,
    TitleComponent,
    HighlightComponent,
    MarkComponent,
    LabCatalogComponent,
    LabCategoryComponent,
    LabRoadmapComponent,
    LayoutComponent,
  ],
  templateUrl: './lab-overview.component.html',
  styleUrls: ['./lab-overview.component.scss'],
})
export class LabOverviewComponent {
  private readonly pageMeta = inject(PageMetaService);

  get readyCategories() {
    return categories.filter((c) => c.status === 'ready');
  }

  get soonCategories() {
    return categories.filter((c) => c.status !== 'ready');
  }

  constructor() {
    const page = getSitePage('lab');
    if (page) this.pageMeta.setPageMeta(page);
  }

  getExperiments(categorySlug: string) {
    return getExperimentsByCategory(categorySlug);
  }

  getTotalCount(categorySlug: string) {
    return this.getExperiments(categorySlug).length;
  }

  getReadyCount(categorySlug: string) {
    return this.getExperiments(categorySlug).filter((e: any) => e.status === 'ready').length;
  }

  formatIndex(index: number) {
    return String(index + 1).padStart(2, '0');
  }
}
