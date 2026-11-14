#!/usr/bin/env python3
"""
QueVotan Database Manager (SQLite)
Manages the SQLite database located at /opt/quevotan/data/quevotan.db
"""

import sqlite3
import os
import json
import hashlib
from datetime import datetime
from typing import Dict, Any, List, Optional

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'data', 'quevotan.db')

def get_connection() -> sqlite3.Connection:
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    conn.execute("PRAGMA journal_mode = WAL")
    return conn

def init_db():
    conn = get_connection()
    cursor = conn.cursor()

    cursor.executescript("""
    CREATE TABLE IF NOT EXISTS sessions (
        date TEXT PRIMARY KEY,
        chamber TEXT DEFAULT 'congreso',
        session_number INTEGER,
        initiatives_count INTEGER DEFAULT 0,
        approved_count INTEGER DEFAULT 0,
        rejected_count INTEGER DEFAULT 0,
        in_progress_count INTEGER DEFAULT 0,
        scheduled_count INTEGER DEFAULT 0,
        status TEXT DEFAULT 'past'
    );

    CREATE TABLE IF NOT EXISTS initiatives (
        id TEXT PRIMARY KEY,
        session_date TEXT NOT NULL,
        order_index INTEGER DEFAULT 1,
        official_title TEXT NOT NULL,
        title TEXT NOT NULL,
        chamber TEXT DEFAULT 'congreso',
        time TEXT,
        type TEXT NOT NULL,
        status TEXT NOT NULL,
        category TEXT NOT NULL,
        summary TEXT NOT NULL,
        is_omnibus INTEGER DEFAULT 0,
        three_keys_json TEXT,
        before_vs_after_json TEXT,
        votes_summary_json TEXT,
        group_votes_json TEXT,
        bocg_url TEXT,
        expediente_number TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (session_date) REFERENCES sessions(date) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS measures (
        id TEXT PRIMARY KEY,
        initiative_id TEXT NOT NULL,
        order_num INTEGER DEFAULT 1,
        title TEXT NOT NULL,
        category TEXT NOT NULL,
        plain_description TEXT NOT NULL,
        who_is_affected_json TEXT NOT NULL,
        real_world_example TEXT NOT NULL,
        arguments_pro_json TEXT NOT NULL,
        arguments_contra_json TEXT NOT NULL,
        FOREIGN KEY (initiative_id) REFERENCES initiatives(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS deputy_votes (
        id TEXT PRIMARY KEY,
        initiative_id TEXT NOT NULL,
        seat_number INTEGER NOT NULL,
        deputy_name TEXT NOT NULL,
        party TEXT NOT NULL,
        group_name TEXT NOT NULL,
        province TEXT NOT NULL,
        vote TEXT NOT NULL,
        FOREIGN KEY (initiative_id) REFERENCES initiatives(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS ai_cache (
        hash TEXT PRIMARY KEY,
        official_title TEXT NOT NULL,
        model_name TEXT NOT NULL,
        response_json TEXT NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

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

    CREATE INDEX IF NOT EXISTS idx_initiatives_date ON initiatives(session_date);
    CREATE INDEX IF NOT EXISTS idx_measures_init ON measures(initiative_id);
    CREATE INDEX IF NOT EXISTS idx_deputy_init ON deputy_votes(initiative_id);
    CREATE INDEX IF NOT EXISTS idx_sessions_date ON sessions(date);
    CREATE INDEX IF NOT EXISTS idx_sponsors_status ON sponsors(status);
    CREATE INDEX IF NOT EXISTS idx_sponsors_expires ON sponsors(expires_at);
    """)

    conn.commit()
    conn.close()
    print(f"✓ Base de datos SQLite inicializada correctamente en: {DB_PATH}")

def compute_hash(text: str) -> str:
    return hashlib.sha256(text.strip().encode('utf-8')).hexdigest()

def get_cached_ai(official_title: str) -> Optional[dict]:
    conn = get_connection()
    h = compute_hash(official_title)
    row = conn.execute("SELECT response_json FROM ai_cache WHERE hash = ?", (h,)).fetchone()
    conn.close()
    if row:
        return json.loads(row['response_json'])
    return None

def set_cached_ai(official_title: str, model_name: str, response_dict: dict):
    conn = get_connection()
    h = compute_hash(official_title)
    conn.execute(
        "INSERT OR REPLACE INTO ai_cache (hash, official_title, model_name, response_json) VALUES (?, ?, ?, ?)",
        (h, official_title, model_name, json.dumps(response_dict, ensure_ascii=False))
    )
    conn.commit()
    conn.close()

