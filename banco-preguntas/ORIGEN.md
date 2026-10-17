# Origen del banco de preguntas y de los casos de SERUM-APP

Documento de trazabilidad. Fecha de la revisión: 14/10/2026.
Método: revisión del historial completo del repositorio (537 commits) y análisis de los archivos actuales.

## ⚠️ Estado de confianza

**Origen no verificado.** El criterio con el que se crearon las primeras preguntas y casos no quedó registrado en el repositorio. Hasta confirmar clave, distractores y fuente con un revisor profesional, todo este material debe tratarse como **práctica no oficial**.

## Línea de tiempo (según el historial de Git)

| Fecha | Hecho |
|---|---|
| 08/07/2026 | Nace la app como "PRE SÉRUM PERÚ" (commit inicial). |
| 09/07/2026 | Se cargan los primeros casos en `data.js` (unas 20 entradas con `id`). Los 12 primeros títulos: 10 de Psicología (ej. "Riesgo suicida en adolescente", nivel I-2) y 2 de otros temas ("Brote diarreico en comunidad", "Hipertensión no controlada"). Normas listadas: Ley N.° 30947 (Salud Mental) y D.S. N.° 007-2020-SA. No se declara fuente ni PDF. |
| 01/08 al 21/08/2026 | `data.js` crece con subidas de archivos sin mensaje descriptivo ("Add files via upload"). No hay registro del motivo ni de la fuente. |
| 03/09/2026 | Se documenta `capacitacion/FUENTES.md` (fuentes auditadas de Capacitación Continua). Sustenta los cursos, **no** el banco de preguntas. |
| 13/09/2026 | Se crea la carpeta `banco-preguntas/`. |
| 14/09/2026 | Se sube `BANCO_SERUMS_FINAL_2211_4_ALTERNATIVAS.zip` (único ZIP o PDF agregado al repositorio). Se integran 25 casos de Psicología con 4 alternativas. |
| 15/09/2026 | Se agrega el catálogo maestro y los módulos por profesión (21 módulos, 2211 preguntas, formato A–D). |

## Lo que declara el banco actual (`banco-preguntas/profesiones/`)

- 2211 preguntas en 21 módulos; todas en estado `REVIEW_REQUIRED`.
- Origen declarado: **698** como `banco_generado_ia` y **1513** como "Sin origen declarado".
- Todas provienen del archivo previo `SERUMS_banco_preguntas_TODAS_LAS_CARRERAS` (`catalog_source`: `banco_maestro_previo`).
- Muchas preguntas se redujeron de cinco a cuatro alternativas de forma automática (conservando la clave y retirando un distractor); consta en `review_issues` y `original_five_alternatives`.
- Los 554 casos de `data.js` no tienen campo de fuente.

## Calidad de las justificaciones (medición del 14/10/2026)

- **911 de 2211** justificaciones tienen menos de 90 caracteres.
- Unas **90** son una plantilla del tipo "Referencia DSM-5 / CIE-11".
- Con una búsqueda estricta de citas numeradas (ley, decreto supremo, resolución ministerial, NTS con su número), **ninguna** de las 2211 preguntas cita una norma peruana concreta.
- Distribución por eje: Cuidado integral 1895 preguntas del banco ampliado frente a Salud pública 129, Ética 99, Gestión 60 e Investigación 28 (en Psicología: 129 de 189 son de Cuidado integral).

## Lo que no se encontró

- Ningún PDF de una institución en el historial del repositorio.
- Ninguna nota sobre el criterio de creación en commits ni en README.

## Pendientes para dar trazabilidad real

1. Validar clave, distractores y fuente con un revisor profesional (por profesión).
2. Usar como referencia oficial los exámenes, claves y ejes temáticos de los procesos 2025-I, 2025-II y 2026 (ZIP pendiente de subir a SIP-AI-RAG).
3. Vincular cada pregunta con su norma o guía en la justificación técnica (primero las preguntas de Salud pública, Ética, Gestión e Investigación; las clínicas necesitan guías y textos por profesión).
4. Agregar a cada pregunta un campo de origen (`origen`) que ya no se pierda: IA, examen oficial, elaboración por revisor, etc.
5. Si la persona responsable recuerda la institución del PDF que originó las primeras preguntas, registrarla aquí.
