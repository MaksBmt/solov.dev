export const categories = [
  {
    slug: 'cursor',
    title: 'Cursor',
    description: 'Всё, что реагирует на движение мыши: притяжение, свет, жидкие формы.',
    status: 'ready',
  },
  {
    slug: 'scroll',
    title: 'Scroll',
    description: 'Эффекты, управляемые прокруткой: parallax, sticky-сцены, reveal.',
    status: 'soon',
  },
  {
    slug: 'hover',
    title: 'Hover',
    description: 'Микро-взаимодействия при наведении.',
    status: 'soon',
  },
  {
    slug: 'navigation',
    title: 'Navigation',
    description: 'Меню, переходы между страницами и состояниями.',
    status: 'soon',
  },
  {
    slug: 'components',
    title: 'Components',
    description: 'Интерактивные UI-компоненты: слайдеры, аккордеоны, тултипы.',
    status: 'soon',
  },
  {
    slug: 'layout',
    title: 'Layout',
    description: 'Живые сетки и композиция.',
    status: 'soon',
  },
  {
    slug: 'backgrounds',
    title: 'Backgrounds',
    description: 'Генеративные и реагирующие фоны.',
    status: 'soon',
  },
  {
    slug: 'physics',
    title: 'Physics',
    description: 'Пружины, инерция, простые симуляции.',
    status: 'soon',
  },
  {
    slug: 'typography',
    title: 'Typography',
    description: 'Кинетическая типографика.',
    status: 'soon',
  },
  {
    slug: 'experimental',
    title: 'Experimental',
    description: 'Полигон для странных идей.',
    status: 'soon',
  },
];

