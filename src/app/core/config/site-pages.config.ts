import { PageMeta } from '../../features/lab/models/experiment.model';

export interface SitePageConfig extends PageMeta {
  path: string;
  label: string;
}

export interface BreadcrumbItem {
  label: string;
  url?: string;
}

export const SITE_PAGES: Record<string, SitePageConfig> = {
  home: {
    path: '',
    label: 'Home',
    title: 'Solov.dev — Frontend Engineer',
    description: 'Портфолио frontend-инженера: интерактивные интерфейсы, чистый CSS и JavaScript без лишних зависимостей.',
  },
  projects: {
    path: 'projects',
    label: 'О проекте',
    title: 'О проекте — Solov.dev',
    description:
      'Интерактивное портфолио frontend-инженера с лабораторией UI-экспериментов THE.LAB: 50+ эффектов на чистом CSS и JavaScript внутри Angular-приложения с SSR.',
  },
  lab: {
    path: 'lab',
    label: 'Lab',
    title: 'THE.LAB — Инженерия за пикселями',
    description: 'Лаборатория интерактивных экспериментов: cursor, scroll, hover и другие эффекты на чистом CSS и JavaScript.',
  },
  about: {
    path: 'about',
    label: 'Обо мне',
    title: 'Обо мне — Solov.dev',
    description:
      'Соловьев Максим — frontend-разработчик: вёрстка, нативный JavaScript, Vue, Angular. Опыт от HTML/CSS до сборки проектов на Webpack и Vite.',
  },
  contact: {
    path: 'contact',
    label: 'Контакт',
    title: 'Контакт — Solov.dev',
    description: 'Контакты: Telegram t.me/solov_one, email msolov.one@gmail.com.',
  },
};

export function getSitePage(key: string): SitePageConfig | null {
  return SITE_PAGES[key] ?? null;
}

export function getSitePageBreadcrumbs(pageKey: string): BreadcrumbItem[] {
  const page = SITE_PAGES[pageKey];
  if (!page) {
    return [{ label: SITE_PAGES['home'].label, url: '/' }];
  }

  return [
    { label: SITE_PAGES['home'].label, url: '/' },
    { label: page.label },
  ];
}
