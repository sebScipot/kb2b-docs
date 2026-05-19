#!/usr/bin/env node
/**
 * check-screenshots-age.js — verifies every image reference in MDX has a
 * `<!-- captured: YYYY-MM-DD kb2b@vX.Y.Z -->` comment within 5 lines of it,
 * and that the captured date isn't too old.
 *
 * Rules (per Phase 2 §6.3 and §10):
 *   - 0-60 days old: ok
 *   - 60-90 days old: warn (does not fail CI)
 *   - >90 days old: fail
 *   - missing comment: fail (with grace period — see GRACE_BEFORE)
 *
 * Phase 1 grace: image references can ship without the captured comment
 * for 30 days after this script lands, then enforcement begins.
 *
 * Usage:
 *   node scripts/check-screenshots-age.js
 *   node scripts/check-screenshots-age.js --strict   # treat warnings as errors
 *
 * Exit codes:
 *   0 = all ok
 *   1 = violations (errors only)
 */

const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const STRICT = process.argv.includes('--strict');

const WARN_DAYS = 60;
const FAIL_DAYS = 90;

// Grace period: once this script lands in CI, give MDX authors 30 days
// to backfill `captured:` comments on existing image refs.
const GRACE_BEFORE = new Date('2026-06-19'); // 30 days from skeleton creation.

function walkMdx(dir) {
  if (!fs.existsSync(dir)) return [];
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...walkMdx(full));
    } else if (entry.isFile() && entry.name.endsWith('.mdx')) {
      out.push(full);
    }
  }
  return out;
}

function daysBetween(a, b) {
  return Math.floor((b - a) / (1000 * 60 * 60 * 24));
}

function main() {
  const today = new Date();
  const inGrace = today < GRACE_BEFORE;

  // Imagen reference patterns:
  //   ![alt](path) — markdown
  //   <img src="path" ... /> — html
  //   src="/images/..." inside Mintlify components
  const IMG_REGEX = /(!\[[^\]]*\]\(([^)]+)\)|<img[^>]+src=["']([^"']+)["']|src=["'](\/images\/[^"']+)["'])/g;
  // Accept both MDX comments {/* captured: ... */} (preferred) and legacy HTML comments.
  const CAPTURED_REGEX = /(?:<!--|\{\/\*)\s*captured:\s*(\d{4}-\d{2}-\d{2})\s+kb2b@v[\d.]+\s*(?:-->|\*\/\})/;

  let errors = 0;
  let warnings = 0;
  let images = 0;

  for (const file of walkMdx(ROOT)) {
    if (file.includes('/node_modules/')) continue;
    const content = fs.readFileSync(file, 'utf8');
    const lines = content.split('\n');

    lines.forEach((line, idx) => {
      const matches = [...line.matchAll(IMG_REGEX)];
      for (const m of matches) {
        const imgPath = m[2] || m[3] || m[4];
        // Skip non-local images (http://, https://, mailto:)
        if (/^[a-z]+:/i.test(imgPath)) continue;
        images++;

        // Look for captured comment in surrounding 5 lines.
        const start = Math.max(0, idx - 2);
        const end = Math.min(lines.length, idx + 3);
        const window = lines.slice(start, end).join('\n');
        const capMatch = window.match(CAPTURED_REGEX);

        const rel = path.relative(ROOT, file);
        const loc = `${rel}:${idx + 1}`;

        if (!capMatch) {
          if (inGrace) {
            console.warn(`  GRACE  ${loc} — image ${imgPath} has no captured comment (grace period until ${GRACE_BEFORE.toISOString().slice(0, 10)})`);
          } else {
            console.error(`  ERROR  ${loc} — image ${imgPath} has no {/* captured: YYYY-MM-DD kb2b@vX.Y.Z */} comment`);
            errors++;
          }
          continue;
        }

        const capDate = new Date(capMatch[1]);
        const age = daysBetween(capDate, today);
        if (age >= FAIL_DAYS) {
          console.error(`  ERROR  ${loc} — image ${imgPath} captured ${age}d ago (>${FAIL_DAYS}d threshold)`);
          errors++;
        } else if (age >= WARN_DAYS) {
          console.warn(`  WARN   ${loc} — image ${imgPath} captured ${age}d ago (refresh soon)`);
          warnings++;
        }
      }
    });
  }

  const summary = `${images} image refs scanned, ${warnings} warnings, ${errors} errors`;
  if (errors === 0 && warnings === 0) {
    console.log(`✓ ${summary}`);
    process.exit(0);
  }
  if (errors === 0) {
    console.log(`✓ ${summary} (warnings only — does not fail CI unless --strict)`);
    if (STRICT && warnings > 0) process.exit(1);
    process.exit(0);
  }
  console.error(`✗ ${summary}`);
  process.exit(1);
}

main();
