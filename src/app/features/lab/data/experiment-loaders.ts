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
  timeline: () =>
    import('../experiments/scroll/timeline/timeline.component').then((m) => m.TimelineComponent),
  'morph-sections': () =>
    import('../experiments/scroll/morph-sections/morph-sections.component').then((m) => m.MorphSectionsComponent),
  'horizontal-scroll': () =>
    import('../experiments/scroll/horizontal-scroll/horizontal-scroll.component').then((m) => m.HorizontalScrollComponent),
  'pinned-elements': () =>
    import('../experiments/scroll/pinned-elements/pinned-elements.component').then((m) => m.PinnedElementsComponent),
  'tilt-card': () =>
    import('../experiments/hover/tilt-card/tilt-card.component').then((m) => m.TiltCardComponent),
  'lift-card': () =>
    import('../experiments/hover/lift-card/lift-card.component').then((m) => m.LiftCardComponent),
  'glow-border': () =>
    import('../experiments/hover/glow-border/glow-border.component').then((m) => m.GlowBorderComponent),
  'underline-reveal': () =>
    import('../experiments/hover/underline-reveal/underline-reveal.component').then((m) => m.UnderlineRevealComponent),
  'image-reveal': () =>
    import('../experiments/hover/image-reveal/image-reveal.component').then((m) => m.ImageRevealComponent),
  'shine-sweep': () =>
    import('../experiments/hover/shine-sweep/shine-sweep.component').then((m) => m.ShineSweepComponent),
  'flip-card': () =>
    import('../experiments/hover/flip-card/flip-card.component').then((m) => m.FlipCardComponent),
  'morph-menu': () =>
    import('../experiments/navigation/morph-menu/morph-menu.component').then((m) => m.MorphMenuComponent),
  'animated-burger': () =>
    import('../experiments/navigation/animated-burger/animated-burger.component').then((m) => m.AnimatedBurgerComponent),
  'floating-dock': () =>
    import('../experiments/navigation/floating-dock/floating-dock.component').then((m) => m.FloatingDockComponent),
  'radial-menu': () =>
    import('../experiments/navigation/radial-menu/radial-menu.component').then((m) => m.RadialMenuComponent),
  'circular-navigation': () =>
    import('../experiments/navigation/circular-navigation/circular-navigation.component').then((m) => m.CircularNavigationComponent),
  'elastic-navigation': () =>
    import('../experiments/navigation/elastic-navigation/elastic-navigation.component').then((m) => m.ElasticNavigationComponent),
  accordion: () =>
    import('../experiments/components/accordion/accordion.component').then((m) => m.AccordionComponent),
  modal: () =>
    import('../experiments/components/modal/modal.component').then((m) => m.ModalComponent),
  tabs: () =>
    import('../experiments/components/tabs/tabs.component').then((m) => m.TabsComponent),
  tooltip: () =>
    import('../experiments/components/tooltip/tooltip.component').then((m) => m.TooltipComponent),
  dropdown: () =>
    import('../experiments/components/dropdown/dropdown.component').then((m) => m.DropdownComponent),
  toast: () =>
    import('../experiments/components/toast/toast.component').then((m) => m.ToastComponent),
  'context-menu': () =>
    import('../experiments/components/context-menu/context-menu.component').then((m) => m.ContextMenuComponent),
  'dynamic-grid': () =>
    import('../experiments/layout/dynamic-grid/dynamic-grid.component').then((m) => m.DynamicGridComponent),
  'split-screen': () =>
    import('../experiments/layout/split-screen/split-screen.component').then((m) => m.SplitScreenComponent),
  'resizable-panels': () =>
    import('../experiments/layout/resizable-panels/resizable-panels.component').then((m) => m.ResizablePanelsComponent),
  'infinite-sections': () =>
    import('../experiments/layout/infinite-sections/infinite-sections.component').then((m) => m.InfiniteSectionsComponent),
  'responsive-tricks': () =>
    import('../experiments/layout/responsive-tricks/responsive-tricks.component').then((m) => m.ResponsiveTricksComponent),
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
