# 🏛️ QueVotan — Plan Detallado de Arquitectura y Desarrollo

> **Ubicación:** `/opt/quevotan` en **LXC 301** (`192.168.31.31` en `vmbr0` / `10.20.20.31` en `vmbr2`).  
> **Comando de Desarrollo:** `pnpm dev` (escuchando en `http://192.168.31.31:3000`).  
> **Agente de IA Integrado:** `agy` instalado y autenticado en `/usr/local/bin/agy`.

---

## 🎯 Objetivo de la Plataforma
Crear una herramienta web cívica, abierta y completamente neutral que permita a cualquier ciudadano español entender:
1. **¿Qué se vota hoy y en los próximos días?** (Radar y orden del día parlamentario).
2. **¿Qué votó cada partido y diputado?** (Hemiciclo interactivo con los 350 escaños y datos de escrutinio).
3. **¿Cómo me afecta esto a mí en la vida real?** (Traducción con IA de la jerga jurídica a lenguaje llano con ejemplos cotidianos con números reales).
4. **Despiece de Decretos Ómnibus:** Si un Real Decreto-ley mezcla 4 medidas distintas (ej. transporte, IVA, alquileres y jubilación), desglosarlas individualmente con argumentos a favor y objeciones de la oposición.

---

## 📅 1. Especificación del Calendario Parlamentario
El calendario de la app ofrece 4 estados visuales bien diferenciados:
* 🟢 **Días Pasados (Votado y Escrutado):** Tinte azul slate/esmeralda, badges de iniciativas aprobadas/rechazadas. Al pulsar, abre la sesión con el resultado oficial, el desglose de votos por partido y el hemiciclo interactivo.
* 🔵 **Hoy (Radar en Directo):** Halo brillante y badge pulsante `"EN CURSO"`. Muestra los debates de la mañana y las votaciones programadas para la tarde.
* 🟣 **Días Próximos (Agendado / Radar):** Tonalidad violeta con badge de reloj `"AGENDADO"`. Muestra proyectos de ley en tramitación y orden del día previo.
* ⚪ **Días sin Sesión / Receso:** Atenuados, sin eventos.

---

## 🤖 2. Motor de Inteligencia Artificial (Google Gemini API & Respaldo Ollama)
* **Motor Principal (Nube de Alto Rendimiento):** Google Gemini API (`gemini-3.5-flash`).
  * Autenticación mediante `GEMINI_API_KEY` en `.env` (ignorado en `.gitignore`).
  * Generación estructurada nativa con `responseMimeType: "application/json"`.
  * Tiempo medio de respuesta: ~3-4 segundos por iniciativa.
* **Motor Secundario / Respaldo Local (VM 702 node-ai):**
  * Endpoint Ollama: `http://192.168.31.41:11434`
  * Modelos locales: `qwen2.5:7b` (rápido) o `qwen3.8:27b` (análisis profundo).
* **Prompt Base para Despiece Ciudadano:**
  ```text
  Eres un analista parlamentario imparcial que redacta crónicas y despieces de leyes
  para los ciudadanos en un periódico clásico e independiente.
  Analiza la siguiente iniciativa parlamentaria oficial y genera un JSON con:
  - title: Titular de prensa directo y periodístico.
  - category: Rúbrica temática (ej. Vivienda, Fiscalidad, Transporte, Sanidad).
  - summary: Resumen neutral en 2 frases de qué se vota y por qué es relevante.
  - measures: Array de medidas independientes.
  Para cada medida:
    * title: Título de la medida.
    * plainDescription: Explicación en lenguaje llano sin tecnicismos legales.
    * whoIsAffected: Array de colectivos afectados (ej. "Autónomos", "Inquilinos").
    * realWorldExample: Un caso práctico cotidiano con nombres y cifras en euros.
    * argumentsPro: 2 argumentos principales a favor defendidos por los proponentes.
    * argumentsContra: 2 argumentos u objeciones críticas señaladas por la oposición o sectores afectados.
  ```

---

## 🌐 3. Fuentes Oficiales de Datos (Ingesta Automatizada)
1. **Congreso de los Diputados:**
   - Votaciones: Archivos XML y JSON descargables tras cada pleno en `https://www.congreso.es/datos-abiertos`.
   - Órdenes del Día: Calendario de comisiones y sesiones plenarias.
2. **Senado de España:**
   - Catálogo de iniciativas y votaciones en datos abiertos.
3. **BOE API REST:**
   - `https://boe.es/datosabiertos/api/` para la descarga directa del articulado oficial de Reales Decretos-leyes convalidables.