export const experiments = [
  {
    slug: 'magnetic-button',
    title: 'Magnetic Button',
    category: 'cursor',
    difficulty: 2,
    tech: ['CSS Variables', 'transform', 'requestAnimationFrame', 'Pointer Events'],
    passport: {
      cssOnly: false,
      js: true,
      raf: true,
      cssVars: true,
      svg: false,
      clipPath: false,
      mask: false,
      intersectionObserver: false,
      resizeObserver: false,
      pointerEvents: true,
      noLibraries: true,
    },
    description:
      'Кнопка «прилипает» к курсору: в радиусе действия элемент плавно тянется за указателем '
      + 'и возвращается на место через линейную интерполяцию. Смещение живёт в CSS-переменных, '
      + 'анимация — один цикл requestAnimationFrame.',
    status: 'ready',
    sourceFile: 'magnetic-button.component.ts',
    debugControls: [
      {
        id: 'lerp',
        label: 'Smoothing (LERP)',
        description: 'Скорость догоняния курсора. Меньше — «вязкая» резина, больше — резкий рывок. Водите мышь над кнопками, чтобы почувствовать разницу.',
        type: 'range',
        min: 0.05,
        max: 0.4,
        step: 0.01,
        default: 0.16,
        codeKey: 'LERP_FACTOR',
      },
      {
        id: 'radius',
        label: 'Magnetic radius',
        description: 'Радиус поля притяжения (px). В Debug на сцене — пунктирный круг вокруг каждой кнопки. Увеличьте до 250 — кнопки начнут реагировать издалека.',
        type: 'range',
        min: 80,
        max: 250,
        step: 5,
        default: 170,
        bind: 'data-radius',
      },
      {
        id: 'strength',
        label: 'Pull strength',
        description: 'Сила смещения к курсору (0.1…0.9). На максимуме кнопка сильнее «тянется» к указателю внутри поля.',
        type: 'range',
        min: 0.1,
        max: 0.9,
        step: 0.05,
        default: 0.5,
        bind: 'data-strength',
      },
    ],
    debugMonitor: [
      { id: 'fps', label: 'FPS', type: 'fps' },
      { id: 'pointer', label: 'Cursor in scene (x : y)', type: 'pointer' },
      { id: '--mx', label: 'Offset X (--mx) · major btn', type: 'cssVar' },
      { id: '--my', label: 'Offset Y (--my) · major btn', type: 'cssVar' },
    ],
    debugLegend: '○ поле притяжения (radius) · → вектор смещения · + позиция курсора. Двигайте слайдеры и водите мышь над кнопками.',
  },
  {
    slug: 'spotlight',
    title: 'Spotlight',
    category: 'cursor',
    difficulty: 3,
    tech: ['CSS Variables', 'clip-path', 'Pointer Events', 'requestAnimationFrame'],
    passport: {
      cssOnly: false,
      js: true,
      raf: true,
      cssVars: true,
      svg: false,
      clipPath: true,
      mask: false,
      intersectionObserver: false,
      resizeObserver: false,
      pointerEvents: true,
      noLibraries: true,
    },
    description:
      'Фонарик через clip-path: контент скрыт в темноте, круглое пятно света следует за курсором '
      + 'с инерцией. Координаты и радиус луча — CSS-переменные --sx / --sy / --sr, видны в Debug-режиме.',
    status: 'ready',
    sourceFile: 'spotlight.component.ts',
    debugControls: [
      {
        id: 'positionLerp',
        label: 'Follow speed (POSITION_LERP)',
        description: 'Скорость следования центра маски за курсором. Меньше — фонарик «отстаёт» и плывёт плавно, больше — луч жёстко прилипает к указателю.',
        type: 'range',
        min: 0.05,
        max: 0.35,
        step: 0.01,
        default: 0.12,
        codeKey: 'POSITION_LERP',
      },
      {
        id: 'activeRadius',
        label: 'Beam radius (ACTIVE_RADIUS)',
        description: 'Радиус пятна света в пикселях. Увеличьте до 350 — осветится большая область; уменьшите до 100 — узкий луч «фонарика».',
        type: 'range',
        min: 100,
        max: 350,
        step: 10,
        default: 220,
        codeKey: 'ACTIVE_RADIUS',
      },
      {
        id: 'radiusLerp',
        label: 'Fade speed (RADIUS_LERP)',
        description: 'Скорость появления и затухания луча, когда курсор входит или покидает сцену. Меньше — медленное «зажигание», больше — резкое вспыхивание.',
        type: 'range',
        min: 0.03,
        max: 0.2,
        step: 0.01,
        default: 0.08,
        codeKey: 'RADIUS_LERP',
      },
    ],
    debugMonitor: [
      { id: 'fps', label: 'FPS', type: 'fps' },
      { id: 'pointer', label: 'Cursor in scene (x : y)', type: 'pointer' },
      { id: '--sx', label: 'Mask center X (--sx)', type: 'cssVar' },
      { id: '--sy', label: 'Mask center Y (--sy)', type: 'cssVar' },
      { id: '--sr', label: 'Beam radius (--sr)', type: 'cssVar' },
    ],
    debugLegend: '○ граница маски · внутреннее кольцо = зона полной видимости · линия к + = отставание от курсора. Двигайте мышь по сцене.',
  },
  {
    slug: 'liquid-cursor',
    title: 'Liquid Cursor',
    category: 'cursor',
    difficulty: 5,
    tech: ['SVG Filters', 'DOM', 'transform', 'Pointer Events', 'requestAnimationFrame'],
    passport: {
      cssOnly: false,
      js: true,
      raf: true,
      cssVars: false,
      svg: true,
      clipPath: false,
      mask: false,
      intersectionObserver: false,
      resizeObserver: false,
      pointerEvents: true,
      noLibraries: true,
    },
    description:
      'Жидкий курсор: цепочка частиц с покадровой интерполяцией сливается в каплю через '
      + 'SVG-фильтр (feGaussianBlur + feColorMatrix). Классический gooey-эффект — без Canvas и WebGL.',
    status: 'ready',
    sourceFile: 'liquid-cursor.component.ts',
    debugControls: [
      {
        id: 'headLerp',
        label: 'Head follow (HEAD_LERP)',
        description: 'Скорость, с которой «голова» капли догоняет курсор. Меньше — капля отстаёт и тянется; больше — почти без инерции.',
        type: 'range',
        min: 0.1,
        max: 0.6,
        step: 0.01,
        default: 0.35,
        codeKey: 'HEAD_LERP',
      },
      {
        id: 'tailLerp',
        label: 'Tail follow (TAIL_LERP)',
        description: 'Скорость следования хвоста за предыдущей частицей. Меньше — длинный вязкий шлейф; больше — короткий плотный хвост.',
        type: 'range',
        min: 0.1,
        max: 0.6,
        step: 0.01,
        default: 0.32,
        codeKey: 'TAIL_LERP',
      },
      {
        id: 'blur',
        label: 'Goo blur (stdDeviation)',
        description: 'Размытие SVG-фильтра feGaussianBlur. Меньше — отдельные шарики; больше — сильнее «склеивание» в одну жидкую каплю (gooey).',
        type: 'range',
        min: 4,
        max: 24,
        step: 1,
        default: 12,
        bind: 'feGaussianBlur',
      },
    ],
    debugMonitor: [
      { id: 'fps', label: 'FPS', type: 'fps' },
      { id: 'pointer', label: 'Cursor in scene (x : y)', type: 'pointer' },
      { id: '--lx', label: 'Head X (--lx)', type: 'cssVar' },
      { id: '--ly', label: 'Head Y (--ly)', type: 'cssVar' },
    ],
    debugLegend: 'линия = цепочка интерполяции · ○ = частицы · + = курсор. Двигайте мышь и крутите blur для gooey-эффекта.',
  },
  {
    slug: 'cursor-trails',
    title: 'Cursor Trails',
    category: 'cursor',
    difficulty: 3,
    tech: ['Canvas 2D', 'requestAnimationFrame', 'Pointer Events'],
    passport: {
      cssOnly: false,
      js: true,
      raf: true,
      cssVars: true,
      svg: false,
      clipPath: false,
      mask: false,
      intersectionObserver: false,
      resizeObserver: true,
      pointerEvents: true,
      noLibraries: true,
    },
    description:
      'Затухающий шлейф из частиц вслед за курсором: Canvas 2D, '
      + 'destination-out для плавного fade и пул частиц с убывающей life.',
    status: 'ready',
    sourceFile: 'cursor-trails.component.ts',
    debugControls: [
      {
        id: 'trailFade',
        label: 'Canvas fade (TRAIL_FADE)',
        description: 'Скорость «стирания» холста каждый кадр. Меньше — длинный шлейф, больше — короткий след.',
        type: 'range',
        min: 0.02,
        max: 0.18,
        step: 0.01,
        default: 0.045,
        codeKey: 'TRAIL_FADE',
      },
      {
        id: 'particleSize',
        label: 'Particle size (PARTICLE_SIZE)',
        description: 'Базовый размер частиц (px). Увеличьте до 14 — более жирный шлейф.',
        type: 'range',
        min: 2,
        max: 14,
        step: 1,
        default: 4,
        codeKey: 'PARTICLE_SIZE',
      },
      {
        id: 'spawnGap',
        label: 'Spawn gap (SPAWN_GAP)',
        description: 'Шаг между частицами по траектории (px). Меньше — плотнее шлейф, больше — редкие мягкие точки.',
        type: 'range',
        min: 2,
        max: 20,
        step: 1,
        default: 5,
        codeKey: 'SPAWN_GAP',
      },
      {
        id: 'lifeDecay',
        label: 'Life decay (LIFE_DECAY)',
        description: 'Скорость затухания life у частиц. Меньше — дольше живут, больше — быстрее исчезают.',
        type: 'range',
        min: 0.008,
        max: 0.05,
        step: 0.002,
        default: 0.016,
        codeKey: 'LIFE_DECAY',
      },
    ],
    debugMonitor: [
      { id: 'fps', label: 'FPS', type: 'fps' },
      { id: 'pointer', label: 'Cursor in scene (x : y)', type: 'pointer' },
      { id: '--particles', label: 'Active particles (--particles)', type: 'cssVar' },
    ],
    debugLegend: '○ = радиус spawn gap вокруг курсора · пунктир = каждая 3-я частица. Двигайте мышь по сцене.',
  },
  {
    slug: 'cursor-blob',
    title: 'Cursor Blob',
    category: 'cursor',
    difficulty: 4,
    tech: ['SVG', 'path interpolation', 'requestAnimationFrame', 'Pointer Events'],
    passport: {
      cssOnly: false,
      js: true,
      raf: true,
      cssVars: true,
      svg: true,
      clipPath: false,
      mask: false,
      intersectionObserver: false,
      resizeObserver: false,
      pointerEvents: true,
      noLibraries: true,
    },
    description:
      'Аморфная SVG-капля: центр догоняет курсор, скорость движения растягивает '
      + 'якорные точки контура. Замкнутый path собирается кубическими Безье между точками.',
    status: 'ready',
    sourceFile: 'cursor-blob.component.ts',
    debugControls: [
      {
        id: 'positionLerp',
        label: 'Follow speed (POSITION_LERP)',
        description: 'Скорость, с которой центр капли догоняет курсор. Меньше — капля «плывёт» с инерцией, больше — жёстко прилипает к указателю.',
        type: 'range',
        min: 0.08,
        max: 0.5,
        step: 0.01,
        default: 0.38,
        codeKey: 'POSITION_LERP',
      },
      {
        id: 'stretch',
        label: 'Deform strength (STRETCH)',
        description: 'Насколько сильно скорость вытягивает каплю в «комету». Увеличьте до 2.5 — максимальный хвост при резких движениях.',
        type: 'range',
        min: 0.3,
        max: 2.5,
        step: 0.05,
        default: 1.35,
        codeKey: 'STRETCH',
      },
      {
        id: 'baseRadius',
        label: 'Base radius (BASE_RADIUS)',
        description: 'Базовый радиус капли в покое (px). В Debug — пунктирный круг вокруг центра.',
        type: 'range',
        min: 20,
        max: 56,
        step: 2,
        default: 34,
        codeKey: 'BASE_RADIUS',
      },
      {
        id: 'velocityLerp',
        label: 'Velocity smoothing (VELOCITY_LERP)',
        description: 'Сглаживание скорости курсора между кадрами. Меньше — деформация «дёргается», больше — плавное, но запаздывающее растягивание.',
        type: 'range',
        min: 0.05,
        max: 0.5,
        step: 0.01,
        default: 0.28,
        codeKey: 'VELOCITY_LERP',
      },
    ],
    debugMonitor: [
      { id: 'fps', label: 'FPS', type: 'fps' },
      { id: 'pointer', label: 'Cursor in scene (x : y)', type: 'pointer' },
      { id: '--bx', label: 'Blob center X (--bx)', type: 'cssVar' },
      { id: '--by', label: 'Blob center Y (--by)', type: 'cssVar' },
    ],
    debugLegend: '○ базовый радиус · лучи = якорные точки · стрелка = velocity. Быстро двигайте мышь по сцене.',
  },
  {
    slug: 'cursor-distortion',
    title: 'Cursor Distortion',
    category: 'cursor',
    difficulty: 5,
    tech: ['SVG Filters', 'feDisplacementMap', 'requestAnimationFrame'],
    passport: null,
    description: 'Искажение контента вокруг указателя через displacement map.',
    status: 'soon',
  },
  {
    slug: 'interactive-grid',
    title: 'Interactive Grid',
    category: 'cursor',
    difficulty: 4,
    tech: ['CSS Grid', 'CSS Variables', 'requestAnimationFrame'],
    passport: null,
    description: 'Сетка ячеек, реагирующая волной на движение мыши.',
    status: 'soon',
  },
];

