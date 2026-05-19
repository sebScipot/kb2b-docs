# kb2b-docs

Documentación pública de [kb2b](https://kb2b.app) — base de conocimiento empresarial con memoria de cuenta.

🌐 **En vivo:** [docs.kb2b.app](https://docs.kb2b.app) (pendiente Phase 0 deploy)

## Estructura

```
kb2b-docs/
├── docs.json                    Mintlify config (navigation.languages)
├── CLAUDE.md                    Skill routing + AI context
├── DESIGN.md                    Visual system (kb2b --brand + Geist)
├── es/                          Contenido en español
├── en/                          Content in English
├── images/                      Screenshots + diagrams
├── logo/                        kb2b wordmark assets
├── scripts/                     Canonical-source sync (pricing, legal, glossary)
└── .github/workflows/           CI (i18n parity, Vale, link check, image budget)
```

## Desarrollo local

Requiere Node 22 LTS.

```bash
npm install -g mintlify
cd kb2b-docs
mintlify dev
```

Abre `http://localhost:3000` — soporta hot reload.

## Cómo contribuir

1. Crea una rama desde `main`
2. Escribe MDX en **ES primero**, luego EN nativo (no traducción 1:1)
3. Cada página en `/es/` debe tener su par en `/en/` (CI bloquea si falta)
4. Sigue las reglas de voz en [DESIGN.md](./DESIGN.md): `tú` para tutoriales, `usted` para admin/legal
5. Abre PR — CI corre 14 gates antes de permitir merge

## Deploys

`main` → Mintlify Cloud → `docs.kb2b.app` (free tier).

## Fuentes canónicas (no editar manualmente)

| Página | Fuente (requiere kb2b sibling en disk) | Script |
|---|---|---|
| `admin/planes-y-precios` (ES + EN) | `../kb2b/src/lib/billing/plans.ts` | `scripts/sync-pricing.js` ✓ |
| `cambios` (ES + EN) | `../kb2b/CHANGELOG.md` + `../kb2b-desktop/` git tags | `scripts/sync-changelog.js` ✓ |
| `legal/politica-de-grabacion` (ES + EN) | `../kb2b/src/app/legal/meeting-recording-policy/page.tsx` | `scripts/sync-legal.js` (pendiente) |
| Glossary enforcement (CI) | `../kb2b/src/lib/i18n/translations.ts` | `scripts/sync-glossary.js` (pendiente) |

Los scripts marcados con ✓ funcionan. Los marcados como "pendiente" están planificados pero aún no escritos — esas páginas se mantienen manualmente por ahora.

## Licencia

MIT (público, libre de uso/fork).
