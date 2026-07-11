import { Component, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { HeaderComponent } from '../../layout/header/header.component';
import { FooterComponent } from '../../layout/footer/footer.component';
import { LayoutComponent } from '../../shared/components/layout/layout.component';
import { TitleComponent } from '../../shared/components/title/title.component';
import { HighlightComponent } from '../../shared/components/highlight/highlight.component';
import { MarkComponent } from '../../shared/components/mark/mark.component';
import { TechTagsComponent } from '../../shared/components/tech-tags/tech-tags.component';
import { BreadcrumbsComponent } from '../../shared/components/breadcrumbs/breadcrumbs.component';
import { RevealOnScrollDirective } from '../../shared/directives/reveal-on-scroll.directive';
import { PageMetaService } from '../../core/services/page-meta.service';
import { getSitePage, getSitePageBreadcrumbs } from '../../core/config/site-pages.config';

interface AboutBlock {
  eyebrow: string;
  title: string;
  paragraphs: string[];
  tags?: string[];
  link?: { label: string; path: string };
}

@Component({
  selector: 'app-projects',
  standalone: true,
  imports: [
    RouterModule,
    HeaderComponent,
    FooterComponent,
    LayoutComponent,
    TitleComponent,
    HighlightComponent,
    MarkComponent,
    TechTagsComponent,
    BreadcrumbsComponent,
    RevealOnScrollDirective,
  ],
  templateUrl: './projects.component.html',
})
export class ProjectsComponent {
  private readonly pageMeta = inject(PageMetaService);

  readonly breadcrumbs = getSitePageBreadcrumbs('projects');

  readonly siteTech = [
    'Angular 17',
    'Standalone',
    'SSR',
    'Hydration',
    'Lazy Routes',
    'Signals',
    'TypeScript',
    'SCSS',
  ];

  readonly blocks: AboutBlock[] = [
    {
      eyebrow: '01 / САЙТ',
      title: 'Живое портфолио, а не PDF',
      paragraphs: [
        'Сайт собран на Angular с нуля — как production-приложение, а не витрина из шаблонов. Standalone-архитектура, серверный рендеринг и гидратация дают быстрый первый экран и корректную индексацию.',
        'Маршруты Lab и каждый эксперимент подгружаются лениво: код демо не тянется на главную, а состояние и UI управляются через Signals — без лишних подписок и перерисовок.',
        'Код, структура репозитория и живые демо — не декоративная обёртка, а аргумент: здесь виден способ мышления инженера, а не только список технологий.',
      ],
      tags: this.siteTech,
    },
    {
      eyebrow: '02 / THE.LAB',
      title: 'Инженерия за пикселями',
      paragraphs: [
        'THE.LAB — лаборатория интерактивных экспериментов: cursor, scroll, hover, типографика и UI-компоненты. Каждый эффект — живое демо, исходный код и инженерная «изнанка» с параметрами отладки.',
        'Принципиально без сторонних библиотек анимаций: только CSS, JavaScript и понимание физики интерфейса. Это демонстрирует глубину frontend-навыков — когда эффект собран руками, а не подключён пакетом.',
      ],
      link: { label: 'Открыть лабораторию', path: '/lab' },
    },
    {
      eyebrow: '03 / СКОРО',
      title: 'Эффекты с библиотеками',
      paragraphs: [
        'Следующий раздел — контраст к Lab: те же идеи интерактивности, но с участием профильных инструментов — GSAP, Three.js и аналоги. Здесь важен не только визуальный результат, но и грамотная интеграция тяжёлых зависимостей в Angular-приложение.',
        'Lab и этот раздел скорее дополняют друг друга: в одном случае эффект собран вручную, в другом — на профильных инструментах, если они действительно уместны.',
      ],
    },
  ];

  constructor() {
    const page = getSitePage('projects');
    if (page) this.pageMeta.setPageMeta(page);
  }
}