---

## 🛠️ 4. Estructura del Código en `/opt/quevotan`
* `src/types/parliament.ts`: Tipos TypeScript de iniciativas, medidas, escaños del hemiciclo y calendario.
* `src/data/mockParliament.ts`: Dataset de prueba enriquecido con datos reales (Decreto anticrisis, ley de movilidad, etc.) y generador de escaños.
* `src/components/Calendar/ParliamentaryCalendar.tsx`: Componente interactivo con diferenciación visual mensual.
* `src/components/Hemiciclo/Hemiciclo.tsx`: Gráfico SVG interactivo de los 350 escaños con tooltip nominal.
* `src/components/IniciativaCard/IniciativaCard.tsx`: Tarjeta expandible con desglose de medidas y ejemplos cotidianos.
* `src/App.tsx`: Interfaz principal con buscador, selector de fechas y filtros temáticos.

---

## 🗞️ 5. Sistema de Diseño: Estética de Periódico Clásico (Broadsheet / Gaceta Histórica)

Transformación de la identidad visual de la web para simular un **periódico clásico de gran tirada o gaceta parlamentaria histórica** (influencias de la antigua *Gaceta de Madrid*, *The Times*, *The New York Times*, *ABC* y la prensa decimonónica/siglo XX):

### 5.1 Tipografía Editorial y Jerarquía de Imprenta
* **Cabecera Principal (Nameplate / Masthead):** 
  * Fuente de estilo Gótico / Blackletter (ej. *UnifrakturMaguntia*, *Chomsky*, *Cinzel Decorative* o *Playfair Display Black* con remates marcados) para evocar la autenticidad de una cabecera de prensa histórica ("QUE VOTAN — Gaceta Cívica y Parlamentaria").
* **Titulares de Portada (Headlines):** 
  * Familias Serif de alto contraste y fuerte peso editorial (*Playfair Display*, *Bodoni Moda*, *Newsreader*, *Merriweather* o *Georgia*).
  * Composición compacta, titulares a múltiples columnas con interlineado ceñido característico de prensa de papel.
* **Antetítulos / Cintillos (Kickers / Eyebrows):** 
  * Versalitas (small-caps) o tipografía sans/slab-serif condensada con amplio tracking (`tracking-widest font-mono uppercase text-xs`), situadas sobre el titular para ubicar la sección (ej. `CONGRESO DE LOS DIPUTADOS • PLENO EXTRAORDINARIO`).
* **Subtítulos y Bajadas (Decks / Subheads):** 
  * Tipografía serif en cursiva o peso medio para sintetizar la iniciativa antes de entrar al articulado.
* **Cuerpo de Noticia y Artículos:** 
  * Serif de alta legibilidad editorial (*Newsreader*, *Merriweather*, *Lora*, *Crimson Pro*).
  * **Letra Capitular (Drop Cap):** La primera letra del primer párrafo de cada ley o despiece en tamaño ampliado (2-3 líneas de altura), clásica de las crónicas periodísticas.
* **Metadatos y Cifras (Fechas, Escaños, Artículos):** 
  * Fuente monoespaciada o de máquina de escribir antigua (*Courier Prime*, *Special Elite* o monospace tipográfico) para dar sensación de teletipo o acta parlamentaria mecanografiada.

### 5.2 Paleta Cromática: Papel Prensa y Tinta de Imprenta
* **Fondo "Papel Prensa" (Newsprint):** 
  * Tonos blanco roto, pergamino o papel de celulosa envejecido suave (`#FBF8F1`, `#F6F2E8`, `#EFEAD9`) con textura imperceptible de grano o papel prensa.
* **Tinta Principal:** 
  * Negro carbón / tinta de linotipia envejecida (`#1B1A17`, `#23211D`), evitando el negro puro digital (`#000000`) para simular la absorción del papel.
* **Tinta Secundaria y Filetes:** 
  * Gris plomo / grafito (`#4E4B44`, `#6B665C`) y sepia suave (`#C8BFAC`) para líneas y separadores.
* **Acentos Editoriales Tradicionales:** 
  * **Rojo Carmesí Prensa:** (`#8B1E1E` / `#991B1B`) para cintillos de *"ÚLTIMA HORA"*, *"EDICIÓN EXTRAORDINARIA"* o sellos de rechazo parlamentario.
  * **Azul Tinta Clásico / Verde Sello:** (`#1E3A5F` / `#22543D`) para insignias de aprobación oficial y sellos de convalidación.
