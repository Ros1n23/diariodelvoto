import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { CalendarDay, Initiative, Sponsor, SponsorAuctionState } from '../src/types/parliament.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.resolve(__dirname, '..', 'data', 'quevotan.db');

let _db: DatabaseSync | null = null;
function getDb(): DatabaseSync {
  if (!_db) {
    _db = new DatabaseSync(dbPath);
  }
  return _db;
}

export function getCalendarDaysForMonth(year: number, month: number, todayOverride?: string): CalendarDay[] {
  const db = getDb();
  const daysInMonth = new Date(year, month, 0).getDate();
  const calendarDays: CalendarDay[] = [];
  const todayStr = todayOverride || new Date().toISOString().split('T')[0];

  const monthStr = month < 10 ? `0${month}` : `${month}`;
  const startDate = `${year}-${monthStr}-01`;
  const endDate = `${year}-${monthStr}-${daysInMonth < 10 ? '0' + daysInMonth : daysInMonth}`;

  // Fetch all sessions in this month
  const sessions = db.prepare(`
    SELECT * FROM sessions 
    WHERE date >= ? AND date <= ?
  `).all(startDate, endDate) as any[];

  const sessionMap = new Map();
  for (const s of sessions) {
    sessionMap.set(s.date, s);
  }

  // Fetch all initiatives in this month (light summary)
  const inits = db.prepare(`
    SELECT id, session_date, order_index, title, status, category, type
    FROM initiatives
    WHERE session_date >= ? AND session_date <= ?
    ORDER BY session_date ASC, order_index ASC
  `).all(startDate, endDate) as any[];

  const initMap = new Map<string, any[]>();
  for (const i of inits) {
    if (!initMap.has(i.session_date)) initMap.set(i.session_date, []);
    initMap.get(i.session_date)!.push(i);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const dayStr = day < 10 ? `0${day}` : `${day}`;
    const dateStr = `${year}-${monthStr}-${dayStr}`;

    const dayInits = initMap.get(dateStr) || [];
    const hasSession = dayInits.length > 0;

    let status: CalendarDay['status'] = 'no_session';
    if (dateStr === todayStr) {
      status = 'today';
    } else if (hasSession) {
      status = dateStr < todayStr ? 'past' : 'upcoming';
    }

    const approvedCount = dayInits.filter((i) => i.status === 'aprobado').length;
    const rejectedCount = dayInits.filter((i) => i.status === 'rechazado').length;
    const inProgressCount = dayInits.filter((i) => i.status === 'en_tramite').length;
    const scheduledCount = dayInits.filter((i) => i.status === 'agendado').length;

    calendarDays.push({
      dateStr,
      dayNumber: day,
      status,
      hasSession,
      initiativesCount: dayInits.length,
      approvedCount,
      rejectedCount,
      inProgressCount,
      scheduledCount,
      initiatives: dayInits,
    });
  }

  return calendarDays;
}

export function getInitiativesByDate(dateStr: string): Initiative[] {
  const db = getDb();
  const rows = db.prepare(`
    SELECT * FROM initiatives 
    WHERE session_date = ? 
    ORDER BY order_index ASC
  `).all(dateStr) as any[];

  return rows.map((r) => formatInitiative(db, r));
}

export function getAllInitiatives(): Initiative[] {
  const db = getDb();
  const rows = db.prepare(`
    SELECT * FROM initiatives 
    ORDER BY session_date DESC, order_index ASC
  `).all() as any[];

  return rows.map((r) => formatInitiative(db, r));
}

export function getInitiativeById(id: string): Initiative | null {
  const db = getDb();
  const row = db.prepare(`SELECT * FROM initiatives WHERE id = ?`).get(id) as any;
  if (!row) return null;
  return formatInitiative(db, row, true);
}

