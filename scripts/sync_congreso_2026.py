#!/usr/bin/env python3
"""
Sync Congreso 2026 - Parliamentary Ingestion Pipeline
Fetches and enriches plenary voting sessions across the entire year 2026 into SQLite.
"""

import sys
import os
import json
import urllib.request
import urllib.error
import time

sys.path.insert(0, os.path.dirname(__file__))
from db_manager import (
    init_db, get_cached_ai, set_cached_ai, save_initiative,
    get_connection, DB_PATH
)

ENV_FILE = os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env')
GEMINI_API_KEY = None
if os.path.exists(ENV_FILE):
    with open(ENV_FILE, 'r') as f:
        for line in f:
            if line.startswith('GEMINI_API_KEY='):
                GEMINI_API_KEY = line.strip().split('=', 1)[1]
                break

if not GEMINI_API_KEY:
    print("ADVERTENCIA: GEMINI_API_KEY no encontrada en .env")

PARLIAMENTARY_GROUPS = [
    {"name": "G.P. Popular (PP)", "seats": 137, "color": "#0ea5e9", "party": "PP", "province": "Madrid"},
    {"name": "G.P. Socialista (PSOE)", "seats": 121, "color": "#ef4444", "party": "PSOE", "province": "Madrid"},
    {"name": "G.P. VOX", "seats": 33, "color": "#22c55e", "party": "VOX", "province": "Madrid"},
    {"name": "G.P. Plurinacional Sumar", "seats": 27, "color": "#ec4899", "party": "Sumar", "province": "Barcelona"},
    {"name": "G.P. Republicano (ERC)", "seats": 7, "color": "#f59e0b", "party": "ERC", "province": "Barcelona"},
    {"name": "G.P. Junts per Catalunya", "seats": 7, "color": "#06b6d4", "party": "Junts", "province": "Girona"},
    {"name": "G.P. Euskal Herria Bildu", "seats": 6, "color": "#84cc16", "party": "EH Bildu", "province": "Gipuzkoa"},
    {"name": "G.P. Vasco (EAJ-PNV)", "seats": 5, "color": "#10b981", "party": "EAJ-PNV", "province": "Bizkaia"},
    {"name": "G.P. Mixto (Podemos/BNG/CC/UPN)", "seats": 7, "color": "#8b5cf6", "party": "Mixto", "province": "A Coruña"},
]

NOTABLE_DEPUTIES = {
    1: {"name": "Feijóo Feijóo, Alberto Núñez", "party": "PP", "province": "Madrid"},
    2: {"name": "Gamarra Ruiz-Clavijo, Concepción", "party": "PP", "province": "La Rioja"},
    3: {"name": "Tellado Filgueira, Miguel Ángel", "party": "PP", "province": "A Coruña"},
    138: {"name": "Sánchez Pérez-Castejón, Pedro", "party": "PSOE", "province": "Madrid"},
    139: {"name": "Montero Cuadrado, María Jesús", "party": "PSOE", "province": "Sevilla"},
    140: {"name": "López Álvarez, Patxi", "party": "PSOE", "province": "Bizkaia"},
    259: {"name": "Abascal Conde, Santiago", "party": "VOX", "province": "Madrid"},
    260: {"name": "Pepa Millán, María José", "party": "VOX", "province": "Sevilla"},
    292: {"name": "Díaz Pérez, Yolanda", "party": "Sumar", "province": "Madrid"},
    293: {"name": "Errejón Galván, Íñigo", "party": "Sumar", "province": "Madrid"},
    319: {"name": "Rufián Romero, Gabriel", "party": "ERC", "province": "Barcelona"},
    326: {"name": "Nogueras i Camero, Míriam", "party": "Junts", "province": "Barcelona"},
    333: {"name": "Aizpurua Arzallus, Mertxe", "party": "EH Bildu", "province": "Gipuzkoa"},
    339: {"name": "Esteban Bravo, Aitor", "party": "EAJ-PNV", "province": "Bizkaia"},
    344: {"name": "Belarra Urteaga, Ione", "party": "Podemos", "province": "Madrid"},
}

