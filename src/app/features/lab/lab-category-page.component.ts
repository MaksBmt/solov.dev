import { Component, OnInit } from '@angular/core';
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
export class LabCategoryPageComponent implements OnInit {
  categorySlug = '';
  category: (typeof categories)[number] | null = null;
  experiments: Experiment[] = [];

  constructor(private route: ActivatedRoute, private pageMeta: PageMetaService) {}

  ngOnInit(): void {
    this.categorySlug = this.route.snapshot.paramMap.get('category') ?? '';
    this.category = getCategory(this.categorySlug);
    this.experiments = getExperimentsByCategory(this.categorySlug) as Experiment[];

    if (this.category) {
      this.pageMeta.setPageMeta({
        title: `${this.category.title} — THE.LAB`,
        description: this.category.description,
      });
    }
  }

  get readyCount(): number {
    return this.experiments.filter((item) => item.status === 'ready').length;
  }
}
