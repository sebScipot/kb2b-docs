#!/usr/bin/env node
/**
 * check-parity.js — verifies every ES page has its EN twin and vice versa.
 *
 * Reads slug-map.json (manual ES→EN slug pairs since translation is not 1:1).
 * Fails on:
 *   - ES page exists without EN twin
 *   - EN page exists without ES twin
 *   - slug-map entry pointing to non-existent file
 *
 * Allowlist: paths matching `_allowlist-es-only` or `_allowlist-en-only` in slug-map
 * (none today — added when a section is intentionally single-locale).
 *
 * Usage:
 *   node scripts/check-parity.js
 *
 * Exit codes:
 *   0 = parity ok
 *   1 = parity violations
 */

const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const ES_DIR = path.join(ROOT, 'es');
const EN_DIR = path.join(ROOT, 'en');
const SLUG_MAP_PATH = path.join(__dirname, 'slug-map.json');

function loadSlugMap() {
  const raw = JSON.parse(fs.readFileSync(SLUG_MAP_PATH, 'utf8'));
  const map = {};
  for (const [k, v] of Object.entries(raw)) {
    if (k.startsWith('_')) continue;
    map[k] = v;
  }
  return map;
}

function walkMdx(dir, base = dir) {
  if (!fs.existsSync(dir)) return [];
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...walkMdx(full, base));
    } else if (entry.isFile() && entry.name.endsWith('.mdx')) {
      const rel = path.relative(base, full).replace(/\.mdx$/, '');
      out.push(rel);
    }
  }
  return out;
}

function main() {
  const slugMap = loadSlugMap();
  const esSlugs = new Set(walkMdx(ES_DIR));
  const enSlugs = new Set(walkMdx(EN_DIR));

  const errors = [];

  // 1. Every ES slug must have a mapped EN slug and that EN file must exist.
  for (const esSlug of esSlugs) {
    const enSlug = slugMap[esSlug];
    if (!enSlug) {
      errors.push(`MISSING_MAPPING: es/${esSlug}.mdx exists but slug-map.json has no entry`);
      continue;
    }
    if (!enSlugs.has(enSlug)) {
      errors.push(`MISSING_EN: es/${esSlug}.mdx exists but en/${enSlug}.mdx is missing`);
    }
  }

  // 2. Every EN slug must be referenced from at least one ES mapping.
  const enReferenced = new Set(Object.values(slugMap));
  for (const enSlug of enSlugs) {
    if (!enReferenced.has(enSlug)) {
      errors.push(`ORPHAN_EN: en/${enSlug}.mdx exists but no ES page maps to it`);
    }
  }

  // 3. Every slug-map entry must point to existing files on BOTH sides.
  for (const [esSlug, enSlug] of Object.entries(slugMap)) {
    if (!esSlugs.has(esSlug)) {
      errors.push(`MISSING_ES: slug-map maps ${esSlug} → ${enSlug} but es/${esSlug}.mdx is missing`);
    }
    if (!enSlugs.has(enSlug)) {
      errors.push(`MISSING_EN: slug-map maps ${esSlug} → ${enSlug} but en/${enSlug}.mdx is missing`);
    }
  }

  if (errors.length === 0) {
    console.log(`✓ parity ok — ${esSlugs.size} ES pages, ${enSlugs.size} EN pages, ${Object.keys(slugMap).length} mappings`);
    process.exit(0);
  }

  console.error(`✗ parity violations (${errors.length}):`);
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}

main();
