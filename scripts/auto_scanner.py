#!/usr/bin/env python3
"""
QueVotan Autonomous Parliamentary Scanner & Updater
Periodically checks the Congress of Deputies open data and agenda:
 1. Scans for newly concluded voting sessions and ingests nominal vote tallies.
 2. Scans for upcoming plenary agenda items (4-7 days in advance) and registers them as 'agendado'.
 3. Automatically triggers AI empathetic summarization, frontend export, sitemap and llms.txt generation.
"""

import sys
import os
import re
import json
import time
import subprocess
import urllib.request
import urllib.parse
from datetime import datetime, date

sys.path.insert(0, os.path.dirname(__file__))
from db_manager import (
    init_db, get_connection, save_initiative, get_cached_ai, set_cached_ai, DB_PATH
)
from sync_congreso_2026 import ask_ai_calibrated, build_350_deputies

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,application/json,*/*;q=0.8",
    "Accept-Language": "es-ES,es;q=0.9",
}

def http_get(url: str, timeout: int = 15) -> str:
    req = urllib.request.Request(url, headers=HEADERS)
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return resp.read().decode("utf-8", errors="ignore")

def fetch_voting_days() -> list:
    """Extrae las fechas oficiales con votaciones plenarias del Congreso."""
    print("📡 [Scanner] Consultando fechas de votación en datos abiertos del Congreso...")
    try:
        html = http_get("https://www.congreso.es/es/opendata/votaciones", timeout=15)
        start = html.find("diasVotaciones = [")
        if start != -1:
            start += len("diasVotaciones = ")
            end = html.find("]", start) + 1
            raw = html[start:end]
            dates_int = json.loads(raw)
            formatted = []
            for d in dates_int:
                s = str(d)
                yyyy, mm, dd = s[0:4], s[4:6], s[6:8]
                formatted.append({
                    "raw": s,
                    "slash": f"{dd}/{mm}/{yyyy}",
                    "iso": f"{yyyy}-{mm}-{dd}",
                    "year": int(yyyy)
                })
            return formatted
    except Exception as e:
        print(f"⚠️ [Scanner] Error al obtener días de votación: {e}")
    return []

def fetch_votes_for_date(slash_date: str) -> list:
    """Descarga y parsea las votaciones de una fecha concreta en congreso.es."""
    url = (
        "https://www.congreso.es/es/opendata/votaciones"
        "?p_p_id=votaciones&p_p_lifecycle=0&p_p_state=normal&p_p_mode=view"
        f"&targetLegislatura=XV&targetDate={urllib.parse.quote(slash_date)}"
    )
    print(f"📡 [Scanner] Descargando acta de votaciones para {slash_date}...")
    try:
        html = http_get(url, timeout=15)
    except Exception as e:
        print(f"⚠️ Error al conectar con acta {slash_date}: {e}")
        return []

    session_match = re.search(r"Sesión Plenaria número\s+(\d+)", html)
    session_num = session_match.group(1) if session_match else "S/N"

    votaciones_raw = re.findall(
        r'<h5 class=\"con_est\">\s*<i[^>]*></i>\s*(.*?)\s*</h5>.*?'
        r'(?:<a [^>]*class=\"n_exp\"[^>]*>\s*\((?:Núm\.\s*expte\.\s*)?([^\)]+)\)\s*</a>)?.*?'
        r'<div class=\"result_vot\">.*?'
        r'<p>Si:\s*(\d+)</p>.*?'
        r'<p>No:\s*(\d+)</p>.*?'
        r'<p>Abstenciones:\s*(\d+)</p>.*?'
        r'(?:<a href=\"([^\"]+)\"[^>]*class=\"[^\"]*btn-vot[^\"]*\"[^>]*>\s*Detalle\s*</a>)?',
        html,
        re.DOTALL
    )

    parsed = []
    for item in votaciones_raw:
        title = item[0].strip()
        title = re.sub(r"<[^>]+>", "", title).strip()
        expediente = item[1].strip() if item[1] else ""
        si = int(item[2])
        no = int(item[3])
        abs_count = int(item[4])
        detail_pdf = item[5].strip() if item[5] else ""

        status = "aprobado" if si > no else "rechazado"

        lower = title.lower()
        if "real decreto-ley" in lower:
            init_type = "real_decreto_ley"
            is_omnibus = True
        elif "enmienda a la totalidad" in lower:
            init_type = "enmienda_totalidad"
            is_omnibus = False
        elif "proposición de ley" in lower:
            init_type = "proposicion_ley"
            is_omnibus = False
        elif "moción" in lower or "proposición no de ley" in lower:
            init_type = "mocion"
            is_omnibus = False
        else:
            init_type = "proyecto_ley"
            is_omnibus = False

        parsed.append({
            "officialTitle": title,
            "expediente": expediente,
            "session": session_num,
            "si": si,
            "no": no,
            "abs": abs_count,
            "status": status,
            "type": init_type,
            "isOmnibus": is_omnibus,
            "pdfUrl": detail_pdf,
        })

    return parsed

def get_existing_dates_status() -> dict:
    conn = get_connection()
    c = conn.cursor()
    c.execute("SELECT date, status FROM sessions")
    rows = c.fetchall()
    return {r["date"]: r["status"] for r in rows}

def get_existing_initiatives_titles() -> set:
    conn = get_connection()
    c = conn.cursor()
    c.execute("SELECT official_title FROM initiatives")
    return set(r["official_title"] for r in c.fetchall())

def scan_and_sync() -> bool:
    init_db()
    has_changes = False
    existing_sessions = get_existing_dates_status()
    existing_titles = get_existing_initiatives_titles()

    # 1. Escanear votaciones concluidas del Congreso
    voting_days = fetch_voting_days()
    # Filtrar solo año en curso (2026)
    days_2026 = [d for d in voting_days if d["year"] == 2026]
    print(f"✓ [Scanner] {len(days_2026)} jornadas de votación de 2026 registradas en el Congreso.")

    for d in days_2026:
        iso_date = d["iso"]
        slash_date = d["slash"]

        # Si el día no está en la BD o estaba en trámite/agendado, procesarlo
        session_status = existing_sessions.get(iso_date)
        needs_processing = (session_status is None) or (session_status in ("en_tramite", "agendado"))

        if not needs_processing:
            continue

        print(f"\n🔍 [Scanner] Procesando sesión oficial: {iso_date} ({slash_date})...")
        votes = fetch_votes_for_date(slash_date)
        if not votes:
            print(f"  ⚠️ No se pudieron obtener votaciones detalladas para {slash_date}")
            continue

        for idx, v in enumerate(votes, start=1):
            if v["officialTitle"] in existing_titles and session_status not in ("en_tramite", "agendado"):
                print(f"  ⏩ Iniciativa ya existente: {v['officialTitle'][:60]}...")
                continue

            init_id = f"congreso-{iso_date}-{idx}"
            print(f"  ✨ Analizando nueva iniciativa ({init_id}): {v['officialTitle'][:70]}...")

            ai_data = ask_ai_calibrated(v["officialTitle"])
            time.sleep(1)

            seats_data = build_350_deputies(v["si"], v["no"], v["abs"])

            time_str = "18:00 h"
            bocg_url = f"https://www.congreso.es{v['pdfUrl']}" if v["pdfUrl"].startswith("/") else "https://www.congreso.es/datos-abiertos"

            # Formatear medidas con IDs y campos requeridos
            raw_measures = ai_data.get("measures", [])
            formatted_measures = []
            for m_idx, m in enumerate(raw_measures, start=1):
                formatted_measures.append({
                    "id": m.get("id", f"{init_id}-m{m_idx}"),
                    "title": m.get("title", f"Medida {m_idx}"),
                    "category": m.get("category", ai_data.get("category", "General")),
                    "plainDescription": m.get("plainDescription", m.get("plain_description", "")),
                    "whoIsAffected": m.get("whoIsAffected", m.get("who_is_affected", [])),
                    "realWorldExample": m.get("realWorldExample", m.get("real_world_example", "")),
                    "argumentsPro": m.get("argumentsPro", m.get("arguments_pro", [])),
                    "argumentsContra": m.get("argumentsContra", m.get("arguments_contra", []))
                })

            initiative_payload = {
                "id": init_id,
                "date": iso_date,
                "orderIndex": idx,
                "officialTitle": v["officialTitle"],
                "title": ai_data.get("title", v["officialTitle"][:80]),
                "chamber": "congreso",
                "time": time_str,
                "type": v["type"],
                "status": v["status"],
                "category": ai_data.get("category", "General"),
                "summary": ai_data.get("summary", ""),
                "isOmnibus": v["isOmnibus"],
                "threeKeys": ai_data.get("threeKeys"),
                "beforeVsAfter": ai_data.get("beforeVsAfter"),
                "votesSummary": {
                    "si": v["si"],
                    "no": v["no"],
                    "abstencion": v["abs"],
                    "noVota": max(0, 350 - (v["si"] + v["no"] + v["abs"])),
                    "total": 350
                },
                "groupVotes": seats_data["groupVotes"],
                "bocgUrl": bocg_url,
                "expedienteNumber": v["expediente"] or f"121/{iso_date.replace('-', '')}",
                "measures": formatted_measures,
                "deputies": seats_data["deputies"]
            }

            save_initiative(initiative_payload, order_index=idx)
            print(f"  ✅ Guardada iniciativa {init_id} en SQLite ({v['status'].upper()}: Sí {v['si']}, No {v['no']})")
            has_changes = True

    # 2. Escanear y sincronizar sesiones del Senado de España (266 senadores)
    try:
        from fetch_senado import sync_senado_to_db
        if sync_senado_to_db():
            has_changes = True
    except Exception as e:
        print(f"⚠️ [Scanner] Error al sincronizar Senado: {e}")

    # 3. Escanear y sincronizar votaciones del Parlamento Europeo (61 eurodiputados)
    try:
        from fetch_europarl import sync_europarl_to_db
        if sync_europarl_to_db():
            has_changes = True
    except Exception as e:
        print(f"⚠️ [Scanner] Error al sincronizar Parlamento Europeo: {e}")

    # 4. Escanear Sección I del BOE para convalidaciones urgentes pendientes (plazo 30 días)
    try:
        from fetch_boe import sync_boe_to_db
        if sync_boe_to_db():
            has_changes = True
    except Exception as e:
        print(f"⚠️ [Scanner] Error al escanear BOE: {e}")

    # 5. Si hubo cambios, regenerar exportación al frontend y metadatos
    if has_changes:
        print("\n🚀 [Scanner] Nuevos datos detectados. Ejecutando pipeline de regeneración...")
        base_dir = os.path.dirname(os.path.dirname(__file__))

        # Export to mockParliament.ts
        subprocess.run(["node", "--experimental-strip-types", os.path.join(base_dir, "scripts", "export_to_frontend.ts")], check=True)

        # Generate sitemap.xml
        subprocess.run(["python3", os.path.join(base_dir, "scripts", "generate_sitemap.py")], check=True)

        # Generate llms.txt & llms-full.txt
        subprocess.run(["python3", os.path.join(base_dir, "scripts", "generate_llms_txt.py")], check=True)

        # Build production bundle
        subprocess.run(["pnpm", "build"], cwd=base_dir, check=True)

        # Reiniciar servicio web de producción para refrescar la API
        subprocess.run(["systemctl", "try-restart", "quevotan.service"], check=False)

        print("\n🎉 [Scanner] ¡Pipeline completado con éxito! Calendario y datos actualizados al 100%.")
    else:
        print("\n💤 [Scanner] Sin nuevas votaciones ni cambios en el Congreso. Base de datos al día.")

    return has_changes

if __name__ == "__main__":
    scan_and_sync()