export const passportLabels = {
  cssOnly: 'CSS Only',
  js: 'JavaScript',
  raf: 'requestAnimationFrame',
  cssVars: 'CSS Variables',
  svg: 'SVG',
  clipPath: 'clip-path',
  mask: 'mask',
  intersectionObserver: 'IntersectionObserver',
  resizeObserver: 'ResizeObserver',
  pointerEvents: 'Pointer Events',
  noLibraries: 'No Libraries',
};

export function difficultyLabel(level: number) {
  if (level <= 2) return 'Easy';
  if (level === 3) return 'Medium';
  if (level === 4) return 'Advanced';
  return 'Hard';
}

export function difficultyStars(level: number) {
  return '★'.repeat(level) + '☆'.repeat(5 - level);
}

export function getExperiment(slug: string) {
  return experiments.find((item) => item.slug === slug) || null;
}

export function getExperimentsByCategory(categorySlug: string) {
  return experiments.filter((item) => item.category === categorySlug);
}


export function getCategory(slug: string) {
  return categories.find((item) => item.slug === slug) || null;
}

export function getExperimentRoute(slug: string): string[] {
  const experiment = getExperiment(slug);
  if (!experiment) return ['/lab'];
  return ['/lab', experiment.category, experiment.slug];
}

export function getReadyExperiments() {
  return experiments.filter((item) => item.status === 'ready');
}
