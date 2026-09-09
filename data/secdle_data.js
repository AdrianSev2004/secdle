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
        { name: "Cross-Site Scripting (XSS)", aliases: ["xss", "cross site scripting"], cases: [] },
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
        { name: "IDOR", aliases: ["insecure direct object reference"], cases: [] }
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
        { name: "Credential Stuffing", aliases: [], cases: [] },
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
        { name: "Session Fixation", aliases: [], cases: [] },
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
        { name: "Spear Phishing", aliases: [], cases: [] },
        { name: "Whaling", aliases: [], cases: [] },
        { name: "Smishing", aliases: [], cases: [] },
        { name: "Vishing", aliases: [], cases: [] },
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
        { name: "DNS Poisoning", aliases: ["dns spoofing"], cases: [] },
        { name: "SYN Flood", aliases: [], cases: [] },
        { name: "DDoS", aliases: ["distributed denial of service"], cases: [] },
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
        { name: "Keylogger", aliases: [], cases: [] },
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
        { name: "Privilege Escalation", aliases: [], cases: [] },
        { name: "Race Condition", aliases: [], cases: [] },
        { name: "DLL Hijacking", aliases: [], cases: [] },
        { name: "Process Injection", aliases: [], cases: [] },
        { name: "Remote Code Execution", aliases: ["rce"], cases: [] }
      ]
    }
  ]
};


if (typeof module !== "undefined" && module.exports) { module.exports = SECDLE_DATA; }
