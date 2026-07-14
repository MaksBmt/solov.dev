# Solov.dev

Интерактивное портфолио frontend-инженера **Максима Соловьёва** с лабораторией UI-экспериментов **THE.LAB** — коллекцией интерактивных эффектов на чистом CSS и нативном JavaScript, собранной внутри Angular-приложения с серверным рендерингом.

Продакшн: [solov.dev](https://solov.dev)

---

## О проекте

Сайт совмещает две задачи:

1. **Портфолио** — статические страницы (главная, о проекте, обо мне, контакты) с акцентом на аккуратную вёрстку и интерактивные детали интерфейса.
2. **THE.LAB** — витрина UI-экспериментов. Каждый эксперимент — это отдельный демо-стенд с живым эффектом, «паспортом» использованных технологий, оценкой сложности, просмотром исходного кода и интерактивной debug-панелью для настройки параметров в реальном времени.

Ключевая идея лаборатории — показать, что богатые интерактивные эффекты (притяжение к курсору, parallax, кинетическая типографика, генеративные фоны и т.д.) достижимы без тяжёлых сторонних библиотек: только CSS-переменные, `transform`, `requestAnimationFrame`, Pointer Events, `IntersectionObserver` и `ResizeObserver`.

---

## Особенности

- **THE.LAB — 50+ экспериментов в 8 активных категориях** (плюс 2 запланированных):
  - `cursor` — эффекты, реагирующие на движение мыши (magnetic button, spotlight, liquid cursor, blob, trails и др.);
  - `scroll` — эффекты, управляемые прокруткой (parallax, timeline, pinned/sticky-сцены, horizontal scroll, morph-секции);
  - `hover` — микро-взаимодействия при наведении (tilt/lift/flip карточки, glow border, image reveal, shine sweep);
  - `navigation` — меню и переходы (morph menu, animated burger, floating dock, radial/circular/elastic навигация);
  - `components` — интерактивные UI-компоненты (accordion, modal, tabs, tooltip, dropdown, toast, context menu);
  - `layout` — живые сетки, split-screen, resizable-панели, infinite sections, responsive-приёмы;
  - `backgrounds` — генеративные и реагирующие фоны (noise, gradient mesh, particles, wave, glass refraction);
  - `typography` — кинетическая типографика (variable fonts, mouse distortion, animated headlines, reveal/trails);
  - `physics` и `experimental` — в планах (`soon`).
- **Паспорт эксперимента** — набор бейджей о применённых технологиях (CSS Only, JavaScript, requestAnimationFrame, CSS Variables, SVG, clip-path, mask, IntersectionObserver, ResizeObserver, Pointer Events, No Libraries) и уровень сложности от Easy до Hard.
- **Просмотр исходного кода** — исходник компонента каждого эксперимента доступен прямо на странице демо с копированием в буфер обмена. Исходники синхронизируются в ассеты скриптом `sync:lab-sources`.
- **Интерактивная debug-панель** — слайдеры для параметров эффекта (например, сила притяжения или радиус магнита) и монитор в реальном времени: FPS, координаты курсора, значения CSS-переменных.
- **Server-Side Rendering (SSR) + пререндер** через `@angular/ssr` и Express, с client hydration для быстрой первой отрисовки и корректной индексации.
- **SEO** — динамические `title`/`description`/Open Graph-теги на каждую страницу, автогенерация `sitemap.xml` из данных экспериментов, `robots.txt`.
- **Ленивая загрузка** — компоненты экспериментов подгружаются через `loadComponent` по мере навигации.
- **Standalone-компоненты и Angular Signals** — современный подход без NgModule; состояние в основном на `signal`/`input`, RxJS используется точечно (например, обработка событий роутера).
- **Обратная совместимость URL** — старые адреса (`*.html`, `lab-magnetic-button` и т.п.) редиректят на актуальные маршруты.

---

## Технологии

| Область | Стек |
| --- | --- |
| Framework | Angular 17.3 (standalone components, Signals) |
| Рендеринг | SSR + prerender (`@angular/ssr`, `@angular/platform-server`), client hydration |
| Сервер | Express 4 |
| Язык | TypeScript 5.4 |
| Стили | SCSS |
| Состояние | в основном Angular Signals; RxJS 7.8 — точечно (навигация) |
| Карусель | embla-carousel |
| Тесты | Karma + Jasmine (минимальное покрытие) |
| Runtime | Node.js + zone.js |

---

## Структура проекта

```
src/
├── app/
│   ├── core/                 # Инфраструктура: конфиги, сервисы, утилиты
│   │   ├── config/           # site-pages, navigation
│   │   ├── services/         # page-meta (SEO), mouse-tracker
│   │   └── utils/
│   ├── shared/               # Переиспользуемые компоненты и директивы
│   │   ├── components/       # layout, button, toggle, breadcrumbs, pointer и др.
│   │   └── directives/       # reveal-on-scroll
│   ├── layout/               # header, footer
│   ├── features/
│   │   ├── home/             # Главная (hero, ambient canvas)
│   │   ├── about/            # Обо мне
│   │   ├── projects/         # О проекте
│   │   ├── contact/          # Контакты
│   │   └── lab/              # THE.LAB
│   │       ├── data/         # experiments.ts (данные), experiment-loaders.ts (lazy routes)
│   │       ├── models/       # Модели Experiment, LabCategory, PageMeta
│   │       ├── components/   # Карточки, галерея, debug-панель, code-view, паспорт
│   │       ├── shell/        # Layout демо-стендов
│   │       └── experiments/  # Компоненты эффектов по категориям
│   ├── app.routes.ts         # Маршруты верхнего уровня
│   ├── app.config.ts         # Провайдеры (router, hydration)
│   └── app.component.ts
├── assets/, fonts/, img/, files/
├── index.html
├── main.ts / main.server.ts
├── robots.txt / sitemap.xml
└── styles.scss
scripts/
├── sync-lab-sources.js       # Копирует исходники экспериментов в assets для code-view
└── generate-sitemap.js       # Генерирует sitemap.xml из данных экспериментов
server.ts                     # Express-сервер для SSR
```

---

## Быстрый старт

Требуется установленный Node.js и npm.

```bash
# Установка зависимостей
npm install

# Дев-сервер (перед запуском синхронизирует исходники экспериментов)
npm start
# → http://localhost:4200/
```

## Сборка и запуск

```bash
# Продакшн-сборка (перед сборкой генерирует sitemap.xml)
npm run build

# Запуск SSR-сервера из собранного бандла
npm run serve:ssr:solov-dev-angular
# → http://localhost:4000/
```

## Полезные скрипты

| Команда | Назначение |
| --- | --- |
| `npm start` | Синхронизация исходников лаборатории + дев-сервер |
| `npm run build` | Генерация sitemap + продакшн-сборка |
| `npm run watch` | Сборка в режиме watch (development) |
| `npm test` | Юнит-тесты через Karma/Jasmine |
| `npm run sync:lab-sources` | Копирование исходников экспериментов в `assets/lab-sources` |
| `npm run generate:sitemap` | Генерация `src/sitemap.xml` из данных экспериментов |
| `npm run serve:ssr:solov-dev-angular` | Запуск SSR-сервера |

---

## Как добавить эксперимент в THE.LAB

1. Создать компонент в `src/app/features/lab/experiments/<категория>/<slug>/`.
2. Добавить запись эксперимента в `src/app/features/lab/data/experiments.ts` (slug, title, category, difficulty, tech, passport, description, `sourceFile`, при необходимости `debugControls`/`debugMonitor`).
3. Зарегистрировать ленивый загрузчик в `src/app/features/lab/data/experiment-loaders.ts`.
4. Запустить `npm run sync:lab-sources`, чтобы исходник стал доступен в просмотрщике кода.

Маршрут, sitemap и карточки в галерее строятся автоматически на основе данных эксперимента.

---

## Контакты

- Telegram: [telegram.me/solov_one](https://telegram.me/solov_one)
- Email: msolov.one@gmail.com
