# DESIGN.md — kb2b-docs Visual System

Sistema de diseño para `docs.kb2b.app`. **No es scipot-docs con otro logo** — es kb2b primero, SciPot-powered segundo.

## Tesis

Power users comerciales y admins corporativos buscan **densidad y precisión** en la docs. No marketing fluff. La doc se ve cercana al producto, no al landing.

## Color

Tokens importados directamente de `kb2b/node_modules/@kb2b/ui/tokens.css`:

```css
/* Light mode */
--brand: oklch(0.58 0.12 158);          /* kb2b green, muted */
--brand-foreground: oklch(0.985 0 0);    /* near-white text on brand */
--brand-muted: oklch(0.92 0.04 158);     /* surface tint */
--background: oklch(1 0 0);              /* paper */
--foreground: oklch(0.145 0 0);          /* near-black ink */
--accent-blue: oklch(0.62 0.18 255);     /* secondary accent */
--destructive: oklch(0.58 0.22 27);      /* error red */

/* Dark mode (preferred for docs.kb2b.app) */
--brand: oklch(0.70 0.13 158);
--brand-foreground: oklch(0.145 0 0);
--brand-muted: oklch(0.32 0.06 158);
--background: oklch(0.145 0 0);
--foreground: oklch(0.985 0 0);
```

**Reservado para SciPot POT-Score:** la paleta semántica de scipot-docs (gold axiom 1.0, emerald verified 0.85-0.99, sand extracted 0.50-0.84, muted inferred 0.30-0.49) sólo se usa en páginas que explican POT Score y procedencia. **Resto del sitio = kb2b brand.**

## Tipografía

```css
--font-display: "Geist Sans", system-ui;
--font-body: "Geist Sans", system-ui;
--font-mono: "Geist Mono", "JetBrains Mono", monospace;
```

**NO usar Cormorant Garamond italic.** Eso es de scipot-docs. kb2b no tiene marquee serif.

| Elemento | Fuente | Peso | Comentario |
|---|---|---|---|
| h1 hero | Geist Sans | 700 | Máximo 1 por página |
| h2 sección | Geist Sans | 600 | |
| h3 sub-sección | Geist Sans | 500 | |
| body | Geist Sans | 400 | |
| énfasis | Geist Sans | 600 | NO italic en español (raro) |
| inline code | Geist Mono | 400 | |
| code block | Geist Mono | 400 | |
| números (POT Score, tokens, precios) | Geist Mono | 500 | tabular-nums |

## Espaciado

Base 4px. Ritmo 64–96px entre secciones. **No usar márgenes orgánicos** — todo múltiplo de 4.

## Border-radius

| Elemento | Radius |
|---|---|
| Cards | 6px |
| Buttons | 4px |
| Code blocks | 4px |
| Screenshots | 8px (excepción para suavizar capturas) |

**Nunca >12px.** kb2b es serio, no juvenil.

## Componentes Phase 1 (4)

> **Nota retro 2026-05-19:** el componente `<AccountReceipt>` originalmente planeado se eliminó del scope. La iteración inicial usó una tabla markdown dentro de un `<Card>` para simular el receipt, y rompió visualmente en mobile (pipes literales). Se reemplazó por un párrafo narrativo. Si en el futuro queremos un receipt visual, debe ser un componente JSX real (no tabla markdown dentro de Card).

1. **`<SectionBadge variant="...">`** — eyebrow label encima del título de cada página. Variants: `usuario` (verde-muted), `admin` (azul-muted), `legal` (gris-muted), `escritorio` (verde-muted + platform chip). Sin colores chillones.

2. **`<LocaleBanner variant="...">`** — banner amarillo-muted en la parte superior de la página cuando:
   - `missing`: "Esta página aún no está disponible en {target_lang}. Ver versión en {fallback_lang} →"
   - `fallback`: "Visualizando {parent_page} en {target_lang} (página solicitada no traducida)"
   - `empty-search`: "0 resultados en {current_lang}. ¿Buscar también en {other_lang} ({N})?"

3. **`<ScreenshotWithDate>`** — wrapper para imágenes que renderiza la captura + caption con versión y fecha. Lee del MDX comment adjacente `{/* captured: 2026-05-19 kb2b@v0.15.1 */}` (MDX no acepta HTML comments — usar siempre `{/* ... */}`).

4. **`<CopyPromptButton>`** — botón con texto pre-escrito + icono clipboard. Click → copia al portapapeles, muestra confirmación verde 2s. Para tutoriales de power user.

## Patrones prohibidos en MDX

- **Tabla markdown dentro de `<Card>` o `<CardGroup>`.** Mintlify renderiza los pipes (`|`) literalmente en mobile y se rompe visualmente. Si necesitas datos tabulares en una "tarjeta", convierte a `<dl>` (definition list) o usa un componente JSX dedicado. Tablas markdown fuera de Cards funcionan bien.
- **HTML comments `<!-- ... -->`.** MDX los rechaza con error de parser. Usar `{/* ... */}`.
- **Datos simulados disfrazados de UI real.** Si muestras un "ejemplo de respuesta" o "ficha de cuenta", asegúrate de que es claramente narrativo o un screenshot real fechado — nunca una tabla markdown que el lector pueda confundir con un screenshot.
- **`<` seguido de dígito en prosa.** MDX interpreta `<7`, `<10`, `<70%`, etc. como inicio de un tag JSX (busca un nombre de tag tras el `<`). Error de parser: "Unexpected character `7` (U+0037) before name". Soluciones:
  - Usa prosa: "por debajo del 70%" / "below 70%"
  - Inserta un espacio: `< 70%` (sí pasa, pero usar prosa es más legible)
  - Usar la entidad: `&lt;70%`
  - Mismo problema potencial con `<` + cualquier carácter no-letra. `<=`, `<-`, `<3` (no es un corazón aquí, es JSX inválido).
