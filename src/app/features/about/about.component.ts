import { Component, inject, signal } from '@angular/core';
import { HeaderComponent } from '../../layout/header/header.component';
import { FooterComponent } from '../../layout/footer/footer.component';
import { LayoutComponent } from '../../shared/components/layout/layout.component';
import { TitleComponent } from '../../shared/components/title/title.component';
import { PageMetaService } from '../../core/services/page-meta.service';
import { getSitePage } from '../../core/config/site-pages.config';

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [HeaderComponent, FooterComponent, LayoutComponent, TitleComponent],
  templateUrl: './about.component.html',
  styleUrls: ['./about.component.scss'],
})
export class AboutComponent {
  private readonly pageMeta = inject(PageMetaService);

  readonly title = signal('About');
  readonly lead = signal('Раздел в разработке — здесь появится информация об опыте и подходе.');

  constructor() {
    const page = getSitePage('about');
    if (page) this.pageMeta.setPageMeta(page);
  }
}
