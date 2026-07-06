import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HeaderComponent } from '../../layout/header/header.component';
import { LabCarouselComponent } from './components/lab-carousel/lab-carousel.component';
import { categories, getExperimentsByCategory } from '../../core/utils/experiments';
import { BreadcrumbsComponent } from '../../shared/components/breadcrumbs/breadcrumbs.component';
import { TitleComponent } from '../../shared/components/title/title.component';
import { HighlightComponent } from '../../shared/components/highlight/highlight.component';
import { MarkComponent } from '../../shared/components/mark/mark.component';
import { LabCatalogComponent } from './components/lab-catalog/lab-catalog.component';
import { LabCategoryComponent } from './components/lab-category/lab-category.component';
import { LabRoadmapComponent } from './components/lab-roadmap/lab-roadmap.component';
import { LayoutComponent } from '../../shared/components/layout/layout.component';

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
    LayoutComponent
  ],
  templateUrl: './lab-overview.component.html',
  styleUrls: ['./lab-overview.component.scss']
})
export class LabOverviewComponent implements OnInit {
  readyCategories: any[] = [];
  soonCategories: any[] = [];

  ngOnInit() {
    this.readyCategories = categories.filter(c => c.status === 'ready');
    this.soonCategories = categories.filter(c => c.status !== 'ready');
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
