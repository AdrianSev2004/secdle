// ============================================================
// SecDle - Base de datos de respuestas y casos
// ============================================================
// Para agregar un caso nuevo:
// 1) Busca la categoria.
// 2) Busca la respuesta.
// 3) Dentro de "cases", copia un caso existente.
// 4) Cambia id, name y las 6 pistas.
// ============================================================

const SECDLE_DATA = {
  categories: [
    {
      name: "Vulnerabilidades web",
      answers: [
        {
          name: "SQL Injection",
          aliases: ["sql injection", "sqli", "inyeccion sql", "inyección sql"],
          cases: [
            {
              id: "sql-injection-a",
              name: "Caso A",
              releaseDate: "2026-08-25",
              hints: [
                "Al usar una aplicación web que utilizas habitualmente, empiezas a notar que algunos datos de tu cuenta aparecen modificados sin que tú hayas realizado cambios.",
                "Poco después, observas que información que debería pertenecer únicamente a tu usuario parece haberse mezclado con registros de otras personas.",
                "Al intentar iniciar sesión o realizar búsquedas, la página comienza a mostrar errores relacionados con la base de datos.",
                "El administrador te informa que alguien consiguió consultar y modificar registros almacenados en la base de datos sin contar con los permisos necesarios.",
                "Al revisar el incidente, descubres que el atacante utilizó campos normales de la página, como el inicio de sesión o el buscador, para introducir texto especialmente manipulado.",
                "Te explican que ese texto consiguió alterar las consultas que la aplicación enviaba a su base de datos SQL."
              ]
            }
          ]
        },
        {
          name: "Cross-Site Scripting (XSS)",
          aliases: ["xss", "cross site scripting"],
          cases: [
            {
              id: "xss-a",
              name: "Caso A",
              releaseDate: "2026-09-01",
              hints: [
                "Visitas una página web conocida y, sin motivo aparente, empiezan a aparecer ventanas emergentes o mensajes extraños mientras navegas por ella.",
                "El comportamiento inusual solo ocurre en ciertas secciones de la página, como comentarios, búsquedas o perfiles de usuario.",
                "Otros usuarios que visitan esa misma sección también informan de comportamientos extraños en su navegador.",
                "Un administrador descubre que el contenido problemático fue insertado por otro usuario a través de un campo de texto normal de la página, como un comentario.",
                "El navegador de las víctimas ejecutó ese contenido como si fuera parte legítima de la página, sin que el usuario lo solicitara.",
                "El atacante consiguió inyectar código JavaScript malicioso que se ejecutó en el navegador de otros usuarios que visitaron la página afectada."
              ]
            }
          ]
        },
        { name: "Cross-Site Request Forgery (CSRF)", aliases: ["csrf", "cross site request forgery"], cases: [{id:"csrf-a",name:"Cambio sin consentimiento",nameEn:"Change without consent",releaseDate:"2026-09-11",hints:["Tu dirección de entrega cambia sin autorización.","La sesión de la tienda seguía abierta.","Acababas de visitar un sitio externo.","Ese sitio indujo una petición desde tu navegador a la tienda.","Se adjuntaron cookies de sesión sin comprobar un token antifalsificación.","Una página externa provocó una acción autenticada sin tu consentimiento."],hintsEn:["Your delivery address changes without authorization.","Your store session was still open.","You had just visited an external site.","That site induced a request from your browser to the store.","Session cookies were attached without checking an anti-forgery token.","An external page triggered an authenticated action without your consent."],explanation:"Se acepta una petición autenticada inducida desde otro sitio sin verificar que la autorizaste.",explanationEn:"An authenticated request induced by another site is accepted without verifying your authorization.",keySignals:["Sesión activa","Petición inducida","Falta de protección antifalsificación"],keySignalsEn:["Active session","Induced request","Missing anti-forgery protection"],whyNot:["No requiere robar la sesión como Session Hijacking."],whyNotEn:["It does not require stealing the session as Session Hijacking does."]}] },
        { name: "Server-Side Request Forgery (SSRF)", aliases: ["ssrf", "server side request forgery"], cases: [{id:"ssrf-a",name:"Importador de imágenes",nameEn:"Image importer",releaseDate:"2026-09-12",hints:["Un importador acepta direcciones de imágenes.","Una dirección devuelve contenido que no es una imagen.","El contenido pertenece a un servicio privado.","La petición sale del servidor de la aplicación.","Un usuario eligió el destino interno sin controles adecuados.","El servidor fue inducido a consultar recursos internos mediante una URL manipulada."],hintsEn:["An importer accepts image URLs.","One URL returns content that is not an image.","The content belongs to a private service.","The request comes from the application server.","A user chose the internal destination without adequate controls.","A crafted URL induced the server to request internal resources."],explanation:"El usuario controla el destino de una petición del servidor y alcanza recursos internos.",explanationEn:"The user controls the destination of a server request and reaches internal resources.",keySignals:["URL controlable","Petición del servidor","Destino interno"],keySignalsEn:["Controllable URL","Server-side request","Internal destination"],whyNot:["CSRF induce peticiones del navegador, no del servidor."],whyNotEn:["CSRF induces browser requests, not server requests."]}] },
        { name: "Command Injection", aliases: [], cases: [{id:"command-injection-a",name:"Diagnóstico alterado",nameEn:"Altered diagnostic",releaseDate:"2026-09-13",hints:["Una herramienta comprueba conectividad.","Ciertas entradas crean archivos inesperados.","La actividad no corresponde al diagnóstico.","La entrada se concatena en una orden del sistema.","Separadores especiales permiten añadir otra orden.","La entrada hace ejecutar comandos de shell adicionales."],hintsEn:["A tool checks connectivity.","Certain inputs create unexpected files.","The activity does not match the diagnostic task.","Input is concatenated into a system command.","Special separators allow another command to be added.","Input causes additional shell commands to run."],explanation:"Entrada no segura dentro de una orden de shell permite añadir comandos.",explanationEn:"Unsafe input in a shell command allows additional commands.",keySignals:["Orden de sistema","Entrada concatenada","Comandos adicionales"],keySignalsEn:["System command","Concatenated input","Additional commands"],whyNot:["SQL Injection afecta consultas SQL."],whyNotEn:["SQL Injection targets SQL queries."]}] },
        { name: "Path Traversal", aliases: ["directory traversal"], cases: [{id:"path-traversal-a",name:"Descarga fuera de carpeta",nameEn:"Download outside the folder",releaseDate:"2026-09-14",hints:["Un enlace descarga un documento.","Cambiar la ruta devuelve otro archivo.","El archivo no está en la carpeta pública.","El servidor usa la ruta del usuario.","Segmentos de directorio padre permiten salir de la carpeta.","Una ruta manipulada accede a archivos fuera del directorio permitido."],hintsEn:["A link downloads a document.","Changing the path returns another file.","The file is not in the public folder.","The server uses the user's path.","Parent-directory segments allow leaving the folder.","A crafted path accesses files outside the permitted directory."],explanation:"La ruta no queda restringida al directorio autorizado y recorre otras carpetas.",explanationEn:"The path is not restricted to the authorized directory and traverses other folders.",keySignals:["Ruta controlable","Escape de carpeta","Lectura de archivos"],keySignalsEn:["Controllable path","Directory escape","File reading"],whyNot:["IDOR cambia referencias a objetos, no recorre carpetas."],whyNotEn:["IDOR changes object references rather than traversing folders."]}] },
        { name: "Local File Inclusion", aliases: ["lfi"], cases: [] },
        { name: "Remote File Inclusion", aliases: ["rfi"], cases: [] },
        { name: "XML External Entity (XXE)", aliases: ["xxe"], cases: [{id:"xxe-a",name:"Importación XML",nameEn:"XML import",releaseDate:"2026-09-15",hints:["Un servicio importa documentos XML.","Una importación devuelve contenido inesperado.","El contenido pertenece a un archivo local.","El documento define una entidad externa.","El analizador la resuelve usando recursos del servidor.","Una entidad XML externa provoca la lectura de un archivo del servidor."],hintsEn:["A service imports XML documents.","An import returns unexpected content.","The content belongs to a local file.","The document defines an external entity.","The parser resolves it using server resources.","An external XML entity causes a server file to be read."],explanation:"El analizador resuelve entidades externas y expone recursos privados.",explanationEn:"The parser resolves external entities and exposes private resources.",keySignals:["XML","Entidad externa","Resolución insegura"],keySignalsEn:["XML","External entity","Unsafe resolution"],whyNot:["La señal específica es la entidad XML."],whyNotEn:["The specific sign is the XML entity."]}] },
        { name: "Open Redirect", aliases: [], cases: [{id:"open-redirect-a",name:"Destino de retorno",nameEn:"Return destination",releaseDate:"2026-09-16",hints:["Un enlace empieza con un dominio legítimo.","Al abrirlo llegas a una web desconocida.","El destino está en un parámetro.","Cambiarlo permite elegir cualquier dominio.","El servicio no valida destinos de redirección.","Un sitio legítimo redirige a una URL externa arbitraria del atacante."],hintsEn:["A link starts with a legitimate domain.","It takes you to an unfamiliar website.","The destination is in a parameter.","Changing it lets you choose any domain.","The service does not validate redirect destinations.","A legitimate site redirects to an arbitrary external URL controlled by the attacker."],explanation:"El destino de redirección no se limita a ubicaciones seguras.",explanationEn:"The redirect destination is not restricted to safe locations.",keySignals:["Dominio inicial legítimo","Destino controlable","Redirección arbitraria"],keySignalsEn:["Legitimate starting domain","Controllable destination","Arbitrary redirect"],whyNot:["No se ejecuta un script como en XSS."],whyNotEn:["No script executes as in XSS."]}] },
        { name: "Insecure File Upload", aliases: [], cases: [] },
        { name: "Prototype Pollution", aliases: [], cases: [] },
        {
          name: "IDOR",
          aliases: ["insecure direct object reference"],
          cases: [
            {
              id: "idor-a",
              name: "Caso A",
              releaseDate: "2026-09-02",
              hints: [
                "Un usuario nota que, cambiando ligeramente la dirección de una página en la que ya había iniciado sesión, puede ver información que no le pertenece.",
                "El sistema no le pide ninguna autorización adicional para acceder a ese contenido ajeno.",
                "Al probar con distintos números o identificadores en la URL, consigue ver documentos, pedidos o perfiles de otras cuentas.",
                "El desarrollador confirma que la aplicación no verificaba si el usuario autenticado tenía permiso sobre el recurso solicitado.",
                "El fallo se debía a que la aplicación confiaba directamente en un identificador visible, como un número de pedido, enviado desde el navegador.",
                "Al modificar ese identificador en la petición, cualquier usuario autenticado podía acceder a objetos o registros que pertenecían a otras cuentas sin autorización."
              ]
            }
          ]
        }
      ]
    },

    {
      name: "Credenciales",
      answers: [
        {
          name: "Brute Force",
          aliases: ["fuerza bruta", "bruteforce"],
          cases: [
            {
              id: "brute-force-a",
              name: "Caso A",
              releaseDate: "2026-08-26",
              hints: [
                "Recibes varias notificaciones de intentos de inicio de sesión que no reconoces.",
                "Los avisos continúan apareciendo durante un periodo corto de tiempo aunque tú no estés intentando acceder a tu cuenta.",
                "Tu cuenta termina bloqueándose temporalmente debido a una gran cantidad de contraseñas incorrectas introducidas.",
                "Al revisar la actividad, observas decenas o cientos de intentos contra tu mismo nombre de usuario.",
                "Los intentos prueban muchas contraseñas diferentes de manera repetitiva hasta encontrar una que funcione.",
                "Finalmente recibes una alerta de inicio de sesión exitoso después de una enorme cantidad de intentos fallidos consecutivos contra tu contraseña."
              ]
            }
          ]
        },
        { name: "Dictionary Attack", aliases: [], cases: [{id:"dictionary-attack-a",name:"Lista de palabras",nameEn:"Word list",releaseDate:"2026-09-17",hints:["Una cuenta recibe muchos intentos fallidos.","Los candidatos no parecen aleatorios.","Son palabras y expresiones habituales.","Proceden de una lista preparada.","La lista incluye contraseñas frecuentes y variaciones.","Se prueban candidatos de un diccionario en lugar de todas las combinaciones posibles."],hintsEn:["One account receives many failed attempts.","The candidates do not look random.","They are common words and expressions.","They come from a prepared list.","The list contains frequent passwords and variations.","Dictionary candidates are tried rather than every possible combination."],explanation:"Una lista de contraseñas probables reduce el espacio de búsqueda.",explanationEn:"A list of likely passwords reduces the search space.",keySignals:["Lista preparada","Palabras comunes","Candidatos probables"],keySignalsEn:["Prepared list","Common words","Likely candidates"],whyNot:["Es una modalidad de adivinación; el diccionario la distingue de búsqueda exhaustiva."],whyNotEn:["This is a form of guessing; the dictionary distinguishes it from exhaustive search."]}] },
        { name: "Password Spraying", aliases: [], cases: [{id:"password-spraying-a",name:"Una contraseña, muchas cuentas",nameEn:"One password, many accounts",releaseDate:"2026-09-18",hints:["Muchas cuentas reciben pocos intentos extraños.","Ninguna se bloquea enseguida.","Los intentos se reparten entre usuarios.","La contraseña candidata se repite.","Se espera antes de probar otra contraseña común.","Pocas contraseñas frecuentes se prueban contra muchos usuarios para evitar bloqueos."],hintsEn:["Many accounts receive a few unusual attempts.","None is locked immediately.","Attempts are spread across users.","The candidate password is repeated.","The attacker waits before trying another common password.","A few common passwords are tried against many users to avoid lockouts."],explanation:"Se distribuyen pocas contraseñas comunes entre muchas cuentas.",explanationEn:"A few common passwords are spread across many accounts.",keySignals:["Muchos usuarios","Pocas contraseñas","Intentos espaciados"],keySignalsEn:["Many users","Few passwords","Spaced attempts"],whyNot:["Brute Force concentra contraseñas en una cuenta."],whyNotEn:["Brute Force concentrates passwords on one account."]}] },
        {
          name: "Credential Stuffing",
          aliases: [],
          cases: [
            {
              id: "credential-stuffing-a",
              name: "Caso A",
              releaseDate: "2026-09-03",
              hints: [
                "De repente, varias cuentas que tienes en distintos servicios online muestran accesos que tú no realizaste.",
                "Curiosamente, usas la misma contraseña en varios de esos servicios.",
                "El equipo de seguridad de uno de los servicios te informa que tu combinación de correo y contraseña fue expuesta en una filtración de datos de otra empresa, meses atrás.",
                "Los inicios de sesión no autorizados ocurrieron de forma automatizada, probando tus credenciales en múltiples plataformas distintas en poco tiempo.",
                "El atacante no necesitó adivinar tu contraseña: ya la conocía gracias a una base de datos filtrada previamente en otro sitio.",
                "Se utilizaron listas de pares de usuario y contraseña obtenidos de filtraciones anteriores para iniciar sesión automáticamente en muchos servicios donde las víctimas reutilizaban esas mismas credenciales."
              ]
            }
          ]
        },
        { name: "Rainbow Table Attack", aliases: [], cases: [] },
        { name: "Credential Dumping", aliases: [], cases: [{id:"credential-dumping-a",name:"Secretos extraídos",nameEn:"Extracted secrets",releaseDate:"2026-09-19",hints:["Tras comprometer un equipo aparecen accesos a otras cuentas.","No hay formularios falsos ni intentos masivos.","Una herramienta lee áreas sensibles del sistema.","Extrae datos de autenticación almacenados.","Entre ellos hay hashes o secretos.","Se obtienen credenciales desde memoria o almacenes del equipo comprometido."],hintsEn:["Access to other accounts follows a computer compromise.","There are no fake forms or mass guessing attempts.","A tool reads sensitive system areas.","It extracts stored authentication data.","These include hashes or secrets.","Credentials are obtained from memory or stores on the compromised computer."],explanation:"Se extraen credenciales almacenadas en un sistema comprometido.",explanationEn:"Stored credentials are extracted from a compromised system.",keySignals:["Equipo comprometido","Almacenes sensibles","Extracción de secretos"],keySignalsEn:["Compromised computer","Sensitive stores","Secret extraction"],whyNot:["Keylogger registra pulsaciones nuevas."],whyNotEn:["A Keylogger records new keystrokes."]}] }
      ]
    },

    {
      name: "Autenticación y sesiones",
      answers: [
        {
          name: "Session Hijacking",
          aliases: ["secuestro de sesion", "secuestro de sesión"],
          cases: [
            {
              id: "session-hijacking-a",
              name: "Caso A",
              releaseDate: "2026-08-27",
              hints: [
                "Estás utilizando normalmente una página en la que ya habías iniciado sesión cuando notas actividad extraña en tu cuenta.",
                "Aparecen acciones realizadas desde tu cuenta aunque tú no has vuelto a introducir tu contraseña.",
                "Mientras sigues conectado, otra persona parece poder utilizar tu cuenta al mismo tiempo.",
                "La actividad sospechosa ocurre sin que recibas avisos de un nuevo inicio de sesión con usuario y contraseña.",
                "Después del incidente, descubres que alguien obtuvo el identificador que mantenía abierta tu sesión en la página.",
                "El atacante utilizó tu sesión autenticada ya existente para hacerse pasar por ti sin necesidad de conocer tu contraseña."
              ]
            }
          ]
        },
        {
          name: "Session Fixation",
          aliases: [],
          cases: [
            {
              id: "session-fixation-a",
              name: "Caso A",
              releaseDate: "2026-09-04",
              hints: [
                "Un usuario recibe un enlace de un compañero para acceder a un sistema interno y, tras iniciar sesión con normalidad, algo extraño ocurre poco después.",
                "Otra persona parece tener acceso a la cuenta del usuario casi al mismo tiempo, sin haber introducido usuario ni contraseña.",
                "Al investigar, se descubre que el identificador de sesión utilizado tras el inicio de sesión ya existía antes de que el usuario iniciara sesión.",
                "El enlace que recibió el usuario contenía ya incluido un identificador de sesión específico, definido de antemano por otra persona.",
                "El sistema no generaba un nuevo identificador de sesión después de que el usuario se autenticara, sino que reutilizaba el que ya traía la URL.",
                "Un atacante fijó previamente el identificador de sesión y consiguió acceder a la cuenta de la víctima en cuanto esta inició sesión utilizando ese mismo identificador ya conocido."
              ]
            }
          ]
        },
        { name: "Authentication Bypass", aliases: [], cases: [] },
        { name: "Replay Attack", aliases: [], cases: [{id:"replay-attack-a",name:"Orden repetida",nameEn:"Repeated command",releaseDate:"2026-09-20",hints:["Una operación válida se ejecuta otra vez sin nueva orden.","Los registros contienen dos mensajes iguales.","Ambos conservan la firma original.","El segundo es una copia capturada del primero.","No se comprueba un nonce ni el uso previo.","Una petición autenticada se reenvía intacta y se acepta de nuevo."],hintsEn:["A valid operation runs again without a new instruction.","Logs contain two identical messages.","Both retain the original signature.","The second is a captured copy of the first.","Neither a nonce nor prior use is checked.","An authenticated request is resent unchanged and accepted again."],explanation:"Se reutiliza un mensaje válido porque falta comprobar su frescura o uso previo.",explanationEn:"A valid message is reused because freshness or previous use is not checked.",keySignals:["Mensaje capturado","Reenvío intacto","Sin control antirrepetición"],keySignalsEn:["Captured message","Unchanged resend","No anti-replay check"],whyNot:["No hace falta descifrar el mensaje."],whyNotEn:["The message need not be decrypted."]}] }
      ]
    },

    {
      name: "Ingeniería social",
      answers: [
        {
          name: "Phishing",
          aliases: [],
          cases: [
            {
              id: "phishing-a",
              name: "Caso A",
              releaseDate: "2026-08-28",
              hints: [
                "Recibes un mensaje aparentemente importante de una empresa o servicio que utilizas habitualmente.",
                "El mensaje te advierte de un problema urgente con tu cuenta y te pide realizar una acción rápidamente.",
                "Pulsas el enlace incluido y llegas a una página visualmente muy parecida a la página oficial del servicio.",
                "La página te solicita tu correo electrónico y contraseña para supuestamente verificar tu identidad.",
                "Poco después de introducir tus datos, recibes alertas de accesos a tu cuenta desde dispositivos que no reconoces.",
                "Descubres que el mensaje y la página eran falsos y habían sido creados específicamente para engañarte y obtener tus credenciales."
              ]
            }
          ]
        },
        {
          name: "Spear Phishing",
          aliases: [],
          cases: [
            {
              id: "spear-phishing-a",
              name: "Caso A",
              releaseDate: "2026-09-05",
              hints: [
                "Un empleado recibe un correo que parece dirigido específicamente a él, mencionando detalles que solo alguien cercano a la empresa debería conocer.",
                "El mensaje hace referencia a un proyecto real en el que el empleado está trabajando actualmente.",
                "El remitente parece ser un compañero o superior conocido, aunque la dirección de correo presenta pequeñas diferencias respecto a la habitual.",
                "El correo solicita con urgencia que el empleado descargue un archivo adjunto o acceda a un enlace relacionado con ese proyecto.",
                "La información utilizada para personalizar el mensaje fue recopilada previamente sobre esa persona y su entorno laboral, probablemente desde redes sociales o la web corporativa.",
                "Se trató de un ataque de phishing dirigido específicamente a esa persona, utilizando información personalizada para aumentar la credibilidad del engaño."
              ]
            }
          ]
        },
        { name: "Whaling", aliases: [], cases: [] },
        { name: "Smishing", aliases: [], cases: [{id:"smishing-a",name:"SMS de entrega",nameEn:"Delivery SMS",releaseDate:"2026-09-21",hints:["Recibes un aviso sobre un paquete.","Llega por SMS.","Pide corregir la dirección urgentemente.","El enlace abre una página de mensajería falsa.","Solicita datos bancarios para una pequeña tasa.","Un SMS suplantado roba información mediante un enlace engañoso."],hintsEn:["You receive a notice about a parcel.","It arrives by SMS.","It urgently asks you to correct the address.","The link opens a fake delivery-company page.","It requests bank details for a small fee.","An impersonating SMS steals information through a deceptive link."],explanation:"El engaño llega por SMS y busca datos sensibles.",explanationEn:"The deception arrives by SMS and seeks sensitive data.",keySignals:["SMS","Enlace falso","Petición de datos"],keySignalsEn:["SMS","Fake link","Request for data"],whyNot:["Vishing utiliza voz."],whyNotEn:["Vishing uses voice."]}] },
        {
          name: "Vishing",
          aliases: [],
          cases: [
            {
              id: "vishing-a",
              name: "Caso A",
              releaseDate: "2026-09-06",
              hints: [
                "Recibes una llamada telefónica inesperada relacionada con un servicio que utilizas habitualmente, como tu banco.",
                "La persona que llama transmite urgencia, indicando que existe un problema grave con tu cuenta.",
                "Durante la llamada, te piden confirmar cierta información personal para \"verificar tu identidad\".",
                "El número desde el que te llaman parece coincidir, o ser muy similar, con el número oficial de la entidad.",
                "Te das cuenta después de que la entidad real nunca solicita ese tipo de información sensible por teléfono.",
                "Se trató de un engaño realizado a través de una llamada telefónica, diseñado para manipularte y obtener información confidencial haciéndose pasar por una entidad legítima."
              ]
            }
          ]
        },
        { name: "Baiting", aliases: [], cases: [{id:"baiting-a",name:"Memoria encontrada",nameEn:"Found USB drive",releaseDate:"2026-09-22",hints:["Encuentras una memoria USB junto a la oficina.","Su etiqueta promete contenido interesante.","Alguien la conecta por curiosidad.","Abre el archivo ofrecido.","Ese archivo instala software malicioso.","Un señuelo atractivo induce a ejecutar contenido peligroso."],hintsEn:["You find a USB drive near the office.","Its label promises interesting content.","Someone connects it out of curiosity.","They open the offered file.","That file installs malicious software.","An attractive lure induces execution of dangerous content."],explanation:"Un señuelo despierta curiosidad para provocar una acción insegura.",explanationEn:"A lure sparks curiosity to induce an unsafe action.",keySignals:["Señuelo","Curiosidad","Acción inducida"],keySignalsEn:["Lure","Curiosity","Induced action"],whyNot:["La USB no necesita ejecutarse sola."],whyNotEn:["The USB drive need not run automatically."]}] },
        { name: "Pretexting", aliases: [], cases: [] },
        { name: "Tailgating", aliases: [], cases: [{id:"tailgating-a",name:"Puerta compartida",nameEn:"Shared doorway",releaseDate:"2026-09-23",hints:["Una persona llega a una puerta restringida.","Espera a un empleado con tarjeta.","Se coloca detrás del empleado.","Entra antes de que cierre la puerta.","Nunca muestra su propia credencial.","Accede a una zona protegida siguiendo físicamente a alguien autorizado."],hintsEn:["A person approaches a restricted door.","They wait for an employee with an access card.","They stand behind the employee.","They enter before the door closes.","They never show their own credential.","They enter a protected area by physically following an authorized person."],explanation:"Se aprovecha la entrada de un autorizado para eludir el control físico.",explanationEn:"An authorized person's entry is used to evade physical access control.",keySignals:["Acceso físico","Seguir a un autorizado","Sin credencial propia"],keySignalsEn:["Physical access","Following an authorized person","No personal credential"],whyNot:["No se ataca una contraseña sino una barrera física."],whyNotEn:["A physical barrier is bypassed, not a password."]}] }
      ]
    },

    {
      name: "Redes",
      answers: [
        {
          name: "Man-in-the-Middle",
          aliases: ["mitm", "man in the middle"],
          cases: [
            {
              id: "mitm-a",
              name: "Caso A",
              releaseDate: "2026-08-29",
              hints: [
                "Te conectas a una red y notas que algunas páginas funcionan de manera extraña o tardan más de lo habitual en cargar.",
                "Durante la navegación empiezas a recibir avisos inesperados relacionados con la seguridad o los certificados de algunas páginas.",
                "Después de utilizar esa red, detectas actividad en algunas de tus cuentas que tú no realizaste.",
                "Descubres que parte de la información que enviabas y recibías mientras navegabas podía estar siendo observada por otra persona.",
                "Te explican que tus comunicaciones no estaban viajando directamente entre tu dispositivo y el servicio al que intentabas acceder.",
                "Había un atacante situado en medio de la comunicación, interceptando y potencialmente modificando los datos enviados entre ambas partes."
              ]
            }
          ]
        },
        { name: "ARP Spoofing", aliases: [], cases: [{id:"arp-spoofing-a",name:"Gateway suplantado",nameEn:"Impersonated gateway",releaseDate:"2026-09-24",hints:["El tráfico local toma un camino inesperado.","Cambia la dirección física del gateway en varios equipos.","Un dispositivo anuncia ser el router.","Envía mensajes ARP falsos.","Asocia la IP del gateway con su propia MAC.","Tablas ARP manipuladas dirigen el tráfico al dispositivo atacante."],hintsEn:["Local traffic takes an unexpected path.","The gateway's physical address changes on several computers.","A device claims to be the router.","It sends false ARP messages.","It associates the gateway IP with its own MAC address.","Manipulated ARP tables direct traffic to the attacker's device."],explanation:"Mensajes ARP falsos vinculan una IP legítima con la MAC atacante.",explanationEn:"False ARP messages link a legitimate IP with the attacker's MAC address.",keySignals:["Red local","Asociación IP-MAC falsa","Tablas ARP alteradas"],keySignalsEn:["Local network","False IP-to-MAC mapping","Altered ARP tables"],whyNot:["Puede facilitar MITM; ARP Spoofing identifica el mecanismo."],whyNotEn:["It can enable MITM; ARP Spoofing identifies the mechanism."]}] },
        {
          name: "DNS Poisoning",
          aliases: ["dns spoofing"],
          cases: [
            {
              id: "dns-poisoning-a",
              name: "Caso A",
              releaseDate: "2026-09-07",
              hints: [
                "Al intentar acceder a una página web que usas habitualmente, terminas en un sitio distinto que no reconoces del todo.",
                "La dirección que escribiste en el navegador era correcta, pero el contenido mostrado no corresponde con la página real.",
                "Varios usuarios de la misma red reportan el mismo problema al intentar acceder a esa página.",
                "Al revisar la resolución de nombres, se detecta que la dirección IP asociada al dominio no corresponde con la IP legítima del servicio.",
                "Se descubre que la información almacenada en el servidor o caché DNS había sido alterada para apuntar a un servidor controlado por un atacante.",
                "Un atacante logró corromper los registros de resolución DNS, haciendo que las peticiones hacia un dominio legítimo fueran redirigidas hacia una dirección IP maliciosa."
              ]
            }
          ]
        },
        { name: "SYN Flood", aliases: [], cases: [] },
        {
          name: "DDoS",
          aliases: ["distributed denial of service"],
          cases: [
            {
              id: "ddos-a",
              name: "Caso A",
              releaseDate: "2026-09-08",
              hints: [
                "Los usuarios de un sitio web reportan que la página tarda demasiado en cargar o directamente no responde.",
                "El equipo técnico observa un aumento inusual y repentino de tráfico dirigido al servidor.",
                "El tráfico proviene de miles de direcciones IP diferentes distribuidas por todo el mundo, no de una sola fuente.",
                "Los servidores no logran procesar todas las solicitudes entrantes y comienzan a saturarse hasta dejar de responder.",
                "Se confirma que gran parte de ese tráfico provenía de dispositivos comprometidos que actuaban coordinadamente sin que sus dueños lo supieran.",
                "Un atacante utilizó una red de dispositivos distribuidos para saturar intencionalmente los recursos del servidor y dejar el servicio inaccesible para los usuarios legítimos."
              ]
            }
          ]
        },
        { name: "Packet Sniffing", aliases: [], cases: [{id:"packet-sniffing-a",name:"Tráfico observado",nameEn:"Observed traffic",releaseDate:"2026-09-25",hints:["Un tercero conoce información enviada por la red.","Las comunicaciones no muestran cambios.","Un equipo captura paquetes visibles en su segmento.","Parte del tráfico no estaba cifrado.","El observador lee datos sin modificar mensajes.","Se capturan y examinan paquetes de forma pasiva."],hintsEn:["A third party knows information sent over the network.","Communications show no changes.","A computer captures packets visible on its segment.","Some traffic was unencrypted.","The observer reads data without modifying messages.","Packets are captured and examined passively."],explanation:"Se observan paquetes y se lee su contenido si no está cifrado.",explanationEn:"Packets are observed and their contents read when unencrypted.",keySignals:["Captura de paquetes","Observación pasiva","Datos sin cifrar"],keySignalsEn:["Packet capture","Passive observation","Unencrypted data"],whyNot:["MITM implica interponerse; este caso describe observación."],whyNotEn:["MITM involves interposing between parties; this case describes observation."]}] },
        { name: "Evil Twin", aliases: [], cases: [{id:"evil-twin-a",name:"Wi-Fi duplicada",nameEn:"Duplicate Wi-Fi",releaseDate:"2026-09-26",hints:["Ves la Wi-Fi habitual del local.","La señal parece más intensa.","Hay dos puntos de acceso con el mismo nombre.","Uno no pertenece al establecimiento.","El atacante imita el nombre para atraer conexiones.","Una Wi-Fi falsa suplanta una red conocida."],hintsEn:["You see the venue's usual Wi-Fi network.","The signal seems stronger.","Two access points share the same name.","One does not belong to the venue.","The attacker copies the name to attract connections.","A fake Wi-Fi network impersonates a known network."],explanation:"Una red falsa copia la identidad visible de la legítima.",explanationEn:"A fake network copies the visible identity of a legitimate network.",keySignals:["SSID imitado","Punto de acceso falso","Red conocida suplantada"],keySignalsEn:["Copied SSID","Fake access point","Known network impersonated"],whyNot:["Rogue Access Point es más general."],whyNotEn:["Rogue Access Point is more general."]}] },
        { name: "Rogue Access Point", aliases: [], cases: [] }
      ]
    },

    {
      name: "Malware",
      answers: [
        {
          name: "Ransomware",
          aliases: [],
          cases: [
            {
              id: "ransomware-a",
              name: "Caso A",
              releaseDate: "2026-08-30",
              hints: [
                "Tu computadora empieza a comportarse de forma extraña y algunos archivos que utilizabas normalmente dejan de abrirse.",
                "Cada vez más documentos, fotografías y otros archivos personales se vuelven inaccesibles.",
                "Observas que muchos de tus archivos han cambiado de nombre o tienen extensiones que antes no existían.",
                "Aunque los archivos continúan almacenados en tu computadora, ningún programa parece poder abrirlos correctamente.",
                "Aparece un mensaje indicándote que tus archivos han sido cifrados.",
                "El mensaje exige que realices un pago para supuestamente recuperar el acceso a todos tus archivos."
              ]
            }
          ]
        },
        { name: "Trojan", aliases: ["trojan horse", "troyano"], cases: [{id:"trojan-a",name:"Utilidad impostora",nameEn:"Impostor utility",releaseDate:"2026-09-27",hints:["Descargas una supuesta herramienta útil.","La herramienta parece cumplir su función.","Después aparecen conexiones inesperadas.","El programa ejecuta acciones ocultas sin permiso.","El instalador disfrazó la carga maliciosa de software legítimo.","Un programa aparentemente benigno encubre funciones maliciosas para que lo ejecutes."],hintsEn:["You download a supposedly useful tool.","The tool appears to work.","Unexpected connections appear afterward.","The program performs hidden unauthorized actions.","The installer disguised a malicious payload as legitimate software.","An apparently benign program hides malicious functions to make you run it."],explanation:"El troyano se presenta como software legítimo para que la víctima lo ejecute.",explanationEn:"A Trojan presents itself as legitimate software to make the victim run it.",keySignals:["Apariencia útil","Ejecución por la víctima","Funciones maliciosas ocultas"],keySignalsEn:["Useful appearance","Execution by the victim","Hidden malicious functions"],whyNot:["Worm se define por propagarse autónomamente, no por disfrazarse."],whyNotEn:["A Worm is defined by autonomous spread, not by disguise."]}] },
        { name: "Worm", aliases: ["gusano"], cases: [{id:"worm-a",name:"Propagación autónoma",nameEn:"Autonomous spread",releaseDate:"2026-09-28",hints:["Varios equipos tienen la misma infección.","Nadie abrió archivos en los nuevos afectados.","Un infectado busca equipos vulnerables.","La infección se copia por la red.","No requiere un archivo anfitrión.","El malware se replica automáticamente sin intervención del usuario."],hintsEn:["Several computers have the same infection.","Nobody opened files on newly affected computers.","An infected computer searches for vulnerable machines.","The infection copies itself over the network.","It does not require a host file.","The malware replicates automatically without user intervention."],explanation:"Un gusano se propaga autónomamente, a menudo explotando servicios de red.",explanationEn:"A worm spreads autonomously, often exploiting network services.",keySignals:["Autorreplicación","Propagación por red","Sin archivo anfitrión"],keySignalsEn:["Self-replication","Network spread","No host file"],whyNot:["Un virus se asocia a un archivo o programa anfitrión."],whyNotEn:["A virus attaches to a host file or program."]}] },
        { name: "Virus", aliases: [], cases: [] },
        { name: "Spyware", aliases: [], cases: [] },
        {
          name: "Keylogger",
          aliases: [],
          cases: [
            {
              id: "keylogger-a",
              name: "Caso A",
              releaseDate: "2026-09-09",
              hints: [
                "Después de instalar un programa descargado de una fuente poco confiable, empiezas a notar comportamientos extraños en tu cuenta en distintos servicios.",
                "Aunque tu contraseña no ha sido reutilizada en ningún otro sitio, igualmente detectas accesos no autorizados.",
                "Un análisis del equipo revela la presencia de un proceso desconocido ejecutándose en segundo plano de forma continua.",
                "Ese proceso permanece activo incluso cuando no estás usando ningún navegador ni aplicación específica.",
                "Se descubre que el programa registraba de forma encubierta cada tecla pulsada en el teclado.",
                "Se trataba de malware diseñado específicamente para capturar y enviar a un atacante remoto todo lo que la víctima escribía, incluyendo contraseñas y datos sensibles."
              ]
            }
          ]
        },
        { name: "Rootkit", aliases: [], cases: [] },
        { name: "Botnet", aliases: [], cases: [] },
        { name: "Backdoor", aliases: ["puerta trasera"], cases: [] }
      ]
    },

    {
      name: "Explotación de sistemas",
      answers: [
        {
          name: "Buffer Overflow",
          aliases: ["desbordamiento de buffer", "desbordamiento de búfer"],
          cases: [
            {
              id: "buffer-overflow-a",
              name: "Caso A",
              releaseDate: "2026-08-31",
              hints: [
                "Un programa que utilizas normalmente empieza a cerrarse inesperadamente cuando procesa determinados datos.",
                "El mismo tipo de archivo o entrada provoca repetidamente que la aplicación se bloquee.",
                "En algunas ocasiones, el fallo no solo cierra el programa, sino que provoca un comportamiento extraño en el sistema.",
                "Después de uno de estos bloqueos detectas que el programa realizó acciones que normalmente no debería poder realizar.",
                "El análisis del incidente muestra que el problema comenzó cuando el programa recibió más información de la que tenía espacio reservado para almacenar.",
                "Esa cantidad excesiva de datos sobrescribió parte de la memoria del programa y permitió alterar su funcionamiento."
              ]
            }
          ]
        },
        {
          name: "Privilege Escalation",
          aliases: [],
          cases: [
            {
              id: "privilege-escalation-a",
              name: "Caso A",
              releaseDate: "2026-09-10",
              hints: [
                "Un usuario con una cuenta de acceso limitado en un sistema consigue, de alguna manera, realizar acciones que normalmente estarían fuera de su alcance.",
                "El administrador nota que ciertas configuraciones críticas del sistema fueron modificadas por una cuenta que no debería tener permisos para ello.",
                "Al investigar, se descubre que el usuario aprovechó un fallo en un proceso o servicio que se ejecutaba con permisos más altos que los suyos.",
                "El fallo permitía que ese servicio realizara acciones en nombre del usuario sin validar correctamente el nivel de privilegios adecuado.",
                "Gracias a esa debilidad, la cuenta pasó de tener permisos limitados a obtener privilegios de administrador o de sistema.",
                "El atacante explotó una vulnerabilidad para aumentar sus privilegios en el sistema, pasando de un nivel de acceso restringido a uno con permisos administrativos completos."
              ]
            }
          ]
        },
        { name: "Race Condition", aliases: [], cases: [{id:"race-condition-a",name:"Cupón simultáneo",nameEn:"Simultaneous coupon",releaseDate:"2026-09-29",hints:["Un cupón de un uso se aplica dos veces.","No ocurre con peticiones separadas.","Las solicitudes llegan casi simultáneamente.","Ambas lo comprueban antes de marcarlo usado.","La comprobación y actualización no son atómicas.","La ejecución concurrente supera la restricción según el orden de las operaciones."],hintsEn:["A single-use coupon is applied twice.","It does not happen with separate requests.","Requests arrive almost simultaneously.","Both check it before it is marked as used.","The check and update are not atomic.","Concurrent execution bypasses the restriction depending on operation order."],explanation:"Operaciones concurrentes observan el mismo estado válido antes de actualizarlo.",explanationEn:"Concurrent operations observe the same valid state before updating it.",keySignals:["Concurrencia","Comprobación y actualización separadas","Dependencia del tiempo"],keySignalsEn:["Concurrency","Separate check and update","Timing dependency"],whyNot:["Replay Attack repite un mensaje; aquí el fallo depende de concurrencia."],whyNotEn:["Replay Attack repeats a message; here the flaw depends on concurrency."]}] },
        { name: "DLL Hijacking", aliases: [], cases: [{id:"dll-hijacking-a",name:"Biblioteca impostora",nameEn:"Impostor library",releaseDate:"2026-09-30",hints:["Un programa legítimo realiza acciones inesperadas.","El ejecutable original no cambió.","Aparece una biblioteca en una carpeta cercana.","Tiene el nombre de una dependencia esperada.","La búsqueda prioriza esa carpeta modificable.","El programa carga una DLL maliciosa en lugar de la legítima."],hintsEn:["A legitimate program performs unexpected actions.","The original executable did not change.","A library appears in a nearby folder.","It has the name of an expected dependency.","The search prioritizes that writable folder.","The program loads a malicious DLL instead of the legitimate one."],explanation:"Una DLL impostora ocupa una ubicación que se busca antes que la biblioteca legítima.",explanationEn:"An impostor DLL occupies a location searched before the legitimate library.",keySignals:["Ejecutable intacto","DLL impostora","Orden de búsqueda inseguro"],keySignalsEn:["Unchanged executable","Impostor DLL","Unsafe search order"],whyNot:["Process Injection inserta código en un proceso; aquí se carga una biblioteca falsa."],whyNotEn:["Process Injection inserts code into a process; here a fake library is loaded."]}] },
        { name: "Process Injection", aliases: [], cases: [] },
        { name: "Remote Code Execution", aliases: ["rce"], cases: [] }
      ]
    }
  ]
};

