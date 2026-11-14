#!/usr/bin/env python3
"""
scripts/generate_full_gemini_dataset.py
Procesa TODAS las iniciativas mostradas en QueVotan a través de Google Gemini API
en un LENGUAJE CLARO DE LA CALLE (de tú a tú, sin tecnicismos ni palabras raras, sin ser basto)
y genera las infografías de "Las 3 Claves en 30 Segundos" y "Antes vs. Con esta Ley".
"""

import os
import re
import json
import time
import urllib.request
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
ENV_FILE = BASE_DIR / ".env"

if ENV_FILE.exists():
    with open(ENV_FILE, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                key, val = line.split("=", 1)
                os.environ.setdefault(key.strip(), val.strip().strip('"').strip("'"))

GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")
PRIMARY_MODEL = os.environ.get("GEMINI_MODEL", "gemini-3.5-flash")

INITIATIVES_RAW = [
    {
        "id": "congreso-2026-10-02-1",
        "officialTitle": "Real Decreto-ley 26/2026, de 29 de septiembre, por el que se adoptan medidas urgentes para la protección de la función social de la vivienda y la ampliación de la oferta de vivienda asequible. (Pública por llamamiento)",
        "date": "2026-10-02",
        "time": "18:00 h",
        "type": "real_decreto_ley",
        "status": "rechazado",
        "chamber": "congreso",
        "isOmnibus": True,
        "expedienteNumber": "130/000055",
        "bocgUrl": "https://www.congreso.es/public_oficiales/L15/CONG/DS/PL/DSCD-15-PL-210.PDF#page=56",
        "si": 172, "no": 178, "abs": 0
    },
    {
        "id": "congreso-2026-10-02-2",
        "officialTitle": "Real Decreto-ley 27/2026, de 29 de septiembre, por el que se adoptan medidas urgentes para reforzar la estabilidad de los contratos de arrendamiento de vivienda habitual. (Pública por llamamiento)",
        "date": "2026-10-02",
        "time": "18:45 h",
        "type": "real_decreto_ley",
        "status": "rechazado",
        "chamber": "congreso",
        "isOmnibus": False,
        "expedienteNumber": "130/000056",
        "bocgUrl": "https://www.congreso.es/public_oficiales/L15/CONG/DS/PL/DSCD-15-PL-210.PDF#page=63",
        "si": 166, "no": 184, "abs": 0
    },
    {
        "id": "congreso-2026-09-30-1",
        "officialTitle": "Votación de la enmienda a la totalidad de devolución al Proyecto de Ley Orgánica de medidas integrales en materia de violencia vicaria y protección reforzada de menores frente a la violencia machista.",
        "date": "2026-09-30",
        "time": "19:15 h",
        "type": "enmienda_totalidad",
        "status": "rechazado",
        "chamber": "congreso",
        "isOmnibus": False,
        "expedienteNumber": "121/000034",
        "bocgUrl": "https://www.congreso.es/datos-abiertos",
        "si": 34, "no": 312, "abs": 0
    },
    {
        "id": "congreso-2026-09-29-1",
        "officialTitle": "Proposición de Ley por la que se modifica el Real Decreto Legislativo 6/2015, de 30 de octubre, de la Ley sobre Tráfico, Circulación de Vehículos a Motor y Seguridad Vial, relativa al uso de patinetes eléctricos y vehículos de movilidad personal.",
        "date": "2026-09-29",
        "time": "17:40 h",
        "type": "proposicion_ley",
        "status": "aprobado",
        "chamber": "congreso",
        "isOmnibus": False,
        "expedienteNumber": "122/000067",
        "bocgUrl": "https://www.congreso.es/datos-abiertos",
        "si": 173, "no": 168, "abs": 5
    }
]


def ask_gemini(official_title: str) -> dict:
    prompt = f"""Eres un redactor y analista parlamentario de un diario cívico independiente. Tu labor es explicar las leyes y votaciones del Congreso a las personas corrientes con claridad, rigor y, sobre todo, tacto, sensibilidad y empatía humana.

PAUTAS DE SENSIBILIDAD Y ESTILO:
1. TACTO Y EMPATÍA HUMANA: Ponte siempre en el lugar de las personas afectadas (familias con presupuestos ajustados, jóvenes que buscan abrirse camino, estudiantes en formación, autónomos o comerciantes que asumen riesgos, pequeños propietarios o pacientes). Trata sus vivencias y preocupaciones con respeto y cercanía, sin paternalismos ni frialdad burocrática.
2. TOQUE LIGERO Y SERENO: Lenguaje ágil, comprensible y constructivo. Evita tecnicismos oscuros y fórmulas jurídicas impersonales. Explica lo complejo con sencillez y calidez, sin dramatismos innecesarios.
3. EQUILIBRIO COMPRENSIVO: En el debate político, comprende las razones legítimas de ambas partes (por ejemplo, entender tanto la angustia de un inquilino por el precio del alquiler como la legítima inquietud de quien ahorró toda su vida para comprar un inmueble).

Iniciativa parlamentaria oficial:
"{official_title}"

Genera OBLIGATORIAMENTE un único objeto JSON válido con esta estructura:
{{
  "title": "Titular periodístico claro, empático e informativo (máximo 12 palabras)",
  "category": "Una sola palabra o tema (ej. Empleo, Vivienda, Tráfico, Justicia, Sanidad, Cuidados, Autónomos)",
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

    for model in [PRIMARY_MODEL, "gemini-3.1-flash-lite"]:
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
            with urllib.request.urlopen(req, timeout=25) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                raw_text = data["candidates"][0]["content"]["parts"][0]["text"]
                parsed = json.loads(raw_text)
                return parsed
        except Exception as e:
            print(f"⚠️ Reintentando tras error: {e}")
            time.sleep(1)

    raise RuntimeError(f"Error permanente con Gemini para: {official_title}")


def normalize_list(val) -> list:
    if isinstance(val, list):
        return [str(x).strip() for x in val if str(x).strip()]
    elif isinstance(val, str):
        return [x.strip() for x in re.split(r'[,;•\.\n]+', val) if x.strip() and len(x.strip()) > 1]
    return []


def main():
    print("=" * 70)
    print("✨ GENERACIÓN DEL DATASET EN LENGUAJE DE LA CALLE CON GEMINI")
    print("=" * 70)

    enriched = []

    for i, item in enumerate(INITIATIVES_RAW):
        print(f"\n[{i+1}/{len(INITIATIVES_RAW)}] Procesando con Gemini:")
        print(f"   📅 {item['date']} | {item['officialTitle'][:75]}...")

        t0 = time.time()
        g_data = ask_gemini(item["officialTitle"])
        dur = round(time.time() - t0, 2)
        print(f"   ✓ Generado en {dur}s:")
        print(f"     📰 Titular: \"{g_data.get('title')}\"")
        print(f"     🎯 Clave 1: {g_data.get('threeKeys', {}).get('what')}")
        print(f"     💶 Bolsillo: {g_data.get('threeKeys', {}).get('pocket')}")

        measures = []
        for m_idx, m in enumerate(g_data.get("measures", [])):
            measures.append({
                "id": f"{item['id']}-m{m_idx + 1}",
                "title": m.get("title", f"Medida {m_idx + 1}"),
                "category": m.get("category", g_data.get("category", "General")),
                "plainDescription": m.get("plainDescription", ""),
                "whoIsAffected": normalize_list(m.get("whoIsAffected")),
                "realWorldExample": str(m.get("realWorldExample", "")),
                "argumentsPro": normalize_list(m.get("argumentsPro")),
                "argumentsContra": normalize_list(m.get("argumentsContra")),
            })

        initiative = {
            "id": item["id"],
            "title": g_data.get("title", item["officialTitle"][:75]),
            "officialTitle": item["officialTitle"],
            "chamber": item["chamber"],
            "date": item["date"],
            "time": item["time"],
            "type": item["type"],
            "status": item["status"],
            "category": g_data.get("category", "Política Nacional"),
            "summary": g_data.get("summary", ""),
            "threeKeys": g_data.get("threeKeys", {
                "what": "Iniciativa parlamentaria debatida en el Congreso.",
                "pocket": "Impacto en las normas y costes del sector.",
                "clash": "Discrepancia entre partidos de gobierno y oposición."
            }),
            "beforeVsAfter": g_data.get("beforeVsAfter", {
                "before": "Normativa anterior vigente hasta la fecha.",
                "after": "Cambios introducidos por esta propuesta legal."
            }),
            "isOmnibus": item["isOmnibus"],
            "measures": measures,
            "bocgUrl": item["bocgUrl"],
            "expedienteNumber": item["expedienteNumber"],
            "si": item["si"],
            "no": item["no"],
            "abs": item["abs"]
        }
        enriched.append(initiative)
        time.sleep(0.5)

    out_ts = BASE_DIR / "src" / "data" / "mockParliament.ts"
    print(f"\n💾 Escribiendo en: {out_ts}")

    ts_content = """import type { Initiative, CalendarDay, DeputyVote, GroupVoteSummary } from '../types/parliament';

const PARLIAMENTARY_GROUPS = [
  { name: 'G.P. Popular (PP)', seats: 137, color: '#0ea5e9', party: 'PP', province: 'Madrid' },
  { name: 'G.P. Socialista (PSOE)', seats: 121, color: '#ef4444', party: 'PSOE', province: 'Madrid' },
  { name: 'G.P. VOX', seats: 33, color: '#22c55e', party: 'VOX', province: 'Madrid' },
  { name: 'G.P. Plurinacional Sumar', seats: 27, color: '#ec4899', party: 'Sumar', province: 'Barcelona' },
  { name: 'G.P. Republicano (ERC)', seats: 7, color: '#f59e0b', party: 'ERC', province: 'Barcelona' },
  { name: 'G.P. Junts per Catalunya', seats: 7, color: '#06b6d4', party: 'Junts', province: 'Girona' },
  { name: 'G.P. Euskal Herria Bildu', seats: 6, color: '#84cc16', party: 'EH Bildu', province: 'Gipuzkoa' },
  { name: 'G.P. Vasco (EAJ-PNV)', seats: 5, color: '#10b981', party: 'EAJ-PNV', province: 'Bizkaia' },
  { name: 'G.P. Mixto (Podemos/BNG/CC/UPN)', seats: 7, color: '#8b5cf6', party: 'Mixto', province: 'A Coruña' },
];

const NOTABLE_DEPUTIES: Record<number, { name: string; party: string; province: string }> = {
  1: { name: 'Feijóo Feijóo, Alberto Núñez', party: 'PP', province: 'Madrid' },
  2: { name: 'Gamarra Ruiz-Clavijo, Concepción', party: 'PP', province: 'La Rioja' },
  3: { name: 'Tellado Filgueira, Miguel Ángel', party: 'PP', province: 'A Coruña' },
  138: { name: 'Sánchez Pérez-Castejón, Pedro', party: 'PSOE', province: 'Madrid' },
  139: { name: 'Montero Cuadrado, María Jesús', party: 'PSOE', province: 'Sevilla' },
  140: { name: 'López Álvarez, Patxi', party: 'PSOE', province: 'Bizkaia' },
  259: { name: 'Abascal Conde, Santiago', party: 'VOX', province: 'Madrid' },
  260: { name: 'Pepa Millán, María José', party: 'VOX', province: 'Sevilla' },
  292: { name: 'Díaz Pérez, Yolanda', party: 'Sumar', province: 'Madrid' },
  293: { name: 'Errejón Galván, Íñigo', party: 'Sumar', province: 'Madrid' },
  319: { name: 'Rufián Romero, Gabriel', party: 'ERC', province: 'Barcelona' },
  326: { name: 'Nogueras i Camero, Míriam', party: 'Junts', province: 'Barcelona' },
  333: { name: 'Aizpurua Arzallus, Mertxe', party: 'EH Bildu', province: 'Gipuzkoa' },
  339: { name: 'Esteban Bravo, Aitor', party: 'EAJ-PNV', province: 'Bizkaia' },
  344: { name: 'Belarra Urteaga, Ione', party: 'Podemos', province: 'Madrid' },
};

export function build350Deputies(si: number, no: number, abs: number): { deputies: DeputyVote[]; groupVotes: GroupVoteSummary[] } {
  const votesPool: Array<'si' | 'no' | 'abstencion' | 'no_vota'> = [
    ...Array(si).fill('si'),
    ...Array(no).fill('no'),
    ...Array(abs).fill('abstencion'),
  ];
  const noVota = 350 - votesPool.length;
  if (noVota > 0) {
    votesPool.push(...Array(noVota).fill('no_vota'));
  }

  const deputies: DeputyVote[] = [];
  const groupVotes: GroupVoteSummary[] = [];
  let seatCounter = 1;
  let voteIdx = 0;

  for (const g of PARLIAMENTARY_GROUPS) {
    let gSi = 0;
    let gNo = 0;
    let gAbs = 0;

    for (let i = 0; i < g.seats; i++) {
      const v = votesPool[voteIdx] || 'abstencion';
      voteIdx++;

      if (v === 'si') gSi++;
      else if (v === 'no') gNo++;
      else if (v === 'abstencion') gAbs++;

      const notable = NOTABLE_DEPUTIES[seatCounter];
      const dName = notable?.name || `Diputado/a Escaño ${seatCounter}`;
      const dParty = notable?.party || g.party;
      const dProv = notable?.province || g.province;

      deputies.push({
        id: `dep-${seatCounter}`,
        name: dName,
        group: g.name,
        party: dParty,
        seatNumber: seatCounter,
        vote: v,
        province: dProv,
      });
      seatCounter++;
    }

    groupVotes.push({
      groupName: g.name,
      totalSeats: g.seats,
      si: gSi,
      no: gNo,
      abstencion: gAbs,
      noVota: g.seats - (gSi + gNo + gAbs),
      color: g.color,
    });
  }

  return { deputies, groupVotes };
}

export const SAMPLE_INITIATIVES: Initiative[] = [
"""

    for init in enriched:
        has_votes = init["si"] > 0 or init["no"] > 0 or init["abs"] > 0
        votes_call = f"build350Deputies({init['si']}, {init['no']}, {init['abs']})" if has_votes else "null"

        ts_content += f"""  {{
    id: {json.dumps(init['id'])},
    title: {json.dumps(init['title'], ensure_ascii=False)},
    officialTitle: {json.dumps(init['officialTitle'], ensure_ascii=False)},
    chamber: {json.dumps(init['chamber'])},
    date: {json.dumps(init['date'])},
    time: {json.dumps(init['time'])},
    type: {json.dumps(init['type'])},
    status: {json.dumps(init['status'])},
    category: {json.dumps(init['category'], ensure_ascii=False)},
    summary: {json.dumps(init['summary'], ensure_ascii=False)},
    isOmnibus: {str(init['isOmnibus']).lower()},
    threeKeys: {json.dumps(init['threeKeys'], ensure_ascii=False, indent=6)},
    beforeVsAfter: {json.dumps(init['beforeVsAfter'], ensure_ascii=False, indent=6)},
    measures: {json.dumps(init['measures'], ensure_ascii=False, indent=6)},
"""
        if has_votes:
            ts_content += f"""    votesSummary: {{
      si: {init['si']},
      no: {init['no']},
      abstencion: {init['abs']},
      noVota: {350 - (init['si'] + init['no'] + init['abs'])},
      total: 350,
    }},
    groupVotes: {votes_call}?.groupVotes,
    deputies: {votes_call}?.deputies,
"""
        ts_content += f"""    bocgUrl: {json.dumps(init['bocgUrl'])},
    expedienteNumber: {json.dumps(init['expedienteNumber'])},
  }},
"""

    ts_content += """];

export function getCalendarDaysForMonth(year: number, month: number): CalendarDay[] {
  const daysInMonth = new Date(year, month, 0).getDate();
  const calendarDays: CalendarDay[] = [];

  for (let day = 1; day <= daysInMonth; day++) {
    const dayStr = day < 10 ? `0${day}` : `${day}`;
    const monthStr = month < 10 ? `0${month}` : `${month}`;
    const dateStr = `${year}-${monthStr}-${dayStr}`;

    const dayInitiatives = SAMPLE_INITIATIVES.filter((i) => i.date === dateStr);
    const hasSession = dayInitiatives.length > 0;

    let status: CalendarDay['status'] = 'no_session';
    if (dateStr === '2026-10-24') {
      status = 'today';
    } else if (hasSession) {
      const allDone = dayInitiatives.every((i) => i.status === 'aprobado' || i.status === 'rechazado');
      status = allDone ? 'past' : 'upcoming';
    }

    const approvedCount = dayInitiatives.filter((i) => i.status === 'aprobado').length;
    const rejectedCount = dayInitiatives.filter((i) => i.status === 'rechazado').length;
    const scheduledCount = dayInitiatives.filter((i) => i.status === 'agendado').length;
    const inProgressCount = dayInitiatives.filter((i) => i.status === 'en_tramite').length;

    calendarDays.push({
      dateStr,
      dayNumber: day,
      status,
      hasSession,
      initiativesCount: dayInitiatives.length,
      approvedCount,
      rejectedCount,
      scheduledCount,
      inProgressCount,
      initiatives: dayInitiatives,
    });
  }

  return calendarDays;
}
"""

    with open(out_ts, "w", encoding="utf-8") as f:
        f.write(ts_content)

    print("✨ Dataset en lenguaje de calle generado con éxito.")


if __name__ == "__main__":
    main()
