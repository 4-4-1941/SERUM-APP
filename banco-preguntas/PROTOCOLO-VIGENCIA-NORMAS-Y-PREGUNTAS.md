# Protocolo: vigencia de normas y preguntas por competencias

Ubicación sugerida: `banco-preguntas/PROTOCOLO-VIGENCIA-NORMAS-Y-PREGUNTAS.md`

Estado: análisis propio, clasificación por IA pendiente de revisión humana.

## 1. Para qué sirve

1. **Probar** la extensión "Búsquedas El Peruano (No oficial)" y dejar escrito el resultado.
2. **Comprobar la vigencia** de cada norma antes de usarla en una pregunta.
3. **Crear preguntas nuevas** con el mismo formato de las oficiales: miden competencias, no memoria.

## 2. Antes de instalar la extensión (seguridad)

La pantalla de instalación avisa que la extensión tendrá acceso a todo lo que hay en la computadora y que el desarrollador **no está verificado por Anthropic**. Por eso:

- [ ] Instalarla solo en una computadora **sin datos de pacientes ni archivos clínicos**.
- [ ] Revisar quién la publica y qué código tiene antes de activarla.
- [ ] No pegar claves, tokens ni datos personales en las consultas.
- [ ] Si algo no cuadra, usar **Desinstalar**. No hay que seguir con la prueba.

La extensión solo debe usarse para **leer** El Peruano. No debe tocar el repositorio ni los archivos de la app.

## 3. Prueba de la extensión (una sola vez)

Escribir las consultas tal cual y anotar lo que devuelve.

| # | Consulta | Resultado esperado | Resultado obtenido | OK |
|---|----------|--------------------|--------------------|----|
| 1 | Buscar la RM 464-2011/MINSA | Figura como derogada por la RM 030-2020/MINSA | | |
| 2 | Buscar la Ley 30421 (Ley Marco de Telesalud) | Texto de la norma y si tiene modificatorias | | |
| 3 | Buscar la Ley 30947 (Ley de Salud Mental) | Texto de la norma y fecha de publicación | | |
| 4 | Abrir un PDF de una norma | Se puede leer el texto con su página | | |

Criterio: la prueba pasa si la extensión devuelve **fecha de publicación, número de norma, enlace y texto o PDF**. Si no da esos datos, no sirve como fuente y se anota aquí.

## 4. Ficha de vigencia (una por norma)

Se llena con la extensión **antes** de escribir preguntas de esa norma.

```
norma: Ley N.° 30421, Ley Marco de Telesalud
fecha_publicacion:
modificatorias:        # número y fecha de cada una
derogatorias:          # norma que la deroga, si existe
estado: VIGENTE | MODIFICADA | DEROGADA | VIGENCIA_NO_DETERMINADA
url_el_peruano:
fecha_de_consulta:
consultado_con: Búsquedas El Peruano (No oficial)
```

Reglas:

- Si no se puede determinar el estado, queda `VIGENCIA_NO_DETERMINADA` y **no** se publica ninguna pregunta de esa norma.
- Si está derogada, no se usa como respaldo de la clave. Se usa la norma que la reemplaza.
- Una fuente no oficial no basta para dar por cierta la vigencia: se contrasta con el texto de la norma o con el PDF.

## 5. Formato de las preguntas (como las oficiales)

El examen oficial mide competencias. Se aplica lo siguiente.

**Tipo caso aplicado**
- El enunciado plantea una situación concreta: paciente, familia, comunidad o establecimiento.
- La pregunta pide una decisión: qué hacer, cuál es la conducta, qué corresponde.
- La norma o la guía respalda la clave. No se copia su texto en el enunciado.

**Tipo definición conceptual**
- El enunciado describe el concepto y pregunta a qué corresponde.
- Las opciones son **términos cortos**, no frases largas.

**En todas**
- Una sola clave correcta y cuatro opciones (A a D).
- Opciones del mismo largo y la misma forma. La clave no puede ser la más larga ni la más detallada.
- Distractores plausibles: conceptos cercanos de la misma norma o guía.
- Nada de "todas las anteriores", "ninguna" ni opciones absurdas.
- Repartir la clave entre A, B, C y D.
- La justificación cita norma o guía, artículo o apartado, página y fecha de la ficha de vigencia.

## 6. Plantilla de pregunta (JSON)

```json
{
  "canonical_id": "GEN-0001",
  "profession": "Transversal",
  "thematic_block": "Cuidado integral",
  "tipo": "caso aplicado",
  "statement": "",
  "alternatives": ["", "", "", ""],
  "declared_answer": "A",
  "justification": "",
  "origin": "generado_ia_desde_norma_o_guia",
  "status": "REVIEW_REQUIRED",
  "marca": "análisis propio, clasificación por IA pendiente de revisión humana",
  "source": {
    "documento": "",
    "apartado": "",
    "pagina": 0,
    "url_oficial": "",
    "estado_vigencia": "VIGENTE | MODIFICADA | DEROGADA | VIGENCIA_NO_DETERMINADA",
    "fecha_de_consulta": ""
  }
}
```

Los nombres de bloque son los de la app: Cuidado integral, Salud pública, Gestión, Ética e interculturalidad, Investigación.

## 7. Fuentes que se pueden usar

1. Normas guardadas en SIP-AI-RAG, carpeta `knowledge/minsa/`.
2. Guías clínicas guardadas en SIP-AI-RAG, carpeta `knowledge/guia-clinica/`.
3. El Peruano, consultado con la extensión, solo para comprobar vigencia y modificatorias.

## 8. Registro de pruebas

| Fecha | Quién probó | Equipo | Resultado | Observaciones |
|-------|-------------|--------|-----------|---------------|
| | | | | |
