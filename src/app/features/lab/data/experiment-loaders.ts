import { Routes } from '@angular/router';
import { getReadyExperiments } from './experiments';

const loaders: Record<string, () => Promise<any>> = {
  'magnetic-button': () =>
    import('../experiments/cursor/magnetic-button/magnetic-button.component').then((m) => m.MagneticButtonComponent),
  spotlight: () =>
    import('../experiments/cursor/spotlight/spotlight.component').then((m) => m.SpotlightComponent),
  'liquid-cursor': () =>
    import('../experiments/cursor/liquid-cursor/liquid-cursor.component').then((m) => m.LiquidCursorComponent),
  'cursor-blob': () =>
    import('../experiments/cursor/cursor-blob/cursor-blob.component').then((m) => m.CursorBlobComponent),
  'cursor-trails': () =>
    import('../experiments/cursor/cursor-trails/cursor-trails.component').then((m) => m.CursorTrailsComponent),
  'cursor-distortion': () =>
    import('../experiments/cursor/cursor-distortion/cursor-distortion.component').then((m) => m.CursorDistortionComponent),
  'interactive-grid': () =>
    import('../experiments/cursor/interactive-grid/interactive-grid.component').then((m) => m.InteractiveGridComponent),
  'stack-cards': () =>
    import('../experiments/scroll/stack-cards/stack-cards.component').then((m) => m.StackCardsComponent),
  parallax: () =>
    import('../experiments/scroll/parallax/parallax.component').then((m) => m.ParallaxComponent),
  'scroll-reveal': () =>
    import('../experiments/scroll/scroll-reveal/scroll-reveal.component').then((m) => m.ScrollRevealComponent),
};

function getExperimentLoader(slug: string) {
  return loaders[slug];
}

export function buildExperimentRoutes(): Routes {
  return getReadyExperiments().flatMap((experiment) => {
    const loadComponent = getExperimentLoader(experiment.slug);

    if (!loadComponent) {
      console.error(`[lab] Missing loadComponent for ready experiment "${experiment.slug}"`);
      return [];
    }

    return [{
      path: `${experiment.category}/${experiment.slug}`,
      loadComponent,
      data: { experimentSlug: experiment.slug, pageKey: 'lab-experiment' },
    }];
  });
}