function formatInitiative(db: DatabaseSync, r: any, includeAllDeputies = true): Initiative {
  // Fetch measures
  const measures = db.prepare(`
    SELECT * FROM measures 
    WHERE initiative_id = ? 
    ORDER BY order_num ASC
  `).all(r.id) as any[];

  const formattedMeasures = measures.map((m) => ({
    id: m.id,
    title: m.title,
    category: m.category,
    plainDescription: m.plain_description,
    whoIsAffected: JSON.parse(m.who_is_affected_json || '[]'),
    realWorldExample: m.real_world_example,
    argumentsPro: JSON.parse(m.arguments_pro_json || '[]'),
    argumentsContra: JSON.parse(m.arguments_contra_json || '[]'),
  }));

  // Fetch deputies if requested
  let formattedDeputies = undefined;
  if (includeAllDeputies) {
    const deputies = db.prepare(`
      SELECT * FROM deputy_votes 
      WHERE initiative_id = ? 
      ORDER BY seat_number ASC
    `).all(r.id) as any[];

    if (deputies.length > 0) {
      formattedDeputies = deputies.map((d) => ({
        id: d.id,
        seatNumber: d.seat_number,
        name: d.deputy_name,
        party: d.party,
        group: d.group_name,
        province: d.province,
        vote: d.vote,
      }));
    }
  }

  return {
    id: r.id,
    date: r.session_date,
    officialTitle: r.official_title,
    title: r.title,
    chamber: r.chamber,
    time: r.time,
    type: r.type,
    status: r.status,
    category: r.category,
    summary: r.summary,
    isOmnibus: Boolean(r.is_omnibus),
    threeKeys: r.three_keys_json ? JSON.parse(r.three_keys_json) : undefined,
    beforeVsAfter: r.before_vs_after_json ? JSON.parse(r.before_vs_after_json) : undefined,
    votesSummary: r.votes_summary_json ? JSON.parse(r.votes_summary_json) : undefined,
    groupVotes: r.group_votes_json ? JSON.parse(r.group_votes_json) : undefined,
    measures: formattedMeasures,
    deputies: formattedDeputies,
    bocgUrl: r.bocg_url,
    expedienteNumber: r.expediente_number,
  };
}

export function getSponsorAuctionState(): SponsorAuctionState {
  const db = getDb();
  const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 19);

  // 1. Reconcile: If active sponsor has expired, archive it and check queued
  const activeRow = db.prepare(`SELECT * FROM sponsors WHERE status = 'active'`).get() as any;
  if (activeRow && activeRow.expires_at && activeRow.expires_at <= nowStr) {
    db.prepare(`UPDATE sponsors SET status = 'archived' WHERE id = ?`).run(activeRow.id);
    
    // Check if there is a queued sponsor to promote
    const queuedRow = db.prepare(`
      SELECT * FROM sponsors WHERE status = 'queued' 
      ORDER BY created_at ASC LIMIT 1
    `).get() as any;

    if (queuedRow) {
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().replace('T', ' ').slice(0, 19);
      db.prepare(`
        UPDATE sponsors SET status = 'active', starts_at = ?, expires_at = ? WHERE id = ?
      `).run(nowStr, expiresAt, queuedRow.id);
    }
  }

  // 2. Fetch current active sponsor
  const currentActive = db.prepare(`SELECT * FROM sponsors WHERE status = 'active'`).get() as any;
  const activeSponsor: Sponsor | null = currentActive ? formatSponsor(currentActive) : null;

  // 3. Queued count
  const queuedCountRow = db.prepare(`SELECT COUNT(*) as count FROM sponsors WHERE status = 'queued'`).get() as any;
  const queuedCount = queuedCountRow?.count || 0;

  // 4. Calculate minimum next bid (highest active or queued + 1 EUR)
  const maxQueuedRow = db.prepare(`
    SELECT MAX(amount_cents) as max_cents FROM sponsors WHERE status IN ('active', 'queued')
  `).get() as any;
  const maxCents = maxQueuedRow?.max_cents || (activeSponsor ? activeSponsor.amountCents : 0);
  const minNextBidEur = maxCents > 0 ? (maxCents / 100) + 1.00 : 1.00;

  // 5. Fetch last 10 archived sponsors
  const historyRows = db.prepare(`
    SELECT * FROM sponsors 
    WHERE status = 'archived'
    ORDER BY COALESCE(starts_at, created_at) DESC 
    LIMIT 10
  `).all() as any[];
  const history: Sponsor[] = historyRows.map(formatSponsor);

  return {
    activeSponsor,
    queuedCount,
    minNextBidEur,
    history,
  };
}

