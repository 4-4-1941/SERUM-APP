# SERUMS Perú App

Aplicación web interactiva para preparación SERUMS Perú.

## Objetivo
Ofrecer una app de aprendizaje con:
- Diseño de tablero con navegación lateral (dashboard, casos, normativa, decretos, recursos).
- 20 casos clínicos interactivos con retroalimentación y puntaje.
- Prioridad temática en Psicología (10 de 20 casos).
- Normativa SERUMS oficial (Ley N.° 23330, reglamento y modificatorias).
- Recursos de estudio y notas personales guardadas localmente.

## Base oficial
La estructura temática se apoya en la Ley N.° 23330 (Ley del SERUMS), su reglamento (D.S. N.° 005-97-SA y modificatorias), el D.S. N.° 013-2024-SA sobre evaluación del proceso, y el Instructivo del Proceso SERUMS vigente publicado por el MINSA.

## Archivos
- `index.html` — estructura y punto de entrada.
- `styles.css` — identidad visual.
- `data.js` — casos clínicos, normativa, decretos y recursos.
- `app.js` — lógica de la aplicación (navegación, puntaje, progreso).

## Uso
1. Abre `index.html`.
2. Navega por el menú lateral (Tablero, Casos clínicos, Normativa, Decretos, Recursos).
3. Responde los casos clínicos y revisa la retroalimentación.
4. Consulta normas, decretos y recursos de estudio.
5. El progreso, el puntaje y las notas se guardan localmente en el navegador.

## Notas técnicas
- Los cuatro archivos deben estar en el mismo nivel del repositorio (rutas relativas).
- Requiere conexión a internet para cargar las tipografías (Google Fonts); sin conexión, la app funciona igual pero con tipografía de respaldo.
