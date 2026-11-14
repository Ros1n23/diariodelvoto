#!/usr/bin/env python3
"""
QueVotan — Ingesta Automatizada del Boletín Oficial del Estado (BOE)
Monitorea la Sección I (Disposiciones Generales) del BOE para detectar:
 1. Reales Decretos-leyes recién promulgados (activando la ventana constitucional de 30 días para su votación).
 2. Leyes Orgánicas y Ordinarias sancionadas definitivamente.
"""

import sys
import os
import re
import urllib.request
import xml.etree.ElementTree as ET
from datetime import datetime, timedelta

sys.path.insert(0, os.path.dirname(__file__))
from db_manager import init_db, get_connection, save_initiative
from sync_congreso_2026 import ask_ai_calibrated, build_350_deputies

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "application/rss+xml,application/xml,text/xml;q=0.9,*/*;q=0.8"
}

BOE_SEC1_RSS = "https://www.boe.es/rss/boe.php?s=1"

def fetch_boe_urgencies() -> list:
    """Escanea el sumario diario del BOE buscando Reales Decretos-leyes."""
    print("📡 [BOE Scanner] Consultando Sección I (Disposiciones Generales) del BOE...")
    try:
        req = urllib.request.Request(BOE_SEC1_RSS, headers=HEADERS)
        with urllib.request.urlopen(req, timeout=12) as resp:
            content = resp.read().decode("utf-8", errors="ignore")
    except Exception as e:
        print(f"⚠️ [BOE Scanner] Error al consultar BOE: {e}")
        return []

    try:
        root = ET.fromstring(content)
    except Exception as e:
        print(f"⚠️ [BOE Scanner] Error al parsear XML del BOE: {e}")
        return []

    items = root.findall(".//item")
    found_urgencies = []

    for it in items:
        title_el = it.find("title")
        link_el = it.find("link")
        pubdate_el = it.find("pubDate")

        if title_el is None or not title_el.text:
            continue

        title = title_el.text.strip()
        link = link_el.text.strip() if link_el is not None else ""
        pub_str = pubdate_el.text.strip() if pubdate_el is not None else ""

        # Comprobar si es un Real Decreto-ley
        if "real decreto-ley" in title.lower():
            # Extraer identificador BOE-A-YYYY-XXXX
            boe_id_match = re.search(r"BOE-A-(\d{4}-\d+)", link)
            boe_id = f"BOE-A-{boe_id_match.group(1)}" if boe_id_match else ""

            # Fecha de publicación
            pub_date = datetime.now().date()
            if pub_str:
                try:
                    # e.g. "Sat, 24 Oct 2026 00:00:00 +0200"
                    pub_date = datetime.strptime(pub_str[:16], "%a, %d %b %Y").date()
                except Exception:
                    pass

            # Plazo constitucional de 30 días naturales (Art. 86.2 CE)
            deadline = pub_date + timedelta(days=30)

            found_urgencies.append({
                "officialTitle": title,
                "boeUrl": link,
                "boeId": boe_id,
                "pubDate": pub_date.isoformat(),
                "deadlineDate": deadline.isoformat(),
            })

    print(f"✓ [BOE Scanner] Detectadas {len(found_urgencies)} disposiciones de tramitación urgente en el BOE.")
    return found_urgencies

def sync_boe_to_db() -> bool:
    init_db()
    urgencies = fetch_boe_urgencies()
    if not urgencies:
        return False

    conn = get_connection()
    c = conn.cursor()
    c.execute("SELECT official_title FROM initiatives")
    existing_titles = set(r["official_title"] for r in c.fetchall())

    has_changes = False

    for idx, u in enumerate(urgencies, start=1):
        if u["officialTitle"] in existing_titles:
            print(f"  ⏩ Iniciativa ya registrada desde el BOE: {u['officialTitle'][:60]}...")
            continue

        print(f"\n✨ [BOE Scanner] Nueva ley publicada: {u['officialTitle'][:70]}...")
        print(f"   ↳ Fecha BOE: {u['pubDate']} · Plazo máx. de votación en Cortes: {u['deadlineDate']}")

        ai_data = ask_ai_calibrated(u["officialTitle"])
        init_id = f"boe-{u['pubDate']}-{idx}"

        # 350 escaños en blanco / pendientes de votar
        seats_data = build_350_deputies(0, 0, 0)

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
            "date": u["pubDate"],
            "orderIndex": idx,
            "officialTitle": u["officialTitle"],
            "title": ai_data.get("title", u["officialTitle"][:80]),
            "chamber": "congreso",
            "time": "En vigor (Pendiente de convalidación parlamentaria)",
            "type": "real_decreto_ley",
            "status": "agendado",
            "category": ai_data.get("category", "General"),
            "summary": f"Publicado en el BOE el {u['pubDate']}. Entra en vigor de forma provisional y el Congreso dispone de plazo constitucional hasta el {u['deadlineDate']} para su convalidación o derogación. " + ai_data.get("summary", ""),
            "isOmnibus": True,
            "threeKeys": ai_data.get("threeKeys"),
            "beforeVsAfter": ai_data.get("beforeVsAfter"),
            "votesSummary": {
                "si": 0,
                "no": 0,
                "abstencion": 0,
                "noVota": 350,
                "total": 350
            },
            "groupVotes": seats_data["groupVotes"],
            "bocgUrl": u["boeUrl"],
            "expedienteNumber": u["boeId"],
            "measures": formatted_measures,
            "deputies": seats_data["deputies"]
        }

        save_initiative(initiative_payload, order_index=idx)
        print(f"  ✅ Registrada convalidación pendiente en el calendario: {init_id}")
        has_changes = True

    return has_changes

if __name__ == "__main__":
    sync_boe_to_db()
