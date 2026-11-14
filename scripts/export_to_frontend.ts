import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.resolve(__dirname, '..', 'data', 'quevotan.db');
const targetFile = path.resolve(__dirname, '..', 'src', 'data', 'mockParliament.ts');

const db = new DatabaseSync(dbPath);

console.log(`Exportando iniciativas optimizadas desde SQLite (${dbPath}) hacia ${targetFile}...`);

// Query all initiatives ordered by date DESC, order_index ASC
const initiatives = db.prepare(`
  SELECT * FROM initiatives 
  ORDER BY session_date DESC, order_index ASC
`).all();

const formattedInitiatives = initiatives.map((r: any) => {
  const measures = db.prepare(`
    SELECT * FROM measures 
    WHERE initiative_id = ? 
    ORDER BY order_num ASC
  `).all(r.id);

  const formattedMeasures = measures.map((m: any) => ({
    id: m.id,
    title: m.title,
    category: m.category,
    plainDescription: m.plain_description,
    whoIsAffected: JSON.parse(m.who_is_affected_json || '[]'),
    realWorldExample: m.real_world_example,
    argumentsPro: JSON.parse(m.arguments_pro_json || '[]'),
    argumentsContra: JSON.parse(m.arguments_contra_json || '[]'),
  }));

  const rawVotes = r.votes_summary_json ? JSON.parse(r.votes_summary_json) : null;
  const votesSummary = rawVotes ? {
    si: Number(rawVotes.si ?? rawVotes.yes ?? 0),
    no: Number(rawVotes.no ?? 0),
    abstencion: Number(rawVotes.abstencion ?? rawVotes.abstain ?? 0),
    noVota: Number(rawVotes.noVota ?? rawVotes.absent ?? Math.max(0, (rawVotes.total || 350) - (Number(rawVotes.si ?? rawVotes.yes ?? 0) + Number(rawVotes.no ?? 0) + Number(rawVotes.abstencion ?? rawVotes.abstain ?? 0)))),
    total: Number(rawVotes.total ?? (r.chamber === 'senado' ? 266 : (r.chamber === 'europarl' ? 61 : 350)))
  } : undefined;

  const groupVotes = r.group_votes_json ? JSON.parse(r.group_votes_json) : undefined;

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
    measures: formattedMeasures,
    votesSummary,
    groupVotes,
    bocgUrl: r.bocg_url,
    expedienteNumber: r.expediente_number,
  };
});

