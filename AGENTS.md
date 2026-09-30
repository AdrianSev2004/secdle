# Instrucciones para agentes — SecDle v7

## Diario de estudio

- Proyecto correcto: `C:\Users\Adrian\Desktop\secdle\secdle_project_v7`. No confundir con la copia en `Desktop\secdle_project_v7\secdle_project_v7`.
- Sitio público oficial: **https://secdle.onrender.com**. Soporte: **adriansg007@gmail.com**. Mantener canonical, enlaces para compartir y documentación coherentes con esta URL; no cambiar dominio sin confirmación.
- Leer este archivo y `MEMORY.md` al comenzar. Revisar primero los casos y el flujo real antes de ampliar contenido.
- Arquitectura: CommonJS/Express en `server.js`, persistencia asíncrona en `db.js`, PostgreSQL en producción y JSON solo en desarrollo, frontend vanilla en `public/`.
- Registrar en memoria decisiones, aprendizajes y resultados comprobados, sin copiar código completo.

## Restricciones obligatorias

- No sobrescribir cambios del usuario ni editar `node_modules`. Consultar `git status` antes de trabajar.
- No mostrar ni publicar `.env`, secretos, credenciales, sesiones, datos de usuarios o `data/store.json`.
- No ejecutar migraciones, inicializar PostgreSQL productivo ni realizar pagos reales para probar cambios. Pruebas: `DATABASE_URL` vacío, `NODE_ENV=test` y `STORE_PATH` temporal independiente.
- En PowerShell, asignar una variable de entorno a `''` puede eliminarla y permitir que dotenv la reponga desde `.env`. No asumir aislamiento: verificar `db.usingPostgres` antes de inicializar. Las pruebas establecen explícitamente el entorno dentro de Node.
- Conservar `db.js`, funciones asíncronas, modo Clásico/Fácil, importación de invitados y arquitectura de suscripciones. No reemplazar esta versión con la copia antigua.
- Casos en `categories[].answers[].cases[]`: ID único, fecha ISO válida y seis pistas progresivas. Respuesta/alias heredados del padre; no crear otro catálogo o sistema de preguntas.
- No cambiar IDs, fechas ni pistas previas: los niveles se calculan por fecha/ID y el progreso usa `caseId`.
- Nuevos casos con `explanation`, `keySignals`, `whyNot` opcional y variantes inglesas `nameEn`, `hintsEn`, `explanationEn`, `keySignalsEn`, `whyNotEn`. Casos originales usan metadatos `CASE_LEARNING` en el mismo archivo.
- Modal educativo único y reutilizable: textos desde datos, nunca condiciones por ID en el modal. Mostrar al acertar o agotar seis intentos, no revelar la solución durante `playing`.
- Mantener ES/EN en todas las páginas. UI en `public/i18n.js`; API `?lang=en`; IDs, respuestas, almacenamiento y reglas siguen siendo canónicos.
- Solo Mercado Pago como método de checkout; Yape no debe ofrecerse ni aceptarse como proveedor separado.
- Compartir resultados nunca debe revelar respuesta, pistas, correo o IDs de usuario. Reportes/sugerencias por `mailto:` a soporte, sin envío automático ni datos privados.
- No añadir animaciones de respuesta/racha: el usuario pidió retirarlas. Conservar efectos preexistentes ajenos a esta actualización.
- No restaurar las cuatro tarjetas inferiores de intentos/racha/mejor racha/plan. Conservar el bloque «Aprende ciberseguridad jugando», sin información repetida ni rediseño.
- Abrir un caso resuelto desde +Casos inicia práctica sin modificar progreso, rachas, métricas ni el estado «Correcto» del archivo. Mantener acceso Free/Plus y validar las respuestas en servidor.
- Service worker: caché solo de recursos públicos; excluir `/api/`, administración y retorno del checkout. No prometer juego ni pagos offline.
- Respetar Free/Plus, caducidad `plusUntil`, validación del cobro, firma del webhook, límites de solicitudes y comprobación de origen.
- Crear escenarios variados y técnicamente precisos. No inventar incidentes reales, fechas históricas ni atribuciones; pedir fuentes si se necesitan.

## Datos y fechas

- Calendario cubierto del 25/08/2026 al 30/09/2026: 37 casos; se conservaron los 17 anteriores y se agregaron 20 desde el 11/09.
- Zona: `America/Lima`; fechas `YYYY-MM-DD`. Caso diario o último publicado si falta el de hoy.
- Free e invitados: cinco últimos publicados. Plus vigente: todos los publicados. Nunca abrir futuros.
- Antes de ampliar, comparar la fecha actual y cubrir cada día faltante cuando esté autorizado; no duplicar situaciones.
- Precios existentes: referencia USD 1.99/19.99 y cobro PEN 7.90/79.90. No cambiar contratos ni moneda al traducir.

## Verificación

- Node >=20. Instalación `npm ci`, sintaxis `npm run check`, pruebas `npm test`, arranque `npm start`.
- Pruebas no deben conectarse a PostgreSQL ni alterar JSON real. Usar archivos temporales y eliminarlos al finalizar.
- Verificar IDs, fechas sin huecos, seis pistas, educación y traducciones completas.
- Recorrido: caso → intento erróneo intermedio sin solución → acierto/fallo final → explicación → continuar/siguiente → reintento.
- Probar invitado/cuenta, importación, Free/Plus, ambos idiomas, ambos modos y ausencia de siguientes accesibles.
- Revisar móvil, teclado y consola en navegador real cuando esté disponible. Informar limitaciones, no afirmar pruebas no realizadas.
- No confundir pruebas de rendimiento de funciones aisladas con velocidad de Render: medir red/SQL en un entorno autorizado antes de atribuir demoras a producción.
- Mantener `README.md` y `MEMORY.md` actualizados con resultados verificables y pendientes.
