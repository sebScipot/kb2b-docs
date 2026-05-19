#!/usr/bin/env node
/**
 * sync-pricing.js — regenerates admin/planes-y-precios.mdx and admin/plans-and-pricing.mdx
 * from kb2b/src/lib/billing/plans.ts.
 *
 * Parses the .ts file textually (no TS compiler) so this script has zero deps.
 * Writes between MDX comment markers (pricing:start / pricing:end).
 *
 * Usage:
 *   node scripts/sync-pricing.js          # writes both locales
 *   node scripts/sync-pricing.js --check  # exits non-zero if any drift
 *
 * Source of truth: kb2b/src/lib/billing/plans.ts
 */

const fs = require('node:fs');
const path = require('node:path');

const DOCS_ROOT = path.resolve(__dirname, '..');
const KB2B_ROOT = path.resolve(DOCS_ROOT, '..', 'kb2b');
const PLANS_PATH = path.join(KB2B_ROOT, 'src/lib/billing/plans.ts');

const ES_PAGE = path.join(DOCS_ROOT, 'es/admin/planes-y-precios.mdx');
const EN_PAGE = path.join(DOCS_ROOT, 'en/admin/plans-and-pricing.mdx');

const CHECK_ONLY = process.argv.includes('--check');

if (!fs.existsSync(PLANS_PATH)) {
  console.error(`✗ Source plans.ts not found at ${PLANS_PATH}`);
  console.error(`  Run this script from a checkout that has kb2b/ as a sibling of kb2b-docs/.`);
  process.exit(1);
}

const plansSrc = fs.readFileSync(PLANS_PATH, 'utf8');

// ─── Parsers (regex-based, plan.ts is a deterministic source file) ────────────

function parsePlans(src) {
  // Match `spark: { name: "Spark", priceMonthly: 45, ... },`
  const planBlockRe = /(\w+):\s*\{([^}]+)\},/g;
  const planSectionMatch = src.match(/export const PLANS = \{([\s\S]+?)\n\} as const;/);
  if (!planSectionMatch) throw new Error('Cannot find PLANS export');
  const planSection = planSectionMatch[1];

  const plans = [];
  let m;
  while ((m = planBlockRe.exec(planSection)) !== null) {
    const id = m[1];
    const body = m[2];
    const get = (key) => {
      const re = new RegExp(`${key}:\\s*([^,\\n]+)`);
      const found = body.match(re);
      if (!found) return null;
      return found[1].trim().replace(/[",]/g, '').replace(/_/g, '');
    };
    plans.push({
      id,
      name: get('name'),
      priceMonthly: parseInt(get('priceMonthly'), 10),
      documents: parseInt(get('documents'), 10),
      queriesPerDay: parseInt(get('queriesPerDay'), 10),
      guestUsers: parseInt(get('guestUsers'), 10),
      tokensPerMonth: parseInt(get('tokensPerMonth'), 10),
      meetingMinutesPerMonth: parseInt(get('meetingMinutesPerMonth'), 10),
      activeCampaigns: get('activeCampaigns'),
      invitesPerCampaign: get('invitesPerCampaign'),
    });
  }
  return plans;
}

function parseTopups(src, constName) {
  const re = new RegExp(`export const ${constName} = \\[([\\s\\S]+?)\\n\\] as const;`);
  const m = src.match(re);
  if (!m) throw new Error(`Cannot find ${constName}`);
  const lines = m[1].split('\n').map(l => l.trim()).filter(l => l.startsWith('{'));
  return lines.map(line => {
    const id = line.match(/id:\s*"([^"]+)"/)[1];
    const name = line.match(/name:\s*"([^"]+)"/)[1];
    const tokens = line.match(/tokens:\s*([\d_]+)/)?.[1]?.replace(/_/g, '');
    const minutes = line.match(/minutes:\s*([\d_]+)/)?.[1]?.replace(/_/g, '');
    const priceCents = parseInt(line.match(/priceCents:\s*([\d_]+)/)[1].replace(/_/g, ''), 10);
    return {
      id,
      name,
      tokens: tokens ? parseInt(tokens, 10) : null,
      minutes: minutes ? parseInt(minutes, 10) : null,
      priceEur: priceCents / 100,
    };
  });
}

