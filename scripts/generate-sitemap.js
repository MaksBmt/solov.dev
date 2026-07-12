#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const EXPERIMENTS_FILE = path.join(ROOT, 'src/app/features/lab/data/experiments.ts');
const SITEMAP_FILE = path.join(ROOT, 'src/sitemap.xml');
const SITE_URL = 'https://solov.dev';

const STATIC_PAGES = [
  { loc: '/', changefreq: 'weekly', priority: '1.0' },
  { loc: '/projects', changefreq: 'monthly', priority: '0.8' },
  { loc: '/about', changefreq: 'monthly', priority: '0.8' },
  { loc: '/contact', changefreq: 'monthly', priority: '0.7' },
  { loc: '/lab', changefreq: 'weekly', priority: '0.9' },
];

function parseCategories(content) {
  const section = content.match(/export const categories = \[([\s\S]*?)\];/);
  if (!section) return [];

  const items = [];
  let current = {};

  for (const line of section[1].split('\n')) {
    const slugMatch = line.match(/^\s*slug:\s*'([^']+)'/);
    if (slugMatch) current.slug = slugMatch[1];

    const statusMatch = line.match(/^\s*status:\s*'([^']+)'/);
    if (statusMatch) current.status = statusMatch[1];

    if (line.trim() === '},' || line.trim() === '}') {
      if (current.slug) items.push({ ...current });
      current = {};
    }
  }

  return items.filter((item) => item.status === 'ready');
}

function parseExperiments(content) {
  const marker = 'export const experiments = [';
  const endMarker = '];\n\nexport const passportLabels';
  const start = content.indexOf(marker);
  const end = content.indexOf(endMarker, start);

  if (start === -1 || end === -1) return [];

  const section = content.slice(start + marker.length, end);
  const items = [];

  for (const block of section.split(/\n  \},\n/)) {
    const slug = block.match(/^\s*\{\s*\n\s*slug:\s*'([^']+)'/m)?.[1]
      || block.match(/slug:\s*'([^']+)'/)?.[1];
    const category = block.match(/category:\s*'([^']+)'/)?.[1];
    const status = block.match(/status:\s*'([^']+)'/)?.[1];

    if (slug && category && status === 'ready') {
      items.push({ slug, category, status });
    }
  }

  return items;
}

function escapeXml(value) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function urlEntry({ loc, changefreq, priority, lastmod }) {
  const lines = [
    '  <url>',
    `    <loc>${escapeXml(loc)}</loc>`,
  ];

  if (lastmod) lines.push(`    <lastmod>${lastmod}</lastmod>`);
  if (changefreq) lines.push(`    <changefreq>${changefreq}</changefreq>`);
  if (priority) lines.push(`    <priority>${priority}</priority>`);

  lines.push('  </url>');
  return lines.join('\n');
}

function buildSitemap(entries) {
  const body = entries.map((entry) => urlEntry(entry)).join('\n');

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    body,
    '</urlset>',
    '',
  ].join('\n');
}

function main() {
  if (!fs.existsSync(EXPERIMENTS_FILE)) {
    console.error('[generate:sitemap] ERROR: ' + EXPERIMENTS_FILE + ' not found');
    process.exit(1);
  }

  const content = fs.readFileSync(EXPERIMENTS_FILE, 'utf8');
  const categories = parseCategories(content);
  const experiments = parseExperiments(content);
  const lastmod = new Date().toISOString().slice(0, 10);

  const entries = [
    ...STATIC_PAGES.map((page) => ({
      loc: SITE_URL + page.loc,
      changefreq: page.changefreq,
      priority: page.priority,
      lastmod,
    })),
    ...categories.map((category) => ({
      loc: `${SITE_URL}/lab/${category.slug}`,
      changefreq: 'monthly',
      priority: '0.7',
      lastmod,
    })),
    ...experiments.map((experiment) => ({
      loc: `${SITE_URL}/lab/${experiment.category}/${experiment.slug}`,
      changefreq: 'monthly',
      priority: '0.6',
      lastmod,
    })),
  ];

  fs.writeFileSync(SITEMAP_FILE, buildSitemap(entries), 'utf8');
  console.log(`[generate:sitemap] Done. ${entries.length} URL(s) written to src/sitemap.xml`);
}

main();