* *(Opcional)* **Modo Prensa Nocturna (Microfilm / Archivo Histórico):** Paleta oscura en sepia profundo y ámbar de archivo para lectura nocturna sin perder la atmósfera editorial.

### 5.3 Estructura y Maquetación de Página Impresa
* **Cabecera con "Orejetas" (Ear Banners):**
  * Flanqueando la gran cabecera central:
    * *Orejeta Izquierda:* Información de edición ("Madrid, Martes 24 de Octubre de 2026", "Año I • Número 1.482").
    * *Orejeta Derecha:* Lema o nota del editor ("Diario independiente de información legislativa y control ciudadano" • "Precio: Su atención cívica").
* **Filetes Tipográficos Tradicionales (Oxford Rules / Thick-Thin Lines):**
  * Uso de líneas dobles horizontales (una gruesa y una fina) para enmarcar la fecha, la cabecera y delimitar secciones.
* **Maquetación Multicolumna con "Column Rules":**
  * Artículos y despieces maquetados en 2 o 3 columnas con finos filetes divisorios verticales (`border-r border-stone-300`).
* **Sección "De Primera Plana" (Lead Story / Above the Fold):**
  * La iniciativa más trascendente del día se presenta con titular a todo el ancho y jerarquía de noticia principal de portada.
* **"Tribuna de Debate" (Tribuna Enfrentada):**
  * Los argumentos a favor (defensores de la ley) y en contra (oposición / colectivos críticos) maquetados en columnas paralelas enfrentadas, evocando la clásica página de opinión de la prensa seria.
* **"Teletipos de la Carrera de San Jerónimo":**
  * Módulo de radar parlamentario maquetado como teletipo de agencia (estilo teletipo cablegráfico / EFE) con hora en formato 24h y tipografía mecanográfica.
* **"Cartelera Parlamentaria":**
  * El calendario del Congreso/Senado presentado con la maquetación clásica de una cartelera cultural o agenda de prensa decimonónica.

### 5.4 Elementos Gráficos e Infográficos Clásicos
* **Hemiciclo en Estilo Grabado Calcográfico / Litografía:**
  * Estilizar el SVG de los 350 escaños para que parezca una infografía clásica de prensa de finales del XIX o principios del XX (tintas monocromáticas o bitono, tramas de puntos/líneas y leyenda en serif grabada).
* **Sellos de Caucho Oficiales (Rubber Stamp Badges):**
  * Sustituir los badges redondeados modernos tipo "pill" por sellos con apariencia de tampón de caucho oficial (bordes ligeramente rugosos, tipografía condensada en mayúsculas, recuadro de doble línea con ligera rotación aleatoria de 1-2 grados): *"CONVALIDADO POR EL PLENO"*, *"DEROGADO"*, *"EN TRÁMITE DE URGENCIA"*.
* **Viñetas y Manecillas Tipográficas (Fleurons & Index Hands):**
  * Separadores ornamentales clásicos (plecas tipográficas ❦, rombos ❖ y manecillas indicadoras ☞) para guiar la lectura y abrir notas explicativas.

---

## 🚀 6. Pasos Siguientes para Continuar con `agy`
1. Conectarte por SSH a este contenedor:
   ```bash
   ssh root@192.168.31.31
   ```
2. Entrar al proyecto:
   ```bash
   cd /opt/quevotan
   ```
3. Lanzar el agente `agy`:
   ```bash
   agy
   ```
4. Estado de Tareas:
   - ✅ **Rediseño visual de Periódico Clásico:** Completado (Google Fonts, paleta papel prensa, cabecera con orejetas, teletipo, drop caps, sellos de caucho, hemiciclo litográfico y almanaque).
   - ✅ **Ingesta de Datos Abiertos del Congreso:** Completado en `scripts/fetch_congreso.py` (descarga catálogo de diputados activos, extrae escrutinios oficiales y actas).
   - ✅ **Integración de IA (Google Gemini API):** Configurado con `gemini-3.5-flash` mediante `.env` (con fallback a Ollama local `node-ai`), produciendo despieces estructurados en JSON.
   - ⏳ **Tareas pendientes:**
     - Programar ejecución diaria automática de `fetch_congreso.py` (mediante cron o systemd timer).
     - Desarrollar el módulo de Radar parlamentario en tiempo real (`src/components/Radar`).
     - Dar de alta el dominio en Caddy (`quevotan.home.arpa`) en LXC 214 y Pi-hole HA.