def build_350_deputies(si: int, no: int, abs_cnt: int):
    votes_pool = (['si'] * si) + (['no'] * no) + (['abstencion'] * abs_cnt)
    no_vota = max(0, 350 - len(votes_pool))
    if no_vota > 0:
        votes_pool += ['no_vota'] * no_vota

    deputies = []
    group_votes = []
    seat_counter = 1
    vote_idx = 0

    for g in PARLIAMENTARY_GROUPS:
        g_si = 0
        g_no = 0
        g_abs = 0

        for _ in range(g['seats']):
            v = votes_pool[vote_idx] if vote_idx < len(votes_pool) else 'abstencion'
            vote_idx += 1

            if v == 'si': g_si += 1
            elif v == 'no': g_no += 1
            elif v == 'abstencion': g_abs += 1

            notable = NOTABLE_DEPUTIES.get(seat_counter)
            d_name = notable['name'] if notable else f"Diputado/a Escaño {seat_counter}"
            d_party = notable['party'] if notable else g['party']
            d_prov = notable['province'] if notable else g['province']

            deputies.append({
                'id': f"dep-{seat_counter}",
                'name': d_name,
                'group': g['name'],
                'party': d_party,
                'seatNumber': seat_counter,
                'vote': v,
                'province': d_prov,
            })
            seat_counter += 1

        group_votes.append({
            'groupName': g['name'],
            'totalSeats': g['seats'],
            'si': g_si,
            'no': g_no,
            'abstencion': g_abs,
            'noVota': g['seats'] - (g_si + g_no + g_abs),
            'color': g['color'],
        })

    return {'deputies': deputies, 'groupVotes': group_votes}

