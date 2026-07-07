import { Component, inject, signal } from '@angular/core';
import { HeaderComponent } from '../../layout/header/header.component';
import { FooterComponent } from '../../layout/footer/footer.component';
import { LayoutComponent } from '../../shared/components/layout/layout.component';
import { TitleComponent } from '../../shared/components/title/title.component';
import { PageMetaService } from '../../core/services/page-meta.service';
import { getSitePage } from '../../core/config/site-pages.config';

@Component({
  selector: 'app-projects',
  standalone: true,
  imports: [HeaderComponent, FooterComponent, LayoutComponent, TitleComponent],
  templateUrl: './projects.component.html',
  styleUrls: ['./projects.component.scss'],
})
export class ProjectsComponent {
  private readonly pageMeta = inject(PageMetaService);

  readonly title = signal('Projects');
  readonly lead = signal('Раздел в разработке — здесь появятся кейсы и проекты.');

  constructor() {
    const page = getSitePage('projects');
    if (page) this.pageMeta.setPageMeta(page);
  }
}
