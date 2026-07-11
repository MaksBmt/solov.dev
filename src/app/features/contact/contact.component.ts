import { Component, inject } from '@angular/core';
import { HeaderComponent } from '../../layout/header/header.component';
import { FooterComponent } from '../../layout/footer/footer.component';
import { LayoutComponent } from '../../shared/components/layout/layout.component';
import { TitleComponent } from '../../shared/components/title/title.component';
import { HighlightComponent } from '../../shared/components/highlight/highlight.component';
import { MarkComponent } from '../../shared/components/mark/mark.component';
import { BreadcrumbsComponent } from '../../shared/components/breadcrumbs/breadcrumbs.component';
import { RevealOnScrollDirective } from '../../shared/directives/reveal-on-scroll.directive';
import { PageMetaService } from '../../core/services/page-meta.service';
import { getSitePage, getSitePageBreadcrumbs } from '../../core/config/site-pages.config';

interface ContactBlock {
  eyebrow: string;
  title: string;
  paragraphs: string[];
  href: string;
  linkLabel: string;
  external?: boolean;
}

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [
    HeaderComponent,
    FooterComponent,
    LayoutComponent,
    TitleComponent,
    HighlightComponent,
    MarkComponent,
    BreadcrumbsComponent,
    RevealOnScrollDirective,
  ],
  templateUrl: './contact.component.html',
})
export class ContactComponent {
  private readonly pageMeta = inject(PageMetaService);

  readonly breadcrumbs = getSitePageBreadcrumbs('contact');

  readonly blocks: ContactBlock[] = [
    {
      eyebrow: '01 / TELEGRAM',
      title: 'Telegram',
      paragraphs: [
        'Telegram — самый оперативный способ написать.',
      ],
      href: 'https://t.me/solov_one',
      linkLabel: 't.me/solov_one',
      external: true,
    },
    {
      eyebrow: '02 / EMAIL',
      title: 'Электронная почта',
      paragraphs: [
        'Электронная почта — если удобнее написать письмом.',
      ],
      href: 'mailto:msolov.one@gmail.com',
      linkLabel: 'msolov.one@gmail.com',
    },
  ];

  constructor() {
    const page = getSitePage('contact');
    if (page) this.pageMeta.setPageMeta(page);
  }
}