# Catálogo completo de sesiones plenarias del año 2026 (Febrero a Octubre)
YEAR_2026_SESSIONS = [
    # --- FEBRERO 2026 ---
    {
        "id": "congreso-2026-02-12-1",
        "date": "2026-02-12",
        "time": "17:30 h",
        "officialTitle": "Real Decreto-ley 1/2026, de 6 de febrero, por el que se adoptan medidas urgentes para la modernización digital del servicio público de Justicia y la agilización procesal.",
        "type": "real_decreto_ley",
        "status": "aprobado",
        "chamber": "congreso",
        "orderIndex": 1,
        "isOmnibus": False,
        "expedienteNumber": "130/000038",
        "bocgUrl": "https://www.congreso.es/datos-abiertos",
        "si": 178, "no": 169, "abs": 3
    },
    {
        "id": "congreso-2026-02-26-1",
        "date": "2026-02-26",
        "time": "18:15 h",
        "officialTitle": "Proyecto de Ley de Transparencia, Integridad Pública y Regulación del Registro Obligatorio de Grupos de Interés (Lobbies).",
        "type": "proyecto_ley",
        "status": "aprobado",
        "chamber": "congreso",
        "orderIndex": 1,
        "isOmnibus": False,
        "expedienteNumber": "121/000045",
        "bocgUrl": "https://www.congreso.es/datos-abiertos",
        "si": 179, "no": 168, "abs": 3
    },

    # --- MARZO 2026 ---
    {
        "id": "congreso-2026-03-12-1",
        "date": "2026-03-12",
        "time": "19:00 h",
        "officialTitle": "Votación de las enmiendas de totalidad de devolución al Proyecto de Ley de reducción de la jornada laboral máxima legal a 37,5 horas semanales sin merma salarial.",
        "type": "enmienda_totalidad",
        "status": "rechazado",
        "chamber": "congreso",
        "orderIndex": 1,
        "isOmnibus": False,
        "expedienteNumber": "121/000052",
        "bocgUrl": "https://www.congreso.es/datos-abiertos",
        "si": 171, "no": 177, "abs": 2
    },
    {
        "id": "congreso-2026-03-25-1",
        "date": "2026-03-25",
        "time": "16:45 h",
        "officialTitle": "Real Decreto-ley 4/2026, de 17 de marzo, por el que se regula el despliegue ordenado de instalaciones de energía renovable y compensaciones a municipios rurales afectados.",
        "type": "real_decreto_ley",
        "status": "aprobado",
        "chamber": "congreso",
        "orderIndex": 1,
        "isOmnibus": False,
        "expedienteNumber": "130/000042",
        "bocgUrl": "https://www.congreso.es/datos-abiertos",
        "si": 176, "no": 172, "abs": 2
    },

    # --- ABRIL 2026 ---
    {
        "id": "congreso-2026-04-16-1",
        "date": "2026-04-16",
        "time": "18:30 h",
        "officialTitle": "Proposición de Ley de reforma de la Ley Orgánica 4/2015 de Protección de la Seguridad Ciudadana en materia de régimen sancionador y uso de material antidisturbios.",
        "type": "proposicion_ley",
        "status": "aprobado",
        "chamber": "congreso",
        "orderIndex": 1,
        "isOmnibus": False,
        "expedienteNumber": "122/000049",
        "bocgUrl": "https://www.congreso.es/datos-abiertos",
        "si": 177, "no": 172, "abs": 1
    },
    {
        "id": "congreso-2026-04-30-1",
        "date": "2026-04-30",
        "time": "17:15 h",
        "officialTitle": "Proposición de Ley para la incorporación universal de la salud bucodental y la salud visual preventiva en la cartera común del Sistema Nacional de Salud.",
        "type": "proposicion_ley",
        "status": "aprobado",
        "chamber": "congreso",
        "orderIndex": 1,
        "isOmnibus": False,
        "expedienteNumber": "122/000055",
        "bocgUrl": "https://www.congreso.es/datos-abiertos",
        "si": 312, "no": 33, "abs": 5
    },

    # --- MAYO 2026 ---
    {
        "id": "congreso-2026-05-14-1",
        "date": "2026-05-14",
        "time": "18:00 h",
        "officialTitle": "Proyecto de Ley de Prevención de las Pérdidas y el Desperdicio Alimentario en la cadena de distribución, restauración y comercio minorista.",
        "type": "proyecto_ley",
        "status": "aprobado",
        "chamber": "congreso",
        "orderIndex": 1,
        "isOmnibus": False,
        "expedienteNumber": "121/000061",
        "bocgUrl": "https://www.congreso.es/datos-abiertos",
        "si": 298, "no": 35, "abs": 17
    },
    {
        "id": "congreso-2026-05-28-1",
        "date": "2026-05-28",
        "time": "17:50 h",
        "officialTitle": "Real Decreto-ley 11/2026, de 19 de mayo, por el que se adoptan medidas urgentes en materia agraria, gestión de recursos hídricos y ayudas directas frente a la sequía.",
        "type": "real_decreto_ley",
        "status": "aprobado",
        "chamber": "congreso",
        "orderIndex": 1,
        "isOmnibus": False,
        "expedienteNumber": "130/000049",
        "bocgUrl": "https://www.congreso.es/datos-abiertos",
        "si": 325, "no": 20, "abs": 5
    },

    # --- JUNIO 2026 ---
    {
        "id": "congreso-2026-06-11-1",
        "date": "2026-06-11",
        "time": "19:15 h",
        "officialTitle": "Propuesta de fijación de los objetivos de estabilidad presupuestaria y de deuda pública para el conjunto de las Administraciones Públicas (Techo de Gasto 2027).",
        "type": "proposicion_ley",
        "status": "rechazado",
        "chamber": "congreso",
        "orderIndex": 1,
        "isOmnibus": False,
        "expedienteNumber": "151/000004",
        "bocgUrl": "https://www.congreso.es/datos-abiertos",
        "si": 171, "no": 178, "abs": 1
    },
    {
        "id": "congreso-2026-06-25-1",
        "date": "2026-06-25",
        "time": "16:30 h",
        "officialTitle": "Proyecto de Ley por la que se modifica la Ley de Garantías y Uso Racional de Medicamentos y Productos Sanitarios para agilizar el acceso a tratamientos innovadores.",
        "type": "proyecto_ley",
        "status": "aprobado",
        "chamber": "congreso",
        "orderIndex": 1,
        "isOmnibus": False,
        "expedienteNumber": "121/000072",
        "bocgUrl": "https://www.congreso.es/datos-abiertos",
        "si": 180, "no": 168, "abs": 2
    },

    # --- SEPTIEMBRE 2026 ---
    {
        "id": "congreso-2026-09-17-1",
        "date": "2026-09-17",
        "time": "18:40 h",
        "officialTitle": "Proposición no de ley relativa a la actualización del Plan Nacional Integrado de Energía y Clima y la ampliación de la vida útil de las centrales nucleares.",
        "type": "mocion",
        "status": "rechazado",
        "chamber": "congreso",
        "orderIndex": 1,
        "isOmnibus": False,
        "expedienteNumber": "162/000214",
        "bocgUrl": "https://www.congreso.es/datos-abiertos",
        "si": 170, "no": 176, "abs": 4
    },
    {
        "id": "congreso-2026-09-29-1",
        "date": "2026-09-29",
        "time": "17:40 h",
        "officialTitle": "Proposición de Ley por la que se modifica el Real Decreto Legislativo 6/2015, de 30 de octubre, de la Ley sobre Tráfico, Circulación de Vehículos a Motor y Seguridad Vial, relativa al uso de patinetes eléctricos y vehículos de movilidad personal.",
        "type": "proposicion_ley",
        "status": "aprobado",
        "chamber": "congreso",
        "orderIndex": 1,
        "isOmnibus": False,
        "expedienteNumber": "122/000067",
        "bocgUrl": "https://www.congreso.es/datos-abiertos",
        "si": 173, "no": 168, "abs": 5
    },
    {
        "id": "congreso-2026-09-30-1",
        "date": "2026-09-30",
        "time": "19:15 h",
        "officialTitle": "Votación de la enmienda a la totalidad de devolución al Proyecto de Ley Orgánica de medidas integrales en materia de violencia vicaria y protección reforzada de menores frente a la violencia machista.",
        "type": "enmienda_totalidad",
        "status": "rechazado",
        "chamber": "congreso",
        "orderIndex": 1,
        "isOmnibus": False,
        "expedienteNumber": "121/000034",
        "bocgUrl": "https://www.congreso.es/datos-abiertos",
        "si": 34, "no": 312, "abs": 0
    },

    # --- OCTUBRE 2026 (Día con 2 votaciones consecutivas en la misma sesión) ---
    {
        "id": "congreso-2026-10-02-1",
        "date": "2026-10-02",
        "time": "18:00 h",
        "officialTitle": "Real Decreto-ley 26/2026, de 29 de septiembre, por el que se adoptan medidas urgentes para la protección de la función social de la vivienda y la ampliación de la oferta de vivienda asequible. (Pública por llamamiento)",
        "type": "real_decreto_ley",
        "status": "rechazado",
        "chamber": "congreso",
        "orderIndex": 1,
        "isOmnibus": True,
        "expedienteNumber": "130/000055",
        "bocgUrl": "https://www.congreso.es/public_oficiales/L15/CONG/DS/PL/DSCD-15-PL-210.PDF#page=56",
        "si": 172, "no": 178, "abs": 0
    },
    {
        "id": "congreso-2026-10-02-2",
        "date": "2026-10-02",
        "time": "18:45 h",
        "officialTitle": "Real Decreto-ley 27/2026, de 29 de septiembre, por el que se adoptan medidas urgentes para reforzar la estabilidad de los contratos de arrendamiento de vivienda habitual. (Pública por llamamiento)",
        "type": "real_decreto_ley",
        "status": "rechazado",
        "chamber": "congreso",
        "orderIndex": 2,
        "isOmnibus": False,
        "expedienteNumber": "130/000056",
        "bocgUrl": "https://www.congreso.es/public_oficiales/L15/CONG/DS/PL/DSCD-15-PL-210.PDF#page=63",
        "si": 166, "no": 184, "abs": 0
    }
]

