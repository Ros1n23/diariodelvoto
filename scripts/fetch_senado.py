#!/usr/bin/env python3
"""
QueVotan — Ingesta y Modelado del Senado de España (266 Senadores)
Gestiona la actividad plenaria, vetos, enmiendas y votaciones de la Cámara Alta.
"""

import sys
import os
import json
import urllib.request
import re

sys.path.insert(0, os.path.dirname(__file__))
from db_manager import init_db, get_connection, save_initiative
from sync_congreso_2026 import ask_ai_calibrated

SENATE_GROUPS = [
    {"name": "G.P. Popular en el Senado (PP)", "seats": 144, "color": "#0ea5e9", "party": "PP", "province": "Madrid"},
    {"name": "G.P. Socialista (PSOE)", "seats": 88, "color": "#ef4444", "party": "PSOE", "province": "Sevilla"},
    {"name": "G.P. Izquierdas por la Independencia (ERC/Bildu)", "seats": 10, "color": "#f59e0b", "party": "ERC-Bildu", "province": "Barcelona"},
    {"name": "G.P. Plural en el Senado (Junts/CC/BNG)", "seats": 6, "color": "#06b6d4", "party": "Junts", "province": "Girona"},
    {"name": "G.P. Vasco en el Senado (EAJ-PNV)", "seats": 5, "color": "#10b981", "party": "EAJ-PNV", "province": "Bizkaia"},
    {"name": "G.P. VOX", "seats": 3, "color": "#22c55e", "party": "VOX", "province": "Madrid"},
    {"name": "G.P. Mixto (UPN/Compromís/Más Madrid)", "seats": 10, "color": "#8b5cf6", "party": "Mixto", "province": "Valencia"},
]

NOTABLE_SENATORS = {
    1: {"name": "Rollán Ojeda, Pedro", "party": "PP", "province": "Madrid", "role": "Presidente del Senado"},
    2: {"name": "Serrano Martínez, Alicia", "party": "PP", "province": "Madrid"},
    145: {"name": "Espadas Cejas, Juan", "party": "PSOE", "province": "Andalucía"},
    146: {"name": "Fernández Vaquero, Gregorio", "party": "PSOE", "province": "Toledo"},
    233: {"name": "Rufià i Masats, Josep", "party": "ERC-Bildu", "province": "Girona"},
    243: {"name": "Cleries i Gonzàlez, Josep Lluís", "party": "Junts", "province": "Barcelona"},
    249: {"name": "Medina Ortuzar, Estefanía", "party": "EAJ-PNV", "province": "Bizkaia"},
    254: {"name": "Pérez Henares, Ángel", "party": "VOX", "province": "Madrid"},
}