function parseConst(src, name) {
  // Handles both `export const NAME = value;` and `export const NAME: Type = value;`.
  const re = new RegExp(`export const ${name}(?:\\s*:\\s*\\w+)?\\s*=\\s*([\\d_.]+|"[^"]+");?`);
  const m = src.match(re);
  if (!m) return null;
  return m[1].replace(/[_"]/g, '');
}

// ─── Formatters ───────────────────────────────────────────────────────────────

function fmtNumber(n, locale) {
  if (n === 'Infinity') return '∞';
  if (typeof n !== 'number') n = parseFloat(n);
  return new Intl.NumberFormat(locale === 'es' ? 'es-ES' : 'en-US').format(n);
}

function fmtTokens(n) {
  if (n >= 1_000_000) return `${n / 1_000_000}M`;
  if (n >= 1_000) return `${n / 1_000}K`;
  return String(n);
}

function buildEsTable(plans, tokens, hours, warningPct, overagePct, trialDays, trialPlan) {
  const rows = plans.map(p => `| **${p.name}** | €${p.priceMonthly} | ${fmtTokens(p.tokensPerMonth)} | ${fmtNumber(p.meetingMinutesPerMonth, 'es')} min | ${p.guestUsers} | ≈ ${p.documents}* | ≈ ${p.queriesPerDay}/día* | ${p.activeCampaigns === 'Infinity' ? '∞' : p.activeCampaigns} |`).join('\n');

  const tokenRows = tokens.map(t => `| **${t.name}** ${fmtTokens(t.tokens)} | €${t.priceEur} |`).join('\n');
  const hoursRows = hours.map(h => `| **${h.name}** ${h.minutes / 60}h | €${h.priceEur} |`).join('\n');

  return `## Planes (EUR/mes)

| Plan | Precio | Tokens | Reuniones | Invitados | Documentos | Consultas | Campañas |
|---|---|---|---|---|---|---|---|
${rows}

**Tokens y minutos de reunión son los límites reales** (cobrables, hard limits). Las columnas marcadas con \`≈ ... *\` (Documentos y Consultas) son **estimaciones derivadas** del consumo típico de tokens — tu uso real puede ser mayor o menor según el tamaño de los documentos, complejidad de las consultas, y modelo usado.

**Prueba gratuita:** ${trialDays} días en el plan ${trialPlan.charAt(0).toUpperCase() + trialPlan.slice(1)}, sin tarjeta.

## Top-ups de tokens (pago único)

| Pack | Precio |
|---|---|
${tokenRows}

## Top-ups de horas de reunión (pago único)

| Pack | Precio |
|---|---|
${hoursRows}

## Avisos y bloqueos (sobre el límite real de tokens)

- A partir del **${Math.round(parseFloat(warningPct) * 100)}% del límite de tokens** ves un aviso amarillo en kb2b. Aún puedes consultar.
- A partir del **${Math.round(parseFloat(overagePct) * 100)}% del límite de tokens** las consultas se bloquean. Necesitas un top-up, cambio de plan, o esperar al siguiente ciclo. Más detalle en [Límites de tokens](/es/admin/limites-de-tokens).

Los minutos de reunión tienen su propio contador independiente, también con avisos y top-ups dedicados.
`;
}

function buildEnTable(plans, tokens, hours, warningPct, overagePct, trialDays, trialPlan) {
  const rows = plans.map(p => `| **${p.name}** | €${p.priceMonthly} | ${fmtTokens(p.tokensPerMonth)} | ${fmtNumber(p.meetingMinutesPerMonth, 'en')} min | ${p.guestUsers} | ≈ ${p.documents}* | ≈ ${p.queriesPerDay}/day* | ${p.activeCampaigns === 'Infinity' ? '∞' : p.activeCampaigns} |`).join('\n');

  const tokenRows = tokens.map(t => `| **${t.name}** ${fmtTokens(t.tokens)} | €${t.priceEur} |`).join('\n');
  const hoursRows = hours.map(h => `| **${h.name}** ${h.minutes / 60}h | €${h.priceEur} |`).join('\n');

  return `## Plans (EUR/month)

| Plan | Price | Tokens | Meetings | Guests | Documents | Queries | Campaigns |
|---|---|---|---|---|---|---|---|
${rows}

**Tokens and meeting minutes are the real limits** (billable, hard limits). The columns marked \`≈ ... *\` (Documents and Queries) are **derived estimates** based on typical token usage — your actual usage may be higher or lower depending on document size, query complexity, and model used.

**Free trial:** ${trialDays} days on the ${trialPlan.charAt(0).toUpperCase() + trialPlan.slice(1)} plan, no card required.

## Token top-ups (one-time)

| Pack | Price |
|---|---|
${tokenRows}

## Meeting-hours top-ups (one-time)

| Pack | Price |
|---|---|
${hoursRows}

## Warnings and blocks (on the real token limit)

- At **${Math.round(parseFloat(warningPct) * 100)}% of your token limit**, you see a yellow warning in kb2b. You can still query.
- At **${Math.round(parseFloat(overagePct) * 100)}% of your token limit**, queries are blocked. You need a top-up, plan change, or to wait for next cycle. Details on [Token limits](/en/admin/token-limits).

Meeting minutes have their own independent counter, with dedicated warnings and top-ups.
`;
}

function writePage(pagePath, body, locale) {
  // Always write the full canonical structure. Older stub content outside the
  // markers is intentionally discarded — the script is the source of truth.
  const isEs = locale === 'es';
  const frontmatter = isEs
    ? `---
title: "Planes y precios"
sidebarTitle: "Planes y precios"
description: "Spark, Cortex, Synapse, Megamind: qué incluye cada plan, top-ups de tokens y horas de reunión."
lang: "es"
---`
    : `---
title: "Plans and pricing"
sidebarTitle: "Plans and pricing"
description: "Spark, Cortex, Synapse, Megamind: what each plan includes, token top-ups, and meeting-hour top-ups."
lang: "en"
---`;

  // Auto-gen warning lives as MDX comment — invisible to readers, visible to
  // contributors who open the source file.
  const note = isEs
    ? `{/* AUTO-GENERATED: scripts/sync-pricing.js writes this file from kb2b/src/lib/billing/plans.ts. Do not edit manually — changes between the markers will be overwritten. Last sync: ${new Date().toISOString().slice(0, 10)}. */}`
    : `{/* AUTO-GENERATED: scripts/sync-pricing.js writes this file from kb2b/src/lib/billing/plans.ts. Do not edit manually — changes between the markers will be overwritten. Last sync: ${new Date().toISOString().slice(0, 10)}. */}`;

  return `${frontmatter}\n\n${note}\n\n{/* pricing:start */}\n\n${body}\n{/* pricing:end */}\n`;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

function main() {
  const plans = parsePlans(plansSrc);
  const tokens = parseTopups(plansSrc, 'TOPUP_PACKAGES');
  const hours = parseTopups(plansSrc, 'HOURS_TOPUP_PACKAGES');
  const warningPct = parseConst(plansSrc, 'WARNING_THRESHOLD');
  const overagePct = parseConst(plansSrc, 'OVERAGE_LIMIT');
  const trialDays = parseConst(plansSrc, 'FREE_TRIAL_DURATION_DAYS');
  const trialPlan = parseConst(plansSrc, 'TRIAL_PLAN_ID');

  console.log(`Source: ${PLANS_PATH}`);
  console.log(`Plans: ${plans.map(p => p.name).join(', ')}`);
  console.log(`Token top-ups: ${tokens.map(t => t.name).join(', ')}`);
  console.log(`Hours top-ups: ${hours.map(h => h.name).join(', ')}`);
  console.log(`Warning: ${warningPct}, Overage: ${overagePct}, Trial: ${trialDays} days on ${trialPlan}`);

  const esBody = buildEsTable(plans, tokens, hours, warningPct, overagePct, trialDays, trialPlan);
  const enBody = buildEnTable(plans, tokens, hours, warningPct, overagePct, trialDays, trialPlan);

  const esNext = writePage(ES_PAGE, esBody, 'es');
  const enNext = writePage(EN_PAGE, enBody, 'en');

  if (CHECK_ONLY) {
    const esDrift = esNext !== fs.readFileSync(ES_PAGE, 'utf8');
    const enDrift = enNext !== fs.readFileSync(EN_PAGE, 'utf8');
    if (esDrift || enDrift) {
      console.error(`✗ drift detected — run \`npm run sync:pricing\` to regenerate`);
      if (esDrift) console.error(`  - es/admin/planes-y-precios.mdx out of date`);
      if (enDrift) console.error(`  - en/admin/plans-and-pricing.mdx out of date`);
      process.exit(1);
    }
    console.log(`✓ pricing pages in sync with plans.ts`);
    process.exit(0);
  }

  fs.writeFileSync(ES_PAGE, esNext);
  fs.writeFileSync(EN_PAGE, enNext);
  console.log(`✓ wrote ${ES_PAGE}`);
  console.log(`✓ wrote ${EN_PAGE}`);
}

main();