let tsCode = `import type { Initiative, CalendarDay, DeputyVote, GroupVoteSummary } from '../types/parliament';

/* ========================================================================== */
/* MODELADO DE ESCANOS POR CÁMARA (GENERACIÓN EFICIENTE BAJO DEMANDA)         */
/* ========================================================================== */

// 1. CONGRESO DE LOS DIPUTADOS (350 Diputados)
const CONGRESO_GROUPS = [
  { name: 'G.P. Popular (PP)', seats: 137, color: '#0ea5e9', party: 'PP', province: 'Madrid' },
  { name: 'G.P. Socialista (PSOE)', seats: 121, color: '#ef4444', party: 'PSOE', province: 'Madrid' },
  { name: 'G.P. VOX', seats: 33, color: '#22c55e', party: 'VOX', province: 'Madrid' },
  { name: 'G.P. Plurinacional Sumar', seats: 27, color: '#ec4899', party: 'Sumar', province: 'Barcelona' },
  { name: 'G.P. Republicano (ERC)', seats: 7, color: '#f59e0b', party: 'ERC', province: 'Barcelona' },
  { name: 'G.P. Junts per Catalunya', seats: 7, color: '#06b6d4', party: 'Junts', province: 'Girona' },
  { name: 'G.P. Euskal Herria Bildu', seats: 6, color: '#84cc16', party: 'EH Bildu', province: 'Gipuzkoa' },
  { name: 'G.P. Vasco (EAJ-PNV)', seats: 5, color: '#10b981', party: 'EAJ-PNV', province: 'Bizkaia' },
  { name: 'G.P. Mixto (Podemos/BNG/CC/UPN)', seats: 7, color: '#8b5cf6', party: 'Mixto', province: 'Madrid' },
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

export function build350Deputies(si: number = 0, no: number = 0, abs: number = 0): { deputies: DeputyVote[]; groupVotes: GroupVoteSummary[] } {
  const votesPool: Array<'si' | 'no' | 'abstencion' | 'no_vota'> = [
    ...Array(si || 0).fill('si'),
    ...Array(no || 0).fill('no'),
    ...Array(abs || 0).fill('abstencion'),
  ];
  const noVota = Math.max(0, 350 - votesPool.length);
  if (noVota > 0) votesPool.push(...Array(noVota).fill('no_vota'));

  const deputies: DeputyVote[] = [];
  const groupVotes: GroupVoteSummary[] = [];
  let seatCounter = 1;
  let voteIdx = 0;

  for (const g of CONGRESO_GROUPS) {
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
      deputies.push({
        id: \`dep-\${seatCounter}\`,
        name: notable?.name || \`Diputado/a Escaño \${seatCounter}\`,
        group: g.name,
        party: notable?.party || g.party,
        seatNumber: seatCounter,
        vote: v,
        province: notable?.province || g.province,
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

// 2. SENADO DE ESPAÑA (266 Senadores)
const SENATE_GROUPS = [
  { name: 'G.P. Popular en el Senado (PP)', seats: 144, color: '#0ea5e9', party: 'PP', province: 'Madrid' },
  { name: 'G.P. Socialista (PSOE)', seats: 88, color: '#ef4444', party: 'PSOE', province: 'Sevilla' },
  { name: 'G.P. Izquierdas por la Independencia (ERC/Bildu)', seats: 10, color: '#f59e0b', party: 'ERC-Bildu', province: 'Barcelona' },
  { name: 'G.P. Plural en el Senado (Junts/CC/BNG)', seats: 6, color: '#06b6d4', party: 'Junts', province: 'Girona' },
  { name: 'G.P. Vasco en el Senado (EAJ-PNV)', seats: 5, color: '#10b981', party: 'EAJ-PNV', province: 'Bizkaia' },
  { name: 'G.P. VOX', seats: 3, color: '#22c55e', party: 'VOX', province: 'Madrid' },
  { name: 'G.P. Mixto (UPN/Compromís/Más Madrid)', seats: 10, color: '#8b5cf6', party: 'Mixto', province: 'Valencia' },
];

export function build266Senators(si: number = 0, no: number = 0, abs: number = 0): { deputies: DeputyVote[]; groupVotes: GroupVoteSummary[] } {
  const votesPool: Array<'si' | 'no' | 'abstencion' | 'no_vota'> = [
    ...Array(si || 0).fill('si'),
    ...Array(no || 0).fill('no'),
    ...Array(abs || 0).fill('abstencion'),
  ];
  const noVota = Math.max(0, 266 - votesPool.length);
  if (noVota > 0) votesPool.push(...Array(noVota).fill('no_vota'));

  const senators: DeputyVote[] = [];
  const groupVotes: GroupVoteSummary[] = [];
  let seatCounter = 1;
  let voteIdx = 0;

  for (const g of SENATE_GROUPS) {
    let gSi = 0;
    let gNo = 0;
    let gAbs = 0;

    for (let i = 0; i < g.seats; i++) {
      const v = votesPool[voteIdx] || 'abstencion';
      voteIdx++;
      if (v === 'si') gSi++;
      else if (v === 'no') gNo++;
      else if (v === 'abstencion') gAbs++;

      senators.push({
        id: \`sen-\${seatCounter}\`,
        name: seatCounter === 1 ? 'Rollán Ojeda, Pedro (Presidente)' : \`Senador/a Escaño \${seatCounter}\`,
        group: g.name,
        party: g.party,
        seatNumber: seatCounter,
        vote: v,
        province: g.province,
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

  return { deputies: senators, groupVotes };
}

// 3. PARLAMENTO EUROPEO (61 Eurodiputados Españoles)
const EUROPARL_GROUPS = [
  { name: 'G.P. Popular Europeo (PP)', seats: 22, color: '#0ea5e9', party: 'PP (PPE)' },
  { name: 'G.P. Socialistas y Demócratas (PSOE)', seats: 20, color: '#ef4444', party: 'PSOE (S&D)' },
  { name: 'Patriotas por Europa (VOX)', seats: 6, color: '#22c55e', party: 'VOX (PfE)' },
  { name: 'La Izquierda Europea (Podemos/Sumar)', seats: 5, color: '#ec4899', party: 'Podemos/Sumar (The Left)' },
  { name: 'Los Verdes / ALE (Ahora Repúblicas)', seats: 3, color: '#84cc16', party: 'Ahora Repúblicas (Greens/EFA)' },
  { name: 'Renew Europe (EAJ-PNV/CC)', seats: 1, color: '#f59e0b', party: 'PNV (Renew)' },
  { name: 'No Inscritos / Otros (SALF/Junts)', seats: 4, color: '#8b5cf6', party: 'Otros (NI)' },
];

export function build61Eurodeputies(si: number = 0, no: number = 0, abs: number = 0): { deputies: DeputyVote[]; groupVotes: GroupVoteSummary[] } {
  const votesPool: Array<'si' | 'no' | 'abstencion' | 'no_vota'> = [
    ...Array(si || 0).fill('si'),
    ...Array(no || 0).fill('no'),
    ...Array(abs || 0).fill('abstencion'),
  ];
  const noVota = Math.max(0, 61 - votesPool.length);
  if (noVota > 0) votesPool.push(...Array(noVota).fill('no_vota'));

  const meps: DeputyVote[] = [];
  const groupVotes: GroupVoteSummary[] = [];
  let seatCounter = 1;
  let voteIdx = 0;

  for (const g of EUROPARL_GROUPS) {
    let gSi = 0;
    let gNo = 0;
    let gAbs = 0;

    for (let i = 0; i < g.seats; i++) {
      const v = votesPool[voteIdx] || 'abstencion';
      voteIdx++;
      if (v === 'si') gSi++;
      else if (v === 'no') gNo++;
      else if (v === 'abstencion') gAbs++;

      meps.push({
        id: \`mep-\${seatCounter}\`,
        name: \`Eurodiputado/a Escaño \${seatCounter}\`,
        group: g.name,
        party: g.party,
        seatNumber: seatCounter,
        vote: v,
        province: 'España (Delegación Europea)',
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

  return { deputies: meps, groupVotes };
}

// 4. DIPUTACIÓN PERMANENTE DEL CONGRESO (69 Miembros)
const DIPUTACION_PERMANENTE_GROUPS = [
  { name: 'G.P. Popular (PP)', seats: 27, color: '#0ea5e9', party: 'PP', province: 'Madrid' },
  { name: 'G.P. Socialista (PSOE)', seats: 25, color: '#ef4444', party: 'PSOE', province: 'Madrid' },
  { name: 'G.P. VOX', seats: 6, color: '#22c55e', party: 'VOX', province: 'Madrid' },
  { name: 'G.P. Plurinacional Sumar', seats: 6, color: '#ec4899', party: 'Sumar', province: 'Madrid' },
  { name: 'G.P. Republicano (ERC)', seats: 1, color: '#f59e0b', party: 'ERC', province: 'Barcelona' },
  { name: 'G.P. Junts per Catalunya', seats: 1, color: '#06b6d4', party: 'Junts', province: 'Girona' },
  { name: 'G.P. Euskal Herria Bildu', seats: 1, color: '#84cc16', party: 'EH Bildu', province: 'Gipuzkoa' },
  { name: 'G.P. Vasco (EAJ-PNV)', seats: 1, color: '#10b981', party: 'EAJ-PNV', province: 'Bizkaia' },
  { name: 'G.P. Mixto (Podemos)', seats: 1, color: '#8b5cf6', party: 'Podemos', province: 'Madrid' },
];

const NOTABLE_DIPUTACION_MEMBERS: Record<number, { name: string; party: string; province: string }> = {
  1: { name: 'Núñez Feijóo, Alberto', party: 'PP', province: 'Madrid' },
  2: { name: 'Gamarra Ruiz-Clavijo, Concepción', party: 'PP', province: 'La Rioja' },
  3: { name: 'Tellado Filgueira, Miguel Ángel', party: 'PP', province: 'A Coruña' },
  4: { name: 'Álvarez de Toledo, Cayetana', party: 'PP', province: 'Madrid' },
  28: { name: 'Armengol Socias, Francina (Presidenta)', party: 'PSOE', province: 'Illes Balears' },
  29: { name: 'Sánchez Pérez-Castejón, Pedro', party: 'PSOE', province: 'Madrid' },
  30: { name: 'Montero Cuadrado, María Jesús', party: 'PSOE', province: 'Sevilla' },
  31: { name: 'López Álvarez, Patxi', party: 'PSOE', province: 'Bizkaia' },
  53: { name: 'Abascal Conde, Santiago', party: 'VOX', province: 'Madrid' },
  54: { name: 'Pepa Millán, María José', party: 'VOX', province: 'Sevilla' },
  59: { name: 'Díaz Pérez, Yolanda', party: 'Sumar', province: 'Madrid' },
  60: { name: 'Errejón Galván, Íñigo', party: 'Sumar', province: 'Madrid' },
  65: { name: 'Rufián Romero, Gabriel', party: 'ERC', province: 'Barcelona' },
  66: { name: 'Nogueras i Camero, Míriam', party: 'Junts', province: 'Barcelona' },
  67: { name: 'Aizpurua Arzallus, Mertxe', party: 'EH Bildu', province: 'Gipuzkoa' },
  68: { name: 'Esteban Bravo, Aitor', party: 'EAJ-PNV', province: 'Bizkaia' },
  69: { name: 'Belarra Urteaga, Ione', party: 'Podemos', province: 'Madrid' },
};

export function build69DiputacionPermanente(si: number = 0, no: number = 0, abs: number = 0): { deputies: DeputyVote[]; groupVotes: GroupVoteSummary[] } {
  const votesPool: Array<'si' | 'no' | 'abstencion' | 'no_vota'> = [
    ...Array(si || 0).fill('si'),
    ...Array(no || 0).fill('no'),
    ...Array(abs || 0).fill('abstencion'),
  ];
  const noVota = Math.max(0, 69 - votesPool.length);
  if (noVota > 0) votesPool.push(...Array(noVota).fill('no_vota'));

  const deputies: DeputyVote[] = [];
  const groupVotes: GroupVoteSummary[] = [];
  let seatCounter = 1;
  let voteIdx = 0;

  for (const g of DIPUTACION_PERMANENTE_GROUPS) {
    let gSi = 0;
    let gNo = 0;
    let gAbs = 0;

    for (let i = 0; i < g.seats; i++) {
      const v = votesPool[voteIdx] || 'abstencion';
      voteIdx++;
      if (v === 'si') gSi++;
      else if (v === 'no') gNo++;
      else if (v === 'abstencion') gAbs++;

      const notable = NOTABLE_DIPUTACION_MEMBERS[seatCounter];
      deputies.push({
        id: \`perm-\${seatCounter}\`,
        name: notable?.name || \`Vocal Diputación Permanente \${seatCounter}\`,
        group: g.name,
        party: notable?.party || g.party,
        seatNumber: seatCounter,
        vote: v,
        province: notable?.province || g.province,
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

/* ========================================================================== */
/* CATÁLOGO HISTÓRICO DE INICIATIVAS PARLAMENTARIAS                           */
/* ========================================================================== */

export const SAMPLE_INITIATIVES: Initiative[] = [
`;