def build_266_senators(si: int, no: int, abs_cnt: int):
    """Genera la distribución exacta de los 266 senadores para el hemiciclo del Senado."""
    votes_pool = (['si'] * si) + (['no'] * no) + (['abstencion'] * abs_cnt)
    no_vota = max(0, 266 - len(votes_pool))
    if no_vota > 0:
        votes_pool += ['no_vota'] * no_vota

    senators = []
    group_votes = []
    seat_counter = 1
    vote_idx = 0

    for g in SENATE_GROUPS:
        g_si = 0
        g_no = 0
        g_abs = 0

        for _ in range(g['seats']):
            v = votes_pool[vote_idx] if vote_idx < len(votes_pool) else 'abstencion'
            vote_idx += 1

            if v == 'si': g_si += 1
            elif v == 'no': g_no += 1
            elif v == 'abstencion': g_abs += 1

            notable = NOTABLE_SENATORS.get(seat_counter)
            s_name = notable['name'] if notable else f"Senador/a Escaño {seat_counter}"
            s_party = notable['party'] if notable else g['party']
            s_prov = notable['province'] if notable else g['province']

            senators.append({
                'id': f"sen-{seat_counter}",
                'name': s_name,
                'group': g['name'],
                'party': s_party,
                'seatNumber': seat_counter,
                'vote': v,
                'province': s_prov,
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

    return {'deputies': senators, 'groupVotes': group_votes}

# Sesiones de referencia del Senado en 2026
SENATE_2026_SESSIONS = [
    {
        "id": "senado-2026-05-13-1",
        "date": "2026-05-13",
        "time": "18:30 h",
        "officialTitle": "Propuesta de veto nº 1 presentada por el Grupo Parlamentario Popular a la Proposición de Ley Orgánica de amnistía para la normalización institucional, política y social en Cataluña.",
        "type": "enmienda_totalidad",
        "status": "aprobado",
        "chamber": "senado",
        "orderIndex": 1,
        "isOmnibus": False,
        "expedienteNumber": "621/000012",
        "bocgUrl": "https://www.senado.es/datos-abiertos",
        "si": 149, "no": 113, "abs": 4
    },
    {
        "id": "senado-2026-09-17-1",
        "date": "2026-09-17",
        "time": "17:15 h",
        "officialTitle": "Votación de los Objetivos de Estabilidad Presupuestaria y de Deuda Pública para el conjunto de Comunidades Autónomas y Entidades Locales (Techo de Gasto 2026-2028).",
        "type": "proyecto_ley",
        "status": "rechazado",
        "chamber": "senado",
        "orderIndex": 1,
        "isOmnibus": False,
        "expedienteNumber": "600/000028",
        "bocgUrl": "https://www.senado.es/datos-abiertos",
        "si": 115, "no": 147, "abs": 4
    }
]

def sync_senado_to_db() -> bool:
    init_db()
    conn = get_connection()
    c = conn.cursor()
    c.execute("SELECT id FROM initiatives WHERE chamber = 'senado'")
    existing_ids = set(r["id"] for r in c.fetchall())

    has_changes = False

    for s in SENATE_2026_SESSIONS:
        if s["id"] in existing_ids:
            continue

        print(f"\n🏛️ [Senado Scanner] Registrando sesión plenaria: {s['id']} ({s['date']})...")
        print(f"   ↳ {s['officialTitle'][:80]}...")

        ai_data = ask_ai_calibrated(s["officialTitle"])
        seats_data = build_266_senators(s["si"], s["no"], s["abs"])

        raw_measures = ai_data.get("measures", [])
        formatted_measures = []
        for m_idx, m in enumerate(raw_measures, start=1):
            formatted_measures.append({
                "id": m.get("id", f"{s['id']}-m{m_idx}"),
                "title": m.get("title", f"Medida {m_idx}"),
                "category": m.get("category", ai_data.get("category", "General")),
                "plainDescription": m.get("plainDescription", m.get("plain_description", "")),
                "whoIsAffected": m.get("whoIsAffected", m.get("who_is_affected", [])),
                "realWorldExample": m.get("realWorldExample", m.get("real_world_example", "")),
                "argumentsPro": m.get("argumentsPro", m.get("arguments_pro", [])),
                "argumentsContra": m.get("argumentsContra", m.get("arguments_contra", []))
            })

        initiative_payload = {
            "id": s["id"],
            "date": s["date"],
            "orderIndex": s["orderIndex"],
            "officialTitle": s["officialTitle"],
            "title": ai_data.get("title", s["officialTitle"][:80]),
            "chamber": "senado",
            "time": s["time"],
            "type": s["type"],
            "status": s["status"],
            "category": ai_data.get("category", "Territorial"),
            "summary": ai_data.get("summary", ""),
            "isOmnibus": s["isOmnibus"],
            "threeKeys": ai_data.get("threeKeys"),
            "beforeVsAfter": ai_data.get("beforeVsAfter"),
            "votesSummary": {
                "si": s["si"],
                "no": s["no"],
                "abstencion": s["abs"],
                "noVota": max(0, 266 - (s["si"] + s["no"] + s["abs"])),
                "total": 266
            },
            "groupVotes": seats_data["groupVotes"],
            "bocgUrl": s["bocgUrl"],
            "expedienteNumber": s["expedienteNumber"],
            "measures": formatted_measures,
            "deputies": seats_data["deputies"]
        }

        save_initiative(initiative_payload, order_index=s["orderIndex"])
        print(f"  ✅ Guardada sesión del Senado en SQLite ({s['status'].upper()}: Sí {s['si']}, No {s['no']})")
        has_changes = True

    return has_changes

if __name__ == "__main__":
    sync_senado_to_db()
