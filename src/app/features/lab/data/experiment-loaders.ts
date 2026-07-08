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
};

export function buildExperimentRoutes(): Routes {
  return getReadyExperiments().map((experiment) => ({
    path: `${experiment.category}/${experiment.slug}`,
    loadComponent: loaders[experiment.slug],
    data: { experimentSlug: experiment.slug, pageKey: 'lab-experiment' },
  }));
}