- **Greater-than `>` NO rompe MDX** — `>40%` y `>20 tags` son válidos. Solo el `<` abre tag JSX.

## Voz por superficie

| Superficie | Voz ES | Voz EN | Ejemplo ES |
|---|---|---|---|
| Tutoriales (`empezar/`, `usuario/`, `escritorio/`) | `tú` | direct 2nd person | "Sube un PDF. kb2b extrae los hechos. Tú confirmas." |
| Conceptos (`conceptos/`) | imperativo neutro | direct | "kb2b asigna un POT Score entre 0 y 1 a cada hecho." |
| Admin / billing (`admin/`) | `usted` | formal direct | "Usted puede configurar los límites en Facturación." |
| Legal (`legal/`) | `usted` (convención legal) | formal | "El usuario consiente la grabación al iniciar la reunión." |
| Changelog (`cambios.mdx`) | impersonal | impersonal | "Se renombró Memoria → Conocimiento." |

## Vocabulario prohibido

Heredado de scipot-docs. **Vale CI bloquea PRs con estas palabras:**

`delve, robust, comprehensive, seamless, empower, intuitive, leverage, cutting-edge, multifaceted, foster, showcase, vibrant, fundamental, significant, pivotal, landscape, tapestry, underscore, crucial, nuanced, furthermore, moreover, additionally`

Y en español:

`fundamental, integral, robusto, sólido, integral, holístico, sinérgico, escalable (excepto en contextos técnicos), ecosistema, paradigma, transformador`

## Líneas canónicas (cambios requieren PR explícito)

- "kb2b — la base de conocimiento que recuerda."
- "Cada respuesta tiene una fuente. Cada fuente tiene un POT Score."
- "Hablas con tus cuentas. Tus cuentas hablan contigo."
- "kb2b está construido sobre SciPot, la infraestructura de memoria certificada para agentes de IA."

## Terminología POT — reglas obligatorias

Triple etimología que se confunde fácil. Reglas para evitar errores:

1. **POT** (solo, sin "Score") = **Knowledge Pot** = el contenedor. NUNCA escribir "POT (Proof of Truth)".
2. **POT Score** = **Proof of Truth** = la métrica 0.0–1.0. Esta sí se llama "Proof of Truth".
3. **Scientia Potentia Est** = el lema latino que dio nombre a SciPot. Sólo se cita en contexto de etimología.

Ejemplos correctos:
- ✅ "tu POT principal" (= tu Knowledge Pot principal)
- ✅ "POT Score 0.92 — Verified"
- ✅ "el POT (Knowledge Pot)" en primera mención
- ❌ "POT (Proof of Truth)" — error conceptual

Cinco niveles del POT Score con sus nombres canónicos (del whitepaper SciPot):
- `1.0` = **Constitutional** (Constitucional en ES)
- `0.85–0.99` = **Verified** (Verified / Verificado)
- `0.50–0.84` = **Extracted** (Extracted / Extraído)
- `0.30–0.49` = **Inferred** (Inferred / Inferido)
- `0.00–0.29` = **Pending** (Pending / Pendiente)

NO usar "AXIOMA" como nombre de nivel — los axiomas SON la **Constitución** (POT Score = 1.0).

## Mobile

**9 páginas deben funcionar bien en móvil:**
- `escritorio/emparejar-con-kb2b` (usuario en teléfono mientras pares con el laptop al lado)
- `escritorio/grabar-reunion` (referencia durante una reunión)
- `usuario/chat-con-el-pot`
- `usuario/subir-documentos`
- `admin/facturacion`
- `admin/planes-y-precios`
- `legal/politica-de-grabacion`
- Todas las páginas de error (404, locale-missing, empty-search)
- (Si existe) cualquier página de procurement

**Desktop-acceptable pero tablas deben reflow:** permission matrices, conceptos, cambios.

## OG / meta

Cada página tiene OG image específica por locale. Para `welcome`, ambas (ES y EN) usan `og-welcome-es.png` y `og-welcome-en.png` respectivamente. Para el resto, fallback `og-default.png` con el wordmark kb2b.

## Inspiración (lo que sí miramos)

- **HubSpot Knowledge Base** — densidad en admin/billing pages
- **Pipedrive help** — tono comercial-cercano-profesional en ES
- **Intercom help center** — empty states y search UX
- **Linear "Best practices"** — formato de vertical recipes (futuro Phase 2+)
- **Gong help** — workflow language para revenue operators

## Inspiración (lo que NO miramos)

- Notion docs — demasiado prosumer
- Stripe docs — demasiado developer
- Mintlify default examples — demasiado vanilla
- scipot-docs welcome.mdx — wrong category (dev-facing)
