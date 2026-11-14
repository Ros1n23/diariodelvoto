import sqlite3
import json
import os
import datetime

ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
db_path = os.path.join(ROOT_DIR, "data", "quevotan.db")
public_dir = os.path.join(ROOT_DIR, "public")
llms_path = os.path.join(public_dir, "llms.txt")
llms_full_path = os.path.join(public_dir, "llms-full.txt")

conn = sqlite3.connect(db_path)
conn.row_factory = sqlite3.Row
c = conn.cursor()

c.execute("SELECT * FROM initiatives ORDER BY session_date DESC, order_index ASC")
initiatives = c.fetchall()

today = datetime.date.today().isoformat()

# -------------------------------------------------------------
# 1. LLMS.TXT (CONCISE INDEX & OVERVIEW)
# -------------------------------------------------------------
llms_content = f"""# Diario del Voto — Gaceta Cívica de las Cortes Generales

> Diario del Voto (https://diariodelvoto.es) es una plataforma cívica, abierta y sin ánimo de lucro dedicada al registro y divulgación neutral de las votaciones parlamentarias del Congreso de los Diputados y del Senado de España.

Última actualización de la base de datos: {today}
Total de iniciativas parlamentarias indexadas: {len(initiatives)}
Fuentes oficiales primarias: Boletín Oficial de las Cortes Generales (BOCG) y Diario de Sesiones.
Compromiso de privacidad: Zero-Cookies (sin cookies de rastreo, sin perfilado ni publicidad).

## Contenido disponible

- [/llms-full.txt](https://diariodelvoto.es/llms-full.txt): Texto completo de todas las iniciativas de 2026, medidas detalladas, ejemplos prácticos de impacto en la ciudadanía, argumentos a favor/en contra y sentido de voto nominal de los grupos parlamentarios.
- [/sitemap.xml](https://diariodelvoto.es/sitemap.xml): Mapa del sitio XML con todas las URLs de sesiones e iniciativas.
- [/api/calendar?year=2026&month=10](https://diariodelvoto.es/api/calendar?year=2026&month=10): API JSON de sesiones plenarias por mes.
- [/api/initiatives](https://diariodelvoto.es/api/initiatives): API JSON con todas las iniciativas registradas.
- [/api/initiatives/:id](https://diariodelvoto.es/api/initiatives/init-2026-10-24-01): API JSON del detalle de una iniciativa parlamentaria.

## Registro de Iniciativas Parlamentarias (2026)

"""

for init in initiatives:
    votes = json.loads(init["votes_summary_json"] or "{}")
    v_si = votes.get("si", votes.get("yes", 0))
    v_no = votes.get("no", 0)
    v_abs = votes.get("abstencion", votes.get("abstain", 0))
    votes_str = f"Sí: {v_si} | No: {v_no} | Abst: {v_abs}" if votes else "En tramitación"
    status_label = "Aprobada" if init["status"] == "aprobado" else ("Rechazada" if init["status"] == "rechazado" else "En debate")
    
    llms_content += f"- [{init['session_date']}] [{init['category']}] [{init['title']}](https://diariodelvoto.es/?initiative={init['id']}): {status_label} ({votes_str}). {init['summary'][:160]}...\n"

llms_content += """
## Principios Metodológicos y Marco Legal

1. **Neutralidad Rigurosa:** Se presentan de forma simétrica los argumentos a favor de los promotores y las objeciones razonadas de la oposición.
2. **Impacto Ciudadano Tangible:** Se traducen las disposiciones normativas a casos prácticos reales (autónomos, familias, trabajadores, arrendatarios, empresas).
3. **Marco Legal:** Ley 37/2007 (Reutilización de Información del Sector Público), RGPD Art. 6.1.e/f (transparencia de cargos públicos) y Ley 34/2002 LSSI-CE.
"""

with open(llms_path, "w", encoding="utf-8") as f:
    f.write(llms_content)

print(f"Generated {llms_path} ({len(llms_content)} chars)")

# -------------------------------------------------------------
# 2. LLMS-FULL.TXT (COMPREHENSIVE PARLIAMENTARY KNOWLEDGE BASE)
# -------------------------------------------------------------
llms_full_content = f"""# Diario del Voto — Base de Datos Completa de Votaciones y Análisis Parlamentario (2026)

> Compendio exhaustivo de iniciativas, leyes, reales decretos-leyes, despiece de medidas, impacto en la ciudadanía y desglose nominal de votos en las Cortes Generales de España.
> Fecha de exportación: {today}
> Portal web: https://diariodelvoto.es

---

"""