// Metadatos educativos/bilingües de los casos originales: no alteran sus pistas ni fechas.
const CASE_LEARNING = {
  'sql-injection-a':{explanation:'La entrada altera consultas SQL para leer o modificar registros sin permiso.',explanationEn:'Input alters SQL queries to read or modify records without permission.',keySignals:['Entrada manipulada','Errores SQL','Consultas alteradas'],keySignalsEn:['Crafted input','SQL errors','Altered queries'],whyNot:['XSS ejecuta scripts en el navegador, no consultas SQL.'],whyNotEn:['XSS executes browser scripts, not SQL queries.'],hintsEn:['While using a familiar web application, you notice changes to your account data that you did not make.','Information belonging to your account appears mixed with other people’s records.','Signing in or searching produces database-related errors.','The administrator reports unauthorized reading and modification of database records.','The attacker entered crafted text into ordinary fields such as the login form or search box.','That text changed the SQL queries the application sent to its database.']},
  'xss-a':{explanation:'Contenido insertado por un usuario se interpreta como código y se ejecuta en navegadores de otros.',explanationEn:'User-supplied content is interpreted as code and executes in other visitors’ browsers.',keySignals:['Contenido de usuario','JavaScript inyectado','Ejecución en navegador'],keySignalsEn:['User content','Injected JavaScript','Browser execution'],whyNot:['SQL Injection altera consultas de base de datos.'],whyNotEn:['SQL Injection alters database queries.'],hintsEn:['A familiar website starts showing unexpected pop-ups or messages.','It happens only in sections such as comments, search results or profiles.','Other visitors to that section report the same browser behaviour.','An administrator finds that another user inserted the content through an ordinary text field such as a comment.','Victims’ browsers executed that content as part of the legitimate page without their request.','The attacker injected malicious JavaScript that ran in other visitors’ browsers.']},
  'idor-a':{explanation:'Falta verificar que el usuario tiene permiso sobre el objeto solicitado.',explanationEn:'The server does not verify that the user has permission to access the requested object.',keySignals:['Identificador modificable','Objeto ajeno','Autorización ausente'],keySignalsEn:['Changeable identifier','Another user’s object','Missing authorization'],whyNot:['No se inyecta una consulta SQL: se cambia una referencia.'],whyNotEn:['No SQL query is injected: an object reference is changed.'],hintsEn:['A signed-in user changes a page address slightly and sees information belonging to someone else.','The system asks for no additional authorization.','Changing numbers or identifiers in the URL reveals other accounts’ documents, orders or profiles.','The developer confirms that permission for the requested resource was not checked.','The application trusted a visible identifier such as an order number sent by the browser.','Changing that identifier let any authenticated user access other accounts’ objects without authorization.']},
  'brute-force-a':{explanation:'Muchas contraseñas diferentes se prueban contra una misma cuenta hasta acertar.',explanationEn:'Many different passwords are tried against one account until one succeeds.',keySignals:['Muchos intentos','Una cuenta','Contraseñas distintas'],keySignalsEn:['Many attempts','One account','Different passwords'],whyNot:['Password Spraying distribuye pocas contraseñas entre muchas cuentas.'],whyNotEn:['Password Spraying spreads a few passwords across many accounts.'],hintsEn:['You receive login-attempt notifications you do not recognize.','The alerts keep arriving over a short period while you are not signing in.','Your account is temporarily locked after many incorrect passwords.','The activity log shows dozens or hundreds of attempts against the same username.','Many different passwords are repeatedly tried until one works.','A successful login follows a very large number of consecutive failed password attempts.']},
  'credential-stuffing-a':{explanation:'Se reutilizan pares de usuario y contraseña de filtraciones anteriores en otros servicios.',explanationEn:'Username-and-password pairs from earlier breaches are reused on other services.',keySignals:['Pares filtrados','Reutilización de contraseña','Accesos automatizados'],keySignalsEn:['Leaked pairs','Password reuse','Automated logins'],whyNot:['No se adivina una contraseña común como en Password Spraying.'],whyNotEn:['It does not guess common passwords as Password Spraying does.'],hintsEn:['Several of your online accounts suddenly show access you did not perform.','You use the same password on several of those services.','A security team reports that your email-and-password combination leaked in another company’s breach months earlier.','The unauthorized logins were automated, testing your credentials across multiple platforms quickly.','The attacker did not guess your password: it was already known from a previous leak.','Lists of previously leaked username-and-password pairs were used to log in automatically wherever victims reused them.']},
  'session-hijacking-a':{explanation:'Una sesión autenticada robada se reutiliza sin conocer la contraseña.',explanationEn:'A stolen authenticated session is reused without knowing the password.',keySignals:['Sesión existente','Identificador robado','Sin nuevo login'],keySignalsEn:['Existing session','Stolen identifier','No new login'],whyNot:['Session Fixation fija el identificador antes del login.'],whyNotEn:['Session Fixation sets the identifier before login.'],hintsEn:['You notice unusual account activity while using a site where you are already signed in.','Actions appear even though you have not entered your password again.','Someone else seems to use your account while you remain connected.','There are no alerts for a new username-and-password login.','You discover that someone obtained the identifier keeping your session open.','The attacker reused your existing authenticated session without needing your password.']},
  'session-fixation-a':{explanation:'El atacante impone una sesión conocida y el sistema no la renueva tras autenticar.',explanationEn:'The attacker imposes a known session and the system does not renew it after authentication.',keySignals:['Identificador previo','Enlace con sesión','Sin rotación al autenticar'],keySignalsEn:['Pre-existing identifier','Session in link','No rotation at login'],whyNot:['Session Hijacking roba una sesión existente.'],whyNotEn:['Session Hijacking steals an existing session.'],hintsEn:['A user receives a colleague’s link to an internal system and notices something strange after signing in normally.','Another person seems to access the account at almost the same time without entering credentials.','The session identifier used after login already existed before the user signed in.','The link included a specific session identifier set beforehand by another person.','The system reused the identifier from the URL rather than generating a new one after authentication.','An attacker fixed the identifier in advance and accessed the account once the victim authenticated with that known session.']},
  'phishing-a':{explanation:'Un mensaje y una página falsos suplantan un servicio para obtener credenciales.',explanationEn:'A fake message and page impersonate a service to obtain credentials.',keySignals:['Urgencia','Página falsa','Solicitud de contraseña'],keySignalsEn:['Urgency','Fake page','Password request'],whyNot:['No se prueban contraseñas automáticamente como en fuerza bruta.'],whyNotEn:['Passwords are not automatically guessed as in brute force.'],hintsEn:['You receive an apparently important message from a company or service you regularly use.','It warns of an urgent account problem and asks you to act quickly.','Its link opens a page that looks very similar to the official service.','The page asks for your email and password to supposedly verify your identity.','After entering your details, you receive alerts about unfamiliar devices accessing your account.','The message and page were fake and designed to trick you into revealing credentials.']},
  'spear-phishing-a':{explanation:'El phishing se personaliza para una víctima concreta usando información previa de su entorno.',explanationEn:'Phishing is personalized for a specific victim using prior information about their environment.',keySignals:['Víctima específica','Proyecto real','Mensaje personalizado'],keySignalsEn:['Specific victim','Real project','Personalized message'],whyNot:['Phishing es la categoría general; Spear Phishing es dirigido.'],whyNotEn:['Phishing is the general category; Spear Phishing is targeted.'],hintsEn:['An employee receives an email apparently aimed specifically at them, mentioning details familiar to the company.','The message refers to a real project the employee is working on.','The sender appears to be a known colleague or manager, but the email address differs slightly.','The email urgently asks them to download an attachment or visit a project-related link.','The personalization came from prior research about the person and workplace, possibly through social networks or the corporate website.','This was a phishing attack specifically targeting that person, using personalized information to make the deception credible.']},
  'vishing-a':{explanation:'Una llamada suplanta a una entidad para manipular a la víctima y obtener información confidencial.',explanationEn:'A call impersonates an entity to manipulate the victim and obtain confidential information.',keySignals:['Llamada de voz','Suplantación','Datos sensibles'],keySignalsEn:['Voice call','Impersonation','Sensitive data'],whyNot:['Smishing utiliza SMS.'],whyNotEn:['Smishing uses SMS.'],hintsEn:['You receive an unexpected call about a familiar service such as your bank.','The caller conveys urgency and claims there is a serious account problem.','During the call, they ask you to confirm personal information to verify your identity.','The calling number appears identical or similar to the entity’s official number.','You later realize the real entity never requests that sensitive information by phone.','The telephone deception manipulated you into providing confidential information by impersonating a legitimate entity.']},
  'mitm-a':{explanation:'Un intermediario no autorizado intercepta o modifica comunicaciones entre dos partes.',explanationEn:'An unauthorized intermediary intercepts or modifies communications between two parties.',keySignals:['Intermediario','Intercepción','Posible modificación'],keySignalsEn:['Intermediary','Interception','Possible modification'],whyNot:['Packet Sniffing puede observar sin interponerse.'],whyNotEn:['Packet Sniffing can observe without interposing.'],hintsEn:['After joining a network, some pages behave strangely or load slowly.','Unexpected security or certificate warnings appear while browsing.','After using the network you find account activity you did not perform.','Someone may have observed information you sent and received on that network.','Your communications did not travel directly between your device and the intended service.','An attacker stood between both parties, intercepting and potentially modifying their data.']},
  'dns-poisoning-a':{explanation:'Se manipula la resolución DNS para que un dominio legítimo apunte a una IP del atacante.',explanationEn:'DNS resolution is manipulated so a legitimate domain points to the attacker’s IP.',keySignals:['Dominio correcto','IP falsa','DNS manipulado'],keySignalsEn:['Correct domain','False IP','Manipulated DNS'],whyNot:['ARP Spoofing modifica asociaciones IP-MAC, no nombres DNS.'],whyNotEn:['ARP Spoofing changes IP-to-MAC mappings, not DNS names.'],hintsEn:['Trying to open a familiar website takes you to an unfamiliar site.','The address you typed was correct, but the content does not match the real page.','Several users on the same network report the same problem.','Name-resolution checks show that the domain’s IP differs from the legitimate service’s IP.','Information on the DNS server or cache was altered to point to an attacker-controlled server.','The attacker corrupted DNS resolution records, redirecting requests for a legitimate domain to a malicious IP.']},
  'ddos-a':{explanation:'Muchos dispositivos coordinados saturan recursos e impiden atender a usuarios legítimos.',explanationEn:'Many coordinated devices exhaust resources and prevent legitimate users from being served.',keySignals:['Orígenes distribuidos','Saturación','Pérdida de disponibilidad'],keySignalsEn:['Distributed sources','Saturation','Loss of availability'],whyNot:['Un pico de visitas no demuestra un ataque; aquí hay coordinación maliciosa.'],whyNotEn:['A traffic spike does not prove an attack; here malicious coordination is present.'],hintsEn:['Website users report very slow loading or no response.','The technical team sees a sudden unusual rise in server traffic.','Traffic comes from thousands of different IP addresses worldwide rather than one source.','Servers cannot handle the requests and become overloaded until they stop responding.','Much of the traffic comes from compromised devices acting together without their owners knowing.','An attacker used distributed devices to intentionally exhaust server resources and make the service unavailable to legitimate users.']},
  'ransomware-a':{explanation:'El malware cifra archivos y exige un rescate para recuperarlos.',explanationEn:'The malware encrypts files and demands a ransom to recover them.',keySignals:['Cifrado','Archivos inaccesibles','Rescate'],keySignalsEn:['Encryption','Inaccessible files','Ransom'],whyNot:['Spyware se define por espiar, no por exigir un rescate.'],whyNotEn:['Spyware is defined by spying, not by demanding a ransom.'],hintsEn:['Your computer behaves strangely and familiar files stop opening.','More documents, photographs and personal files become inaccessible.','Many files have changed names or unfamiliar extensions.','The files remain on your computer but programs cannot open them properly.','A message says your files have been encrypted.','The message demands payment to supposedly restore access to your files.']},
  'keylogger-a':{explanation:'El malware registra teclas pulsadas y las envía al atacante para capturar secretos.',explanationEn:'Malware records keystrokes and sends them to the attacker to capture secrets.',keySignals:['Registro de teclado','Proceso oculto','Datos escritos'],keySignalsEn:['Keyboard logging','Hidden process','Typed data'],whyNot:['Credential Dumping extrae secretos almacenados.'],whyNotEn:['Credential Dumping extracts stored secrets.'],hintsEn:['After installing software from an untrusted source, you notice strange activity in several accounts.','You detect unauthorized access even though the password was not reused elsewhere.','Analysis reveals an unknown process continuously running in the background.','It remains active even when no browser or particular application is being used.','The program secretly records every key pressed.','The malware captures and sends everything the victim types to a remote attacker, including passwords and sensitive data.']},
  'buffer-overflow-a':{explanation:'Una entrada excesiva sobrescribe memoria reservada y altera la ejecución.',explanationEn:'Excessive input overwrites reserved memory and alters execution.',keySignals:['Entrada excesiva','Memoria sobrescrita','Ejecución alterada'],keySignalsEn:['Excessive input','Overwritten memory','Altered execution'],whyNot:['Una caída aislada no basta; la sobrescritura de memoria es la señal decisiva.'],whyNotEn:['A crash alone is not enough; memory overwrite is the decisive sign.'],hintsEn:['A familiar program closes unexpectedly when processing particular data.','The same kind of file or input repeatedly crashes it.','Some crashes also cause strange system behaviour.','After a crash the program performs actions it should not be able to perform.','Analysis shows that it received more data than its reserved storage space could hold.','Excess data overwrote part of the program’s memory and allowed its behaviour to be altered.']},
  'privilege-escalation-a':{explanation:'Una cuenta limitada explota un fallo para obtener permisos superiores.',explanationEn:'A limited account exploits a flaw to gain higher permissions.',keySignals:['Acceso limitado inicial','Servicio privilegiado','Permisos superiores'],keySignalsEn:['Initially limited access','Privileged service','Higher permissions'],whyNot:['Authentication Bypass evita demostrar identidad; aquí ya había acceso.'],whyNotEn:['Authentication Bypass avoids proving identity; here access already existed.'],hintsEn:['A user with limited access somehow performs actions normally outside their permissions.','An administrator notices critical settings changed by an account that should not have that permission.','The user exploited a flaw in a process or service running with higher permissions.','The flaw let the service act for the user without correctly validating the privilege level.','The account moved from limited permissions to administrator or system privileges.','The attacker exploited a vulnerability to increase privileges from restricted access to full administrative permissions.']}
};
for(const category of SECDLE_DATA.categories){
  for(const answer of category.answers){
    for(const c of answer.cases){
      if(CASE_LEARNING[c.id])Object.assign(c,{nameEn:'Case A'},CASE_LEARNING[c.id]);
    }
  }
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = SECDLE_DATA;
}
