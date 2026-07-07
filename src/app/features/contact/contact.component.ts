import { Component, inject, signal } from '@angular/core';
import { HeaderComponent } from '../../layout/header/header.component';
import { FooterComponent } from '../../layout/footer/footer.component';
import { LayoutComponent } from '../../shared/components/layout/layout.component';
import { TitleComponent } from '../../shared/components/title/title.component';
import { PageMetaService } from '../../core/services/page-meta.service';
import { getSitePage } from '../../core/config/site-pages.config';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [HeaderComponent, FooterComponent, LayoutComponent, TitleComponent],
  templateUrl: './contact.component.html',
  styleUrls: ['./contact.component.scss'],
})
export class ContactComponent {
  private readonly pageMeta = inject(PageMetaService);

  readonly title = signal('Contact');
  readonly lead = signal('Раздел в разработке — здесь появятся способы связи.');

  constructor() {
    const page = getSitePage('contact');
    if (page) this.pageMeta.setPageMeta(page);
  }
}