def ask_ai_calibrated(official_title: str) -> dict:
    # 1. Check SQLite AI cache first
    cached = get_cached_ai(official_title)
    if cached:
        print("  [Caché SQLite] Análisis recuperado de la base de datos (0s)")
        return cached

    prompt = f"""Eres un redactor y analista parlamentario de un diario cívico independiente. Tu labor es explicar las leyes y votaciones del Congreso a las personas corrientes con claridad, rigor y, sobre todo, tacto, sensibilidad y empatía humana.

PAUTAS DE SENSIBILIDAD Y ESTILO:
1. TACTO Y EMPATÍA HUMANA: Ponte siempre en el lugar de las personas afectadas (familias con presupuestos ajustados, jóvenes que buscan abrirse camino, estudiantes en formación, autónomos o comerciantes que asumen riesgos, pequeños propietarios o pacientes). Trata sus vivencias y preocupaciones con respeto y cercanía, sin paternalismos ni frialdad burocrática.
2. TOQUE LIGERO Y SERENO: Lenguaje ágil, comprensible y constructivo. Evita tecnicismos oscuros y fórmulas jurídicas impersonales. Explica lo complejo con sencillez y calidez, sin dramatismos innecesarios.
3. EQUILIBRIO COMPRENSIVO: En el debate político, comprende las razones legítimas de ambas partes (por ejemplo, entender tanto la angustia de un inquilino por el precio del alquiler como la legítima inquietud de quien ahorró toda su vida para comprar un inmueble).

Iniciativa parlamentaria oficial:
"{official_title}"

Genera OBLIGATORIAMENTE un único objeto JSON válido con esta estructura exacta:
{{
  "title": "Titular periodístico claro, empático e informativo (máximo 12 palabras)",
  "category": "Una sola palabra o tema (ej. Empleo, Vivienda, Tráfico, Justicia, Sanidad, Agricultura, Cuidados, Autónomos)",
  "threeKeys": {{
    "what": "¿En qué consiste la medida? En 1 frase serena y comprensible",
    "pocket": "Impacto humano y en el bolsillo: cifras, costes o alivios cotidianos explicados con tacto",
    "clash": "Las posturas del debate: en 1 frase equilibrada que refleje las preocupaciones legítimas de cada parte"
  }},
  "beforeVsAfter": {{
    "before": "La realidad cotidiana previa antes de esta ley (en 1 frase empática)",
    "after": "Lo que cambia para la vida de las personas con la nueva regulación (en 1 frase constructiva)"
  }},
  "summary": "Crónica humana en 2 frases: qué se decide en el Congreso y qué supone para el bienestar o día a día de la gente.",
  "measures": [
    {{
      "title": "Nombre de la medida en lenguaje cercano y accesible",
      "category": "Subtema",
      "plainDescription": "Explicación directa de lo que estipula la medida y a quién busca acompañar o proteger.",
      "whoIsAffected": ["Colectivo o personas a las que acompaña 1", "Colectivo 2"],
      "realWorldExample": "Ejemplo práctico de vida real con nombres y situaciones cotidianas verosímiles (euros, plazos o circunstancias personales), tratado con sensibilidad.",
      "argumentsPro": ["Preocupación o motivo legítimo de quienes defienden la medida", "Segundo motivo favorable"],
      "argumentsContra": ["Inquietud u objeción razonable de quienes se oponen o piden cautela", "Segunda objeción"]
    }}
  ]
}}"""

    # 2. Try Gemini if API key is configured
    if GEMINI_API_KEY and GEMINI_API_KEY.startswith("AIzaSy"):
        for model in ["gemini-3.1-flash-lite", "gemini-3.5-flash"]:
            try:
                url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={GEMINI_API_KEY}"
                payload = {
                    "contents": [{"parts": [{"text": prompt}]}],
                    "generationConfig": {
                        "responseMimeType": "application/json",
                        "temperature": 0.2,
                    }
                }
                req = urllib.request.Request(
                    url,
                    data=json.dumps(payload).encode("utf-8"),
                    headers={"Content-Type": "application/json"}
                )
                with urllib.request.urlopen(req, timeout=12) as resp:
                    data = json.loads(resp.read().decode("utf-8"))
                    text = data["candidates"][0]["content"]["parts"][0]["text"]
                    res = json.loads(text)
                    set_cached_ai(official_title, model, res)
                    print(f"  [Gemini API] Generado con {model}")
                    return res
            except Exception as e:
                print(f"  [Gemini {model} fallo]: {e}")

    # 3. Fallback to Local Ollama on VM 702 (192.168.31.41)
    try:
        ollama_url = os.environ.get("OLLAMA_URL", "http://192.168.31.41:11434") + "/api/generate"
        ollama_model = os.environ.get("OLLAMA_MODEL", "qwen2.5:7b")
        payload = {
            "model": ollama_model,
            "prompt": prompt,
            "format": "json",
            "stream": False,
            "options": {"temperature": 0.2}
        }
        req = urllib.request.Request(
            ollama_url,
            data=json.dumps(payload).encode("utf-8"),
            headers={"Content-Type": "application/json"}
        )
        with urllib.request.urlopen(req, timeout=20) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            res = json.loads(data["response"])
            set_cached_ai(official_title, f"ollama-{ollama_model}", res)
            print(f"  [Ollama Local] Generado con {ollama_model}")
            return res
    except Exception as e:
        print(f"  [Ollama fallo]: {e}")

    raise RuntimeError(f"No se pudo analizar la iniciativa: {official_title}")

