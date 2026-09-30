# Memoria del proyecto SecDle v7

## Estado actual

- Ruta correcta: `C:\Users\Adrian\Desktop\secdle\secdle_project_v7`, repositorio Git v7. No usar la copia anterior de Desktop.
- Express + frontend vanilla. `db.js` usa PostgreSQL cuando existe `DATABASE_URL`, o JSON solo en desarrollo. Mercado Pago/Yape, firma de webhook, validación de cobros, caducidad Plus y modo Fácil ya existían y se conservaron.
- 30/09/2026: 37 casos diarios desde el 25/08 hasta el 30/09. Se mantuvieron los 17 casos previos (IDs, fechas y pistas) y se añadieron 20 desde el 11/09.
- Casos en `data/secdle_data.js`: `categories[].answers[].cases[]`. `id`, `name`, `releaseDate`, seis `hints`; respuesta correcta y `aliases` vienen del padre. Educación: `explanation`, `keySignals`, `whyNot`; inglés: variantes `*En`. Los originales reciben metadatos desde `CASE_LEARNING` del mismo archivo.
- `flattenCases()` asigna niveles por fecha/ID. `stateFor()` consulta progreso mediante `db.getProgress()` y revela educación solo al terminar. `educationFor()` proporciona contenido reutilizable y `localizePayload()` adapta presentación de API con `?lang=en`, sin cambiar IDs o respuestas.
- `public/app.js`: cargar → `renderGame()`/`renderAssistPanel()` → `submitGuess()` → `showEducationModal()` al acertar o agotar seis intentos. Modal en `public/index.html`, estilos en `public/styles.css`. `nextCase()` busca pendientes accesibles, primero posteriores y después anteriores; los fallos conservan reintento.
- Archivo paginado en cliente: `archiveItems`, `archivePage`, `archivePageSize=6`, `renderArchivePage()` y `changeArchivePage()` en `public/app.js`. Solo se crean seis tarjetas por página; API completa conservada para compatibilidad con `nextCase()`. Botones Anterior/Siguiente, límites, ES/EN y página restaurada al cambiar idioma. Modal con altura limitada y navegación fuera del scroll; encabezado por debajo de los modales.
- ES/EN: `public/i18n.js` traduce interfaz, mensajes, modo Fácil, administración y páginas informativas/legales. `secdle_lang` guarda preferencia; `setLanguage()` restaura caso, modo, borrador y modal tras recargar. Educación invitada en otro idioma se vuelve a consultar. Progreso invitado sigue en `secdle_guest_progress_v1`.

## Decisiones y por qué

- Adaptar cambios, no copiar `server.js`/`db.js` de la versión equivocada: esta versión ya tiene persistencia y pagos más completos.
- Preservar los originales e insertar solo fechas posteriores para mantener niveles y progreso existentes.
- Reutilizar catálogo de respuestas para ambos modos: no duplicar opciones ni la solución dentro del caso.
- Mostrar educación al terminar, no después de cada fallo intermedio, para mantener la mecánica de seis intentos.
- Mantener importes USD de referencia y PEN reales. La traducción no modifica pagos, autenticación ni tablas PostgreSQL.
- `STORE_PATH` permite pruebas aisladas; un JSON corrupto ya no se convierte silenciosamente en un almacén vacío.

## Aprendizajes y errores a evitar

- Revisar siempre la ruta correcta: hay dos copias distintas del proyecto.
- No usar ni migrar datos reales en pruebas; no ejecutar `npm start` de prueba con `.env` productivo.
- Educación pertenece al caso, no al esquema de progreso: no se requiere migración SQL.
- Invitados reciben todas las pistas y pueden solicitar respuesta por API como antes; su progreso no es prueba antifraude para premios o clasificación competitiva.
- Nuevos escenarios son ficticios y educativos, no noticias atribuidas a incidentes reales.

## Próximos pasos

- Cubrir octubre cuando corresponda, manteniendo formato, variedad, traducción y fechas existentes.
- Revisar visualmente ambos idiomas/modos, páginas móviles y foco del modal en un navegador conectado.
- Verificar integraciones PostgreSQL y Mercado Pago en entornos de prueba propios antes de publicar; no se realizaron cobros ni migraciones en esta sesión.
- Revisar contenido legal bilingüe profesionalmente antes de producción, sin confundir traducción con asesoría legal.

### Verificación de esta actualización

- `npm test`: 5 pruebas aprobadas (datos bilingües, API, localización, flujo educativo/mode Fácil e idioma/restauración). `npm run check` y `git diff --check` aprobados.
- Comparación con `HEAD`: los 17 originales conservan exactamente IDs, fechas, nombres y pistas. Se comprobaron textos visibles de todas las páginas para detectar traducciones faltantes.
- Pruebas sobre JSON temporal, con PostgreSQL desactivado; no se modificaron `.env`, datos reales ni la copia antigua durante esta adaptación. No hubo cobros ni migraciones.
- Navegador de escritorio desconectado: no se realizó revisión visual/móvil real. La interfaz fue probada con DOM simulado. PostgreSQL y Mercado Pago requieren pruebas en entornos de prueba separados.
- Paginación: `npm test` aprobado (6 pruebas) y `npm run check` aprobado. Se verifican seis filas, página final, estado invitado, bloqueos, vacío, reapertura y traducciones. No se midió rendimiento ni se verificó visualmente en navegador real.
