import { DatabaseSync } from 'node:sqlite';
import { SAMPLE_INITIATIVES } from '../src/data/mockParliament.ts';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.join(__dirname, '..', 'data', 'quevotan.db');

const db = new DatabaseSync(dbPath);

console.log(`Conectando a base de datos SQLite en: ${dbPath}`);

// Prepare statements
const upsertSession = db.prepare(`
  INSERT INTO sessions (date, chamber, status) 
  VALUES (?, ?, ?)
  ON CONFLICT(date) DO UPDATE SET chamber = excluded.chamber
`);

const insertInitiative = db.prepare(`
  INSERT OR REPLACE INTO initiatives (
    id, session_date, order_index, official_title, title, chamber, time,
    type, status, category, summary, is_omnibus,
    three_keys_json, before_vs_after_json, votes_summary_json, group_votes_json,
    bocg_url, expediente_number
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const deleteMeasures = db.prepare(`DELETE FROM measures WHERE initiative_id = ?`);
const insertMeasure = db.prepare(`
  INSERT INTO measures (
    id, initiative_id, order_num, title, category,
    plain_description, who_is_affected_json, real_world_example,
    arguments_pro_json, arguments_contra_json
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const deleteDeputies = db.prepare(`DELETE FROM deputy_votes WHERE initiative_id = ?`);
const insertDeputy = db.prepare(`
  INSERT INTO deputy_votes (
    id, initiative_id, seat_number, deputy_name,
    party, group_name, province, vote
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`);

// Group initiatives by date to determine order_index
const byDate: Record<string, typeof SAMPLE_INITIATIVES> = {};
for (const init of SAMPLE_INITIATIVES) {
  if (!byDate[init.date]) byDate[init.date] = [];
  byDate[init.date].push(init);
}

for (const [dateStr, inits] of Object.entries(byDate)) {
  upsertSession.run(dateStr, 'congreso', dateStr === '2026-10-24' ? 'today' : 'past');

  for (let idx = 0; idx < inits.length; idx++) {
    const init = inits[idx];
    const orderIndex = idx + 1;

    console.log(`Migrando: [${init.date}] #${orderIndex} ${init.title}`);

    insertInitiative.run(
      init.id,
      init.date,
      orderIndex,
      init.officialTitle,
      init.title,
      init.chamber || 'congreso',
      init.time || null,
      init.type,
      init.status,
      init.category,
      init.summary,
      init.isOmnibus ? 1 : 0,
      init.threeKeys ? JSON.stringify(init.threeKeys) : null,
      init.beforeVsAfter ? JSON.stringify(init.beforeVsAfter) : null,
      init.votesSummary ? JSON.stringify(init.votesSummary) : null,
      init.groupVotes ? JSON.stringify(init.groupVotes) : null,
      init.bocgUrl || null,
      init.expedienteNumber || null
    );

    deleteMeasures.run(init.id);
    for (let mIdx = 0; mIdx < init.measures.length; mIdx++) {
      const m = init.measures[mIdx];
      insertMeasure.run(
        m.id,
        init.id,
        mIdx + 1,
        m.title,
        m.category,
        m.plainDescription,
        JSON.stringify(m.whoIsAffected),
        m.realWorldExample,
        JSON.stringify(m.argumentsPro),
        JSON.stringify(m.argumentsContra)
      );
    }

    if (init.deputies && init.deputies.length > 0) {
      deleteDeputies.run(init.id);
      for (const d of init.deputies) {
        insertDeputy.run(
          `${init.id}-seat-${d.seatNumber}`,
          init.id,
          d.seatNumber,
          d.name,
          d.party,
          d.group,
          d.province,
          d.vote
        );
      }
    }
  }

  // Update session stats
  const total = inits.length;
  const approved = inits.filter(i => i.status === 'aprobado').length;
  const rejected = inits.filter(i => i.status === 'rechazado').length;
  const inProgress = inits.filter(i => i.status === 'en_tramite').length;
  const scheduled = inits.filter(i => i.status === 'agendado').length;
  const status = dateStr === '2026-10-24' ? 'today' : (inProgress > 0 || scheduled > 0 ? 'upcoming' : 'past');

  db.prepare(`
    UPDATE sessions SET
      initiatives_count = ?,
      approved_count = ?,
      rejected_count = ?,
      in_progress_count = ?,
      scheduled_count = ?,
      status = ?
    WHERE date = ?
  `).run(total, approved, rejected, inProgress, scheduled, status, dateStr);
}

console.log('✓ Migración a SQLite completada con éxito.');
