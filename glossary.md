# Glossary — kb2b-docs

Términos clave del producto y su traducción consistente entre ES y EN. **Cualquier desviación bloquea el CI.**

| EN | ES | Nota |
|---|---|---|
| POT | POT | No traducir. Cuando aparece solo, **significa "Knowledge Pot"** (el contenedor). Triple etimología — ver below. |
| Knowledge Pot | Knowledge Pot | El contenedor. Es lo que "POT" significa por defecto. |
| POT Score | POT Score | No traducir. La métrica 0.0–1.0 de certeza. ESTO es "Proof of Truth". |
| Proof of Truth | Proof of Truth | No traducir. Es lo que POT Score significa, NO lo que POT significa. |
| Scientia Potentia Est | Scientia Potentia Est | El lema latino detrás del nombre SciPot. Cuando se cite, no traducir. |
| Constitutional (level) | Constitucional (nivel) | Nivel 1.0 del POT Score — axioma constitucional, sólo Human Curator. |
| Verified (level) | Verified (nivel) / Verificado | Nivel 0.85–0.99. Validado por Human Curator. |
| Extracted (level) | Extracted (nivel) / Extraído | Nivel 0.50–0.84. Extraído directamente de fuente. |
| Inferred (level) | Inferred (nivel) / Inferido | Nivel 0.30–0.49. Derivado a través de relaciones. |
| Pending (level) | Pending (nivel) / Pendiente | Nivel 0.00–0.29. Sin verificar. |
| Constitution | Constitución | El set de axiomas constitucionales (POT Score = 1.0) de un POT. Típicamente 3–7. |
| Human Curator | Human Curator | No traducir el rol. Es el curador humano experto. |
| Agentic Curator | Agentic Curator | No traducir el rol. Es el curador automatizado. |
| edge | edge / relación | Conexión tipada entre hechos (supports, contradicts, etc). Preferir "relación" en ES general, "edge" cuando referencia tipo específico. |
| SciPot | SciPot | La infraestructura sobre la que kb2b está construido. Memory-as-a-Service para agentes de IA. |
| workspace | workspace | No traducir — terminología del producto. |
| account | cuenta | Cuando es "customer account". |
| fact | hecho | |
| source | fuente | |
| document | documento | |
| meeting | reunión | |
| recording | grabación | |
| transcript | transcripción | |
| chat | chat | No traducir. |
| conversation | conversación | |
| member | miembro | |
| admin | administrador / admin | Ambos OK. |
| owner | propietario / owner | Ambos OK; prefiere "propietario" en legal. |
| top-up | top-up | No traducir — terminología kb2b billing. |
| billing | facturación | |
| subscription | suscripción | |
| plan | plan | |
| token | token | No traducir. |
| usage | uso / consumo | "consumo" en admin/billing context, "uso" en general. |
| sandbox | modo prueba / sandbox | Prefiere "modo prueba" en UX; "sandbox" en docs técnicas. |
| pairing | vinculación | Para desktop. NO usar "emparejamiento" (suena raro). |
| screen recording | grabación de pantalla | Permiso macOS. |
| accessibility | accesibilidad | Permiso macOS. |
| microphone | micrófono | |
| camera | cámara | |
| AXIOM | AXIOMA | POT Score 1.0 — no traducir el concepto, sólo el término ES. |
| VERIFIED | VERIFICADO | |
| EXTRACTED | EXTRAÍDO | |
| INFERRED | INFERIDO | |
| PENDING | PENDIENTE | |

## Términos prohibidos (Vale bloqueará)

**EN:**
delve, robust, comprehensive, seamless, empower, intuitive, leverage, cutting-edge, multifaceted, foster, showcase, vibrant, fundamental, significant, pivotal, landscape, tapestry, underscore, crucial, nuanced, furthermore, moreover, additionally

**ES:**
fundamental, integral, robusto, sólido, holístico, sinérgico, ecosistema, paradigma, transformador, potente, vibrante

(En español "escalable" está permitido en contextos técnicos; vetado en marketing copy.)

## Cómo agregar términos

1. Editar este archivo.
2. Si es un término del producto que aparece en `kb2b/src/lib/i18n/translations.ts`, confirmar que la traducción coincide con la app.
3. Si afecta términos ya escritos en docs existentes, revisar los MDX para consistencia.