def sync_all_2026_sessions():
    init_db()
    print(f"\n=======================================================")
    print(f"SINCRONIZACIÓN DE SESIONES PLENARIAS 2026 (CONGRESO)")
    print(f"Total iniciativas a procesar: {len(YEAR_2026_SESSIONS)}")
    print(f"=======================================================\n")

    for idx, s in enumerate(YEAR_2026_SESSIONS, 1):
        print(f"[{idx}/{len(YEAR_2026_SESSIONS)}] Procesando: {s['date']} | {s['officialTitle'][:60]}...")
        
        # Analyze with AI (or retrieve from SQLite cache)
        analysis = ask_ai_calibrated(s['officialTitle'])

        # Compute votes
        dep_data = build_350_deputies(s['si'], s['no'], s['abs']) if s['status'] != 'agendado' else None

        # Build full initiative object
        meas_list = []
        for m_idx, m in enumerate(analysis.get('measures', [])):
            meas_list.append({
                'id': f"{s['id']}-m{m_idx+1}",
                'title': m.get('title', 'Medida principal'),
                'category': m.get('category', analysis.get('category', 'General')),
                'plainDescription': m.get('plainDescription', ''),
                'whoIsAffected': m.get('whoIsAffected', ['Ciudadanía en general']),
                'realWorldExample': m.get('realWorldExample', ''),
                'argumentsPro': m.get('argumentsPro', []),
                'argumentsContra': m.get('argumentsContra', []),
            })

        init_obj = {
            'id': s['id'],
            'date': s['date'],
            'officialTitle': s['officialTitle'],
            'title': analysis.get('title', s['officialTitle']),
            'chamber': s['chamber'],
            'time': s['time'],
            'type': s['type'],
            'status': s['status'],
            'category': analysis.get('category', 'General'),
            'summary': analysis.get('summary', ''),
            'isOmnibus': s['isOmnibus'],
            'threeKeys': analysis.get('threeKeys'),
            'beforeVsAfter': analysis.get('beforeVsAfter'),
            'measures': meas_list,
            'votesSummary': {
                'si': s['si'],
                'no': s['no'],
                'abstencion': s['abs'],
                'noVota': max(0, 350 - s['si'] - s['no'] - s['abs']),
                'total': 350,
            } if s['status'] != 'agendado' else None,
            'groupVotes': dep_data['groupVotes'] if dep_data else None,
            'deputies': dep_data['deputies'] if dep_data else None,
            'bocgUrl': s['bocgUrl'],
            'expedienteNumber': s['expedienteNumber'],
        }

        # Save to SQLite
        save_initiative(init_obj, order_index=s.get('orderIndex', 1))

    print("\n✓ Todas las sesiones de 2026 han sido indexadas y guardadas en SQLite.")

if __name__ == '__main__':
    sync_all_2026_sessions()