for (const init of formattedInitiatives) {
  const vs = init.votesSummary;
  const vsStr = vs ? JSON.stringify(vs) : 'undefined';
  
  // Group votes fallback
  let groupVotesExpression = 'undefined';
  if (init.groupVotes) {
    groupVotesExpression = JSON.stringify(init.groupVotes);
  } else if (vs) {
    if (init.chamber === 'senado') {
      groupVotesExpression = `build266Senators(${vs.si}, ${vs.no}, ${vs.abstencion}).groupVotes`;
    } else if (init.chamber === 'europarl') {
      groupVotesExpression = `build61Eurodeputies(${vs.si}, ${vs.no}, ${vs.abstencion}).groupVotes`;
    } else if (vs.total === 69) {
      groupVotesExpression = `build69DiputacionPermanente(${vs.si}, ${vs.no}, ${vs.abstencion}).groupVotes`;
    } else {
      groupVotesExpression = `build350Deputies(${vs.si}, ${vs.no}, ${vs.abstencion}).groupVotes`;
    }
  }

  tsCode += `  {
    id: ${JSON.stringify(init.id)},
    title: ${JSON.stringify(init.title)},
    officialTitle: ${JSON.stringify(init.officialTitle)},
    chamber: ${JSON.stringify(init.chamber)},
    date: ${JSON.stringify(init.date)},
    time: ${JSON.stringify(init.time)},
    type: ${JSON.stringify(init.type)},
    status: ${JSON.stringify(init.status)},
    category: ${JSON.stringify(init.category)},
    summary: ${JSON.stringify(init.summary)},
    isOmnibus: ${init.isOmnibus ? 'true' : 'false'},
    threeKeys: ${JSON.stringify(init.threeKeys, null, 6)},
    beforeVsAfter: ${JSON.stringify(init.beforeVsAfter, null, 6)},
    measures: ${JSON.stringify(init.measures, null, 6)},
    votesSummary: ${vsStr},
    groupVotes: ${groupVotesExpression},
    bocgUrl: ${JSON.stringify(init.bocgUrl)},
    expedienteNumber: ${JSON.stringify(init.expedienteNumber)},
  },
`;
}

