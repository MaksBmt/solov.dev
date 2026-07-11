import { Experiment } from '../../lab/models/experiment.model';
import { experiments } from '../../lab/data/experiments';

export const FEATURED_EXPERIMENT_PATHS: ReadonlyArray<{ category: string; slug: string }> = [
  { category: 'cursor', slug: 'liquid-cursor' },
  { category: 'scroll', slug: 'stack-cards' },
  { category: 'scroll', slug: 'pinned-elements' },
  { category: 'navigation', slug: 'radial-menu' },
  { category: 'navigation', slug: 'elastic-navigation' },
  { category: 'components', slug: 'toast' },
  { category: 'backgrounds', slug: 'particles' },
  { category: 'typography', slug: 'variable-fonts' },
  { category: 'typography', slug: 'text-trails' },
  { category: 'typography', slug: 'letter-physics' },
];

export function getFeaturedExperiments(): Experiment[] {
  return FEATURED_EXPERIMENT_PATHS.flatMap(({ category, slug }) => {
    const experiment = experiments.find(
      (item) => item.category === category && item.slug === slug && item.status === 'ready',
    );

    return experiment ? [experiment as Experiment] : [];
  });
}
