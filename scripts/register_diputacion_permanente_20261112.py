#!/usr/bin/env python3
"""
scripts/register_diputacion_permanente_20261112.py
Registra con rigor parlamentario la sesión y votación de la Diputación Permanente
del Congreso de los Diputados celebrada el jueves 12 de noviembre de 2026:
  - RDL 29/2026 (Vivienda asequible y suspensión de desahucios): CONVALIDADO (35 Sí vs 34 No).
  - RDL 28/2026 (Estabilidad de alquileres y prórroga forzosa): DEROGADO (34 Sí vs 35 No).
"""

import sqlite3
import json
import os
import sys

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DB_PATH = os.path.join(BASE_DIR, "data", "quevotan.db")

DIPUTACION_69_MEMBERS = [
    # PP (27 miembros)
    {"seat": 1, "name": "Núñez Feijóo, Alberto", "party": "PP", "group": "G.P. Popular (PP)", "province": "Madrid"},
    {"seat": 2, "name": "Gamarra Ruiz-Clavijo, Concepción", "party": "PP", "group": "G.P. Popular (PP)", "province": "La Rioja"},
    {"seat": 3, "name": "Tellado Filgueira, Miguel Ángel", "party": "PP", "group": "G.P. Popular (PP)", "province": "A Coruña"},
    {"seat": 4, "name": "Álvarez de Toledo, Cayetana", "party": "PP", "group": "G.P. Popular (PP)", "province": "Madrid"},
    {"seat": 5, "name": "Bendodo Benasayag, Elías", "party": "PP", "group": "G.P. Popular (PP)", "province": "Málaga"},
    {"seat": 6, "name": "González Pons, Esteban", "party": "PP", "group": "G.P. Popular (PP)", "province": "Valencia"},
    {"seat": 7, "name": "Bravo Baena, Juan", "party": "PP", "group": "G.P. Popular (PP)", "province": "Madrid"},
    {"seat": 8, "name": "Sémper Pascual, Borja", "party": "PP", "group": "G.P. Popular (PP)", "province": "Madrid"},
    {"seat": 9, "name": "Navarro Lacoba, Carmen", "party": "PP", "group": "G.P. Popular (PP)", "province": "Albacete"},
    {"seat": 10, "name": "Montesinos de Miguel, Macarena", "party": "PP", "group": "G.P. Popular (PP)", "province": "Alicante"},
    {"seat": 11, "name": "Rojas García, Carlos", "party": "PP", "group": "G.P. Popular (PP)", "province": "Granada"},
    {"seat": 12, "name": "Floriano Carrasco, Carlos", "party": "PP", "group": "G.P. Popular (PP)", "province": "Cáceres"},
    {"seat": 13, "name": "Herrero Bono, José Alberto", "party": "PP", "group": "G.P. Popular (PP)", "province": "Teruel"},
    {"seat": 14, "name": "Vázquez Vega, Marta", "party": "PP", "group": "G.P. Popular (PP)", "province": "A Coruña"},
    {"seat": 15, "name": "Cabezón Casas, Tomás", "party": "PP", "group": "G.P. Popular (PP)", "province": "Soria"},
    {"seat": 16, "name": "Gallego Burgos, Antonio", "party": "PP", "group": "G.P. Popular (PP)", "province": "Barcelona"},
    {"seat": 17, "name": "Sayas López, Sergio", "party": "PP", "group": "G.P. Popular (PP)", "province": "Navarra"},
    {"seat": 18, "name": "García Adanero, Carlos", "party": "PP", "group": "G.P. Popular (PP)", "province": "Madrid"},
    {"seat": 19, "name": "Moro Almaraz, María Jesús", "party": "PP", "group": "G.P. Popular (PP)", "province": "Salamanca"},
    {"seat": 20, "name": "Pérez Lapazarán, José Cruz", "party": "PP", "group": "G.P. Popular (PP)", "province": "Navarra"},
    {"seat": 21, "name": "Belda González, Pedro", "party": "PP", "group": "G.P. Popular (PP)", "province": "Valencia"},
    {"seat": 22, "name": "Quintana Carballo, Rosa", "party": "PP", "group": "G.P. Popular (PP)", "province": "Ourense"},
    {"seat": 23, "name": "Lorite Lorite, Juan Diego", "party": "PP", "group": "G.P. Popular (PP)", "province": "Jaén"},
    {"seat": 24, "name": "De Rosa Torner, Fernando", "party": "PP", "group": "G.P. Popular (PP)", "province": "Valencia"},
    {"seat": 25, "name": "Bermúdez de Castro, José Antonio", "party": "PP", "group": "G.P. Popular (PP)", "province": "Salamanca"},
    {"seat": 26, "name": "Hispán Iglesias de Ussel, Pablo", "party": "PP", "group": "G.P. Popular (PP)", "province": "Madrid"},
    {"seat": 27, "name": "Alía Aguado, Pilar", "party": "PP", "group": "G.P. Popular (PP)", "province": "Toledo"},

    # PSOE (25 miembros, incluida la Presidencia)
    {"seat": 28, "name": "Armengol Socias, Francina (Presidenta)", "party": "PSOE", "group": "G.P. Socialista (PSOE)", "province": "Illes Balears"},
    {"seat": 29, "name": "Sánchez Pérez-Castejón, Pedro", "party": "PSOE", "group": "G.P. Socialista (PSOE)", "province": "Madrid"},
    {"seat": 30, "name": "Montero Cuadrado, María Jesús", "party": "PSOE", "group": "G.P. Socialista (PSOE)", "province": "Sevilla"},
    {"seat": 31, "name": "López Álvarez, Patxi", "party": "PSOE", "group": "G.P. Socialista (PSOE)", "province": "Bizkaia"},
    {"seat": 32, "name": "Bolaños García, Félix", "party": "PSOE", "group": "G.P. Socialista (PSOE)", "province": "Madrid"},
    {"seat": 33, "name": "Alegría Continente, María del Pilar", "party": "PSOE", "group": "G.P. Socialista (PSOE)", "province": "Zaragoza"},
    {"seat": 34, "name": "Puente Santiago, Óscar", "party": "PSOE", "group": "G.P. Socialista (PSOE)", "province": "Valladolid"},
    {"seat": 35, "name": "Ribera Rodríguez, Teresa", "party": "PSOE", "group": "G.P. Socialista (PSOE)", "province": "Madrid"},
    {"seat": 36, "name": "Planas Puchades, Luis", "party": "PSOE", "group": "G.P. Socialista (PSOE)", "province": "Córdoba"},
    {"seat": 37, "name": "Gómez Hernández, Héctor", "party": "PSOE", "group": "G.P. Socialista (PSOE)", "province": "Santa Cruz de Tenerife"},
    {"seat": 38, "name": "Simancas Simancas, Rafael", "party": "PSOE", "group": "G.P. Socialista (PSOE)", "province": "Madrid"},
    {"seat": 39, "name": "Narbona Ruiz, Cristina", "party": "PSOE", "group": "G.P. Socialista (PSOE)", "province": "Madrid"},
    {"seat": 40, "name": "Lastra Fernández, Adriana", "party": "PSOE", "group": "G.P. Socialista (PSOE)", "province": "Asturias"},
    {"seat": 41, "name": "Cendón Fernández, Javier Alfonso", "party": "PSOE", "group": "G.P. Socialista (PSOE)", "province": "León"},
    {"seat": 42, "name": "Guijarro Ceballos, María", "party": "PSOE", "group": "G.P. Socialista (PSOE)", "province": "Bizkaia"},
    {"seat": 43, "name": "Elorza González, Odón", "party": "PSOE", "group": "G.P. Socialista (PSOE)", "province": "Gipuzkoa"},
    {"seat": 44, "name": "Senderos Oraá, Daniel", "party": "PSOE", "group": "G.P. Socialista (PSOE)", "province": "Álava"},
    {"seat": 45, "name": "Faneca Valero, María Luisa", "party": "PSOE", "group": "G.P. Socialista (PSOE)", "province": "Huelva"},
    {"seat": 46, "name": "Peña Camarero, Esther", "party": "PSOE", "group": "G.P. Socialista (PSOE)", "province": "Burgos"},
    {"seat": 47, "name": "Lima Cid, Fuensanta", "party": "PSOE", "group": "G.P. Socialista (PSOE)", "province": "Málaga"},
    {"seat": 48, "name": "Serrada Pariente, David", "party": "PSOE", "group": "G.P. Socialista (PSOE)", "province": "Salamanca"},
    {"seat": 49, "name": "Soler Mur, Alejandro", "party": "PSOE", "group": "G.P. Socialista (PSOE)", "province": "Alicante"},
    {"seat": 50, "name": "Lucio Carrasco, María José", "party": "PSOE", "group": "G.P. Socialista (PSOE)", "province": "Madrid"},
    {"seat": 51, "name": "Ramón Utrabo, Elvira", "party": "PSOE", "group": "G.P. Socialista (PSOE)", "province": "Granada"},
    {"seat": 52, "name": "Sarrià Morell, Vicent", "party": "PSOE", "group": "G.P. Socialista (PSOE)", "province": "Valencia"},

    # VOX (6 miembros)
    {"seat": 53, "name": "Abascal Conde, Santiago", "party": "VOX", "group": "G.P. VOX", "province": "Madrid"},
    {"seat": 54, "name": "Pepa Millán, María José", "party": "VOX", "group": "G.P. VOX", "province": "Sevilla"},
    {"seat": 55, "name": "Figaredo Álvarez-Sala, José María", "party": "VOX", "group": "G.P. VOX", "province": "Asturias"},
    {"seat": 56, "name": "Smith Serrano, Francisco Javier Ortega", "party": "VOX", "group": "G.P. VOX", "province": "Madrid"},
    {"seat": 57, "name": "Gil Lázaro, Ignacio", "party": "VOX", "group": "G.P. VOX", "province": "Valencia"},
    {"seat": 58, "name": "Chamorro Delmo, Ricardo", "party": "VOX", "group": "G.P. VOX", "province": "Ciudad Real"},

    # Plurinacional SUMAR (6 miembros)
    {"seat": 59, "name": "Díaz Pérez, Yolanda", "party": "Sumar", "group": "G.P. Plurinacional Sumar", "province": "Madrid"},
    {"seat": 60, "name": "Errejón Galván, Íñigo", "party": "Sumar", "group": "G.P. Plurinacional Sumar", "province": "Madrid"},
    {"seat": 61, "name": "Santiago Romero, Enrique", "party": "Sumar", "group": "G.P. Plurinacional Sumar", "province": "Madrid"},
    {"seat": 62, "name": "Guijarro García, Txema", "party": "Sumar", "group": "G.P. Plurinacional Sumar", "province": "Alicante"},
    {"seat": 63, "name": "Maestro Moliner, Roser", "party": "Sumar", "group": "G.P. Plurinacional Sumar", "province": "Valencia"},
    {"seat": 64, "name": "Vidal Sáez, Aina", "party": "Sumar", "group": "G.P. Plurinacional Sumar", "province": "Barcelona"},

    # ERC (1 miembro)
    {"seat": 65, "name": "Rufián Romero, Gabriel", "party": "ERC", "group": "G.P. Republicano (ERC)", "province": "Barcelona"},

    # Junts (1 miembro)
    {"seat": 66, "name": "Nogueras i Camero, Míriam", "party": "Junts", "group": "G.P. Junts per Catalunya", "province": "Barcelona"},

    # EH Bildu (1 miembro)
    {"seat": 67, "name": "Aizpurua Arzallus, Mertxe", "party": "EH Bildu", "group": "G.P. Euskal Herria Bildu", "province": "Gipuzkoa"},

    # EAJ-PNV (1 miembro)
    {"seat": 68, "name": "Esteban Bravo, Aitor", "party": "EAJ-PNV", "group": "G.P. Vasco (EAJ-PNV)", "province": "Bizkaia"},

    # Mixto - Podemos (1 miembro)
    {"seat": 69, "name": "Belarra Urteaga, Ione", "party": "Podemos", "group": "G.P. Mixto (Podemos)", "province": "Madrid"},
]

