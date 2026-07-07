import { PageMeta } from '../../features/lab/models/experiment.model';

export interface SitePageConfig extends PageMeta {
  path: string;
  label: string;
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
    label: 'Projects',
    title: 'Projects — Solov.dev',
    description: 'Подборка проектов и кейсов: от прототипов до production-ready интерфейсов.',
  },
  lab: {
    path: 'lab',
    label: 'Lab',
    title: 'THE.LAB — Инженерия за пикселями',
    description: 'Лаборатория интерактивных экспериментов: cursor, scroll, hover и другие эффекты на чистом CSS и JavaScript.',
  },
  about: {
    path: 'about',
    label: 'About',
    title: 'About — Solov.dev',
    description: 'Опыт, подход к разработке и инженерные принципы.',
  },
  contact: {
    path: 'contact',
    label: 'Contact',
    title: 'Contact — Solov.dev',
    description: 'Связаться для сотрудничества, консультаций или обсуждения проекта.',
  },
};

export function getSitePage(key: string): SitePageConfig | null {
  return SITE_PAGES[key] ?? null;
}
