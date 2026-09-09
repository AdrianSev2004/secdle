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
        { name: "Cross-Site Request Forgery (CSRF)", aliases: ["csrf", "cross site request forgery"], cases: [] },
        { name: "Server-Side Request Forgery (SSRF)", aliases: ["ssrf", "server side request forgery"], cases: [] },
        { name: "Command Injection", aliases: [], cases: [] },
        { name: "Path Traversal", aliases: ["directory traversal"], cases: [] },
        { name: "Local File Inclusion", aliases: ["lfi"], cases: [] },
        { name: "Remote File Inclusion", aliases: ["rfi"], cases: [] },
        { name: "XML External Entity (XXE)", aliases: ["xxe"], cases: [] },
        { name: "Open Redirect", aliases: [], cases: [] },
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
        { name: "Dictionary Attack", aliases: [], cases: [] },
        { name: "Password Spraying", aliases: [], cases: [] },
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
        { name: "Credential Dumping", aliases: [], cases: [] }
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
        { name: "Replay Attack", aliases: [], cases: [] }
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
        { name: "Smishing", aliases: [], cases: [] },
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
        { name: "Baiting", aliases: [], cases: [] },
        { name: "Pretexting", aliases: [], cases: [] },
        { name: "Tailgating", aliases: [], cases: [] }
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
        { name: "ARP Spoofing", aliases: [], cases: [] },
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
        { name: "Packet Sniffing", aliases: [], cases: [] },
        { name: "Evil Twin", aliases: [], cases: [] },
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
        { name: "Trojan", aliases: ["trojan horse", "troyano"], cases: [] },
        { name: "Worm", aliases: ["gusano"], cases: [] },
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
        { name: "Race Condition", aliases: [], cases: [] },
        { name: "DLL Hijacking", aliases: [], cases: [] },
        { name: "Process Injection", aliases: [], cases: [] },
        { name: "Remote Code Execution", aliases: ["rce"], cases: [] }
      ]
    }
  ]
};

if (typeof module !== "undefined" && module.exports) {
  module.exports = SECDLE_DATA;
}