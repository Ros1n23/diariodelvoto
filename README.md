# 🏛️ QueVotan — Diario Cívico de las Cortes Generales y Escrutinio Parlamentario

**QueVotan** es una plataforma cívica independiente y de código abierto concebida para acercar la actividad legislativa del Estado a la ciudadanía con rigor, neutralidad estricta y formato de gaceta periodística clásica (*broadsheet*).

Explica sin tecnicismos ni artificios partidistas qué aprueban las Cámaras, qué votó nominalmente cada representante y qué impacto real y tangible tiene cada ley o decreto en el bolsillo, el trabajo, la vivienda y el día a día de las personas.

---

## 📑 Índice de Contenidos
1. [Cobertura Multicameral](#-cobertura-multicameral)
2. [Arquitectura del Sistema](#-arquitectura-del-sistema)
3. [Pipeline de Automantenimiento Autónomo](#-pipeline-de-automantenimiento-autónomo)
4. [Estructura del Proyecto](#-estructura-del-proyecto)
5. [Endpoints de la API](#-endpoints-de-la-api)
6. [Enlace Profundo, Atajos y Accesibilidad](#-enlace-profundo-atajos-y-accesibilidad)
7. [Seguridad y Producción (Nginx & Systemd)](#-seguridad-y-producción-nginx--systemd)
8. [Cumplimiento Normativo y Privacidad](#-cumplimiento-normativo-y-privacidad)

---

## 🏛️ Cobertura Multicameral

QueVotan monitoriza y clasifica la actividad de las instituciones legislativas de España y la Unión Europea:

| Cámara / Organismo | Escaños / Ámbito | Mayoría Ordinaria | Fuente Primaria | Ingesta |
| :--- | :---: | :---: | :--- | :--- |
| **Congreso de los Diputados** | 350 diputados | 176 votos | *Diario de Sesiones* & Datos Abiertos Congreso | Automática (Sesiones y Votos Nominales) |
| **Senado de España** | 266 senadores | 134 votos | *Diario de Sesiones* & BOCG Senado | Automática (Vetos, Enmiendas, Plenos) |
| **🇪🇺 Parlamento Europeo** | 61 eurodiputados (del. España) | 31 votos | Open Data Registro del Parlamento Europeo | Automática (Directivas y Reglamentos) |
| **Boletín Oficial del Estado (BOE)** | Sección I (Leyes y Decretos) | Plazo 30 días (Art. 86.2 CE) | RSS Oficial BOE Disposiciones Generales | Diario (Convalidaciones de RDL pendientes) |

---

## ⚙️ Arquitectura del Sistema

```
                               ┌──────────────────────────────────────────────┐
                               │       CORTES GENERALES & BOLETÍN (BOE)       │
                               │  Congreso.es · Senado.es · Europarl · BOE    │
                               └──────────────────────┬───────────────────────┘
                                                      │ Ingesta periódica (Systemd Timer)
                                                      ▼
                                      ┌───────────────────────────────┐
                                      │     scripts/auto_scanner.py   │
                                      │  (Detector de plenos y votos) │
                                      └───────────────┬───────────────┘
                                                      │
                       ┌──────────────────────────────┼──────────────────────────────┐
                       ▼                              ▼                              ▼
          ┌─────────────────────────┐   ┌──────────────────────────┐   ┌──────────────────────────┐
          │  scripts/fetch_senado   │   │ scripts/fetch_europarl   │   │    scripts/fetch_boe     │
          │   (266 senadores)       │   │    (61 eurodiputados)    │   │  (Plazo 30 días RDL)     │
          └────────────┬────────────┘   └─────────────┬────────────┘   └─────────────┬────────────┘
                       │                              │                              │
                       └──────────────────────────────┼──────────────────────────────┘
                                                      ▼
                                      ┌───────────────────────────────┐
                                      │    data/quevotan.db (SQLite)  │
                                      │  (175 iniciativas / 49 plenos)│
                                      └───────────────┬───────────────┘
                                                      │
                       ┌──────────────────────────────┴──────────────────────────────┐
                       ▼                                                             ▼
          ┌─────────────────────────┐                                  ┌──────────────────────────┐
          │    API REST /api/       │                                  │   Static Assets & Feeds  │
          │ /api/calendar           │                                  │ · /sitemap.xml           │
          │ /api/initiatives        │                                  │ · /llms.txt              │
          │ /api/initiatives/:id    │                                  │ · /llms-full.txt         │
          └────────────┬────────────┘                                  └─────────────┬────────────┘
                       │                                                             │
                       └──────────────────────────────┬──────────────────────────────┘
                                                      ▼
                                      ┌───────────────────────────────┐
                                      │       NGINX Reverse Proxy     │
                                      │  - Rate limit (30 req/s)      │
                                      │  - OWASP Security Headers     │
                                      │  - Gzip compresión nivel 6    │
                                      │  - Bloqueo archivos .db/.env  │
                                      └───────────────┬───────────────┘
                                                      ▼
                                      ┌───────────────────────────────┐
                                      │     CIUDADANÍA / LECTORES     │
                                      │  Web Broadsheet & Móvil       │
                                      └───────────────────────────────┘
```

---

## 🤖 Pipeline de Automantenimiento Autónomo

El sistema no requiere intervención manual. El demonio `quevotan-sync.timer` ejecuta `scripts/auto_scanner.py` tres veces al día en días hábiles (07:30, 14:30 y 20:30 UTC):

1. **Mañana (07:30 UTC):** Escanea el *Orden del Día* de la Mesa y Junta de Portavoces (conocido con 4 a 7 días de antelación) y registra los debates como `agendado`.
2. **Mediodía (14:30 UTC):** Comprueba votaciones del turno matinal y actas del BOE.
3. **Tarde (20:30 UTC):** Registra el escrutinio nominal definitivo de la sesión plenaria vespertina, asigna el estado `aprobado` o `rechazado`, regenera el dataset y actualiza el mapa del sitio y los ficheros para agentes LLM.

Comprobación del servicio:
```bash
# Ver estado del temporizador
systemctl list-timers quevotan-sync.timer

# Ver bitácora en tiempo real
journalctl -u quevotan-sync.service -n 50 -f

# Ejecutar escrutinio manual inmediato
python3 /opt/quevotan/scripts/auto_scanner.py
```

---

## 📁 Estructura del Proyecto

```
/opt/quevotan/
├── data/
│   ├── quevotan.db                 # Base de datos SQLite maestra (iniciativas, plenos, votos)
│   └── diputados_activos.json      # Directorio de los 350 escaños con partido y circunscripción
├── scripts/
│   ├── auto_scanner.py             # Orquestador del escaneo automático y regeneración
│   ├── fetch_congreso.py           # Ingestor oficial del Congreso de los Diputados
│   ├── fetch_senado.py             # Ingestor de las 266 actas del Senado de España
│   ├── fetch_europarl.py           # Ingestor de directivas y los 61 eurodiputados españoles
│   ├── fetch_boe.py                # Lector RSS de convalidaciones urgentes del BOE
│   ├── export_to_frontend.ts       # Serializador optimizado a TypeScript (sin duplicidad de escaños)
│   ├── generate_sitemap.py         # Generador de sitemap.xml para buscadores
│   └── generate_llms_txt.py        # Generador de llms.txt y llms-full.txt para IA
├── server/
│   └── dbService.ts                # Capa de acceso a SQLite usando node:sqlite nativo
├── src/
│   ├── components/
│   │   ├── Calendar/               # Almanaque parlamentario con semáforo por día
│   │   ├── IniciativaCard/         # Despiece periodístico, medidas y termómetro de votos
│   │   ├── Hemiciclo/              # Gráfico litográfico interactivo de los escaños (lazy-loaded)
│   │   ├── LegalModal/             # Pliego de transparencia, neutralidad y RGPD (lazy-loaded)
│   │   └── ErrorBoundary/          # Fe de Erratas técnica con estética de imprenta
│   ├── data/
│   │   └── mockParliament.ts       # Dataset cliente optimizado para renderizado instantáneo
│   ├── types/
│   │   └── parliament.ts           # Definiciones de tipo TypeScript para el modelo de datos
│   ├── App.tsx                     # Orquestador principal de portada, filtros y deep linking
│   └── index.css                   # Tipografía de prensa, reglas Oxford y `@media print`
├── public/
│   ├── favicon.svg                 # Imagotipo vectorial de la gaceta
│   ├── manifest.webmanifest        # Manifiesto PWA para instalación ciudadana
│   ├── robots.txt                  # Directivas de rastreo e indexación
│   ├── security.txt                # Divulgación responsable de vulnerabilidades (RFC 9116)
│   ├── humans.txt                  # Créditos de autoría cívica
│   ├── llms.txt                    # Índice resumido para modelos de lenguaje (llmstxt.org)
│   └── sitemap.xml                 # Índice completo de fechas e iniciativas
└── vite.config.ts                  # Configuración de empaquetado y plugins API REST
```

---

## 🌐 Endpoints de la API

El servidor expone endpoints directos para consulta ciudadana o integración:

- `GET /api/calendar?year=YYYY&month=MM`: Devuelve la matriz de días del mes con el recuento de iniciativas aprobadas, rechazadas o en trámite.
- `GET /api/initiatives?date=YYYY-MM-DD`: Devuelve las votaciones completas celebradas en dicha jornada.
- `GET /api/initiatives/:id`: Ficha íntegra de una iniciativa parlamentaria con sus medidas e impacto.

---

## 🔗 Enlace Profundo, Atajos y Accesibilidad

1. **Enlaces Profundos Compartibles:**
   - A una votación concreta: `https://quevotan.es/?initiative=congreso-2026-10-24-1` (abre la edición de esa fecha, centra la votación y la resalta con halo carmesí).
   - A una fecha histórica: `https://quevotan.es/?date=2026-10-15`
   - Por cámara: `https://quevotan.es/?camara=senado` o `europarl`
   - Por pliego legal: `https://quevotan.es/?legal=neutralidad`

2. **Atajos de Teclado:**
   - <kbd>/</kbd> : Enfoca de inmediato el buscador de materias.
   - <kbd>Esc</kbd> : Cierra el pliego legal o limpia la consulta de búsqueda actual.

3. **Accesibilidad (WCAG 2.1 AA) y Modo Sin Conexión (PWA):**
   - Enlace oculto *Skip to main content* (`Saltar al contenido principal`) para lectores de pantalla.
   - Atributos semánticos ARIA en buscador, filtros y diálogo modal.
   - **Service Worker (`public/sw.js`):** Permite leer la gaceta y las actas parlamentarias completamente sin conexión a internet (ej. en el metro o sin cobertura móvil) con detección de estado `navigator.onLine`.
   - Estilo de alta legibilidad para prensa física mediante `@media print`.

---

## 🛡️ Seguridad y Producción (Nginx & Systemd)

La aplicación está securizada bajo **Nginx** con directivas OWASP y arquitectura desacoplada:
- **Servicio Estático Directo:** Nginx sirve la SPA compilada (`/opt/quevotan/dist`) directamente desde disco con `sendfile` (< 2 ms de latencia), liberando por completo al proceso Node de tareas de entrega estática.
- **Proxy Inverso para API:** Las rutas `/api/*` se canalizan a la capa Node.js / SQLite en puerto 3000.
- **Cabeceras HTTP de Seguridad:** `Content-Security-Policy`, `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`.
- **Protección Antiextracción y DoS:** Límite de 30 peticiones/segundo con ráfaga (*burst*) de 60 (`limit_req_zone`).
- **Bloqueo Estricto:** Acceso vetado a archivos `.db`, `.sqlite`, `.env`, `.log` y al directorio `/data/`.
- **Compresión Gzip:** Activa para HTML, CSS, JS, JSON y SVG con nivel 6.

---

## ⚖️ Cumplimiento Normativo y Privacidad

- **Cero Rastreadores (ePrivacy):** QueVotan no instala cookies de seguimiento publicitario ni analítica invasiva de terceros. Cumple con la directiva europea ePrivacy sin requerir molestos banners de consentimiento.
- **RGPD (Reglamento UE 2016/679):** Los únicos datos personales procesados son los nombres y votos públicos de los cargos electos en el ejercicio de sus funciones constitucionales (Art. 79 CE).
- **LSSI-CE (Ley 34/2002):** Pliego legal público con identificación de la iniciativa, canal de contacto ciudadano y política de neutralidad editorial.
