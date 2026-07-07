#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const EXPERIMENTS_FILE = path.join(ROOT, 'src/app/features/lab/data/experiments.ts');
const EXPERIMENTS_DIR = path.join(ROOT, 'src/app/features/lab/experiments');
const ASSETS_DIR = path.join(ROOT, 'src/assets/lab-sources');

function parseExperiments(content) {
  const pairs = [];
  let currentSlug = null;
  let currentCategory = null;

  for (const line of content.split('\n')) {
    const slugMatch = line.match(/^\s*slug:\s*'([^']+)'/);
    if (slugMatch) currentSlug = slugMatch[1];

    const categoryMatch = line.match(/^\s*category:\s*'([^']+)'/);
    if (categoryMatch) currentCategory = categoryMatch[1];

    const sourceMatch = line.match(/^\s*sourceFile:\s*'([^']+)'/);
    if (sourceMatch && currentSlug) {
      pairs.push({
        slug: currentSlug,
        category: currentCategory || 'cursor',
        sourceFile: sourceMatch[1],
      });
    }
  }

  return pairs;
}

function main() {
  if (!fs.existsSync(EXPERIMENTS_FILE)) {
    console.error('[sync:lab-sources] ERROR: ' + EXPERIMENTS_FILE + ' not found');
    process.exit(1);
  }

  if (!fs.existsSync(ASSETS_DIR)) {
    fs.mkdirSync(ASSETS_DIR, { recursive: true });
  }

  const content = fs.readFileSync(EXPERIMENTS_FILE, 'utf8');
  const experiments = parseExperiments(content);

  if (!experiments.length) {
    console.warn('[sync:lab-sources] No experiments with sourceFile found.');
    return;
  }

  const errors = [];
  let copied = 0;

  for (const { slug, category, sourceFile } of experiments) {
    const src = path.join(EXPERIMENTS_DIR, category, slug, sourceFile);
    const dest = path.join(ASSETS_DIR, sourceFile);

    if (!fs.existsSync(src)) {
      errors.push('Missing source: ' + path.relative(ROOT, src) + ' (slug: ' + slug + ')');
      continue;
    }

    fs.copyFileSync(src, dest);
    console.log('[sync:lab-sources] ' + path.relative(ROOT, src) + ' -> assets/lab-sources/' + sourceFile);
    copied += 1;
  }

  if (errors.length) {
    errors.forEach((message) => console.error('[sync:lab-sources] ERROR: ' + message));
    process.exit(1);
  }

  console.log('[sync:lab-sources] Done. ' + copied + ' file(s) synced.');
}

main();
