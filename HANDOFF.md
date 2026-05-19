# Handoff — pasos manuales para Phase 0

Este documento lista los pasos que **tú (Seba) debes hacer manualmente** para que kb2b-docs pase de "esqueleto local" a "vivo en docs.kb2b.app". Tiempo estimado: 30-45 minutos.

## 1. Crear repo público en GitHub (5 min)

```bash
cd kb2b-docs
git init
git add .
git commit -m "chore: initial skeleton — kb2b-docs Phase 0 (32 MDX, 14 pages × 2 locales)"

# Crea el repo público en GitHub web o vía gh CLI:
gh repo create smtx/kb2b-docs --public --description "Documentación pública de kb2b — bilingüe ES+EN, Mintlify" --source=. --remote=origin --push
```

**Importante:** el repo MUST ser público (requisito del free tier de Mintlify).

## 2. Verificar Mintlify free tier soporta lo que necesitamos (10 min)

Confirma en [Mintlify pricing](https://mintlify.com/pricing) que el free tier incluye:

- [ ] Custom domain (CNAME a docs.kb2b.app)
- [ ] `navigation.languages` para i18n
- [ ] Per-locale search scoping
- [ ] Preview deploys per PR (opcional pero útil)
- [ ] Sin auth / sin password (no la necesitamos)

Si el free no soporta custom domain en 2026: opción B = subdominio `kb2b.mintlify.app` (temporal) hasta justificar el Pro tier.

## 3. Instalar Mintlify GitHub App (5 min)

⚠️ **Gotcha conocido** (memoria del workspace): "GitHub Active" en los settings de Mintlify ≠ App instalada. **Asegúrate de ver el mensaje "Install GitHub app"** y completar el flow. Sin eso, Mintlify no auto-deploya.

1. Visita [mintlify.com/dashboard](https://mintlify.com/dashboard)
2. Sign up / sign in
3. New project → "Import from GitHub" → selecciona `smtx/kb2b-docs`
4. Si te pide instalar la app, hazlo
5. Confirma que aparece "GitHub Active" + "App Installed" (los dos)

## 4. Configurar custom domain (10 min)

En el dashboard de Mintlify del proyecto:
- Settings → Custom domain → `docs.kb2b.app`
- Te dará un CNAME target (algo como `cname.mintlify.app` o similar)

En tu proveedor DNS (probablemente Cloudflare para kb2b.app):
- Añade un CNAME: `docs` → `<lo que te dió Mintlify>`
- TTL: 300s para el spike, luego 3600s estable
- Espera 5-10 min, verifica con: `dig docs.kb2b.app +short`

## 5. Probar localmente antes de empujar (5 min)

```bash
cd kb2b-docs
npm install -g mintlify
mintlify dev
```

Abre `http://localhost:3000`. Verifica:

- [ ] La página `welcome.mdx` ES renderiza con el Account Receipt
- [ ] Locale switcher arriba a la derecha funciona ES ↔ EN
- [ ] La navegación lateral muestra los 7 grupos (Empezar, Para usuarios, Para administradores, kb2b Desktop, Conceptos, Legal, Cambios)
- [ ] El brand color verde aparece en CTAs (kb2b green, no SciPot emerald)
- [ ] `empezar/primera-conversacion` se ve bien con el bloque de prompt copyable

Si algo no renderiza: revisa el log de `mintlify dev` para errores de schema en `docs.json`.

## 6. Push y verificar deploy (5 min)

```bash
git add .
git commit -m "feat: add HANDOFF.md after local spike verification"
git push origin main
```

En el dashboard de Mintlify verás el deploy. Espera ~2-3 min. Luego:

```bash
curl -I https://docs.kb2b.app/es/welcome
# Esperado: 200 OK
curl -I https://docs.kb2b.app/en/welcome
# Esperado: 200 OK
```

## 7. Smoke tests post-deploy (5 min)

Manuales en el navegador:

- [ ] `https://docs.kb2b.app/es/welcome` carga
- [ ] `https://docs.kb2b.app/en/welcome` carga
- [ ] Locale switcher funciona, preserva slug y scroll
- [ ] Search devuelve resultados (escribir "POT" o "facturación")
- [ ] El logo de kb2b aparece (necesitarás añadir `logo/light.png` + `logo/dark.png` + `logo/favicon.png` antes — actualmente faltan)
- [ ] 404 cuando visitas `/es/no-existe`

## ⚠️ Cosas que faltan antes de "production-ready"

Lo que el esqueleto NO tiene aún (deliberadamente — son pasos posteriores):

- [ ] **Logo assets** en `logo/` (light.png, dark.png, favicon.png) — necesitas exportarlos del brand de kb2b
- [ ] **`images/og-default.png`** — image OG para previews en LinkedIn/Twitter
- [ ] **Vale config** (`.vale.ini` + reglas ES/EN del vocabulario prohibido)
- [ ] **CI workflow** `.github/workflows/docs-lint.yml` con los 14 gates
- [ ] **Scripts de sync** en `scripts/` (sync-pricing.ts, sync-legal.ts, sync-changelog.ts, sync-glossary.ts)
- [ ] **Componente `<AccountReceipt>`** — actualmente está renderizado inline como Mintlify `<Card>`. Componente custom mejora la magia.
- [ ] **Componente `<CopyPromptButton>`** — la página `empezar/primera-conversacion` lo menciona pero no existe aún
- [ ] **App Help link contract** en kb2b — cuando esto esté, el dashboard de kb2b apunta a docs.kb2b.app contextualmente
- [ ] **Contenido completo de las 12 páginas stub** (actualmente sólo welcome + primera-conversacion + permisos-macos + emparejar-con-kb2b + planes-y-precios + límites-de-tokens + conceptos/que-es-un-pot + legal/confianza-y-datos tienen contenido real; el resto son stubs `Página en construcción`)

## Cuando algo falla — diagnóstico rápido

| Síntoma | Causa probable | Fix |
|---|---|---|
| `mintlify dev` error: "Invalid docs.json schema" | El schema cambió | Revisa Mintlify docs actualizados |
| Custom domain no resuelve | CNAME aún propagando | Espera 10-30 min; `dig` para verificar |
| `404` en `/es/welcome` después del push | `navigation.languages[].groups[].pages` mal referenciado | Confirma paths en docs.json |
| Locale switcher no aparece | Sólo 1 language en `navigation.languages` | Confirma que están ambos `es` y `en` |
| Search no encuentra "POT" | Index aún no construido | Espera 5 min después del deploy |
| Logo no aparece | Archivos `logo/*.png` faltan | Añade los assets antes de re-deployar |

## Siguiente sprint (después del Handoff)

Cuando esto esté vivo:

1. Crear los logo assets y agregar a `logo/`
2. Setup Vale + crear `.vale.ini` con reglas
3. Crear el primer CI workflow
4. Empezar a escribir el contenido real de los 12 stubs (orden recomendado por TTHW archetype: limites-de-tokens → grabar-reunion → chat-con-el-pot → subir-documentos → facturacion → que-es-kb2b → resto)

¿Dudas? Mira el plan completo en [kb2b-docs-plan.md](../kb2b-docs-plan.md) o pídeme cosas específicas.