tsCode += `];

export const ALL_SESSION_DATES: string[] = Array.from(new Set(SAMPLE_INITIATIVES.map((i) => i.date))).sort();
export const LATEST_SESSION_DATE: string = ALL_SESSION_DATES[ALL_SESSION_DATES.length - 1] || '2026-10-02';

export function getCalendarDaysForMonth(year: number, month: number, todayDate?: string, chamberFilter: string = 'all'): CalendarDay[] {
  const daysInMonth = new Date(year, month, 0).getDate();
  const calendarDays: CalendarDay[] = [];
  const todayStr = todayDate || (typeof window !== 'undefined' ? new Date().toISOString().split('T')[0] : LATEST_SESSION_DATE);

  for (let day = 1; day <= daysInMonth; day++) {
    const dayStr = day < 10 ? \`0\${day}\` : \`\${day}\`;
    const monthStr = month < 10 ? \`0\${month}\` : \`\${month}\`;
    const dateStr = \`\${year}-\${monthStr}-\${dayStr}\`;

    const dayInitiatives = SAMPLE_INITIATIVES.filter((i) => i.date === dateStr && (chamberFilter === 'all' || i.chamber === chamberFilter));
    const hasSession = dayInitiatives.length > 0;

    let status: CalendarDay['status'] = 'no_session';
    if (dateStr === todayStr) {
      status = 'today';
    } else if (hasSession) {
      status = dateStr < todayStr ? 'past' : 'upcoming';
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
`;

fs.writeFileSync(targetFile, tsCode, 'utf-8');
console.log(`✓ Archivo optimizado generado en ${targetFile} (${(fs.statSync(targetFile).size / 1024).toFixed(1)} KB).`);
