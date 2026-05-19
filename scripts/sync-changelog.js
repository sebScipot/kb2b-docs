#!/usr/bin/env node
/**
 * sync-changelog.js — regenerates es/cambios.mdx and en/changelog.mdx from
 * kb2b/CHANGELOG.md plus kb2b-desktop git tags.
 *
 * Behavior:
 *   - Lists the last N=10 kb2b web versions verbatim from kb2b/CHANGELOG.md
 *   - Lists the last N=8 kb2b-desktop versions from git tags
 *   - For ES, content is shown as-is (CHANGELOG is mostly English already);
 *     full per-locale translation is a Phase 2+ concern. A banner explains.
 *
 * Usage:
 *   node scripts/sync-changelog.js
 *   node scripts/sync-changelog.js --check
 *
 * Source of truth:
 *   - kb2b/CHANGELOG.md
 *   - kb2b-desktop git tags (descriptions via `git tag -n99`)
 */

const fs = require('node:fs');
const path = require('node:path');
const { execSync } = require('node:child_process');

const DOCS_ROOT = path.resolve(__dirname, '..');
const KB2B_ROOT = path.resolve(DOCS_ROOT, '..', 'kb2b');
const DESKTOP_ROOT = path.resolve(DOCS_ROOT, '..', 'kb2b-desktop');

const WEB_CHANGELOG = path.join(KB2B_ROOT, 'CHANGELOG.md');
const ES_PAGE = path.join(DOCS_ROOT, 'es/cambios.mdx');
const EN_PAGE = path.join(DOCS_ROOT, 'en/changelog.mdx');

const N_WEB = 10;
const N_DESKTOP = 8;

const CHECK_ONLY = process.argv.includes('--check');

function readWebVersions(n) {
  if (!fs.existsSync(WEB_CHANGELOG)) {
    console.warn(`  warn: ${WEB_CHANGELOG} not found, skipping web changelog`);
    return [];
  }
  const src = fs.readFileSync(WEB_CHANGELOG, 'utf8');
  // Split on ## [version] - date headers
  const sections = src.split(/^## \[/m).slice(1);
  return sections.slice(0, n).map(block => '## [' + block.trim());
}

function readDesktopTags(n) {
  if (!fs.existsSync(path.join(DESKTOP_ROOT, '.git'))) {
    console.warn(`  warn: ${DESKTOP_ROOT}/.git not found, skipping desktop tags`);
    return [];
  }
  try {
    const tagsRaw = execSync(`git -C "${DESKTOP_ROOT}" tag --sort=-creatordate`, { encoding: 'utf8' });
    const tags = tagsRaw.trim().split('\n').filter(Boolean).slice(0, n);
    return tags.map(tag => {
      let date = '';
      let subject = '';
      try {
        date = execSync(`git -C "${DESKTOP_ROOT}" log -1 --format=%cd --date=short "${tag}"`, { encoding: 'utf8' }).trim();
      } catch {}
      try {
        subject = execSync(`git -C "${DESKTOP_ROOT}" log -1 --format=%s "${tag}"`, { encoding: 'utf8' }).trim();
      } catch {}
      return { tag, date, subject };
    });
  } catch (e) {
    console.warn(`  warn: failed to read desktop tags: ${e.message}`);
    return [];
  }
}

function buildEs(webVersions, desktopTags) {
  const today = new Date().toISOString().slice(0, 10);
  const webBlock = webVersions.length
    ? webVersions.join('\n\n')
    : '_No hay versiones publicadas todavía._';
  const desktopBlock = desktopTags.length
    ? desktopTags.map(t => `- **${t.tag}** (${t.date}) — ${t.subject}`).join('\n')
    : '_No hay tags todavía._';

  return `---
title: "Cambios"
sidebarTitle: "Cambios"
description: "Notas de versión de kb2b (web) y kb2b Desktop, en formato Keep a Changelog."
lang: "es"
---

{/* AUTO-GENERATED: scripts/sync-changelog.js writes this file from kb2b/CHANGELOG.md and kb2b-desktop git tags. Do not edit manually — changes between the markers will be overwritten. Last sync: ${today}. */}

<Info>
  El contenido detallado del log está originalmente en inglés (es un changelog técnico). Cuando un cambio afecta la UI o la experiencia del usuario, los títulos y descripciones se traducen aquí.
</Info>

{/* changelog:start */}

## kb2b (web)

${webBlock}

## kb2b Desktop

${desktopBlock}

{/* changelog:end */}
`;
}

function buildEn(webVersions, desktopTags) {
  const today = new Date().toISOString().slice(0, 10);
  const webBlock = webVersions.length
    ? webVersions.join('\n\n')
    : '_No published versions yet._';
  const desktopBlock = desktopTags.length
    ? desktopTags.map(t => `- **${t.tag}** (${t.date}) — ${t.subject}`).join('\n')
    : '_No tags yet._';

  return `---
title: "Changelog"
sidebarTitle: "Changelog"
description: "Release notes for kb2b (web) and kb2b Desktop, Keep a Changelog format."
lang: "en"
---

{/* AUTO-GENERATED: scripts/sync-changelog.js writes this file from kb2b/CHANGELOG.md and kb2b-desktop git tags. Do not edit manually — changes between the markers will be overwritten. Last sync: ${today}. */}

{/* changelog:start */}

## kb2b (web)

${webBlock}

## kb2b Desktop

${desktopBlock}

{/* changelog:end */}
`;
}

function main() {
  const web = readWebVersions(N_WEB);
  const desktop = readDesktopTags(N_DESKTOP);

  console.log(`Web changelog: ${web.length} versions`);
  console.log(`Desktop tags: ${desktop.length} (${desktop.map(t => t.tag).join(', ')})`);

  const esNext = buildEs(web, desktop);
  const enNext = buildEn(web, desktop);

  if (CHECK_ONLY) {
    const esDrift = esNext !== fs.readFileSync(ES_PAGE, 'utf8');
    const enDrift = enNext !== fs.readFileSync(EN_PAGE, 'utf8');
    if (esDrift || enDrift) {
      console.error(`✗ drift detected — run \`npm run sync:changelog\` to regenerate`);
      process.exit(1);
    }
    console.log(`✓ changelog pages in sync`);
    process.exit(0);
  }

  fs.writeFileSync(ES_PAGE, esNext);
  fs.writeFileSync(EN_PAGE, enNext);
  console.log(`✓ wrote ${ES_PAGE}`);
  console.log(`✓ wrote ${EN_PAGE}`);
}

main();