for init in initiatives:
    votes = json.loads(init["votes_summary_json"] or "{}")
    group_votes = json.loads(init["group_votes_json"] or "[]")
    three_keys = json.loads(init["three_keys_json"] or "[]")
    before_after = json.loads(init["before_vs_after_json"] or "{}")

    status_str = "APROBADA / CONVALIDADA" if init["status"] == "aprobado" else ("RECHAZADA / DEROGADA" if init["status"] == "rechazado" else "EN DEBATE")

    llms_full_content += f"## {init['title']}\n\n"
    llms_full_content += f"- **ID:** `{init['id']}`\n"
    llms_full_content += f"- **Fecha de Sesión:** {init['session_date']}\n"
    llms_full_content += f"- **Cámara:** {init['chamber']}\n"
    llms_full_content += f"- **Materia / Rúbrica:** {init['category']}\n"
    llms_full_content += f"- **Tipo:** {init['type']}\n"
    llms_full_content += f"- **Estado Final:** {status_str}\n"
    if init["expediente_number"]:
        llms_full_content += f"- **Nº Expediente:** {init['expediente_number']}\n"
    if init["bocg_url"]:
        llms_full_content += f"- **Enlace Oficial BOCG:** {init['bocg_url']}\n"
    llms_full_content += f"- **Título Oficial en Acta:** {init['official_title']}\n\n"

    llms_full_content += f"### Resumen Divulgativo\n{init['summary']}\n\n"

    if three_keys:
        llms_full_content += "### Tres Claves Fundamentales\n"
        for k in three_keys:
            if isinstance(k, str):
                llms_full_content += f"- {k}\n"
            elif isinstance(k, dict):
                title = k.get('title', '')
                desc = k.get('description', '')
                if title and desc:
                    llms_full_content += f"- **{title}:** {desc}\n"
                else:
                    llms_full_content += f"- {title or desc}\n"
        llms_full_content += "\n"

    if before_after and (before_after.get("before") or before_after.get("after")):
        llms_full_content += "### Comparativa: Antes vs. Después\n"
        llms_full_content += f"- **Antes de la norma:** {before_after.get('before', '')}\n"
        llms_full_content += f"- **Tras su aprobación:** {before_after.get('after', '')}\n\n"

    # Measures
    c.execute("SELECT * FROM measures WHERE initiative_id = ? ORDER BY order_num ASC", (init["id"],))
    measures = c.fetchall()
    if measures:
        llms_full_content += "### Desglose de Medidas e Impacto Humano\n\n"
        for m in measures:
            affected = json.loads(m["who_is_affected_json"] or "[]")
            pro = json.loads(m["arguments_pro_json"] or "[]")
            contra = json.loads(m["arguments_contra_json"] or "[]")

            llms_full_content += f"#### Medida: {m['title']}\n"
            llms_full_content += f"{m['plain_description']}\n\n"

            if affected:
                llms_full_content += f"- **A quién afecta principalmente:** {', '.join(affected)}\n"
            if m["real_world_example"]:
                llms_full_content += f"- **Ejemplo de la vida cotidiana:** {m['real_world_example']}\n"
            if pro:
                llms_full_content += "- **Argumentos en defensa:**\n"
                for p in pro:
                    llms_full_content += f"  * {p}\n"
            if contra:
                llms_full_content += "- **Argumentos en contra u objeciones:**\n"
                for co in contra:
                    llms_full_content += f"  * {co}\n"
            llms_full_content += "\n"

    if votes:
        v_si = votes.get("si", votes.get("yes", 0))
        v_no = votes.get("no", 0)
        v_abs = votes.get("abstencion", votes.get("abstain", 0))
        v_novota = votes.get("noVota", votes.get("absent", 0))
        llms_full_content += f"### Cómputo Oficial de la Votación\n"
        llms_full_content += f"- A Favor (Sí): **{v_si}**\n"
        llms_full_content += f"- En Contra (No): **{v_no}**\n"
        llms_full_content += f"- Abstenciones: **{v_abs}**\n"
        if v_novota:
            llms_full_content += f"- Ausentes / No emiten voto: **{v_novota}**\n"
        llms_full_content += "\n"

    if group_votes:
        llms_full_content += "### Posición por Grupos Parlamentarios\n\n"
        llms_full_content += "| Grupo Parlamentario | Escaños | Sentido de Voto |\n"
        llms_full_content += "|---|:---:|:---:|\n"
        for g in group_votes:
            name = g.get('groupName') or g.get('party', '')
            seats = g.get('totalSeats') or g.get('seats', '')
            if 'vote' in g:
                sense = g['vote'].upper()
            else:
                s_si = g.get('si', 0)
                s_no = g.get('no', 0)
                s_abs = g.get('abstencion', 0)
                if s_si > s_no and s_si > s_abs:
                    sense = f"SÍ ({s_si})"
                elif s_no > s_si and s_no > s_abs:
                    sense = f"NO ({s_no})"
                elif s_abs > s_si and s_abs > s_no:
                    sense = f"ABSTENCIÓN ({s_abs})"
                else:
                    sense = f"SÍ: {s_si} / NO: {s_no}"
            llms_full_content += f"| {name} | {seats} | {sense} |\n"
        llms_full_content += "\n"

    llms_full_content += "---\n\n"

with open(llms_full_path, "w", encoding="utf-8") as f:
    f.write(llms_full_content)

print(f"Generated {llms_full_path} ({len(llms_full_content)} chars)")