def save_initiative(init_data: dict, order_index: int = 1):
    conn = get_connection()
    cursor = conn.cursor()

    session_date = init_data['date']

    # Insert or update session record
    cursor.execute("""
    INSERT INTO sessions (date, chamber, status) 
    VALUES (?, ?, ?)
    ON CONFLICT(date) DO UPDATE SET chamber = excluded.chamber
    """, (session_date, init_data.get('chamber', 'congreso'), 'past'))

    # Insert or update initiative
    three_keys_str = json.dumps(init_data.get('threeKeys'), ensure_ascii=False) if init_data.get('threeKeys') else None
    before_after_str = json.dumps(init_data.get('beforeVsAfter'), ensure_ascii=False) if init_data.get('beforeVsAfter') else None
    votes_summary_str = json.dumps(init_data.get('votesSummary'), ensure_ascii=False) if init_data.get('votesSummary') else None
    group_votes_str = json.dumps(init_data.get('groupVotes'), ensure_ascii=False) if init_data.get('groupVotes') else None

    cursor.execute("""
    INSERT OR REPLACE INTO initiatives (
        id, session_date, order_index, official_title, title, chamber, time,
        type, status, category, summary, is_omnibus,
        three_keys_json, before_vs_after_json, votes_summary_json, group_votes_json,
        bocg_url, expediente_number
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        init_data['id'],
        session_date,
        order_index,
        init_data['officialTitle'],
        init_data['title'],
        init_data.get('chamber', 'congreso'),
        init_data.get('time'),
        init_data['type'],
        init_data['status'],
        init_data['category'],
        init_data['summary'],
        1 if init_data.get('isOmnibus') else 0,
        three_keys_str,
        before_after_str,
        votes_summary_str,
        group_votes_str,
        init_data.get('bocgUrl'),
        init_data.get('expedienteNumber')
    ))

    # Insert measures
    cursor.execute("DELETE FROM measures WHERE initiative_id = ?", (init_data['id'],))
    for idx, m in enumerate(init_data.get('measures', [])):
        cursor.execute("""
        INSERT INTO measures (
            id, initiative_id, order_num, title, category,
            plain_description, who_is_affected_json, real_world_example,
            arguments_pro_json, arguments_contra_json
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            m['id'],
            init_data['id'],
            idx + 1,
            m['title'],
            m['category'],
            m['plainDescription'],
            json.dumps(m['whoIsAffected'], ensure_ascii=False),
            m['realWorldExample'],
            json.dumps(m['argumentsPro'], ensure_ascii=False),
            json.dumps(m['argumentsContra'], ensure_ascii=False)
        ))

    # Insert deputy votes if provided
    if init_data.get('deputies'):
        cursor.execute("DELETE FROM deputy_votes WHERE initiative_id = ?", (init_data['id'],))
        dep_rows = [
            (
                f"{init_data['id']}-seat-{d['seatNumber']}",
                init_data['id'],
                d['seatNumber'],
                d['name'],
                d['party'],
                d['group'],
                d['province'],
                d['vote']
            )
            for d in init_data['deputies']
        ]
        cursor.executemany("""
        INSERT INTO deputy_votes (
            id, initiative_id, seat_number, deputy_name,
            party, group_name, province, vote
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, dep_rows)

    # Recalculate session statistics
    update_session_stats(session_date, cursor)

    conn.commit()
    conn.close()

def update_session_stats(session_date: str, cursor: sqlite3.Cursor):
    inits = cursor.execute("SELECT status FROM initiatives WHERE session_date = ?", (session_date,)).fetchall()
    total = len(inits)
    approved = sum(1 for r in inits if r['status'] == 'aprobado')
    rejected = sum(1 for r in inits if r['status'] == 'rechazado')
    in_prog = sum(1 for r in inits if r['status'] == 'en_tramite')
    sched = sum(1 for r in inits if r['status'] == 'agendado')

    today_iso = datetime.now().strftime("%Y-%m-%d")
    if session_date == today_iso:
        status = 'today'
    elif total > 0:
        status = 'past' if (in_prog == 0 and sched == 0) else 'upcoming'
    else:
        status = 'no_session'

    cursor.execute("""
    UPDATE sessions SET
        initiatives_count = ?,
        approved_count = ?,
        rejected_count = ?,
        in_progress_count = ?,
        scheduled_count = ?,
        status = ?
    WHERE date = ?
    """, (total, approved, rejected, in_prog, sched, status, session_date))

def get_initiatives_by_date(date_str: str) -> List[dict]:
    conn = get_connection()
    rows = conn.execute("""
    SELECT * FROM initiatives 
    WHERE session_date = ? 
    ORDER BY order_index ASC
    """, (date_str,)).fetchall()

    results = []
    for r in rows:
        init_id = r['id']
        measures = conn.execute("SELECT * FROM measures WHERE initiative_id = ? ORDER BY order_num ASC", (init_id,)).fetchall()
        meas_list = []
        for m in measures:
            meas_list.append({
                'id': m['id'],
                'title': m['title'],
                'category': m['category'],
                'plainDescription': m['plain_description'],
                'whoIsAffected': json.loads(m['who_is_affected_json']),
                'realWorldExample': m['real_world_example'],
                'argumentsPro': json.loads(m['arguments_pro_json']),
                'argumentsContra': json.loads(m['arguments_contra_json']),
            })

        deputies = conn.execute("SELECT * FROM deputy_votes WHERE initiative_id = ? ORDER BY seat_number ASC", (init_id,)).fetchall()
        dep_list = []
        for d in deputies:
            dep_list.append({
                'id': d['id'],
                'seatNumber': d['seat_number'],
                'name': d['deputy_name'],
                'party': d['party'],
                'group': d['group_name'],
                'province': d['province'],
                'vote': d['vote']
            })

        results.append({
            'id': r['id'],
            'date': r['session_date'],
            'officialTitle': r['official_title'],
            'title': r['title'],
            'chamber': r['chamber'],
            'time': r['time'],
            'type': r['type'],
            'status': r['status'],
            'category': r['category'],
            'summary': r['summary'],
            'isOmnibus': bool(r['is_omnibus']),
            'threeKeys': json.loads(r['three_keys_json']) if r['three_keys_json'] else None,
            'beforeVsAfter': json.loads(r['before_vs_after_json']) if r['before_vs_after_json'] else None,
            'votesSummary': json.loads(r['votes_summary_json']) if r['votes_summary_json'] else None,
            'groupVotes': json.loads(r['group_votes_json']) if r['group_votes_json'] else None,
            'measures': meas_list,
            'deputies': dep_list if dep_list else None,
            'bocgUrl': r['bocg_url'],
            'expedienteNumber': r['expediente_number']
        })

    conn.close()
    return results

if __name__ == '__main__':
    init_db()
