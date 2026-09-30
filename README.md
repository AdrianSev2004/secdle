# SecDle v7

Juego diario educativo de ciberseguridad con seis pistas/intentos, modo Clásico/Fácil, invitados, cuentas, archivo Free/Plus y aprendizaje al terminar. Proyecto correcto: `C:\Users\Adrian\Desktop\secdle\secdle_project_v7`.

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

## Pagos y administración

Se conserva la integración existente Mercado Pago/Yape. Referencia visual USD 1.99 mensual / 19.99 anual; cargos reales PEN 7.90 / 79.90. Variables: `MP_ACCESS_TOKEN`, `MP_WEBHOOK_SECRET`, `MP_PLAN_MONTHLY_ID`, `MP_PLAN_ANNUAL_ID`. El servidor valida precios y cobros aprobados antes de activar Plus; la cancelación respeta el período pagado y el webhook verifica firmas.

`npm run check:mp` es el diagnóstico existente del proveedor; no ejecutarlo con credenciales reales sin autorización. `/admin` requiere `ADMIN_USER`/`ADMIN_PASSWORD`. No publicar secretos ni información de usuarios. Esta actualización no realiza cobros ni cambia la arquitectura de pagos.

## Verificación

```powershell
npm run check
npm test
```

Pruebas de datos, API e interfaz simulada: calendario, bilingüismo, acceso Free/Plus, acierto/fallo, educación, importación, reintento y modo Fácil. Fuerzan `DATABASE_URL` vacío y usan `STORE_PATH` temporal; nunca el JSON ni PostgreSQL reales. Revisión visual/móvil y pruebas del proveedor/SQL en entorno propio siguen siendo necesarias.

Leer `AGENTS.md` (cómo trabajar) y `MEMORY.md` (contexto entre sesiones) antes de ampliar el proyecto.
