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
  code?: string;
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
    'Signals',
    'SSR',
    'Hydration',
    'Express',
    'TypeScript',
    'SCSS',
    'RxJS',
    'Node.js',
  ];

  readonly blocks: AboutBlock[] = [
    {
      eyebrow: '01 / О ПРОЕКТЕ',
      title: 'Портфолио и лаборатория в одном продукте',
      paragraphs: [
        'Сайт совмещает две задачи: портфолио — статические страницы (главная, о проекте, обо мне, контакты) с акцентом на аккуратную вёрстку и интерактивные детали интерфейса; THE.LAB — витрина UI-экспериментов, где каждый эффект это отдельный демо-стенд с живым эффектом, «паспортом» технологий, оценкой сложности, просмотром исходного кода и интерактивной debug-панелью.',
        'Ключевая идея лаборатории — показать, что богатые интерактивные эффекты (притяжение к курсору, parallax, кинетическая типографика, генеративные фоны и т.д.) достижимы без тяжёлых сторонних библиотек: только CSS-переменные, transform, requestAnimationFrame, Pointer Events, IntersectionObserver и ResizeObserver.',
      ],
    },
    {
      eyebrow: '02 / ОСОБЕННОСТИ',
      title: 'THE.LAB и инженерная инфраструктура',
      paragraphs: [
        'THE.LAB — 50+ экспериментов в 8 активных категориях (плюс 2 запланированных): cursor — эффекты на движение мыши; scroll — parallax, timeline, pinned/sticky-сцены; hover — tilt/lift/flip карточки, glow border, image reveal; navigation — morph menu, floating dock, radial-навигация; components — accordion, modal, tabs, tooltip; layout — живые сетки, split-screen, resizable-панели; backgrounds — noise, gradient mesh, particles; typography — variable fonts, mouse distortion, animated headlines. Категории physics и experimental — в планах.',
        'Паспорт эксперимента — бейджи о технологиях (CSS Only, JavaScript, requestAnimationFrame, CSS Variables, SVG, clip-path, mask, IntersectionObserver, ResizeObserver, Pointer Events, No Libraries) и уровень сложности от Easy до Hard.',
        'Исходник каждого эксперимента доступен на странице демо с копированием в буфер обмена; исходники синхронизируются в ассеты скриптом sync:lab-sources. Debug-панель — слайдеры параметров эффекта и монитор в реальном времени: FPS, координаты курсора, значения CSS-переменных.',
        'Server-Side Rendering и пререндер через @angular/ssr и Express, с client hydration для быстрой первой отрисовки и корректной индексации. SEO — динамические title/description/Open Graph на каждую страницу, автогенерация sitemap.xml, robots.txt. Компоненты экспериментов подгружаются лениво через loadComponent. Standalone-компоненты без NgModule; состояние в основном на Angular Signals (signal/input), RxJS используется точечно — например, обработка событий роутера. Старые URL (*.html, lab-magnetic-button и т.п.) редиректят на актуальные маршруты.',
      ],
      tags: ['cursor', 'scroll', 'hover', 'navigation', 'components', 'layout', 'backgrounds', 'typography'],
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
    {
      eyebrow: '04 / ТЕХНОЛОГИИ',
      title: 'Стек проекта',
      paragraphs: [
        'Angular 17.3 со standalone-компонентами и Signals; SSR и prerender через @angular/ssr и @angular/platform-server; Express 4 как сервер; TypeScript 5.4, SCSS; состояние в основном на Angular Signals, RxJS 7.8 — точечно (навигация); embla-carousel для карусели; Karma и Jasmine — минимальное покрытие; Node.js и zone.js в runtime.',
      ],
      tags: this.siteTech,
    },
    {
      eyebrow: '05 / СТРУКТУРА',
      title: 'Организация репозитория',
      paragraphs: [
        'Код разделён на инфраструктуру (core), переиспользуемые компоненты (shared), layout, feature-модули (home, about, projects, contact, lab) и серверные скрипты для SSR, синхронизации исходников и генерации sitemap.',
      ],
      code: `src/
├── app/
│   ├── core/                 # Инфраструктура: конфиги, сервисы, утилиты
│   │   ├── config/           # site-pages, navigation
│   │   ├── services/         # page-meta (SEO), mouse-tracker
│   │   └── utils/
│   ├── shared/               # Переиспользуемые компоненты и директивы
│   │   ├── components/       # layout, button, toggle, breadcrumbs, pointer и др.
│   │   └── directives/       # reveal-on-scroll
│   ├── layout/               # header, footer
│   ├── features/
│   │   ├── home/             # Главная (hero, ambient canvas)
│   │   ├── about/            # Обо мне
│   │   ├── projects/         # О проекте
│   │   ├── contact/          # Контакты
│   │   └── lab/              # THE.LAB
│   │       ├── data/         # experiments.ts, experiment-loaders.ts
│   │       ├── models/       # Experiment, LabCategory, PageMeta
│   │       ├── components/   # Карточки, галерея, debug-панель, code-view
│   │       ├── shell/        # Layout демо-стендов
│   │       └── experiments/  # Компоненты эффектов по категориям
│   ├── app.routes.ts
│   ├── app.config.ts
│   └── app.component.ts
├── assets/, fonts/, img/, files/
├── index.html
├── main.ts / main.server.ts
├── robots.txt / sitemap.xml
└── styles.scss
scripts/
├── sync-lab-sources.js
└── generate-sitemap.js
server.ts`,
    },
  ];

  constructor() {
    const page = getSitePage('projects');
    if (page) this.pageMeta.setPageMeta(page);
  }
}
