# SecDle v7

Juego diario educativo de ciberseguridad con seis pistas/intentos, modo Clásico/Fácil, invitados, cuentas, archivo Free/Plus y aprendizaje al terminar. Proyecto correcto: `C:\Users\Adrian\Desktop\secdle\secdle_project_v7`.

## Sitio público

**https://secdle.onrender.com** · Soporte: **adriansg007@gmail.com**. En Render, `BASE_URL` debe ser `https://secdle.onrender.com` para enlaces de retorno y sitemap. La actualización no modifica `.env` ni configura Render automáticamente.

## Ejecutar

Requiere Node.js >=20. Desde la raíz:

```powershell
npm ci
npm start
```

Abrir `http://localhost:5500` (o el `PORT` configurado). `.env.example` contiene la plantilla; **no sobrescribir el `.env` existente**. Si 5500 está ocupado por la copia antigua, detener esa instancia identificada o configurar otro puerto y su `BASE_URL`.

## Persistencia

`db.js` mantiene la interfaz asíncrona de persistencia. Con `DATABASE_URL` usa PostgreSQL y el esquema `db/schema.sql`. Sin URL admite `data/store.json` solo en desarrollo; producción exige PostgreSQL. Respaldar los datos antes de migraciones. `npm run migrate` ejecuta la migración existente de JSON a PostgreSQL: no ejecutarla sin revisar y respaldar origen/destino.

Los casos educativos no se almacenan en PostgreSQL: allí se guarda el progreso asociado al `caseId`. No se requiere migración para añadir casos, educación o idiomas. Invitados mantienen progreso en `localStorage` (`secdle_guest_progress_v1`) y lo importan al iniciar sesión.

## Casos y aprendizaje

Contenido en `data/secdle_data.js`: `SECDLE_DATA.categories[].answers[].cases[]`. Cada caso tiene ID único, nombre, fecha ISO y seis pistas; la respuesta y alias se heredan de `answers[]`. Se conservaron los 17 originales hasta el 10/09/2026 y se añadieron 20 fechas del 11 al 30/09: 37 casos diarios sin huecos desde el 25/08.

Añadir un caso copiando el patrón de su respuesta/categoría, sin alterar fechas/IDs previos. Incluir `explanation`, `keySignals` y `whyNot` opcional; inglés: `nameEn`, `hintsEn`, `explanationEn`, `keySignalsEn`, `whyNotEn`. Los originales reciben estos metadatos de `CASE_LEARNING`, sin cambiar sus pistas. Escenarios ficticios, no incidentes reales atribuidos.

`flattenCases()` calcula niveles por fecha/ID; `caseForToday()` elige hoy o el último publicado. Free/invitado acceden a los cinco últimos, Plus vigente al archivo completo. Se mantienen Clásico/Fácil y seis intentos.

Al acertar o agotar seis intentos, un modal único muestra resultado, solución, explicación y señales. `Continuar` conserva el resultado; `Siguiente caso` busca otro pendiente accesible sin abrir futuros/bloqueados. Un fallo intermedio no revela la solución y los casos fallados siguen siendo reintentables.

El archivo `+Casos` muestra seis casos por página, con controles Anterior/Siguiente. Solo se renderiza la página visible; se mantienen orden, progreso, permisos y traducción. El modal limita su altura y mantiene la navegación fuera del área de scroll.

## Idiomas

Botón **EN/ES** en juego, páginas legales/informativas, administración y 404. Preferencia `secdle_lang` en localStorage. El juego restaura caso, modo y borrador tras cambiar. `public/i18n.js` traduce textos estáticos/dinámicos; las API aceptan `?lang=en` y mantienen español por defecto. IDs, respuestas válidas, fechas y progreso no se traducen.

## Tutorial, resultados e instalación

El juego se muestra directamente, sin bloque grande de presentación. `Cómo jugar` abre el tutorial; al cerrarlo se guarda `secdle_onboarding_seen` para no repetirlo automáticamente. El menú `Cuenta` contiene inicio de sesión, datos de cuenta, salida y acceso a Plus; Free/Plus se explica en el archivo y en la suscripción, sin interrumpir el juego.

Al terminar se puede compartir con la función nativa del navegador o copiar el resultado. Si no hay permiso de portapapeles, se muestra texto seleccionable. No se incluyen respuesta, pistas ni correo. Reportes y sugerencias usan enlaces de correo preparados a soporte; el usuario decide enviarlos. La recuperación de contraseña existente sigue siendo asistencia por correo, no un reset automático.

