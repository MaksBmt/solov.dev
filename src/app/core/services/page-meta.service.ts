import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { isPlatformBrowser } from '@angular/common';
import { PageMeta } from '../../features/lab/models/experiment.model';

const DEFAULT_TITLE = 'Solov.dev';
const DEFAULT_DESCRIPTION = 'Портфолио frontend-инженера: интерактивные интерфейсы, чистый CSS и JavaScript.';

@Injectable({ providedIn: 'root' })
export class PageMetaService {
  constructor(
    private title: Title,
    private meta: Meta,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  setPageMeta(meta: PageMeta): void {
    const title = meta.title || DEFAULT_TITLE;
    const description = meta.description || DEFAULT_DESCRIPTION;

    this.title.setTitle(title);
    this.meta.updateTag({ name: 'description', content: description });
    this.meta.updateTag({ property: 'og:title', content: title });
    this.meta.updateTag({ property: 'og:description', content: description });

    if (meta.ogImage) {
      this.meta.updateTag({ property: 'og:image', content: meta.ogImage });
    }

    if (isPlatformBrowser(this.platformId)) {
      document.documentElement.lang = 'ru';
    }
  }

  setExperimentMeta(title: string, description: string, categoryTitle: string): void {
    this.setPageMeta({
      title: `${title} — ${categoryTitle} · THE.LAB`,
      description,
    });
  }
}
