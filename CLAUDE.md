# CLAUDE.md — kb2b-docs

Documentación pública bilingüe (ES + EN) para kb2b en Mintlify free tier. Aprobada vía /autoplan 2026-05-19. Plan original: `../kb2b-docs-plan.md`.

## Stack

- **Mintlify Cloud (free tier)** — hosted, auto-deploy from `main`, custom domain `docs.kb2b.app`.
- **MDX** con frontmatter `title`, `sidebarTitle`, `description`, `lang`.
- **Node 22 LTS** para `mintlify dev` local.
- **GitHub Actions** para CI (14 gates: parity, links, Vale, glossary, images, screenshot age, redirects, sitemap, OG).

## Reglas de oro

1. **Toda página debe existir en ES Y EN.** El CI parity gate bloquea merge si falta.
2. **Escribir ES primero, luego EN nativo.** No traducir 1:1.
3. **Voz por superficie** (ver DESIGN.md):
   - `tú` para tutoriales (`empezar/`, `usuario/`, `escritorio/`)
   - `usted` para admin/billing/legal (`admin/`, `legal/`)
   - Neutral para conceptos (`conceptos/`)
4. **No editar páginas con fuente canónica.** Pricing, legal, changelog, glossary se generan desde kb2b/. Ver README.md.
5. **Screenshots sparse-by-default.** Cada uno lleva `{/* captured: YYYY-MM-DD kb2b@vX.Y.Z */}` (MDX comment syntax — NUNCA usar `<!-- -->` que Mintlify rechaza). CI advierte >60d, falla >90d.
6. **Desktop pairing es OAuth browser**, no código de 6 dígitos. Ver `escritorio/emparejar-con-kb2b.mdx`.

## Estructura de carpetas

```
es/
├── welcome.mdx
├── empezar/
├── usuario/
├── admin/
├── escritorio/
├── conceptos/
├── legal/
└── cambios.mdx

en/
└── (mirror of es/, translated slugs)
```

## Flow de trabajo de páginas

1. Crear MDX en `es/<slug>.mdx`
2. Registrar en `docs.json` bajo `navigation.languages[0].groups`
3. Crear par en `en/<slug>.mdx` (mismo slug)
4. Registrar en `docs.json` bajo `navigation.languages[1].groups`
5. Correr `mintlify dev` localmente para verificar render
6. Abrir PR; CI corre parity + Vale + link check + image check

## Skill routing

- Diseño visual → `/design-consultation`, `/design-shotgun`, `/design-html`
- QA / verificación → `/qa`, `/qa-only`, `/browse`
- Deploy → `/ship` (cuando hay PR listo)
- Cross-repo (kb2b backend o kb2b-desktop) → trabajar en ese repo, no aquí

## Voz: cosas que NUNCA decimos

Vocabulario prohibido (heredado de scipot-docs/DESIGN.md):

> delve, robust, comprehensive, seamless, empower, intuitive, leverage, cutting-edge, multifaceted, foster, showcase, vibrant, fundamental, significant, pivotal, landscape, tapestry, underscore

Si Vale flagea estas en EN o ES, **reescribir, no waivear**.

## Audiencias

Primary: early-adopter power users (instrumento de feedback). Si un power user con docs no entiende el producto, eso es señal de un problema de producto, no de docs.

Secondary: workspace admins + marketing-curious.

Internal GTM use: Guillem y Pol usan los mismos docs públicos para construir demo workspaces. **NO hay sección privada.**

## Fuentes de verdad fuera de este repo

- Pricing real: `../kb2b/src/lib/billing/plans.ts` (Spark/Cortex/Synapse/Megamind en EUR)
- App copy y glossary: `../kb2b/src/lib/i18n/translations.ts`
- Legal recording policy: `../kb2b/src/app/legal/meeting-recording-policy/page.tsx`
- Desktop pairing flow: `../kb2b-desktop/src/renderer/screens/Onboarding.tsx` (browser OAuth, NOT 6-digit code)
- Conceptos POT (link-out): `../scipot-docs/` o `docs.scipot.ai`