El botón `Instalar app` fue retirado por petición del usuario; la PWA sigue disponible mediante las opciones del navegador. Requiere HTTPS (o localhost); `sw.js` guarda únicamente recursos públicos y una página informativa sin conexión. Nunca guarda respuestas de API, administración o checkout. Jugar, acceder a la cuenta y pagar requieren Internet.

Frontend oscuro y minimalista en `public/game.css`, aplicado solo a `.game-page`: una tarjeta principal, pistas con indicador lateral, cabecera compacta, controles verdes y archivo simplificado. No se muestran tarjetas de estadísticas, presentación grande ni animaciones nuevas. Foco visible, enlace para saltar al caso y bloqueo de scroll al abrir modales. Las páginas legales/admin conservan sus estilos originales. Políticas revisadas para claridad y funcionalidades actuales; no sustituyen revisión legal profesional antes de publicidad.

## Repetir casos y rendimiento

Un caso completado sigue marcado «Correcto» en +Casos. Al abrirlo desde el archivo empieza una práctica con la primera pista y seis intentos, sin respuesta visible. Acertar o fallar en práctica no modifica el logro original, las rachas ni las estadísticas. Las cuentas validan intentos mediante `/api/cases/:level/practice/guess`; invitados usan la validación existente sin sobrescribir su progreso local. Free/Plus conserva sus restricciones. «Hoy» sigue mostrando el resultado guardado; no reinicia automáticamente.

La carga inicial solicita configuración, catálogo y cuenta en paralelo, y después el caso según la sesión. El servidor reutiliza el calendario y los índices de casos, el formateador de fecha y el progreso recién actualizado, evitando reconstrucciones y consultas repetidas. No se cachean pagos, sesiones ni respuestas privadas. Estas mejoras no garantizan eliminar demoras de red, PostgreSQL o arranque de Render; requieren medición aparte.

La prueba local usa un lanzador fuera del repositorio con almacenamiento temporal y pagos deshabilitados. No afecta a `npm start`, las credenciales del entorno ni la integración de Mercado Pago en Render.

## Pagos y administración

Mercado Pago es el único método de checkout ofrecido y aceptado. Yape no se presenta como alternativa independiente. Referencia visual USD 1.99 mensual / 19.99 anual; cargos reales PEN 7.90 / 79.90. Variables: `MP_ACCESS_TOKEN`, `MP_WEBHOOK_SECRET`, `MP_PLAN_MONTHLY_ID`, `MP_PLAN_ANNUAL_ID`. El servidor valida precios y cobros aprobados antes de activar Plus; la cancelación respeta el período pagado y el webhook verifica firmas.

`npm run check:mp` es el diagnóstico existente del proveedor; no ejecutarlo con credenciales reales sin autorización. `/admin` requiere `ADMIN_USER`/`ADMIN_PASSWORD`. No publicar secretos ni información de usuarios. Esta actualización no realiza cobros ni cambia la arquitectura de pagos.

## Verificación

Search Console: conservar `public/google4db076e43a3df2c4.html`. Tras desplegar, comprobar `https://secdle.onrender.com/google4db076e43a3df2c4.html`, pulsar Verificar en Google y enviar `https://secdle.onrender.com/sitemap.xml`. Verificar propiedad no garantiza indexación inmediata.

```powershell
npm run check
npm test
```

Pruebas de datos, API e interfaz simulada: calendario, bilingüismo, acceso Free/Plus, acierto/fallo, educación, importación, reintento y modo Fácil. Fuerzan `DATABASE_URL` vacío y usan `STORE_PATH` temporal; nunca el JSON ni PostgreSQL reales. Revisión visual/móvil y pruebas del proveedor/SQL en entorno propio siguen siendo necesarias.

Rediseño: 9 pruebas aprobadas y revisión en Edge headless con perfil/servidor/almacén temporales. Anchos 320, 390, 768 y 1280 px sin desbordamiento horizontal y con envío visible en primera pantalla; comprobados ES/EN, modos, cuenta/Plus/ayuda, archivo, respuestas y práctica sin errores de JavaScript. No equivale a probar dispositivos físicos, lectores de pantalla o pagos productivos. Script y capturas fuera del repositorio.

**Importante en PowerShell:** asignar `$env:DATABASE_URL=''` puede eliminar la variable y hacer que dotenv cargue la URL real del `.env`. No usar esa asignación como garantía de aislamiento; verificar la configuración antes de arrancar. Las pruebas establecen el entorno explícitamente dentro de Node antes de cargar dotenv.

Leer `AGENTS.md` (cómo trabajar) y `MEMORY.md` (contexto entre sesiones) antes de ampliar el proyecto.
