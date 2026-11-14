#!/usr/bin/env python3
"""
scripts/init_sponsors.py
Inicializa la tabla 'sponsors' en SQLite y siembra el mecenas activo inicial
y el registro histórico de prueba para que la interfaz editorial luzca viva.
"""

import sqlite3
import os
from datetime import datetime, timedelta

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DB_PATH = os.path.join(BASE_DIR, "data", "quevotan.db")

def init_sponsors_table():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    cursor.executescript("""
    CREATE TABLE IF NOT EXISTS sponsors (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        url TEXT NOT NULL,
        message TEXT NOT NULL,
        amount_cents INTEGER NOT NULL,
        currency TEXT DEFAULT 'EUR',
        status TEXT DEFAULT 'pending_approval',
        rejection_reason TEXT,
        paypal_order_id TEXT UNIQUE,
        paypal_capture_id TEXT UNIQUE,
        approved_at TEXT,
        starts_at TEXT,
        expires_at TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_sponsors_status ON sponsors(status);
    CREATE INDEX IF NOT EXISTS idx_sponsors_expires ON sponsors(expires_at);
    """)

    # Comprobar si ya hay mecenas
    cursor.execute("SELECT count(*) FROM sponsors;")
    count = cursor.fetchone()[0]

    if count == 0:
        now = datetime.now()
        yesterday = now - timedelta(days=1)
        two_days_ago = now - timedelta(days=2)
        three_days_ago = now - timedelta(days=3)
        tomorrow = now + timedelta(hours=20, minutes=45) # 20h 45m restantes garantizadas

        sample_sponsors = [
            (
                "spon_20261114_001",
                "La Carpintería de Madrid",
                "https://carpinteriamadrid.es",
                "Restauración artesanal de muebles y madera sostenible para hogares conscientes.",
                500,
                "EUR",
                "active",
                None,
                "MOCK_PP_001",
                "MOCK_CAP_001",
                now.strftime("%Y-%m-%d %H:%M:%S"),
                (now - timedelta(hours=3, minutes=15)).strftime("%Y-%m-%d %H:%M:%S"),
                tomorrow.strftime("%Y-%m-%d %H:%M:%S"),
                now.strftime("%Y-%m-%d %H:%M:%S")
            ),
            (
                "spon_20261113_001",
                "Librería Páginas Cívicas",
                "https://paginascivicas.es",
                "Libros de historia, ensayo y divulgación ciudadana en el barrio de Malasaña.",
                400,
                "EUR",
                "archived",
                None,
                "MOCK_PP_002",
                "MOCK_CAP_002",
                yesterday.strftime("%Y-%m-%d %H:%M:%S"),
                yesterday.strftime("%Y-%m-%d 08:00:00"),
                now.strftime("%Y-%m-%d 08:00:00"),
                yesterday.strftime("%Y-%m-%d 08:00:00")
            ),
            (
                "spon_20261112_001",
                "Fontanería Hermanos Gómez",
                "https://fontaneriagomez.es",
                "Servicio urgente y reparaciones de fontanería sin precios abusivos en Valencia.",
                300,
                "EUR",
                "archived",
                None,
                "MOCK_PP_003",
                "MOCK_CAP_003",
                two_days_ago.strftime("%Y-%m-%d %H:%M:%S"),
                two_days_ago.strftime("%Y-%m-%d 08:00:00"),
                yesterday.strftime("%Y-%m-%d 08:00:00"),
                two_days_ago.strftime("%Y-%m-%d 08:00:00")
            ),
            (
                "spon_20261111_001",
                "Herramientas Libres (OSI)",
                "https://herramientaslibres.org",
                "Promoviendo el software libre y la soberanía tecnológica ciudadana.",
                200,
                "EUR",
                "archived",
                None,
                "MOCK_PP_004",
                "MOCK_CAP_004",
                three_days_ago.strftime("%Y-%m-%d %H:%M:%S"),
                three_days_ago.strftime("%Y-%m-%d 08:00:00"),
                two_days_ago.strftime("%Y-%m-%d 08:00:00"),
                three_days_ago.strftime("%Y-%m-%d 08:00:00")
            )
        ]

        cursor.executemany("""
        INSERT INTO sponsors (
            id, name, url, message, amount_cents, currency, status,
            rejection_reason, paypal_order_id, paypal_capture_id,
            approved_at, starts_at, expires_at, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, sample_sponsors)
        print("✓ Sembrados 4 mecenas iniciales (1 activo y 3 en histórico).")

    conn.commit()
    conn.close()
    print("✅ Tabla 'sponsors' verificada y lista en SQLite.")

if __name__ == "__main__":
    init_sponsors_table()
