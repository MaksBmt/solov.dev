import { SITE_PAGES } from './site-pages.config';

export interface NavItem {
  label: string;
  path: string;
}

export const MAIN_NAVIGATION: NavItem[] = [
  { label: SITE_PAGES['projects'].label, path: '/' + SITE_PAGES['projects'].path },
  { label: SITE_PAGES['lab'].label, path: '/' + SITE_PAGES['lab'].path },
  { label: SITE_PAGES['about'].label, path: '/' + SITE_PAGES['about'].path },
  { label: SITE_PAGES['contact'].label, path: '/' + SITE_PAGES['contact'].path },
];
