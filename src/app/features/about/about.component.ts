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
  selector: 'app-about',
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
  templateUrl: './about.component.html',
})
export class AboutComponent {
  private readonly pageMeta = inject(PageMetaService);

  readonly breadcrumbs = getSitePageBreadcrumbs('about');

  readonly blocks: AboutBlock[] = [
    {
      eyebrow: '01 / ВЁРСТКА',
      title: 'HTML, CSS и адаптив',
      paragraphs: [
        'Вёрстка — база, с которой начинался путь и которая остаётся ежедневной работой. Семантическая разметка, предсказуемая структура блоков, аккуратная типографика и стабильное поведение в разных браузерах.',
        'Стили собираю на SCSS: переменные, миксины, модульная организация. Flexbox и Grid — для сеток и сложных раскладок, media queries — для адаптива. Умею работать по макетам и доводить интерфейс до состояния, когда он не «ломается» на реальных экранах.',
        'Отдельно — анимации и «живая» графика: CSS transitions и keyframes, SVG в разметке и как иллюстрации, Canvas для фонов и интерактивных сцен. Понимаю, где хватит чистого CSS, а где нужен JavaScript — и как не перегрузить интерфейс лишним движением.',
      ],
      tags: ['HTML5', 'CSS3', 'SCSS', 'Flexbox', 'Grid', 'CSS Animations', 'SVG', 'Canvas'],
    },
    {
      eyebrow: '02 / СБОРКА',
      title: 'Webpack, Vite и окружение',
      paragraphs: [
        'Под конкретные проекты настраиваю сборку: dev-сервер, production-билд, работа со статикой и ассетами. Использовал Webpack и Vite — выбор зависит от задачи, возраста проекта и того, что уже принято в команде.',
        'Понимаю, как frontend встраивается в общий процесс: npm-скрипты, окружения, базовая оптимизация бандла. Это не «написал компонент и забыл», а нормальный рабочий цикл — от локальной разработки до выкладки.',
      ],
      tags: ['Webpack', 'Vite', 'npm', 'Git'],
    },
    {
      eyebrow: '03 / JAVASCRIPT',
      title: 'Нативный JS и TypeScript',
      paragraphs: [
        'JavaScript — основной инструмент для логики интерфейса: DOM, события, формы, асинхронность, работа с API. Предпочитаю понимать, что происходит под капотом, а не только подключать готовые обёртки.',
        'TypeScript использую там, где проект это оправдывает: типизация контрактов, меньше ошибок на этапе разработки, проще сопровождать код в команде. ES-модули, современный синтаксис — без привязки к конкретному фреймворку.',
      ],
      tags: ['JavaScript', 'TypeScript', 'ES6+', 'DOM API', 'Fetch'],
    },
    {
      eyebrow: '04 / VUE',
      title: 'Vue 2 и Vue 3',
      paragraphs: [
        'Имею практический опыт с Vue: работал и со второй, и с третьей версией. Знаком с обоими API — Options и Composition — и понимаю, когда какой подход уместен.',
        'Компонентный подход, реактивность, маршрутизация, работа с состоянием — это уже пройденный этап, а не теория из документации. Могу подключиться к существующему Vue-проекту и быстро войти в контекст.',
      ],
      tags: ['Vue 2', 'Vue 3', 'Composition API', 'Options API', 'Vue Router'],
    },
    {
      eyebrow: '05 / ANGULAR',
      title: 'Angular на практике',
      paragraphs: [
        'С Angular знаком и активно в нём развиваюсь — этот сайт как раз собран на Angular 17: standalone-компоненты, SSR, ленивые маршруты, Signals. Для меня это не «попробовал в туториале», а рабочий стек, который я осваиваю на реальном проекте.',
        'Понимаю структуру Angular-приложения, DI, роутинг, работу с формами и сервисами.',
      ],
      tags: ['Angular 17', 'Standalone', 'Signals', 'SSR', 'RxJS'],
      link: { label: 'Посмотреть проект', path: '/projects' },
    },
  ];

  constructor() {
    const page = getSitePage('about');
    if (page) this.pageMeta.setPageMeta(page);
  }
}