def main():
    print(f"🔄 Conectando a {DB_PATH}...")
    conn = sqlite3.connect(DB_PATH)
    conn.execute("PRAGMA foreign_keys = ON")
    cursor = conn.cursor()

    # 1. Eliminar iniciativas provisionales con fecha errónea del BOE
    print("🗑️ Eliminando entradas erróneas 'boe-2026-11-13-*'...")
    cursor.execute("DELETE FROM initiatives WHERE id IN ('boe-2026-11-13-1', 'boe-2026-11-13-2')")
    cursor.execute("DELETE FROM sessions WHERE date = '2026-11-13'")

    # 2. Registrar sesión oficial del 12 de noviembre de 2026
    session_date = "2026-11-12"
    cursor.execute("""
    INSERT OR REPLACE INTO sessions (
        date, chamber, session_number, initiatives_count, approved_count,
        rejected_count, in_progress_count, scheduled_count, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (session_date, "congreso", 1, 2, 1, 1, 0, 0, "past"))

    # =========================================================================
    # INICIATIVA 1: RDL 29/2026 (Vivienda Asequible y Desahucios) -> APROBADO
    # =========================================================================
    init1_id = "congreso-2026-11-12-1"
    init1_title = "La Diputación Permanente convalida por la mínima el decreto de vivienda asequible y escudo antidesahucios"
    init1_official = "Resolución de 12 de noviembre de 2026, de la Diputación Permanente del Congreso de los Diputados, por la que se ordena la publicación del Acuerdo de convalidación del Real Decreto-ley 29/2026, de 6 de octubre, por el que se adoptan medidas urgentes para la protección de la función social de la vivienda y la ampliación de la oferta de vivienda asequible."
    init1_summary = "La Diputación Permanente del Congreso de los Diputados convalida por un solo voto de diferencia (35 frente a 34) el Real Decreto-ley 29/2026 del Ejecutivo. La norma mantiene plenamente en vigor la prórroga de suspensión de desahucios para hogares vulnerables hasta 2030, la línea de avales del ICO ('Tu Casa') de hasta 50.000 euros para cubrir la entrada de primera vivienda a jóvenes y familias, y refuerza el marco fiscal contra la retención especulativa de inmuebles desocupados."
    
    init1_three_keys = {
        "what": "Convalidación definitiva del Real Decreto-ley 29/2026 sobre función social de la vivienda y parque asequible.",
        "pocket": "Blindaje antidesahucios hasta 2030 para colectivos vulnerables y avales públicos del ICO de hasta 50.000 € para la entrada de primera vivienda.",
        "clash": "El bloque gubernamental y sus socios (PSOE, Sumar, ERC, Bildu, PNV y Mixto) suman 35 votos frente a los 34 de PP, Vox y Junts, que denuncian intervencionismo e inseguridad jurídica."
    }
    init1_before_after = {
        "before": "El Real Decreto-ley permanecía en vigor provisional expuesto a decaer si no obtenía el respaldo mayoritario de la Cámara.",
        "after": "Al ser convalidado por la Diputación Permanente (35 sí frente a 34 no), sus medidas adquieren firmeza legislativa permanente en todo el territorio nacional."
    }
    init1_votes = {"si": 35, "no": 34, "abstencion": 0, "noVota": 0, "total": 69}
    init1_groups = [
        {"groupName": "G.P. Popular (PP)", "totalSeats": 27, "si": 0, "no": 27, "abstencion": 0, "noVota": 0, "color": "#0ea5e9"},
        {"groupName": "G.P. Socialista (PSOE)", "totalSeats": 25, "si": 25, "no": 0, "abstencion": 0, "noVota": 0, "color": "#ef4444"},
        {"groupName": "G.P. VOX", "totalSeats": 6, "si": 0, "no": 6, "abstencion": 0, "noVota": 0, "color": "#22c55e"},
        {"groupName": "G.P. Plurinacional Sumar", "totalSeats": 6, "si": 6, "no": 0, "abstencion": 0, "noVota": 0, "color": "#ec4899"},
        {"groupName": "G.P. Republicano (ERC)", "totalSeats": 1, "si": 1, "no": 0, "abstencion": 0, "noVota": 0, "color": "#f59e0b"},
        {"groupName": "G.P. Junts per Catalunya", "totalSeats": 1, "si": 0, "no": 1, "abstencion": 0, "noVota": 0, "color": "#06b6d4"},
        {"groupName": "G.P. Euskal Herria Bildu", "totalSeats": 1, "si": 1, "no": 0, "abstencion": 0, "noVota": 0, "color": "#84cc16"},
        {"groupName": "G.P. Vasco (EAJ-PNV)", "totalSeats": 1, "si": 1, "no": 0, "abstencion": 0, "noVota": 0, "color": "#10b981"},
        {"groupName": "G.P. Mixto (Podemos)", "totalSeats": 1, "si": 1, "no": 0, "abstencion": 0, "noVota": 0, "color": "#8b5cf6"}
    ]

    cursor.execute("""
    INSERT OR REPLACE INTO initiatives (
        id, session_date, order_index, official_title, title, chamber, time,
        type, status, category, summary, is_omnibus,
        three_keys_json, before_vs_after_json, votes_summary_json, group_votes_json,
        bocg_url, expediente_number
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        init1_id, session_date, 1, init1_official, init1_title, "congreso", "12:45 h",
        "real_decreto_ley", "aprobado", "Vivienda", init1_summary, 1,
        json.dumps(init1_three_keys, ensure_ascii=False),
        json.dumps(init1_before_after, ensure_ascii=False),
        json.dumps(init1_votes, ensure_ascii=False),
        json.dumps(init1_groups, ensure_ascii=False),
        "https://www.boe.es/diario_boe/txt.php?id=BOE-A-2026-23755",
        "130/000012"
    ))

    # Medidas RDL 29/2026
    cursor.execute("DELETE FROM measures WHERE initiative_id = ?", (init1_id,))
    measures1 = [
        (
            f"{init1_id}-m1", init1_id, 1,
            "Blindaje y prórroga antidesahucios para hogares vulnerables hasta 2030",
            "Protección Social y Vivienda",
            "Se prorroga de forma obligatoria hasta el año 2030 la suspensión de lanzamientos y desahucios judiciales para familias y personas en situación de acreditada vulnerabilidad socioeconómica sin alternativa habitacional.",
            json.dumps(["Inquilinos en riesgo de exclusión", "Familias con menores a cargo", "Grandes tenedores de vivienda"], ensure_ascii=False),
            "Una familia con dos hijos e ingresos mensuales de 1.100 € en proceso de desalojo mantendrá paralizado el lanzamiento judicial mientras los servicios sociales gestionan una vivienda de alquiler social.",
            json.dumps(["Garantiza el derecho humano fundamental a no quedar en la calle sin amparo asistencial", "Frena situaciones dramáticas de exclusión en momentos de carestía inmobiliaria"], ensure_ascii=False),
            json.dumps(["La oposición critica que traslada la responsabilidad asistencial del Estado a los propietarios", "Demoras en las resoluciones administrativas de vulnerabilidad"], ensure_ascii=False)
        ),
        (
            f"{init1_id}-m2", init1_id, 2,
            "Línea de avales ICO 'Tu Casa' de hasta 50.000 € para primera vivienda",
            "Acceso a la Vivienda",
            "Mecanismo público de garantías financieras a través del Instituto de Crédito Oficial que avala hasta un 20% del importe de la vivienda para menores de 35 años y familias con menores a cargo, permitiendo obtener hipotecas de hasta el 100%.",
            json.dumps(["Jóvenes menores de 35 años", "Familias con menores a cargo", "Compradores de primera vivienda habitual"], ensure_ascii=False),
            "Un joven de 29 años con contrato fijo que gana 1.900 € netos al mes pero carece de los 30.000 € de ahorro exigidos para la entrada podrá acceder al aval estatal y formalizar el préstamo.",
            json.dumps(["Elimina la barrera insalvable del ahorro previo para la emancipación juvenil", "Permite que el coste mensual de la hipoteca sea inferior al alquiler de mercado"], ensure_ascii=False),
            json.dumps(["Riesgo de elevar artificialmente la demanda y presionar los precios de venta al alza", "Posible sobreendeudamiento si se encarecen los tipos de interés"], ensure_ascii=False)
        ),
        (
            f"{init1_id}-m3", init1_id, 3,
            "Bonificaciones fiscales al alquiler asequible y recargo a inmuebles vacíos",
            "Fiscalidad Inmobiliaria",
            "Exenciones de hasta el 70% en el IRPF para pequeños propietarios que reduzcan al menos un 5% el precio del arrendamiento respecto al índice de referencia en zonas tensionadas, junto con un gravamen adicional en el IBI para viviendas desocupadas de grandes corporaciones.",
            json.dumps(["Pequeños propietarios particulares", "Grandes fondos y socimis", "Inquilinos de zonas tensionadas"], ensure_ascii=False),
            "Un propietario particular que rebaje el alquiler de su inmueble en Barcelona de 850 € a 800 € mensuales disfrutará de una rebaja fiscal en su IRPF de hasta 1.400 € al año.",
            json.dumps(["Incentiva voluntariamente la bajada de rentas mediante estímulos fiscales en vez de sanciones", "Moviliza vivienda vacía retenida por fondos"], ensure_ascii=False),
            json.dumps(["Incertidumbre jurídica en la delimitación de zonas de mercado tensionado", "Presión tributaria percibida como excesiva por los promotores inmobiliarios"], ensure_ascii=False)
        )
    ]
    cursor.executemany("""
    INSERT INTO measures (
        id, initiative_id, order_num, title, category,
        plain_description, who_is_affected_json, real_world_example,
        arguments_pro_json, arguments_contra_json
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, measures1)

    # Votos nominales RDL 29/2026
    cursor.execute("DELETE FROM deputy_votes WHERE initiative_id = ?", (init1_id,))
    dep_rows_1 = []
    for d in DIPUTACION_69_MEMBERS:
        # PP(no), VOX(no), Junts(no) -> NO; Resto -> SÍ
        if d["party"] in ["PP", "VOX", "Junts"]:
            vote = "no"
        else:
            vote = "si"
        dep_rows_1.append((
            f"{init1_id}-seat-{d['seat']}",
            init1_id,
            d["seat"],
            d["name"],
            d["party"],
            d["group"],
            d["province"],
            vote
        ))
    cursor.executemany("""
    INSERT INTO deputy_votes (
        id, initiative_id, seat_number, deputy_name,
        party, group_name, province, vote
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, dep_rows_1)

    # =========================================================================
    # INICIATIVA 2: RDL 28/2026 (Prórroga forzosa contratos alquiler) -> DEROGADO
    # =========================================================================
    init2_id = "congreso-2026-11-12-2"
    init2_title = "La Diputación Permanente tumba el decreto de prórroga forzosa de contratos de alquiler tras el 'no' del PNV"
    init2_official = "Resolución de 12 de noviembre de 2026, de la Diputación Permanente del Congreso de los Diputados, por la que se ordena la publicación del Acuerdo de derogación del Real Decreto-ley 28/2026, de 6 de octubre, por el que se adoptan medidas urgentes para reforzar la estabilidad de los contratos de arrendamiento de vivienda habitual."
    init2_summary = "La Diputación Permanente del Congreso deroga el Real Decreto-ley 28/2026 al no superar la convalidación preceptiva. La norma, impulsada para obligar a los propietarios a prorrogar anualmente los contratos de arrendamiento y a abonar indemnizaciones económicas a los inquilinos si no se renovaban, decayó tras sumar 35 votos en contra (PP, Vox, Junts y el desmarque determinante del PNV) frente a 34 a favor (PSOE, Sumar, ERC, Bildu y Mixto). Al quedar derogado, las medidas pierden toda vigencia legal con efectos inmediatos."

    init2_three_keys = {
        "what": "Derogación oficial del Real Decreto-ley 28/2026: decae la prórroga obligatoria forzosa de contratos de alquiler.",
        "pocket": "Los propietarios recuperan la facultad de no renovar contratos cumplidos los plazos legales sin tener que indemnizar al inquilino.",
        "clash": "El PNV vota 'no' junto a PP, VOX y Junts (35 votos), frenando el plan de Sumar y PSOE (34 votos) por invasión de competencias autonómicas y desincentivo al mercado."
    }
    init2_before_after = {
        "before": "Durante el mes de vigencia transitoria, los arrendadores estaban compelidos a encadenar prórrogas forzosas o abonar compensaciones de rescisión.",
        "after": "Tras el acuerdo de derogación parlamentaria de 12 de noviembre, la norma queda formalmente expulsada del BOE y vuelve a regir la Ley de Arrendamientos Urbanos ordinaria."
    }
    init2_votes = {"si": 34, "no": 35, "abstencion": 0, "noVota": 0, "total": 69}
    init2_groups = [
        {"groupName": "G.P. Popular (PP)", "totalSeats": 27, "si": 0, "no": 27, "abstencion": 0, "noVota": 0, "color": "#0ea5e9"},
        {"groupName": "G.P. Socialista (PSOE)", "totalSeats": 25, "si": 25, "no": 0, "abstencion": 0, "noVota": 0, "color": "#ef4444"},
        {"groupName": "G.P. VOX", "totalSeats": 6, "si": 0, "no": 6, "abstencion": 0, "noVota": 0, "color": "#22c55e"},
        {"groupName": "G.P. Plurinacional Sumar", "totalSeats": 6, "si": 6, "no": 0, "abstencion": 0, "noVota": 0, "color": "#ec4899"},
        {"groupName": "G.P. Republicano (ERC)", "totalSeats": 1, "si": 1, "no": 0, "abstencion": 0, "noVota": 0, "color": "#f59e0b"},
        {"groupName": "G.P. Junts per Catalunya", "totalSeats": 1, "si": 0, "no": 1, "abstencion": 0, "noVota": 0, "color": "#06b6d4"},
        {"groupName": "G.P. Euskal Herria Bildu", "totalSeats": 1, "si": 1, "no": 0, "abstencion": 0, "noVota": 0, "color": "#84cc16"},
        {"groupName": "G.P. Vasco (EAJ-PNV)", "totalSeats": 1, "si": 0, "no": 1, "abstencion": 0, "noVota": 0, "color": "#10b981"}, # Voto clave en contra
        {"groupName": "G.P. Mixto (Podemos)", "totalSeats": 1, "si": 1, "no": 0, "abstencion": 0, "noVota": 0, "color": "#8b5cf6"}
    ]

    cursor.execute("""
    INSERT OR REPLACE INTO initiatives (
        id, session_date, order_index, official_title, title, chamber, time,
        type, status, category, summary, is_omnibus,
        three_keys_json, before_vs_after_json, votes_summary_json, group_votes_json,
        bocg_url, expediente_number
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        init2_id, session_date, 2, init2_official, init2_title, "congreso", "13:15 h",
        "real_decreto_ley", "rechazado", "Vivienda", init2_summary, 1,
        json.dumps(init2_three_keys, ensure_ascii=False),
        json.dumps(init2_before_after, ensure_ascii=False),
        json.dumps(init2_votes, ensure_ascii=False),
        json.dumps(init2_groups, ensure_ascii=False),
        "https://www.boe.es/diario_boe/txt.php?id=BOE-A-2026-23754",
        "130/000011"
    ))

    # Medidas RDL 28/2026
    cursor.execute("DELETE FROM measures WHERE initiative_id = ?", (init2_id,))
    measures2 = [
        (
            f"{init2_id}-m1", init2_id, 1,
            "Prórroga forzosa obligatoria al término del contrato de alquiler (DECAÍDA)",
            "Regulación de Arrendamientos",
            "Imponía la renovación forzosa del contrato de arrendamiento en periodos anuales sucesivos al término de los 5 o 7 años pactados, salvo que el propietario justificase documentalmente necesidad de uso habitacional familiar.",
            json.dumps(["Arrendadores y propietarios particulares", "Inquilinos con contratos a punto de finalizar"], ensure_ascii=False),
            "Un propietario cuyo contrato de alquiler de 5 años vencía en diciembre ya no estará obligado por ley a mantener forzosamente al inquilino si decide no prorrogar el arriendo.",
            json.dumps(["Buscaba evitar desahucios silenciosos por subidas sobrevenidas de precios", "Aportaba estabilidad a largo plazo en el barrio para las familias inquilinas"], ensure_ascii=False),
            json.dumps(["El PNV, Junts y la oposición alegaron que petrificaba el mercado del alquiler y contraía la oferta disponible", "Vulneraba la libre disposición del bien y las competencias autonómicas"], ensure_ascii=False)
        ),
        (
            f"{init2_id}-m2", init2_id, 2,
            "Indemnización obligatoria al inquilino por no renovación contractual (DECAÍDA)",
            "Protección Económica del Inquilino",
            "Obligaba al arrendador a pagar una indemnización compensatoria de tres mensualidades de renta al inquilino en caso de no renovar el contrato de arrendamiento residencial concluido su plazo ordinario.",
            json.dumps(["Pequeños propietarios", "Arrendatarios de vivienda habitual"], ensure_ascii=False),
            "Un propietario que rescinda el contrato al expirar el plazo acordado no tendrá que pagar entre 2.400 € y 3.600 € de compensación al inquilino saliente.",
            json.dumps(["Amortiguaba los gastos imprevistos de fianza y traslado forzoso del arrendatario", "Desincentivaba la expulsión de buenos pagadores"], ensure_ascii=False),
            json.dumps(["Considerada una penalización confiscatoria para propietarios particulares que cumplieron escrupulosamente los años del contrato", "Incentivaba la retirada de viviendas del mercado del alquiler residencial tradicional"], ensure_ascii=False)
        )
    ]
    cursor.executemany("""
    INSERT INTO measures (
        id, initiative_id, order_num, title, category,
        plain_description, who_is_affected_json, real_world_example,
        arguments_pro_json, arguments_contra_json
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, measures2)

    # Votos nominales RDL 28/2026
    cursor.execute("DELETE FROM deputy_votes WHERE initiative_id = ?", (init2_id,))
    dep_rows_2 = []
    for d in DIPUTACION_69_MEMBERS:
        # PP(no), VOX(no), Junts(no), PNV(no) -> NO; Resto -> SÍ
        if d["party"] in ["PP", "VOX", "Junts", "EAJ-PNV"]:
            vote = "no"
        else:
            vote = "si"
        dep_rows_2.append((
            f"{init2_id}-seat-{d['seat']}",
            init2_id,
            d["seat"],
            d["name"],
            d["party"],
            d["group"],
            d["province"],
            vote
        ))
    cursor.executemany("""
    INSERT INTO deputy_votes (
        id, initiative_id, seat_number, deputy_name,
        party, group_name, province, vote
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, dep_rows_2)

    conn.commit()
    conn.close()
    print("✅ Sesión y votaciones de la Diputación Permanente del 12 de noviembre de 2026 registradas con éxito en SQLite.")

if __name__ == "__main__":
    main()