export function createPendingSponsor(data: {
  name: string;
  url: string;
  message: string;
  amountCents?: number;
  amountEur?: number;
  paypalOrderId?: string;
  paypalCaptureId?: string;
}): Sponsor {
  const db = getDb();
  const id = `spon_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 19);
  const cents = typeof data.amountCents === 'number'
    ? Math.round(data.amountCents)
    : typeof data.amountEur === 'number'
    ? Math.round(data.amountEur * 100)
    : 100;

  db.prepare(`
    INSERT INTO sponsors (
      id, name, url, message, amount_cents, currency, status,
      paypal_order_id, paypal_capture_id, created_at
    ) VALUES (?, ?, ?, ?, ?, 'EUR', 'pending_approval', ?, ?, ?)
  `).run(
    id,
    data.name.trim(),
    data.url.trim(),
    data.message.trim(),
    cents,
    data.paypalOrderId ?? null,
    data.paypalCaptureId ?? null,
    nowStr
  );

  const row = db.prepare(`SELECT * FROM sponsors WHERE id = ?`).get(id) as any;
  return formatSponsor(row);
}

export function getPendingSponsors(): Sponsor[] {
  const db = getDb();
  const rows = db.prepare(`
    SELECT * FROM sponsors WHERE status = 'pending_approval' ORDER BY created_at DESC
  `).all() as any[];
  return rows.map(formatSponsor);
}

export function moderateSponsor(id: string, action: 'approve' | 'reject', rejectionReason?: string): Sponsor | null {
  const db = getDb();
  const sponsor = db.prepare(`SELECT * FROM sponsors WHERE id = ?`).get(id) as any;
  if (!sponsor) return null;

  const now = new Date();
  const nowStr = now.toISOString().replace('T', ' ').slice(0, 19);

  if (action === 'approve') {
    // Check if there is an active sponsor currently within its 24 hours
    const activeRow = db.prepare(`SELECT * FROM sponsors WHERE status = 'active'`).get() as any;
    if (activeRow && activeRow.expires_at && activeRow.expires_at > nowStr) {
      // An active sponsor is running, queue this one
      db.prepare(`
        UPDATE sponsors SET status = 'queued', approved_at = ? WHERE id = ?
      `).run(nowStr, id);
    } else {
      // No active sponsor, start immediately for 24h
      const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString().replace('T', ' ').slice(0, 19);
      if (activeRow) {
        db.prepare(`UPDATE sponsors SET status = 'archived' WHERE id = ?`).run(activeRow.id);
      }
      db.prepare(`
        UPDATE sponsors SET status = 'active', approved_at = ?, starts_at = ?, expires_at = ? WHERE id = ?
      `).run(nowStr, nowStr, expiresAt, id);
    }
  } else if (action === 'reject') {
    db.prepare(`
      UPDATE sponsors SET status = 'rejected', rejection_reason = ? WHERE id = ?
    `).run(rejectionReason || 'No cumple las normas editoriales de la gaceta', id);
  }

  const updated = db.prepare(`SELECT * FROM sponsors WHERE id = ?`).get(id) as any;
  return formatSponsor(updated);
}

function formatSponsor(r: any): Sponsor {
  return {
    id: r.id,
    name: r.name,
    url: r.url,
    message: r.message,
    amountCents: r.amount_cents,
    amountEur: r.amount_cents / 100,
    currency: r.currency || 'EUR',
    status: r.status,
    rejectionReason: r.rejection_reason || undefined,
    approvedAt: r.approved_at || undefined,
    startsAt: r.starts_at || undefined,
    expiresAt: r.expires_at || undefined,
    createdAt: r.created_at,
  };
}
