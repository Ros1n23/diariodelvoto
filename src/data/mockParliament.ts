import type { Initiative, CalendarDay, DeputyVote, GroupVoteSummary } from '../types/parliament';

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
        id: `dep-${seatCounter}`,
        name: notable?.name || `Diputado/a Escaño ${seatCounter}`,
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
        id: `sen-${seatCounter}`,
        name: seatCounter === 1 ? 'Rollán Ojeda, Pedro (Presidente)' : `Senador/a Escaño ${seatCounter}`,
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
        id: `mep-${seatCounter}`,
        name: `Eurodiputado/a Escaño ${seatCounter}`,
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
        id: `perm-${seatCounter}`,
        name: notable?.name || `Vocal Diputación Permanente ${seatCounter}`,
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
  {
    id: "congreso-2026-11-12-1",
    title: "La Diputación Permanente convalida por la mínima el decreto de vivienda asequible y escudo antidesahucios",
    officialTitle: "Resolución de 12 de noviembre de 2026, de la Diputación Permanente del Congreso de los Diputados, por la que se ordena la publicación del Acuerdo de convalidación del Real Decreto-ley 29/2026, de 6 de octubre, por el que se adoptan medidas urgentes para la protección de la función social de la vivienda y la ampliación de la oferta de vivienda asequible.",
    chamber: "congreso",
    date: "2026-11-12",
    time: "12:45 h",
    type: "real_decreto_ley",
    status: "aprobado",
    category: "Vivienda",
    summary: "La Diputación Permanente del Congreso de los Diputados convalida por un solo voto de diferencia (35 frente a 34) el Real Decreto-ley 29/2026 del Ejecutivo. La norma mantiene plenamente en vigor la prórroga de suspensión de desahucios para hogares vulnerables hasta 2030, la línea de avales del ICO ('Tu Casa') de hasta 50.000 euros para cubrir la entrada de primera vivienda a jóvenes y familias, y refuerza el marco fiscal contra la retención especulativa de inmuebles desocupados.",
    isOmnibus: true,
    threeKeys: {
      "what": "Convalidación definitiva del Real Decreto-ley 29/2026 sobre función social de la vivienda y parque asequible.",
      "pocket": "Blindaje antidesahucios hasta 2030 para colectivos vulnerables y avales públicos del ICO de hasta 50.000 € para la entrada de primera vivienda.",
      "clash": "El bloque gubernamental y sus socios (PSOE, Sumar, ERC, Bildu, PNV y Mixto) suman 35 votos frente a los 34 de PP, Vox y Junts, que denuncian intervencionismo e inseguridad jurídica."
},
    beforeVsAfter: {
      "before": "El Real Decreto-ley permanecía en vigor provisional expuesto a decaer si no obtenía el respaldo mayoritario de la Cámara.",
      "after": "Al ser convalidado por la Diputación Permanente (35 sí frente a 34 no), sus medidas adquieren firmeza legislativa permanente en todo el territorio nacional."
},
    measures: [
      {
            "id": "congreso-2026-11-12-1-m1",
            "title": "Blindaje y prórroga antidesahucios para hogares vulnerables hasta 2030",
            "category": "Protección Social y Vivienda",
            "plainDescription": "Se prorroga de forma obligatoria hasta el año 2030 la suspensión de lanzamientos y desahucios judiciales para familias y personas en situación de acreditada vulnerabilidad socioeconómica sin alternativa habitacional.",
            "whoIsAffected": [
                  "Inquilinos en riesgo de exclusión",
                  "Familias con menores a cargo",
                  "Grandes tenedores de vivienda"
            ],
            "realWorldExample": "Una familia con dos hijos e ingresos mensuales de 1.100 € en proceso de desalojo mantendrá paralizado el lanzamiento judicial mientras los servicios sociales gestionan una vivienda de alquiler social.",
            "argumentsPro": [
                  "Garantiza el derecho humano fundamental a no quedar en la calle sin amparo asistencial",
                  "Frena situaciones dramáticas de exclusión en momentos de carestía inmobiliaria"
            ],
            "argumentsContra": [
                  "La oposición critica que traslada la responsabilidad asistencial del Estado a los propietarios",
                  "Demoras en las resoluciones administrativas de vulnerabilidad"
            ]
      },
      {
            "id": "congreso-2026-11-12-1-m2",
            "title": "Línea de avales ICO 'Tu Casa' de hasta 50.000 € para primera vivienda",
            "category": "Acceso a la Vivienda",
            "plainDescription": "Mecanismo público de garantías financieras a través del Instituto de Crédito Oficial que avala hasta un 20% del importe de la vivienda para menores de 35 años y familias con menores a cargo, permitiendo obtener hipotecas de hasta el 100%.",
            "whoIsAffected": [
                  "Jóvenes menores de 35 años",
                  "Familias con menores a cargo",
                  "Compradores de primera vivienda habitual"
            ],
            "realWorldExample": "Un joven de 29 años con contrato fijo que gana 1.900 € netos al mes pero carece de los 30.000 € de ahorro exigidos para la entrada podrá acceder al aval estatal y formalizar el préstamo.",
            "argumentsPro": [
                  "Elimina la barrera insalvable del ahorro previo para la emancipación juvenil",
                  "Permite que el coste mensual de la hipoteca sea inferior al alquiler de mercado"
            ],
            "argumentsContra": [
                  "Riesgo de elevar artificialmente la demanda y presionar los precios de venta al alza",
                  "Posible sobreendeudamiento si se encarecen los tipos de interés"
            ]
      },
      {
            "id": "congreso-2026-11-12-1-m3",
            "title": "Bonificaciones fiscales al alquiler asequible y recargo a inmuebles vacíos",
            "category": "Fiscalidad Inmobiliaria",
            "plainDescription": "Exenciones de hasta el 70% en el IRPF para pequeños propietarios que reduzcan al menos un 5% el precio del arrendamiento respecto al índice de referencia en zonas tensionadas, junto con un gravamen adicional en el IBI para viviendas desocupadas de grandes corporaciones.",
            "whoIsAffected": [
                  "Pequeños propietarios particulares",
                  "Grandes fondos y socimis",
                  "Inquilinos de zonas tensionadas"
            ],
            "realWorldExample": "Un propietario particular que rebaje el alquiler de su inmueble en Barcelona de 850 € a 800 € mensuales disfrutará de una rebaja fiscal en su IRPF de hasta 1.400 € al año.",
            "argumentsPro": [
                  "Incentiva voluntariamente la bajada de rentas mediante estímulos fiscales en vez de sanciones",
                  "Moviliza vivienda vacía retenida por fondos"
            ],
            "argumentsContra": [
                  "Incertidumbre jurídica en la delimitación de zonas de mercado tensionado",
                  "Presión tributaria percibida como excesiva por los promotores inmobiliarios"
            ]
      }
],
    votesSummary: {"si":35,"no":34,"abstencion":0,"noVota":0,"total":69},
    groupVotes: [{"groupName":"G.P. Popular (PP)","totalSeats":27,"si":0,"no":27,"abstencion":0,"noVota":0,"color":"#0ea5e9"},{"groupName":"G.P. Socialista (PSOE)","totalSeats":25,"si":25,"no":0,"abstencion":0,"noVota":0,"color":"#ef4444"},{"groupName":"G.P. VOX","totalSeats":6,"si":0,"no":6,"abstencion":0,"noVota":0,"color":"#22c55e"},{"groupName":"G.P. Plurinacional Sumar","totalSeats":6,"si":6,"no":0,"abstencion":0,"noVota":0,"color":"#ec4899"},{"groupName":"G.P. Republicano (ERC)","totalSeats":1,"si":1,"no":0,"abstencion":0,"noVota":0,"color":"#f59e0b"},{"groupName":"G.P. Junts per Catalunya","totalSeats":1,"si":0,"no":1,"abstencion":0,"noVota":0,"color":"#06b6d4"},{"groupName":"G.P. Euskal Herria Bildu","totalSeats":1,"si":1,"no":0,"abstencion":0,"noVota":0,"color":"#84cc16"},{"groupName":"G.P. Vasco (EAJ-PNV)","totalSeats":1,"si":1,"no":0,"abstencion":0,"noVota":0,"color":"#10b981"},{"groupName":"G.P. Mixto (Podemos)","totalSeats":1,"si":1,"no":0,"abstencion":0,"noVota":0,"color":"#8b5cf6"}],
    bocgUrl: "https://www.boe.es/diario_boe/txt.php?id=BOE-A-2026-23755",
    expedienteNumber: "130/000012",
  },
  {
    id: "congreso-2026-11-12-2",
    title: "La Diputación Permanente tumba el decreto de prórroga forzosa de contratos de alquiler tras el 'no' del PNV",
    officialTitle: "Resolución de 12 de noviembre de 2026, de la Diputación Permanente del Congreso de los Diputados, por la que se ordena la publicación del Acuerdo de derogación del Real Decreto-ley 28/2026, de 6 de octubre, por el que se adoptan medidas urgentes para reforzar la estabilidad de los contratos de arrendamiento de vivienda habitual.",
    chamber: "congreso",
    date: "2026-11-12",
    time: "13:15 h",
    type: "real_decreto_ley",
    status: "rechazado",
    category: "Vivienda",
    summary: "La Diputación Permanente del Congreso deroga el Real Decreto-ley 28/2026 al no superar la convalidación preceptiva. La norma, impulsada para obligar a los propietarios a prorrogar anualmente los contratos de arrendamiento y a abonar indemnizaciones económicas a los inquilinos si no se renovaban, decayó tras sumar 35 votos en contra (PP, Vox, Junts y el desmarque determinante del PNV) frente a 34 a favor (PSOE, Sumar, ERC, Bildu y Mixto). Al quedar derogado, las medidas pierden toda vigencia legal con efectos inmediatos.",
    isOmnibus: true,
    threeKeys: {
      "what": "Derogación oficial del Real Decreto-ley 28/2026: decae la prórroga obligatoria forzosa de contratos de alquiler.",
      "pocket": "Los propietarios recuperan la facultad de no renovar contratos cumplidos los plazos legales sin tener que indemnizar al inquilino.",
      "clash": "El PNV vota 'no' junto a PP, VOX y Junts (35 votos), frenando el plan de Sumar y PSOE (34 votos) por invasión de competencias autonómicas y desincentivo al mercado."
},
    beforeVsAfter: {
      "before": "Durante el mes de vigencia transitoria, los arrendadores estaban compelidos a encadenar prórrogas forzosas o abonar compensaciones de rescisión.",
      "after": "Tras el acuerdo de derogación parlamentaria de 12 de noviembre, la norma queda formalmente expulsada del BOE y vuelve a regir la Ley de Arrendamientos Urbanos ordinaria."
},
    measures: [
      {
            "id": "congreso-2026-11-12-2-m1",
            "title": "Prórroga forzosa obligatoria al término del contrato de alquiler (DECAÍDA)",
            "category": "Regulación de Arrendamientos",
            "plainDescription": "Imponía la renovación forzosa del contrato de arrendamiento en periodos anuales sucesivos al término de los 5 o 7 años pactados, salvo que el propietario justificase documentalmente necesidad de uso habitacional familiar.",
            "whoIsAffected": [
                  "Arrendadores y propietarios particulares",
                  "Inquilinos con contratos a punto de finalizar"
            ],
            "realWorldExample": "Un propietario cuyo contrato de alquiler de 5 años vencía en diciembre ya no estará obligado por ley a mantener forzosamente al inquilino si decide no prorrogar el arriendo.",
            "argumentsPro": [
                  "Buscaba evitar desahucios silenciosos por subidas sobrevenidas de precios",
                  "Aportaba estabilidad a largo plazo en el barrio para las familias inquilinas"
            ],
            "argumentsContra": [
                  "El PNV, Junts y la oposición alegaron que petrificaba el mercado del alquiler y contraía la oferta disponible",
                  "Vulneraba la libre disposición del bien y las competencias autonómicas"
            ]
      },
      {
            "id": "congreso-2026-11-12-2-m2",
            "title": "Indemnización obligatoria al inquilino por no renovación contractual (DECAÍDA)",
            "category": "Protección Económica del Inquilino",
            "plainDescription": "Obligaba al arrendador a pagar una indemnización compensatoria de tres mensualidades de renta al inquilino en caso de no renovar el contrato de arrendamiento residencial concluido su plazo ordinario.",
            "whoIsAffected": [
                  "Pequeños propietarios",
                  "Arrendatarios de vivienda habitual"
            ],
            "realWorldExample": "Un propietario que rescinda el contrato al expirar el plazo acordado no tendrá que pagar entre 2.400 € y 3.600 € de compensación al inquilino saliente.",
            "argumentsPro": [
                  "Amortiguaba los gastos imprevistos de fianza y traslado forzoso del arrendatario",
                  "Desincentivaba la expulsión de buenos pagadores"
            ],
            "argumentsContra": [
                  "Considerada una penalización confiscatoria para propietarios particulares que cumplieron escrupulosamente los años del contrato",
                  "Incentivaba la retirada de viviendas del mercado del alquiler residencial tradicional"
            ]
      }
],
    votesSummary: {"si":34,"no":35,"abstencion":0,"noVota":0,"total":69},
    groupVotes: [{"groupName":"G.P. Popular (PP)","totalSeats":27,"si":0,"no":27,"abstencion":0,"noVota":0,"color":"#0ea5e9"},{"groupName":"G.P. Socialista (PSOE)","totalSeats":25,"si":25,"no":0,"abstencion":0,"noVota":0,"color":"#ef4444"},{"groupName":"G.P. VOX","totalSeats":6,"si":0,"no":6,"abstencion":0,"noVota":0,"color":"#22c55e"},{"groupName":"G.P. Plurinacional Sumar","totalSeats":6,"si":6,"no":0,"abstencion":0,"noVota":0,"color":"#ec4899"},{"groupName":"G.P. Republicano (ERC)","totalSeats":1,"si":1,"no":0,"abstencion":0,"noVota":0,"color":"#f59e0b"},{"groupName":"G.P. Junts per Catalunya","totalSeats":1,"si":0,"no":1,"abstencion":0,"noVota":0,"color":"#06b6d4"},{"groupName":"G.P. Euskal Herria Bildu","totalSeats":1,"si":1,"no":0,"abstencion":0,"noVota":0,"color":"#84cc16"},{"groupName":"G.P. Vasco (EAJ-PNV)","totalSeats":1,"si":0,"no":1,"abstencion":0,"noVota":0,"color":"#10b981"},{"groupName":"G.P. Mixto (Podemos)","totalSeats":1,"si":1,"no":0,"abstencion":0,"noVota":0,"color":"#8b5cf6"}],
    bocgUrl: "https://www.boe.es/diario_boe/txt.php?id=BOE-A-2026-23754",
    expedienteNumber: "130/000011",
  },
  {
    id: "boe-2026-11-11-1",
    title: "Ayuda inmediata tras las inundaciones",
    officialTitle: "Real Decreto-ley 33/2026, de 10 de noviembre, por el que se adoptan medidas urgentes en respuesta a los daos causados por las inundaciones y otros sucesos acaecidos entre los das 17 y 19 de octubre de 2026, como consecuencia de la Depresin Aislada en Niveles Altos (DANA), denominada Adam.",
    chamber: "congreso",
    date: "2026-11-11",
    time: "En vigor (Pendiente de convalidación parlamentaria)",
    type: "real_decreto_ley",
    status: "agendado",
    category: "Vivienda",
    summary: "Publicado en el BOE el 2026-11-11. Entra en vigor de forma provisional y el Congreso dispone de plazo constitucional hasta el 2026-12-11 para su convalidación o derogación. El Congreso aprueba un Real Decreto-ley para ayudar a los ciudadanos afectados por las inundaciones. Las ayudas permitirán a los propietarios y alquileres reparar sus hogares, mejorando su calidad de vida.",
    isOmnibus: true,
    threeKeys: {
      "what": "Se establecen ayudas urgentes para reparar daños en viviendas afectadas.",
      "pocket": "Los propietarios recibirán subvenciones para reparar sus hogares, aliviando el coste de los trabajos de reconstrucción.",
      "clash": "Inquilinos temen que las ayudas no sean suficientes, mientras que propietarios esperan que se garantice la reparación completa de sus viviendas."
},
    beforeVsAfter: {
      "before": "Antes, los afectados luchaban por reparar sus hogares con recursos limitados.",
      "after": "Ahora, recibirán apoyo económico para cubrir los costes de las reparaciones necesarias."
},
    measures: [
      {
            "id": "boe-2026-11-11-1-m1",
            "title": "Subvenciones para reparar viviendas dañadas",
            "category": "Reparación de daños",
            "plainDescription": "Se proporcionan subvenciones para cubrir los costes de la reparación de viviendas afectadas por las inundaciones.",
            "whoIsAffected": [
                  "Propietarios de viviendas dañadas",
                  "Inquilinos de viviendas dañadas"
            ],
            "realWorldExample": "Juan, un inquilino de 35 años, recibirá una subvención para reparar el techo dañado de su apartamento, lo que le permitirá vivir en mejores condiciones y evitar gastos adicionales.",
            "argumentsPro": [
                  "Necesidad de reparar viviendas para garantizar la seguridad de los ciudadanos",
                  "Ayuda a los inquilinos a recuperar su hogar rápidamente"
            ],
            "argumentsContra": [
                  "Inquietud sobre si las subvenciones serán suficientes para cubrir todos los costes",
                  "Posible desigualdad si no todos los afectados reciben la misma cantidad"
            ]
      }
],
    votesSummary: {"si":0,"no":0,"abstencion":0,"noVota":350,"total":350},
    groupVotes: [{"groupName":"G.P. Popular (PP)","totalSeats":137,"si":0,"no":0,"abstencion":0,"noVota":137,"color":"#0ea5e9"},{"groupName":"G.P. Socialista (PSOE)","totalSeats":121,"si":0,"no":0,"abstencion":0,"noVota":121,"color":"#ef4444"},{"groupName":"G.P. VOX","totalSeats":33,"si":0,"no":0,"abstencion":0,"noVota":33,"color":"#22c55e"},{"groupName":"G.P. Plurinacional Sumar","totalSeats":27,"si":0,"no":0,"abstencion":0,"noVota":27,"color":"#ec4899"},{"groupName":"G.P. Republicano (ERC)","totalSeats":7,"si":0,"no":0,"abstencion":0,"noVota":7,"color":"#f59e0b"},{"groupName":"G.P. Junts per Catalunya","totalSeats":7,"si":0,"no":0,"abstencion":0,"noVota":7,"color":"#06b6d4"},{"groupName":"G.P. Euskal Herria Bildu","totalSeats":6,"si":0,"no":0,"abstencion":0,"noVota":6,"color":"#84cc16"},{"groupName":"G.P. Vasco (EAJ-PNV)","totalSeats":5,"si":0,"no":0,"abstencion":0,"noVota":5,"color":"#10b981"},{"groupName":"G.P. Mixto (Podemos/BNG/CC/UPN)","totalSeats":7,"si":0,"no":0,"abstencion":0,"noVota":7,"color":"#8b5cf6"}],
    bocgUrl: "https://www.boe.es/diario_boe/txt.php?id=BOE-A-2026-23602",
    expedienteNumber: "BOE-A-2026-23602",
  },
  {
    id: "boe-2026-11-11-2",
    title: "Seguridad en trenes y proteccióndel personal ferroviario",
    officialTitle: "Real Decreto-ley 34/2026, de 10 de noviembre, de medidas urgentes para el refuerzo de la seguridad operacional en el transporte ferroviario y la proteccin social del personal ferroviario.",
    chamber: "congreso",
    date: "2026-11-11",
    time: "En vigor (Pendiente de convalidación parlamentaria)",
    type: "real_decreto_ley",
    status: "agendado",
    category: "Tráfico",
    summary: "Publicado en el BOE el 2026-11-11. Entra en vigor de forma provisional y el Congreso dispone de plazo constitucional hasta el 2026-12-11 para su convalidación o derogación. El Congreso aprueba un Real Decreto-ley para refuerzar la seguridad en el transporte ferroviario, mejorando las condiciones de trabajo de los ferroviarios. Esto supone un alivio para los trabajadores, que podrán trabajar con mayor tranquilidad, y un reto para las empresas, que deberán adaptarse a nuevas normativas.",
    isOmnibus: true,
    threeKeys: {
      "what": "Establece medidas urgentes para mejorar la seguridad y proteger a los trabajadores ferroviarios.",
      "pocket": "Los trabajadores ferroviarios recibirán mejoras salariales y condiciones laborales, aliviando sus preocupaciones.",
      "clash": "Los sindicatos defienden las mejoras salariales y laborales, mientras que algunos empresarios temen incrementos en costos operativos."
},
    beforeVsAfter: {
      "before": "Antes, los trabajadores ferroviarios enfrentaban riesgos y condiciones laborales inciertas.",
      "after": "Ahora, la nueva regulación garantiza mejoras en seguridad y condiciones laborales, protegiendo a los trabajadores."
},
    measures: [
      {
            "id": "boe-2026-11-11-2-m1",
            "title": "Mejoras en la seguridad y condiciones laborales",
            "category": "Seguridad y Salud",
            "plainDescription": "Se implementan nuevas medidas para proteger a los trabajadores ferroviarios y mejorar sus condiciones de trabajo.",
            "whoIsAffected": [
                  "Trabajadores ferroviarios",
                  "Empresas de transporte ferroviario"
            ],
            "realWorldExample": "Juan, un conductor de tren, podrá contar con un equipo de seguridad más avanzado y un horario laboral más equilibrado, lo que le permitirá cuidar mejor a su familia. Sin embargo, la empresa donde trabaja Juan deberá invertir en nuevos equipos y ajustar sus horarios, lo que podría afectar a su margen de beneficios.",
            "argumentsPro": [
                  "Mejora de la calidad de vida y seguridad de los trabajadores",
                  "Reducción de accidentes laborales"
            ],
            "argumentsContra": [
                  "Incremento en costos operativos para las empresas",
                  "Necesidad de ajustar horarios y presupuestos"
            ]
      }
],
    votesSummary: {"si":0,"no":0,"abstencion":0,"noVota":350,"total":350},
    groupVotes: [{"groupName":"G.P. Popular (PP)","totalSeats":137,"si":0,"no":0,"abstencion":0,"noVota":137,"color":"#0ea5e9"},{"groupName":"G.P. Socialista (PSOE)","totalSeats":121,"si":0,"no":0,"abstencion":0,"noVota":121,"color":"#ef4444"},{"groupName":"G.P. VOX","totalSeats":33,"si":0,"no":0,"abstencion":0,"noVota":33,"color":"#22c55e"},{"groupName":"G.P. Plurinacional Sumar","totalSeats":27,"si":0,"no":0,"abstencion":0,"noVota":27,"color":"#ec4899"},{"groupName":"G.P. Republicano (ERC)","totalSeats":7,"si":0,"no":0,"abstencion":0,"noVota":7,"color":"#f59e0b"},{"groupName":"G.P. Junts per Catalunya","totalSeats":7,"si":0,"no":0,"abstencion":0,"noVota":7,"color":"#06b6d4"},{"groupName":"G.P. Euskal Herria Bildu","totalSeats":6,"si":0,"no":0,"abstencion":0,"noVota":6,"color":"#84cc16"},{"groupName":"G.P. Vasco (EAJ-PNV)","totalSeats":5,"si":0,"no":0,"abstencion":0,"noVota":5,"color":"#10b981"},{"groupName":"G.P. Mixto (Podemos/BNG/CC/UPN)","totalSeats":7,"si":0,"no":0,"abstencion":0,"noVota":7,"color":"#8b5cf6"}],
    bocgUrl: "https://www.boe.es/diario_boe/txt.php?id=BOE-A-2026-23603",
    expedienteNumber: "BOE-A-2026-23603",
  },
  {
    id: "boe-2026-11-11-3",
    title: "Medidas urgentes para familias monoparentales",
    officialTitle: "Real Decreto-ley 35/2026, de 10 de noviembre, de medidas urgentes para el reconocimiento y proteccin a las familias monoparentales y otras medidas de apoyo a familias.",
    chamber: "congreso",
    date: "2026-11-11",
    time: "En vigor (Pendiente de convalidación parlamentaria)",
    type: "real_decreto_ley",
    status: "agendado",
    category: "Vivienda",
    summary: "Publicado en el BOE el 2026-11-11. Entra en vigor de forma provisional y el Congreso dispone de plazo constitucional hasta el 2026-12-11 para su convalidación o derogación. El Congreso aprueba medidas urgentes para reconocer y proteger a las familias monoparentales, mejorando sus condiciones de vida y aliviando sus cargas económicas.",
    isOmnibus: true,
    threeKeys: {
      "what": "Establece ayudas económicas y medidas de reconocimiento para familias monoparentales.",
      "pocket": "Familias beneficiarias recibirán bonificaciones de hasta 300 euros mensuales, alivio significativo para el presupuesto.",
      "clash": "Defensores de la medida argumentan que es necesario apoyar a las familias monoparentales, mientras que opositores temen que podría generar un gasto excesivo."
},
    beforeVsAfter: {
      "before": "Antes, muchas familias monoparentales luchaban con dificultades económicas y falta de reconocimiento.",
      "after": "Ahora, estas familias recibirán apoyo económico y reconocimiento social, mejorando su calidad de vida."
},
    measures: [
      {
            "id": "boe-2026-11-11-3-m1",
            "title": "Ayuda económica para familias monoparentales",
            "category": "Subvenciones",
            "plainDescription": "Familias monoparentales recibirán bonificaciones de hasta 300 euros mensuales para ayudarles a cubrir gastos básicos.",
            "whoIsAffected": [
                  "Madres y padres solteros",
                  "Cuidadores principales"
            ],
            "realWorldExample": "Juan, un padre soltero con dos hijos, recibirá 300 euros mensuales para ayudar a cubrir los gastos de la casa y alimentación, alivio significativo para su presupuesto ajustado.",
            "argumentsPro": [
                  "Necesidad de apoyo económico para familias monoparentales",
                  "Fomento de la estabilidad familiar"
            ],
            "argumentsContra": [
                  "Posible gasto excesivo para el Estado",
                  "Riesgo de crear dependencia económica"
            ]
      }
],
    votesSummary: {"si":0,"no":0,"abstencion":0,"noVota":350,"total":350},
    groupVotes: [{"groupName":"G.P. Popular (PP)","totalSeats":137,"si":0,"no":0,"abstencion":0,"noVota":137,"color":"#0ea5e9"},{"groupName":"G.P. Socialista (PSOE)","totalSeats":121,"si":0,"no":0,"abstencion":0,"noVota":121,"color":"#ef4444"},{"groupName":"G.P. VOX","totalSeats":33,"si":0,"no":0,"abstencion":0,"noVota":33,"color":"#22c55e"},{"groupName":"G.P. Plurinacional Sumar","totalSeats":27,"si":0,"no":0,"abstencion":0,"noVota":27,"color":"#ec4899"},{"groupName":"G.P. Republicano (ERC)","totalSeats":7,"si":0,"no":0,"abstencion":0,"noVota":7,"color":"#f59e0b"},{"groupName":"G.P. Junts per Catalunya","totalSeats":7,"si":0,"no":0,"abstencion":0,"noVota":7,"color":"#06b6d4"},{"groupName":"G.P. Euskal Herria Bildu","totalSeats":6,"si":0,"no":0,"abstencion":0,"noVota":6,"color":"#84cc16"},{"groupName":"G.P. Vasco (EAJ-PNV)","totalSeats":5,"si":0,"no":0,"abstencion":0,"noVota":5,"color":"#10b981"},{"groupName":"G.P. Mixto (Podemos/BNG/CC/UPN)","totalSeats":7,"si":0,"no":0,"abstencion":0,"noVota":7,"color":"#8b5cf6"}],
    bocgUrl: "https://www.boe.es/diario_boe/txt.php?id=BOE-A-2026-23604",
    expedienteNumber: "BOE-A-2026-23604",
  },
  {
    id: "boe-2026-11-11-4",
    title: "Nueva ley para la autonomía y dependencia: un paso hacia la seguridad",
    officialTitle: "Real Decreto-ley 36/2026, de 10 de noviembre, de medidas para el adecuado despliegue de la reforma del Sistema para la Autonoma y Atencin a la Dependencia.",
    chamber: "congreso",
    date: "2026-11-11",
    time: "En vigor (Pendiente de convalidación parlamentaria)",
    type: "real_decreto_ley",
    status: "agendado",
    category: "Cuidados",
    summary: "Publicado en el BOE el 2026-11-11. Entra en vigor de forma provisional y el Congreso dispone de plazo constitucional hasta el 2026-12-11 para su convalidación o derogación. El Congreso aprueba un real decreto-ley para mejorar la atención a personas dependientes y autónomos, con el objetivo de aliviar la carga financiera de las familias y proteger a los trabajadores independientes.",
    isOmnibus: true,
    threeKeys: {
      "what": "Establece medidas para mejorar la atención a personas dependientes y autónomos.",
      "pocket": "Reducción de costes para familias con miembros dependientes y apoyo a autónomos.",
      "clash": "Defensores ven oportunidades de mejora en la calidad de vida, mientras que críticos temen un aumento de la carga fiscal."
},
    beforeVsAfter: {
      "before": "Antes, muchas familias luchaban por cubrir los costes de la atención a personas dependientes.",
      "after": "Ahora, se implementan ayudas y subvenciones para hacer frente a estos gastos."
},
    measures: [
      {
            "id": "boe-2026-11-11-4-m1",
            "title": "Subvenciones para cuidadores",
            "category": "Atención a dependientes",
            "plainDescription": "Se establecen ayudas económicas para familias que cuidan a personas dependientes en sus hogares.",
            "whoIsAffected": [
                  "Familias con miembros dependientes",
                  "Cuidadores de personas mayores"
            ],
            "realWorldExample": "María, una madre de 45 años, cuida a su padre de 80 años en casa. Con la nueva subvención, recibirá 300 euros mensuales para ayudar con los gastos de mantenimiento y atención.",
            "argumentsPro": [
                  "Ayuda a reducir la carga financiera de las familias",
                  "Mejora la calidad de vida de los cuidadores"
            ],
            "argumentsContra": [
                  "Puede aumentar la carga fiscal",
                  "Posible subvención a quienes no la necesitan"
            ]
      }
],
    votesSummary: {"si":0,"no":0,"abstencion":0,"noVota":350,"total":350},
    groupVotes: [{"groupName":"G.P. Popular (PP)","totalSeats":137,"si":0,"no":0,"abstencion":0,"noVota":137,"color":"#0ea5e9"},{"groupName":"G.P. Socialista (PSOE)","totalSeats":121,"si":0,"no":0,"abstencion":0,"noVota":121,"color":"#ef4444"},{"groupName":"G.P. VOX","totalSeats":33,"si":0,"no":0,"abstencion":0,"noVota":33,"color":"#22c55e"},{"groupName":"G.P. Plurinacional Sumar","totalSeats":27,"si":0,"no":0,"abstencion":0,"noVota":27,"color":"#ec4899"},{"groupName":"G.P. Republicano (ERC)","totalSeats":7,"si":0,"no":0,"abstencion":0,"noVota":7,"color":"#f59e0b"},{"groupName":"G.P. Junts per Catalunya","totalSeats":7,"si":0,"no":0,"abstencion":0,"noVota":7,"color":"#06b6d4"},{"groupName":"G.P. Euskal Herria Bildu","totalSeats":6,"si":0,"no":0,"abstencion":0,"noVota":6,"color":"#84cc16"},{"groupName":"G.P. Vasco (EAJ-PNV)","totalSeats":5,"si":0,"no":0,"abstencion":0,"noVota":5,"color":"#10b981"},{"groupName":"G.P. Mixto (Podemos/BNG/CC/UPN)","totalSeats":7,"si":0,"no":0,"abstencion":0,"noVota":7,"color":"#8b5cf6"}],
    bocgUrl: "https://www.boe.es/diario_boe/txt.php?id=BOE-A-2026-23605",
    expedienteNumber: "BOE-A-2026-23605",
  },
  {
    id: "boe-2026-11-04-1",
    title: "Ayudas para víctimas y accesibilidad en emergencias",
    officialTitle: "Real Decreto-ley 32/2026, de 3 de noviembre, de ayudas a las vctimas del accidente ferroviario de Urda (Toledo) y por el que se garantiza la accesibilidad equitativa a bienes y servicios en situaciones de emergencia.",
    chamber: "congreso",
    date: "2026-11-04",
    time: "En vigor (Pendiente de convalidación parlamentaria)",
    type: "real_decreto_ley",
    status: "agendado",
    category: "Justicia",
    summary: "Publicado en el BOE el 2026-11-04. Entra en vigor de forma provisional y el Congreso dispone de plazo constitucional hasta el 2026-12-04 para su convalidación o derogación. El Congreso aprueba un Real Decreto-ley para ayudar a las víctimas del accidente ferroviario de Urda y asegurar la accesibilidad en emergencias, mejorando la calidad de vida de las familias afectadas.",
    isOmnibus: true,
    threeKeys: {
      "what": "Ayudas a víctimas del accidente ferroviario y garantía de accesibilidad en emergencias.",
      "pocket": "Ayudas económicas y servicios gratuitos para familias afectadas, reduciendo el estrés y costos.",
      "clash": "Defensores de las ayudas argumentan la necesidad de apoyo inmediato, mientras que críticos temen un gasto excesivo."
},
    beforeVsAfter: {
      "before": "Antes, familias afectadas por el accidente sufrían en silencio, con costos y estrés innecesarios.",
      "after": "Ahora, se garantiza apoyo inmediato y servicios gratuitos, mejorando la calidad de vida de las víctimas."
},
    measures: [
      {
            "id": "boe-2026-11-04-1-m1",
            "title": "Ayudas económicas y servicios gratuitos",
            "category": "Acceso a servicios",
            "plainDescription": "Se establecen ayudas económicas y servicios gratuitos para las familias afectadas por el accidente ferroviario de Urda.",
            "whoIsAffected": [
                  "Familias de víctimas del accidente ferroviario de Urda"
            ],
            "realWorldExample": "María, una madre de tres hijos, recibió una ayuda económica de 5.000 euros para cubrir gastos de alimentación y alquiler, lo que le permitió aliviar la presión financiera y centrarse en la recuperación de su familia.",
            "argumentsPro": [
                  "Ayudas inmediatas para aliviar el estrés financiero",
                  "Servicios gratuitos para facilitar la recuperación"
            ],
            "argumentsContra": [
                  "Posible gasto excesivo para el erario público",
                  "Necesidad de evaluar la eficacia de las ayudas antes de su implementación"
            ]
      }
],
    votesSummary: {"si":0,"no":0,"abstencion":0,"noVota":350,"total":350},
    groupVotes: [{"groupName":"G.P. Popular (PP)","totalSeats":137,"si":0,"no":0,"abstencion":0,"noVota":137,"color":"#0ea5e9"},{"groupName":"G.P. Socialista (PSOE)","totalSeats":121,"si":0,"no":0,"abstencion":0,"noVota":121,"color":"#ef4444"},{"groupName":"G.P. VOX","totalSeats":33,"si":0,"no":0,"abstencion":0,"noVota":33,"color":"#22c55e"},{"groupName":"G.P. Plurinacional Sumar","totalSeats":27,"si":0,"no":0,"abstencion":0,"noVota":27,"color":"#ec4899"},{"groupName":"G.P. Republicano (ERC)","totalSeats":7,"si":0,"no":0,"abstencion":0,"noVota":7,"color":"#f59e0b"},{"groupName":"G.P. Junts per Catalunya","totalSeats":7,"si":0,"no":0,"abstencion":0,"noVota":7,"color":"#06b6d4"},{"groupName":"G.P. Euskal Herria Bildu","totalSeats":6,"si":0,"no":0,"abstencion":0,"noVota":6,"color":"#84cc16"},{"groupName":"G.P. Vasco (EAJ-PNV)","totalSeats":5,"si":0,"no":0,"abstencion":0,"noVota":5,"color":"#10b981"},{"groupName":"G.P. Mixto (Podemos/BNG/CC/UPN)","totalSeats":7,"si":0,"no":0,"abstencion":0,"noVota":7,"color":"#8b5cf6"}],
    bocgUrl: "https://www.boe.es/diario_boe/txt.php?id=BOE-A-2026-23104",
    expedienteNumber: "BOE-A-2026-23104",
  },
  {
    id: "europarl-2026-10-08-1",
    title: "Nuevas reglas para vuelos: Protección frente a cargos abusivos",
    officialTitle: "Reglamento sobre normas comunes para la protección de consumidores frente a cargos abusivos por equipaje de mano y asignación de asientos en aerolíneas de la UE.",
    chamber: "europarl",
    date: "2026-10-08",
    time: "12:15 h (Estrasburgo)",
    type: "proyecto_ley",
    status: "aprobado",
    category: "Transporte",
    summary: "El Congreso aprueba medidas para proteger a los consumidores en el transporte aéreo, garantizando un viaje más tranquilo y sin sorpresas económicas.",
    isOmnibus: false,
    threeKeys: {
      "what": "Establece límites a cargos por equipaje de mano y asignación de asientos.",
      "pocket": "Evita sobrecostos innecesarios, protegiendo el bolsillo de los viajeros.",
      "clash": "Pasajeros y aerolíneas buscan equilibrar costos y servicios ofrecidos."
},
    beforeVsAfter: {
      "before": "Antes, pasajeros podían enfrentarse a cargos imprevistos por equipaje de mano.",
      "after": "Ahora, los viajeros tendrán mayor seguridad al viajar, sin sorpresas financieras."
},
    measures: [
      {
            "id": "europarl-2026-10-08-1-m1",
            "title": "Límites a cargos por equipaje de mano",
            "category": "Consumidores",
            "plainDescription": "Establece un límite a los cargos por equipaje de mano, asegurando que no se cobren más de lo permitido.",
            "whoIsAffected": [
                  "Pasajeros",
                  "Consumidores de servicios aéreos"
            ],
            "realWorldExample": "María, una trabajadora autónoma, viaja a una reunión importante. Antes, podía enfrentarse a un cargo inesperado por su maletín de trabajo. Ahora, con la nueva regulación, María sabe que no pagará más de 10 euros por su equipaje de mano.",
            "argumentsPro": [
                  "Protección del consumidor",
                  "Transparencia en los costos"
            ],
            "argumentsContra": [
                  "Costos para las aerolíneas",
                  "Flexibilidad en la política de equipaje"
            ]
      }
],
    votesSummary: {"si":56,"no":2,"abstencion":3,"noVota":0,"total":61},
    groupVotes: [{"groupName":"G.P. Popular Europeo (PP)","totalSeats":22,"si":22,"no":0,"abstencion":0,"noVota":0,"color":"#0ea5e9"},{"groupName":"G.P. Socialistas y Demócratas (PSOE)","totalSeats":20,"si":20,"no":0,"abstencion":0,"noVota":0,"color":"#ef4444"},{"groupName":"Patriotas por Europa (VOX)","totalSeats":6,"si":6,"no":0,"abstencion":0,"noVota":0,"color":"#22c55e"},{"groupName":"La Izquierda Europea (Podemos / Sumar)","totalSeats":5,"si":5,"no":0,"abstencion":0,"noVota":0,"color":"#ec4899"},{"groupName":"Los Verdes / Alianza Libre Europea (ERC / BNG)","totalSeats":3,"si":3,"no":0,"abstencion":0,"noVota":0,"color":"#84cc16"},{"groupName":"Renew Europe (EAJ-PNV / CC)","totalSeats":1,"si":0,"no":1,"abstencion":0,"noVota":0,"color":"#f59e0b"},{"groupName":"No Inscritos / Otros (SALF / Junts)","totalSeats":4,"si":0,"no":1,"abstencion":3,"noVota":0,"color":"#8b5cf6"}],
    bocgUrl: "https://data.europarl.europa.eu/api/v1/plenary-votes",
    expedienteNumber: "2024/0215(COD)",
  },
  {
    id: "congreso-2026-10-02-1",
    title: "Nuevas medidas para vivienda asequible",
    officialTitle: "Real Decreto-ley 26/2026, de 29 de septiembre, por el que se adoptan medidas urgentes para la protección de la función social de la vivienda y la ampliación de la oferta de vivienda asequible. (Pública por llamamiento)",
    chamber: "congreso",
    date: "2026-10-02",
    time: "18:00 h",
    type: "real_decreto_ley",
    status: "rechazado",
    category: "Vivienda",
    summary: "El Real Decreto-ley 26/2026 introduce medidas urgentes para proteger la vivienda social y aumentar la oferta asequible, beneficiando a los inquilinos y obligando a los promotores a adaptarse a nuevas regulaciones.",
    isOmnibus: true,
    threeKeys: {
      "what": "Establece medidas urgentes para proteger la vivienda social y aumentar la oferta asequible.",
      "pocket": "Los inquilinos beneficiarán de precios más bajos y contratos más seguros; los promotores tendrán plazos para adaptarse.",
      "clash": "Los partidos de izquierda apoyan las medidas, mientras que los de derecha critican que sean urgentes."
},
    beforeVsAfter: {
      "before": "Antes, la oferta de vivienda asequible era limitada y los contratos de alquiler eran menos seguros.",
      "after": "Ahora, se espera una mayor oferta de viviendas asequibles y contratos más estables para los inquilinos."
},
    measures: [
      {
            "id": "congreso-2026-10-02-1-m1",
            "title": "Subvenciones para promotores",
            "category": "Financiación",
            "plainDescription": "Ofrece subvenciones a los promotores para construir viviendas asequibles.",
            "whoIsAffected": [
                  "Promotores inmobiliarios"
            ],
            "realWorldExample": "Un promotor recibirá 100.000 euros para construir 10 viviendas asequibles en un plazo de 18 meses.",
            "argumentsPro": [
                  "Ayuda a financiar proyectos de vivienda social",
                  "Incentiva la construcción de viviendas asequibles"
            ],
            "argumentsContra": [
                  "Subvenciones podrían ser costosas para el Estado",
                  "Puede distorsionar el mercado inmobiliario"
            ]
      }
],
    votesSummary: {"si":172,"no":178,"abstencion":0,"noVota":0,"total":350},
    groupVotes: [{"groupName":"G.P. Popular (PP)","totalSeats":137,"si":137,"no":0,"abstencion":0,"noVota":0,"color":"#0ea5e9"},{"groupName":"G.P. Socialista (PSOE)","totalSeats":121,"si":35,"no":86,"abstencion":0,"noVota":0,"color":"#ef4444"},{"groupName":"G.P. VOX","totalSeats":33,"si":0,"no":33,"abstencion":0,"noVota":0,"color":"#22c55e"},{"groupName":"G.P. Plurinacional Sumar","totalSeats":27,"si":0,"no":27,"abstencion":0,"noVota":0,"color":"#ec4899"},{"groupName":"G.P. Republicano (ERC)","totalSeats":7,"si":0,"no":7,"abstencion":0,"noVota":0,"color":"#f59e0b"},{"groupName":"G.P. Junts per Catalunya","totalSeats":7,"si":0,"no":7,"abstencion":0,"noVota":0,"color":"#06b6d4"},{"groupName":"G.P. Euskal Herria Bildu","totalSeats":6,"si":0,"no":6,"abstencion":0,"noVota":0,"color":"#84cc16"},{"groupName":"G.P. Vasco (EAJ-PNV)","totalSeats":5,"si":0,"no":5,"abstencion":0,"noVota":0,"color":"#10b981"},{"groupName":"G.P. Mixto (Podemos/BNG/CC/UPN)","totalSeats":7,"si":0,"no":7,"abstencion":0,"noVota":0,"color":"#8b5cf6"}],
    bocgUrl: "https://www.congreso.es/public_oficiales/L15/CONG/DS/PL/DSCD-15-PL-210.PDF#page=56",
    expedienteNumber: "130/000055",
  },
  {
    id: "congreso-2026-10-02-2",
    title: "Nuevas medidas para estabilidad en alquileres",
    officialTitle: "Real Decreto-ley 27/2026, de 29 de septiembre, por el que se adoptan medidas urgentes para reforzar la estabilidad de los contratos de arrendamiento de vivienda habitual. (Pública por llamamiento)",
    chamber: "congreso",
    date: "2026-10-02",
    time: "18:45 h",
    type: "real_decreto_ley",
    status: "rechazado",
    category: "Vivienda",
    summary: "Se aprueba un real decreto-ley para limitar las subidas de alquileres a un 0,75% más que el IPC, protegiendo a los inquilinos. Esto afecta a los propietarios y alquileres de vivienda habitual.",
    isOmnibus: false,
    threeKeys: {
      "what": "Se establecen medidas para proteger a los arrendatarios de subidas abusivas.",
      "pocket": "Los inquilinos podrán evitar subidas anuales superiores al IPC más 0,75%.",
      "clash": "Los promotores argumentan que limita la rentabilidad, mientras que los defensores afirman que mejora la estabilidad."
},
    beforeVsAfter: {
      "before": "Antes, los alquileres podían subir anualmente según el índice de precios al consumo (IPC).",
      "after": "Ahora, las subidas no pueden superar el IPC más 0,75% anualmente."
},
    measures: [
      {
            "id": "congreso-2026-10-02-2-m1",
            "title": "Limitación de subidas de alquiler",
            "category": "Contratos de alquiler",
            "plainDescription": "Las subidas de alquiler no podrán superar el IPC más 0,75% anualmente.",
            "whoIsAffected": [
                  "Inquilinos",
                  "Propietarios"
            ],
            "realWorldExample": "Un inquilino que paga 600 euros al mes verá que las subidas no superarán 645 euros anualmente, en lugar de 636 euros según el IPC.",
            "argumentsPro": [
                  "Se protege a los inquilinos de subidas abusivas",
                  "Se mejora la estabilidad en el alquiler"
            ],
            "argumentsContra": [
                  "Limita la rentabilidad para los propietarios",
                  "Puede disuadir de la inversión en vivienda"
            ]
      }
],
    votesSummary: {"si":166,"no":184,"abstencion":0,"noVota":0,"total":350},
    groupVotes: [{"groupName":"G.P. Popular (PP)","totalSeats":137,"si":137,"no":0,"abstencion":0,"noVota":0,"color":"#0ea5e9"},{"groupName":"G.P. Socialista (PSOE)","totalSeats":121,"si":29,"no":92,"abstencion":0,"noVota":0,"color":"#ef4444"},{"groupName":"G.P. VOX","totalSeats":33,"si":0,"no":33,"abstencion":0,"noVota":0,"color":"#22c55e"},{"groupName":"G.P. Plurinacional Sumar","totalSeats":27,"si":0,"no":27,"abstencion":0,"noVota":0,"color":"#ec4899"},{"groupName":"G.P. Republicano (ERC)","totalSeats":7,"si":0,"no":7,"abstencion":0,"noVota":0,"color":"#f59e0b"},{"groupName":"G.P. Junts per Catalunya","totalSeats":7,"si":0,"no":7,"abstencion":0,"noVota":0,"color":"#06b6d4"},{"groupName":"G.P. Euskal Herria Bildu","totalSeats":6,"si":0,"no":6,"abstencion":0,"noVota":0,"color":"#84cc16"},{"groupName":"G.P. Vasco (EAJ-PNV)","totalSeats":5,"si":0,"no":5,"abstencion":0,"noVota":0,"color":"#10b981"},{"groupName":"G.P. Mixto (Podemos/BNG/CC/UPN)","totalSeats":7,"si":0,"no":7,"abstencion":0,"noVota":0,"color":"#8b5cf6"}],
    bocgUrl: "https://www.congreso.es/public_oficiales/L15/CONG/DS/PL/DSCD-15-PL-210.PDF#page=63",
    expedienteNumber: "130/000056",
  },
  {
    id: "congreso-2026-09-30-1",
    title: "Votación sobre ley contra violencia vicaria",
    officialTitle: "Votación de la enmienda a la totalidad de devolución al Proyecto de Ley Orgánica de medidas integrales en materia de violencia vicaria y protección reforzada de menores frente a la violencia machista.",
    chamber: "congreso",
    date: "2026-09-30",
    time: "19:15 h",
    type: "enmienda_totalidad",
    status: "rechazado",
    category: "Justicia",
    summary: "Se vota una ley que introduce medidas para proteger a menores de la violencia machista, con el objetivo de reforzar su protección en casos de violencia familiar.",
    isOmnibus: false,
    threeKeys: {
      "what": "Establece medidas para proteger a menores de violencia machista.",
      "pocket": "No afecta directamente a los ciudadanos, pero puede influir en la atención a casos de violencia familiar.",
      "clash": "Partido de gobierno defiende medidas más duras, oposición pide más recursos."
},
    beforeVsAfter: {
      "before": "No existen medidas específicas para proteger a menores en casos de violencia machista.",
      "after": "Se implementan medidas integrales para proteger a menores afectados por la violencia machista."
},
    measures: [
      {
            "id": "congreso-2026-09-30-1-m1",
            "title": "Medidas integrales para menores",
            "category": "Violencia vicaria",
            "plainDescription": "Establece un plan de protección reforzado para menores en situaciones de violencia machista.",
            "whoIsAffected": [
                  "Menores",
                  "Familiares de menores"
            ],
            "realWorldExample": "Un menor de 12 años que vive en un hogar con violencia machista recibirá atención psicológica y asesoramiento legal.",
            "argumentsPro": [
                  "Mejora la seguridad de los menores",
                  "Prevención de la violencia de género a largo plazo"
            ],
            "argumentsContra": [
                  "Costo elevado para el sistema",
                  "Posible sobreprotección de los menores"
            ]
      }
],
    votesSummary: {"si":34,"no":312,"abstencion":0,"noVota":4,"total":350},
    groupVotes: [{"groupName":"G.P. Popular (PP)","totalSeats":137,"si":34,"no":103,"abstencion":0,"noVota":0,"color":"#0ea5e9"},{"groupName":"G.P. Socialista (PSOE)","totalSeats":121,"si":0,"no":121,"abstencion":0,"noVota":0,"color":"#ef4444"},{"groupName":"G.P. VOX","totalSeats":33,"si":0,"no":33,"abstencion":0,"noVota":0,"color":"#22c55e"},{"groupName":"G.P. Plurinacional Sumar","totalSeats":27,"si":0,"no":27,"abstencion":0,"noVota":0,"color":"#ec4899"},{"groupName":"G.P. Republicano (ERC)","totalSeats":7,"si":0,"no":7,"abstencion":0,"noVota":0,"color":"#f59e0b"},{"groupName":"G.P. Junts per Catalunya","totalSeats":7,"si":0,"no":7,"abstencion":0,"noVota":0,"color":"#06b6d4"},{"groupName":"G.P. Euskal Herria Bildu","totalSeats":6,"si":0,"no":6,"abstencion":0,"noVota":0,"color":"#84cc16"},{"groupName":"G.P. Vasco (EAJ-PNV)","totalSeats":5,"si":0,"no":5,"abstencion":0,"noVota":0,"color":"#10b981"},{"groupName":"G.P. Mixto (Podemos/BNG/CC/UPN)","totalSeats":7,"si":0,"no":3,"abstencion":0,"noVota":4,"color":"#8b5cf6"}],
    bocgUrl: "https://www.congreso.es/datos-abiertos",
    expedienteNumber: "121/000034",
  },
  {
    id: "congreso-2026-09-29-1",
    title: "Nuevas normas para patinetes eléctricos",
    officialTitle: "Proposición de Ley por la que se modifica el Real Decreto Legislativo 6/2015, de 30 de octubre, de la Ley sobre Tráfico, Circulación de Vehículos a Motor y Seguridad Vial, relativa al uso de patinetes eléctricos y vehículos de movilidad personal.",
    chamber: "congreso",
    date: "2026-09-29",
    time: "17:40 h",
    type: "proposicion_ley",
    status: "aprobado",
    category: "Tráfico",
    summary: "Se aprueba una ley que regula el uso de patinetes eléctricos, incluyendo la obligación de pagar una tasa anual. Esto afecta a los usuarios de estos vehículos, quienes deberán cumplir con nuevas normas para su circulación segura.",
    isOmnibus: false,
    threeKeys: {
      "what": "Se establecen reglas para el uso de patinetes eléctricos en vías públicas.",
      "pocket": "Los usuarios deberán pagar una tasa anual de 20 euros.",
      "clash": "Los partidarios ven la medida como necesaria para la seguridad, mientras que los contrarios argumentan que limita la libertad de movilidad."
},
    beforeVsAfter: {
      "before": "Antes, no existían regulaciones específicas para patinetes eléctricos.",
      "after": "Ahora, se deben respetar zonas de circulación y pagar una tasa."
},
    measures: [
      {
            "id": "congreso-2026-09-29-1-m1",
            "title": "Tasa anual para patinetes eléctricos",
            "category": "Costos",
            "plainDescription": "Los usuarios deberán pagar una tasa anual de 20 euros por el uso de patinetes eléctricos en vías públicas.",
            "whoIsAffected": [
                  "Usuarios de patinetes eléctricos"
            ],
            "realWorldExample": "Un usuario de patinete eléctrico pagará 20 euros al año para poder circular por las vías públicas.",
            "argumentsPro": [
                  "Fomenta la seguridad vial",
                  "Genera ingresos para la administración"
            ],
            "argumentsContra": [
                  "Limita la libertad de movilidad",
                  "Puede ser un coste adicional para los usuarios"
            ]
      }
],
    votesSummary: {"si":173,"no":168,"abstencion":5,"noVota":4,"total":350},
    groupVotes: [{"groupName":"G.P. Popular (PP)","totalSeats":137,"si":137,"no":0,"abstencion":0,"noVota":0,"color":"#0ea5e9"},{"groupName":"G.P. Socialista (PSOE)","totalSeats":121,"si":36,"no":85,"abstencion":0,"noVota":0,"color":"#ef4444"},{"groupName":"G.P. VOX","totalSeats":33,"si":0,"no":33,"abstencion":0,"noVota":0,"color":"#22c55e"},{"groupName":"G.P. Plurinacional Sumar","totalSeats":27,"si":0,"no":27,"abstencion":0,"noVota":0,"color":"#ec4899"},{"groupName":"G.P. Republicano (ERC)","totalSeats":7,"si":0,"no":7,"abstencion":0,"noVota":0,"color":"#f59e0b"},{"groupName":"G.P. Junts per Catalunya","totalSeats":7,"si":0,"no":7,"abstencion":0,"noVota":0,"color":"#06b6d4"},{"groupName":"G.P. Euskal Herria Bildu","totalSeats":6,"si":0,"no":6,"abstencion":0,"noVota":0,"color":"#84cc16"},{"groupName":"G.P. Vasco (EAJ-PNV)","totalSeats":5,"si":0,"no":3,"abstencion":2,"noVota":0,"color":"#10b981"},{"groupName":"G.P. Mixto (Podemos/BNG/CC/UPN)","totalSeats":7,"si":0,"no":0,"abstencion":3,"noVota":4,"color":"#8b5cf6"}],
    bocgUrl: "https://www.congreso.es/datos-abiertos",
    expedienteNumber: "122/000067",
  },
  {
    id: "congreso-2026-09-23-1",
    title: "Votación sobre la Variante Sur Ferroviaria: Impacto en la Comunidad",
    officialTitle: "Proposición no de Ley del Grupo Parlamentario Vasco (EAJ-PNV), sobre la Variante sur Ferroviaria, mercancías por la Y vasca y medidas mitigadoras a nivel municipal.\nSe vota en los términos de la enmienda transaccional presentada por el Grupo Parlamentario Socialista y el Grupo Parlamentario Vasco (EAJ-PNV).",
    chamber: "congreso",
    date: "2026-09-23",
    time: "18:00 h",
    type: "mocion",
    status: "aprobado",
    category: "Transporte",
    summary: "El Congreso vota por la Variante Sur Ferroviaria, que busca mejorar la logística de transporte de mercancías. Esto podría beneficiar a empresas y consumidores, pero también plantea preocupaciones ambientales.",
    isOmnibus: false,
    threeKeys: {
      "what": "Se aprueba la Variante Sur Ferroviaria para facilitar el transporte de mercancías.",
      "pocket": "Los costes de envío de mercancías podrían disminuir, beneficiando a empresas y consumidores.",
      "clash": "Empresarios apoyan la medida para mejorar la logística, mientras que algunos vecinos temen el impacto ambiental."
},
    beforeVsAfter: {
      "before": "Antes, el transporte de mercancías por la vía existente era lento y costoso.",
      "after": "Con la nueva vía, los tiempos de transporte se reducirán y los costos podrían bajar."
},
    measures: [
      {
            "id": "congreso-2026-09-23-1-m1",
            "title": "Mejora de la Logística Ferroviaria",
            "category": "Transporte",
            "plainDescription": "La medida busca facilitar el transporte de mercancías a través de una nueva vía ferroviaria sur.",
            "whoIsAffected": [
                  "Empresarios de transporte",
                  "Consumidores de productos importados"
            ],
            "realWorldExample": "Juan, propietario de una empresa de transporte, explicó: 'Con la nueva vía, podríamos reducir nuestros costos de envío en un 20%, lo que nos permitiría ofrecer mejores precios a nuestros clientes y a los consumidores finales.'",
            "argumentsPro": [
                  "Reducción de costos de transporte",
                  "Mejora en la eficiencia logística"
            ],
            "argumentsContra": [
                  "Posible impacto ambiental",
                  "Necesidad de inversiones en infraestructuras"
            ]
      }
],
    votesSummary: {"si":270,"no":70,"abstencion":8,"noVota":2,"total":350},
    groupVotes: [{"groupName":"G.P. Popular (PP)","totalSeats":137,"si":137,"no":0,"abstencion":0,"noVota":0,"color":"#0ea5e9"},{"groupName":"G.P. Socialista (PSOE)","totalSeats":121,"si":121,"no":0,"abstencion":0,"noVota":0,"color":"#ef4444"},{"groupName":"G.P. VOX","totalSeats":33,"si":12,"no":21,"abstencion":0,"noVota":0,"color":"#22c55e"},{"groupName":"G.P. Plurinacional Sumar","totalSeats":27,"si":0,"no":27,"abstencion":0,"noVota":0,"color":"#ec4899"},{"groupName":"G.P. Republicano (ERC)","totalSeats":7,"si":0,"no":7,"abstencion":0,"noVota":0,"color":"#f59e0b"},{"groupName":"G.P. Junts per Catalunya","totalSeats":7,"si":0,"no":7,"abstencion":0,"noVota":0,"color":"#06b6d4"},{"groupName":"G.P. Euskal Herria Bildu","totalSeats":6,"si":0,"no":6,"abstencion":0,"noVota":0,"color":"#84cc16"},{"groupName":"G.P. Vasco (EAJ-PNV)","totalSeats":5,"si":0,"no":2,"abstencion":3,"noVota":0,"color":"#10b981"},{"groupName":"G.P. Mixto (Podemos/BNG/CC/UPN)","totalSeats":7,"si":0,"no":0,"abstencion":5,"noVota":2,"color":"#8b5cf6"}],
    bocgUrl: "https://www.congreso.es/datos-abiertos",
    expedienteNumber: "121/20260923",
  },
  {
    id: "congreso-2026-09-23-2",
    title: "Ley de Familias: Protección para las Madres y Padres",
    officialTitle: "Proposición no de Ley del Grupo Parlamentario Mixto (Sra. Belarra Urteaga y Sra. Santana Perera), relativa a la aprobación de la Ley de Familias.\nSe vota en los términos resultantes de la incorporación de la enmienda presentada por el Grupo Parlamentario Mixto (Sra. Belarra Urteaga y Sra. Santana Perera).",
    chamber: "congreso",
    date: "2026-09-23",
    time: "18:00 h",
    type: "mocion",
    status: "rechazado",
    category: "Familia",
    summary: "El Congreso votará sobre la Ley de Familias, que busca mejorar la calidad de vida de las familias con niños pequeños, facilitando el acceso a cuidados infantiles.",
    isOmnibus: false,
    threeKeys: {
      "what": "Establece medidas para apoyar a las familias con hijos pequeños.",
      "pocket": "Ofrece subvenciones para gastos de cuidados infantiles, reduciendo el coste de la maternidad y paternidad.",
      "clash": "Defensores argumentan que es necesario para apoyar a las familias, mientras que críticos temen que podría ser costoso."
},
    beforeVsAfter: {
      "before": "Antes, muchas familias enfrentaban dificultades para cubrir los costos de cuidados infantiles.",
      "after": "Con la nueva ley, las familias tendrán acceso a subvenciones que ayudarán a reducir estos costos."
},
    measures: [
      {
            "id": "congreso-2026-09-23-2-m1",
            "title": "Subvenciones para Cuidados Infantiles",
            "category": "Cuidados",
            "plainDescription": "La medida proporciona subvenciones para ayudar a las familias a cubrir los costos de cuidados infantiles.",
            "whoIsAffected": [
                  "Madres y padres con hijos pequeños",
                  "Cuidadoras y cuidadores privados"
            ],
            "realWorldExample": "María, una madre soltera con un bebé de 6 meses, recibirá una subvención mensual de 300 euros para cubrir los costos de un cuidador privado, lo que le permitirá dedicar más tiempo a su trabajo y estudios.",
            "argumentsPro": [
                  "Permite a las madres y padres conciliar mejor la vida laboral y familiar",
                  "Facilita el acceso a cuidados de calidad para los niños"
            ],
            "argumentsContra": [
                  "Podría ser costoso para el presupuesto público",
                  "Puede generar una demanda excesiva de cuidadores"
            ]
      }
],
    votesSummary: {"si":19,"no":177,"abstencion":147,"noVota":7,"total":350},
    groupVotes: [{"groupName":"G.P. Popular (PP)","totalSeats":137,"si":19,"no":118,"abstencion":0,"noVota":0,"color":"#0ea5e9"},{"groupName":"G.P. Socialista (PSOE)","totalSeats":121,"si":0,"no":59,"abstencion":62,"noVota":0,"color":"#ef4444"},{"groupName":"G.P. VOX","totalSeats":33,"si":0,"no":0,"abstencion":33,"noVota":0,"color":"#22c55e"},{"groupName":"G.P. Plurinacional Sumar","totalSeats":27,"si":0,"no":0,"abstencion":27,"noVota":0,"color":"#ec4899"},{"groupName":"G.P. Republicano (ERC)","totalSeats":7,"si":0,"no":0,"abstencion":7,"noVota":0,"color":"#f59e0b"},{"groupName":"G.P. Junts per Catalunya","totalSeats":7,"si":0,"no":0,"abstencion":7,"noVota":0,"color":"#06b6d4"},{"groupName":"G.P. Euskal Herria Bildu","totalSeats":6,"si":0,"no":0,"abstencion":6,"noVota":0,"color":"#84cc16"},{"groupName":"G.P. Vasco (EAJ-PNV)","totalSeats":5,"si":0,"no":0,"abstencion":5,"noVota":0,"color":"#10b981"},{"groupName":"G.P. Mixto (Podemos/BNG/CC/UPN)","totalSeats":7,"si":0,"no":0,"abstencion":0,"noVota":7,"color":"#8b5cf6"}],
    bocgUrl: "https://www.congreso.es/datos-abiertos",
    expedienteNumber: "121/20260923",
  },
  {
    id: "congreso-2026-09-23-3",
    title: "Reforma sanitaria: mejoras para el personal y el Sistema Nacional de Salud",
    officialTitle: "Moción consecuencia de interpelación urgente del Grupo Parlamentario Mixto (Sra. Valido García), sobre la reforma del Estatuto Marco del personal estatutario de los servicios de salud, en particular en lo relativo a la actualización de la clasificación profesional y retributiva del personal sanitario de formación profesional y del personal de gestión y servicios, la reforma del sistema de carrera profesional y la financiación necesaria para garantizar su aplicación en el conjunto del Sistema Nacional de Salud.",
    chamber: "congreso",
    date: "2026-09-23",
    time: "18:00 h",
    type: "mocion",
    status: "rechazado",
    category: "Sanidad",
    summary: "El Congreso debate la reforma del Estatuto Marco, mejorando las condiciones laborales y profesionales del personal sanitario. Esto afectará positivamente a la calidad del servicio y la motivación de los trabajadores.",
    isOmnibus: false,
    threeKeys: {
      "what": "Actualización de retribuciones y carrera profesional para sanitarios.",
      "pocket": "Incremento del salario para formación y gestión sanitaria, mejorando la calidad de atención.",
      "clash": "Sanidad pública defiende mejoras para profesionales, mientras privados temen aumento de costes."
},
    beforeVsAfter: {
      "before": "Sanitarios con salarios estancados y pocas perspectivas de carrera.",
      "after": "Profesionales con mayores ingresos y oportunidades de desarrollo profesional."
},
    measures: [
      {
            "id": "congreso-2026-09-23-3-m1",
            "title": "Actualización de la clasificación profesional y retributiva",
            "category": "Salarios y carrera profesional",
            "plainDescription": "Establece nuevas escalas salariales y mejoras en la estructura de carrera para personal sanitario de formación y gestión.",
            "whoIsAffected": [
                  "Sanitarios en formación",
                  "Profesionales de gestión y servicios"
            ],
            "realWorldExample": "María, estudiante de enfermería, ve su salario aumentar de 1.200 a 1.500 euros al mes, lo que le permite cubrir mejor sus gastos y ahorrar para el futuro. Juan, jefe de servicio, ve su retribución aumentar de 2.500 a 3.000 euros, lo que le permite mejorar la calidad de vida de su familia.",
            "argumentsPro": [
                  "Mejora de la calidad de vida y motivación de los profesionales",
                  "Atracción de talento para el sector público"
            ],
            "argumentsContra": [
                  "Incremento de costes para el sistema",
                  "Posible desequilibrio entre público y privado"
            ]
      }
],
    votesSummary: {"si":15,"no":39,"abstencion":294,"noVota":2,"total":350},
    groupVotes: [{"groupName":"G.P. Popular (PP)","totalSeats":137,"si":15,"no":39,"abstencion":83,"noVota":0,"color":"#0ea5e9"},{"groupName":"G.P. Socialista (PSOE)","totalSeats":121,"si":0,"no":0,"abstencion":121,"noVota":0,"color":"#ef4444"},{"groupName":"G.P. VOX","totalSeats":33,"si":0,"no":0,"abstencion":33,"noVota":0,"color":"#22c55e"},{"groupName":"G.P. Plurinacional Sumar","totalSeats":27,"si":0,"no":0,"abstencion":27,"noVota":0,"color":"#ec4899"},{"groupName":"G.P. Republicano (ERC)","totalSeats":7,"si":0,"no":0,"abstencion":7,"noVota":0,"color":"#f59e0b"},{"groupName":"G.P. Junts per Catalunya","totalSeats":7,"si":0,"no":0,"abstencion":7,"noVota":0,"color":"#06b6d4"},{"groupName":"G.P. Euskal Herria Bildu","totalSeats":6,"si":0,"no":0,"abstencion":6,"noVota":0,"color":"#84cc16"},{"groupName":"G.P. Vasco (EAJ-PNV)","totalSeats":5,"si":0,"no":0,"abstencion":5,"noVota":0,"color":"#10b981"},{"groupName":"G.P. Mixto (Podemos/BNG/CC/UPN)","totalSeats":7,"si":0,"no":0,"abstencion":5,"noVota":2,"color":"#8b5cf6"}],
    bocgUrl: "https://www.congreso.es/datos-abiertos",
    expedienteNumber: "121/20260923",
  },
  {
    id: "congreso-2026-09-23-4",
    title: "VOX pide medidas urgentes para mejorar el sistema educativo",
    officialTitle: "Moción consecuencia de interpelación urgente del Grupo Parlamentario VOX, sobre las medidas que va a adoptar el Gobierno para revertir los pésimos resultados de nuestro sistema educativo.",
    chamber: "congreso",
    date: "2026-09-23",
    time: "18:00 h",
    type: "mocion",
    status: "rechazado",
    category: "Educación",
    summary: "El Congreso debatirá sobre reformas educativas que podrían mejorar la calidad de la enseñanza y reducir la brecha de desigualdad. Esto supondrá un alivio financiero para las familias con bajos ingresos y un paso hacia una educación más equitativa.",
    isOmnibus: false,
    threeKeys: {
      "what": "La moción busca reformas para mejorar la calidad educativa y reducir la brecha de desigualdad.",
      "pocket": "Los padres verán mejoradas las becas y subvenciones para los más necesitados, aliviando el coste de la educación.",
      "clash": "Los defensores de la moción argumentan la necesidad de mejorar la calidad educativa, mientras que los opositores temen que esto pueda aumentar los costos para los contribuyentes."
},
    beforeVsAfter: {
      "before": "Antes, los padres enfrentaban dificultades para acceder a becas y subvenciones, lo que aumentaba la presión financiera.",
      "after": "Con la nueva regulación, los estudiantes de bajos ingresos podrán acceder a ayudas más fáciles y amplias, mejorando su acceso a la educación de calidad."
},
    measures: [
      {
            "id": "congreso-2026-09-23-4-m1",
            "title": "Becas y subvenciones ampliadas",
            "category": "Educación",
            "plainDescription": "Se establecerán becas y subvenciones más amplias y fáciles de acceder para estudiantes de bajos ingresos, mejorando su acceso a la educación de calidad.",
            "whoIsAffected": [
                  "Estudiantes de bajos ingresos",
                  "Familias con bajos ingresos"
            ],
            "realWorldExample": "Juan, un estudiante de 16 años, vivía en una familia con ingresos limitados. Con la nueva regulación, su familia podrá acceder a una beca que cubrirá el 70% de sus gastos escolares, lo que permitirá a Juan continuar sus estudios sin preocuparse por el coste.",
            "argumentsPro": [
                  "Mejorar la calidad educativa para todos",
                  "Reducir la brecha de desigualdad"
            ],
            "argumentsContra": [
                  "Posible aumento de costos para contribuyentes",
                  "Riesgo de desbordamiento de solicitudes"
            ]
      }
],
    votesSummary: {"si":33,"no":178,"abstencion":137,"noVota":2,"total":350},
    groupVotes: [{"groupName":"G.P. Popular (PP)","totalSeats":137,"si":33,"no":104,"abstencion":0,"noVota":0,"color":"#0ea5e9"},{"groupName":"G.P. Socialista (PSOE)","totalSeats":121,"si":0,"no":74,"abstencion":47,"noVota":0,"color":"#ef4444"},{"groupName":"G.P. VOX","totalSeats":33,"si":0,"no":0,"abstencion":33,"noVota":0,"color":"#22c55e"},{"groupName":"G.P. Plurinacional Sumar","totalSeats":27,"si":0,"no":0,"abstencion":27,"noVota":0,"color":"#ec4899"},{"groupName":"G.P. Republicano (ERC)","totalSeats":7,"si":0,"no":0,"abstencion":7,"noVota":0,"color":"#f59e0b"},{"groupName":"G.P. Junts per Catalunya","totalSeats":7,"si":0,"no":0,"abstencion":7,"noVota":0,"color":"#06b6d4"},{"groupName":"G.P. Euskal Herria Bildu","totalSeats":6,"si":0,"no":0,"abstencion":6,"noVota":0,"color":"#84cc16"},{"groupName":"G.P. Vasco (EAJ-PNV)","totalSeats":5,"si":0,"no":0,"abstencion":5,"noVota":0,"color":"#10b981"},{"groupName":"G.P. Mixto (Podemos/BNG/CC/UPN)","totalSeats":7,"si":0,"no":0,"abstencion":5,"noVota":2,"color":"#8b5cf6"}],
    bocgUrl: "https://www.congreso.es/datos-abiertos",
    expedienteNumber: "121/20260923",
  },
  {
    id: "congreso-2026-09-23-5",
    title: "Urgente: Moción sobre políticas educativas",
    officialTitle: "Moción consecuencia de interpelación urgente del Grupo Parlamentario Popular en el Congreso, sobre la nefasta política educativa de su Gobierno.",
    chamber: "congreso",
    date: "2026-09-23",
    time: "18:00 h",
    type: "mocion",
    status: "aprobado",
    category: "Educación",
    summary: "El Congreso debate mejoras en la educación, con el objetivo de hacerla más accesible y de mejor calidad. Esto beneficiará a miles de familias que buscan la mejor formación para sus hijos.",
    isOmnibus: false,
    threeKeys: {
      "what": "Propone mejoras en la calidad y accesibilidad del sistema educativo.",
      "pocket": "Reducirá la carga financiera para familias con hijos en colegios privados.",
      "clash": "Defensores ven mejora en calidad educativa, mientras que críticos temen aumento de costos para familias."
},
    beforeVsAfter: {
      "before": "Familias con hijos en colegios privados enfrentan altos costos educativos.",
      "after": "Se implementarán subvenciones para disminuir la carga financiera en colegios privados."
},
    measures: [
      {
            "id": "congreso-2026-09-23-5-m1",
            "title": "Subvenciones para colegios privados",
            "category": "Educación",
            "plainDescription": "Se establecerán subvenciones para colegios privados que cumplan con ciertos estándares de calidad.",
            "whoIsAffected": [
                  "Familias con hijos en colegios privados",
                  "Colegios privados que cumplan con estándares de calidad"
            ],
            "realWorldExample": "María, madre de dos hijos, verá reducidos sus gastos mensuales en colegios privados gracias a las subvenciones. Su hijo, Juan, podrá continuar su formación en un ambiente de calidad sin que esto suponga un peso adicional en su presupuesto familiar.",
            "argumentsPro": [
                  "Mejora en la calidad educativa",
                  "Accesibilidad para familias que buscan educación de calidad"
            ],
            "argumentsContra": [
                  "Posible aumento de costos para colegios que no cumplen con los estándares",
                  "Incertidumbre sobre la calidad real de los colegios beneficiados"
            ]
      }
],
    votesSummary: {"si":177,"no":171,"abstencion":0,"noVota":2,"total":350},
    groupVotes: [{"groupName":"G.P. Popular (PP)","totalSeats":137,"si":137,"no":0,"abstencion":0,"noVota":0,"color":"#0ea5e9"},{"groupName":"G.P. Socialista (PSOE)","totalSeats":121,"si":40,"no":81,"abstencion":0,"noVota":0,"color":"#ef4444"},{"groupName":"G.P. VOX","totalSeats":33,"si":0,"no":33,"abstencion":0,"noVota":0,"color":"#22c55e"},{"groupName":"G.P. Plurinacional Sumar","totalSeats":27,"si":0,"no":27,"abstencion":0,"noVota":0,"color":"#ec4899"},{"groupName":"G.P. Republicano (ERC)","totalSeats":7,"si":0,"no":7,"abstencion":0,"noVota":0,"color":"#f59e0b"},{"groupName":"G.P. Junts per Catalunya","totalSeats":7,"si":0,"no":7,"abstencion":0,"noVota":0,"color":"#06b6d4"},{"groupName":"G.P. Euskal Herria Bildu","totalSeats":6,"si":0,"no":6,"abstencion":0,"noVota":0,"color":"#84cc16"},{"groupName":"G.P. Vasco (EAJ-PNV)","totalSeats":5,"si":0,"no":5,"abstencion":0,"noVota":0,"color":"#10b981"},{"groupName":"G.P. Mixto (Podemos/BNG/CC/UPN)","totalSeats":7,"si":0,"no":5,"abstencion":0,"noVota":2,"color":"#8b5cf6"}],
    bocgUrl: "https://www.congreso.es/datos-abiertos",
    expedienteNumber: "121/20260923",
  },
  {
    id: "congreso-2026-09-23-6",
    title: "Medidas urgentes para La Palma: reconstrucción económica y social",
    officialTitle: "Real Decreto-ley 23/2026, de 8 de septiembre, por el que se adoptan medidas fiscales y financieras urgentes que contribuyan a la reconstrucción económica y social de la isla de La Palma, así como medidas tendentes a promover la ejecución de inversiones por parte de las comunidades autónomas que han registrado superávits presupuestarios y excesos de financiación pendientes de aplicar de ejercicios anteriores a 2026.",
    chamber: "congreso",
    date: "2026-09-23",
    time: "18:00 h",
    type: "real_decreto_ley",
    status: "aprobado",
    category: "Economía",
    summary: "El Congreso aprueba medidas para reconstruir La Palma, ofreciendo subvenciones a los residentes para reparar sus hogares. Esto ayuda a mejorar la calidad de vida de las familias afectadas.",
    isOmnibus: true,
    threeKeys: {
      "what": "Medidas fiscales y financieras para ayudar a La Palma.",
      "pocket": "Ayuda a familias con subvenciones para reparar hogares dañados.",
      "clash": "Inquilinos preocupados por el alquiler vs. propietarios que buscan proteger sus inversiones."
},
    beforeVsAfter: {
      "before": "Antes, los residentes de La Palma enfrentaban dificultades para reparar sus hogares.",
      "after": "Ahora, los residentes pueden acceder a subvenciones para reparar sus hogares dañados."
},
    measures: [
      {
            "id": "congreso-2026-09-23-6-m1",
            "title": "Subvenciones para reparar hogares dañados",
            "category": "Hogares dañados",
            "plainDescription": "Ofrece subvenciones a los residentes de La Palma para reparar sus hogares dañados por el volcán.",
            "whoIsAffected": [
                  "Familias residentes en La Palma"
            ],
            "realWorldExample": "María, una madre soltera con tres hijos, recibió una subvención para reparar la fachada de su casa, lo que le permitió proteger a su familia de las inclemencias del tiempo.",
            "argumentsPro": [
                  "Necesidad de reparar hogares para garantizar la seguridad de las familias",
                  "Ayuda a la reconstrucción de la isla"
            ],
            "argumentsContra": [
                  "Posible aumento de la carga fiscal",
                  "Inversión que podría destinarse a otros sectores"
            ]
      }
],
    votesSummary: {"si":300,"no":38,"abstencion":10,"noVota":2,"total":350},
    groupVotes: [{"groupName":"G.P. Popular (PP)","totalSeats":137,"si":137,"no":0,"abstencion":0,"noVota":0,"color":"#0ea5e9"},{"groupName":"G.P. Socialista (PSOE)","totalSeats":121,"si":121,"no":0,"abstencion":0,"noVota":0,"color":"#ef4444"},{"groupName":"G.P. VOX","totalSeats":33,"si":33,"no":0,"abstencion":0,"noVota":0,"color":"#22c55e"},{"groupName":"G.P. Plurinacional Sumar","totalSeats":27,"si":9,"no":18,"abstencion":0,"noVota":0,"color":"#ec4899"},{"groupName":"G.P. Republicano (ERC)","totalSeats":7,"si":0,"no":7,"abstencion":0,"noVota":0,"color":"#f59e0b"},{"groupName":"G.P. Junts per Catalunya","totalSeats":7,"si":0,"no":7,"abstencion":0,"noVota":0,"color":"#06b6d4"},{"groupName":"G.P. Euskal Herria Bildu","totalSeats":6,"si":0,"no":6,"abstencion":0,"noVota":0,"color":"#84cc16"},{"groupName":"G.P. Vasco (EAJ-PNV)","totalSeats":5,"si":0,"no":0,"abstencion":5,"noVota":0,"color":"#10b981"},{"groupName":"G.P. Mixto (Podemos/BNG/CC/UPN)","totalSeats":7,"si":0,"no":0,"abstencion":5,"noVota":2,"color":"#8b5cf6"}],
    bocgUrl: "https://www.congreso.es/datos-abiertos",
    expedienteNumber: "121/20260923",
  },
  {
    id: "congreso-2026-09-23-7",
    title: "Medidas urgentes para La Palma: reconstrucción económica y social",
    officialTitle: "Tramitación como Proyecto de Ley por el procedimiento de urgencia del Real Decreto-ley 23/2026, de 8 de septiembre, por el que se adoptan medidas fiscales y financieras urgentes que contribuyan a la reconstrucción económica y social de la isla de La Palma, así como medidas tendentes a promover la ejecución de inversiones por parte de las comunidades autónomas que han registrado superávits presupuestarios y excesos de financiación pendientes de aplicar de ejercicios anteriores a 2026.",
    chamber: "congreso",
    date: "2026-09-23",
    time: "18:00 h",
    type: "real_decreto_ley",
    status: "aprobado",
    category: "Economía",
    summary: "El Congreso aprueba medidas urgentes para La Palma, incluyendo subvenciones para pequeños negocios y autónomos, mejorando la economía local y creando empleo.",
    isOmnibus: true,
    threeKeys: {
      "what": "Medidas fiscales y financieras para ayudar a La Palma",
      "pocket": "Ayuda a pequeños comercios y autónomos con subvenciones",
      "clash": "Inquilinos y propietarios discuten sobre el alquiler"
},
    beforeVsAfter: {
      "before": "La Palma enfrentaba dificultades económicas y sociales tras el volcán",
      "after": "Se implementan ayudas para impulsar la economía local y crear empleo"
},
    measures: [
      {
            "id": "congreso-2026-09-23-7-m1",
            "title": "Subvenciones para pequeños comercios y autónomos",
            "category": "Emprendimiento",
            "plainDescription": "Se otorgan subvenciones para ayudar a los pequeños comercios y autónomos a recuperarse y crecer.",
            "whoIsAffected": [
                  "Pequeños comercios locales",
                  "Autónomos"
            ],
            "realWorldExample": "Juan, un pequeño vendedor de frutas y verduras, recibió una subvención de 5.000 euros para modernizar su negocio y ampliar su oferta de productos, lo que le permitió aumentar su clientela y mejorar su calidad de vida.",
            "argumentsPro": [
                  "Ayuda a mantener la diversidad comercial local",
                  "Genera empleo y fomenta la economía local"
            ],
            "argumentsContra": [
                  "Puede generar un aumento de precios",
                  "Posible desigualdad si no todos los comercios pueden acceder a la subvención"
            ]
      }
],
    votesSummary: {"si":345,"no":0,"abstencion":0,"noVota":5,"total":350},
    groupVotes: [{"groupName":"G.P. Popular (PP)","totalSeats":137,"si":137,"no":0,"abstencion":0,"noVota":0,"color":"#0ea5e9"},{"groupName":"G.P. Socialista (PSOE)","totalSeats":121,"si":121,"no":0,"abstencion":0,"noVota":0,"color":"#ef4444"},{"groupName":"G.P. VOX","totalSeats":33,"si":33,"no":0,"abstencion":0,"noVota":0,"color":"#22c55e"},{"groupName":"G.P. Plurinacional Sumar","totalSeats":27,"si":27,"no":0,"abstencion":0,"noVota":0,"color":"#ec4899"},{"groupName":"G.P. Republicano (ERC)","totalSeats":7,"si":7,"no":0,"abstencion":0,"noVota":0,"color":"#f59e0b"},{"groupName":"G.P. Junts per Catalunya","totalSeats":7,"si":7,"no":0,"abstencion":0,"noVota":0,"color":"#06b6d4"},{"groupName":"G.P. Euskal Herria Bildu","totalSeats":6,"si":6,"no":0,"abstencion":0,"noVota":0,"color":"#84cc16"},{"groupName":"G.P. Vasco (EAJ-PNV)","totalSeats":5,"si":5,"no":0,"abstencion":0,"noVota":0,"color":"#10b981"},{"groupName":"G.P. Mixto (Podemos/BNG/CC/UPN)","totalSeats":7,"si":2,"no":0,"abstencion":0,"noVota":5,"color":"#8b5cf6"}],
    bocgUrl: "https://www.congreso.es/datos-abiertos",
    expedienteNumber: "121/20260923",
  },
  {
    id: "congreso-2026-09-22-1",
    title: "Justicia más eficiente para familias con menores",
    officialTitle: "Proposición de Ley del Grupo Parlamentario Vasco (EAJ-PNV), de reforma de la Ley Orgánica 1/2025, de 2 de enero, de medidas en materia de eficiencia en el Servicio Público de Justicia; y de modificación de la Ley 1/2000, de 7 de enero, de Enjuiciamiento Civil, en cuanto a los procesos de familia con personas menores de edad.",
    chamber: "congreso",
    date: "2026-09-22",
    time: "18:00 h",
    type: "proposicion_ley",
    status: "aprobado",
    category: "Justicia",
    summary: "El Congreso analiza reformas para mejorar la eficiencia en los procesos judiciales familiares, beneficiando a las familias con menores y reduciendo costes y tiempo de espera.",
    isOmnibus: false,
    threeKeys: {
      "what": "Reforma para acelerar procesos judiciales en casos familiares con menores.",
      "pocket": "Menor tiempo de espera y costes judiciales reducidos para familias.",
      "clash": "Defensores de la medida argumentan que es necesario para proteger a los menores, mientras que otros temen que pueda afectar a la calidad del proceso."
},
    beforeVsAfter: {
      "before": "Familias con menores enfrentándose a largos procesos judiciales y costes elevados.",
      "after": "Procesos más rápidos y económicos para casos familiares con menores."
},
    measures: [
      {
            "id": "congreso-2026-09-22-1-m1",
            "title": "Procedimiento acelerado en casos familiares",
            "category": "Procesos judiciales",
            "plainDescription": "Establece un procedimiento especial para casos familiares con menores, reduciendo el tiempo de espera y los costes judiciales.",
            "whoIsAffected": [
                  "Familias con menores de edad",
                  "Abogados y jueces"
            ],
            "realWorldExample": "María, madre de un niño de 7 años, ve cómo su caso familiar se resuelve en solo 3 meses, frente a los 12 meses que esperaba antes. Esto le permite centrarse en la educación de su hijo sin preocupaciones adicionales.",
            "argumentsPro": [
                  "Reducción del sufrimiento de los menores",
                  "Mayor acceso a la justicia para familias"
            ],
            "argumentsContra": [
                  "Posible riesgo de que la calidad del proceso se vea afectada",
                  "Necesidad de formación adicional para jueces"
            ]
      }
],
    votesSummary: {"si":340,"no":7,"abstencion":0,"noVota":3,"total":350},
    groupVotes: [{"groupName":"G.P. Popular (PP)","totalSeats":137,"si":137,"no":0,"abstencion":0,"noVota":0,"color":"#0ea5e9"},{"groupName":"G.P. Socialista (PSOE)","totalSeats":121,"si":121,"no":0,"abstencion":0,"noVota":0,"color":"#ef4444"},{"groupName":"G.P. VOX","totalSeats":33,"si":33,"no":0,"abstencion":0,"noVota":0,"color":"#22c55e"},{"groupName":"G.P. Plurinacional Sumar","totalSeats":27,"si":27,"no":0,"abstencion":0,"noVota":0,"color":"#ec4899"},{"groupName":"G.P. Republicano (ERC)","totalSeats":7,"si":7,"no":0,"abstencion":0,"noVota":0,"color":"#f59e0b"},{"groupName":"G.P. Junts per Catalunya","totalSeats":7,"si":7,"no":0,"abstencion":0,"noVota":0,"color":"#06b6d4"},{"groupName":"G.P. Euskal Herria Bildu","totalSeats":6,"si":6,"no":0,"abstencion":0,"noVota":0,"color":"#84cc16"},{"groupName":"G.P. Vasco (EAJ-PNV)","totalSeats":5,"si":2,"no":3,"abstencion":0,"noVota":0,"color":"#10b981"},{"groupName":"G.P. Mixto (Podemos/BNG/CC/UPN)","totalSeats":7,"si":0,"no":4,"abstencion":0,"noVota":3,"color":"#8b5cf6"}],
    bocgUrl: "https://www.congreso.es/datos-abiertos",
    expedienteNumber: "121/20260922",
  },
  {
    id: "congreso-2026-09-22-2",
    title: "Jubilación sin penalización: un alivio para los trabajadores",
    officialTitle: "Proposición de Ley del Grupo Parlamentario Mixto, de jubilación sin penalización.",
    chamber: "congreso",
    date: "2026-09-22",
    time: "18:00 h",
    type: "proposicion_ley",
    status: "aprobado",
    category: "Empleo",
    summary: "El Congreso debate si permitir la jubilación sin penalización, mejorando la calidad de vida de los trabajadores y reduciendo el estrés financiero.",
    isOmnibus: false,
    threeKeys: {
      "what": "Permite a los trabajadores jubilarse sin penalización económica.",
      "pocket": "Reduce el estrés financiero al evitar multas o pérdidas de pensiones.",
      "clash": "Defensores del cambio argumentan que es justo, mientras que críticos temen que aumente el gasto público."
},
    beforeVsAfter: {
      "before": "Antes, los trabajadores corrían el riesgo de penalizaciones si se jubilaban antes de la edad legal.",
      "after": "Ahora, podrán jubilarse en mejores condiciones sin temor a sanciones."
},
    measures: [
      {
            "id": "congreso-2026-09-22-2-m1",
            "title": "Jubilación sin penalización",
            "category": "Seguridad Social",
            "plainDescription": "Estipula que los trabajadores pueden jubilarse en cualquier momento sin perder parte de su pensión.",
            "whoIsAffected": [
                  "Trabajadores de cualquier edad y situación laboral"
            ],
            "realWorldExample": "Juan, un trabajador de 55 años, decide jubilarse por razones de salud. Antes, temía perder una parte significativa de su pensión. Ahora, puede hacerlo sin penalizaciones, aliviando su situación financiera.",
            "argumentsPro": [
                  "Permite a los trabajadores tomar decisiones de vida sin presión económica",
                  "Reduce el estrés asociado a la jubilación"
            ],
            "argumentsContra": [
                  "Podría aumentar el gasto público en pensiones",
                  "Puede incentivar la retirada anticipada de trabajadores valiosos"
            ]
      }
],
    votesSummary: {"si":178,"no":33,"abstencion":136,"noVota":3,"total":350},
    groupVotes: [{"groupName":"G.P. Popular (PP)","totalSeats":137,"si":137,"no":0,"abstencion":0,"noVota":0,"color":"#0ea5e9"},{"groupName":"G.P. Socialista (PSOE)","totalSeats":121,"si":41,"no":33,"abstencion":47,"noVota":0,"color":"#ef4444"},{"groupName":"G.P. VOX","totalSeats":33,"si":0,"no":0,"abstencion":33,"noVota":0,"color":"#22c55e"},{"groupName":"G.P. Plurinacional Sumar","totalSeats":27,"si":0,"no":0,"abstencion":27,"noVota":0,"color":"#ec4899"},{"groupName":"G.P. Republicano (ERC)","totalSeats":7,"si":0,"no":0,"abstencion":7,"noVota":0,"color":"#f59e0b"},{"groupName":"G.P. Junts per Catalunya","totalSeats":7,"si":0,"no":0,"abstencion":7,"noVota":0,"color":"#06b6d4"},{"groupName":"G.P. Euskal Herria Bildu","totalSeats":6,"si":0,"no":0,"abstencion":6,"noVota":0,"color":"#84cc16"},{"groupName":"G.P. Vasco (EAJ-PNV)","totalSeats":5,"si":0,"no":0,"abstencion":5,"noVota":0,"color":"#10b981"},{"groupName":"G.P. Mixto (Podemos/BNG/CC/UPN)","totalSeats":7,"si":0,"no":0,"abstencion":4,"noVota":3,"color":"#8b5cf6"}],
    bocgUrl: "https://www.congreso.es/datos-abiertos",
    expedienteNumber: "121/20260922",
  },
  {
    id: "senado-2026-09-17-1",
    title: "Estabilidad presupuestaria: ¿Qué impacto en mi bolsillo?",
    officialTitle: "Votación de los Objetivos de Estabilidad Presupuestaria y de Deuda Pública para el conjunto de Comunidades Autónomas y Entidades Locales (Techo de Gasto 2026-2028).",
    chamber: "senado",
    date: "2026-09-17",
    time: "17:15 h",
    type: "proyecto_ley",
    status: "rechazado",
    category: "Economía",
    summary: "El Congreso votará estos objetivos para los próximos años, buscando equilibrio entre estabilidad financiera y servicios locales. Los ciudadanos verán cómo esto afecta a sus bolsillos y a los servicios a los que acuden.",
    isOmnibus: false,
    threeKeys: {
      "what": "Establece límites al gasto público para las comunidades autónomas y entidades locales.",
      "pocket": "Limita subvenciones y ayudas, afectando a autónomos, pequeños propietarios y servicios locales.",
      "clash": "Defensores ven estabilidad financiera, críticos temen recortes en servicios y ayudas."
},
    beforeVsAfter: {
      "before": "Antes, comunidades y ayuntamientos podían aumentar gastos sin restricciones.",
      "after": "Ahora, los gastos están limitados, lo que podría reducir subvenciones y servicios."
},
    measures: [
      {
            "id": "senado-2026-09-17-1-m1",
            "title": "Techo de Gasto 2026-2028",
            "category": "Economía",
            "plainDescription": "Establece un límite máximo anual para el gasto público de las comunidades autónomas y entidades locales.",
            "whoIsAffected": [
                  "Autónomos",
                  "Pequeños propietarios",
                  "Servicios locales"
            ],
            "realWorldExample": "Juan, un autónomo de 40 años, podría ver reducidas las ayudas para modernizar su negocio, afectando a su capacidad de reinversión y crecimiento. Por otro lado, María, una vecina de un pequeño municipio, podría notar menos mantenimiento en la carretera que conduce a su casa.",
            "argumentsPro": [
                  "Evita endeudamiento excesivo",
                  "Garantiza estabilidad financiera a largo plazo"
            ],
            "argumentsContra": [
                  "Puede limitar servicios y ayudas",
                  "Riesgo de recortes en programas sociales"
            ]
      }
],
    votesSummary: {"si":115,"no":147,"abstencion":4,"noVota":0,"total":266},
    groupVotes: [{"groupName":"G.P. Popular en el Senado (PP)","totalSeats":144,"si":115,"no":29,"abstencion":0,"noVota":0,"color":"#0ea5e9"},{"groupName":"G.P. Socialista (PSOE)","totalSeats":88,"si":0,"no":88,"abstencion":0,"noVota":0,"color":"#ef4444"},{"groupName":"G.P. Izquierdas por la Independencia (ERC/Bildu)","totalSeats":10,"si":0,"no":10,"abstencion":0,"noVota":0,"color":"#f59e0b"},{"groupName":"G.P. Plural en el Senado (Junts/CC/BNG)","totalSeats":6,"si":0,"no":6,"abstencion":0,"noVota":0,"color":"#06b6d4"},{"groupName":"G.P. Vasco en el Senado (EAJ-PNV)","totalSeats":5,"si":0,"no":5,"abstencion":0,"noVota":0,"color":"#10b981"},{"groupName":"G.P. VOX","totalSeats":3,"si":0,"no":3,"abstencion":0,"noVota":0,"color":"#22c55e"},{"groupName":"G.P. Mixto (UPN/Compromís/Más Madrid)","totalSeats":10,"si":0,"no":6,"abstencion":4,"noVota":0,"color":"#8b5cf6"}],
    bocgUrl: "https://www.senado.es/datos-abiertos",
    expedienteNumber: "600/000028",
  },
  {
    id: "congreso-2026-09-17-1",
    title: "Actualización del Plan Nacional de Energía y Clima",
    officialTitle: "Proposición no de ley relativa a la actualización del Plan Nacional Integrado de Energía y Clima y la ampliación de la vida útil de las centrales nucleares.",
    chamber: "congreso",
    date: "2026-09-17",
    time: "18:40 h",
    type: "mocion",
    status: "rechazado",
    category: "Energía",
    summary: "Se actualiza el plan energético para incluir la energía nuclear y se extiende la vida útil de las centrales nucleares, lo que podría afectar los costos de la energía y la política energética del país.",
    isOmnibus: false,
    threeKeys: {
      "what": "Se actualiza el plan energético y se extiende la vida útil de las centrales nucleares.",
      "pocket": "Los costos podrían aumentar para los consumidores y se extenderá el uso de energía nuclear.",
      "clash": "Los partidarios defienden la seguridad energética y la reducción de emisiones, mientras que los opositores critican el riesgo nuclear y la dependencia energética."
},
    beforeVsAfter: {
      "before": "El plan actual se centra en fuentes renovables y eficiencia energética.",
      "after": "Se incluyen centrales nucleares en el plan energético y se extiende su vida útil."
},
    measures: [
      {
            "id": "congreso-2026-09-17-1-m1",
            "title": "Actualización del Plan Nacional Integrado de Energía y Clima",
            "category": "Energía Nuclear",
            "plainDescription": "Se permitirá una mayor utilización de la energía nuclear en el marco del plan energético.",
            "whoIsAffected": [
                  "Consumidores de electricidad",
                  "Empresas de energía"
            ],
            "realWorldExample": "Un hogar promedio podría ver un aumento del 2% en su factura de la luz debido a la mayor utilización de la energía nuclear.",
            "argumentsPro": [
                  "Se reduce la dependencia de combustibles fósiles",
                  "Se incrementa la seguridad energética del país"
            ],
            "argumentsContra": [
                  "Existe el riesgo nuclear",
                  "Se podría prolongar la dependencia energética"
            ]
      }
],
    votesSummary: {"si":170,"no":176,"abstencion":4,"noVota":0,"total":350},
    groupVotes: [{"groupName":"G.P. Popular (PP)","totalSeats":137,"si":137,"no":0,"abstencion":0,"noVota":0,"color":"#0ea5e9"},{"groupName":"G.P. Socialista (PSOE)","totalSeats":121,"si":33,"no":88,"abstencion":0,"noVota":0,"color":"#ef4444"},{"groupName":"G.P. VOX","totalSeats":33,"si":0,"no":33,"abstencion":0,"noVota":0,"color":"#22c55e"},{"groupName":"G.P. Plurinacional Sumar","totalSeats":27,"si":0,"no":27,"abstencion":0,"noVota":0,"color":"#ec4899"},{"groupName":"G.P. Republicano (ERC)","totalSeats":7,"si":0,"no":7,"abstencion":0,"noVota":0,"color":"#f59e0b"},{"groupName":"G.P. Junts per Catalunya","totalSeats":7,"si":0,"no":7,"abstencion":0,"noVota":0,"color":"#06b6d4"},{"groupName":"G.P. Euskal Herria Bildu","totalSeats":6,"si":0,"no":6,"abstencion":0,"noVota":0,"color":"#84cc16"},{"groupName":"G.P. Vasco (EAJ-PNV)","totalSeats":5,"si":0,"no":5,"abstencion":0,"noVota":0,"color":"#10b981"},{"groupName":"G.P. Mixto (Podemos/BNG/CC/UPN)","totalSeats":7,"si":0,"no":3,"abstencion":4,"noVota":0,"color":"#8b5cf6"}],
    bocgUrl: "https://www.congreso.es/datos-abiertos",
    expedienteNumber: "162/000214",
  },
  {
    id: "congreso-2026-09-16-1",
    title: "VOX propone rechazar reparto de acuerdo migratorio",
    officialTitle: "Proposición no de Ley del Grupo Parlamentario VOX, relativa al cumplimiento del Acuerdo entre el Reino de España y el Reino de Marruecos sobre la cooperación en el ámbito de la prevención de la emigración ilegal de menores no acompañados, su protección y su retorno concertado, hecho en Rabat el 6 de marzo de 2007, y al rechazo a su reparto por el territorio nacional ante la invasión inmigratoria de Marruecos sobre Ceuta.",
    chamber: "congreso",
    date: "2026-09-16",
    time: "18:00 h",
    type: "mocion",
    status: "rechazado",
    category: "Vivienda",
    summary: "El Grupo Parlamentario VOX presenta una propuesta para no dividir el acuerdo con Marruecos sobre inmigración ilegal. Esto podría reducir la presión migratoria en Ceuta, pero genera preocupación sobre la equidad territorial.",
    isOmnibus: false,
    threeKeys: {
      "what": "VOX sugiere no dividir el acuerdo con Marruecos sobre inmigración ilegal.",
      "pocket": "Impacto limitado en bolsillo, pero preocupación por el aumento de la inmigración en Ceuta.",
      "clash": "VOX defiende la integridad territorial, mientras otros ven la necesidad de reparto equitativo."
},
    beforeVsAfter: {
      "before": "Antes, el acuerdo con Marruecos se mantenía sin reparto en Ceuta.",
      "after": "Ahora, se propone no dividir el acuerdo, evitando la presión migratoria."
},
    measures: [
      {
            "id": "congreso-2026-09-16-1-m1",
            "title": "No reparto del acuerdo migratorio",
            "category": "Inmigración",
            "plainDescription": "VOX propone no dividir el acuerdo con Marruecos sobre inmigración ilegal, manteniendo la integridad territorial de Ceuta.",
            "whoIsAffected": [
                  "Residentes de Ceuta",
                  "Empresarios locales"
            ],
            "realWorldExample": "Juan, un comerciante de Ceuta, teme que el reparto del acuerdo pueda aumentar la competencia ilegal, perjudicando su negocio. Por otro lado, Ana, una residente, ve la integridad territorial como fundamental para la seguridad de la ciudad.",
            "argumentsPro": [
                  "Integridad territorial",
                  "Seguridad de la ciudad"
            ],
            "argumentsContra": [
                  "Competencia ilegal",
                  "Equidad territorial"
            ]
      }
],
    votesSummary: {"si":170,"no":177,"abstencion":0,"noVota":3,"total":350},
    groupVotes: [{"groupName":"G.P. Popular (PP)","totalSeats":137,"si":137,"no":0,"abstencion":0,"noVota":0,"color":"#0ea5e9"},{"groupName":"G.P. Socialista (PSOE)","totalSeats":121,"si":33,"no":88,"abstencion":0,"noVota":0,"color":"#ef4444"},{"groupName":"G.P. VOX","totalSeats":33,"si":0,"no":33,"abstencion":0,"noVota":0,"color":"#22c55e"},{"groupName":"G.P. Plurinacional Sumar","totalSeats":27,"si":0,"no":27,"abstencion":0,"noVota":0,"color":"#ec4899"},{"groupName":"G.P. Republicano (ERC)","totalSeats":7,"si":0,"no":7,"abstencion":0,"noVota":0,"color":"#f59e0b"},{"groupName":"G.P. Junts per Catalunya","totalSeats":7,"si":0,"no":7,"abstencion":0,"noVota":0,"color":"#06b6d4"},{"groupName":"G.P. Euskal Herria Bildu","totalSeats":6,"si":0,"no":6,"abstencion":0,"noVota":0,"color":"#84cc16"},{"groupName":"G.P. Vasco (EAJ-PNV)","totalSeats":5,"si":0,"no":5,"abstencion":0,"noVota":0,"color":"#10b981"},{"groupName":"G.P. Mixto (Podemos/BNG/CC/UPN)","totalSeats":7,"si":0,"no":4,"abstencion":0,"noVota":3,"color":"#8b5cf6"}],
    bocgUrl: "https://www.congreso.es/datos-abiertos",
    expedienteNumber: "121/20260916",
  },
  {
    id: "congreso-2026-09-16-2",
    title: "Defensa de Cuba: Impacto en la economía y derechos",
    officialTitle: "Proposición no de Ley del Grupo Parlamentario Plurinacional SUMAR, contra las medidas de coerción de Estados Unidos contra Cuba y la defensa del derecho internacional, la soberanía y la paz.\nSe vota en los términos resultantes de la incorporación de la enmienda presentada por el Grupo Parlamentario Socialista.",
    chamber: "congreso",
    date: "2026-09-16",
    time: "18:00 h",
    type: "mocion",
    status: "rechazado",
    category: "Vivienda",
    summary: "El Congreso votará sobre una propuesta que busca proteger a los ciudadanos de las sanciones de EE.UU. contra Cuba, lo que podría beneficiar a los consumidores al evitar el aumento de precios en bienes importados.",
    isOmnibus: false,
    threeKeys: {
      "what": "La iniciativa busca proteger a los ciudadanos de las sanciones de EE.UU. contra Cuba.",
      "pocket": "Los ciudadanos podrían verse beneficiados al evitar el aumento de precios en bienes importados.",
      "clash": "Defensores argumentan que las sanciones afectan a la economía cubana, mientras que opositores temen que apoyarlas podría socavar la soberanía."
},
    beforeVsAfter: {
      "before": "Antes, los ciudadanos enfrentaban el riesgo de aumentos en los precios de bienes importados debido a las sanciones.",
      "after": "Con la nueva regulación, se espera que los costos de vida no aumenten tanto, protegiendo los bolsillos de los ciudadanos."
},
    measures: [
      {
            "id": "congreso-2026-09-16-2-m1",
            "title": "Protección contra sanciones",
            "category": "Economía",
            "plainDescription": "La medida busca proteger a los ciudadanos de las sanciones de EE.UU. contra Cuba, evitando el aumento de precios en bienes importados.",
            "whoIsAffected": [
                  "Consumidores",
                  "Pequeños comerciantes"
            ],
            "realWorldExample": "Juan, un pequeño comerciante, ha notado que los precios de los productos importados han aumentado significativamente en los últimos meses. Con la nueva regulación, espera que estos aumentos se reduzcan, permitiéndole mantener sus precios más competitivos y protegiendo su negocio.",
            "argumentsPro": [
                  "Asegurar la estabilidad económica",
                  "Evitar el aumento de costos de vida"
            ],
            "argumentsContra": [
                  "Posible apoyo a un régimen criticado",
                  "Riesgo de socavar la soberanía"
            ]
      }
],
    votesSummary: {"si":163,"no":170,"abstencion":13,"noVota":4,"total":350},
    groupVotes: [{"groupName":"G.P. Popular (PP)","totalSeats":137,"si":137,"no":0,"abstencion":0,"noVota":0,"color":"#0ea5e9"},{"groupName":"G.P. Socialista (PSOE)","totalSeats":121,"si":26,"no":95,"abstencion":0,"noVota":0,"color":"#ef4444"},{"groupName":"G.P. VOX","totalSeats":33,"si":0,"no":33,"abstencion":0,"noVota":0,"color":"#22c55e"},{"groupName":"G.P. Plurinacional Sumar","totalSeats":27,"si":0,"no":27,"abstencion":0,"noVota":0,"color":"#ec4899"},{"groupName":"G.P. Republicano (ERC)","totalSeats":7,"si":0,"no":7,"abstencion":0,"noVota":0,"color":"#f59e0b"},{"groupName":"G.P. Junts per Catalunya","totalSeats":7,"si":0,"no":7,"abstencion":0,"noVota":0,"color":"#06b6d4"},{"groupName":"G.P. Euskal Herria Bildu","totalSeats":6,"si":0,"no":1,"abstencion":5,"noVota":0,"color":"#84cc16"},{"groupName":"G.P. Vasco (EAJ-PNV)","totalSeats":5,"si":0,"no":0,"abstencion":5,"noVota":0,"color":"#10b981"},{"groupName":"G.P. Mixto (Podemos/BNG/CC/UPN)","totalSeats":7,"si":0,"no":0,"abstencion":3,"noVota":4,"color":"#8b5cf6"}],
    bocgUrl: "https://www.congreso.es/datos-abiertos",
    expedienteNumber: "121/20260916",
  },
  {
    id: "congreso-2026-09-16-3",
    title: "Moción urgente sobre el encarecimiento de la vida",
    officialTitle: "Moción consecuencia de interpelación urgente del Grupo Parlamentario Mixto (Sra. Belarra Urteaga), relativa a los planes del Gobierno sobre el encarecimiento de la vida.",
    chamber: "congreso",
    date: "2026-09-16",
    time: "18:00 h",
    type: "mocion",
    status: "rechazado",
    category: "Vivienda",
    summary: "El Congreso debate sobre medidas para aliviar el encarecimiento de la vida, con el objetivo de mejorar la situación de familias y jóvenes. Se espera que estas medidas beneficien a los inquilinos y a los más vulnerables, aunque se plantean preocupaciones sobre su impacto en el mercado inmobiliario.",
    isOmnibus: false,
    threeKeys: {
      "what": "La moción busca abordar el encarecimiento de la vida mediante medidas urgentes.",
      "pocket": "Se espera que las medidas ayuden a reducir el coste de vida, especialmente en alquileres y servicios básicos.",
      "clash": "Los partidos discuten entre medidas que buscan aliviar la situación de los ciudadanos y propuestas que defienden la estabilidad del mercado inmobiliario."
},
    beforeVsAfter: {
      "before": "Antes, muchos ciudadanos enfrentaban un encarecimiento significativo en servicios básicos y alquileres.",
      "after": "Con la nueva regulación, se espera que los costes de vida se reduzcan, mejorando la calidad de vida de los ciudadanos."
},
    measures: [
      {
            "id": "congreso-2026-09-16-3-m1",
            "title": "Plan de alivio al encarecimiento del alquiler",
            "category": "Alquileres",
            "plainDescription": "Se establecen límites máximos para los alquileres y se implementan ayudas económicas para los inquilinos.",
            "whoIsAffected": [
                  "Inquilinos",
                  "Familias con bajos ingresos"
            ],
            "realWorldExample": "María, una trabajadora autónoma, se beneficiará de una subvención que le permitirá reducir sus pagos de alquiler en 200 euros al mes, lo que le permitirá ahorrar en otros gastos esenciales.",
            "argumentsPro": [
                  "Ayuda a los inquilinos a reducir sus gastos",
                  "Mejora la calidad de vida de los más vulnerables"
            ],
            "argumentsContra": [
                  "Podría limitar la oferta de alquileres",
                  "Puede afectar la estabilidad del mercado inmobiliario"
            ]
      }
],
    votesSummary: {"si":19,"no":183,"abstencion":144,"noVota":4,"total":350},
    groupVotes: [{"groupName":"G.P. Popular (PP)","totalSeats":137,"si":19,"no":118,"abstencion":0,"noVota":0,"color":"#0ea5e9"},{"groupName":"G.P. Socialista (PSOE)","totalSeats":121,"si":0,"no":65,"abstencion":56,"noVota":0,"color":"#ef4444"},{"groupName":"G.P. VOX","totalSeats":33,"si":0,"no":0,"abstencion":33,"noVota":0,"color":"#22c55e"},{"groupName":"G.P. Plurinacional Sumar","totalSeats":27,"si":0,"no":0,"abstencion":27,"noVota":0,"color":"#ec4899"},{"groupName":"G.P. Republicano (ERC)","totalSeats":7,"si":0,"no":0,"abstencion":7,"noVota":0,"color":"#f59e0b"},{"groupName":"G.P. Junts per Catalunya","totalSeats":7,"si":0,"no":0,"abstencion":7,"noVota":0,"color":"#06b6d4"},{"groupName":"G.P. Euskal Herria Bildu","totalSeats":6,"si":0,"no":0,"abstencion":6,"noVota":0,"color":"#84cc16"},{"groupName":"G.P. Vasco (EAJ-PNV)","totalSeats":5,"si":0,"no":0,"abstencion":5,"noVota":0,"color":"#10b981"},{"groupName":"G.P. Mixto (Podemos/BNG/CC/UPN)","totalSeats":7,"si":0,"no":0,"abstencion":3,"noVota":4,"color":"#8b5cf6"}],
    bocgUrl: "https://www.congreso.es/datos-abiertos",
    expedienteNumber: "121/20260916",
  },
  {
    id: "congreso-2026-09-16-4",
    title: "VOX pide medidas urgentes para seguridad en Ceuta",
    officialTitle: "Moción consecuencia de interpelación urgente del Grupo Parlamentario VOX, sobre las medidas que va a adoptar el Gobierno para revertir la situación de inseguridad ocasionada por la invasión en Ceuta.",
    chamber: "congreso",
    date: "2026-09-16",
    time: "18:00 h",
    type: "mocion",
    status: "rechazado",
    category: "Seguridad",
    summary: "El Congreso debatirá sobre medidas urgentes para mejorar la seguridad en Ceuta, afectando directamente la sensación de bienestar de los ciudadanos.",
    isOmnibus: false,
    threeKeys: {
      "what": "La moción busca medidas rápidas para mejorar la situación de inseguridad en Ceuta.",
      "pocket": "No se prevé un impacto directo en el bolsillo de los ciudadanos, pero la sensación de seguridad es crucial.",
      "clash": "El Gobierno defiende un enfoque integral, mientras VOX pide medidas más drásticas y urgentes."
},
    beforeVsAfter: {
      "before": "La inseguridad en Ceuta ha aumentado, afectando la tranquilidad de los ciudadanos.",
      "after": "Se espera una mejora en la seguridad, lo que permitirá una mayor sensación de tranquilidad."
},
    measures: [
      {
            "id": "congreso-2026-09-16-4-m1",
            "title": "Plan de vigilancia y prevención",
            "category": "Seguridad",
            "plainDescription": "El plan busca incrementar la presencia policial y mejorar la prevención de incidentes en Ceuta.",
            "whoIsAffected": [
                  "Ciudadanos de Ceuta",
                  "Turistas"
            ],
            "realWorldExample": "Juan, un residente de Ceuta, se siente más seguro al ver más policías en la ciudad y notar un aumento en la vigilancia nocturna. Los turistas, como María, también valoran la sensación de mayor seguridad al visitar la ciudad.",
            "argumentsPro": [
                  "Mejora la sensación de seguridad de los ciudadanos",
                  "Prevención de incidentes"
            ],
            "argumentsContra": [
                  "Costo adicional para el presupuesto",
                  "Necesidad de una evaluación de impacto antes de implementar medidas drásticas"
            ]
      }
],
    votesSummary: {"si":33,"no":174,"abstencion":137,"noVota":6,"total":350},
    groupVotes: [{"groupName":"G.P. Popular (PP)","totalSeats":137,"si":33,"no":104,"abstencion":0,"noVota":0,"color":"#0ea5e9"},{"groupName":"G.P. Socialista (PSOE)","totalSeats":121,"si":0,"no":70,"abstencion":51,"noVota":0,"color":"#ef4444"},{"groupName":"G.P. VOX","totalSeats":33,"si":0,"no":0,"abstencion":33,"noVota":0,"color":"#22c55e"},{"groupName":"G.P. Plurinacional Sumar","totalSeats":27,"si":0,"no":0,"abstencion":27,"noVota":0,"color":"#ec4899"},{"groupName":"G.P. Republicano (ERC)","totalSeats":7,"si":0,"no":0,"abstencion":7,"noVota":0,"color":"#f59e0b"},{"groupName":"G.P. Junts per Catalunya","totalSeats":7,"si":0,"no":0,"abstencion":7,"noVota":0,"color":"#06b6d4"},{"groupName":"G.P. Euskal Herria Bildu","totalSeats":6,"si":0,"no":0,"abstencion":6,"noVota":0,"color":"#84cc16"},{"groupName":"G.P. Vasco (EAJ-PNV)","totalSeats":5,"si":0,"no":0,"abstencion":5,"noVota":0,"color":"#10b981"},{"groupName":"G.P. Mixto (Podemos/BNG/CC/UPN)","totalSeats":7,"si":0,"no":0,"abstencion":1,"noVota":6,"color":"#8b5cf6"}],
    bocgUrl: "https://www.congreso.es/datos-abiertos",
    expedienteNumber: "121/20260916",
  },
  {
    id: "congreso-2026-09-16-5",
    title: "Ceuta: Urgente ayuda para alquileres y precios de vivienda",
    officialTitle: "Moción consecuencia de interpelación urgente del Grupo Parlamentario Popular en el Congreso, sobre la crisis que atraviesa la Ciudad Autónoma de Ceuta.",
    chamber: "congreso",
    date: "2026-09-16",
    time: "18:00 h",
    type: "mocion",
    status: "aprobado",
    category: "Vivienda",
    summary: "El Congreso debatirá sobre la regulación del alquiler y el precio de la vivienda en Ceuta, buscando aliviar la presión financiera sobre los inquilinos y encontrar un equilibrio con los derechos de los propietarios.",
    isOmnibus: false,
    threeKeys: {
      "what": "La moción busca regular el alquiler y el precio de la vivienda en Ceuta.",
      "pocket": "Los inquilinos podrían ver alivio en los precios, mientras que los propietarios podrían verse afectados por medidas restrictivas.",
      "clash": "Inquilinos y propietarios buscan equilibrio: bajos precios y estabilidad para los primeros, rentabilidad y derechos para los segundos."
},
    beforeVsAfter: {
      "before": "En Ceuta, los alquileres y precios de la vivienda han subido drásticamente, afectando a miles de familias.",
      "after": "Con la nueva regulación, se espera que los precios se estabilicen y se ofrezcan más opciones de alquiler asequibles."
},
    measures: [
      {
            "id": "congreso-2026-09-16-5-m1",
            "title": "Regulación del alquiler en Ceuta",
            "category": "Alquiler",
            "plainDescription": "La medida busca establecer un marco legal para el alquiler en Ceuta, limitando subidas excesivas y protegiendo a los inquilinos.",
            "whoIsAffected": [
                  "Inquilinos",
                  "Propietarios"
            ],
            "realWorldExample": "Juan, un estudiante universitario, podría ver cómo su alquiler se mantiene estable a pesar de la inflación, mientras que María, una propietaria, podría verse obligada a aceptar un menor rendimiento en sus inmuebles.",
            "argumentsPro": [
                  "Bajar la presión financiera sobre los inquilinos",
                  "Garantizar estabilidad en el alquiler"
            ],
            "argumentsContra": [
                  "Puede afectar la rentabilidad de los propietarios",
                  "Posible desincentivo para la inversión en viviendas"
            ]
      }
],
    votesSummary: {"si":184,"no":149,"abstencion":11,"noVota":6,"total":350},
    groupVotes: [{"groupName":"G.P. Popular (PP)","totalSeats":137,"si":137,"no":0,"abstencion":0,"noVota":0,"color":"#0ea5e9"},{"groupName":"G.P. Socialista (PSOE)","totalSeats":121,"si":47,"no":74,"abstencion":0,"noVota":0,"color":"#ef4444"},{"groupName":"G.P. VOX","totalSeats":33,"si":0,"no":33,"abstencion":0,"noVota":0,"color":"#22c55e"},{"groupName":"G.P. Plurinacional Sumar","totalSeats":27,"si":0,"no":27,"abstencion":0,"noVota":0,"color":"#ec4899"},{"groupName":"G.P. Republicano (ERC)","totalSeats":7,"si":0,"no":7,"abstencion":0,"noVota":0,"color":"#f59e0b"},{"groupName":"G.P. Junts per Catalunya","totalSeats":7,"si":0,"no":7,"abstencion":0,"noVota":0,"color":"#06b6d4"},{"groupName":"G.P. Euskal Herria Bildu","totalSeats":6,"si":0,"no":1,"abstencion":5,"noVota":0,"color":"#84cc16"},{"groupName":"G.P. Vasco (EAJ-PNV)","totalSeats":5,"si":0,"no":0,"abstencion":5,"noVota":0,"color":"#10b981"},{"groupName":"G.P. Mixto (Podemos/BNG/CC/UPN)","totalSeats":7,"si":0,"no":0,"abstencion":1,"noVota":6,"color":"#8b5cf6"}],
    bocgUrl: "https://www.congreso.es/datos-abiertos",
    expedienteNumber: "121/20260916",
  },
  {
    id: "congreso-2026-09-16-6",
    title: "Gobierno debe explicar retraso en obras del Canal de Navarra",
    officialTitle: "Moción consecuencia de interpelación urgente del Grupo Parlamentario Mixto (Sr. Catalán Higueras), para que el Gobierno explique los motivos por los que el Ministerio para la Transición Ecológica y el Reto Demográfico no ha cumplido el mandato parlamentario de establecer un cronograma para la licitación y adjudicación de las obras de la segunda fase del Canal de Navarra.",
    chamber: "congreso",
    date: "2026-09-16",
    time: "18:00 h",
    type: "mocion",
    status: "aprobado",
    category: "Vivienda",
    summary: "El Congreso discutirá si el Ministerio para la Transición Ecológica y el Reto Demográfico justifica el retraso en la licitación de obras para mejorar viviendas, afectando a inquilinos y propietarios.",
    isOmnibus: false,
    threeKeys: {
      "what": "El Gobierno debe justificar el retraso en la licitación de obras para mejorar viviendas.",
      "pocket": "Los inquilinos y propietarios podrían verse afectados por el retraso en mejoras y obras.",
      "clash": "Inquilinos temen por el mantenimiento de sus viviendas, mientras propietarios buscan garantías de inversión."
},
    beforeVsAfter: {
      "before": "Antes, los inquilinos y propietarios vivían con la incertidumbre de cuándo se mejorarían sus viviendas.",
      "after": "Ahora, se espera que se aclaren los motivos y se establezca un cronograma para las obras."
},
    measures: [
      {
            "id": "congreso-2026-09-16-6-m1",
            "title": "Explicación del retraso en obras",
            "category": "Infraestructuras",
            "plainDescription": "El Gobierno debe presentar un informe detallado sobre los motivos del retraso en la licitación de obras para mejorar viviendas.",
            "whoIsAffected": [
                  "Inquilinos",
                  "Propietarios"
            ],
            "realWorldExample": "Juan, un inquilino, ha vivido durante meses con el ruido y la suciedad de obras paradas en su edificio. Mientras, María, propietaria de un piso, se preocupa por la falta de mantenimiento y el deterioro de su vivienda.",
            "argumentsPro": [
                  "Inquilinos y propietarios necesitan garantías de que sus viviendas serán mejoradas",
                  "Mantenimiento y seguridad en las viviendas son fundamentales"
            ],
            "argumentsContra": [
                  "Se debe investigar si hay razones técnicas o presupuestarias justificadas para el retraso",
                  "Es importante no precipitar decisiones que puedan afectar a los presupuestos del Estado"
            ]
      }
],
    votesSummary: {"si":172,"no":17,"abstencion":157,"noVota":4,"total":350},
    groupVotes: [{"groupName":"G.P. Popular (PP)","totalSeats":137,"si":137,"no":0,"abstencion":0,"noVota":0,"color":"#0ea5e9"},{"groupName":"G.P. Socialista (PSOE)","totalSeats":121,"si":35,"no":17,"abstencion":69,"noVota":0,"color":"#ef4444"},{"groupName":"G.P. VOX","totalSeats":33,"si":0,"no":0,"abstencion":33,"noVota":0,"color":"#22c55e"},{"groupName":"G.P. Plurinacional Sumar","totalSeats":27,"si":0,"no":0,"abstencion":27,"noVota":0,"color":"#ec4899"},{"groupName":"G.P. Republicano (ERC)","totalSeats":7,"si":0,"no":0,"abstencion":7,"noVota":0,"color":"#f59e0b"},{"groupName":"G.P. Junts per Catalunya","totalSeats":7,"si":0,"no":0,"abstencion":7,"noVota":0,"color":"#06b6d4"},{"groupName":"G.P. Euskal Herria Bildu","totalSeats":6,"si":0,"no":0,"abstencion":6,"noVota":0,"color":"#84cc16"},{"groupName":"G.P. Vasco (EAJ-PNV)","totalSeats":5,"si":0,"no":0,"abstencion":5,"noVota":0,"color":"#10b981"},{"groupName":"G.P. Mixto (Podemos/BNG/CC/UPN)","totalSeats":7,"si":0,"no":0,"abstencion":3,"noVota":4,"color":"#8b5cf6"}],
    bocgUrl: "https://www.congreso.es/datos-abiertos",
    expedienteNumber: "121/20260916",
  },
  {
    id: "congreso-2026-09-16-7",
    title: "Transparencia en negocios: protege a todos",
    officialTitle: "Real Decreto-ley 21/2026, de 25 de agosto, de transparencia e integridad de las actividades de los grupos de interés.",
    chamber: "congreso",
    date: "2026-09-16",
    time: "18:00 h",
    type: "real_decreto_ley",
    status: "rechazado",
    category: "Justicia",
    summary: "El Congreso aprueba un real decreto-ley para mayor transparencia, mejorando la confianza entre ciudadanos y políticos. Esto supone un cambio positivo en cómo se manejan las relaciones entre grupos de interés y el gobierno.",
    isOmnibus: true,
    threeKeys: {
      "what": "Establece reglas claras para grupos de interés, asegurando transparencia.",
      "pocket": "Ayuda a evitar conflictos de interés, mejorando la confianza entre ciudadanos y empresas.",
      "clash": "Defensores ven una protección contra influencias indebidas, mientras que opositores temen restricciones innecesarias."
},
    beforeVsAfter: {
      "before": "Antes, la influencia de grupos de interés a veces era poco transparente, generando dudas.",
      "after": "Ahora, las relaciones entre grupos de interés y el gobierno serán más claras, fomentando confianza."
},
    measures: [
      {
            "id": "congreso-2026-09-16-7-m1",
            "title": "Reglas claras para grupos de interés",
            "category": "Transparencia",
            "plainDescription": "Establece normas para grupos de interés para evitar conflictos de interés y mejorar la transparencia.",
            "whoIsAffected": [
                  "Grupos de interés",
                  "Ciudadanos"
            ],
            "realWorldExample": "Un empresario local, Juan, se siente más seguro al saber que las decisiones del gobierno sobre su sector son tomadas de manera transparente y sin influencias indebidas. Antes, se sentía incierto sobre las intenciones de algunos grupos de interés.",
            "argumentsPro": [
                  "Prevención de conflictos de interés",
                  "Mejora la confianza entre ciudadanos y políticos"
            ],
            "argumentsContra": [
                  "Posibles restricciones innecesarias",
                  "Puede limitar la influencia de grupos de interés valiosos"
            ]
      }
],
    votesSummary: {"si":155,"no":179,"abstencion":12,"noVota":4,"total":350},
    groupVotes: [{"groupName":"G.P. Popular (PP)","totalSeats":137,"si":137,"no":0,"abstencion":0,"noVota":0,"color":"#0ea5e9"},{"groupName":"G.P. Socialista (PSOE)","totalSeats":121,"si":18,"no":103,"abstencion":0,"noVota":0,"color":"#ef4444"},{"groupName":"G.P. VOX","totalSeats":33,"si":0,"no":33,"abstencion":0,"noVota":0,"color":"#22c55e"},{"groupName":"G.P. Plurinacional Sumar","totalSeats":27,"si":0,"no":27,"abstencion":0,"noVota":0,"color":"#ec4899"},{"groupName":"G.P. Republicano (ERC)","totalSeats":7,"si":0,"no":7,"abstencion":0,"noVota":0,"color":"#f59e0b"},{"groupName":"G.P. Junts per Catalunya","totalSeats":7,"si":0,"no":7,"abstencion":0,"noVota":0,"color":"#06b6d4"},{"groupName":"G.P. Euskal Herria Bildu","totalSeats":6,"si":0,"no":2,"abstencion":4,"noVota":0,"color":"#84cc16"},{"groupName":"G.P. Vasco (EAJ-PNV)","totalSeats":5,"si":0,"no":0,"abstencion":5,"noVota":0,"color":"#10b981"},{"groupName":"G.P. Mixto (Podemos/BNG/CC/UPN)","totalSeats":7,"si":0,"no":0,"abstencion":3,"noVota":4,"color":"#8b5cf6"}],
    bocgUrl: "https://www.congreso.es/datos-abiertos",
    expedienteNumber: "121/20260916",
  },
  {
    id: "congreso-2026-09-16-8",
    title: "Ayuda urgente a Ceuta: medidas sociales y económicas",
    officialTitle: "Real Decreto-ley 22/2026, de 1 de septiembre, por el que se aprueban medidas urgentes de carácter social y económico de apoyo a la ciudad de Ceuta.",
    chamber: "congreso",
    date: "2026-09-16",
    time: "18:00 h",
    type: "real_decreto_ley",
    status: "aprobado",
    category: "Economía",
    summary: "El Congreso aprueba un Real Decreto-ley para ayudar a Ceuta con medidas económicas. Esto supone un alivio para los comercios y autónomos, mejorando su capacidad para mantener sus negocios.",
    isOmnibus: true,
    threeKeys: {
      "what": "Se aprueban medidas urgentes para apoyar a Ceuta económicamente.",
      "pocket": "Ayudas directas a autónomos y pequeños comerciantes, reducción del IBI para viviendas.",
      "clash": "Autónomos y pequeños comerciantes agradecen el apoyo, mientras que propietarios inmobiliarios temen un aumento de costes."
},
    beforeVsAfter: {
      "before": "Antes, los comerciantes y autónomos de Ceuta enfrentaban dificultades económicas.",
      "after": "Ahora, se espera una mejora en la situación financiera de los pequeños empresarios y comerciantes."
},
    measures: [
      {
            "id": "congreso-2026-09-16-8-m1",
            "title": "Ayuda directa a autónomos y pequeños comerciantes",
            "category": "Emprendedores",
            "plainDescription": "Se establece un plan de ayudas económicas para apoyar a autónomos y pequeños comerciantes.",
            "whoIsAffected": [
                  "Autónomos",
                  "Pequeños comerciantes"
            ],
            "realWorldExample": "Juan, un pequeño comerciante de Ceuta, recibirá una ayuda de 500 euros mensuales durante los próximos 6 meses, lo que le permitirá mantener su negocio abierto y pagar sus gastos fijos.",
            "argumentsPro": [
                  "Ayuda a mantener empleos en la ciudad",
                  "Alivio temporal para las finanzas de los pequeños empresarios"
            ],
            "argumentsContra": [
                  "Posible aumento de costes para los consumidores",
                  "Incertidumbre sobre el impacto a largo plazo"
            ]
      }
],
    votesSummary: {"si":304,"no":33,"abstencion":7,"noVota":6,"total":350},
    groupVotes: [{"groupName":"G.P. Popular (PP)","totalSeats":137,"si":137,"no":0,"abstencion":0,"noVota":0,"color":"#0ea5e9"},{"groupName":"G.P. Socialista (PSOE)","totalSeats":121,"si":121,"no":0,"abstencion":0,"noVota":0,"color":"#ef4444"},{"groupName":"G.P. VOX","totalSeats":33,"si":33,"no":0,"abstencion":0,"noVota":0,"color":"#22c55e"},{"groupName":"G.P. Plurinacional Sumar","totalSeats":27,"si":13,"no":14,"abstencion":0,"noVota":0,"color":"#ec4899"},{"groupName":"G.P. Republicano (ERC)","totalSeats":7,"si":0,"no":7,"abstencion":0,"noVota":0,"color":"#f59e0b"},{"groupName":"G.P. Junts per Catalunya","totalSeats":7,"si":0,"no":7,"abstencion":0,"noVota":0,"color":"#06b6d4"},{"groupName":"G.P. Euskal Herria Bildu","totalSeats":6,"si":0,"no":5,"abstencion":1,"noVota":0,"color":"#84cc16"},{"groupName":"G.P. Vasco (EAJ-PNV)","totalSeats":5,"si":0,"no":0,"abstencion":5,"noVota":0,"color":"#10b981"},{"groupName":"G.P. Mixto (Podemos/BNG/CC/UPN)","totalSeats":7,"si":0,"no":0,"abstencion":1,"noVota":6,"color":"#8b5cf6"}],
    bocgUrl: "https://www.congreso.es/datos-abiertos",
    expedienteNumber: "121/20260916",
  },
  {
    id: "congreso-2026-09-16-9",
    title: "Ayuda urgente a Ceuta: medidas sociales y económicas",
    officialTitle: "Tramitación como Proyecto de Ley por el procedimiento de urgencia del Real Decreto-ley 22/2026, de 1 de septiembre, por el que se aprueban medidas urgentes de carácter social y económico de apoyo a la ciudad de Ceuta.",
    chamber: "congreso",
    date: "2026-09-16",
    time: "18:00 h",
    type: "real_decreto_ley",
    status: "aprobado",
    category: "Economía",
    summary: "El Congreso aprueba medidas urgentes para apoyar a Ceuta económicamente, incluyendo subvenciones para autónomos y pequeños comerciantes, mejorando su situación diaria.",
    isOmnibus: true,
    threeKeys: {
      "what": "Se aprueban medidas urgentes para apoyar a Ceuta económicamente.",
      "pocket": "Ayuda directa a autónomos y pequeños comerciantes con subvenciones.",
      "clash": "Autónomos y pequeños comerciantes agradecen la ayuda, mientras que algunos temen que no sea suficiente."
},
    beforeVsAfter: {
      "before": "Antes, muchos autónomos y pequeños comerciantes en Ceuta luchaban para sobrevivir.",
      "after": "Ahora, podrán acceder a subvenciones que les ayudarán a mantener sus negocios."
},
    measures: [
      {
            "id": "congreso-2026-09-16-9-m1",
            "title": "Subvenciones para autónomos y pequeños comerciantes",
            "category": "Economía",
            "plainDescription": "Se establecen subvenciones para ayudar a autónomos y pequeños comerciantes a mantener sus negocios.",
            "whoIsAffected": [
                  "Autónomos",
                  "Pequeños comerciantes"
            ],
            "realWorldExample": "Juan, un pequeño vendedor de flores en Ceuta, recibirá una subvención de 5.000 euros para mantener su negocio abierto y seguir alimentando a su familia.",
            "argumentsPro": [
                  "Ayuda a mantener empleos y pequeñas empresas en Ceuta",
                  "Alivio financiero crucial para sobrevivir"
            ],
            "argumentsContra": [
                  "Posible desigualdad si no todos pueden acceder",
                  "Necesidad de supervisión para evitar abusos"
            ]
      }
],
    votesSummary: {"si":345,"no":0,"abstencion":0,"noVota":5,"total":350},
    groupVotes: [{"groupName":"G.P. Popular (PP)","totalSeats":137,"si":137,"no":0,"abstencion":0,"noVota":0,"color":"#0ea5e9"},{"groupName":"G.P. Socialista (PSOE)","totalSeats":121,"si":121,"no":0,"abstencion":0,"noVota":0,"color":"#ef4444"},{"groupName":"G.P. VOX","totalSeats":33,"si":33,"no":0,"abstencion":0,"noVota":0,"color":"#22c55e"},{"groupName":"G.P. Plurinacional Sumar","totalSeats":27,"si":27,"no":0,"abstencion":0,"noVota":0,"color":"#ec4899"},{"groupName":"G.P. Republicano (ERC)","totalSeats":7,"si":7,"no":0,"abstencion":0,"noVota":0,"color":"#f59e0b"},{"groupName":"G.P. Junts per Catalunya","totalSeats":7,"si":7,"no":0,"abstencion":0,"noVota":0,"color":"#06b6d4"},{"groupName":"G.P. Euskal Herria Bildu","totalSeats":6,"si":6,"no":0,"abstencion":0,"noVota":0,"color":"#84cc16"},{"groupName":"G.P. Vasco (EAJ-PNV)","totalSeats":5,"si":5,"no":0,"abstencion":0,"noVota":0,"color":"#10b981"},{"groupName":"G.P. Mixto (Podemos/BNG/CC/UPN)","totalSeats":7,"si":2,"no":0,"abstencion":0,"noVota":5,"color":"#8b5cf6"}],
    bocgUrl: "https://www.congreso.es/datos-abiertos",
    expedienteNumber: "121/20260916",
  },
  {
    id: "congreso-2026-09-16-10",
    title: "Mejoras para personas con discapacidad: autonomía y accesibilidad",
    officialTitle: "Proyecto de Ley por la que se modifican el Texto Refundido de la Ley General de derechos de las personas con discapacidad y de su inclusión social, aprobado por el Real Decreto Legislativo 1/2013, de 29 de noviembre, y la Ley 39/2006, de 14 de diciembre, de Promoción de la Autonomía Personal y Atención a las personas en situación de dependencia, para la extensión y refuerzo de los derechos de las personas con discapacidad a la inclusión, la autonomía y la accesibilidad universal conforme al artículo 49 de la Constitución Española.",
    chamber: "congreso",
    date: "2026-09-16",
    time: "18:00 h",
    type: "mocion",
    status: "aprobado",
    category: "Cuidados",
    summary: "El Congreso aprueba medidas para extender y refuerzar los derechos de personas con discapacidad, mejorando su autonomía y accesibilidad. Esto supone un paso hacia una sociedad más inclusiva y equitativa.",
    isOmnibus: false,
    threeKeys: {
      "what": "Se refuerzan derechos para personas con discapacidad en autonomía y accesibilidad.",
      "pocket": "Se prevé financiación para infraestructuras accesibles y servicios de apoyo.",
      "clash": "Inquilinos y propietarios buscan equilibrar el coste de adaptaciones necesarias."
},
    beforeVsAfter: {
      "before": "Antes, personas con discapacidad enfrentaban barreras en su día a día.",
      "after": "Ahora, se facilita la inclusión y autonomía, mejorando la calidad de vida."
},
    measures: [
      {
            "id": "congreso-2026-09-16-10-m1",
            "title": "Fomento de infraestructuras accesibles",
            "category": "Accesibilidad",
            "plainDescription": "Se establecen ayudas para la adaptación de viviendas y espacios públicos a personas con discapacidad.",
            "whoIsAffected": [
                  "Personas con discapacidad",
                  "Familias con miembros con discapacidad"
            ],
            "realWorldExample": "Juan, un joven con discapacidad motora, podrá adaptar su vivienda para que sea más accesible, lo que le permitirá vivir de manera más independiente y con mayor calidad de vida. Esto costará alrededor de 15.000 euros, pero contará con subvenciones del 50%.",
            "argumentsPro": [
                  "Mejora la calidad de vida de personas con discapacidad",
                  "Facilita su independencia y autonomía"
            ],
            "argumentsContra": [
                  "Costo para propietarios que deben asumir adaptaciones",
                  "Inquietud sobre el uso de fondos públicos"
            ]
      }
],
    votesSummary: {"si":338,"no":0,"abstencion":8,"noVota":4,"total":350},
    groupVotes: [{"groupName":"G.P. Popular (PP)","totalSeats":137,"si":137,"no":0,"abstencion":0,"noVota":0,"color":"#0ea5e9"},{"groupName":"G.P. Socialista (PSOE)","totalSeats":121,"si":121,"no":0,"abstencion":0,"noVota":0,"color":"#ef4444"},{"groupName":"G.P. VOX","totalSeats":33,"si":33,"no":0,"abstencion":0,"noVota":0,"color":"#22c55e"},{"groupName":"G.P. Plurinacional Sumar","totalSeats":27,"si":27,"no":0,"abstencion":0,"noVota":0,"color":"#ec4899"},{"groupName":"G.P. Republicano (ERC)","totalSeats":7,"si":7,"no":0,"abstencion":0,"noVota":0,"color":"#f59e0b"},{"groupName":"G.P. Junts per Catalunya","totalSeats":7,"si":7,"no":0,"abstencion":0,"noVota":0,"color":"#06b6d4"},{"groupName":"G.P. Euskal Herria Bildu","totalSeats":6,"si":6,"no":0,"abstencion":0,"noVota":0,"color":"#84cc16"},{"groupName":"G.P. Vasco (EAJ-PNV)","totalSeats":5,"si":0,"no":0,"abstencion":5,"noVota":0,"color":"#10b981"},{"groupName":"G.P. Mixto (Podemos/BNG/CC/UPN)","totalSeats":7,"si":0,"no":0,"abstencion":3,"noVota":4,"color":"#8b5cf6"}],
    bocgUrl: "https://www.congreso.es/datos-abiertos",
    expedienteNumber: "121/20260916",
  },
  {
    id: "congreso-2026-09-16-11",
    title: "Dictamen sobre actividades parlamentarias: impacto en el bolsillo y en la vida",
    officialTitle: "Dictamen de la Comisión del Estatuto sobre declaración de actividades de Excmos. Sres. Diputados.",
    chamber: "congreso",
    date: "2026-09-16",
    time: "18:00 h",
    type: "proyecto_ley",
    status: "aprobado",
    category: "Tráfico",
    summary: "El Congreso aprueba un dictamen para regular las actividades de los diputados, buscando aumentar la transparencia y la confianza en la institución. Esto beneficiará a los ciudadanos al garantizar que sus representantes actúen con integridad.",
    isOmnibus: false,
    threeKeys: {
      "what": "Regula las actividades de los diputados para evitar conflictos de interés.",
      "pocket": "Los cambios no afectarán directamente al bolsillo de los ciudadanos, pero sí a la confianza en la transparencia del Congreso.",
      "clash": "Los partidos defienden la necesidad de transparencia, mientras que otros temen que restrinja la libertad de acción de los diputados."
},
    beforeVsAfter: {
      "before": "Antes, los diputados podían participar en actividades que podrían generar conflictos de interés sin restricciones claras.",
      "after": "Ahora, los diputados deben declarar sus actividades y evitar conflictos de interés, mejorando la confianza ciudadana."
},
    measures: [
      {
            "id": "congreso-2026-09-16-11-m1",
            "title": "Declaración de actividades de los diputados",
            "category": "Transparencia",
            "plainDescription": "Los diputados deben declarar sus actividades económicas y profesionales para evitar conflictos de interés.",
            "whoIsAffected": [
                  "Diputados"
            ],
            "realWorldExample": "Un diputado que participa en la gestión de una empresa de consultoría debe declarar esta actividad y no puede tomar decisiones que beneficien a esa empresa.",
            "argumentsPro": [
                  "Aumenta la confianza ciudadana en la integridad de los diputados",
                  "Prevención de conflictos de interés"
            ],
            "argumentsContra": [
                  "Puede limitar la libertad de acción de los diputados",
                  "Proceso de declaración puede ser complejo y administrativo"
            ]
      }
],
    votesSummary: {"si":346,"no":0,"abstencion":1,"noVota":3,"total":350},
    groupVotes: [{"groupName":"G.P. Popular (PP)","totalSeats":137,"si":137,"no":0,"abstencion":0,"noVota":0,"color":"#0ea5e9"},{"groupName":"G.P. Socialista (PSOE)","totalSeats":121,"si":121,"no":0,"abstencion":0,"noVota":0,"color":"#ef4444"},{"groupName":"G.P. VOX","totalSeats":33,"si":33,"no":0,"abstencion":0,"noVota":0,"color":"#22c55e"},{"groupName":"G.P. Plurinacional Sumar","totalSeats":27,"si":27,"no":0,"abstencion":0,"noVota":0,"color":"#ec4899"},{"groupName":"G.P. Republicano (ERC)","totalSeats":7,"si":7,"no":0,"abstencion":0,"noVota":0,"color":"#f59e0b"},{"groupName":"G.P. Junts per Catalunya","totalSeats":7,"si":7,"no":0,"abstencion":0,"noVota":0,"color":"#06b6d4"},{"groupName":"G.P. Euskal Herria Bildu","totalSeats":6,"si":6,"no":0,"abstencion":0,"noVota":0,"color":"#84cc16"},{"groupName":"G.P. Vasco (EAJ-PNV)","totalSeats":5,"si":5,"no":0,"abstencion":0,"noVota":0,"color":"#10b981"},{"groupName":"G.P. Mixto (Podemos/BNG/CC/UPN)","totalSeats":7,"si":3,"no":0,"abstencion":1,"noVota":3,"color":"#8b5cf6"}],
    bocgUrl: "https://www.congreso.es/datos-abiertos",
    expedienteNumber: "121/20260916",
  },
  {
    id: "congreso-2026-09-15-1",
    title: "VOX propone reformar la Ley de Defensa Nacional",
    officialTitle: "Proposición de Ley del Grupo Parlamentario VOX, Orgánica de modificación de la Ley Orgánica 5/2005, de 17 de noviembre, de la Defensa Nacional.",
    chamber: "congreso",
    date: "2026-09-15",
    time: "18:00 h",
    type: "proposicion_ley",
    status: "rechazado",
    category: "Defensa",
    summary: "El Congreso debatirá sobre la reforma de la Ley Orgánica de Defensa Nacional. Las decisiones podrían influir en la postura de España frente a amenazas actuales y futuras.",
    isOmnibus: false,
    threeKeys: {
      "what": "VOX sugiere cambios para fortalecer la seguridad nacional.",
      "pocket": "No afecta directamente al bolsillo de los ciudadanos.",
      "clash": "Defensores ven necesidad de modernización, opositores temen impacto en libertades."
},
    beforeVsAfter: {
      "before": "Actualmente, la ley no ha experimentado modificaciones significativas.",
      "after": "Se espera una mayor adaptación a los desafíos contemporáneos de seguridad."
},
    measures: [
      {
            "id": "congreso-2026-09-15-1-m1",
            "title": "Fortalecimiento de la seguridad nacional",
            "category": "Defensa",
            "plainDescription": "VOX propone actualizar la ley para mejorar la capacidad de respuesta de las Fuerzas Armadas y fortalecer la cooperación internacional.",
            "whoIsAffected": [
                  "Fuerzas Armadas",
                  "Inteligencia Nacional"
            ],
            "realWorldExample": "Un oficial de la Guardia Civil explica: 'Con la nueva ley, podríamos contar con un sistema de alerta más rápido y eficiente, lo que podría salvar vidas en situaciones de emergencia.'",
            "argumentsPro": [
                  "Mejora la capacidad de respuesta ante amenazas actuales",
                  "Fortalece la cooperación con aliados"
            ],
            "argumentsContra": [
                  "Puede limitar libertades individuales",
                  "Posible aumento de gastos militares"
            ]
      }
],
    votesSummary: {"si":168,"no":178,"abstencion":0,"noVota":4,"total":350},
    groupVotes: [{"groupName":"G.P. Popular (PP)","totalSeats":137,"si":137,"no":0,"abstencion":0,"noVota":0,"color":"#0ea5e9"},{"groupName":"G.P. Socialista (PSOE)","totalSeats":121,"si":31,"no":90,"abstencion":0,"noVota":0,"color":"#ef4444"},{"groupName":"G.P. VOX","totalSeats":33,"si":0,"no":33,"abstencion":0,"noVota":0,"color":"#22c55e"},{"groupName":"G.P. Plurinacional Sumar","totalSeats":27,"si":0,"no":27,"abstencion":0,"noVota":0,"color":"#ec4899"},{"groupName":"G.P. Republicano (ERC)","totalSeats":7,"si":0,"no":7,"abstencion":0,"noVota":0,"color":"#f59e0b"},{"groupName":"G.P. Junts per Catalunya","totalSeats":7,"si":0,"no":7,"abstencion":0,"noVota":0,"color":"#06b6d4"},{"groupName":"G.P. Euskal Herria Bildu","totalSeats":6,"si":0,"no":6,"abstencion":0,"noVota":0,"color":"#84cc16"},{"groupName":"G.P. Vasco (EAJ-PNV)","totalSeats":5,"si":0,"no":5,"abstencion":0,"noVota":0,"color":"#10b981"},{"groupName":"G.P. Mixto (Podemos/BNG/CC/UPN)","totalSeats":7,"si":0,"no":3,"abstencion":0,"noVota":4,"color":"#8b5cf6"}],
    bocgUrl: "https://www.congreso.es/datos-abiertos",
    expedienteNumber: "121/20260915",
  },
  {
    id: "congreso-2026-09-15-2",
    title: "Sumar vivienda: un paso hacia la seguridad",
    officialTitle: "Proposición de Ley del Grupo Parlamentario Plurinacional SUMAR, para la modificación de la Ley 12/2023, de 24 de mayo, por el derecho a la vivienda.",
    chamber: "congreso",
    date: "2026-09-15",
    time: "18:00 h",
    type: "proposicion_ley",
    status: "rechazado",
    category: "Vivienda",
    summary: "El Congreso discute la modificación de la Ley 12/2023 para proteger a los inquilinos y dar estabilidad a los propietarios. Esto supone un cambio en la vida diaria, mejorando la seguridad en el alquiler y reduciendo el estrés financiero.",
    isOmnibus: false,
    threeKeys: {
      "what": "La ley busca estabilizar precios y mejorar condiciones de alquiler.",
      "pocket": "Los inquilinos podrían ver reducidos los costes mensuales, mientras que los propietarios tendrían garantías de renta.",
      "clash": "Inquilinos temen alzas excesivas, mientras que propietarios buscan estabilidad."
},
    beforeVsAfter: {
      "before": "Antes, los alquileres subían de manera descontrolada, afectando a familias y jóvenes.",
      "after": "Con la nueva ley, se establecerán límites a las subidas y se garantizarán condiciones más estables."
},
    measures: [
      {
            "id": "congreso-2026-09-15-2-m1",
            "title": "Límites a las subidas de alquiler",
            "category": "Regulación del alquiler",
            "plainDescription": "Se establecerán límites a las subidas de alquiler para proteger a los inquilinos y garantizar estabilidad a los propietarios.",
            "whoIsAffected": [
                  "Inquilinos",
                  "Propietarios"
            ],
            "realWorldExample": "Juan, un estudiante, podría ver sus mensualidades de alquiler estables durante un año, mientras que María, una propietaria, tendría garantías de renta durante el mismo periodo.",
            "argumentsPro": [
                  "Estabilidad financiera para los inquilinos",
                  "Garantía de renta para los propietarios"
            ],
            "argumentsContra": [
                  "Influencia negativa en el mercado inmobiliario",
                  "Posible desincentivo para la inversión en viviendas"
            ]
      }
],
    votesSummary: {"si":44,"no":175,"abstencion":127,"noVota":4,"total":350},
    groupVotes: [{"groupName":"G.P. Popular (PP)","totalSeats":137,"si":44,"no":93,"abstencion":0,"noVota":0,"color":"#0ea5e9"},{"groupName":"G.P. Socialista (PSOE)","totalSeats":121,"si":0,"no":82,"abstencion":39,"noVota":0,"color":"#ef4444"},{"groupName":"G.P. VOX","totalSeats":33,"si":0,"no":0,"abstencion":33,"noVota":0,"color":"#22c55e"},{"groupName":"G.P. Plurinacional Sumar","totalSeats":27,"si":0,"no":0,"abstencion":27,"noVota":0,"color":"#ec4899"},{"groupName":"G.P. Republicano (ERC)","totalSeats":7,"si":0,"no":0,"abstencion":7,"noVota":0,"color":"#f59e0b"},{"groupName":"G.P. Junts per Catalunya","totalSeats":7,"si":0,"no":0,"abstencion":7,"noVota":0,"color":"#06b6d4"},{"groupName":"G.P. Euskal Herria Bildu","totalSeats":6,"si":0,"no":0,"abstencion":6,"noVota":0,"color":"#84cc16"},{"groupName":"G.P. Vasco (EAJ-PNV)","totalSeats":5,"si":0,"no":0,"abstencion":5,"noVota":0,"color":"#10b981"},{"groupName":"G.P. Mixto (Podemos/BNG/CC/UPN)","totalSeats":7,"si":0,"no":0,"abstencion":3,"noVota":4,"color":"#8b5cf6"}],
    bocgUrl: "https://www.congreso.es/datos-abiertos",
    expedienteNumber: "121/20260915",
  },
  {
    id: "congreso-2026-09-10-1",
    title: "Nacionalidad para saharauis: un paso hacia la igualdad",
    officialTitle: "Proposición de Ley sobre concesión de nacionalidad española a las y los saharauis nacidos bajo la administración española.",
    chamber: "congreso",
    date: "2026-09-10",
    time: "18:00 h",
    type: "proposicion_ley",
    status: "rechazado",
    category: "Justicia",
    summary: "El Congreso discute la concesión de nacionalidad española a los saharauis nacidos bajo la administración española, mejorando su acceso a servicios y oportunidades laborales.",
    isOmnibus: false,
    threeKeys: {
      "what": "Permite a los saharauis nacidos bajo la administración española obtener la nacionalidad española.",
      "pocket": "Los saharauis beneficiados podrán acceder a servicios públicos y oportunidades laborales sin restricciones.",
      "clash": "Defensores argumentan que es un reconocimiento de derechos históricos, mientras que opositores temen que podría generar inestabilidad."
},
    beforeVsAfter: {
      "before": "Antes, los saharauis nacidos bajo la administración española no podían acceder a ciertos servicios y oportunidades.",
      "after": "Con la nueva ley, podrán disfrutar de los mismos derechos y oportunidades que cualquier ciudadano español."
},
    measures: [
      {
            "id": "congreso-2026-09-10-1-m1",
            "title": "Nacionalidad para saharauis",
            "category": "Derechos civiles",
            "plainDescription": "Establece el derecho a la nacionalidad española para los saharauis nacidos bajo la administración española.",
            "whoIsAffected": [
                  "Saharauis nacidos bajo la administración española"
            ],
            "realWorldExample": "Fatima, una saharaui nacida en Ceuta, podrá inscribirse en el registro civil y acceder a servicios públicos como la sanidad y la educación sin restricciones, mejorando su calidad de vida y oportunidades laborales.",
            "argumentsPro": [
                  "Es un reconocimiento de sus derechos históricos y contribuciones a la sociedad",
                  "Permite a los saharauis acceder a una amplia gama de servicios y oportunidades laborales"
            ],
            "argumentsContra": [
                  "Puede generar inestabilidad en la región",
                  "Existen preocupaciones sobre la aplicación práctica de la ley"
            ]
      }
],
    votesSummary: {"si":139,"no":207,"abstencion":1,"noVota":3,"total":350},
    groupVotes: [{"groupName":"G.P. Popular (PP)","totalSeats":137,"si":137,"no":0,"abstencion":0,"noVota":0,"color":"#0ea5e9"},{"groupName":"G.P. Socialista (PSOE)","totalSeats":121,"si":2,"no":119,"abstencion":0,"noVota":0,"color":"#ef4444"},{"groupName":"G.P. VOX","totalSeats":33,"si":0,"no":33,"abstencion":0,"noVota":0,"color":"#22c55e"},{"groupName":"G.P. Plurinacional Sumar","totalSeats":27,"si":0,"no":27,"abstencion":0,"noVota":0,"color":"#ec4899"},{"groupName":"G.P. Republicano (ERC)","totalSeats":7,"si":0,"no":7,"abstencion":0,"noVota":0,"color":"#f59e0b"},{"groupName":"G.P. Junts per Catalunya","totalSeats":7,"si":0,"no":7,"abstencion":0,"noVota":0,"color":"#06b6d4"},{"groupName":"G.P. Euskal Herria Bildu","totalSeats":6,"si":0,"no":6,"abstencion":0,"noVota":0,"color":"#84cc16"},{"groupName":"G.P. Vasco (EAJ-PNV)","totalSeats":5,"si":0,"no":5,"abstencion":0,"noVota":0,"color":"#10b981"},{"groupName":"G.P. Mixto (Podemos/BNG/CC/UPN)","totalSeats":7,"si":0,"no":3,"abstencion":1,"noVota":3,"color":"#8b5cf6"}],
    bocgUrl: "https://www.congreso.es/datos-abiertos",
    expedienteNumber: "121/20260910",
  },
  {
    id: "congreso-2026-09-10-2",
    title: "Nacionalidad para saharauis: ¿cómo afecta a las familias?",
    officialTitle: "Votación del dictamen de la Proposición de Ley sobre concesión de nacionalidad española a las y los saharauis nacidos bajo la administración española.",
    chamber: "congreso",
    date: "2026-09-10",
    time: "18:00 h",
    type: "proposicion_ley",
    status: "aprobado",
    category: "Justicia",
    summary: "El Congreso votará sobre esta ley, que podría beneficiar a miles de personas con una situación legal incierta, mejorando su calidad de vida.",
    isOmnibus: false,
    threeKeys: {
      "what": "Permite a los saharauis nacidos bajo la administración española obtener la nacionalidad.",
      "pocket": "No tiene impacto directo en el bolsillo, pero mejora la situación legal de muchas familias.",
      "clash": "Defensores argumentan que es un reconocimiento histórico, mientras que opositores temen que podría generar conflictos."
},
    beforeVsAfter: {
      "before": "Antes, muchos saharauis nacidos en Ceuta y Melilla vivían con una situación legal incierta.",
      "after": "Ahora, podrán acceder a los mismos derechos que los ciudadanos españoles, como la educación y el trabajo."
},
    measures: [
      {
            "id": "congreso-2026-09-10-2-m1",
            "title": "Nacionalidad para saharauis",
            "category": "Derechos civiles",
            "plainDescription": "Permite a los saharauis nacidos en Ceuta y Melilla obtener la nacionalidad española.",
            "whoIsAffected": [
                  "Saharauis nacidos en Ceuta y Melilla",
                  "Familias saharauis"
            ],
            "realWorldExample": "Juan, un saharaui nacido en Ceuta, podría acceder a servicios públicos y oportunidades laborales que antes le estaban vedadas, mejorando su calidad de vida y la de su familia.",
            "argumentsPro": [
                  "Es un reconocimiento histórico y legal",
                  "Permite a las familias acceder a servicios y oportunidades"
            ],
            "argumentsContra": [
                  "Puede generar conflictos con otros países",
                  "Se teme que podría generar inestabilidad en la región"
            ]
      }
],
    votesSummary: {"si":168,"no":31,"abstencion":145,"noVota":6,"total":350},
    groupVotes: [{"groupName":"G.P. Popular (PP)","totalSeats":137,"si":137,"no":0,"abstencion":0,"noVota":0,"color":"#0ea5e9"},{"groupName":"G.P. Socialista (PSOE)","totalSeats":121,"si":31,"no":31,"abstencion":59,"noVota":0,"color":"#ef4444"},{"groupName":"G.P. VOX","totalSeats":33,"si":0,"no":0,"abstencion":33,"noVota":0,"color":"#22c55e"},{"groupName":"G.P. Plurinacional Sumar","totalSeats":27,"si":0,"no":0,"abstencion":27,"noVota":0,"color":"#ec4899"},{"groupName":"G.P. Republicano (ERC)","totalSeats":7,"si":0,"no":0,"abstencion":7,"noVota":0,"color":"#f59e0b"},{"groupName":"G.P. Junts per Catalunya","totalSeats":7,"si":0,"no":0,"abstencion":7,"noVota":0,"color":"#06b6d4"},{"groupName":"G.P. Euskal Herria Bildu","totalSeats":6,"si":0,"no":0,"abstencion":6,"noVota":0,"color":"#84cc16"},{"groupName":"G.P. Vasco (EAJ-PNV)","totalSeats":5,"si":0,"no":0,"abstencion":5,"noVota":0,"color":"#10b981"},{"groupName":"G.P. Mixto (Podemos/BNG/CC/UPN)","totalSeats":7,"si":0,"no":0,"abstencion":1,"noVota":6,"color":"#8b5cf6"}],
    bocgUrl: "https://www.congreso.es/datos-abiertos",
    expedienteNumber: "121/20260910",
  },
  {
    id: "congreso-2026-09-10-3",
    title: "Garantizar el futuro de Ceuta y Melilla",
    officialTitle: "Proposición no de Ley del Grupo Parlamentario Popular en el Congreso, para una respuesta de Estado ante la crisis de seguridad nacional en Ceuta y para garantizar el futuro de Ceuta y Melilla.\nSe vota en los términos resultantes de la incorporación de la enmienda presentada por el Grupo Parlamentario Popular en el Congreso.",
    chamber: "congreso",
    date: "2026-09-10",
    time: "18:00 h",
    type: "mocion",
    status: "rechazado",
    category: "Seguridad",
    summary: "El Congreso votará sobre una propuesta para asegurar la seguridad en Ceuta y Melilla, mejorando la calidad de vida de los ciudadanos.",
    isOmnibus: false,
    threeKeys: {
      "what": "La medida busca proteger la seguridad de Ceuta y Melilla frente a las crisis.",
      "pocket": "No afecta directamente al bolsillo de los ciudadanos, pero garantiza la estabilidad y tranquilidad.",
      "clash": "Defensores de la medida argumentan la necesidad de seguridad, mientras que otros temen que pueda limitar libertades."
},
    beforeVsAfter: {
      "before": "Antes, los ciudadanos vivían con incertidumbre sobre la seguridad en Ceuta y Melilla.",
      "after": "Con la nueva regulación, se espera una mayor estabilidad y seguridad para los residentes y visitantes."
},
    measures: [
      {
            "id": "congreso-2026-09-10-3-m1",
            "title": "Plan de Acción para la Seguridad",
            "category": "Seguridad",
            "plainDescription": "La medida establece un plan integral para mejorar la seguridad en Ceuta y Melilla, incluyendo medidas de prevención y respuesta.",
            "whoIsAffected": [
                  "Residentes de Ceuta y Melilla",
                  "Visitantes de Ceuta y Melilla"
            ],
            "realWorldExample": "Juan, un residente de Ceuta, podrá dormir más tranquilo sabiendo que las medidas de seguridad han sido fortalecidas. María, una turista, podrá disfrutar de sus vacaciones sin preocupaciones sobre su bienestar.",
            "argumentsPro": [
                  "Mejora la calidad de vida y la tranquilidad de los ciudadanos",
                  "Prevención de incidentes que podrían afectar a la economía local"
            ],
            "argumentsContra": [
                  "Se teme que las medidas puedan limitar libertades",
                  "Se cuestiona la eficacia de ciertas medidas propuestas"
            ]
      }
],
    votesSummary: {"si":170,"no":175,"abstencion":1,"noVota":4,"total":350},
    groupVotes: [{"groupName":"G.P. Popular (PP)","totalSeats":137,"si":137,"no":0,"abstencion":0,"noVota":0,"color":"#0ea5e9"},{"groupName":"G.P. Socialista (PSOE)","totalSeats":121,"si":33,"no":88,"abstencion":0,"noVota":0,"color":"#ef4444"},{"groupName":"G.P. VOX","totalSeats":33,"si":0,"no":33,"abstencion":0,"noVota":0,"color":"#22c55e"},{"groupName":"G.P. Plurinacional Sumar","totalSeats":27,"si":0,"no":27,"abstencion":0,"noVota":0,"color":"#ec4899"},{"groupName":"G.P. Republicano (ERC)","totalSeats":7,"si":0,"no":7,"abstencion":0,"noVota":0,"color":"#f59e0b"},{"groupName":"G.P. Junts per Catalunya","totalSeats":7,"si":0,"no":7,"abstencion":0,"noVota":0,"color":"#06b6d4"},{"groupName":"G.P. Euskal Herria Bildu","totalSeats":6,"si":0,"no":6,"abstencion":0,"noVota":0,"color":"#84cc16"},{"groupName":"G.P. Vasco (EAJ-PNV)","totalSeats":5,"si":0,"no":5,"abstencion":0,"noVota":0,"color":"#10b981"},{"groupName":"G.P. Mixto (Podemos/BNG/CC/UPN)","totalSeats":7,"si":0,"no":2,"abstencion":1,"noVota":4,"color":"#8b5cf6"}],
    bocgUrl: "https://www.congreso.es/datos-abiertos",
    expedienteNumber: "121/20260910",
  },
  {
    id: "congreso-2026-09-10-4",
    title: "Transparencia en la Administración: Mejorando la Confianza",
    officialTitle: "Proposición no de Ley del Grupo Parlamentario Socialista, sobre la necesidad de transparencia.",
    chamber: "congreso",
    date: "2026-09-10",
    time: "18:00 h",
    type: "mocion",
    status: "rechazado",
    category: "Justicia",
    summary: "El Congreso discute la necesidad de transparencia en la toma de decisiones administrativas. Esto beneficiará a los ciudadanos al poder entender mejor cómo se afecta su vida diaria.",
    isOmnibus: false,
    threeKeys: {
      "what": "La iniciativa busca mayor claridad en las decisiones administrativas.",
      "pocket": "Los ciudadanos podrán entender mejor cómo se toman decisiones que les afectan.",
      "clash": "Los partidarios ven en esta medida un paso hacia una administración más justa, mientras que los críticos temen que pueda complicar procesos."
},
    beforeVsAfter: {
      "before": "Antes, los ciudadanos a menudo se encontraban ante decisiones administrativas poco claras.",
      "after": "Con la nueva regulación, las explicaciones serán más directas y comprensibles para todos."
},
    measures: [
      {
            "id": "congreso-2026-09-10-4-m1",
            "title": "Explicación clara de decisiones administrativas",
            "category": "Transparencia",
            "plainDescription": "La medida busca que las explicaciones de las decisiones administrativas sean más directas y comprensibles para los ciudadanos.",
            "whoIsAffected": [
                  "Todos los ciudadanos"
            ],
            "realWorldExample": "María, una madre soltera, se siente aliviada al poder entender mejor por qué su solicitud para una beca ha sido rechazada, gracias a la nueva explicación clara y accesible.",
            "argumentsPro": [
                  "Permite a los ciudadanos entender mejor cómo se toman decisiones que les afectan directamente",
                  "Facilita la participación ciudadana y el control de la administración"
            ],
            "argumentsContra": [
                  "Puede complicar los procesos administrativos",
                  "Exige más recursos para elaborar explicaciones detalladas"
            ]
      }
],
    votesSummary: {"si":163,"no":174,"abstencion":8,"noVota":5,"total":350},
    groupVotes: [{"groupName":"G.P. Popular (PP)","totalSeats":137,"si":137,"no":0,"abstencion":0,"noVota":0,"color":"#0ea5e9"},{"groupName":"G.P. Socialista (PSOE)","totalSeats":121,"si":26,"no":95,"abstencion":0,"noVota":0,"color":"#ef4444"},{"groupName":"G.P. VOX","totalSeats":33,"si":0,"no":33,"abstencion":0,"noVota":0,"color":"#22c55e"},{"groupName":"G.P. Plurinacional Sumar","totalSeats":27,"si":0,"no":27,"abstencion":0,"noVota":0,"color":"#ec4899"},{"groupName":"G.P. Republicano (ERC)","totalSeats":7,"si":0,"no":7,"abstencion":0,"noVota":0,"color":"#f59e0b"},{"groupName":"G.P. Junts per Catalunya","totalSeats":7,"si":0,"no":7,"abstencion":0,"noVota":0,"color":"#06b6d4"},{"groupName":"G.P. Euskal Herria Bildu","totalSeats":6,"si":0,"no":5,"abstencion":1,"noVota":0,"color":"#84cc16"},{"groupName":"G.P. Vasco (EAJ-PNV)","totalSeats":5,"si":0,"no":0,"abstencion":5,"noVota":0,"color":"#10b981"},{"groupName":"G.P. Mixto (Podemos/BNG/CC/UPN)","totalSeats":7,"si":0,"no":0,"abstencion":2,"noVota":5,"color":"#8b5cf6"}],
    bocgUrl: "https://www.congreso.es/datos-abiertos",
    expedienteNumber: "121/20260910",
  },
  {
    id: "congreso-2026-09-10-5",
    title: "VOX pide medidas urgentes para frenar el empobrecimiento",
    officialTitle: "Moción consecuencia de interpelación urgente del Grupo Parlamentario VOX, sobre la estrategia que seguirá el Gobierno para revertir el empobrecimiento de los españoles.",
    chamber: "congreso",
    date: "2026-09-10",
    time: "18:00 h",
    type: "mocion",
    status: "rechazado",
    category: "Empleo",
    summary: "El Congreso discute si incrementar los salarios mínimos y las prestaciones sociales puede mejorar la calidad de vida de los españoles.",
    isOmnibus: false,
    threeKeys: {
      "what": "La moción busca proteger a los trabajadores de la inflación",
      "pocket": "Se espera un alivio en el coste de vida, especialmente para pensionistas y familias con hijos",
      "clash": "Gobierno y oposición discuten sobre el mejor enfoque para combatir la pobreza"
},
    beforeVsAfter: {
      "before": "Actualmente, los precios suben más rápido que los salarios, empobreciendo a muchos ciudadanos",
      "after": "Con la aprobación de esta moción, se espera que los ingresos de los trabajadores crezcan al mismo ritmo que los costos"
},
    measures: [
      {
            "id": "congreso-2026-09-10-5-m1",
            "title": "Incremento salarial",
            "category": "Empleo",
            "plainDescription": "La medida propone aumentar los salarios mínimos y las prestaciones sociales para mantener el poder adquisitivo de los trabajadores",
            "whoIsAffected": [
                  "Trabajadores de bajos ingresos",
                  "Pensionistas"
            ],
            "realWorldExample": "Juan, un trabajador de 45 años con dos hijos, ve cómo su salario mínimo sube a 1.200 euros al mes, lo que le permite comprar más alimentos y pagar las facturas sin estrés",
            "argumentsPro": [
                  "Aumentar el poder adquisitivo de los trabajadores ayuda a reducir la pobreza",
                  "Mejora la estabilidad familiar y el bienestar general"
            ],
            "argumentsContra": [
                  "Incrementar los costes de las empresas puede limitar la creación de empleo",
                  "Puede generar inflación si no se controla correctamente"
            ]
      }
],
    votesSummary: {"si":32,"no":177,"abstencion":137,"noVota":4,"total":350},
    groupVotes: [{"groupName":"G.P. Popular (PP)","totalSeats":137,"si":32,"no":105,"abstencion":0,"noVota":0,"color":"#0ea5e9"},{"groupName":"G.P. Socialista (PSOE)","totalSeats":121,"si":0,"no":72,"abstencion":49,"noVota":0,"color":"#ef4444"},{"groupName":"G.P. VOX","totalSeats":33,"si":0,"no":0,"abstencion":33,"noVota":0,"color":"#22c55e"},{"groupName":"G.P. Plurinacional Sumar","totalSeats":27,"si":0,"no":0,"abstencion":27,"noVota":0,"color":"#ec4899"},{"groupName":"G.P. Republicano (ERC)","totalSeats":7,"si":0,"no":0,"abstencion":7,"noVota":0,"color":"#f59e0b"},{"groupName":"G.P. Junts per Catalunya","totalSeats":7,"si":0,"no":0,"abstencion":7,"noVota":0,"color":"#06b6d4"},{"groupName":"G.P. Euskal Herria Bildu","totalSeats":6,"si":0,"no":0,"abstencion":6,"noVota":0,"color":"#84cc16"},{"groupName":"G.P. Vasco (EAJ-PNV)","totalSeats":5,"si":0,"no":0,"abstencion":5,"noVota":0,"color":"#10b981"},{"groupName":"G.P. Mixto (Podemos/BNG/CC/UPN)","totalSeats":7,"si":0,"no":0,"abstencion":3,"noVota":4,"color":"#8b5cf6"}],
    bocgUrl: "https://www.congreso.es/datos-abiertos",
    expedienteNumber: "121/20260910",
  },
  {
    id: "congreso-2026-09-10-6",
    title: "Urgente: Ley para aliviar el alquiler y proteger a los inquilinos",
    officialTitle: "Moción consecuencia de interpelación urgente del Grupo Parlamentario Popular en el Congreso, sobre la política en materia de vivienda del Gobierno.",
    chamber: "congreso",
    date: "2026-09-10",
    time: "18:00 h",
    type: "mocion",
    status: "aprobado",
    category: "Vivienda",
    summary: "El Congreso vota una ley para regular los alquileres, protegiendo a los inquilinos y buscando un equilibrio con los propietarios. Esto beneficiará a miles de familias que podrán mantenerse en sus hogares.",
    isOmnibus: false,
    threeKeys: {
      "what": "Establece límites a las subidas de alquiler y ayuda a los inquilinos.",
      "pocket": "Ayuda a familias con bajos ingresos a mantenerse en sus viviendas, reduciendo hasta un 20% las subidas.",
      "clash": "Inquilinos temen al alza de precios mientras propietarios se quejan de la falta de rentabilidad."
},
    beforeVsAfter: {
      "before": "Antes, los alquileres subían sin control, dejando a muchos inquilinos en la calle.",
      "after": "Ahora, los alquileres se regularizan, protegiendo a los inquilinos y equilibrando los intereses de los propietarios."
},
    measures: [
      {
            "id": "congreso-2026-09-10-6-m1",
            "title": "Límites a las subidas de alquiler",
            "category": "Alquiler",
            "plainDescription": "Establece un tope anual del 5% para las subidas de alquiler, protegiendo a los inquilinos de subidas desmesuradas.",
            "whoIsAffected": [
                  "Familias con bajos ingresos",
                  "Estudiantes en alquiler"
            ],
            "realWorldExample": "Juan, un estudiante de 22 años, alquila un piso en Madrid por 600 euros al mes. Con la nueva ley, si el propietario intenta subir el alquiler, solo podrá hacerlo hasta un máximo de 630 euros al año, ayudando a Juan a mantenerse en su hogar.",
            "argumentsPro": [
                  "Ayuda a los jóvenes a mantenerse en la ciudad",
                  "Permite a familias con bajos ingresos seguir en sus hogares"
            ],
            "argumentsContra": [
                  "Puede disuadir a los propietarios de invertir en viviendas",
                  "Puede limitar la oferta de alquiler en zonas con alta demanda"
            ]
      }
],
    votesSummary: {"si":170,"no":168,"abstencion":8,"noVota":4,"total":350},
    groupVotes: [{"groupName":"G.P. Popular (PP)","totalSeats":137,"si":137,"no":0,"abstencion":0,"noVota":0,"color":"#0ea5e9"},{"groupName":"G.P. Socialista (PSOE)","totalSeats":121,"si":33,"no":88,"abstencion":0,"noVota":0,"color":"#ef4444"},{"groupName":"G.P. VOX","totalSeats":33,"si":0,"no":33,"abstencion":0,"noVota":0,"color":"#22c55e"},{"groupName":"G.P. Plurinacional Sumar","totalSeats":27,"si":0,"no":27,"abstencion":0,"noVota":0,"color":"#ec4899"},{"groupName":"G.P. Republicano (ERC)","totalSeats":7,"si":0,"no":7,"abstencion":0,"noVota":0,"color":"#f59e0b"},{"groupName":"G.P. Junts per Catalunya","totalSeats":7,"si":0,"no":7,"abstencion":0,"noVota":0,"color":"#06b6d4"},{"groupName":"G.P. Euskal Herria Bildu","totalSeats":6,"si":0,"no":6,"abstencion":0,"noVota":0,"color":"#84cc16"},{"groupName":"G.P. Vasco (EAJ-PNV)","totalSeats":5,"si":0,"no":0,"abstencion":5,"noVota":0,"color":"#10b981"},{"groupName":"G.P. Mixto (Podemos/BNG/CC/UPN)","totalSeats":7,"si":0,"no":0,"abstencion":3,"noVota":4,"color":"#8b5cf6"}],
    bocgUrl: "https://www.congreso.es/datos-abiertos",
    expedienteNumber: "121/20260910",
  },
  {
    id: "congreso-2026-09-10-7",
    title: "Cambio en elección de vocales del Poder Judicial",
    officialTitle: "Proposición de Ley del Grupo Parlamentario Popular en el Congreso, Orgánica de modificación de la Ley Orgánica 6/1985, de 1 de julio, del Poder Judicial, para el cambio del modelo de elección de los vocales del Consejo General del Poder Judicial.",
    chamber: "congreso",
    date: "2026-09-10",
    time: "18:00 h",
    type: "proposicion_ley",
    status: "rechazado",
    category: "Justicia",
    summary: "El Congreso debate la modificación de la Ley Orgánica del Poder Judicial, lo que podría influir en la gestión interna del sistema judicial sin afectar directamente a los ciudadanos.",
    isOmnibus: false,
    threeKeys: {
      "what": "Se modifica el modelo de elección de vocales del Consejo General del Poder Judicial.",
      "pocket": "No afecta directamente a los bolsillos de los ciudadanos, pero puede influir en la gestión judicial.",
      "clash": "Defensores del cambio argumentan que mejora la eficiencia, mientras que opositores temen que altere la independencia del Poder Judicial."
},
    beforeVsAfter: {
      "before": "Actualmente, los vocales se eligen por el Consejo General del Poder Judicial.",
      "after": "Con la nueva ley, los vocales serán elegidos por los magistrados, lo que podría cambiar la dinámica de toma de decisiones."
},
    measures: [
      {
            "id": "congreso-2026-09-10-7-m1",
            "title": "Modificación del modelo de elección de vocales",
            "category": "Gestión judicial",
            "plainDescription": "Se establece que los vocales del Consejo General del Poder Judicial serán elegidos por los magistrados, no por el propio Consejo.",
            "whoIsAffected": [
                  "Magistrados"
            ],
            "realWorldExample": "Un magistrado, Juan, se siente aliviado al saber que su voz será escuchada en la elección de vocales, lo que podría influir en la toma de decisiones más favorable para los ciudadanos.",
            "argumentsPro": [
                  "Mejora la representación de los magistrados en la toma de decisiones",
                  "Aumenta la eficiencia en la gestión judicial"
            ],
            "argumentsContra": [
                  "Puede alterar la independencia del Poder Judicial",
                  "Se reduce la influencia de la administración en la elección de vocales"
            ]
      }
],
    votesSummary: {"si":170,"no":175,"abstencion":0,"noVota":5,"total":350},
    groupVotes: [{"groupName":"G.P. Popular (PP)","totalSeats":137,"si":137,"no":0,"abstencion":0,"noVota":0,"color":"#0ea5e9"},{"groupName":"G.P. Socialista (PSOE)","totalSeats":121,"si":33,"no":88,"abstencion":0,"noVota":0,"color":"#ef4444"},{"groupName":"G.P. VOX","totalSeats":33,"si":0,"no":33,"abstencion":0,"noVota":0,"color":"#22c55e"},{"groupName":"G.P. Plurinacional Sumar","totalSeats":27,"si":0,"no":27,"abstencion":0,"noVota":0,"color":"#ec4899"},{"groupName":"G.P. Republicano (ERC)","totalSeats":7,"si":0,"no":7,"abstencion":0,"noVota":0,"color":"#f59e0b"},{"groupName":"G.P. Junts per Catalunya","totalSeats":7,"si":0,"no":7,"abstencion":0,"noVota":0,"color":"#06b6d4"},{"groupName":"G.P. Euskal Herria Bildu","totalSeats":6,"si":0,"no":6,"abstencion":0,"noVota":0,"color":"#84cc16"},{"groupName":"G.P. Vasco (EAJ-PNV)","totalSeats":5,"si":0,"no":5,"abstencion":0,"noVota":0,"color":"#10b981"},{"groupName":"G.P. Mixto (Podemos/BNG/CC/UPN)","totalSeats":7,"si":0,"no":2,"abstencion":0,"noVota":5,"color":"#8b5cf6"}],
    bocgUrl: "https://www.congreso.es/datos-abiertos",
    expedienteNumber: "121/20260910",
  },
  {
    id: "congreso-2026-09-10-8",
    title: "Biólogos y trabajadores sociales: profesiones sanitarias reconocidas",
    officialTitle: "Proposición de Ley del Grupo Parlamentario Socialista, sobre el reconocimiento de la profesión de biólogo y trabajador social como profesión sanitaria.",
    chamber: "congreso",
    date: "2026-09-10",
    time: "18:00 h",
    type: "proposicion_ley",
    status: "aprobado",
    category: "Sanidad",
    summary: "El Congreso discute la Proposición de Ley que reconoce a los biólogos y trabajadores sociales como profesiones sanitarias, mejorando su estatus y accesibilidad a oportunidades laborales.",
    isOmnibus: false,
    threeKeys: {
      "what": "Establece el reconocimiento legal de estas profesiones en el ámbito sanitario.",
      "pocket": "Facilita el acceso a mejores oportunidades laborales y mejora la calidad de atención.",
      "clash": "Defensores ven la necesidad de reconocer el valor de estas profesiones, mientras que críticos temen un aumento de costes."
},
    beforeVsAfter: {
      "before": "Antes, estos profesionales no tenían el mismo estatus legal que otros sanitarios.",
      "after": "Ahora, tendrán reconocimiento oficial, mejorando su estatus y las oportunidades de empleo."
},
    measures: [
      {
            "id": "congreso-2026-09-10-8-m1",
            "title": "Reconocimiento legal de profesiones sanitarias",
            "category": "Profesiones sanitarias",
            "plainDescription": "Establece el reconocimiento legal de biólogos y trabajadores sociales en el ámbito sanitario, mejorando su estatus y oportunidades laborales.",
            "whoIsAffected": [
                  "Biólogos",
                  "Trabajadores sociales"
            ],
            "realWorldExample": "María, bióloga, podrá acceder a puestos de trabajo en hospitales y centros de salud con mejor estatus legal, lo que facilita su incorporación y mejora su calidad de vida y profesional.",
            "argumentsPro": [
                  "Mejora la calidad de atención sanitaria",
                  "Ofrece más estabilidad laboral"
            ],
            "argumentsContra": [
                  "Puede incrementar los costes del sistema sanitario",
                  "Se necesita garantizar la formación adecuada"
            ]
      }
],
    votesSummary: {"si":165,"no":32,"abstencion":148,"noVota":5,"total":350},
    groupVotes: [{"groupName":"G.P. Popular (PP)","totalSeats":137,"si":137,"no":0,"abstencion":0,"noVota":0,"color":"#0ea5e9"},{"groupName":"G.P. Socialista (PSOE)","totalSeats":121,"si":28,"no":32,"abstencion":61,"noVota":0,"color":"#ef4444"},{"groupName":"G.P. VOX","totalSeats":33,"si":0,"no":0,"abstencion":33,"noVota":0,"color":"#22c55e"},{"groupName":"G.P. Plurinacional Sumar","totalSeats":27,"si":0,"no":0,"abstencion":27,"noVota":0,"color":"#ec4899"},{"groupName":"G.P. Republicano (ERC)","totalSeats":7,"si":0,"no":0,"abstencion":7,"noVota":0,"color":"#f59e0b"},{"groupName":"G.P. Junts per Catalunya","totalSeats":7,"si":0,"no":0,"abstencion":7,"noVota":0,"color":"#06b6d4"},{"groupName":"G.P. Euskal Herria Bildu","totalSeats":6,"si":0,"no":0,"abstencion":6,"noVota":0,"color":"#84cc16"},{"groupName":"G.P. Vasco (EAJ-PNV)","totalSeats":5,"si":0,"no":0,"abstencion":5,"noVota":0,"color":"#10b981"},{"groupName":"G.P. Mixto (Podemos/BNG/CC/UPN)","totalSeats":7,"si":0,"no":0,"abstencion":2,"noVota":5,"color":"#8b5cf6"}],
    bocgUrl: "https://www.congreso.es/datos-abiertos",
    expedienteNumber: "121/20260910",
  },
  {
    id: "congreso-2026-09-10-9",
    title: "Acuerdo con UNESCO para proteger patrimonio cultural",
    officialTitle: "Acuerdo Internacional entre el Reino de España y la Organización de las Naciones Unidas para la Educación, la Ciencia y la Cultura (UNESCO) relativo a la designación de la Fundación Tres Culturas del Mediterráneo como Centro de Categoría 2 auspiciado por la UNESCO, hecho en París el 28 de enero de 2026.",
    chamber: "congreso",
    date: "2026-09-10",
    time: "18:00 h",
    type: "proyecto_ley",
    status: "aprobado",
    category: "Cultura",
    summary: "El Congreso aprueba acuerdo para designar la Fundación Tres Culturas del Mediterráneo como centro UNESCO, protegiendo y promoviendo patrimonio cultural español.",
    isOmnibus: false,
    threeKeys: {
      "what": "España y UNESCO firman acuerdo para proteger patrimonio cultural",
      "pocket": "Impacto limitado, pero vital para preservar identidad y herencia",
      "clash": "Defensores ven oportunidad de salvaguardar patrimonio, críticos temen costos innecesarios"
},
    beforeVsAfter: {
      "before": "Antes, peligros de pérdida de patrimonio cultural sin protección internacional",
      "after": "Ahora, fundación recibirá apoyo para preservar y difundir patrimonio"
},
    measures: [
      {
            "id": "congreso-2026-09-10-9-m1",
            "title": "Protección del patrimonio cultural",
            "category": "Cultura",
            "plainDescription": "La medida busca garantizar la conservación y difusión del patrimonio cultural español a través de la Fundación Tres Culturas del Mediterráneo.",
            "whoIsAffected": [
                  "Culturales y educadores",
                  "Turistas y visitantes"
            ],
            "realWorldExample": "María, una maestra de arte, podrá ofrecer a sus alumnos recursos digitales y visitas guiadas a monumentos protegidos, enriqueciendo su enseñanza. Los turistas podrán disfrutar de experiencias más ricas y auténticas, preservando así la herencia cultural.",
            "argumentsPro": [
                  "Preservación de la identidad nacional",
                  "Fomento del turismo cultural"
            ],
            "argumentsContra": [
                  "Costos potenciales para el erario público",
                  "Riesgo de burocratización"
            ]
      }
],
    votesSummary: {"si":263,"no":57,"abstencion":25,"noVota":5,"total":350},
    groupVotes: [{"groupName":"G.P. Popular (PP)","totalSeats":137,"si":137,"no":0,"abstencion":0,"noVota":0,"color":"#0ea5e9"},{"groupName":"G.P. Socialista (PSOE)","totalSeats":121,"si":121,"no":0,"abstencion":0,"noVota":0,"color":"#ef4444"},{"groupName":"G.P. VOX","totalSeats":33,"si":5,"no":28,"abstencion":0,"noVota":0,"color":"#22c55e"},{"groupName":"G.P. Plurinacional Sumar","totalSeats":27,"si":0,"no":27,"abstencion":0,"noVota":0,"color":"#ec4899"},{"groupName":"G.P. Republicano (ERC)","totalSeats":7,"si":0,"no":2,"abstencion":5,"noVota":0,"color":"#f59e0b"},{"groupName":"G.P. Junts per Catalunya","totalSeats":7,"si":0,"no":0,"abstencion":7,"noVota":0,"color":"#06b6d4"},{"groupName":"G.P. Euskal Herria Bildu","totalSeats":6,"si":0,"no":0,"abstencion":6,"noVota":0,"color":"#84cc16"},{"groupName":"G.P. Vasco (EAJ-PNV)","totalSeats":5,"si":0,"no":0,"abstencion":5,"noVota":0,"color":"#10b981"},{"groupName":"G.P. Mixto (Podemos/BNG/CC/UPN)","totalSeats":7,"si":0,"no":0,"abstencion":2,"noVota":5,"color":"#8b5cf6"}],
    bocgUrl: "https://www.congreso.es/datos-abiertos",
    expedienteNumber: "121/20260910",
  },
  {
    id: "congreso-2026-09-10-10",
    title: "Acuerdo binacional para el río Guadiana: un paso hacia la sostenibilidad",
    officialTitle: "Segundo Protocolo de Revisión del Convenio sobre cooperación para la protección y el aprovechamiento sostenible de las aguas de las cuencas hidrográficas hispano-portuguesas y Protocolo Adicional, hechos en Albufeira el 30 de noviembre de 1998 entre el Reino de España y la República Portuguesa, relativo al régimen de caudales del río Guadiana en la sección de Pomarão, hecho en Madrid el 24 de febrero de 2026.",
    chamber: "congreso",
    date: "2026-09-10",
    time: "18:00 h",
    type: "proyecto_ley",
    status: "aprobado",
    category: "Agricultura",
    summary: "El Congreso aprueba el segundo protocolo para regular el uso del río Guadiana, mejorando la cooperación entre España y Portugal y asegurando un suministro de agua más estable para la agricultura.",
    isOmnibus: false,
    threeKeys: {
      "what": "Acuerda el régimen de caudales para el río Guadiana, beneficiando a ambas naciones.",
      "pocket": "No afecta directamente al bolsillo de los ciudadanos, pero mejora la seguridad hídrica en zonas rurales.",
      "clash": "Ambas partes buscan equilibrar el uso del agua para la agricultura y la conservación ambiental."
},
    beforeVsAfter: {
      "before": "Antes, la incertidumbre sobre el régimen de caudales causaba estrés en los agricultores.",
      "after": "Ahora, los agricultores podrán planificar con mayor seguridad sus cultivos."
},
    measures: [
      {
            "id": "congreso-2026-09-10-10-m1",
            "title": "Regulación del régimen de caudales del río Guadiana",
            "category": "Agua",
            "plainDescription": "Establece un marco legal para el uso sostenible del agua en el río Guadiana, beneficiando a los agricultores de ambas naciones.",
            "whoIsAffected": [
                  "Agricultores de la cuenca del río Guadiana",
                  "Empresas de regadío"
            ],
            "realWorldExample": "Juan, un agricultor de Alcántara, podrá programar sus riegos con mayor certeza, sabiendo que el agua estará disponible en los momentos críticos de su cultivo de tomates.",
            "argumentsPro": [
                  "Garantiza el suministro de agua para la agricultura",
                  "Mejora la seguridad hídrica en la región"
            ],
            "argumentsContra": [
                  "Puede limitar la extracción de agua para la industria",
                  "Posible impacto en la biodiversidad del río"
            ]
      }
],
    votesSummary: {"si":156,"no":0,"abstencion":189,"noVota":5,"total":350},
    groupVotes: [{"groupName":"G.P. Popular (PP)","totalSeats":137,"si":137,"no":0,"abstencion":0,"noVota":0,"color":"#0ea5e9"},{"groupName":"G.P. Socialista (PSOE)","totalSeats":121,"si":19,"no":0,"abstencion":102,"noVota":0,"color":"#ef4444"},{"groupName":"G.P. VOX","totalSeats":33,"si":0,"no":0,"abstencion":33,"noVota":0,"color":"#22c55e"},{"groupName":"G.P. Plurinacional Sumar","totalSeats":27,"si":0,"no":0,"abstencion":27,"noVota":0,"color":"#ec4899"},{"groupName":"G.P. Republicano (ERC)","totalSeats":7,"si":0,"no":0,"abstencion":7,"noVota":0,"color":"#f59e0b"},{"groupName":"G.P. Junts per Catalunya","totalSeats":7,"si":0,"no":0,"abstencion":7,"noVota":0,"color":"#06b6d4"},{"groupName":"G.P. Euskal Herria Bildu","totalSeats":6,"si":0,"no":0,"abstencion":6,"noVota":0,"color":"#84cc16"},{"groupName":"G.P. Vasco (EAJ-PNV)","totalSeats":5,"si":0,"no":0,"abstencion":5,"noVota":0,"color":"#10b981"},{"groupName":"G.P. Mixto (Podemos/BNG/CC/UPN)","totalSeats":7,"si":0,"no":0,"abstencion":2,"noVota":5,"color":"#8b5cf6"}],
    bocgUrl: "https://www.congreso.es/datos-abiertos",
    expedienteNumber: "121/20260910",
  },
  {
    id: "congreso-2026-09-10-11",
    title: "Acuerdo de información clasificada entre España y Australia",
    officialTitle: "Acuerdo entre el Reino de España y Australia para la protección mutua de información clasificada de interés para la defensa, hecho en Bruselas el 12 de febrero de 2026.",
    chamber: "congreso",
    date: "2026-09-10",
    time: "18:00 h",
    type: "proyecto_ley",
    status: "aprobado",
    category: "Justicia",
    summary: "El Congreso aprueba un acuerdo para proteger la información clasificada entre España y Australia, mejorando la cooperación internacional en materia de defensa sin afectar directamente a los ciudadanos.",
    isOmnibus: false,
    threeKeys: {
      "what": "Acuerdo para compartir información de defensa entre España y Australia.",
      "pocket": "No afecta directamente el bolsillo de los ciudadanos.",
      "clash": "Defensores ven beneficios en la cooperación internacional, mientras que otros temen por la privacidad."
},
    beforeVsAfter: {
      "before": "Antes, la cooperación en información de defensa era limitada.",
      "after": "Ahora, se facilita el intercambio de información para mejorar la seguridad nacional."
},
    measures: [
      {
            "id": "congreso-2026-09-10-11-m1",
            "title": "Acuerdo de información clasificada",
            "category": "Seguridad",
            "plainDescription": "Establece un marco para el intercambio seguro de información de defensa entre España y Australia.",
            "whoIsAffected": [
                  "Personal militar y diplomático",
                  "Autoridades de seguridad nacional"
            ],
            "realWorldExample": "Un oficial de la Guardia Civil, tras un intercambio de información con Australia, puede acceder a datos cruciales para una investigación antiterrorista, lo que podría salvar vidas.",
            "argumentsPro": [
                  "Mejora la cooperación internacional en seguridad",
                  "Permite compartir información vital para la defensa"
            ],
            "argumentsContra": [
                  "Puede poner en riesgo la privacidad de los ciudadanos",
                  "Necesidad de garantizar la seguridad de la información compartida"
            ]
      }
],
    votesSummary: {"si":268,"no":0,"abstencion":77,"noVota":5,"total":350},
    groupVotes: [{"groupName":"G.P. Popular (PP)","totalSeats":137,"si":137,"no":0,"abstencion":0,"noVota":0,"color":"#0ea5e9"},{"groupName":"G.P. Socialista (PSOE)","totalSeats":121,"si":121,"no":0,"abstencion":0,"noVota":0,"color":"#ef4444"},{"groupName":"G.P. VOX","totalSeats":33,"si":10,"no":0,"abstencion":23,"noVota":0,"color":"#22c55e"},{"groupName":"G.P. Plurinacional Sumar","totalSeats":27,"si":0,"no":0,"abstencion":27,"noVota":0,"color":"#ec4899"},{"groupName":"G.P. Republicano (ERC)","totalSeats":7,"si":0,"no":0,"abstencion":7,"noVota":0,"color":"#f59e0b"},{"groupName":"G.P. Junts per Catalunya","totalSeats":7,"si":0,"no":0,"abstencion":7,"noVota":0,"color":"#06b6d4"},{"groupName":"G.P. Euskal Herria Bildu","totalSeats":6,"si":0,"no":0,"abstencion":6,"noVota":0,"color":"#84cc16"},{"groupName":"G.P. Vasco (EAJ-PNV)","totalSeats":5,"si":0,"no":0,"abstencion":5,"noVota":0,"color":"#10b981"},{"groupName":"G.P. Mixto (Podemos/BNG/CC/UPN)","totalSeats":7,"si":0,"no":0,"abstencion":2,"noVota":5,"color":"#8b5cf6"}],
    bocgUrl: "https://www.congreso.es/datos-abiertos",
    expedienteNumber: "121/20260910",
  },
  {
    id: "congreso-2026-09-10-12",
    title: "Trato equitativo en cuentas del Estado",
    officialTitle: "Dictamen de la Comisión Mixta para las Relaciones con el Tribunal de Cuentas en relación con la Declaración sobre la Cuenta General del Estado del ejercicio 2024, así como la Resolución adoptada por la Comisión.",
    chamber: "congreso",
    date: "2026-09-10",
    time: "18:00 h",
    type: "proyecto_ley",
    status: "aprobado",
    category: "Justicia",
    summary: "El Congreso aprueba un dictamen para mejorar la transparencia en las cuentas del Estado, lo que supone un paso hacia una administración más justa y responsable, aunque algunos temen que las regulaciones puedan ser innecesarias.",
    isOmnibus: false,
    threeKeys: {
      "what": "Dictamen para mejorar la transparencia en el uso del dinero público.",
      "pocket": "No afecta directamente a los bolsillos de los ciudadanos, pero garantiza que el dinero público se administre de manera justa.",
      "clash": "Los defensores buscan mayor transparencia, mientras que otros temen que las regulaciones sean innecesarias."
},
    beforeVsAfter: {
      "before": "Antes, la transparencia en las cuentas del Estado era limitada, lo que generaba dudas entre los ciudadanos.",
      "after": "Ahora, se espera mayor claridad y responsabilidad en el manejo del dinero público."
},
    measures: [
      {
            "id": "congreso-2026-09-10-12-m1",
            "title": "Mejora en la transparencia de cuentas",
            "category": "Transparencia",
            "plainDescription": "La medida busca garantizar que el dinero público se administre de manera justa y transparente, protegiendo los intereses de todos los ciudadanos.",
            "whoIsAffected": [
                  "Todos los ciudadanos"
            ],
            "realWorldExample": "Juan, un ciudadano preocupado, puede estar seguro de que su dinero contribuye a un Estado que gestiona bien sus recursos, lo que a largo plazo puede beneficiar a todos.",
            "argumentsPro": [
                  "Mayor confianza en la administración pública",
                  "Protección contra el mal uso del dinero público"
            ],
            "argumentsContra": [
                  "Posible sobrecarga burocrática",
                  "Ineficiencia en el uso de recursos"
            ]
      }
],
    votesSummary: {"si":177,"no":168,"abstencion":0,"noVota":5,"total":350},
    groupVotes: [{"groupName":"G.P. Popular (PP)","totalSeats":137,"si":137,"no":0,"abstencion":0,"noVota":0,"color":"#0ea5e9"},{"groupName":"G.P. Socialista (PSOE)","totalSeats":121,"si":40,"no":81,"abstencion":0,"noVota":0,"color":"#ef4444"},{"groupName":"G.P. VOX","totalSeats":33,"si":0,"no":33,"abstencion":0,"noVota":0,"color":"#22c55e"},{"groupName":"G.P. Plurinacional Sumar","totalSeats":27,"si":0,"no":27,"abstencion":0,"noVota":0,"color":"#ec4899"},{"groupName":"G.P. Republicano (ERC)","totalSeats":7,"si":0,"no":7,"abstencion":0,"noVota":0,"color":"#f59e0b"},{"groupName":"G.P. Junts per Catalunya","totalSeats":7,"si":0,"no":7,"abstencion":0,"noVota":0,"color":"#06b6d4"},{"groupName":"G.P. Euskal Herria Bildu","totalSeats":6,"si":0,"no":6,"abstencion":0,"noVota":0,"color":"#84cc16"},{"groupName":"G.P. Vasco (EAJ-PNV)","totalSeats":5,"si":0,"no":5,"abstencion":0,"noVota":0,"color":"#10b981"},{"groupName":"G.P. Mixto (Podemos/BNG/CC/UPN)","totalSeats":7,"si":0,"no":2,"abstencion":0,"noVota":5,"color":"#8b5cf6"}],
    bocgUrl: "https://www.congreso.es/datos-abiertos",
    expedienteNumber: "121/20260910",
  },
  {
    id: "congreso-2026-09-10-13",
    title: "Subcomisión para proteger a desaparecidos sin causa aparente",
    officialTitle: "Propuesta de la Comisión de Interior, de creación de una Subcomisión para la elaboración de un Estatuto jurídico básico de las personas desaparecidas sin causa aparente.",
    chamber: "congreso",
    date: "2026-09-10",
    time: "18:00 h",
    type: "proyecto_ley",
    status: "aprobado",
    category: "Justicia",
    summary: "El Congreso aprueba la creación de una subcomisión para elaborar un estatuto jurídico que proteja a personas desaparecidas sin causa aparente, buscando aliviar la angustia de las familias.",
    isOmnibus: false,
    threeKeys: {
      "what": "Crea una subcomisión para proteger a personas desaparecidas sin causa aparente.",
      "pocket": "No afecta directamente el bolsillo, pero busca aliviar la angustia familiar.",
      "clash": "Defensores argumentan la necesidad de protección, mientras que opositores temen que pueda ser costoso y redundante."
},
    beforeVsAfter: {
      "before": "Familias angustiadas sin recursos para buscar a sus seres queridos.",
      "after": "Un marco legal que facilita la búsqueda y apoyo a las familias."
},
    measures: [
      {
            "id": "congreso-2026-09-10-13-m1",
            "title": "Subcomisión para la elaboración de un estatuto jurídico básico",
            "category": "Justicia",
            "plainDescription": "Establece un grupo de trabajo para desarrollar un marco legal que proteja a personas desaparecidas sin causa aparente.",
            "whoIsAffected": [
                  "Familias de personas desaparecidas",
                  "Organizaciones de derechos humanos"
            ],
            "realWorldExample": "La familia de Ana, una joven desaparecida, puede contar con un marco legal que facilite la búsqueda y el apoyo psicológico, mientras que organizaciones como Amnistía Internacional podrían colaborar en la elaboración de este estatuto.",
            "argumentsPro": [
                  "Proteger a las familias de personas desaparecidas",
                  "Facilitar la búsqueda y el apoyo psicológico"
            ],
            "argumentsContra": [
                  "Posible coste fiscal innecesario",
                  "Riesgo de que el estatuto sea redundante"
            ]
      }
],
    votesSummary: {"si":314,"no":0,"abstencion":32,"noVota":4,"total":350},
    groupVotes: [{"groupName":"G.P. Popular (PP)","totalSeats":137,"si":137,"no":0,"abstencion":0,"noVota":0,"color":"#0ea5e9"},{"groupName":"G.P. Socialista (PSOE)","totalSeats":121,"si":121,"no":0,"abstencion":0,"noVota":0,"color":"#ef4444"},{"groupName":"G.P. VOX","totalSeats":33,"si":33,"no":0,"abstencion":0,"noVota":0,"color":"#22c55e"},{"groupName":"G.P. Plurinacional Sumar","totalSeats":27,"si":23,"no":0,"abstencion":4,"noVota":0,"color":"#ec4899"},{"groupName":"G.P. Republicano (ERC)","totalSeats":7,"si":0,"no":0,"abstencion":7,"noVota":0,"color":"#f59e0b"},{"groupName":"G.P. Junts per Catalunya","totalSeats":7,"si":0,"no":0,"abstencion":7,"noVota":0,"color":"#06b6d4"},{"groupName":"G.P. Euskal Herria Bildu","totalSeats":6,"si":0,"no":0,"abstencion":6,"noVota":0,"color":"#84cc16"},{"groupName":"G.P. Vasco (EAJ-PNV)","totalSeats":5,"si":0,"no":0,"abstencion":5,"noVota":0,"color":"#10b981"},{"groupName":"G.P. Mixto (Podemos/BNG/CC/UPN)","totalSeats":7,"si":0,"no":0,"abstencion":3,"noVota":4,"color":"#8b5cf6"}],
    bocgUrl: "https://www.congreso.es/datos-abiertos",
    expedienteNumber: "121/20260910",
  },
  {
    id: "congreso-2026-09-09-1",
    title: "Medidas urgentes para proteger a trabajadores y familias frente a incendios",
    officialTitle: "Real Decreto-ley 20/2026, de 29 de julio, por el que se establecen medidas urgentes de protección laboral y social frente a los incendios forestales.",
    chamber: "congreso",
    date: "2026-09-09",
    time: "18:00 h",
    type: "real_decreto_ley",
    status: "aprobado",
    category: "Empleo",
    summary: "El Congreso aprueba medidas urgentes para proteger a trabajadores y familias afectadas por incendios forestales, ofreciendo ayudas económicas y garantías laborales. Esto supone un alivio para las familias y un respaldo para los empleados.",
    isOmnibus: true,
    threeKeys: {
      "what": "Se establecen ayudas y garantías laborales para afectados por incendios forestales.",
      "pocket": "Ayudas económicas para familias afectadas y garantías de estabilidad laboral para trabajadores.",
      "clash": "Trabajadores buscan estabilidad laboral mientras propietarios inmobiliarios temen costos adicionales."
},
    beforeVsAfter: {
      "before": "Antes, familias y trabajadores se enfrentaban a incertidumbre y pérdidas económicas.",
      "after": "Ahora, se implementan medidas que ofrecen apoyo inmediato y seguridad laboral."
},
    measures: [
      {
            "id": "congreso-2026-09-09-1-m1",
            "title": "Ayudas económicas y garantías laborales",
            "category": "Protección social",
            "plainDescription": "Se establecen ayudas económicas para familias afectadas y garantías de estabilidad laboral para trabajadores.",
            "whoIsAffected": [
                  "Familias afectadas por incendios forestales",
                  "Trabajadores en empresas afectadas por incendios"
            ],
            "realWorldExample": "Juan, un trabajador de una empresa de construcción, perdió su trabajo debido a un incendio forestal en su zona. Gracias a la nueva ley, obtuvo una ayuda económica de 3.000 euros y se le garantizó un periodo de estabilidad laboral de 6 meses, lo que le permitió buscar nuevas oportunidades sin temor a la desempleo.",
            "argumentsPro": [
                  "Ayuda inmediata a familias afectadas",
                  "Estabilidad laboral para trabajadores"
            ],
            "argumentsContra": [
                  "Costos adicionales para empresas",
                  "Posible aumento de la carga fiscal"
            ]
      }
],
    votesSummary: {"si":312,"no":30,"abstencion":1,"noVota":7,"total":350},
    groupVotes: [{"groupName":"G.P. Popular (PP)","totalSeats":137,"si":137,"no":0,"abstencion":0,"noVota":0,"color":"#0ea5e9"},{"groupName":"G.P. Socialista (PSOE)","totalSeats":121,"si":121,"no":0,"abstencion":0,"noVota":0,"color":"#ef4444"},{"groupName":"G.P. VOX","totalSeats":33,"si":33,"no":0,"abstencion":0,"noVota":0,"color":"#22c55e"},{"groupName":"G.P. Plurinacional Sumar","totalSeats":27,"si":21,"no":6,"abstencion":0,"noVota":0,"color":"#ec4899"},{"groupName":"G.P. Republicano (ERC)","totalSeats":7,"si":0,"no":7,"abstencion":0,"noVota":0,"color":"#f59e0b"},{"groupName":"G.P. Junts per Catalunya","totalSeats":7,"si":0,"no":7,"abstencion":0,"noVota":0,"color":"#06b6d4"},{"groupName":"G.P. Euskal Herria Bildu","totalSeats":6,"si":0,"no":6,"abstencion":0,"noVota":0,"color":"#84cc16"},{"groupName":"G.P. Vasco (EAJ-PNV)","totalSeats":5,"si":0,"no":4,"abstencion":1,"noVota":0,"color":"#10b981"},{"groupName":"G.P. Mixto (Podemos/BNG/CC/UPN)","totalSeats":7,"si":0,"no":0,"abstencion":0,"noVota":7,"color":"#8b5cf6"}],
    bocgUrl: "https://www.congreso.es/datos-abiertos",
    expedienteNumber: "121/20260909",
  },
  {
    id: "congreso-2026-09-09-2",
    title: "Medidas urgentes para proteger a los trabajadores en incendios",
    officialTitle: "Tramitación como Proyecto de Ley por el procedimiento de urgencia del Real Decreto-ley 20/2026, de 29 de julio, por el que se establecen medidas urgentes de protección laboral y social frente a los incendios forestales.",
    chamber: "congreso",
    date: "2026-09-09",
    time: "18:00 h",
    type: "real_decreto_ley",
    status: "aprobado",
    category: "Empleo",
    summary: "El Congreso aprueba medidas urgentes para proteger a los trabajadores en incendios forestales, mejorando sus condiciones laborales y sociales. Esto supone un alivio para familias y trabajadores, mientras que los propietarios buscan equilibrar los costes.",
    isOmnibus: true,
    threeKeys: {
      "what": "Establece medidas de protección laboral y social frente a incendios forestales.",
      "pocket": "Ayuda a familias con menores costos de alquiler y apoyo económico para trabajadores afectados.",
      "clash": "Trabajadores buscan mayor seguridad, mientras que propietarios temen aumentos en el coste del alquiler."
},
    beforeVsAfter: {
      "before": "Antes, los trabajadores corrían riesgos sin garantías de protección.",
      "after": "Ahora, se implementan medidas que aseguran su seguridad y bienestar."
},
    measures: [
      {
            "id": "congreso-2026-09-09-2-m1",
            "title": "Subvenciones para alquileres",
            "category": "Vivienda",
            "plainDescription": "Ofrece subvenciones para alquileres a trabajadores afectados por incendios forestales.",
            "whoIsAffected": [
                  "Trabajadores afectados por incendios forestales"
            ],
            "realWorldExample": "Juan, un trabajador forestal, ve reducidos sus costos de alquiler gracias a una subvención que le permite mantenerse en su vivienda sin mayores preocupaciones económicas.",
            "argumentsPro": [
                  "Ayuda a mantener a los trabajadores en su puesto de trabajo",
                  "Permite a las familias afectadas seguir viviendo en su hogar"
            ],
            "argumentsContra": [
                  "Puede aumentar el coste del alquiler para otros inquilinos",
                  "Posible desequilibrio en el mercado inmobiliario"
            ]
      }
],
    votesSummary: {"si":342,"no":0,"abstencion":0,"noVota":8,"total":350},
    groupVotes: [{"groupName":"G.P. Popular (PP)","totalSeats":137,"si":137,"no":0,"abstencion":0,"noVota":0,"color":"#0ea5e9"},{"groupName":"G.P. Socialista (PSOE)","totalSeats":121,"si":121,"no":0,"abstencion":0,"noVota":0,"color":"#ef4444"},{"groupName":"G.P. VOX","totalSeats":33,"si":33,"no":0,"abstencion":0,"noVota":0,"color":"#22c55e"},{"groupName":"G.P. Plurinacional Sumar","totalSeats":27,"si":27,"no":0,"abstencion":0,"noVota":0,"color":"#ec4899"},{"groupName":"G.P. Republicano (ERC)","totalSeats":7,"si":7,"no":0,"abstencion":0,"noVota":0,"color":"#f59e0b"},{"groupName":"G.P. Junts per Catalunya","totalSeats":7,"si":7,"no":0,"abstencion":0,"noVota":0,"color":"#06b6d4"},{"groupName":"G.P. Euskal Herria Bildu","totalSeats":6,"si":6,"no":0,"abstencion":0,"noVota":0,"color":"#84cc16"},{"groupName":"G.P. Vasco (EAJ-PNV)","totalSeats":5,"si":4,"no":0,"abstencion":0,"noVota":1,"color":"#10b981"},{"groupName":"G.P. Mixto (Podemos/BNG/CC/UPN)","totalSeats":7,"si":0,"no":0,"abstencion":0,"noVota":7,"color":"#8b5cf6"}],
    bocgUrl: "https://www.congreso.es/datos-abiertos",
    expedienteNumber: "121/20260909",
  },
  {
    id: "congreso-2026-07-23-1",
    title: "Reforma del Reglamento del Congreso: Mejora la Democracia",
    officialTitle: "Proposición de reforma del Reglamento del Congreso.",
    chamber: "congreso",
    date: "2026-07-23",
    time: "18:00 h",
    type: "proyecto_ley",
    status: "rechazado",
    category: "Política",
    summary: "El Congreso votará una reforma del reglamento que busca mejorar la eficiencia y transparencia. Esto beneficiará a todos los ciudadanos al asegurar que sus representantes tomen decisiones más rápidas y abiertas.",
    isOmnibus: false,
    threeKeys: {
      "what": "Mejora la eficiencia y transparencia del Congreso.",
      "pocket": "No afecta directamente el bolsillo, pero mejora la calidad de la representación.",
      "clash": "Defensores argumentan que es necesario para modernizar el sistema, mientras que opositores temen cambios que podrían afectar a la representación."
},
    beforeVsAfter: {
      "before": "El Congreso opera con un reglamento que data de hace décadas, lo que puede retrasar la toma de decisiones.",
      "after": "Con la nueva regulación, los procesos legislativos se acelerarán y se aumentará la transparencia en las votaciones."
},
    measures: [
      {
            "id": "congreso-2026-07-23-1-m1",
            "title": "Mejora de la Eficiencia en el Congreso",
            "category": "Procedimientos Legislativos",
            "plainDescription": "Establece procedimientos más ágiles para la aprobación de leyes y aumenta la transparencia en las votaciones.",
            "whoIsAffected": [
                  "Representantes",
                  "Ciudadanos"
            ],
            "realWorldExample": "Ana, una representante, podrá votar más rápidamente en sesiones del Congreso, lo que permitirá a sus ciudadanos recibir respuestas más rápidas a sus preocupaciones. Por ejemplo, si Ana vota a favor de una ley que reduce el tiempo de aprobación de subvenciones para pequeños negocios, esto podría permitir que un pequeño comercio reciba su subvención en solo 30 días en lugar de 60.",
            "argumentsPro": [
                  "Permite una toma de decisiones más rápida y eficiente",
                  "Aumenta la transparencia en los procesos legislativos"
            ],
            "argumentsContra": [
                  "Puede reducir la capacidad de debate y consenso",
                  "Posible aumento de la influencia de los partidos mayoritarios"
            ]
      }
],
    votesSummary: {"si":33,"no":315,"abstencion":0,"noVota":2,"total":350},
    groupVotes: [{"groupName":"G.P. Popular (PP)","totalSeats":137,"si":33,"no":104,"abstencion":0,"noVota":0,"color":"#0ea5e9"},{"groupName":"G.P. Socialista (PSOE)","totalSeats":121,"si":0,"no":121,"abstencion":0,"noVota":0,"color":"#ef4444"},{"groupName":"G.P. VOX","totalSeats":33,"si":0,"no":33,"abstencion":0,"noVota":0,"color":"#22c55e"},{"groupName":"G.P. Plurinacional Sumar","totalSeats":27,"si":0,"no":27,"abstencion":0,"noVota":0,"color":"#ec4899"},{"groupName":"G.P. Republicano (ERC)","totalSeats":7,"si":0,"no":7,"abstencion":0,"noVota":0,"color":"#f59e0b"},{"groupName":"G.P. Junts per Catalunya","totalSeats":7,"si":0,"no":7,"abstencion":0,"noVota":0,"color":"#06b6d4"},{"groupName":"G.P. Euskal Herria Bildu","totalSeats":6,"si":0,"no":6,"abstencion":0,"noVota":0,"color":"#84cc16"},{"groupName":"G.P. Vasco (EAJ-PNV)","totalSeats":5,"si":0,"no":5,"abstencion":0,"noVota":0,"color":"#10b981"},{"groupName":"G.P. Mixto (Podemos/BNG/CC/UPN)","totalSeats":7,"si":0,"no":5,"abstencion":0,"noVota":2,"color":"#8b5cf6"}],
    bocgUrl: "https://www.congreso.es/datos-abiertos",
    expedienteNumber: "121/20260723",
  },
  {
    id: "congreso-2026-07-23-2",
    title: "Autopista del Atlántico: Cambios para Galicia",
    officialTitle: "Proposición de Ley Orgánica de transferencia de la titularidad y competencias de la autopista del Atlántico (AP-9) a la Comunidad Autónoma de Galicia.\nVotación en bloque de las enmiendas.",
    chamber: "congreso",
    date: "2026-07-23",
    time: "18:00 h",
    type: "proposicion_ley",
    status: "rechazado",
    category: "Tráfico",
    summary: "El Congreso votará sobre la transferencia de la AP-9 a Galicia, mejorando la gestión y servicio de la autopista para los gallegos.",
    isOmnibus: false,
    threeKeys: {
      "what": "La AP-9 pasa a ser gestionada por Galicia.",
      "pocket": "Impacto limitado en el bolsillo, mejorando el servicio y la seguridad.",
      "clash": "Inquilinos buscan alivios, mientras propietarios temen cambios en el mantenimiento."
},
    beforeVsAfter: {
      "before": "Antes, la AP-9 estaba gestionada por el Estado, con costes de mantenimiento y operación.",
      "after": "Ahora, la AP-9 será gestionada por Galicia, posiblemente con mejoras y ajustes locales."
},
    measures: [
      {
            "id": "congreso-2026-07-23-2-m1",
            "title": "Transferencia de la AP-9 a Galicia",
            "category": "Gestión de infraestructuras",
            "plainDescription": "La medida estipula la transferencia de la titularidad y competencias de la AP-9 a la Comunidad Autónoma de Galicia.",
            "whoIsAffected": [
                  "Conductores y usuarios de la AP-9",
                  "Empresas y trabajadores de la autopista"
            ],
            "realWorldExample": "Juan, un conductor gallego, se beneficiará de mejoras en la seguridad y mantenimiento de la AP-9, lo que podría reducir el tiempo de viaje y costes de reparación de su coche. Mientras tanto, María, propietaria de una empresa de mantenimiento, se preocupa por cómo se gestionará el contrato y si seguirá teniendo trabajo.",
            "argumentsPro": [
                  "Mejora en la seguridad vial y mantenimiento",
                  "Ajustes más locales y adaptados a las necesidades de Galicia"
            ],
            "argumentsContra": [
                  "Incertidumbre sobre el mantenimiento y costes",
                  "Posible pérdida de empleo en empresas de mantenimiento"
            ]
      }
],
    votesSummary: {"si":138,"no":210,"abstencion":0,"noVota":2,"total":350},
    groupVotes: [{"groupName":"G.P. Popular (PP)","totalSeats":137,"si":137,"no":0,"abstencion":0,"noVota":0,"color":"#0ea5e9"},{"groupName":"G.P. Socialista (PSOE)","totalSeats":121,"si":1,"no":120,"abstencion":0,"noVota":0,"color":"#ef4444"},{"groupName":"G.P. VOX","totalSeats":33,"si":0,"no":33,"abstencion":0,"noVota":0,"color":"#22c55e"},{"groupName":"G.P. Plurinacional Sumar","totalSeats":27,"si":0,"no":27,"abstencion":0,"noVota":0,"color":"#ec4899"},{"groupName":"G.P. Republicano (ERC)","totalSeats":7,"si":0,"no":7,"abstencion":0,"noVota":0,"color":"#f59e0b"},{"groupName":"G.P. Junts per Catalunya","totalSeats":7,"si":0,"no":7,"abstencion":0,"noVota":0,"color":"#06b6d4"},{"groupName":"G.P. Euskal Herria Bildu","totalSeats":6,"si":0,"no":6,"abstencion":0,"noVota":0,"color":"#84cc16"},{"groupName":"G.P. Vasco (EAJ-PNV)","totalSeats":5,"si":0,"no":5,"abstencion":0,"noVota":0,"color":"#10b981"},{"groupName":"G.P. Mixto (Podemos/BNG/CC/UPN)","totalSeats":7,"si":0,"no":5,"abstencion":0,"noVota":2,"color":"#8b5cf6"}],
    bocgUrl: "https://www.congreso.es/datos-abiertos",
    expedienteNumber: "121/20260723",
  },
  {
    id: "congreso-2026-07-23-3",
    title: "Medidas urgentes para aliviar la crisis en Oriente Medio",
    officialTitle: "Real Decreto-ley 18/2026, de 29 de junio, por el que se adoptan determinadas medidas en el marco del Plan Integral de Respuesta a la Crisis en Oriente Medio.",
    chamber: "congreso",
    date: "2026-07-23",
    time: "18:00 h",
    type: "real_decreto_ley",
    status: "aprobado",
    category: "Vivienda",
    summary: "El Congreso aprueba un real decreto-ley para aliviar la crisis energética y de alquiler, mejorando la calidad de vida de los ciudadanos.",
    isOmnibus: true,
    threeKeys: {
      "what": "Se implementan ayudas para aliviar el coste de la energía y el alquiler.",
      "pocket": "Familias con presupuestos ajustados podrán ahorrar hasta 300 euros al mes en servicios básicos.",
      "clash": "Inquilinos y propietarios buscan equilibrar el coste de la vivienda, mientras que empresas de alquiler buscan proteger sus inversiones."
},
    beforeVsAfter: {
      "before": "Antes, los inquilinos pagaban un alquiler elevado y los servicios básicos eran costosos.",
      "after": "Ahora, los costes de alquiler y servicios básicos se reducirán, beneficiando a las familias."
},
    measures: [
      {
            "id": "congreso-2026-07-23-3-m1",
            "title": "Ayudas energéticas y alquiler",
            "category": "Energía y Vivienda",
            "plainDescription": "Se establecen bonificaciones para reducir el coste de la energía y el alquiler.",
            "whoIsAffected": [
                  "Familias con bajos ingresos",
                  "Inquilinos"
            ],
            "realWorldExample": "María, una madre soltera con un hijo, podrá ahorrar 200 euros al mes en el alquiler de su piso y 100 euros en la factura de la luz, gracias a las ayudas.",
            "argumentsPro": [
                  "Ayuda a las familias a ahorrar dinero",
                  "Mejora la calidad de vida de los más vulnerables"
            ],
            "argumentsContra": [
                  "Puede afectar la rentabilidad de los propietarios",
                  "Posible aumento de la demanda de alquiler, lo que podría incrementar los precios"
            ]
      }
],
    votesSummary: {"si":175,"no":33,"abstencion":140,"noVota":2,"total":350},
    groupVotes: [{"groupName":"G.P. Popular (PP)","totalSeats":137,"si":137,"no":0,"abstencion":0,"noVota":0,"color":"#0ea5e9"},{"groupName":"G.P. Socialista (PSOE)","totalSeats":121,"si":38,"no":33,"abstencion":50,"noVota":0,"color":"#ef4444"},{"groupName":"G.P. VOX","totalSeats":33,"si":0,"no":0,"abstencion":33,"noVota":0,"color":"#22c55e"},{"groupName":"G.P. Plurinacional Sumar","totalSeats":27,"si":0,"no":0,"abstencion":27,"noVota":0,"color":"#ec4899"},{"groupName":"G.P. Republicano (ERC)","totalSeats":7,"si":0,"no":0,"abstencion":7,"noVota":0,"color":"#f59e0b"},{"groupName":"G.P. Junts per Catalunya","totalSeats":7,"si":0,"no":0,"abstencion":7,"noVota":0,"color":"#06b6d4"},{"groupName":"G.P. Euskal Herria Bildu","totalSeats":6,"si":0,"no":0,"abstencion":6,"noVota":0,"color":"#84cc16"},{"groupName":"G.P. Vasco (EAJ-PNV)","totalSeats":5,"si":0,"no":0,"abstencion":5,"noVota":0,"color":"#10b981"},{"groupName":"G.P. Mixto (Podemos/BNG/CC/UPN)","totalSeats":7,"si":0,"no":0,"abstencion":5,"noVota":2,"color":"#8b5cf6"}],
    bocgUrl: "https://www.congreso.es/datos-abiertos",
    expedienteNumber: "121/20260723",
  },
  {
    id: "congreso-2026-07-23-4",
    title: "Medida urgente para aliviar la crisis en Oriente Medio",
    officialTitle: "Tramitación como Proyecto de Ley por el procedimiento de urgencia del Real Decreto-ley 18/2026, de 29 de junio, por el que se adoptan determinadas medidas en el marco del Plan Integral de Respuesta a la Crisis en Oriente Medio.",
    chamber: "congreso",
    date: "2026-07-23",
    time: "18:00 h",
    type: "real_decreto_ley",
    status: "aprobado",
    category: "Vivienda",
    summary: "El Congreso aprueba medidas urgentes para mitigar la crisis energética, beneficiando a inquilinos y propietarios. Estas acciones buscan aliviar el estrés financiero y promover un equilibrio justo.",
    isOmnibus: true,
    threeKeys: {
      "what": "Se adoptan medidas para mitigar la crisis en Oriente Medio.",
      "pocket": "Ayuda a reducir costos energéticos y aliviar el presupuesto familiar.",
      "clash": "Inquilinos temen subidas de precios, mientras que propietarios buscan garantizar ingresos."
},
    beforeVsAfter: {
      "before": "Antes, los inquilinos pagaban altos precios de alquiler y los propietarios temían pérdidas.",
      "after": "Ahora, se implementan medidas para estabilizar los precios y asegurar un equilibrio entre ambas partes."
},
    measures: [
      {
            "id": "congreso-2026-07-23-4-m1",
            "title": "Subvención energética",
            "category": "Economía familiar",
            "plainDescription": "Se implementa una subvención para reducir los costos energéticos de los inquilinos y propietarios.",
            "whoIsAffected": [
                  "Inquilinos",
                  "Propietarios"
            ],
            "realWorldExample": "Juan, un inquilino, ve reducidos sus gastos de luz y gas en un 20% gracias a la subvención. María, propietaria de un piso, puede mantener sus ingresos estables sin subir los alquileres.",
            "argumentsPro": [
                  "Ayuda a mantener el equilibrio financiero de los inquilinos",
                  "Permite a los propietarios mantener sus ingresos sin aumentar los alquileres"
            ],
            "argumentsContra": [
                  "Inquilinos temen que la subvención sea temporal",
                  "Propietarios temen que la subvención sea un precedente para futuras medidas"
            ]
      }
],
    votesSummary: {"si":344,"no":0,"abstencion":0,"noVota":6,"total":350},
    groupVotes: [{"groupName":"G.P. Popular (PP)","totalSeats":137,"si":137,"no":0,"abstencion":0,"noVota":0,"color":"#0ea5e9"},{"groupName":"G.P. Socialista (PSOE)","totalSeats":121,"si":121,"no":0,"abstencion":0,"noVota":0,"color":"#ef4444"},{"groupName":"G.P. VOX","totalSeats":33,"si":33,"no":0,"abstencion":0,"noVota":0,"color":"#22c55e"},{"groupName":"G.P. Plurinacional Sumar","totalSeats":27,"si":27,"no":0,"abstencion":0,"noVota":0,"color":"#ec4899"},{"groupName":"G.P. Republicano (ERC)","totalSeats":7,"si":7,"no":0,"abstencion":0,"noVota":0,"color":"#f59e0b"},{"groupName":"G.P. Junts per Catalunya","totalSeats":7,"si":7,"no":0,"abstencion":0,"noVota":0,"color":"#06b6d4"},{"groupName":"G.P. Euskal Herria Bildu","totalSeats":6,"si":6,"no":0,"abstencion":0,"noVota":0,"color":"#84cc16"},{"groupName":"G.P. Vasco (EAJ-PNV)","totalSeats":5,"si":5,"no":0,"abstencion":0,"noVota":0,"color":"#10b981"},{"groupName":"G.P. Mixto (Podemos/BNG/CC/UPN)","totalSeats":7,"si":1,"no":0,"abstencion":0,"noVota":6,"color":"#8b5cf6"}],
    bocgUrl: "https://www.congreso.es/datos-abiertos",
    expedienteNumber: "121/20260723",
  },
  {
    id: "congreso-2026-07-23-5",
    title: "Nueva ley ayuda a funcionarios a jubilarse con más tranquilidad",
    officialTitle: "Real Decreto-ley 19/2026, de 29 de junio, de medidas urgentes en materia de jubilación parcial anticipada del personal laboral de las Administraciones Públicas y de complemento de insularidad en Illes Balears.",
    chamber: "congreso",
    date: "2026-07-23",
    time: "18:00 h",
    type: "real_decreto_ley",
    status: "aprobado",
    category: "Empleo",
    summary: "El Congreso aprueba un real decreto-ley que permite a empleados públicos jubilarse parcialmente antes, mejorando su seguridad financiera. Esto supone un alivio para muchos trabajadores que buscan equilibrio entre carrera y vida personal.",
    isOmnibus: true,
    threeKeys: {
      "what": "Permite a empleados públicos jubilarse antes con mejor pensiones.",
      "pocket": "Reduce el estrés financiero al asegurar una mejor pensión anticipada.",
      "clash": "Funcionarios temen perder estabilidad, mientras que sindicatos defienden la justicia en la jubilación."
},
    beforeVsAfter: {
      "before": "Funcionarios temían jubilarse con pensiones insuficientes.",
      "after": "Ahora podrán planificar mejor su retiro con pensiones más seguras."
},
    measures: [
      {
            "id": "congreso-2026-07-23-5-m1",
            "title": "Jubilación parcial anticipada",
            "category": "Retiro anticipado",
            "plainDescription": "Permite a empleados públicos jubilarse parcialmente antes de la edad legal, con mejores condiciones de pensión.",
            "whoIsAffected": [
                  "Funcionarios de las Administraciones Públicas"
            ],
            "realWorldExample": "Juan, un funcionario de 50 años, puede jubilarse a los 55 con un 50% de su salario, asegurando un mejor retiro y tiempo para disfrutar de su familia.",
            "argumentsPro": [
                  "Permite a funcionarios jubilarse con más tranquilidad financiera",
                  "Ofrece flexibilidad para planificar el retiro"
            ],
            "argumentsContra": [
                  "Puede suponer un riesgo para la estabilidad de las Administraciones Públicas",
                  "Puede generar desigualdades entre empleados públicos y privados"
            ]
      }
],
    votesSummary: {"si":167,"no":37,"abstencion":144,"noVota":2,"total":350},
    groupVotes: [{"groupName":"G.P. Popular (PP)","totalSeats":137,"si":137,"no":0,"abstencion":0,"noVota":0,"color":"#0ea5e9"},{"groupName":"G.P. Socialista (PSOE)","totalSeats":121,"si":30,"no":37,"abstencion":54,"noVota":0,"color":"#ef4444"},{"groupName":"G.P. VOX","totalSeats":33,"si":0,"no":0,"abstencion":33,"noVota":0,"color":"#22c55e"},{"groupName":"G.P. Plurinacional Sumar","totalSeats":27,"si":0,"no":0,"abstencion":27,"noVota":0,"color":"#ec4899"},{"groupName":"G.P. Republicano (ERC)","totalSeats":7,"si":0,"no":0,"abstencion":7,"noVota":0,"color":"#f59e0b"},{"groupName":"G.P. Junts per Catalunya","totalSeats":7,"si":0,"no":0,"abstencion":7,"noVota":0,"color":"#06b6d4"},{"groupName":"G.P. Euskal Herria Bildu","totalSeats":6,"si":0,"no":0,"abstencion":6,"noVota":0,"color":"#84cc16"},{"groupName":"G.P. Vasco (EAJ-PNV)","totalSeats":5,"si":0,"no":0,"abstencion":5,"noVota":0,"color":"#10b981"},{"groupName":"G.P. Mixto (Podemos/BNG/CC/UPN)","totalSeats":7,"si":0,"no":0,"abstencion":5,"noVota":2,"color":"#8b5cf6"}],
    bocgUrl: "https://www.congreso.es/datos-abiertos",
    expedienteNumber: "121/20260723",
  },
  {
    id: "congreso-2026-07-23-6",
    title: "Jubilación anticipada: ¿Ayuda o penalización?",
    officialTitle: "Tramitación como Proyecto de Ley por el procedimiento de urgencia del Real Decreto-ley 19/2026, de 29 de junio, de medidas urgentes en materia de jubilación parcial anticipada del personal laboral de las Administraciones Públicas y de complemento de insularidad en Illes Balears.",
    chamber: "congreso",
    date: "2026-07-23",
    time: "18:00 h",
    type: "real_decreto_ley",
    status: "aprobado",
    category: "Empleo",
    summary: "El Congreso discute un Real Decreto-ley que permite la jubilación parcial anticipada en la administración, beneficiando a trabajadores que buscan reducir la carga laboral, pero preocupando a los empresarios por el impacto económico.",
    isOmnibus: true,
    threeKeys: {
      "what": "Permite jubilarse parcialmente antes de los 65 años en la administración.",
      "pocket": "Los pensionistas podrían recibir hasta un 50% de su salario, mientras que los trabajadores podrían perder ingresos.",
      "clash": "Los sindicatos defienden la medida para aliviar la carga de la jubilación, mientras que los empresarios temen un impacto económico."
},
    beforeVsAfter: {
      "before": "Antes, los trabajadores de la administración no podían jubilarse parcialmente antes de los 65 años.",
      "after": "Ahora, podrán hacerlo a partir de los 60 años, con un 50% de su salario, beneficiando a quienes buscan reducir la carga laboral."
},
    measures: [
      {
            "id": "congreso-2026-07-23-6-m1",
            "title": "Jubilación parcial anticipada",
            "category": "Trabajo",
            "plainDescription": "Permite a los trabajadores de la administración jubilarse parcialmente antes de los 65 años, recibiendo un 50% de su salario.",
            "whoIsAffected": [
                  "Trabajadores de la administración",
                  "Pensionistas"
            ],
            "realWorldExample": "Juan, un funcionario de 58 años, podría jubilarse parcialmente, recibiendo 50% de su salario, lo que le permitiría reducir la carga laboral y disfrutar de más tiempo con su familia, mientras que su empresa podría ahorrar en costes de contratación.",
            "argumentsPro": [
                  "Ayuda a reducir la carga laboral",
                  "Permite un mejor equilibrio entre vida personal y profesional"
            ],
            "argumentsContra": [
                  "Puede ser un gasto adicional para las empresas",
                  "Posible desequilibrio en la contratación"
            ]
      }
],
    votesSummary: {"si":347,"no":0,"abstencion":0,"noVota":3,"total":350},
    groupVotes: [{"groupName":"G.P. Popular (PP)","totalSeats":137,"si":137,"no":0,"abstencion":0,"noVota":0,"color":"#0ea5e9"},{"groupName":"G.P. Socialista (PSOE)","totalSeats":121,"si":121,"no":0,"abstencion":0,"noVota":0,"color":"#ef4444"},{"groupName":"G.P. VOX","totalSeats":33,"si":33,"no":0,"abstencion":0,"noVota":0,"color":"#22c55e"},{"groupName":"G.P. Plurinacional Sumar","totalSeats":27,"si":27,"no":0,"abstencion":0,"noVota":0,"color":"#ec4899"},{"groupName":"G.P. Republicano (ERC)","totalSeats":7,"si":7,"no":0,"abstencion":0,"noVota":0,"color":"#f59e0b"},{"groupName":"G.P. Junts per Catalunya","totalSeats":7,"si":7,"no":0,"abstencion":0,"noVota":0,"color":"#06b6d4"},{"groupName":"G.P. Euskal Herria Bildu","totalSeats":6,"si":6,"no":0,"abstencion":0,"noVota":0,"color":"#84cc16"},{"groupName":"G.P. Vasco (EAJ-PNV)","totalSeats":5,"si":5,"no":0,"abstencion":0,"noVota":0,"color":"#10b981"},{"groupName":"G.P. Mixto (Podemos/BNG/CC/UPN)","totalSeats":7,"si":4,"no":0,"abstencion":0,"noVota":3,"color":"#8b5cf6"}],
    bocgUrl: "https://www.congreso.es/datos-abiertos",
    expedienteNumber: "121/20260723",
  },
  {
    id: "congreso-2026-07-23-7",
    title: "Reforma del Reglamento del Congreso: Mejora la Democracia",
    officialTitle: "Proposición de reforma del Reglamento del Congreso.",
    chamber: "congreso",
    date: "2026-07-23",
    time: "18:00 h",
    type: "proyecto_ley",
    status: "aprobado",
    category: "Política",
    summary: "El Congreso votará una reforma del reglamento que busca mejorar la eficiencia y transparencia. Esto beneficiará a todos los ciudadanos al asegurar que sus representantes tomen decisiones más rápidas y abiertas.",
    isOmnibus: false,
    threeKeys: {
      "what": "Mejora la eficiencia y transparencia del Congreso.",
      "pocket": "No afecta directamente el bolsillo, pero mejora la calidad de la representación.",
      "clash": "Defensores argumentan que es necesario para modernizar el sistema, mientras que opositores temen cambios que podrían afectar a la representación."
},
    beforeVsAfter: {
      "before": "El Congreso opera con un reglamento que data de hace décadas, lo que puede retrasar la toma de decisiones.",
      "after": "Con la nueva regulación, los procesos legislativos se acelerarán y se aumentará la transparencia en las votaciones."
},
    measures: [
      {
            "id": "congreso-2026-07-23-7-m1",
            "title": "Mejora de la Eficiencia en el Congreso",
            "category": "Procedimientos Legislativos",
            "plainDescription": "Establece procedimientos más ágiles para la aprobación de leyes y aumenta la transparencia en las votaciones.",
            "whoIsAffected": [
                  "Representantes",
                  "Ciudadanos"
            ],
            "realWorldExample": "Ana, una representante, podrá votar más rápidamente en sesiones del Congreso, lo que permitirá a sus ciudadanos recibir respuestas más rápidas a sus preocupaciones. Por ejemplo, si Ana vota a favor de una ley que reduce el tiempo de aprobación de subvenciones para pequeños negocios, esto podría permitir que un pequeño comercio reciba su subvención en solo 30 días en lugar de 60.",
            "argumentsPro": [
                  "Permite una toma de decisiones más rápida y eficiente",
                  "Aumenta la transparencia en los procesos legislativos"
            ],
            "argumentsContra": [
                  "Puede reducir la capacidad de debate y consenso",
                  "Posible aumento de la influencia de los partidos mayoritarios"
            ]
      }
],
    votesSummary: {"si":178,"no":170,"abstencion":0,"noVota":2,"total":350},
    groupVotes: [{"groupName":"G.P. Popular (PP)","totalSeats":137,"si":137,"no":0,"abstencion":0,"noVota":0,"color":"#0ea5e9"},{"groupName":"G.P. Socialista (PSOE)","totalSeats":121,"si":41,"no":80,"abstencion":0,"noVota":0,"color":"#ef4444"},{"groupName":"G.P. VOX","totalSeats":33,"si":0,"no":33,"abstencion":0,"noVota":0,"color":"#22c55e"},{"groupName":"G.P. Plurinacional Sumar","totalSeats":27,"si":0,"no":27,"abstencion":0,"noVota":0,"color":"#ec4899"},{"groupName":"G.P. Republicano (ERC)","totalSeats":7,"si":0,"no":7,"abstencion":0,"noVota":0,"color":"#f59e0b"},{"groupName":"G.P. Junts per Catalunya","totalSeats":7,"si":0,"no":7,"abstencion":0,"noVota":0,"color":"#06b6d4"},{"groupName":"G.P. Euskal Herria Bildu","totalSeats":6,"si":0,"no":6,"abstencion":0,"noVota":0,"color":"#84cc16"},{"groupName":"G.P. Vasco (EAJ-PNV)","totalSeats":5,"si":0,"no":5,"abstencion":0,"noVota":0,"color":"#10b981"},{"groupName":"G.P. Mixto (Podemos/BNG/CC/UPN)","totalSeats":7,"si":0,"no":5,"abstencion":0,"noVota":2,"color":"#8b5cf6"}],
    bocgUrl: "https://www.congreso.es/datos-abiertos",
    expedienteNumber: "121/20260723",
  },
  {
    id: "congreso-2026-07-23-8",
    title: "Mutualidades alternativas: un paso hacia la seguridad social",
    officialTitle: "Proposición de Ley de modificación del Real Decreto Legislativo 8/2015, de 30 de octubre, por el que se aprueba el texto refundido de la Ley General de la Seguridad Social en relación con las mutualidades alternativas reguladas en sus disposiciones adicionales 18ª y 19ª.",
    chamber: "congreso",
    date: "2026-07-23",
    time: "18:00 h",
    type: "proposicion_ley",
    status: "aprobado",
    category: "Sanidad",
    summary: "El Congreso aprueba una ley que regula las mutualidades alternativas, buscando mejorar la accesibilidad a la sanidad. Esto supone un avance para los ciudadanos que buscan alternativas a la seguridad social tradicional.",
    isOmnibus: false,
    threeKeys: {
      "what": "Establece normas para mutualidades alternativas, mejorando la cobertura sanitaria.",
      "pocket": "Los costes de afiliación a estas mutualidades podrían disminuir, beneficiando a familias con presupuestos ajustados.",
      "clash": "Defensores ven en esta medida una oportunidad para ampliar la cobertura sanitaria, mientras que críticos temen un desequilibrio en la competencia."
},
    beforeVsAfter: {
      "before": "Antes, las mutualidades alternativas operaban con poca regulación, lo que generaba incertidumbre.",
      "after": "Ahora, estas entidades estarán sujetas a un marco legal que promueve la transparencia y la calidad en la prestación de servicios."
},
    measures: [
      {
            "id": "congreso-2026-07-23-8-m1",
            "title": "Regulación de las mutualidades alternativas",
            "category": "Sanidad",
            "plainDescription": "La medida establece normas para las mutualidades alternativas, garantizando la transparencia y la calidad en la prestación de servicios.",
            "whoIsAffected": [
                  "Familias con presupuestos ajustados",
                  "Empresas que ofrecen estos servicios"
            ],
            "realWorldExample": "Juan, un trabajador autónomo, podría beneficiarse de una mutualidad alternativa que le ofrece cobertura a bajo coste, permitiéndole acceder a servicios de salud sin excesivos gastos. En cambio, la competencia entre estas mutualidades y la seguridad social podría intensificarse, generando debates sobre el equilibrio en el mercado.",
            "argumentsPro": [
                  "Ofrece alternativas a la seguridad social tradicional",
                  "Permite a las mutualidades alternativas operar con mayor transparencia"
            ],
            "argumentsContra": [
                  "Puede generar competencia desleal con la seguridad social",
                  "Existe el riesgo de que estas mutualidades no ofrezcan la misma calidad de servicio"
            ]
      }
],
    votesSummary: {"si":334,"no":0,"abstencion":13,"noVota":3,"total":350},
    groupVotes: [{"groupName":"G.P. Popular (PP)","totalSeats":137,"si":137,"no":0,"abstencion":0,"noVota":0,"color":"#0ea5e9"},{"groupName":"G.P. Socialista (PSOE)","totalSeats":121,"si":121,"no":0,"abstencion":0,"noVota":0,"color":"#ef4444"},{"groupName":"G.P. VOX","totalSeats":33,"si":33,"no":0,"abstencion":0,"noVota":0,"color":"#22c55e"},{"groupName":"G.P. Plurinacional Sumar","totalSeats":27,"si":27,"no":0,"abstencion":0,"noVota":0,"color":"#ec4899"},{"groupName":"G.P. Republicano (ERC)","totalSeats":7,"si":7,"no":0,"abstencion":0,"noVota":0,"color":"#f59e0b"},{"groupName":"G.P. Junts per Catalunya","totalSeats":7,"si":7,"no":0,"abstencion":0,"noVota":0,"color":"#06b6d4"},{"groupName":"G.P. Euskal Herria Bildu","totalSeats":6,"si":2,"no":0,"abstencion":4,"noVota":0,"color":"#84cc16"},{"groupName":"G.P. Vasco (EAJ-PNV)","totalSeats":5,"si":0,"no":0,"abstencion":5,"noVota":0,"color":"#10b981"},{"groupName":"G.P. Mixto (Podemos/BNG/CC/UPN)","totalSeats":7,"si":0,"no":0,"abstencion":4,"noVota":3,"color":"#8b5cf6"}],
    bocgUrl: "https://www.congreso.es/datos-abiertos",
    expedienteNumber: "121/20260723",
  },
  {
    id: "congreso-2026-07-23-9",
    title: "Cribado neonatal: mejoras para salvaguardar la salud de los bebés",
    officialTitle: "Proposición de Ley de modificación de normas sobre el programa de cribado neonatal del Sistema Nacional de Salud y de otra normativa.\nVotación de la enmienda.",
    chamber: "congreso",
    date: "2026-07-23",
    time: "18:00 h",
    type: "proposicion_ley",
    status: "aprobado",
    category: "Sanidad",
    summary: "El Congreso votará una enmienda que modifica el programa de cribado neonatal, buscando proteger la salud de los bebés desde el primer momento de su vida. Esto supone un avance en la prevención de enfermedades crónicas.",
    isOmnibus: false,
    threeKeys: {
      "what": "Amplía el programa de cribado para detectar más enfermedades en recién nacidos.",
      "pocket": "No afecta directamente al bolsillo, pero puede salvar vidas y evitar problemas de salud a largo plazo.",
      "clash": "Defensores argumentan que es crucial para la salud infantil, mientras que opositores temen que pueda aumentar la carga burocrática."
},
    beforeVsAfter: {
      "before": "Actualmente, el cribado neonatal detecta ciertas enfermedades, pero no todas.",
      "after": "La nueva ley ampliará el cribado para incluir más condiciones, mejorando la detección temprana."
},
    measures: [
      {
            "id": "congreso-2026-07-23-9-m1",
            "title": "Ampliación del cribado neonatal",
            "category": "Salud infantil",
            "plainDescription": "La medida busca mejorar la detección temprana de enfermedades en recién nacidos, asegurando un diagnóstico y tratamiento más precoz.",
            "whoIsAffected": [
                  "Madres y padres de bebés",
                  "Pediatras y médicos neonatologistas"
            ],
            "realWorldExample": "María, una madre de primerizo, se siente aliviada al saber que su bebé será sometido a un cribado más completo, lo que podría detectar problemas de salud que de otro modo pasarían desapercibidos durante los primeros meses de vida.",
            "argumentsPro": [
                  "Permite un diagnóstico temprano, mejorando la calidad de vida del bebé",
                  "Reduce la carga de enfermedades crónicas a largo plazo"
            ],
            "argumentsContra": [
                  "Puede generar ansiedad innecesaria en las familias",
                  "Posible aumento de la carga de trabajo en los hospitales"
            ]
      }
],
    votesSummary: {"si":185,"no":0,"abstencion":163,"noVota":2,"total":350},
    groupVotes: [{"groupName":"G.P. Popular (PP)","totalSeats":137,"si":137,"no":0,"abstencion":0,"noVota":0,"color":"#0ea5e9"},{"groupName":"G.P. Socialista (PSOE)","totalSeats":121,"si":48,"no":0,"abstencion":73,"noVota":0,"color":"#ef4444"},{"groupName":"G.P. VOX","totalSeats":33,"si":0,"no":0,"abstencion":33,"noVota":0,"color":"#22c55e"},{"groupName":"G.P. Plurinacional Sumar","totalSeats":27,"si":0,"no":0,"abstencion":27,"noVota":0,"color":"#ec4899"},{"groupName":"G.P. Republicano (ERC)","totalSeats":7,"si":0,"no":0,"abstencion":7,"noVota":0,"color":"#f59e0b"},{"groupName":"G.P. Junts per Catalunya","totalSeats":7,"si":0,"no":0,"abstencion":7,"noVota":0,"color":"#06b6d4"},{"groupName":"G.P. Euskal Herria Bildu","totalSeats":6,"si":0,"no":0,"abstencion":6,"noVota":0,"color":"#84cc16"},{"groupName":"G.P. Vasco (EAJ-PNV)","totalSeats":5,"si":0,"no":0,"abstencion":5,"noVota":0,"color":"#10b981"},{"groupName":"G.P. Mixto (Podemos/BNG/CC/UPN)","totalSeats":7,"si":0,"no":0,"abstencion":5,"noVota":2,"color":"#8b5cf6"}],
    bocgUrl: "https://www.congreso.es/datos-abiertos",
    expedienteNumber: "121/20260723",
  },
  {
    id: "congreso-2026-07-23-10",
    title: "Votación sobre ayudas a autónomos y pequeños comercios",
    officialTitle: "Votación conjunta de las enmiendas a la totalidad de devolución al Proyecto de Ley Orgánica de medidas excepcionales de sostenibilidad financiera para las comunidades autónomas de régimen común, presentadas por los Grupos Parlamentarios VOX y Popular en el Congreso.",
    chamber: "congreso",
    date: "2026-07-23",
    time: "18:00 h",
    type: "proyecto_ley",
    status: "rechazado",
    category: "Autónomos",
    summary: "El Congreso votará sobre enmiendas que buscan apoyar a autónomos y pequeños comercios. Esto podría mejorar su situación económica y mantener empleos en la comunidad.",
    isOmnibus: false,
    threeKeys: {
      "what": "Se aprueban ayudas para sostenibilidad financiera de autónomos y pequeños comercios.",
      "pocket": "Ayudas de hasta 5.000 euros para cubrir gastos fijos, aliviando presión económica.",
      "clash": "VOX y Popular defienden ayudas, mientras PSOE y Podemos piden cautela sobre costes y eficacia."
},
    beforeVsAfter: {
      "before": "Antes, muchos autónomos y pequeños comercios luchaban por cubrir gastos fijos.",
      "after": "Ahora, podrán acceder a ayudas que les permiten mantener su actividad."
},
    measures: [
      {
            "id": "congreso-2026-07-23-10-m1",
            "title": "Ayudas para sostenibilidad",
            "category": "Economía",
            "plainDescription": "Ayudas de hasta 5.000 euros para cubrir gastos fijos y mantener la actividad.",
            "whoIsAffected": [
                  "Autónomos",
                  "Pequeños comercios"
            ],
            "realWorldExample": "Juan, un pequeño comerciante, recibirá 3.000 euros para pagar alquiler y suministros, permitiéndole mantener su negocio durante el próximo año.",
            "argumentsPro": [
                  "Ayuda a mantener empleos en la comunidad",
                  "Alivio a la presión económica"
            ],
            "argumentsContra": [
                  "Costes adicionales para el erario público",
                  "Riesgo de desviación de fondos"
            ]
      }
],
    votesSummary: {"si":170,"no":178,"abstencion":0,"noVota":2,"total":350},
    groupVotes: [{"groupName":"G.P. Popular (PP)","totalSeats":137,"si":137,"no":0,"abstencion":0,"noVota":0,"color":"#0ea5e9"},{"groupName":"G.P. Socialista (PSOE)","totalSeats":121,"si":33,"no":88,"abstencion":0,"noVota":0,"color":"#ef4444"},{"groupName":"G.P. VOX","totalSeats":33,"si":0,"no":33,"abstencion":0,"noVota":0,"color":"#22c55e"},{"groupName":"G.P. Plurinacional Sumar","totalSeats":27,"si":0,"no":27,"abstencion":0,"noVota":0,"color":"#ec4899"},{"groupName":"G.P. Republicano (ERC)","totalSeats":7,"si":0,"no":7,"abstencion":0,"noVota":0,"color":"#f59e0b"},{"groupName":"G.P. Junts per Catalunya","totalSeats":7,"si":0,"no":7,"abstencion":0,"noVota":0,"color":"#06b6d4"},{"groupName":"G.P. Euskal Herria Bildu","totalSeats":6,"si":0,"no":6,"abstencion":0,"noVota":0,"color":"#84cc16"},{"groupName":"G.P. Vasco (EAJ-PNV)","totalSeats":5,"si":0,"no":5,"abstencion":0,"noVota":0,"color":"#10b981"},{"groupName":"G.P. Mixto (Podemos/BNG/CC/UPN)","totalSeats":7,"si":0,"no":5,"abstencion":0,"noVota":2,"color":"#8b5cf6"}],
    bocgUrl: "https://www.congreso.es/datos-abiertos",
    expedienteNumber: "121/20260723",
  },
  {
    id: "congreso-2026-07-23-11",
    title: "Estabilidad presupuestaria: objetivos claros para 2027-2029",
    officialTitle: "Acuerdo del Gobierno por el que se fijan los objetivos de estabilidad presupuestaria y de deuda pública para el conjunto de Administraciones Públicas y de cada uno de sus subsectores para el periodo 2027-2029 y el límite de gasto no financiero del presupuesto del Estado para el año 2027.\nSe votan los objetivos de estabilidad presupuestaria y de deuda pública propuestos por el Gobierno.",
    chamber: "congreso",
    date: "2026-07-23",
    time: "18:00 h",
    type: "proyecto_ley",
    status: "rechazado",
    category: "Economía",
    summary: "El Congreso vota los objetivos de estabilidad presupuestaria para los próximos años, buscando equilibrio entre austeridad y servicios públicos. Esto afectará a todos, desde autónomos hasta pensionistas.",
    isOmnibus: false,
    threeKeys: {
      "what": "Establece metas para el gasto público y la deuda",
      "pocket": "Afecta los presupuestos de las familias y empresas",
      "clash": "Gobierno vs. oposición sobre el equilibrio entre austeridad y crecimiento"
},
    beforeVsAfter: {
      "before": "Antes, el gasto público era incierto y las deudas crecían",
      "after": "Ahora, los presupuestos tendrán límites y la deuda se controlará"
},
    measures: [
      {
            "id": "congreso-2026-07-23-11-m1",
            "title": "Objetivos de estabilidad presupuestaria",
            "category": "Gasto público",
            "plainDescription": "Estipula metas para el gasto no financiero del presupuesto del Estado, buscando controlar el gasto y reducir la deuda",
            "whoIsAffected": [
                  "Autónomos",
                  "Pensionistas"
            ],
            "realWorldExample": "Juan, un autónomo, ve cómo sus subvenciones pueden verse reducidas para que el Estado pueda cumplir con su objetivo de estabilidad presupuestaria, mientras que María, una pensionista, se pregunta cómo afectará esto a los servicios públicos que recibe",
            "argumentsPro": [
                  "Controlar el gasto público es necesario para evitar futuros problemas financieros",
                  "Establecer metas claras ayuda a la planificación y transparencia"
            ],
            "argumentsContra": [
                  "Reducir el gasto puede afectar a servicios esenciales",
                  "Es importante no sacrificar el crecimiento económico por la austeridad"
            ]
      }
],
    votesSummary: {"si":166,"no":176,"abstencion":5,"noVota":3,"total":350},
    groupVotes: [{"groupName":"G.P. Popular (PP)","totalSeats":137,"si":137,"no":0,"abstencion":0,"noVota":0,"color":"#0ea5e9"},{"groupName":"G.P. Socialista (PSOE)","totalSeats":121,"si":29,"no":92,"abstencion":0,"noVota":0,"color":"#ef4444"},{"groupName":"G.P. VOX","totalSeats":33,"si":0,"no":33,"abstencion":0,"noVota":0,"color":"#22c55e"},{"groupName":"G.P. Plurinacional Sumar","totalSeats":27,"si":0,"no":27,"abstencion":0,"noVota":0,"color":"#ec4899"},{"groupName":"G.P. Republicano (ERC)","totalSeats":7,"si":0,"no":7,"abstencion":0,"noVota":0,"color":"#f59e0b"},{"groupName":"G.P. Junts per Catalunya","totalSeats":7,"si":0,"no":7,"abstencion":0,"noVota":0,"color":"#06b6d4"},{"groupName":"G.P. Euskal Herria Bildu","totalSeats":6,"si":0,"no":6,"abstencion":0,"noVota":0,"color":"#84cc16"},{"groupName":"G.P. Vasco (EAJ-PNV)","totalSeats":5,"si":0,"no":4,"abstencion":1,"noVota":0,"color":"#10b981"},{"groupName":"G.P. Mixto (Podemos/BNG/CC/UPN)","totalSeats":7,"si":0,"no":0,"abstencion":4,"noVota":3,"color":"#8b5cf6"}],
    bocgUrl: "https://www.congreso.es/datos-abiertos",
    expedienteNumber: "121/20260723",
  },
  {
    id: "congreso-2026-07-14-1",
    title: "Mejoras para personas con discapacidad: autonomía y accesibilidad",
    officialTitle: "Proyecto de Ley por la que se modifican el Texto Refundido de la Ley General de derechos de las personas con discapacidad y de su inclusión social, aprobado por el Real Decreto Legislativo 1/2013, de 29 de noviembre, y la Ley 39/2006, de 14 de diciembre, de Promoción de la Autonomía Personal y Atención a las personas en situación de dependencia, para la extensión y refuerzo de los derechos de las personas con discapacidad a la inclusión, la autonomía y la accesibilidad universal conforme al artículo 49 de la Constitución Española.",
    chamber: "congreso",
    date: "2026-07-14",
    time: "18:00 h",
    type: "mocion",
    status: "rechazado",
    category: "Cuidados",
    summary: "El Congreso aprueba medidas para extender y refuerzar los derechos de personas con discapacidad, mejorando su autonomía y accesibilidad. Esto supone un paso hacia una sociedad más inclusiva y equitativa.",
    isOmnibus: false,
    threeKeys: {
      "what": "Se refuerzan derechos para personas con discapacidad en autonomía y accesibilidad.",
      "pocket": "Se prevé financiación para infraestructuras accesibles y servicios de apoyo.",
      "clash": "Inquilinos y propietarios buscan equilibrar el coste de adaptaciones necesarias."
},
    beforeVsAfter: {
      "before": "Antes, personas con discapacidad enfrentaban barreras en su día a día.",
      "after": "Ahora, se facilita la inclusión y autonomía, mejorando la calidad de vida."
},
    measures: [
      {
            "id": "congreso-2026-07-14-1-m1",
            "title": "Fomento de infraestructuras accesibles",
            "category": "Accesibilidad",
            "plainDescription": "Se establecen ayudas para la adaptación de viviendas y espacios públicos a personas con discapacidad.",
            "whoIsAffected": [
                  "Personas con discapacidad",
                  "Familias con miembros con discapacidad"
            ],
            "realWorldExample": "Juan, un joven con discapacidad motora, podrá adaptar su vivienda para que sea más accesible, lo que le permitirá vivir de manera más independiente y con mayor calidad de vida. Esto costará alrededor de 15.000 euros, pero contará con subvenciones del 50%.",
            "argumentsPro": [
                  "Mejora la calidad de vida de personas con discapacidad",
                  "Facilita su independencia y autonomía"
            ],
            "argumentsContra": [
                  "Costo para propietarios que deben asumir adaptaciones",
                  "Inquietud sobre el uso de fondos públicos"
            ]
      }
],
    votesSummary: {"si":26,"no":315,"abstencion":0,"noVota":9,"total":350},
    groupVotes: [{"groupName":"G.P. Popular (PP)","totalSeats":137,"si":26,"no":111,"abstencion":0,"noVota":0,"color":"#0ea5e9"},{"groupName":"G.P. Socialista (PSOE)","totalSeats":121,"si":0,"no":121,"abstencion":0,"noVota":0,"color":"#ef4444"},{"groupName":"G.P. VOX","totalSeats":33,"si":0,"no":33,"abstencion":0,"noVota":0,"color":"#22c55e"},{"groupName":"G.P. Plurinacional Sumar","totalSeats":27,"si":0,"no":27,"abstencion":0,"noVota":0,"color":"#ec4899"},{"groupName":"G.P. Republicano (ERC)","totalSeats":7,"si":0,"no":7,"abstencion":0,"noVota":0,"color":"#f59e0b"},{"groupName":"G.P. Junts per Catalunya","totalSeats":7,"si":0,"no":7,"abstencion":0,"noVota":0,"color":"#06b6d4"},{"groupName":"G.P. Euskal Herria Bildu","totalSeats":6,"si":0,"no":6,"abstencion":0,"noVota":0,"color":"#84cc16"},{"groupName":"G.P. Vasco (EAJ-PNV)","totalSeats":5,"si":0,"no":3,"abstencion":0,"noVota":2,"color":"#10b981"},{"groupName":"G.P. Mixto (Podemos/BNG/CC/UPN)","totalSeats":7,"si":0,"no":0,"abstencion":0,"noVota":7,"color":"#8b5cf6"}],
    bocgUrl: "https://www.congreso.es/datos-abiertos",
    expedienteNumber: "121/20260714",
  },
  {
    id: "congreso-2026-07-14-2",
    title: "Estabilidad presupuestaria: objetivos claros para 2027-2029",
    officialTitle: "Acuerdo del Gobierno por el que se fijan los objetivos de estabilidad presupuestaria y de deuda pública para el conjunto de Administraciones Públicas y de cada uno de sus subsectores para el periodo 2027-2029 y el límite de gasto no financiero del presupuesto del Estado para el año 2027.\nSe votan los objetivos de estabilidad presupuestaria y de deuda pública propuestos por el Gobierno.",
    chamber: "congreso",
    date: "2026-07-14",
    time: "18:00 h",
    type: "proyecto_ley",
    status: "rechazado",
    category: "Economía",
    summary: "El Congreso vota los objetivos de estabilidad presupuestaria para los próximos años, buscando equilibrio entre austeridad y servicios públicos. Esto afectará a todos, desde autónomos hasta pensionistas.",
    isOmnibus: false,
    threeKeys: {
      "what": "Establece metas para el gasto público y la deuda",
      "pocket": "Afecta los presupuestos de las familias y empresas",
      "clash": "Gobierno vs. oposición sobre el equilibrio entre austeridad y crecimiento"
},
    beforeVsAfter: {
      "before": "Antes, el gasto público era incierto y las deudas crecían",
      "after": "Ahora, los presupuestos tendrán límites y la deuda se controlará"
},
    measures: [
      {
            "id": "congreso-2026-07-14-2-m1",
            "title": "Objetivos de estabilidad presupuestaria",
            "category": "Gasto público",
            "plainDescription": "Estipula metas para el gasto no financiero del presupuesto del Estado, buscando controlar el gasto y reducir la deuda",
            "whoIsAffected": [
                  "Autónomos",
                  "Pensionistas"
            ],
            "realWorldExample": "Juan, un autónomo, ve cómo sus subvenciones pueden verse reducidas para que el Estado pueda cumplir con su objetivo de estabilidad presupuestaria, mientras que María, una pensionista, se pregunta cómo afectará esto a los servicios públicos que recibe",
            "argumentsPro": [
                  "Controlar el gasto público es necesario para evitar futuros problemas financieros",
                  "Establecer metas claras ayuda a la planificación y transparencia"
            ],
            "argumentsContra": [
                  "Reducir el gasto puede afectar a servicios esenciales",
                  "Es importante no sacrificar el crecimiento económico por la austeridad"
            ]
      }
],
    votesSummary: {"si":167,"no":178,"abstencion":5,"noVota":0,"total":350},
    groupVotes: [{"groupName":"G.P. Popular (PP)","totalSeats":137,"si":137,"no":0,"abstencion":0,"noVota":0,"color":"#0ea5e9"},{"groupName":"G.P. Socialista (PSOE)","totalSeats":121,"si":30,"no":91,"abstencion":0,"noVota":0,"color":"#ef4444"},{"groupName":"G.P. VOX","totalSeats":33,"si":0,"no":33,"abstencion":0,"noVota":0,"color":"#22c55e"},{"groupName":"G.P. Plurinacional Sumar","totalSeats":27,"si":0,"no":27,"abstencion":0,"noVota":0,"color":"#ec4899"},{"groupName":"G.P. Republicano (ERC)","totalSeats":7,"si":0,"no":7,"abstencion":0,"noVota":0,"color":"#f59e0b"},{"groupName":"G.P. Junts per Catalunya","totalSeats":7,"si":0,"no":7,"abstencion":0,"noVota":0,"color":"#06b6d4"},{"groupName":"G.P. Euskal Herria Bildu","totalSeats":6,"si":0,"no":6,"abstencion":0,"noVota":0,"color":"#84cc16"},{"groupName":"G.P. Vasco (EAJ-PNV)","totalSeats":5,"si":0,"no":5,"abstencion":0,"noVota":0,"color":"#10b981"},{"groupName":"G.P. Mixto (Podemos/BNG/CC/UPN)","totalSeats":7,"si":0,"no":2,"abstencion":5,"noVota":0,"color":"#8b5cf6"}],
    bocgUrl: "https://www.congreso.es/datos-abiertos",
    expedienteNumber: "121/20260714",
  },
  {
    id: "congreso-2026-07-14-3",
    title: "Medida para Radio Televisión Española: Impacto en el bolsillo y en la emisión",
    officialTitle: "Real Decreto-ley 16/2026, de 16 de junio, de medidas para garantizar la prestación del servicio público encomendado a la Corporación Radio Televisión Española, S.A., S.M.E.",
    chamber: "congreso",
    date: "2026-07-14",
    time: "18:00 h",
    type: "real_decreto_ley",
    status: "rechazado",
    category: "Empleo",
    summary: "El Congreso aprueba un Real Decreto-ley para mejorar las condiciones laborales de los trabajadores de RTVE, aumentando sus salarios y asegurando su estabilidad, beneficiando a 1.500 empleados y mejorando su calidad de vida.",
    isOmnibus: true,
    threeKeys: {
      "what": "Establece condiciones laborales para trabajadores de RTVE y garantiza su estabilidad.",
      "pocket": "Aumento del salario mínimo para trabajadores de RTVE, beneficiando a 1.500 empleados.",
      "clash": "Trabajadores de RTVE apoyan la medida para mejorar sus condiciones, mientras que algunos empresarios temen incrementos en costes operativos."
},
    beforeVsAfter: {
      "before": "Trabajadores de RTVE percibían salarios inferiores al salario mínimo legal.",
      "after": "Los trabajadores de RTVE recibirán salarios al menos iguales al salario mínimo legal, mejorando sus condiciones laborales."
},
    measures: [
      {
            "id": "congreso-2026-07-14-3-m1",
            "title": "Aumento del salario mínimo para trabajadores de RTVE",
            "category": "Salarios",
            "plainDescription": "Establece un salario mínimo para los trabajadores de RTVE, al menos igual al salario mínimo legal vigente.",
            "whoIsAffected": [
                  "Trabajadores de RTVE"
            ],
            "realWorldExample": "María, una trabajadora de RTVE con 10 años de experiencia, percibirá un aumento de su salario, pasando de 1.200 euros al mes a 1.500 euros, lo que le permitirá cubrir mejor sus gastos mensuales y mejorar su calidad de vida.",
            "argumentsPro": [
                  "Mejora de la calidad de vida y estabilidad laboral de los trabajadores",
                  "Aumento en la productividad y satisfacción laboral"
            ],
            "argumentsContra": [
                  "Incremento en los costes operativos para RTVE",
                  "Posible impacto en la competitividad de la empresa"
            ]
      }
],
    votesSummary: {"si":172,"no":178,"abstencion":0,"noVota":0,"total":350},
    groupVotes: [{"groupName":"G.P. Popular (PP)","totalSeats":137,"si":137,"no":0,"abstencion":0,"noVota":0,"color":"#0ea5e9"},{"groupName":"G.P. Socialista (PSOE)","totalSeats":121,"si":35,"no":86,"abstencion":0,"noVota":0,"color":"#ef4444"},{"groupName":"G.P. VOX","totalSeats":33,"si":0,"no":33,"abstencion":0,"noVota":0,"color":"#22c55e"},{"groupName":"G.P. Plurinacional Sumar","totalSeats":27,"si":0,"no":27,"abstencion":0,"noVota":0,"color":"#ec4899"},{"groupName":"G.P. Republicano (ERC)","totalSeats":7,"si":0,"no":7,"abstencion":0,"noVota":0,"color":"#f59e0b"},{"groupName":"G.P. Junts per Catalunya","totalSeats":7,"si":0,"no":7,"abstencion":0,"noVota":0,"color":"#06b6d4"},{"groupName":"G.P. Euskal Herria Bildu","totalSeats":6,"si":0,"no":6,"abstencion":0,"noVota":0,"color":"#84cc16"},{"groupName":"G.P. Vasco (EAJ-PNV)","totalSeats":5,"si":0,"no":5,"abstencion":0,"noVota":0,"color":"#10b981"},{"groupName":"G.P. Mixto (Podemos/BNG/CC/UPN)","totalSeats":7,"si":0,"no":7,"abstencion":0,"noVota":0,"color":"#8b5cf6"}],
    bocgUrl: "https://www.congreso.es/datos-abiertos",
    expedienteNumber: "121/20260714",
  },
  {
    id: "congreso-2026-07-14-4",
    title: "Ayuda para cuidadores: un paso hacia la autonomía",
    officialTitle: "Real Decreto-ley 17/2026, de 23 de junio, de medidas extraordinarias para el fortalecimiento y consolidación del Sistema para la Autonomía y Atención a la Dependencia.",
    chamber: "congreso",
    date: "2026-07-14",
    time: "18:00 h",
    type: "real_decreto_ley",
    status: "aprobado",
    category: "Cuidados",
    summary: "El Congreso aprueba un real decreto-ley para fortalecer el sistema de autonomía y atención a la dependencia, mejorando la calidad de vida de los cuidadores y personas dependientes.",
    isOmnibus: true,
    threeKeys: {
      "what": "Establece un sistema para apoyar a los cuidadores y personas dependientes.",
      "pocket": "Reduce el coste de la atención a la dependencia, aliviando la carga financiera de los cuidadores.",
      "clash": "Defensores de la medida argumentan que es necesario para aliviar la presión familiar, mientras que críticos temen que podría aumentar la carga fiscal."
},
    beforeVsAfter: {
      "before": "Antes, los cuidadores y personas dependientes enfrentaban dificultades para acceder a la atención necesaria.",
      "after": "Ahora, se facilita el acceso a servicios de atención a la dependencia, mejorando la calidad de vida de los cuidadores y los cuidados."
},
    measures: [
      {
            "id": "congreso-2026-07-14-4-m1",
            "title": "Subvenciones para cuidadores",
            "category": "Ayuda a los cuidadores",
            "plainDescription": "Ofrece subvenciones para ayudar a los cuidadores a asumir los costes de la atención a la dependencia.",
            "whoIsAffected": [
                  "Cuidadores",
                  "Personas dependientes"
            ],
            "realWorldExample": "Juan, un cuidador de su madre anciana, se beneficiará de una subvención que le permitirá contratar a una asistenta doméstica para aliviar su carga diaria, mejorando la calidad de vida de ambos.",
            "argumentsPro": [
                  "Ayuda a reducir la carga financiera de los cuidadores",
                  "Mejora la calidad de vida de las personas dependientes"
            ],
            "argumentsContra": [
                  "Puede aumentar la carga fiscal",
                  "Posible desigualdad en la distribución de subvenciones"
            ]
      }
],
    votesSummary: {"si":317,"no":33,"abstencion":0,"noVota":0,"total":350},
    groupVotes: [{"groupName":"G.P. Popular (PP)","totalSeats":137,"si":137,"no":0,"abstencion":0,"noVota":0,"color":"#0ea5e9"},{"groupName":"G.P. Socialista (PSOE)","totalSeats":121,"si":121,"no":0,"abstencion":0,"noVota":0,"color":"#ef4444"},{"groupName":"G.P. VOX","totalSeats":33,"si":33,"no":0,"abstencion":0,"noVota":0,"color":"#22c55e"},{"groupName":"G.P. Plurinacional Sumar","totalSeats":27,"si":26,"no":1,"abstencion":0,"noVota":0,"color":"#ec4899"},{"groupName":"G.P. Republicano (ERC)","totalSeats":7,"si":0,"no":7,"abstencion":0,"noVota":0,"color":"#f59e0b"},{"groupName":"G.P. Junts per Catalunya","totalSeats":7,"si":0,"no":7,"abstencion":0,"noVota":0,"color":"#06b6d4"},{"groupName":"G.P. Euskal Herria Bildu","totalSeats":6,"si":0,"no":6,"abstencion":0,"noVota":0,"color":"#84cc16"},{"groupName":"G.P. Vasco (EAJ-PNV)","totalSeats":5,"si":0,"no":5,"abstencion":0,"noVota":0,"color":"#10b981"},{"groupName":"G.P. Mixto (Podemos/BNG/CC/UPN)","totalSeats":7,"si":0,"no":7,"abstencion":0,"noVota":0,"color":"#8b5cf6"}],
    bocgUrl: "https://www.congreso.es/datos-abiertos",
    expedienteNumber: "121/20260714",
  },
  {
    id: "congreso-2026-07-14-5",
    title: "Fortalecimiento del Sistema de Dependencia: Medidas Urgentes",
    officialTitle: "Tramitación como Proyecto de Ley por el procedimiento de urgencia del Real Decreto-ley 17/2026, de 23 de junio, de medidas extraordinarias para el fortalecimiento y consolidación del Sistema para la Autonomía y Atención a la Dependencia.",
    chamber: "congreso",
    date: "2026-07-14",
    time: "18:00 h",
    type: "real_decreto_ley",
    status: "aprobado",
    category: "Autónomos",
    summary: "El Congreso votará sobre un Real Decreto-ley que busca fortalecer el sistema de dependencia, mejorando la atención a personas en situación de dependencia y aliviando el coste para autónomos y trabajadores.",
    isOmnibus: true,
    threeKeys: {
      "what": "Establece medidas urgentes para mejorar el sistema de atención a personas dependientes.",
      "pocket": "Ayuda a autónomos y trabajadores a reducir costes de cuidados, aliviando el peso en sus presupuestos.",
      "clash": "Defensores argumentan que es necesario para mejorar la calidad de vida de dependientes, mientras que críticos temen un aumento de la deuda pública."
},
    beforeVsAfter: {
      "before": "Antes, los autónomos y trabajadores pagaban altas cuotas de dependencia, afectando sus ingresos.",
      "after": "Con la nueva ley, se espera que los costes de cuidados sean más manejables, mejorando la calidad de vida de dependientes y sus cuidadores."
},
    measures: [
      {
            "id": "congreso-2026-07-14-5-m1",
            "title": "Subvenciones para Cuidadores",
            "category": "Cuidados",
            "plainDescription": "Ofrece subvenciones a autónomos y trabajadores que cuidan a familiares dependientes, reduciendo sus costos de atención.",
            "whoIsAffected": [
                  "Autónomos que cuidan de familiares",
                  "Trabajadores que cuidan de familiares"
            ],
            "realWorldExample": "Juan, un autónomo de 45 años, cuida de su madre anciana. Con la nueva ley, recibirá una subvención mensual de 300 euros para cubrir parte de los costos de atención, lo que le permitirá invertir más en su negocio.",
            "argumentsPro": [
                  "Ayuda a mantener a autónomos en su actividad",
                  "Mejora la calidad de vida de dependientes"
            ],
            "argumentsContra": [
                  "Puede aumentar la deuda pública",
                  "Posible desigualdad si no todos pueden acceder"
            ]
      }
],
    votesSummary: {"si":344,"no":0,"abstencion":5,"noVota":1,"total":350},
    groupVotes: [{"groupName":"G.P. Popular (PP)","totalSeats":137,"si":137,"no":0,"abstencion":0,"noVota":0,"color":"#0ea5e9"},{"groupName":"G.P. Socialista (PSOE)","totalSeats":121,"si":121,"no":0,"abstencion":0,"noVota":0,"color":"#ef4444"},{"groupName":"G.P. VOX","totalSeats":33,"si":33,"no":0,"abstencion":0,"noVota":0,"color":"#22c55e"},{"groupName":"G.P. Plurinacional Sumar","totalSeats":27,"si":27,"no":0,"abstencion":0,"noVota":0,"color":"#ec4899"},{"groupName":"G.P. Republicano (ERC)","totalSeats":7,"si":7,"no":0,"abstencion":0,"noVota":0,"color":"#f59e0b"},{"groupName":"G.P. Junts per Catalunya","totalSeats":7,"si":7,"no":0,"abstencion":0,"noVota":0,"color":"#06b6d4"},{"groupName":"G.P. Euskal Herria Bildu","totalSeats":6,"si":6,"no":0,"abstencion":0,"noVota":0,"color":"#84cc16"},{"groupName":"G.P. Vasco (EAJ-PNV)","totalSeats":5,"si":5,"no":0,"abstencion":0,"noVota":0,"color":"#10b981"},{"groupName":"G.P. Mixto (Podemos/BNG/CC/UPN)","totalSeats":7,"si":1,"no":0,"abstencion":5,"noVota":1,"color":"#8b5cf6"}],
    bocgUrl: "https://www.congreso.es/datos-abiertos",
    expedienteNumber: "121/20260714",
  },
  {
    id: "congreso-2026-07-14-6",
    title: "Mejoras para personas con discapacidad: autonomía y accesibilidad",
    officialTitle: "Votación del dictamen del Proyecto de Ley por la que se modifican el Texto Refundido de la Ley General de derechos de las personas con discapacidad y de su inclusión social, aprobado por el Real Decreto Legislativo 1/2013, de 29 de noviembre, y la Ley 39/2006, de 14 de diciembre, de Promoción de la Autonomía Personal y Atención a las personas en situación de dependencia, para la extensión y refuerzo de los derechos de las personas con discapacidad a la inclusión, la autonomía y la accesibilidad universal conforme al artículo 49 de la Constitución Española.",
    chamber: "congreso",
    date: "2026-07-14",
    time: "18:00 h",
    type: "mocion",
    status: "aprobado",
    category: "Cuidados",
    summary: "El Congreso votará sobre la extensión de derechos para personas con discapacidad, mejorando su calidad de vida y autonomía.",
    isOmnibus: false,
    threeKeys: {
      "what": "Se refuerzan derechos de personas con discapacidad para mayor autonomía y accesibilidad.",
      "pocket": "Ayudas económicas para adaptaciones en viviendas y servicios de apoyo.",
      "clash": "Defensores de la ley argumentan necesidad de inclusión, mientras opositores temen alargue de presupuesto."
},
    beforeVsAfter: {
      "before": "Antes, personas con discapacidad enfrentaban barreras en su día a día.",
      "after": "Ahora, se facilita su autonomía y se garantiza mayor accesibilidad en la sociedad."
},
    measures: [
      {
            "id": "congreso-2026-07-14-6-m1",
            "title": "Subvenciones para adaptaciones en viviendas",
            "category": "Accesibilidad",
            "plainDescription": "Se proporcionan ayudas económicas para adaptar viviendas a las necesidades de personas con discapacidad.",
            "whoIsAffected": [
                  "Personas con discapacidad",
                  "Familiares y cuidadores"
            ],
            "realWorldExample": "Juan, un joven con discapacidad motora, recibió una subvención para instalar un ascensor en su casa, lo que le permitió moverse con mayor facilidad y autonomía. Su madre, Ana, agradeció el alivio económico que le permitió hacer estas adaptaciones sin grandes gastos.",
            "argumentsPro": [
                  "Permite a personas con discapacidad vivir con mayor autonomía en sus hogares.",
                  "Ayuda a reducir la dependencia de servicios de apoyo externos"
            ],
            "argumentsContra": [
                  "Puede resultar costoso para el presupuesto del Estado.",
                  "Se teme que el alargue de subvenciones pueda afectar a otros programas sociales"
            ]
      }
],
    votesSummary: {"si":179,"no":33,"abstencion":137,"noVota":1,"total":350},
    groupVotes: [{"groupName":"G.P. Popular (PP)","totalSeats":137,"si":137,"no":0,"abstencion":0,"noVota":0,"color":"#0ea5e9"},{"groupName":"G.P. Socialista (PSOE)","totalSeats":121,"si":42,"no":33,"abstencion":46,"noVota":0,"color":"#ef4444"},{"groupName":"G.P. VOX","totalSeats":33,"si":0,"no":0,"abstencion":33,"noVota":0,"color":"#22c55e"},{"groupName":"G.P. Plurinacional Sumar","totalSeats":27,"si":0,"no":0,"abstencion":27,"noVota":0,"color":"#ec4899"},{"groupName":"G.P. Republicano (ERC)","totalSeats":7,"si":0,"no":0,"abstencion":7,"noVota":0,"color":"#f59e0b"},{"groupName":"G.P. Junts per Catalunya","totalSeats":7,"si":0,"no":0,"abstencion":7,"noVota":0,"color":"#06b6d4"},{"groupName":"G.P. Euskal Herria Bildu","totalSeats":6,"si":0,"no":0,"abstencion":6,"noVota":0,"color":"#84cc16"},{"groupName":"G.P. Vasco (EAJ-PNV)","totalSeats":5,"si":0,"no":0,"abstencion":5,"noVota":0,"color":"#10b981"},{"groupName":"G.P. Mixto (Podemos/BNG/CC/UPN)","totalSeats":7,"si":0,"no":0,"abstencion":6,"noVota":1,"color":"#8b5cf6"}],
    bocgUrl: "https://www.congreso.es/datos-abiertos",
    expedienteNumber: "121/20260714",
  },
  {
    id: "congreso-2026-07-14-7",
    title: "Libertad de expresión: un paso hacia la protección plena",
    officialTitle: "Proposición de Ley Orgánica de reforma de la Ley Orgánica 10/1995, de 23 de noviembre, del Código Penal para la protección de la libertad de expresión.",
    chamber: "congreso",
    date: "2026-07-14",
    time: "18:00 h",
    type: "proposicion_ley",
    status: "rechazado",
    category: "Justicia",
    summary: "El Congreso aprueba una reforma que endurece las penas para proteger la libertad de expresión, un derecho crucial para la sociedad. Esto beneficiará a periodistas, activistas y ciudadanos en general, aunque algunos temen por la seguridad de quienes puedan criticar públicamente.",
    isOmnibus: false,
    threeKeys: {
      "what": "Establece penas más severas para delitos contra la libertad de expresión.",
      "pocket": "No afecta directamente al bolsillo, pero protege el derecho a la libertad de expresión.",
      "clash": "Defensores de la libertad de expresión ven esta ley como necesaria, mientras que quienes temen por la seguridad ven posibles riesgos."
},
    beforeVsAfter: {
      "before": "Antes, la protección de la libertad de expresión era limitada y los delitos contra ella tenían penas suaves.",
      "after": "Ahora, los delitos contra la libertad de expresión serán castigados con penas más severas, protegiendo mejor este derecho fundamental."
},
    measures: [
      {
            "id": "congreso-2026-07-14-7-m1",
            "title": "Fortalecimiento de la protección de la libertad de expresión",
            "category": "Derechos fundamentales",
            "plainDescription": "Estipula penas más severas para aquellos que atenten contra la libertad de expresión, garantizando un entorno más seguro para quienes ejercen este derecho.",
            "whoIsAffected": [
                  "Periodistas",
                  "Activistas",
                  "Ciudadanos"
            ],
            "realWorldExample": "Juan, un periodista, es amenazado por un grupo extremista. Antes, la ley no garantizaba una sanción adecuada. Ahora, gracias a esta reforma, su caso sería tratado con mayor seriedad, protegiéndolo mejor en el futuro.",
            "argumentsPro": [
                  "Protege a los periodistas y activistas que denuncian corrupción o abuso de poder.",
                  "Fomenta un ambiente más abierto y democrático."
            ],
            "argumentsContra": [
                  "Puede limitar la libertad de expresión si se malinterpreta la ley.",
                  "Puede ser utilizado para silenciar críticas justas o legítimas."
            ]
      }
],
    votesSummary: {"si":33,"no":179,"abstencion":138,"noVota":0,"total":350},
    groupVotes: [{"groupName":"G.P. Popular (PP)","totalSeats":137,"si":33,"no":104,"abstencion":0,"noVota":0,"color":"#0ea5e9"},{"groupName":"G.P. Socialista (PSOE)","totalSeats":121,"si":0,"no":75,"abstencion":46,"noVota":0,"color":"#ef4444"},{"groupName":"G.P. VOX","totalSeats":33,"si":0,"no":0,"abstencion":33,"noVota":0,"color":"#22c55e"},{"groupName":"G.P. Plurinacional Sumar","totalSeats":27,"si":0,"no":0,"abstencion":27,"noVota":0,"color":"#ec4899"},{"groupName":"G.P. Republicano (ERC)","totalSeats":7,"si":0,"no":0,"abstencion":7,"noVota":0,"color":"#f59e0b"},{"groupName":"G.P. Junts per Catalunya","totalSeats":7,"si":0,"no":0,"abstencion":7,"noVota":0,"color":"#06b6d4"},{"groupName":"G.P. Euskal Herria Bildu","totalSeats":6,"si":0,"no":0,"abstencion":6,"noVota":0,"color":"#84cc16"},{"groupName":"G.P. Vasco (EAJ-PNV)","totalSeats":5,"si":0,"no":0,"abstencion":5,"noVota":0,"color":"#10b981"},{"groupName":"G.P. Mixto (Podemos/BNG/CC/UPN)","totalSeats":7,"si":0,"no":0,"abstencion":7,"noVota":0,"color":"#8b5cf6"}],
    bocgUrl: "https://www.congreso.es/datos-abiertos",
    expedienteNumber: "121/20260714",
  },
  {
    id: "congreso-2026-06-25-1",
    title: "Ley para acelerar tratamientos innovadores",
    officialTitle: "Proyecto de Ley por la que se modifica la Ley de Garantías y Uso Racional de Medicamentos y Productos Sanitarios para agilizar el acceso a tratamientos innovadores.",
    chamber: "congreso",
    date: "2026-06-25",
    time: "16:30 h",
    type: "proyecto_ley",
    status: "aprobado",
    category: "Sanidad",
    summary: "La ley modifica el marco legal para acelerar la aprobación de tratamientos innovadores, mejorando el acceso a nuevos medicamentos y productos sanitarios.",
    isOmnibus: false,
    threeKeys: {
      "what": "Facilitar el acceso a nuevos tratamientos médicos.",
      "pocket": "Reducción del tiempo de espera para tratamientos, posibles ahorros en costos.",
      "clash": "Proponentes argumentan mejora de la salud pública, opositores temen desigualdad en acceso."
},
    beforeVsAfter: {
      "before": "Proceso actual lento para aprobación de nuevos tratamientos.",
      "after": "Aumento en la velocidad de aprobación y disponibilidad de tratamientos innovadores."
},
    measures: [
      {
            "id": "congreso-2026-06-25-1-m1",
            "title": "Aceleración de la aprobación de tratamientos",
            "category": "Regulación sanitaria",
            "plainDescription": "Simplificar y acelerar los procesos de aprobación de nuevos tratamientos.",
            "whoIsAffected": [
                  "Empresas farmacéuticas",
                  "Institutos de investigación médica"
            ],
            "realWorldExample": "Una empresa farmacéutica podría ver reducidos los tiempos de espera para la aprobación de un nuevo medicamento de 18 meses a 12 meses, lo que permitiría un acceso más rápido a un tratamiento innovador.",
            "argumentsPro": [
                  "Mejora la salud pública al acelerar el acceso a tratamientos",
                  "Fomenta la innovación en el sector farmacéutico"
            ],
            "argumentsContra": [
                  "Puede reducir la seguridad de los tratamientos",
                  "Puede generar desigualdad en el acceso a tratamientos"
            ]
      }
],
    votesSummary: {"si":180,"no":168,"abstencion":2,"noVota":0,"total":350},
    groupVotes: [{"groupName":"G.P. Popular (PP)","totalSeats":137,"si":137,"no":0,"abstencion":0,"noVota":0,"color":"#0ea5e9"},{"groupName":"G.P. Socialista (PSOE)","totalSeats":121,"si":43,"no":78,"abstencion":0,"noVota":0,"color":"#ef4444"},{"groupName":"G.P. VOX","totalSeats":33,"si":0,"no":33,"abstencion":0,"noVota":0,"color":"#22c55e"},{"groupName":"G.P. Plurinacional Sumar","totalSeats":27,"si":0,"no":27,"abstencion":0,"noVota":0,"color":"#ec4899"},{"groupName":"G.P. Republicano (ERC)","totalSeats":7,"si":0,"no":7,"abstencion":0,"noVota":0,"color":"#f59e0b"},{"groupName":"G.P. Junts per Catalunya","totalSeats":7,"si":0,"no":7,"abstencion":0,"noVota":0,"color":"#06b6d4"},{"groupName":"G.P. Euskal Herria Bildu","totalSeats":6,"si":0,"no":6,"abstencion":0,"noVota":0,"color":"#84cc16"},{"groupName":"G.P. Vasco (EAJ-PNV)","totalSeats":5,"si":0,"no":5,"abstencion":0,"noVota":0,"color":"#10b981"},{"groupName":"G.P. Mixto (Podemos/BNG/CC/UPN)","totalSeats":7,"si":0,"no":5,"abstencion":2,"noVota":0,"color":"#8b5cf6"}],
    bocgUrl: "https://www.congreso.es/datos-abiertos",
    expedienteNumber: "121/000072",
  },
  {
    id: "congreso-2026-06-23-1",
    title: "Reforma del control al Gobierno: más transparencia y rendición de cuentas",
    officialTitle: "Proposición del Grupo Parlamentario Popular en el Congreso, de reforma del Reglamento del Congreso relativa a las sesiones de control al Gobierno.",
    chamber: "congreso",
    date: "2026-06-23",
    time: "18:00 h",
    type: "proyecto_ley",
    status: "aprobado",
    category: "Tráfico",
    summary: "El Congreso discute reformas para fortalecer el control sobre el Gobierno, lo que puede mejorar la calidad de vida de los ciudadanos al asegurar que las políticas se implementen de manera justa y equitativa.",
    isOmnibus: false,
    threeKeys: {
      "what": "Permite al Congreso mayor supervisión del Gobierno en sus decisiones",
      "pocket": "Ayuda a garantizar que las políticas beneficien a todos, no solo a unos pocos",
      "clash": "Los partidos se dividen entre quienes creen en más control y transparencia y quienes temen que esto interfiera con la eficiencia gubernamental"
},
    beforeVsAfter: {
      "before": "Antes, el control del Congreso sobre el Gobierno era limitado y poco efectivo",
      "after": "Ahora, las sesiones de control serán más frecuentes y rigurosas, mejorando la calidad de la democracia"
},
    measures: [
      {
            "id": "congreso-2026-06-23-1-m1",
            "title": "Sesiones de control más frecuentes y rigurosas",
            "category": "Transparencia",
            "plainDescription": "Establece un marco para que el Congreso pueda realizar sesiones de control más frecuentes y detalladas sobre las acciones del Gobierno",
            "whoIsAffected": [
                  "Políticos y funcionarios",
                  "Ciudadanos y organizaciones de la sociedad civil"
            ],
            "realWorldExample": "Un autónomo, Juan, puede presentar una queja sobre el tráfico en su zona a una sesión de control, donde se discutirá la eficacia de las medidas de tráfico implementadas por el Gobierno. Esto podría llevar a mejoras en la infraestructura vial y en la gestión del tráfico.",
            "argumentsPro": [
                  "Permite a los ciudadanos expresar sus inquietudes y preocupaciones",
                  "Facilita la responsabilidad y rendición de cuentas de los políticos y funcionarios"
            ],
            "argumentsContra": [
                  "Puede interrumpir la eficiencia del Gobierno",
                  "Exige más tiempo y recursos para la planificación y ejecución de políticas"
            ]
      }
],
    votesSummary: {"si":175,"no":171,"abstencion":1,"noVota":3,"total":350},
    groupVotes: [{"groupName":"G.P. Popular (PP)","totalSeats":137,"si":137,"no":0,"abstencion":0,"noVota":0,"color":"#0ea5e9"},{"groupName":"G.P. Socialista (PSOE)","totalSeats":121,"si":38,"no":83,"abstencion":0,"noVota":0,"color":"#ef4444"},{"groupName":"G.P. VOX","totalSeats":33,"si":0,"no":33,"abstencion":0,"noVota":0,"color":"#22c55e"},{"groupName":"G.P. Plurinacional Sumar","totalSeats":27,"si":0,"no":27,"abstencion":0,"noVota":0,"color":"#ec4899"},{"groupName":"G.P. Republicano (ERC)","totalSeats":7,"si":0,"no":7,"abstencion":0,"noVota":0,"color":"#f59e0b"},{"groupName":"G.P. Junts per Catalunya","totalSeats":7,"si":0,"no":7,"abstencion":0,"noVota":0,"color":"#06b6d4"},{"groupName":"G.P. Euskal Herria Bildu","totalSeats":6,"si":0,"no":6,"abstencion":0,"noVota":0,"color":"#84cc16"},{"groupName":"G.P. Vasco (EAJ-PNV)","totalSeats":5,"si":0,"no":5,"abstencion":0,"noVota":0,"color":"#10b981"},{"groupName":"G.P. Mixto (Podemos/BNG/CC/UPN)","totalSeats":7,"si":0,"no":3,"abstencion":1,"noVota":3,"color":"#8b5cf6"}],
    bocgUrl: "https://www.congreso.es/datos-abiertos",
    expedienteNumber: "121/20260623",
  },
  {
    id: "congreso-2026-06-23-2",
    title: "Fortalecimiento de medidas contra el fraude electoral",
    officialTitle: "Proposición de Ley del Grupo Parlamentario VOX, Orgánica por la que se modifica la Ley Orgánica 5/1985, de 19 de junio, del Régimen Electoral General, para reforzar la prevención del fraude electoral.",
    chamber: "congreso",
    date: "2026-06-23",
    time: "18:00 h",
    type: "proposicion_ley",
    status: "rechazado",
    category: "Justicia",
    summary: "El Congreso discute una propuesta para fortalecer la prevención del fraude electoral, lo que podría mejorar la confianza en las instituciones democráticas, aunque algunos temen que restrinja la libertad de expresión.",
    isOmnibus: false,
    threeKeys: {
      "what": "Reforzar controles para evitar manipulaciones en votaciones.",
      "pocket": "No afecta directamente al bolsillo de los ciudadanos, pero mejora la confianza en el sistema democrático.",
      "clash": "Defensores ven la necesidad de proteger la integridad del voto, mientras que críticos temen que restrinja la libertad de expresión."
},
    beforeVsAfter: {
      "before": "Antes, el riesgo de fraude electoral era un temor latente para muchos ciudadanos.",
      "after": "Ahora, las nuevas regulaciones buscan garantizar un proceso electoral más seguro y transparente."
},
    measures: [
      {
            "id": "congreso-2026-06-23-2-m1",
            "title": "Reforzamiento de controles en el proceso electoral",
            "category": "Seguridad Electoral",
            "plainDescription": "La medida busca implementar nuevas tecnologías y procedimientos para detectar y prevenir el fraude electoral.",
            "whoIsAffected": [
                  "Votantes",
                  "Organizadores de eventos electorales"
            ],
            "realWorldExample": "Juan, un votante de 65 años, se siente más seguro al saber que las nuevas medidas incluyen el uso de sistemas de verificación biométrica para identificar a los votantes, lo que reduce el riesgo de manipulaciones.",
            "argumentsPro": [
                  "Preocupación por la integridad del voto",
                  "Mejora en la confianza ciudadana en el sistema democrático"
            ],
            "argumentsContra": [
                  "Inquietud sobre la privacidad",
                  "Temor a que restrinja la libertad de expresión"
            ]
      }
],
    votesSummary: {"si":33,"no":176,"abstencion":138,"noVota":3,"total":350},
    groupVotes: [{"groupName":"G.P. Popular (PP)","totalSeats":137,"si":33,"no":104,"abstencion":0,"noVota":0,"color":"#0ea5e9"},{"groupName":"G.P. Socialista (PSOE)","totalSeats":121,"si":0,"no":72,"abstencion":49,"noVota":0,"color":"#ef4444"},{"groupName":"G.P. VOX","totalSeats":33,"si":0,"no":0,"abstencion":33,"noVota":0,"color":"#22c55e"},{"groupName":"G.P. Plurinacional Sumar","totalSeats":27,"si":0,"no":0,"abstencion":27,"noVota":0,"color":"#ec4899"},{"groupName":"G.P. Republicano (ERC)","totalSeats":7,"si":0,"no":0,"abstencion":7,"noVota":0,"color":"#f59e0b"},{"groupName":"G.P. Junts per Catalunya","totalSeats":7,"si":0,"no":0,"abstencion":7,"noVota":0,"color":"#06b6d4"},{"groupName":"G.P. Euskal Herria Bildu","totalSeats":6,"si":0,"no":0,"abstencion":6,"noVota":0,"color":"#84cc16"},{"groupName":"G.P. Vasco (EAJ-PNV)","totalSeats":5,"si":0,"no":0,"abstencion":5,"noVota":0,"color":"#10b981"},{"groupName":"G.P. Mixto (Podemos/BNG/CC/UPN)","totalSeats":7,"si":0,"no":0,"abstencion":4,"noVota":3,"color":"#8b5cf6"}],
    bocgUrl: "https://www.congreso.es/datos-abiertos",
    expedienteNumber: "121/20260623",
  },
  {
    id: "congreso-2026-06-18-1",
    title: "Combatiendo el odio en el deporte: una medida clave",
    officialTitle: "Proposición no de Ley del Grupo Parlamentario Socialista, sobre medidas para combatir los discursos de odio en el deporte español.\nSe vota en los términos de la enmienda transaccional presentada por el Grupo Parlamentario Socialista y el Grupo Parlamentario Republicano.",
    chamber: "congreso",
    date: "2026-06-18",
    time: "18:00 h",
    type: "mocion",
    status: "aprobado",
    category: "Deportes",
    summary: "El Congreso vota por una ley que busca erradicar los discursos de odio en el deporte, mejorando la experiencia de los espectadores y protegiendo a los atletas.",
    isOmnibus: false,
    threeKeys: {
      "what": "Establece normas para prevenir y sancionar discursos de odio en los estadios.",
      "pocket": "Ayuda a crear un ambiente más seguro y respetuoso, evitando incidentes que podrían afectar a los asistentes.",
      "clash": "Defensores ven la necesidad de proteger a los espectadores, mientras que críticos temen que restrinja la libertad de expresión."
},
    beforeVsAfter: {
      "before": "Antes, los incidentes de odio en los estadios eran frecuentes y afectaban a muchos espectadores.",
      "after": "Con la nueva regulación, se espera un ambiente más seguro y respetuoso para todos los asistentes."
},
    measures: [
      {
            "id": "congreso-2026-06-18-1-m1",
            "title": "Normas para prevenir y sancionar discursos de odio",
            "category": "Seguridad y respeto",
            "plainDescription": "Establece reglas claras para identificar y castigar comportamientos abusivos en los estadios.",
            "whoIsAffected": [
                  "Espectadores",
                  "Atletas"
            ],
            "realWorldExample": "Juan, un padre de familia, asiste a un partido de fútbol con su hijo. Un grupo de hinchas comienza a gritar insultos racistas. Según la nueva ley, los organizadores deben actuar inmediatamente para garantizar la seguridad y el respeto de todos los asistentes.",
            "argumentsPro": [
                  "Protege a los espectadores y atletas de comportamientos abusivos",
                  "Fomenta un ambiente más inclusivo y respetuoso"
            ],
            "argumentsContra": [
                  "Puede limitar la libertad de expresión",
                  "Se teme que las sanciones sean demasiado severas"
            ]
      }
],
    votesSummary: {"si":176,"no":33,"abstencion":138,"noVota":3,"total":350},
    groupVotes: [{"groupName":"G.P. Popular (PP)","totalSeats":137,"si":137,"no":0,"abstencion":0,"noVota":0,"color":"#0ea5e9"},{"groupName":"G.P. Socialista (PSOE)","totalSeats":121,"si":39,"no":33,"abstencion":49,"noVota":0,"color":"#ef4444"},{"groupName":"G.P. VOX","totalSeats":33,"si":0,"no":0,"abstencion":33,"noVota":0,"color":"#22c55e"},{"groupName":"G.P. Plurinacional Sumar","totalSeats":27,"si":0,"no":0,"abstencion":27,"noVota":0,"color":"#ec4899"},{"groupName":"G.P. Republicano (ERC)","totalSeats":7,"si":0,"no":0,"abstencion":7,"noVota":0,"color":"#f59e0b"},{"groupName":"G.P. Junts per Catalunya","totalSeats":7,"si":0,"no":0,"abstencion":7,"noVota":0,"color":"#06b6d4"},{"groupName":"G.P. Euskal Herria Bildu","totalSeats":6,"si":0,"no":0,"abstencion":6,"noVota":0,"color":"#84cc16"},{"groupName":"G.P. Vasco (EAJ-PNV)","totalSeats":5,"si":0,"no":0,"abstencion":5,"noVota":0,"color":"#10b981"},{"groupName":"G.P. Mixto (Podemos/BNG/CC/UPN)","totalSeats":7,"si":0,"no":0,"abstencion":4,"noVota":3,"color":"#8b5cf6"}],
    bocgUrl: "https://www.congreso.es/datos-abiertos",
    expedienteNumber: "121/20260618",
  },
  {
    id: "congreso-2026-06-18-2",
    title: "Transporte más sostenible, menos estrés",
    officialTitle: "Proposición no de Ley del Grupo Parlamentario Popular en el Congreso, relativa a la defensa del transporte en España ante los incumplimientos de la Ley de Movilidad Sostenible.",
    chamber: "congreso",
    date: "2026-06-18",
    time: "18:00 h",
    type: "mocion",
    status: "aprobado",
    category: "Tráfico",
    summary: "El Congreso votará sobre sanciones para incumplimientos de la Ley de Movilidad Sostenible, buscando un equilibrio entre la protección del medio ambiente y la flexibilidad para los ciudadanos.",
    isOmnibus: false,
    threeKeys: {
      "what": "Establece sanciones para incumplimientos de la Ley de Movilidad Sostenible.",
      "pocket": "Reducción de multas para conductores que respeten el uso de vehículos eléctricos.",
      "clash": "Defensores ven la medida como necesaria para la sostenibilidad, mientras que otros temen que sea un exceso de regulación."
},
    beforeVsAfter: {
      "before": "Conducción sin sanciones por incumplir la Ley de Movilidad Sostenible.",
      "after": "Aplicación de multas para quienes no cumplan la ley, incentivando el uso de vehículos más ecológicos."
},
    measures: [
      {
            "id": "congreso-2026-06-18-2-m1",
            "title": "Sanciones justas para incumplimientos",
            "category": "Ecológico",
            "plainDescription": "Establece sanciones para aquellos que no cumplan con la Ley de Movilidad Sostenible, promoviendo el uso de vehículos más ecológicos.",
            "whoIsAffected": [
                  "Conductores que no usen vehículos eléctricos",
                  "Empresas de transporte que no cumplan con normativas"
            ],
            "realWorldExample": "Juan, un conductor que ha estado utilizando su coche de gasolina, podría enfrentarse a una multa de 100 euros si no cambia a un vehículo eléctrico en los próximos meses. Esto podría aliviar su bolsillo y ayudar a la sostenibilidad del medio ambiente.",
            "argumentsPro": [
                  "Promover el uso de vehículos más ecológicos",
                  "Mejorar la calidad del aire en las ciudades"
            ],
            "argumentsContra": [
                  "Puede ser un exceso de regulación",
                  "Costo adicional para los conductores"
            ]
      }
],
    votesSummary: {"si":180,"no":31,"abstencion":136,"noVota":3,"total":350},
    groupVotes: [{"groupName":"G.P. Popular (PP)","totalSeats":137,"si":137,"no":0,"abstencion":0,"noVota":0,"color":"#0ea5e9"},{"groupName":"G.P. Socialista (PSOE)","totalSeats":121,"si":43,"no":31,"abstencion":47,"noVota":0,"color":"#ef4444"},{"groupName":"G.P. VOX","totalSeats":33,"si":0,"no":0,"abstencion":33,"noVota":0,"color":"#22c55e"},{"groupName":"G.P. Plurinacional Sumar","totalSeats":27,"si":0,"no":0,"abstencion":27,"noVota":0,"color":"#ec4899"},{"groupName":"G.P. Republicano (ERC)","totalSeats":7,"si":0,"no":0,"abstencion":7,"noVota":0,"color":"#f59e0b"},{"groupName":"G.P. Junts per Catalunya","totalSeats":7,"si":0,"no":0,"abstencion":7,"noVota":0,"color":"#06b6d4"},{"groupName":"G.P. Euskal Herria Bildu","totalSeats":6,"si":0,"no":0,"abstencion":6,"noVota":0,"color":"#84cc16"},{"groupName":"G.P. Vasco (EAJ-PNV)","totalSeats":5,"si":0,"no":0,"abstencion":5,"noVota":0,"color":"#10b981"},{"groupName":"G.P. Mixto (Podemos/BNG/CC/UPN)","totalSeats":7,"si":0,"no":0,"abstencion":4,"noVota":3,"color":"#8b5cf6"}],
    bocgUrl: "https://www.congreso.es/datos-abiertos",
    expedienteNumber: "121/20260618",
  },
  {
    id: "congreso-2026-06-18-3",
    title: "Garantizar CUIDADOS: Mejora en Prestación CUME",
    officialTitle: "Moción consecuencia de interpelación urgente del Grupo Parlamentario Vasco (EAJ-PNV), sobre las medidas que piensa adoptar el Gobierno para garantizar el correcto funcionamiento de la prestación por Cuidado de Menores con Enfermedad Grave (CUME).",
    chamber: "congreso",
    date: "2026-06-18",
    time: "18:00 h",
    type: "mocion",
    status: "aprobado",
    category: "Cuidados",
    summary: "El Congreso aprueba una moción para mejorar la prestación CUME, beneficiando a 20.000 familias. Esto supone un alivio financiero crucial para los padres de menores con enfermedades graves.",
    isOmnibus: false,
    threeKeys: {
      "what": "Ampliación de la prestación para familias con menores enfermos.",
      "pocket": "Subida del 10% en el importe mensual, beneficiando a 20.000 familias.",
      "clash": "Familias beneficiarias agradecen el apoyo, mientras que economistas advierten de la presión fiscal."
},
    beforeVsAfter: {
      "before": "Antes, las familias con menores enfermos luchaban con un módico subsidio.",
      "after": "Ahora, la prestación se incrementa, aliviando la carga económica."
},
    measures: [
      {
            "id": "congreso-2026-06-18-3-m1",
            "title": "Incremento de la Prestación CUME",
            "category": "Economía Familiar",
            "plainDescription": "La medida aumenta el importe mensual de la prestación para familias con menores enfermos.",
            "whoIsAffected": [
                  "Familias con menores de 18 años con enfermedad grave"
            ],
            "realWorldExample": "María, madre de Lucas, 12 años, con una enfermedad crónica, ve cómo su ayuda mensual sube de 500 a 550 euros, lo que le permite comprar medicamentos y alimentos necesarios para el tratamiento de su hijo.",
            "argumentsPro": [
                  "Ayuda a cubrir gastos médicos y de alimentación",
                  "Mejora la calidad de vida de los menores"
            ],
            "argumentsContra": [
                  "Puede generar presión fiscal",
                  "Necesidad de un seguimiento riguroso para evitar abusos"
            ]
      }
],
    votesSummary: {"si":226,"no":0,"abstencion":121,"noVota":3,"total":350},
    groupVotes: [{"groupName":"G.P. Popular (PP)","totalSeats":137,"si":137,"no":0,"abstencion":0,"noVota":0,"color":"#0ea5e9"},{"groupName":"G.P. Socialista (PSOE)","totalSeats":121,"si":89,"no":0,"abstencion":32,"noVota":0,"color":"#ef4444"},{"groupName":"G.P. VOX","totalSeats":33,"si":0,"no":0,"abstencion":33,"noVota":0,"color":"#22c55e"},{"groupName":"G.P. Plurinacional Sumar","totalSeats":27,"si":0,"no":0,"abstencion":27,"noVota":0,"color":"#ec4899"},{"groupName":"G.P. Republicano (ERC)","totalSeats":7,"si":0,"no":0,"abstencion":7,"noVota":0,"color":"#f59e0b"},{"groupName":"G.P. Junts per Catalunya","totalSeats":7,"si":0,"no":0,"abstencion":7,"noVota":0,"color":"#06b6d4"},{"groupName":"G.P. Euskal Herria Bildu","totalSeats":6,"si":0,"no":0,"abstencion":6,"noVota":0,"color":"#84cc16"},{"groupName":"G.P. Vasco (EAJ-PNV)","totalSeats":5,"si":0,"no":0,"abstencion":5,"noVota":0,"color":"#10b981"},{"groupName":"G.P. Mixto (Podemos/BNG/CC/UPN)","totalSeats":7,"si":0,"no":0,"abstencion":4,"noVota":3,"color":"#8b5cf6"}],
    bocgUrl: "https://www.congreso.es/datos-abiertos",
    expedienteNumber: "121/20260618",
  },
  {
    id: "congreso-2026-06-18-4",
    title: "Vivienda social: prioridad para todos",
    officialTitle: "Moción consecuencia de interpelación urgente del Grupo Parlamentario VOX, sobre las medidas que va a adoptar el Gobierno para garantizar que los españoles siempre vayan primero para comprar, alquilar o recibir una vivienda social.",
    chamber: "congreso",
    date: "2026-06-18",
    time: "18:00 h",
    type: "mocion",
    status: "rechazado",
    category: "Vivienda",
    summary: "El Congreso aprueba una moción que garantiza la prioridad en la adquisición de viviendas sociales para los ciudadanos, mejorando su calidad de vida y aliviando el estrés financiero.",
    isOmnibus: false,
    threeKeys: {
      "what": "La moción garantiza que los españoles tengan preferencia en la compra, alquiler o recepción de viviendas sociales.",
      "pocket": "Los ciudadanos beneficiados podrán acceder a menores precios y mejores condiciones, aliviando el estrés financiero.",
      "clash": "Los defensores de la medida argumentan que es justo que los ciudadanos tengan prioridad, mientras que los opositores temen que esto pueda afectar a la eficiencia del mercado."
},
    beforeVsAfter: {
      "before": "Antes, los procesos de compra, alquiler o recepción de viviendas sociales eran abiertos a todo el público.",
      "after": "Ahora, los españoles tendrán prioridad en la adquisición de viviendas sociales, facilitando el acceso a la vivienda."
},
    measures: [
      {
            "id": "congreso-2026-06-18-4-m1",
            "title": "Prioridad en viviendas sociales",
            "category": "Acceso a la vivienda",
            "plainDescription": "Los ciudadanos españoles tendrán preferencia en la compra, alquiler o recepción de viviendas sociales, asegurando un acceso más justo y equitativo.",
            "whoIsAffected": [
                  "Familias con bajos ingresos",
                  "Jóvenes en formación",
                  "Personas mayores"
            ],
            "realWorldExample": "María, una joven estudiante de 22 años, podría acceder a una vivienda social con un precio 15% más bajo que el promedio, gracias a su estatus de ciudadano español, lo que le permitiría ahorrar 300 euros al mes en alquiler.",
            "argumentsPro": [
                  "Es justo que los ciudadanos tengan prioridad en la adquisición de viviendas sociales",
                  "Ayuda a reducir la brecha social y el acceso a la vivienda"
            ],
            "argumentsContra": [
                  "Puede afectar la eficiencia del mercado y la calidad de las viviendas",
                  "Se podría crear un sistema de favoritismo"
            ]
      }
],
    votesSummary: {"si":33,"no":314,"abstencion":0,"noVota":3,"total":350},
    groupVotes: [{"groupName":"G.P. Popular (PP)","totalSeats":137,"si":33,"no":104,"abstencion":0,"noVota":0,"color":"#0ea5e9"},{"groupName":"G.P. Socialista (PSOE)","totalSeats":121,"si":0,"no":121,"abstencion":0,"noVota":0,"color":"#ef4444"},{"groupName":"G.P. VOX","totalSeats":33,"si":0,"no":33,"abstencion":0,"noVota":0,"color":"#22c55e"},{"groupName":"G.P. Plurinacional Sumar","totalSeats":27,"si":0,"no":27,"abstencion":0,"noVota":0,"color":"#ec4899"},{"groupName":"G.P. Republicano (ERC)","totalSeats":7,"si":0,"no":7,"abstencion":0,"noVota":0,"color":"#f59e0b"},{"groupName":"G.P. Junts per Catalunya","totalSeats":7,"si":0,"no":7,"abstencion":0,"noVota":0,"color":"#06b6d4"},{"groupName":"G.P. Euskal Herria Bildu","totalSeats":6,"si":0,"no":6,"abstencion":0,"noVota":0,"color":"#84cc16"},{"groupName":"G.P. Vasco (EAJ-PNV)","totalSeats":5,"si":0,"no":5,"abstencion":0,"noVota":0,"color":"#10b981"},{"groupName":"G.P. Mixto (Podemos/BNG/CC/UPN)","totalSeats":7,"si":0,"no":4,"abstencion":0,"noVota":3,"color":"#8b5cf6"}],
    bocgUrl: "https://www.congreso.es/datos-abiertos",
    expedienteNumber: "121/20260618",
  },
  {
    id: "congreso-2026-06-18-5",
    title: "Urgente: Gobierno evalúa situación económica del país",
    officialTitle: "Moción consecuencia de interpelación urgente del Grupo Parlamentario Popular en el Congreso, sobre la valoración que hace el Vicepresidente Primero del Gobierno y Ministro de Economía, Comercio y Empresa de la situación de extrema debilidad del Gobierno.",
    chamber: "congreso",
    date: "2026-06-18",
    time: "18:00 h",
    type: "mocion",
    status: "aprobado",
    category: "Economía",
    summary: "El Congreso debatirá sobre la situación económica del país, lo que podría tener impacto en los bolsillos de los ciudadanos y los negocios locales.",
    isOmnibus: false,
    threeKeys: {
      "what": "El Vicepresidente evalúa la situación económica del país.",
      "pocket": "Esta valoración podría afectar a los presupuestos de familias y autónomos.",
      "clash": "El PP pide urgencia, mientras el Gobierno busca equilibrio en las medidas económicas."
},
    beforeVsAfter: {
      "before": "Antes, los ciudadanos se enfrentaban a incertidumbre económica.",
      "after": "Ahora, se espera una mayor claridad en las decisiones económicas del Gobierno."
},
    measures: [
      {
            "id": "congreso-2026-06-18-5-m1",
            "title": "Evaluación de la situación económica",
            "category": "Evaluación",
            "plainDescription": "El Gobierno evalúa la situación económica actual para tomar decisiones informadas.",
            "whoIsAffected": [
                  "Familias con presupuestos ajustados",
                  "Autónomos y pequeños empresarios"
            ],
            "realWorldExample": "Juan, un autónomo, se plantea si invertir en nuevo equipamiento. La evaluación del Gobierno podría influir en su decisión, ya que podría proporcionar más seguridad en el futuro económico del país.",
            "argumentsPro": [
                  "Ofrecer claridad y estabilidad a los ciudadanos",
                  "Permitir tomar decisiones basadas en datos actualizados"
            ],
            "argumentsContra": [
                  "Posible demora en la toma de decisiones",
                  "Riesgo de cambios drásticos sin previo aviso"
            ]
      }
],
    votesSummary: {"si":177,"no":164,"abstencion":6,"noVota":3,"total":350},
    groupVotes: [{"groupName":"G.P. Popular (PP)","totalSeats":137,"si":137,"no":0,"abstencion":0,"noVota":0,"color":"#0ea5e9"},{"groupName":"G.P. Socialista (PSOE)","totalSeats":121,"si":40,"no":81,"abstencion":0,"noVota":0,"color":"#ef4444"},{"groupName":"G.P. VOX","totalSeats":33,"si":0,"no":33,"abstencion":0,"noVota":0,"color":"#22c55e"},{"groupName":"G.P. Plurinacional Sumar","totalSeats":27,"si":0,"no":27,"abstencion":0,"noVota":0,"color":"#ec4899"},{"groupName":"G.P. Republicano (ERC)","totalSeats":7,"si":0,"no":7,"abstencion":0,"noVota":0,"color":"#f59e0b"},{"groupName":"G.P. Junts per Catalunya","totalSeats":7,"si":0,"no":7,"abstencion":0,"noVota":0,"color":"#06b6d4"},{"groupName":"G.P. Euskal Herria Bildu","totalSeats":6,"si":0,"no":6,"abstencion":0,"noVota":0,"color":"#84cc16"},{"groupName":"G.P. Vasco (EAJ-PNV)","totalSeats":5,"si":0,"no":3,"abstencion":2,"noVota":0,"color":"#10b981"},{"groupName":"G.P. Mixto (Podemos/BNG/CC/UPN)","totalSeats":7,"si":0,"no":0,"abstencion":4,"noVota":3,"color":"#8b5cf6"}],
    bocgUrl: "https://www.congreso.es/datos-abiertos",
    expedienteNumber: "121/20260618",
  },
  {
    id: "congreso-2026-06-18-6",
    title: "Nueva ley protege a familias y autónomos",
    officialTitle: "Real Decreto-ley 12/2026, de 26 de mayo, por el que se declaran diversas iniciativas y programas como acontecimientos de excepcional interés público.",
    chamber: "congreso",
    date: "2026-06-18",
    time: "18:00 h",
    type: "real_decreto_ley",
    status: "aprobado",
    category: "Vivienda",
    summary: "El Congreso aprueba medidas para aliviar el coste del alquiler y reducir impuestos para autónomos, mejorando la calidad de vida de las familias y pequeños empresarios.",
    isOmnibus: true,
    threeKeys: {
      "what": "Se declaran medidas para aliviar el coste de la vivienda y proteger a los inquilinos y autónomos.",
      "pocket": "Ayudas económicas para alquiler y reducción de impuestos para autónomos, beneficiando directamente a los bolsillos de las familias.",
      "clash": "Inquilinos y autónomos agradecen las ayudas, mientras que propietarios y inversores temen un impacto negativo en la rentabilidad."
},
    beforeVsAfter: {
      "before": "Antes, muchos inquilinos luchaban por pagar el alquiler y autónomos veían aumentar sus costes.",
      "after": "Ahora, las ayudas y reducciones fiscales hacen que la vida cotidiana sea un poco más llevadera."
},
    measures: [
      {
            "id": "congreso-2026-06-18-6-m1",
            "title": "Ayuda al alquiler",
            "category": "Habitabilidad",
            "plainDescription": "Se establece un programa de ayudas económicas para los inquilinos con bajos ingresos.",
            "whoIsAffected": [
                  "Inquilinos con bajos ingresos",
                  "Familias con presupuestos ajustados"
            ],
            "realWorldExample": "Juan, un trabajador autónomo, se beneficiará de una ayuda de 100 euros al mes para cubrir parte del alquiler de su vivienda, lo que le permitirá ahorrar en otros gastos.",
            "argumentsPro": [
                  "Ayuda a los más vulnerables",
                  "Alivio en el coste del alquiler"
            ],
            "argumentsContra": [
                  "Puede afectar la rentabilidad de los propietarios",
                  "Posible aumento de la demanda de alquileres"
            ]
      }
],
    votesSummary: {"si":304,"no":33,"abstencion":10,"noVota":3,"total":350},
    groupVotes: [{"groupName":"G.P. Popular (PP)","totalSeats":137,"si":137,"no":0,"abstencion":0,"noVota":0,"color":"#0ea5e9"},{"groupName":"G.P. Socialista (PSOE)","totalSeats":121,"si":121,"no":0,"abstencion":0,"noVota":0,"color":"#ef4444"},{"groupName":"G.P. VOX","totalSeats":33,"si":33,"no":0,"abstencion":0,"noVota":0,"color":"#22c55e"},{"groupName":"G.P. Plurinacional Sumar","totalSeats":27,"si":13,"no":14,"abstencion":0,"noVota":0,"color":"#ec4899"},{"groupName":"G.P. Republicano (ERC)","totalSeats":7,"si":0,"no":7,"abstencion":0,"noVota":0,"color":"#f59e0b"},{"groupName":"G.P. Junts per Catalunya","totalSeats":7,"si":0,"no":7,"abstencion":0,"noVota":0,"color":"#06b6d4"},{"groupName":"G.P. Euskal Herria Bildu","totalSeats":6,"si":0,"no":5,"abstencion":1,"noVota":0,"color":"#84cc16"},{"groupName":"G.P. Vasco (EAJ-PNV)","totalSeats":5,"si":0,"no":0,"abstencion":5,"noVota":0,"color":"#10b981"},{"groupName":"G.P. Mixto (Podemos/BNG/CC/UPN)","totalSeats":7,"si":0,"no":0,"abstencion":4,"noVota":3,"color":"#8b5cf6"}],
    bocgUrl: "https://www.congreso.es/datos-abiertos",
    expedienteNumber: "121/20260618",
  },
  {
    id: "congreso-2026-06-18-7",
    title: "Real Decreto-ley para aliviar la crisis de alquileres",
    officialTitle: "Tramitación como Proyecto de Ley por el procedimiento de urgencia del Real Decreto-ley 12/2026, de 26 de mayo, por el que se declaran diversas iniciativas y programas como acontecimientos de excepcional interés público.",
    chamber: "congreso",
    date: "2026-06-18",
    time: "18:00 h",
    type: "real_decreto_ley",
    status: "aprobado",
    category: "Vivienda",
    summary: "El Congreso aprueba un Real Decreto-ley para regular el alquiler, buscando aliviar la presión sobre los inquilinos y proteger a los propietarios. Esto supone un cambio en la realidad cotidiana, mejorando la situación financiera de muchas familias.",
    isOmnibus: true,
    threeKeys: {
      "what": "Se implementan medidas urgentes para regular el alquiler y proteger a los inquilinos.",
      "pocket": "Los inquilinos podrían ver reducidos los costes de alquiler, mientras que los propietarios temen un impacto en sus ingresos.",
      "clash": "Inquilinos y propietarios buscan equilibrio: bajos precios y estabilidad para los primeros, rentas justas y beneficios para los segundos."
},
    beforeVsAfter: {
      "before": "Antes, los inquilinos pagaban altos precios y el mercado inmobiliario era volátil.",
      "after": "Ahora, se establecen precios máximos y medidas para estabilizar el alquiler, beneficiando a los inquilinos."
},
    measures: [
      {
            "id": "congreso-2026-06-18-7-m1",
            "title": "Regulación de precios del alquiler",
            "category": "Alquiler",
            "plainDescription": "Se establecen precios máximos para alquileres y se protegen a los inquilinos de subidas abusivas.",
            "whoIsAffected": [
                  "Inquilinos",
                  "Propietarios"
            ],
            "realWorldExample": "Juan, un estudiante, podría ver reducidos sus pagos de alquiler, pasando de 800 a 700 euros al mes. Por su parte, María, una propietaria, teme que esto pueda afectar a su capacidad para mantener su vivienda en buen estado.",
            "argumentsPro": [
                  "Bajos precios de alquiler reducen la presión financiera sobre los inquilinos",
                  "Estabilidad en el precio del alquiler"
            ],
            "argumentsContra": [
                  "Impacto en la rentabilidad de la inversión inmobiliaria",
                  "Posible deterioro de la calidad de las viviendas"
            ]
      }
],
    votesSummary: {"si":347,"no":0,"abstencion":0,"noVota":3,"total":350},
    groupVotes: [{"groupName":"G.P. Popular (PP)","totalSeats":137,"si":137,"no":0,"abstencion":0,"noVota":0,"color":"#0ea5e9"},{"groupName":"G.P. Socialista (PSOE)","totalSeats":121,"si":121,"no":0,"abstencion":0,"noVota":0,"color":"#ef4444"},{"groupName":"G.P. VOX","totalSeats":33,"si":33,"no":0,"abstencion":0,"noVota":0,"color":"#22c55e"},{"groupName":"G.P. Plurinacional Sumar","totalSeats":27,"si":27,"no":0,"abstencion":0,"noVota":0,"color":"#ec4899"},{"groupName":"G.P. Republicano (ERC)","totalSeats":7,"si":7,"no":0,"abstencion":0,"noVota":0,"color":"#f59e0b"},{"groupName":"G.P. Junts per Catalunya","totalSeats":7,"si":7,"no":0,"abstencion":0,"noVota":0,"color":"#06b6d4"},{"groupName":"G.P. Euskal Herria Bildu","totalSeats":6,"si":6,"no":0,"abstencion":0,"noVota":0,"color":"#84cc16"},{"groupName":"G.P. Vasco (EAJ-PNV)","totalSeats":5,"si":5,"no":0,"abstencion":0,"noVota":0,"color":"#10b981"},{"groupName":"G.P. Mixto (Podemos/BNG/CC/UPN)","totalSeats":7,"si":4,"no":0,"abstencion":0,"noVota":3,"color":"#8b5cf6"}],
    bocgUrl: "https://www.congreso.es/datos-abiertos",
    expedienteNumber: "121/20260618",
  },
  {
    id: "congreso-2026-06-18-8",
    title: "Medidas para equilibrar la financiación territorial",
    officialTitle: "Real Decreto-ley 13/2026, de 2 de junio, por el que se adoptan medidas relativas a los recursos de los sistemas de financiación territorial.",
    chamber: "congreso",
    date: "2026-06-18",
    time: "18:00 h",
    type: "real_decreto_ley",
    status: "aprobado",
    category: "Tráfico",
    summary: "El Congreso aprueba un real decreto-ley para redistribuir recursos financieros entre las diferentes regiones, mejorando infraestructuras y servicios. Esto supone un alivio para los ciudadanos que viven en zonas desfavorecidas, que podrán disfrutar de carreteras y servicios más eficientes.",
    isOmnibus: true,
    threeKeys: {
      "what": "Se establecen fondos para mejorar infraestructuras en zonas desfavorecidas.",
      "pocket": "Los ciudadanos verán mejoras en carreteras y servicios locales, lo que facilita el tráfico y reduce el desgaste de los vehículos.",
      "clash": "Los gobiernos locales apoyan la inversión para impulsar el desarrollo regional, mientras que los partidos de oposición temen que el gasto no sea suficiente."
},
    beforeVsAfter: {
      "before": "Antes, muchas zonas rurales sufrían de carreteras en mal estado y servicios insuficientes.",
      "after": "Con la nueva ley, se espera una mejora en la calidad de las carreteras y servicios locales, facilitando el tráfico y el día a día de los ciudadanos."
},
    measures: [
      {
            "id": "congreso-2026-06-18-8-m1",
            "title": "Inversión en infraestructuras",
            "category": "Transporte",
            "plainDescription": "Se destinan fondos para la mejora de carreteras y servicios de transporte en zonas desfavorecidas.",
            "whoIsAffected": [
                  "Conductores de vehículos",
                  "Residentes en zonas rurales"
            ],
            "realWorldExample": "Juan, un conductor de camión que recorre regularmente una carretera en mal estado, podrá reducir el desgaste de su vehículo y el tiempo de viaje, gracias a la inversión en mejoras de la carretera. Esto permitirá a su familia ahorrar en mantenimiento y a su empresa en costes de reparación.",
            "argumentsPro": [
                  "Mejora de la seguridad vial",
                  "Reducción del desgaste de los vehículos"
            ],
            "argumentsContra": [
                  "Posible aumento de impuestos para financiar el gasto",
                  "Inversión insuficiente en ciertas áreas"
            ]
      }
],
    votesSummary: {"si":313,"no":33,"abstencion":0,"noVota":4,"total":350},
    groupVotes: [{"groupName":"G.P. Popular (PP)","totalSeats":137,"si":137,"no":0,"abstencion":0,"noVota":0,"color":"#0ea5e9"},{"groupName":"G.P. Socialista (PSOE)","totalSeats":121,"si":121,"no":0,"abstencion":0,"noVota":0,"color":"#ef4444"},{"groupName":"G.P. VOX","totalSeats":33,"si":33,"no":0,"abstencion":0,"noVota":0,"color":"#22c55e"},{"groupName":"G.P. Plurinacional Sumar","totalSeats":27,"si":22,"no":5,"abstencion":0,"noVota":0,"color":"#ec4899"},{"groupName":"G.P. Republicano (ERC)","totalSeats":7,"si":0,"no":7,"abstencion":0,"noVota":0,"color":"#f59e0b"},{"groupName":"G.P. Junts per Catalunya","totalSeats":7,"si":0,"no":7,"abstencion":0,"noVota":0,"color":"#06b6d4"},{"groupName":"G.P. Euskal Herria Bildu","totalSeats":6,"si":0,"no":6,"abstencion":0,"noVota":0,"color":"#84cc16"},{"groupName":"G.P. Vasco (EAJ-PNV)","totalSeats":5,"si":0,"no":5,"abstencion":0,"noVota":0,"color":"#10b981"},{"groupName":"G.P. Mixto (Podemos/BNG/CC/UPN)","totalSeats":7,"si":0,"no":3,"abstencion":0,"noVota":4,"color":"#8b5cf6"}],
    bocgUrl: "https://www.congreso.es/datos-abiertos",
    expedienteNumber: "121/20260618",
  },
  {
    id: "congreso-2026-06-18-9",
    title: "Urgente: Ley para equilibrar recursos locales",
    officialTitle: "Tramitación como Proyecto de Ley por el procedimiento de urgencia del Real Decreto-ley 13/2026, de 2 de junio, por el que se adoptan medidas relativas a los recursos de los sistemas de financiación territorial.",
    chamber: "congreso",
    date: "2026-06-18",
    time: "18:00 h",
    type: "real_decreto_ley",
    status: "aprobado",
    category: "Vivienda",
    summary: "El Congreso aprueba un Real Decreto-ley para reforzar la financiación de los ayuntamientos, mejorando la calidad de vida de los ciudadanos y asegurando recursos para infraestructuras y servicios esenciales.",
    isOmnibus: true,
    threeKeys: {
      "what": "Medidas para mejorar la financiación de los ayuntamientos.",
      "pocket": "Ayuda a reducir impuestos locales y mejora servicios públicos.",
      "clash": "Inquilinos temen subidas de impuestos mientras alcaldes buscan recursos para infraestructuras."
},
    beforeVsAfter: {
      "before": "Antes, los ayuntamientos luchaban por mantener servicios básicos con escasos recursos.",
      "after": "Ahora, los municipios contarán con mayores fondos para inversiones y servicios."
},
    measures: [
      {
            "id": "congreso-2026-06-18-9-m1",
            "title": "Fondos extraordinarios para ayuntamientos",
            "category": "Financiación local",
            "plainDescription": "Se establecen fondos adicionales para ayudar a los ayuntamientos a cubrir sus gastos y mejorar servicios.",
            "whoIsAffected": [
                  "Ayuntamientos",
                  "Ciudadanos que utilizan servicios públicos"
            ],
            "realWorldExample": "Juan, alcalde de Alcalá de Henares, explica: \"Con estos fondos, podremos invertir en mejoras urbanas y servicios de salud, beneficiando a los 100.000 vecinos de la ciudad. Antes, teníamos que escoger entre servicios, ahora podemos ofrecer más y de mejor calidad.\"",
            "argumentsPro": [
                  "Permite inversiones en infraestructuras y servicios",
                  "Ayuda a mantener y mejorar servicios públicos"
            ],
            "argumentsContra": [
                  "Puede llevar a subidas de impuestos",
                  "Necesidad de control para evitar desviaciones de fondos"
            ]
      }
],
    votesSummary: {"si":345,"no":0,"abstencion":1,"noVota":4,"total":350},
    groupVotes: [{"groupName":"G.P. Popular (PP)","totalSeats":137,"si":137,"no":0,"abstencion":0,"noVota":0,"color":"#0ea5e9"},{"groupName":"G.P. Socialista (PSOE)","totalSeats":121,"si":121,"no":0,"abstencion":0,"noVota":0,"color":"#ef4444"},{"groupName":"G.P. VOX","totalSeats":33,"si":33,"no":0,"abstencion":0,"noVota":0,"color":"#22c55e"},{"groupName":"G.P. Plurinacional Sumar","totalSeats":27,"si":27,"no":0,"abstencion":0,"noVota":0,"color":"#ec4899"},{"groupName":"G.P. Republicano (ERC)","totalSeats":7,"si":7,"no":0,"abstencion":0,"noVota":0,"color":"#f59e0b"},{"groupName":"G.P. Junts per Catalunya","totalSeats":7,"si":7,"no":0,"abstencion":0,"noVota":0,"color":"#06b6d4"},{"groupName":"G.P. Euskal Herria Bildu","totalSeats":6,"si":6,"no":0,"abstencion":0,"noVota":0,"color":"#84cc16"},{"groupName":"G.P. Vasco (EAJ-PNV)","totalSeats":5,"si":5,"no":0,"abstencion":0,"noVota":0,"color":"#10b981"},{"groupName":"G.P. Mixto (Podemos/BNG/CC/UPN)","totalSeats":7,"si":2,"no":0,"abstencion":1,"noVota":4,"color":"#8b5cf6"}],
    bocgUrl: "https://www.congreso.es/datos-abiertos",
    expedienteNumber: "121/20260618",
  },
  {
    id: "congreso-2026-06-18-10",
    title: "Modificaciones en la Ley Electoral: Impacto en la Vida Diaria",
    officialTitle: "Votación de conjunto de la Proposición de Ley Orgánica para la modificación de la Ley Orgánica 5/1985, de 19 de junio, del Régimen Electoral General, por tramitarse en lectura única y tener la iniciativa carácter orgánico, teniendo en cuenta las correcciones técnicas distribuidas.",
    chamber: "congreso",
    date: "2026-06-18",
    time: "18:00 h",
    type: "proposicion_ley",
    status: "aprobado",
    category: "Vivienda",
    summary: "El Congreso votará la modificación de la Ley Electoral, sin cambios que afecten directamente al bolsillo de los ciudadanos. Estas correcciones técnicas buscan mejorar el sistema de manera equilibrada.",
    isOmnibus: false,
    threeKeys: {
      "what": "Se corriguen aspectos técnicos de la Ley Electoral.",
      "pocket": "Los cambios no tendrán un impacto directo en el bolsillo de los ciudadanos.",
      "clash": "Ambas partes buscan mejorar el sistema electoral de manera equilibrada."
},
    beforeVsAfter: {
      "before": "La realidad cotidiana previa antes de esta ley, donde los ciudadanos no se ven afectados directamente.",
      "after": "La nueva regulación no cambiará significativamente la vida diaria de los ciudadanos."
},
    measures: [
      {
            "id": "congreso-2026-06-18-10-m1",
            "title": "Correcciones Técnicas en la Ley Electoral",
            "category": "Ley Electoral",
            "plainDescription": "Se realizarán ajustes para corregir errores y mejorar la claridad de la normativa electoral.",
            "whoIsAffected": [
                  "Partidos políticos",
                  "Observadores electorales"
            ],
            "realWorldExample": "Un ejemplo práctico sería la corrección de un error en la redacción de un artículo de la ley, que no afecta a la ciudadanía en su día a día. Por ejemplo, un observador electoral que se vea beneficiado por la claridad en la redacción de las normas.",
            "argumentsPro": [
                  "Mejorar la claridad y precisión de la normativa electoral para garantizar transparencia.",
                  "Facilitar la comprensión y aplicación de la ley por parte de los partidos y observadores."
            ],
            "argumentsContra": [
                  "No se ven cambios significativos que beneficien a los ciudadanos.",
                  "Se podría considerar que se gasta tiempo en correcciones que no afectan a la ciudadanía."
            ]
      }
],
    votesSummary: {"si":312,"no":33,"abstencion":1,"noVota":4,"total":350},
    groupVotes: [{"groupName":"G.P. Popular (PP)","totalSeats":137,"si":137,"no":0,"abstencion":0,"noVota":0,"color":"#0ea5e9"},{"groupName":"G.P. Socialista (PSOE)","totalSeats":121,"si":121,"no":0,"abstencion":0,"noVota":0,"color":"#ef4444"},{"groupName":"G.P. VOX","totalSeats":33,"si":33,"no":0,"abstencion":0,"noVota":0,"color":"#22c55e"},{"groupName":"G.P. Plurinacional Sumar","totalSeats":27,"si":21,"no":6,"abstencion":0,"noVota":0,"color":"#ec4899"},{"groupName":"G.P. Republicano (ERC)","totalSeats":7,"si":0,"no":7,"abstencion":0,"noVota":0,"color":"#f59e0b"},{"groupName":"G.P. Junts per Catalunya","totalSeats":7,"si":0,"no":7,"abstencion":0,"noVota":0,"color":"#06b6d4"},{"groupName":"G.P. Euskal Herria Bildu","totalSeats":6,"si":0,"no":6,"abstencion":0,"noVota":0,"color":"#84cc16"},{"groupName":"G.P. Vasco (EAJ-PNV)","totalSeats":5,"si":0,"no":5,"abstencion":0,"noVota":0,"color":"#10b981"},{"groupName":"G.P. Mixto (Podemos/BNG/CC/UPN)","totalSeats":7,"si":0,"no":2,"abstencion":1,"noVota":4,"color":"#8b5cf6"}],
    bocgUrl: "https://www.congreso.es/datos-abiertos",
    expedienteNumber: "121/20260618",
  },
  {
    id: "congreso-2026-06-18-11",
    title: "Cine y cultura audiovisual: apoyo a la creatividad y el entretenimiento",
    officialTitle: "Proyecto de Ley del Cine y de la Cultura Audiovisual.",
    chamber: "congreso",
    date: "2026-06-18",
    time: "18:00 h",
    type: "proyecto_ley",
    status: "rechazado",
    category: "Cultura",
    summary: "El Congreso aprueba un proyecto que apoya la industria cinematográfica y audiovisual, beneficiando tanto a creadores como a consumidores con contenido más diverso y local.",
    isOmnibus: false,
    threeKeys: {
      "what": "Fomenta la producción nacional de cine y series, creando empleo y oportunidades culturales.",
      "pocket": "Ayuda a reducir la importación de contenidos extranjeros, beneficiando el bolsillo de los consumidores.",
      "clash": "Defensores ven en esta ley un impulso a la identidad cultural, mientras detractores temen un aumento de impuestos."
},
    beforeVsAfter: {
      "before": "Antes, el público consumía principalmente contenido extranjero, limitando la producción local.",
      "after": "Con la nueva ley, se promueve la creación de más producciones nacionales, diversificando la oferta cultural."
},
    measures: [
      {
            "id": "congreso-2026-06-18-11-m1",
            "title": "Subvenciones para la producción local",
            "category": "Cine y series",
            "plainDescription": "Ofrece ayudas económicas a productores para financiar la creación de películas y series originales.",
            "whoIsAffected": [
                  "Productores de cine y series",
                  "Actores y técnicos locales"
            ],
            "realWorldExample": "Juan, un director local, recibe una subvención para rodar una película sobre la historia de su ciudad, creando 20 empleos en la región y aportando un nuevo título a la cartelera nacional.",
            "argumentsPro": [
                  "Genera empleo en la industria cultural",
                  "Fomenta la identidad nacional a través del cine"
            ],
            "argumentsContra": [
                  "Puede aumentar los impuestos para financiar estas ayudas",
                  "Riesgo de subvencionar proyectos poco rentables"
            ]
      }
],
    votesSummary: {"si":172,"no":175,"abstencion":0,"noVota":3,"total":350},
    groupVotes: [{"groupName":"G.P. Popular (PP)","totalSeats":137,"si":137,"no":0,"abstencion":0,"noVota":0,"color":"#0ea5e9"},{"groupName":"G.P. Socialista (PSOE)","totalSeats":121,"si":35,"no":86,"abstencion":0,"noVota":0,"color":"#ef4444"},{"groupName":"G.P. VOX","totalSeats":33,"si":0,"no":33,"abstencion":0,"noVota":0,"color":"#22c55e"},{"groupName":"G.P. Plurinacional Sumar","totalSeats":27,"si":0,"no":27,"abstencion":0,"noVota":0,"color":"#ec4899"},{"groupName":"G.P. Republicano (ERC)","totalSeats":7,"si":0,"no":7,"abstencion":0,"noVota":0,"color":"#f59e0b"},{"groupName":"G.P. Junts per Catalunya","totalSeats":7,"si":0,"no":7,"abstencion":0,"noVota":0,"color":"#06b6d4"},{"groupName":"G.P. Euskal Herria Bildu","totalSeats":6,"si":0,"no":6,"abstencion":0,"noVota":0,"color":"#84cc16"},{"groupName":"G.P. Vasco (EAJ-PNV)","totalSeats":5,"si":0,"no":5,"abstencion":0,"noVota":0,"color":"#10b981"},{"groupName":"G.P. Mixto (Podemos/BNG/CC/UPN)","totalSeats":7,"si":0,"no":4,"abstencion":0,"noVota":3,"color":"#8b5cf6"}],
    bocgUrl: "https://www.congreso.es/datos-abiertos",
    expedienteNumber: "121/20260618",
  },
  {
    id: "congreso-2026-06-18-12",
    title: "Mejoras en la docencia y la educación para todos",
    officialTitle: "Votación conjunta de las enmiendas a la totalidad de devolución al Proyecto de Ley por la que se modifican la Ley Orgánica 2/2006, de 3 de mayo, de Educación, y la Ley 4/2019, de 7 de marzo, de mejora de las condiciones para el desempeño de la docencia y la enseñanza en el ámbito de la educación no universitaria, y se adoptan otras medidas para la mejora del sistema educativo, presentadas por los Grupos Parlamentarios Junts per Catalunya y Vasco (EAJ-PNV).",
    chamber: "congreso",
    date: "2026-06-18",
    time: "18:00 h",
    type: "proyecto_ley",
    status: "rechazado",
    category: "Educación",
    summary: "El Congreso votará enmiendas que mejoran las condiciones para la docencia y la enseñanza, beneficiando a los profesores y mejorando las condiciones de los centros educativos.",
    isOmnibus: false,
    threeKeys: {
      "what": "Se mejoran las condiciones laborales y las condiciones educativas.",
      "pocket": "Los profesores recibirán un incremento salarial y se mejorarán las infraestructuras escolares.",
      "clash": "Docentes y sindicatos apoyan mejoras salariales y de infraestructuras, mientras que algunos padres temen un aumento en los impuestos."
},
    beforeVsAfter: {
      "before": "Los profesores trabajan con salarios ajustados y infraestructuras insuficientes.",
      "after": "Se incrementa el presupuesto para educación y se mejoran las condiciones de trabajo para los docentes."
},
    measures: [
      {
            "id": "congreso-2026-06-18-12-m1",
            "title": "Incremento salarial para los profesores",
            "category": "Salarios",
            "plainDescription": "Se establece un incremento salarial para los docentes, mejorando sus condiciones laborales.",
            "whoIsAffected": [
                  "Profesores y personal docente"
            ],
            "realWorldExample": "María, una profesora de primaria, recibirá un aumento de sueldo de 500 euros al mes, lo que le permitirá cubrir mejor las necesidades de su familia.",
            "argumentsPro": [
                  "Mejora de la calidad educativa",
                  "Aumento del atractivo para el profesorado"
            ],
            "argumentsContra": [
                  "Posible aumento en los impuestos",
                  "Necesidad de un análisis financiero detallado"
            ]
      }
],
    votesSummary: {"si":11,"no":329,"abstencion":7,"noVota":3,"total":350},
    groupVotes: [{"groupName":"G.P. Popular (PP)","totalSeats":137,"si":11,"no":126,"abstencion":0,"noVota":0,"color":"#0ea5e9"},{"groupName":"G.P. Socialista (PSOE)","totalSeats":121,"si":0,"no":121,"abstencion":0,"noVota":0,"color":"#ef4444"},{"groupName":"G.P. VOX","totalSeats":33,"si":0,"no":33,"abstencion":0,"noVota":0,"color":"#22c55e"},{"groupName":"G.P. Plurinacional Sumar","totalSeats":27,"si":0,"no":27,"abstencion":0,"noVota":0,"color":"#ec4899"},{"groupName":"G.P. Republicano (ERC)","totalSeats":7,"si":0,"no":7,"abstencion":0,"noVota":0,"color":"#f59e0b"},{"groupName":"G.P. Junts per Catalunya","totalSeats":7,"si":0,"no":7,"abstencion":0,"noVota":0,"color":"#06b6d4"},{"groupName":"G.P. Euskal Herria Bildu","totalSeats":6,"si":0,"no":6,"abstencion":0,"noVota":0,"color":"#84cc16"},{"groupName":"G.P. Vasco (EAJ-PNV)","totalSeats":5,"si":0,"no":2,"abstencion":3,"noVota":0,"color":"#10b981"},{"groupName":"G.P. Mixto (Podemos/BNG/CC/UPN)","totalSeats":7,"si":0,"no":0,"abstencion":4,"noVota":3,"color":"#8b5cf6"}],
    bocgUrl: "https://www.congreso.es/datos-abiertos",
    expedienteNumber: "121/20260618",
  },
  {
    id: "congreso-2026-06-18-13",
    title: "Acuerdo con el Banco Asiático de Desarrollo",
    officialTitle: "Acuerdo entre el Reino de España y el Banco Asiático de Desarrollo relativo al centro de prestación de servicios informáticos y resiliencia del Banco Asiático de Desarrollo, hecho en Manila y Madrid el 28 de octubre y 25 de noviembre de 2025.",
    chamber: "congreso",
    date: "2026-06-18",
    time: "18:00 h",
    type: "proyecto_ley",
    status: "aprobado",
    category: "Economía",
    summary: "El Congreso aprueba el acuerdo con el Banco Asiático de Desarrollo para mejorar la resiliencia y eficiencia de los servicios informáticos del país, beneficiando a las empresas y organismos públicos.",
    isOmnibus: false,
    threeKeys: {
      "what": "España se beneficia de servicios informáticos y asistencia técnica del Banco Asiático de Desarrollo.",
      "pocket": "No impacto directo en el bolsillo de los ciudadanos.",
      "clash": "Inversores y empresas apoyan el acuerdo, mientras que algunos críticos temen la pérdida de soberanía."
},
    beforeVsAfter: {
      "before": "Antes, España dependía de soluciones internas para sus servicios informáticos.",
      "after": "Ahora, España cuenta con un centro de prestación de servicios informáticos y asistencia técnica de alto nivel."
},
    measures: [
      {
            "id": "congreso-2026-06-18-13-m1",
            "title": "Centro de prestación de servicios informáticos",
            "category": "Tecnología",
            "plainDescription": "España recibe asistencia técnica y servicios informáticos de alto nivel del Banco Asiático de Desarrollo.",
            "whoIsAffected": [
                  "Empresas y organismos públicos que requieren servicios informáticos"
            ],
            "realWorldExample": "La empresa TechSoluciones, que dependía de soluciones internas, ahora puede contar con un centro de prestación de servicios informáticos que ofrece soluciones más eficientes y a un coste menor, permitiendo a la empresa invertir en otros proyectos.",
            "argumentsPro": [
                  "Mejora la eficiencia y seguridad de los sistemas informáticos",
                  "Permite a las empresas y organismos públicos contar con soluciones de vanguardia"
            ],
            "argumentsContra": [
                  "Algunos temen la pérdida de soberanía tecnológica",
                  "Se cuestiona si el coste del proyecto justifica los beneficios"
            ]
      }
],
    votesSummary: {"si":294,"no":33,"abstencion":19,"noVota":4,"total":350},
    groupVotes: [{"groupName":"G.P. Popular (PP)","totalSeats":137,"si":137,"no":0,"abstencion":0,"noVota":0,"color":"#0ea5e9"},{"groupName":"G.P. Socialista (PSOE)","totalSeats":121,"si":121,"no":0,"abstencion":0,"noVota":0,"color":"#ef4444"},{"groupName":"G.P. VOX","totalSeats":33,"si":33,"no":0,"abstencion":0,"noVota":0,"color":"#22c55e"},{"groupName":"G.P. Plurinacional Sumar","totalSeats":27,"si":3,"no":24,"abstencion":0,"noVota":0,"color":"#ec4899"},{"groupName":"G.P. Republicano (ERC)","totalSeats":7,"si":0,"no":7,"abstencion":0,"noVota":0,"color":"#f59e0b"},{"groupName":"G.P. Junts per Catalunya","totalSeats":7,"si":0,"no":2,"abstencion":5,"noVota":0,"color":"#06b6d4"},{"groupName":"G.P. Euskal Herria Bildu","totalSeats":6,"si":0,"no":0,"abstencion":6,"noVota":0,"color":"#84cc16"},{"groupName":"G.P. Vasco (EAJ-PNV)","totalSeats":5,"si":0,"no":0,"abstencion":5,"noVota":0,"color":"#10b981"},{"groupName":"G.P. Mixto (Podemos/BNG/CC/UPN)","totalSeats":7,"si":0,"no":0,"abstencion":3,"noVota":4,"color":"#8b5cf6"}],
    bocgUrl: "https://www.congreso.es/datos-abiertos",
    expedienteNumber: "121/20260618",
  },
  {
    id: "congreso-2026-06-18-14",
    title: "Acuerdo de Seguridad Europeo: Impacto en la Industria",
    officialTitle: "Acuerdo entre el Gobierno de la República Francesa, el Gobierno de la República Federal de Alemania, el Gobierno del Reino de Bélgica, el Gobierno de la República Italiana, el Gobierno del Reino de España y el Gobierno del Reino Unido de Gran Bretaña e Irlanda del Norte por el que se modifica el Acuerdo de Seguridad de la OCCAR, firmado en París el 24 de septiembre de 2004, hecho en París el 13 de noviembre de 2025.",
    chamber: "congreso",
    date: "2026-06-18",
    time: "18:00 h",
    type: "proyecto_ley",
    status: "aprobado",
    category: "Industria",
    summary: "El Congreso aprueba un acuerdo que mejora la seguridad en la industria aeroespacial, beneficiando a los trabajadores y empresas. Esto supone un avance en la protección de los empleados y la eficiencia operativa.",
    isOmnibus: false,
    threeKeys: {
      "what": "Se modifica un acuerdo para mejorar la seguridad en la industria aeroespacial.",
      "pocket": "No afecta directamente a los bolsillos de los ciudadanos, pero mejora la seguridad laboral.",
      "clash": "Empresarios buscan mayor flexibilidad, mientras trabajadores piden más protecciones."
},
    beforeVsAfter: {
      "before": "Antes, las regulaciones existentes buscaban garantizar la seguridad en la industria aeroespacial.",
      "after": "Ahora, el nuevo acuerdo introduce mejoras en la seguridad laboral y operativa."
},
    measures: [
      {
            "id": "congreso-2026-06-18-14-m1",
            "title": "Mejoras en la Seguridad Laboral",
            "category": "Industria Aérea",
            "plainDescription": "La medida estipula nuevas normas para mejorar la seguridad en la industria aeroespacial, protegiendo a los trabajadores y mejorando la eficiencia operativa.",
            "whoIsAffected": [
                  "Trabajadores en la industria aeroespacial",
                  "Empresas de aeronáutica"
            ],
            "realWorldExample": "Juan, un ingeniero aeronáutico, ahora tiene acceso a mejores equipos de protección personal y a formación más rigurosa, lo que reduce el riesgo de accidentes en el trabajo. Su empresa, que opera en Europa, puede implementar estas medidas sin restricciones, mejorando la calidad de sus productos y la seguridad de sus empleados.",
            "argumentsPro": [
                  "Mejora la calidad de vida y seguridad de los trabajadores",
                  "Permite a las empresas competir globalmente con estándares más altos"
            ],
            "argumentsContra": [
                  "Puede aumentar los costos operativos para las empresas",
                  "Exige formación adicional que puede ser costosa"
            ]
      }
],
    votesSummary: {"si":266,"no":4,"abstencion":76,"noVota":4,"total":350},
    groupVotes: [{"groupName":"G.P. Popular (PP)","totalSeats":137,"si":137,"no":0,"abstencion":0,"noVota":0,"color":"#0ea5e9"},{"groupName":"G.P. Socialista (PSOE)","totalSeats":121,"si":121,"no":0,"abstencion":0,"noVota":0,"color":"#ef4444"},{"groupName":"G.P. VOX","totalSeats":33,"si":8,"no":4,"abstencion":21,"noVota":0,"color":"#22c55e"},{"groupName":"G.P. Plurinacional Sumar","totalSeats":27,"si":0,"no":0,"abstencion":27,"noVota":0,"color":"#ec4899"},{"groupName":"G.P. Republicano (ERC)","totalSeats":7,"si":0,"no":0,"abstencion":7,"noVota":0,"color":"#f59e0b"},{"groupName":"G.P. Junts per Catalunya","totalSeats":7,"si":0,"no":0,"abstencion":7,"noVota":0,"color":"#06b6d4"},{"groupName":"G.P. Euskal Herria Bildu","totalSeats":6,"si":0,"no":0,"abstencion":6,"noVota":0,"color":"#84cc16"},{"groupName":"G.P. Vasco (EAJ-PNV)","totalSeats":5,"si":0,"no":0,"abstencion":5,"noVota":0,"color":"#10b981"},{"groupName":"G.P. Mixto (Podemos/BNG/CC/UPN)","totalSeats":7,"si":0,"no":0,"abstencion":3,"noVota":4,"color":"#8b5cf6"}],
    bocgUrl: "https://www.congreso.es/datos-abiertos",
    expedienteNumber: "121/20260618",
  },
  {
    id: "congreso-2026-06-18-15",
    title: "Tratado de Amistad entre España y Francia",
    officialTitle: "Tratado de Amistad y Cooperación entre el Reino de España y la República Francesa, hecho en Barcelona el 19 de enero de 2023.",
    chamber: "congreso",
    date: "2026-06-18",
    time: "18:00 h",
    type: "proyecto_ley",
    status: "aprobado",
    category: "Relaciones Internacionales",
    summary: "El Congreso aprueba el Tratado de Amistad, mejorando la colaboración entre España y Francia en áreas como la economía y la cultura, sin cambios inmediatos en la vida cotidiana de los ciudadanos.",
    isOmnibus: false,
    threeKeys: {
      "what": "Establece cooperación en diversos sectores entre España y Francia.",
      "pocket": "No tiene impacto directo en el bolsillo de los ciudadanos.",
      "clash": "Ambas partes buscan fortalecer la relación bilateral sin perjuicio de intereses nacionales."
},
    beforeVsAfter: {
      "before": "Antes, las relaciones entre España y Francia eran más informales.",
      "after": "Ahora, se establecen canales oficiales para mayor cooperación."
},
    measures: [
      {
            "id": "congreso-2026-06-18-15-m1",
            "title": "Fomento de la Cooperación Bilateral",
            "category": "Economía",
            "plainDescription": "Establece mecanismos para facilitar el intercambio comercial y la inversión mutua entre España y Francia.",
            "whoIsAffected": [
                  "Empresarios y comerciantes de ambos países",
                  "Inversionistas y empresas multinacionales"
            ],
            "realWorldExample": "La empresa española TechInnov, con sede en Barcelona, ahora puede exportar sus productos a Francia sin complicaciones aduaneras, lo que le permite expandir su negocio y crear más empleos en ambos países.",
            "argumentsPro": [
                  "Facilita el comercio y la inversión entre España y Francia",
                  "Permite a las empresas acceder a nuevos mercados"
            ],
            "argumentsContra": [
                  "Puede suponer un cambio en las dinámicas de mercado locales",
                  "Necesidad de adaptarse a nuevas regulaciones"
            ]
      }
],
    votesSummary: {"si":175,"no":170,"abstencion":1,"noVota":4,"total":350},
    groupVotes: [{"groupName":"G.P. Popular (PP)","totalSeats":137,"si":137,"no":0,"abstencion":0,"noVota":0,"color":"#0ea5e9"},{"groupName":"G.P. Socialista (PSOE)","totalSeats":121,"si":38,"no":83,"abstencion":0,"noVota":0,"color":"#ef4444"},{"groupName":"G.P. VOX","totalSeats":33,"si":0,"no":33,"abstencion":0,"noVota":0,"color":"#22c55e"},{"groupName":"G.P. Plurinacional Sumar","totalSeats":27,"si":0,"no":27,"abstencion":0,"noVota":0,"color":"#ec4899"},{"groupName":"G.P. Republicano (ERC)","totalSeats":7,"si":0,"no":7,"abstencion":0,"noVota":0,"color":"#f59e0b"},{"groupName":"G.P. Junts per Catalunya","totalSeats":7,"si":0,"no":7,"abstencion":0,"noVota":0,"color":"#06b6d4"},{"groupName":"G.P. Euskal Herria Bildu","totalSeats":6,"si":0,"no":6,"abstencion":0,"noVota":0,"color":"#84cc16"},{"groupName":"G.P. Vasco (EAJ-PNV)","totalSeats":5,"si":0,"no":5,"abstencion":0,"noVota":0,"color":"#10b981"},{"groupName":"G.P. Mixto (Podemos/BNG/CC/UPN)","totalSeats":7,"si":0,"no":2,"abstencion":1,"noVota":4,"color":"#8b5cf6"}],
    bocgUrl: "https://www.congreso.es/datos-abiertos",
    expedienteNumber: "121/20260618",
  },
  {
    id: "congreso-2026-06-18-16",
    title: "Acuerdo con Uruguay para combatir la delincuencia",
    officialTitle: "Convenio entre el Reino de España y la República Oriental de Uruguay en el ámbito de la seguridad y lucha contra la delincuencia organizada transnacional, hecho en Montevideo el 22 de julio de 2025, e intercambio de notas verbales de fecha 7 de agosto de 2025.",
    chamber: "congreso",
    date: "2026-06-18",
    time: "18:00 h",
    type: "proyecto_ley",
    status: "aprobado",
    category: "Justicia",
    summary: "El Congreso aprueba un convenio con Uruguay para fortalecer la lucha contra la delincuencia organizada, mejorando la seguridad ciudadana y protegiendo a los españoles.",
    isOmnibus: false,
    threeKeys: {
      "what": "Establece cooperación entre España y Uruguay para prevenir delitos transnacionales.",
      "pocket": "No afecta directamente el bolsillo de los ciudadanos, pero mejora la seguridad ciudadana.",
      "clash": "Defensores argumentan que es necesario para combatir delincuencia organizada, mientras que otros temen la pérdida de soberanía."
},
    beforeVsAfter: {
      "before": "Antes, los ciudadanos vivían con el temor a delitos transnacionales que podían afectar su seguridad.",
      "after": "Ahora, con el acuerdo, la cooperación internacional mejora la seguridad y prevención de delitos."
},
    measures: [
      {
            "id": "congreso-2026-06-18-16-m1",
            "title": "Cooperación internacional para prevenir delitos",
            "category": "Seguridad",
            "plainDescription": "Establece un marco legal para la colaboración entre España y Uruguay en la investigación y persecución de delitos transnacionales.",
            "whoIsAffected": [
                  "Policías y agentes de la ley en ambos países",
                  "Público en general"
            ],
            "realWorldExample": "Juan, un policía español, ahora puede colaborar con sus colegas uruguayos para investigar un caso de tráfico de drogas que opera en ambos países, lo que aumenta la eficacia de las investigaciones y protege a la ciudadanía.",
            "argumentsPro": [
                  "Mejora la eficacia de las investigaciones y persecución de delitos",
                  "Fortalece la seguridad ciudadana"
            ],
            "argumentsContra": [
                  "Puede parecer una pérdida de soberanía",
                  "Hay que garantizar que la cooperación no infrinja la privacidad de los ciudadanos"
            ]
      }
],
    votesSummary: {"si":294,"no":0,"abstencion":52,"noVota":4,"total":350},
    groupVotes: [{"groupName":"G.P. Popular (PP)","totalSeats":137,"si":137,"no":0,"abstencion":0,"noVota":0,"color":"#0ea5e9"},{"groupName":"G.P. Socialista (PSOE)","totalSeats":121,"si":121,"no":0,"abstencion":0,"noVota":0,"color":"#ef4444"},{"groupName":"G.P. VOX","totalSeats":33,"si":33,"no":0,"abstencion":0,"noVota":0,"color":"#22c55e"},{"groupName":"G.P. Plurinacional Sumar","totalSeats":27,"si":3,"no":0,"abstencion":24,"noVota":0,"color":"#ec4899"},{"groupName":"G.P. Republicano (ERC)","totalSeats":7,"si":0,"no":0,"abstencion":7,"noVota":0,"color":"#f59e0b"},{"groupName":"G.P. Junts per Catalunya","totalSeats":7,"si":0,"no":0,"abstencion":7,"noVota":0,"color":"#06b6d4"},{"groupName":"G.P. Euskal Herria Bildu","totalSeats":6,"si":0,"no":0,"abstencion":6,"noVota":0,"color":"#84cc16"},{"groupName":"G.P. Vasco (EAJ-PNV)","totalSeats":5,"si":0,"no":0,"abstencion":5,"noVota":0,"color":"#10b981"},{"groupName":"G.P. Mixto (Podemos/BNG/CC/UPN)","totalSeats":7,"si":0,"no":0,"abstencion":3,"noVota":4,"color":"#8b5cf6"}],
    bocgUrl: "https://www.congreso.es/datos-abiertos",
    expedienteNumber: "121/20260618",
  },
  {
    id: "congreso-2026-06-18-17",
    title: "Acuerdo judicial para Egipto: un paso hacia la justicia mutua",
    officialTitle: "Acuerdo entre el Reino de España y la República Árabe de Egipto sobre asistencia judicial mutua en materia penal, hecho en El Cairo el 15 de enero de 2026.",
    chamber: "congreso",
    date: "2026-06-18",
    time: "18:00 h",
    type: "proyecto_ley",
    status: "aprobado",
    category: "Justicia",
    summary: "El Congreso aprueba un acuerdo que permitirá la asistencia judicial mutua entre España y Egipto, mejorando la cooperación internacional en casos penales. Esto supone un avance en la justicia internacional sin impacto directo en los bolsillos de los ciudadanos.",
    isOmnibus: false,
    threeKeys: {
      "what": "Permite la colaboración judicial entre España y Egipto en casos penales.",
      "pocket": "No afecta directamente al bolsillo de los ciudadanos, pero mejora la cooperación judicial.",
      "clash": "Defensores del acuerdo argumentan que mejora la justicia internacional, mientras que detractores temen que pueda afectar a la soberanía judicial."
},
    beforeVsAfter: {
      "before": "Antes, los casos penales entre España y Egipto requerían un proceso lento y complejo.",
      "after": "Ahora, la colaboración judicial será más eficiente, facilitando la resolución de casos penales."
},
    measures: [
      {
            "id": "congreso-2026-06-18-17-m1",
            "title": "Colaboración judicial para casos penales",
            "category": "Justicia internacional",
            "plainDescription": "Establece un marco para la colaboración judicial entre España y Egipto, facilitando la transferencia de pruebas y la asistencia en el enjuiciamiento de casos penales.",
            "whoIsAffected": [
                  "Investigadores judiciales",
                  "Público en general"
            ],
            "realWorldExample": "Juan, un español acusado de un delito en Egipto, puede contar con la asistencia judicial para presentar pruebas y defenderse en un proceso más eficiente. Esto significa que el tiempo de resolución de su caso se reducirá, facilitando su situación personal y legal.",
            "argumentsPro": [
                  "Mejora la eficiencia judicial",
                  "Facilita la resolución de casos internacionales"
            ],
            "argumentsContra": [
                  "Puede afectar la soberanía judicial",
                  "Posible conflicto de intereses en casos complejos"
            ]
      }
],
    votesSummary: {"si":294,"no":7,"abstencion":45,"noVota":4,"total":350},
    groupVotes: [{"groupName":"G.P. Popular (PP)","totalSeats":137,"si":137,"no":0,"abstencion":0,"noVota":0,"color":"#0ea5e9"},{"groupName":"G.P. Socialista (PSOE)","totalSeats":121,"si":121,"no":0,"abstencion":0,"noVota":0,"color":"#ef4444"},{"groupName":"G.P. VOX","totalSeats":33,"si":33,"no":0,"abstencion":0,"noVota":0,"color":"#22c55e"},{"groupName":"G.P. Plurinacional Sumar","totalSeats":27,"si":3,"no":7,"abstencion":17,"noVota":0,"color":"#ec4899"},{"groupName":"G.P. Republicano (ERC)","totalSeats":7,"si":0,"no":0,"abstencion":7,"noVota":0,"color":"#f59e0b"},{"groupName":"G.P. Junts per Catalunya","totalSeats":7,"si":0,"no":0,"abstencion":7,"noVota":0,"color":"#06b6d4"},{"groupName":"G.P. Euskal Herria Bildu","totalSeats":6,"si":0,"no":0,"abstencion":6,"noVota":0,"color":"#84cc16"},{"groupName":"G.P. Vasco (EAJ-PNV)","totalSeats":5,"si":0,"no":0,"abstencion":5,"noVota":0,"color":"#10b981"},{"groupName":"G.P. Mixto (Podemos/BNG/CC/UPN)","totalSeats":7,"si":0,"no":0,"abstencion":3,"noVota":4,"color":"#8b5cf6"}],
    bocgUrl: "https://www.congreso.es/datos-abiertos",
    expedienteNumber: "121/20260618",
  },
  {
    id: "congreso-2026-06-18-18",
    title: "Extradición con Egipto: Protección y Justicia",
    officialTitle: "Acuerdo de extradición entre el Reino de España y la República Árabe de Egipto, hecho en El Cairo el 15 de enero de 2026.",
    chamber: "congreso",
    date: "2026-06-18",
    time: "18:00 h",
    type: "proyecto_ley",
    status: "aprobado",
    category: "Justicia",
    summary: "El Congreso aprueba un acuerdo de extradición con Egipto, garantizando la entrega de criminales y fortaleciendo la cooperación judicial entre ambas naciones.",
    isOmnibus: false,
    threeKeys: {
      "what": "Establece un acuerdo para la entrega de criminales entre España y Egipto.",
      "pocket": "No impacta directamente en el bolsillo de los ciudadanos.",
      "clash": "Defensores de la seguridad jurídica versus aquellos que temen la extracción de ciudadanos sin garantías."
},
    beforeVsAfter: {
      "before": "Antes, los criminales podían escapar de la justicia en caso de extradición.",
      "after": "Ahora, se facilita la entrega de criminales entre ambos países, mejorando la seguridad jurídica."
},
    measures: [
      {
            "id": "congreso-2026-06-18-18-m1",
            "title": "Acuerdo de Extradición",
            "category": "Justicia",
            "plainDescription": "Estipula el procedimiento para la entrega de ciudadanos españoles a Egipto en caso de cometer delitos en ambos países.",
            "whoIsAffected": [
                  "Ciudadanos españoles que puedan cometer delitos en Egipto",
                  "Criminales que operan en ambos países"
            ],
            "realWorldExample": "Juan, un ciudadano español, comete un delito en Egipto y es acusado por las autoridades locales. Con el nuevo acuerdo, puede ser extraditado a España para ser juzgado, asegurando que no escape de la justicia.",
            "argumentsPro": [
                  "Fortalecimiento de la cooperación judicial entre España y Egipto",
                  "Garantía de que criminales no escapen de la justicia"
            ],
            "argumentsContra": [
                  "Inquietud sobre la protección de los derechos de los ciudadanos durante el proceso de extradición",
                  "Posible riesgo de que ciudadanos sean entregados sin garantías"
            ]
      }
],
    votesSummary: {"si":294,"no":40,"abstencion":12,"noVota":4,"total":350},
    groupVotes: [{"groupName":"G.P. Popular (PP)","totalSeats":137,"si":137,"no":0,"abstencion":0,"noVota":0,"color":"#0ea5e9"},{"groupName":"G.P. Socialista (PSOE)","totalSeats":121,"si":121,"no":0,"abstencion":0,"noVota":0,"color":"#ef4444"},{"groupName":"G.P. VOX","totalSeats":33,"si":33,"no":0,"abstencion":0,"noVota":0,"color":"#22c55e"},{"groupName":"G.P. Plurinacional Sumar","totalSeats":27,"si":3,"no":24,"abstencion":0,"noVota":0,"color":"#ec4899"},{"groupName":"G.P. Republicano (ERC)","totalSeats":7,"si":0,"no":7,"abstencion":0,"noVota":0,"color":"#f59e0b"},{"groupName":"G.P. Junts per Catalunya","totalSeats":7,"si":0,"no":7,"abstencion":0,"noVota":0,"color":"#06b6d4"},{"groupName":"G.P. Euskal Herria Bildu","totalSeats":6,"si":0,"no":2,"abstencion":4,"noVota":0,"color":"#84cc16"},{"groupName":"G.P. Vasco (EAJ-PNV)","totalSeats":5,"si":0,"no":0,"abstencion":5,"noVota":0,"color":"#10b981"},{"groupName":"G.P. Mixto (Podemos/BNG/CC/UPN)","totalSeats":7,"si":0,"no":0,"abstencion":3,"noVota":4,"color":"#8b5cf6"}],
    bocgUrl: "https://www.congreso.es/datos-abiertos",
    expedienteNumber: "121/20260618",
  },
  {
    id: "congreso-2026-06-16-1",
    title: "Ley para designar jueces europeos: impacto en la justicia",
    officialTitle: "Proposición de Ley del Grupo Parlamentario Popular en el Congreso, Orgánica de modificación de la Ley Orgánica 6/1985, de 1 de julio, del Poder Judicial, para regular el procedimiento de designación de candidaturas a juez titular y jueces ad hoc del Tribunal Europeo de Derechos Humanos y a jueces y abogados generales del Tribunal de Justicia y del Tribunal General de la Unión Europea, que corresponde proponer al Reino de España.",
    chamber: "congreso",
    date: "2026-06-16",
    time: "18:00 h",
    type: "proposicion_ley",
    status: "rechazado",
    category: "Justicia",
    summary: "El Congreso votará sobre una ley que regula la designación de jueces para tribunales europeos, mejorando la transparencia y representatividad del sistema judicial.",
    isOmnibus: false,
    threeKeys: {
      "what": "Regula el proceso de selección de jueces para tribunales europeos.",
      "pocket": "No afecta directamente al bolsillo, pero mejora la calidad de la justicia.",
      "clash": "Defensores de la ley argumentan que mejora la representatividad, mientras que opositores temen que altere el equilibrio."
},
    beforeVsAfter: {
      "before": "Actualmente, el proceso de designación es menos formalizado.",
      "after": "La nueva ley establece un procedimiento más claro y transparente."
},
    measures: [
      {
            "id": "congreso-2026-06-16-1-m1",
            "title": "Procedimiento transparente para designar jueces",
            "category": "Selección de jueces",
            "plainDescription": "Establece un proceso formal para la designación de jueces para tribunales europeos, asegurando un procedimiento más transparente y representativo.",
            "whoIsAffected": [
                  "Jueces y abogados que buscan ser designados",
                  "Instituciones europeas"
            ],
            "realWorldExample": "María, una abogada con experiencia en derechos humanos, se postula para ser jueza del Tribunal Europeo de Derechos Humanos. Con la nueva ley, el proceso de selección será más claro y justificado, aumentando sus posibilidades de ser designada.",
            "argumentsPro": [
                  "Mejora la representatividad de los jueces en tribunales europeos",
                  "Aumenta la transparencia del proceso de selección"
            ],
            "argumentsContra": [
                  "Puede alterar el equilibrio entre jueces nacionales e internacionales",
                  "Posible influencia de factores políticos en la designación"
            ]
      }
],
    votesSummary: {"si":170,"no":174,"abstencion":0,"noVota":6,"total":350},
    groupVotes: [{"groupName":"G.P. Popular (PP)","totalSeats":137,"si":137,"no":0,"abstencion":0,"noVota":0,"color":"#0ea5e9"},{"groupName":"G.P. Socialista (PSOE)","totalSeats":121,"si":33,"no":88,"abstencion":0,"noVota":0,"color":"#ef4444"},{"groupName":"G.P. VOX","totalSeats":33,"si":0,"no":33,"abstencion":0,"noVota":0,"color":"#22c55e"},{"groupName":"G.P. Plurinacional Sumar","totalSeats":27,"si":0,"no":27,"abstencion":0,"noVota":0,"color":"#ec4899"},{"groupName":"G.P. Republicano (ERC)","totalSeats":7,"si":0,"no":7,"abstencion":0,"noVota":0,"color":"#f59e0b"},{"groupName":"G.P. Junts per Catalunya","totalSeats":7,"si":0,"no":7,"abstencion":0,"noVota":0,"color":"#06b6d4"},{"groupName":"G.P. Euskal Herria Bildu","totalSeats":6,"si":0,"no":6,"abstencion":0,"noVota":0,"color":"#84cc16"},{"groupName":"G.P. Vasco (EAJ-PNV)","totalSeats":5,"si":0,"no":5,"abstencion":0,"noVota":0,"color":"#10b981"},{"groupName":"G.P. Mixto (Podemos/BNG/CC/UPN)","totalSeats":7,"si":0,"no":1,"abstencion":0,"noVota":6,"color":"#8b5cf6"}],
    bocgUrl: "https://www.congreso.es/datos-abiertos",
    expedienteNumber: "121/20260616",
  },
  {
    id: "congreso-2026-06-16-2",
    title: "Igualdad laboral: un paso más hacia la justicia",
    officialTitle: "Proposición de Ley del Grupo Parlamentario Socialista, para la modificación de la Ley 16/1983, de 24 de octubre, de creación del Instituto de la Mujer y de determinadas leyes procesales dentro de su ámbito competencial.",
    chamber: "congreso",
    date: "2026-06-16",
    time: "18:00 h",
    type: "proposicion_ley",
    status: "rechazado",
    category: "Trabajo",
    summary: "El Congreso discute la Proposición de Ley del Grupo Parlamentario Socialista, que busca erradicar la brecha salarial. Esta medida promete mejorar la calidad de vida de las mujeres trabajadoras, aunque genera debate sobre sus costos y beneficios.",
    isOmnibus: false,
    threeKeys: {
      "what": "Establece medidas para erradicar la brecha salarial entre hombres y mujeres.",
      "pocket": "Las mujeres podrían percibir un incremento de hasta 10% en sus ingresos anuales, aliviando el estrés financiero.",
      "clash": "Empresarios temen que esto pueda aumentar los costes laborales, mientras que sindicatos defienden que es necesario para garantizar la igualdad."
},
    beforeVsAfter: {
      "before": "Antes, las mujeres percibían, en promedio, un 15% menos que los hombres por realizar las mismas tareas.",
      "after": "Con la nueva ley, se espera que la brecha salarial se reduzca significativamente, beneficiando a millones de trabajadoras."
},
    measures: [
      {
            "id": "congreso-2026-06-16-2-m1",
            "title": "Igualdad salarial",
            "category": "Trabajo",
            "plainDescription": "Establece un marco legal para garantizar que hombres y mujeres reciban el mismo salario por trabajo igual o similar.",
            "whoIsAffected": [
                  "Mujeres trabajadoras",
                  "Empresarios"
            ],
            "realWorldExample": "María, una trabajadora de oficina, percibe un 10% menos que su compañero de trabajo, Juan, por realizar las mismas tareas. Con la nueva ley, María podría ver un aumento de su salario, aliviando el estrés financiero y mejorando su calidad de vida.",
            "argumentsPro": [
                  "Promover la igualdad de género",
                  "Mejorar la satisfacción laboral y el bienestar de las trabajadoras"
            ],
            "argumentsContra": [
                  "Puede aumentar los costes laborales",
                  "Se teme que esto pueda llevar a una reducción de empleos"
            ]
      }
],
    votesSummary: {"si":166,"no":174,"abstencion":4,"noVota":6,"total":350},
    groupVotes: [{"groupName":"G.P. Popular (PP)","totalSeats":137,"si":137,"no":0,"abstencion":0,"noVota":0,"color":"#0ea5e9"},{"groupName":"G.P. Socialista (PSOE)","totalSeats":121,"si":29,"no":92,"abstencion":0,"noVota":0,"color":"#ef4444"},{"groupName":"G.P. VOX","totalSeats":33,"si":0,"no":33,"abstencion":0,"noVota":0,"color":"#22c55e"},{"groupName":"G.P. Plurinacional Sumar","totalSeats":27,"si":0,"no":27,"abstencion":0,"noVota":0,"color":"#ec4899"},{"groupName":"G.P. Republicano (ERC)","totalSeats":7,"si":0,"no":7,"abstencion":0,"noVota":0,"color":"#f59e0b"},{"groupName":"G.P. Junts per Catalunya","totalSeats":7,"si":0,"no":7,"abstencion":0,"noVota":0,"color":"#06b6d4"},{"groupName":"G.P. Euskal Herria Bildu","totalSeats":6,"si":0,"no":6,"abstencion":0,"noVota":0,"color":"#84cc16"},{"groupName":"G.P. Vasco (EAJ-PNV)","totalSeats":5,"si":0,"no":2,"abstencion":3,"noVota":0,"color":"#10b981"},{"groupName":"G.P. Mixto (Podemos/BNG/CC/UPN)","totalSeats":7,"si":0,"no":0,"abstencion":1,"noVota":6,"color":"#8b5cf6"}],
    bocgUrl: "https://www.congreso.es/datos-abiertos",
    expedienteNumber: "121/20260616",
  },
  {
    id: "congreso-2026-06-11-1",
    title: "Norma para controlar el gasto público",
    officialTitle: "Propuesta de fijación de los objetivos de estabilidad presupuestaria y de deuda pública para el conjunto de las Administraciones Públicas (Techo de Gasto 2027).",
    chamber: "congreso",
    date: "2026-06-11",
    time: "19:15 h",
    type: "proposicion_ley",
    status: "rechazado",
    category: "Presupuestos",
    summary: "Se fijan objetivos para mantener el equilibrio presupuestario y controlar la deuda, limitando el aumento del gasto público. Esto afecta a servicios y empleo, generando debate sobre equilibrio fiscal y bienestar social.",
    isOmnibus: false,
    threeKeys: {
      "what": "Establece objetivos para mantener el equilibrio presupuestario y controlar la deuda",
      "pocket": "Limita el aumento del gasto público, afectando a servicios y empleo",
      "clash": "Gobiernos proponen medidas para equilibrar el presupuesto, oposición critica restricciones"
},
    beforeVsAfter: {
      "before": "Antes, no había objetivos específicos para el control del gasto público",
      "after": "Ahora se establecen límites para el gasto, con un techo para 2027"
},
    measures: [
      {
            "id": "congreso-2026-06-11-1-m1",
            "title": "Techo de Gasto 2027",
            "category": "Economía",
            "plainDescription": "Establece un límite máximo para el aumento del gasto público",
            "whoIsAffected": [
                  "Administraciones Públicas",
                  "Servicios públicos"
            ],
            "realWorldExample": "El gasto en educación y sanidad podría verse reducido para cumplir con el techo de gasto, afectando a 100.000 empleos en estos sectores en 2027",
            "argumentsPro": [
                  "Evita la acumulación de deuda",
                  "Mantiene la solvencia financiera"
            ],
            "argumentsContra": [
                  "Restringiría servicios esenciales",
                  "Afectaría a la competitividad económica"
            ]
      }
],
    votesSummary: {"si":171,"no":178,"abstencion":1,"noVota":0,"total":350},
    groupVotes: [{"groupName":"G.P. Popular (PP)","totalSeats":137,"si":137,"no":0,"abstencion":0,"noVota":0,"color":"#0ea5e9"},{"groupName":"G.P. Socialista (PSOE)","totalSeats":121,"si":34,"no":87,"abstencion":0,"noVota":0,"color":"#ef4444"},{"groupName":"G.P. VOX","totalSeats":33,"si":0,"no":33,"abstencion":0,"noVota":0,"color":"#22c55e"},{"groupName":"G.P. Plurinacional Sumar","totalSeats":27,"si":0,"no":27,"abstencion":0,"noVota":0,"color":"#ec4899"},{"groupName":"G.P. Republicano (ERC)","totalSeats":7,"si":0,"no":7,"abstencion":0,"noVota":0,"color":"#f59e0b"},{"groupName":"G.P. Junts per Catalunya","totalSeats":7,"si":0,"no":7,"abstencion":0,"noVota":0,"color":"#06b6d4"},{"groupName":"G.P. Euskal Herria Bildu","totalSeats":6,"si":0,"no":6,"abstencion":0,"noVota":0,"color":"#84cc16"},{"groupName":"G.P. Vasco (EAJ-PNV)","totalSeats":5,"si":0,"no":5,"abstencion":0,"noVota":0,"color":"#10b981"},{"groupName":"G.P. Mixto (Podemos/BNG/CC/UPN)","totalSeats":7,"si":0,"no":6,"abstencion":1,"noVota":0,"color":"#8b5cf6"}],
    bocgUrl: "https://www.congreso.es/datos-abiertos",
    expedienteNumber: "151/000004",
  },
  {
    id: "congreso-2026-05-28-1",
    title: "Norma para enfrentar la sequía en España",
    officialTitle: "Real Decreto-ley 11/2026, de 19 de mayo, por el que se adoptan medidas urgentes en materia agraria, gestión de recursos hídricos y ayudas directas frente a la sequía.",
    chamber: "congreso",
    date: "2026-05-28",
    time: "17:50 h",
    type: "real_decreto_ley",
    status: "aprobado",
    category: "Agricultura",
    summary: "El Real Decreto-ley 11/2026 introduce medidas urgentes para la agricultura y recursos hídricos, incluyendo ayudas a los agricultores y restricciones en el uso del agua. Esto afecta principalmente a los agricultores y usuarios del agua, buscando mitigar la sequía.",
    isOmnibus: false,
    threeKeys: {
      "what": "Establece medidas urgentes para la agricultura y gestión de recursos hídricos.",
      "pocket": "Ayudas directas a agricultores y restricciones en el uso del agua.",
      "clash": "Gobiernos defienden medidas urgentes, oposición critica costos y efectividad."
},
    beforeVsAfter: {
      "before": "Antes, no existían medidas específicas urgentes para la sequía.",
      "after": "Ahora, se implementan ayudas y restricciones para gestionar el agua."
},
    measures: [
      {
            "id": "congreso-2026-05-28-1-m1",
            "title": "Ayudas directas a agricultores",
            "category": "Ayudas económicas",
            "plainDescription": "Se otorgan subvenciones para mitigar los costes de la sequía.",
            "whoIsAffected": [
                  "Agricultores",
                  "Empresas agrícolas"
            ],
            "realWorldExample": "Un agricultor recibe 10.000 euros para modernizar su sistema de riego.",
            "argumentsPro": [
                  "Ayuda a mantener la producción agrícola",
                  "Fomenta la innovación en el uso del agua"
            ],
            "argumentsContra": [
                  "Costo para el contribuyente",
                  "No garantiza el ahorro de agua"
            ]
      }
],
    votesSummary: {"si":325,"no":20,"abstencion":5,"noVota":0,"total":350},
    groupVotes: [{"groupName":"G.P. Popular (PP)","totalSeats":137,"si":137,"no":0,"abstencion":0,"noVota":0,"color":"#0ea5e9"},{"groupName":"G.P. Socialista (PSOE)","totalSeats":121,"si":121,"no":0,"abstencion":0,"noVota":0,"color":"#ef4444"},{"groupName":"G.P. VOX","totalSeats":33,"si":33,"no":0,"abstencion":0,"noVota":0,"color":"#22c55e"},{"groupName":"G.P. Plurinacional Sumar","totalSeats":27,"si":27,"no":0,"abstencion":0,"noVota":0,"color":"#ec4899"},{"groupName":"G.P. Republicano (ERC)","totalSeats":7,"si":7,"no":0,"abstencion":0,"noVota":0,"color":"#f59e0b"},{"groupName":"G.P. Junts per Catalunya","totalSeats":7,"si":0,"no":7,"abstencion":0,"noVota":0,"color":"#06b6d4"},{"groupName":"G.P. Euskal Herria Bildu","totalSeats":6,"si":0,"no":6,"abstencion":0,"noVota":0,"color":"#84cc16"},{"groupName":"G.P. Vasco (EAJ-PNV)","totalSeats":5,"si":0,"no":5,"abstencion":0,"noVota":0,"color":"#10b981"},{"groupName":"G.P. Mixto (Podemos/BNG/CC/UPN)","totalSeats":7,"si":0,"no":2,"abstencion":5,"noVota":0,"color":"#8b5cf6"}],
    bocgUrl: "https://www.congreso.es/datos-abiertos",
    expedienteNumber: "130/000049",
  },
  {
    id: "congreso-2026-05-26-1",
    title: "Consumo saludable: una nueva norma para todos",
    officialTitle: "Proposición de Ley del Grupo Parlamentario Plurinacional SUMAR, para la promoción del consumo de alimentos y bebidas saludables.",
    chamber: "congreso",
    date: "2026-05-26",
    time: "18:00 h",
    type: "proposicion_ley",
    status: "rechazado",
    category: "Salud",
    summary: "El Congreso aprueba una ley que busca promover el consumo de alimentos y bebidas saludables, mejorando la calidad de vida de los ciudadanos y reduciendo costos médicos.",
    isOmnibus: false,
    threeKeys: {
      "what": "Fomenta alimentos y bebidas saludables en toda la población.",
      "pocket": "Ayuda a reducir gastos en medicación y mejora la calidad de vida.",
      "clash": "Defensores ven beneficios en la prevención de enfermedades, mientras que críticos temen que sea una imposición."
},
    beforeVsAfter: {
      "before": "Antes, la variedad de alimentos y bebidas no siempre incluía opciones saludables.",
      "after": "Ahora, se promueven más opciones saludables en los lugares de consumo."
},
    measures: [
      {
            "id": "congreso-2026-05-26-1-m1",
            "title": "Menús saludables en establecimientos",
            "category": "Restauración",
            "plainDescription": "Requisitos para que los establecimientos ofrezcan opciones de alimentos y bebidas saludables.",
            "whoIsAffected": [
                  "Consumidores",
                  "Propietarios de restaurantes y cafeterías"
            ],
            "realWorldExample": "Juan, un padre de familia, ahora puede llevar a su hijo a un restaurante que ofrece menús infantiles saludables, evitando el consumo de alimentos poco nutritivos. Los dueños de estos locales, como María, se adaptan a nuevas regulaciones para mantener a sus clientes satisfechos y saludables.",
            "argumentsPro": [
                  "Mejora la salud de los consumidores",
                  "Aumenta la conciencia sobre la alimentación saludable"
            ],
            "argumentsContra": [
                  "Puede aumentar los costos de producción",
                  "Puede limitar la variedad de opciones"
            ]
      }
],
    votesSummary: {"si":166,"no":178,"abstencion":5,"noVota":1,"total":350},
    groupVotes: [{"groupName":"G.P. Popular (PP)","totalSeats":137,"si":137,"no":0,"abstencion":0,"noVota":0,"color":"#0ea5e9"},{"groupName":"G.P. Socialista (PSOE)","totalSeats":121,"si":29,"no":92,"abstencion":0,"noVota":0,"color":"#ef4444"},{"groupName":"G.P. VOX","totalSeats":33,"si":0,"no":33,"abstencion":0,"noVota":0,"color":"#22c55e"},{"groupName":"G.P. Plurinacional Sumar","totalSeats":27,"si":0,"no":27,"abstencion":0,"noVota":0,"color":"#ec4899"},{"groupName":"G.P. Republicano (ERC)","totalSeats":7,"si":0,"no":7,"abstencion":0,"noVota":0,"color":"#f59e0b"},{"groupName":"G.P. Junts per Catalunya","totalSeats":7,"si":0,"no":7,"abstencion":0,"noVota":0,"color":"#06b6d4"},{"groupName":"G.P. Euskal Herria Bildu","totalSeats":6,"si":0,"no":6,"abstencion":0,"noVota":0,"color":"#84cc16"},{"groupName":"G.P. Vasco (EAJ-PNV)","totalSeats":5,"si":0,"no":5,"abstencion":0,"noVota":0,"color":"#10b981"},{"groupName":"G.P. Mixto (Podemos/BNG/CC/UPN)","totalSeats":7,"si":0,"no":1,"abstencion":5,"noVota":1,"color":"#8b5cf6"}],
    bocgUrl: "https://www.congreso.es/datos-abiertos",
    expedienteNumber: "121/20260526",
  },
  {
    id: "congreso-2026-05-26-2",
    title: "Modificaciones en la Propiedad Horizontal para Proteger a los Vecinos",
    officialTitle: "Proposición de Ley del Grupo Parlamentario Popular en el Congreso, de modificación de la Ley 49/1960, de 21 de julio, sobre propiedad horizontal.",
    chamber: "congreso",
    date: "2026-05-26",
    time: "18:00 h",
    type: "proposicion_ley",
    status: "aprobado",
    category: "Vivienda",
    summary: "El Congreso analiza la nueva ley para mejorar la convivencia en edificios, asegurando que los gastos se repartan equitativamente entre propietarios e inquilinos.",
    isOmnibus: false,
    threeKeys: {
      "what": "Se establecen nuevas regulaciones para mejorar la convivencia en edificios",
      "pocket": "Los gastos de mantenimiento y reformas serán más equitativos, reduciendo el coste para los propietarios",
      "clash": "Inquilinos y propietarios buscan equilibrar los derechos y obligaciones en la comunidad de propietarios"
},
    beforeVsAfter: {
      "before": "Antes, los costes de mantenimiento y reformas eran a veces desproporcionados para algunos propietarios",
      "after": "Ahora, los gastos se distribuirán de manera más justa, beneficiando a todos los vecinos"
},
    measures: [
      {
            "id": "congreso-2026-05-26-2-m1",
            "title": "Equidad en los Gastos de Mantenimiento",
            "category": "Propiedad Horizontal",
            "plainDescription": "Se establecen reglas claras para que los gastos de mantenimiento y reformas se distribuyan de manera justa entre todos los propietarios y inquilinos.",
            "whoIsAffected": [
                  "Propietarios de viviendas",
                  "Inquilinos de edificios"
            ],
            "realWorldExample": "Juan, un inquilino, y María, una propietaria, viven en un edificio donde se necesita una reforma importante. Antes, Juan pagaba un 20% más en tasas de comunidad. Ahora, con la nueva ley, ambos pagarán proporcionalmente a su participación en el edificio, lo que les permite compartir los costes de manera más justa.",
            "argumentsPro": [
                  "Se garantiza que los inquilinos no paguen por reformas que no utilizan",
                  "Se evita que los propietarios asuman costes desproporcionados"
            ],
            "argumentsContra": [
                  "Los inquilinos podrían sentirse que no tienen suficiente voz en las decisiones de la comunidad",
                  "Los propietarios podrían temer que las reformas no se realicen si no hay consenso"
            ]
      }
],
    votesSummary: {"si":306,"no":33,"abstencion":10,"noVota":1,"total":350},
    groupVotes: [{"groupName":"G.P. Popular (PP)","totalSeats":137,"si":137,"no":0,"abstencion":0,"noVota":0,"color":"#0ea5e9"},{"groupName":"G.P. Socialista (PSOE)","totalSeats":121,"si":121,"no":0,"abstencion":0,"noVota":0,"color":"#ef4444"},{"groupName":"G.P. VOX","totalSeats":33,"si":33,"no":0,"abstencion":0,"noVota":0,"color":"#22c55e"},{"groupName":"G.P. Plurinacional Sumar","totalSeats":27,"si":15,"no":12,"abstencion":0,"noVota":0,"color":"#ec4899"},{"groupName":"G.P. Republicano (ERC)","totalSeats":7,"si":0,"no":7,"abstencion":0,"noVota":0,"color":"#f59e0b"},{"groupName":"G.P. Junts per Catalunya","totalSeats":7,"si":0,"no":7,"abstencion":0,"noVota":0,"color":"#06b6d4"},{"groupName":"G.P. Euskal Herria Bildu","totalSeats":6,"si":0,"no":6,"abstencion":0,"noVota":0,"color":"#84cc16"},{"groupName":"G.P. Vasco (EAJ-PNV)","totalSeats":5,"si":0,"no":1,"abstencion":4,"noVota":0,"color":"#10b981"},{"groupName":"G.P. Mixto (Podemos/BNG/CC/UPN)","totalSeats":7,"si":0,"no":0,"abstencion":6,"noVota":1,"color":"#8b5cf6"}],
    bocgUrl: "https://www.congreso.es/datos-abiertos",
    expedienteNumber: "121/20260526",
  },
  {
    id: "congreso-2026-05-26-3",
    title: "Reforma del Reglamento: Mejora la Transparencia y Eficiencia",
    officialTitle: "Proposición del Sr. Álvaro Vidal y otros 20 Diputados, de reforma del Reglamento del Congreso.",
    chamber: "congreso",
    date: "2026-05-26",
    time: "18:00 h",
    type: "proyecto_ley",
    status: "aprobado",
    category: "Tráfico",
    summary: "El Congreso aprueba una reforma que busca mejorar la transparencia y eficiencia en sus procedimientos, lo que supone un avance en la calidad del servicio legislativo para todos los ciudadanos.",
    isOmnibus: false,
    threeKeys: {
      "what": "Mejora la transparencia y eficiencia en el funcionamiento del Congreso.",
      "pocket": "No afecta directamente al bolsillo de los ciudadanos, pero mejora la calidad del servicio legislativo.",
      "clash": "Defensores argumentan que la reforma facilita la toma de decisiones, mientras que oponentes temen que pueda reducir la participación ciudadana."
},
    beforeVsAfter: {
      "before": "Antes, el funcionamiento del Congreso era menos transparente y eficiente.",
      "after": "Ahora, las sesiones y procedimientos serán más claros y ágiles, beneficiando a todos los ciudadanos."
},
    measures: [
      {
            "id": "congreso-2026-05-26-3-m1",
            "title": "Mejora de la Transparencia y Eficiencia",
            "category": "Procedimientos Legislativos",
            "plainDescription": "Establece nuevas reglas para mejorar la transparencia y eficiencia en las sesiones y procedimientos del Congreso.",
            "whoIsAffected": [
                  "Diputados y Senadores",
                  "Ciudadanos que siguen la actividad legislativa"
            ],
            "realWorldExample": "Juan, un ciudadano que sigue la actividad legislativa, podrá acceder a información más clara y detallada sobre las votaciones y debates, facilitando su comprensión y participación en la vida política.",
            "argumentsPro": [
                  "Facilita la toma de decisiones más rápidas y eficientes",
                  "Mejora la calidad de la información disponible para los ciudadanos"
            ],
            "argumentsContra": [
                  "Puede reducir la participación ciudadana",
                  "Puede complicar el proceso legislativo para algunos diputados"
            ]
      }
],
    votesSummary: {"si":178,"no":171,"abstencion":0,"noVota":1,"total":350},
    groupVotes: [{"groupName":"G.P. Popular (PP)","totalSeats":137,"si":137,"no":0,"abstencion":0,"noVota":0,"color":"#0ea5e9"},{"groupName":"G.P. Socialista (PSOE)","totalSeats":121,"si":41,"no":80,"abstencion":0,"noVota":0,"color":"#ef4444"},{"groupName":"G.P. VOX","totalSeats":33,"si":0,"no":33,"abstencion":0,"noVota":0,"color":"#22c55e"},{"groupName":"G.P. Plurinacional Sumar","totalSeats":27,"si":0,"no":27,"abstencion":0,"noVota":0,"color":"#ec4899"},{"groupName":"G.P. Republicano (ERC)","totalSeats":7,"si":0,"no":7,"abstencion":0,"noVota":0,"color":"#f59e0b"},{"groupName":"G.P. Junts per Catalunya","totalSeats":7,"si":0,"no":7,"abstencion":0,"noVota":0,"color":"#06b6d4"},{"groupName":"G.P. Euskal Herria Bildu","totalSeats":6,"si":0,"no":6,"abstencion":0,"noVota":0,"color":"#84cc16"},{"groupName":"G.P. Vasco (EAJ-PNV)","totalSeats":5,"si":0,"no":5,"abstencion":0,"noVota":0,"color":"#10b981"},{"groupName":"G.P. Mixto (Podemos/BNG/CC/UPN)","totalSeats":7,"si":0,"no":6,"abstencion":0,"noVota":1,"color":"#8b5cf6"}],
    bocgUrl: "https://www.congreso.es/datos-abiertos",
    expedienteNumber: "121/20260526",
  },
  {
    id: "congreso-2026-05-20-1",
    title: "Mejora en vivienda protegida: transparencia y control",
    officialTitle: "Proposición no de Ley del Grupo Parlamentario Socialista, relativa al parque público de vivienda y al refuerzo de la transparencia y los mecanismos de control en los procesos de adjudicación de vivienda protegida.",
    chamber: "congreso",
    date: "2026-05-20",
    time: "18:00 h",
    type: "mocion",
    status: "aprobado",
    category: "Vivienda",
    summary: "El Congreso aprueba una iniciativa para mejorar la transparencia en la adjudicación de vivienda protegida, lo que beneficiará a miles de familias buscando un alquiler o compra justa.",
    isOmnibus: false,
    threeKeys: {
      "what": "Refuerza la transparencia en la adjudicación de vivienda protegida.",
      "pocket": "Ayuda a evitar abusos y garantiza un proceso más justo para los aspirantes.",
      "clash": "Defensores ven la medida como necesaria para la justicia social, mientras que críticos temen que restrinja la oferta."
},
    beforeVsAfter: {
      "before": "Antes, los procesos de adjudicación eran menos transparentes, lo que generaba dudas y desconfianza.",
      "after": "Ahora, los procedimientos serán más claros, lo que ayudará a los aspirantes a vivienda protegida a entender mejor el proceso."
},
    measures: [
      {
            "id": "congreso-2026-05-20-1-m1",
            "title": "Procedimiento transparente en la adjudicación de vivienda protegida",
            "category": "Transparencia",
            "plainDescription": "Establece un marco legal que garantiza la transparencia y el control en los procesos de adjudicación de vivienda protegida.",
            "whoIsAffected": [
                  "Familias en busca de vivienda protegida",
                  "Inquilinos y compradores"
            ],
            "realWorldExample": "María, una madre soltera con dos hijos, se beneficiará de esta medida ya que ahora podrá acceder a información detallada sobre los procesos de adjudicación, lo que le permitirá tomar decisiones informadas y evitar trámites engorrosos.",
            "argumentsPro": [
                  "Evitar abusos y garantizar un proceso justo",
                  "Mejorar la confianza entre ciudadanos y administración"
            ],
            "argumentsContra": [
                  "Puede retrasar o complicar el proceso",
                  "Posible reducción de la oferta de viviendas protegidas"
            ]
      }
],
    votesSummary: {"si":173,"no":32,"abstencion":142,"noVota":3,"total":350},
    groupVotes: [{"groupName":"G.P. Popular (PP)","totalSeats":137,"si":137,"no":0,"abstencion":0,"noVota":0,"color":"#0ea5e9"},{"groupName":"G.P. Socialista (PSOE)","totalSeats":121,"si":36,"no":32,"abstencion":53,"noVota":0,"color":"#ef4444"},{"groupName":"G.P. VOX","totalSeats":33,"si":0,"no":0,"abstencion":33,"noVota":0,"color":"#22c55e"},{"groupName":"G.P. Plurinacional Sumar","totalSeats":27,"si":0,"no":0,"abstencion":27,"noVota":0,"color":"#ec4899"},{"groupName":"G.P. Republicano (ERC)","totalSeats":7,"si":0,"no":0,"abstencion":7,"noVota":0,"color":"#f59e0b"},{"groupName":"G.P. Junts per Catalunya","totalSeats":7,"si":0,"no":0,"abstencion":7,"noVota":0,"color":"#06b6d4"},{"groupName":"G.P. Euskal Herria Bildu","totalSeats":6,"si":0,"no":0,"abstencion":6,"noVota":0,"color":"#84cc16"},{"groupName":"G.P. Vasco (EAJ-PNV)","totalSeats":5,"si":0,"no":0,"abstencion":5,"noVota":0,"color":"#10b981"},{"groupName":"G.P. Mixto (Podemos/BNG/CC/UPN)","totalSeats":7,"si":0,"no":0,"abstencion":4,"noVota":3,"color":"#8b5cf6"}],
    bocgUrl: "https://www.congreso.es/datos-abiertos",
    expedienteNumber: "121/20260520",
  },
  {
    id: "congreso-2026-05-20-2",
    title: "Vivienda Digna: Frenar la Especulación Inmobiliaria",
    officialTitle: "Proposición no de Ley del Grupo Parlamentario Plurinacional SUMAR, para frenar la especulación inmobiliaria y garantizar el acceso a una vivienda digna.\nSe vota en los términos de la enmienda transaccional presentada por el Grupo Parlamentario Socialista y el Grupo Parlamentario Plurinacional SUMAR.",
    chamber: "congreso",
    date: "2026-05-20",
    time: "18:00 h",
    type: "mocion",
    status: "rechazado",
    category: "Vivienda",
    summary: "El Congreso vota una enmienda para frenar la especulación inmobiliaria, garantizando viviendas asequibles. Esto beneficiará a los jóvenes y familias con bajos ingresos, mientras que los propietarios y inversores buscarán equilibrio.",
    isOmnibus: false,
    threeKeys: {
      "what": "Limita la especulación para asegurar viviendas asequibles.",
      "pocket": "Alivio en el alquiler y coste de la vivienda propia para familias y jóvenes.",
      "clash": "Inquilinos y compradores temen alza de precios, mientras que propietarios y inversores temen restricciones."
},
    beforeVsAfter: {
      "before": "Antes, el alquiler y el precio de la vivienda subían rápidamente, afectando a los presupuestos.",
      "after": "Ahora, se prevé un aumento moderado y predecible, beneficiando a los que buscan un techo estable."
},
    measures: [
      {
            "id": "congreso-2026-05-20-2-m1",
            "title": "Frenar la Especulación Inmobiliaria",
            "category": "Regulación",
            "plainDescription": "Establece límites a las subidas del alquiler y del precio de la vivienda, protegiendo a los inquilinos y compradores.",
            "whoIsAffected": [
                  "Inquilinos",
                  "Jóvenes y familias con bajos ingresos"
            ],
            "realWorldExample": "María, una madre soltera con dos hijos, ve cómo el alquiler de su piso se mantiene estable, evitando que su presupuesto se vea afectado por subidas inesperadas. Por su parte, Carlos, un joven que busca su primer piso, puede acceder a una vivienda asequible sin temor a que el precio suba drásticamente en los próximos años.",
            "argumentsPro": [
                  "Protege a los inquilinos y compradores de subidas inesperadas",
                  "Ayuda a los jóvenes a acceder al mercado inmobiliario"
            ],
            "argumentsContra": [
                  "Inversores y propietarios podrían verse afectados",
                  "Se podría reducir la oferta de viviendas"
            ]
      }
],
    votesSummary: {"si":169,"no":170,"abstencion":8,"noVota":3,"total":350},
    groupVotes: [{"groupName":"G.P. Popular (PP)","totalSeats":137,"si":137,"no":0,"abstencion":0,"noVota":0,"color":"#0ea5e9"},{"groupName":"G.P. Socialista (PSOE)","totalSeats":121,"si":32,"no":89,"abstencion":0,"noVota":0,"color":"#ef4444"},{"groupName":"G.P. VOX","totalSeats":33,"si":0,"no":33,"abstencion":0,"noVota":0,"color":"#22c55e"},{"groupName":"G.P. Plurinacional Sumar","totalSeats":27,"si":0,"no":27,"abstencion":0,"noVota":0,"color":"#ec4899"},{"groupName":"G.P. Republicano (ERC)","totalSeats":7,"si":0,"no":7,"abstencion":0,"noVota":0,"color":"#f59e0b"},{"groupName":"G.P. Junts per Catalunya","totalSeats":7,"si":0,"no":7,"abstencion":0,"noVota":0,"color":"#06b6d4"},{"groupName":"G.P. Euskal Herria Bildu","totalSeats":6,"si":0,"no":6,"abstencion":0,"noVota":0,"color":"#84cc16"},{"groupName":"G.P. Vasco (EAJ-PNV)","totalSeats":5,"si":0,"no":1,"abstencion":4,"noVota":0,"color":"#10b981"},{"groupName":"G.P. Mixto (Podemos/BNG/CC/UPN)","totalSeats":7,"si":0,"no":0,"abstencion":4,"noVota":3,"color":"#8b5cf6"}],
    bocgUrl: "https://www.congreso.es/datos-abiertos",
    expedienteNumber: "121/20260520",
  },
  {
    id: "congreso-2026-05-20-3",
    title: "Educación: Avance en la política educativa",
    officialTitle: "Moción consecuencia de interpelación urgente del Grupo Parlamentario Mixto (Sra. Belarra Urteaga), referida a la política del Gobierno en materia educativa.\nSe vota en los términos de la enmienda transaccional presentada por el Grupo Parlamentario Socialista, el Grupo Parlamentario Republicano, el Grupo Parlamentario EH Bildu y el Grupo Parlamentario Mixto (Sra. Belarra Urteaga).",
    chamber: "congreso",
    date: "2026-05-20",
    time: "18:00 h",
    type: "mocion",
    status: "rechazado",
    category: "Educación",
    summary: "El Congreso aprueba una enmienda para incrementar el presupuesto educativo, beneficiando a los colegios con mayor necesidad. Esto supone un avance en la calidad de la educación para todos los estudiantes.",
    isOmnibus: false,
    threeKeys: {
      "what": "Se aprueba una enmienda para mejorar la calidad educativa.",
      "pocket": "Los recursos adicionales beneficiarán a los centros con mayor necesidad, reduciendo la brecha entre colegios.",
      "clash": "Los partidos apoyan la mejora de la educación, mientras que otros temen que el gasto pueda afectar a otros servicios."
},
    beforeVsAfter: {
      "before": "Antes, los colegios con mayor necesidad carecían de recursos suficientes.",
      "after": "Ahora, estos centros recibirán más fondos para mejorar la calidad de la enseñanza."
},
    measures: [
      {
            "id": "congreso-2026-05-20-3-m1",
            "title": "Fondos adicionales para la educación",
            "category": "Presupuesto",
            "plainDescription": "Se asignarán recursos adicionales a los colegios con mayor necesidad, mejorando la calidad de la enseñanza.",
            "whoIsAffected": [
                  "Centros educativos con mayor necesidad",
                  "Alumnos de estos centros"
            ],
            "realWorldExample": "La escuela de María, en una zona urbana desfavorecida, recibirá 500.000 euros adicionales para mejorar sus instalaciones y contratar profesores especializados, lo que permitirá a sus 300 estudiantes tener un mejor acceso a la educación de calidad.",
            "argumentsPro": [
                  "Mejorar la calidad de la enseñanza para todos",
                  "Reducir la brecha entre colegios"
            ],
            "argumentsContra": [
                  "Posible impacto en otros servicios",
                  "Necesidad de una evaluación rigurosa del uso de los fondos"
            ]
      }
],
    votesSummary: {"si":169,"no":170,"abstencion":8,"noVota":3,"total":350},
    groupVotes: [{"groupName":"G.P. Popular (PP)","totalSeats":137,"si":137,"no":0,"abstencion":0,"noVota":0,"color":"#0ea5e9"},{"groupName":"G.P. Socialista (PSOE)","totalSeats":121,"si":32,"no":89,"abstencion":0,"noVota":0,"color":"#ef4444"},{"groupName":"G.P. VOX","totalSeats":33,"si":0,"no":33,"abstencion":0,"noVota":0,"color":"#22c55e"},{"groupName":"G.P. Plurinacional Sumar","totalSeats":27,"si":0,"no":27,"abstencion":0,"noVota":0,"color":"#ec4899"},{"groupName":"G.P. Republicano (ERC)","totalSeats":7,"si":0,"no":7,"abstencion":0,"noVota":0,"color":"#f59e0b"},{"groupName":"G.P. Junts per Catalunya","totalSeats":7,"si":0,"no":7,"abstencion":0,"noVota":0,"color":"#06b6d4"},{"groupName":"G.P. Euskal Herria Bildu","totalSeats":6,"si":0,"no":6,"abstencion":0,"noVota":0,"color":"#84cc16"},{"groupName":"G.P. Vasco (EAJ-PNV)","totalSeats":5,"si":0,"no":1,"abstencion":4,"noVota":0,"color":"#10b981"},{"groupName":"G.P. Mixto (Podemos/BNG/CC/UPN)","totalSeats":7,"si":0,"no":0,"abstencion":4,"noVota":3,"color":"#8b5cf6"}],
    bocgUrl: "https://www.congreso.es/datos-abiertos",
    expedienteNumber: "121/20260520",
  },
  {
    id: "congreso-2026-05-20-4",
    title: "Moción sobre vivienda: alivio para alquiler y compras",
    officialTitle: "Moción consecuencia de interpelación urgente del Grupo Parlamentario Popular en el Congreso, sobre las políticas en materia de vivienda de este Gobierno.",
    chamber: "congreso",
    date: "2026-05-20",
    time: "18:00 h",
    type: "mocion",
    status: "aprobado",
    category: "Vivienda",
    summary: "El Congreso discute la moción que busca regular el mercado inmobiliario, con el objetivo de hacer más accesible la vivienda para los ciudadanos. Esto supone un alivio para los inquilinos y compradores, pero también plantea preocupaciones sobre la rentabilidad para los propietarios.",
    isOmnibus: false,
    threeKeys: {
      "what": "La moción busca regular el mercado del alquiler y la compra de viviendas.",
      "pocket": "Los inquilinos podrían ver reducidos los precios del alquiler y los compradores podrían acceder a mejores condiciones de financiación.",
      "clash": "Inquilinos temen por el aumento de precios mientras que propietarios se preocupan por la rentabilidad de sus inmuebles."
},
    beforeVsAfter: {
      "before": "Antes, los precios del alquiler y la compra de viviendas estaban en alza, afectando a las finanzas de muchas familias.",
      "after": "Con la nueva regulación, se espera que los precios se estabilicen y se hagan más accesibles tanto para alquiler como para compra."
},
    measures: [
      {
            "id": "congreso-2026-05-20-4-m1",
            "title": "Regulación del alquiler y compra de viviendas",
            "category": "Regulación",
            "plainDescription": "La medida establece límites a los aumentos de precios del alquiler y mejora las condiciones de financiación para la compra de viviendas.",
            "whoIsAffected": [
                  "Inquilinos",
                  "Compradores"
            ],
            "realWorldExample": "Juan, un estudiante, podría ver reducidos los precios del alquiler en su ciudad, lo que le permitiría ahorrar en su presupuesto mensual. Por otro lado, María, una joven pareja, podría acceder a mejores condiciones de financiación para comprar su primera vivienda, lo que les permitiría realizar su sueño de la casa propia.",
            "argumentsPro": [
                  "Ayuda a los jóvenes a acceder al mercado inmobiliario",
                  "Alivia la presión financiera en los inquilinos"
            ],
            "argumentsContra": [
                  "Puede afectar la rentabilidad para los propietarios",
                  "Se podría reducir la oferta de viviendas alquiladas"
            ]
      }
],
    votesSummary: {"si":178,"no":164,"abstencion":5,"noVota":3,"total":350},
    groupVotes: [{"groupName":"G.P. Popular (PP)","totalSeats":137,"si":137,"no":0,"abstencion":0,"noVota":0,"color":"#0ea5e9"},{"groupName":"G.P. Socialista (PSOE)","totalSeats":121,"si":41,"no":80,"abstencion":0,"noVota":0,"color":"#ef4444"},{"groupName":"G.P. VOX","totalSeats":33,"si":0,"no":33,"abstencion":0,"noVota":0,"color":"#22c55e"},{"groupName":"G.P. Plurinacional Sumar","totalSeats":27,"si":0,"no":27,"abstencion":0,"noVota":0,"color":"#ec4899"},{"groupName":"G.P. Republicano (ERC)","totalSeats":7,"si":0,"no":7,"abstencion":0,"noVota":0,"color":"#f59e0b"},{"groupName":"G.P. Junts per Catalunya","totalSeats":7,"si":0,"no":7,"abstencion":0,"noVota":0,"color":"#06b6d4"},{"groupName":"G.P. Euskal Herria Bildu","totalSeats":6,"si":0,"no":6,"abstencion":0,"noVota":0,"color":"#84cc16"},{"groupName":"G.P. Vasco (EAJ-PNV)","totalSeats":5,"si":0,"no":4,"abstencion":1,"noVota":0,"color":"#10b981"},{"groupName":"G.P. Mixto (Podemos/BNG/CC/UPN)","totalSeats":7,"si":0,"no":0,"abstencion":4,"noVota":3,"color":"#8b5cf6"}],
    bocgUrl: "https://www.congreso.es/datos-abiertos",
    expedienteNumber: "121/20260520",
  },
  {
    id: "congreso-2026-05-20-5",
    title: "Ayuda urgente a víctimas de la DANA",
    officialTitle: "Real Decreto-ley 10/2026, de 28 de abril, por el que se aprueban medidas tributarias urgentes y otras medidas de apoyo en respuesta a los daños causados a las víctimas de siniestros de la DANA y otras situaciones de emergencia.",
    chamber: "congreso",
    date: "2026-05-20",
    time: "18:00 h",
    type: "real_decreto_ley",
    status: "aprobado",
    category: "Vivienda",
    summary: "El Congreso aprueba medidas para ayudar a las víctimas de la DANA, incluyendo subvenciones para reparar daños y alivio temporal en el alquiler, mejorando la calidad de vida de los damnificados.",
    isOmnibus: true,
    threeKeys: {
      "what": "Medidas tributarias y apoyo económico para damnificados.",
      "pocket": "Subvenciones para reparación de daños y alivio temporal en el alquiler.",
      "clash": "Inquilinos temen aumento de precios mientras propietarios buscan proteger sus inversiones."
},
    beforeVsAfter: {
      "before": "Viviendas dañadas y propietarios preocupados por costos de reparación.",
      "after": "Ayuda económica para reparar daños y alivio temporal en el alquiler."
},
    measures: [
      {
            "id": "congreso-2026-05-20-5-m1",
            "title": "Subvenciones para reparación de daños",
            "category": "Ayuda a damnificados",
            "plainDescription": "Se establecen subvenciones para ayudar a los damnificados a reparar sus viviendas dañadas por la DANA.",
            "whoIsAffected": [
                  "Propietarios de viviendas dañadas",
                  "Inquilinos afectados"
            ],
            "realWorldExample": "María, una inquilina, recibe una subvención para reparar el techo dañado de su apartamento, lo que le permite evitar el pago de alquiler durante los próximos tres meses mientras se realiza la reparación.",
            "argumentsPro": [
                  "Necesidad de reparación urgente para garantizar la seguridad en viviendas",
                  "Ayuda a inquilinos a mantenerse en sus hogares"
            ],
            "argumentsContra": [
                  "Costo para el erario público",
                  "Posible aumento de precios en el alquiler a largo plazo"
            ]
      }
],
    votesSummary: {"si":315,"no":0,"abstencion":32,"noVota":3,"total":350},
    groupVotes: [{"groupName":"G.P. Popular (PP)","totalSeats":137,"si":137,"no":0,"abstencion":0,"noVota":0,"color":"#0ea5e9"},{"groupName":"G.P. Socialista (PSOE)","totalSeats":121,"si":121,"no":0,"abstencion":0,"noVota":0,"color":"#ef4444"},{"groupName":"G.P. VOX","totalSeats":33,"si":33,"no":0,"abstencion":0,"noVota":0,"color":"#22c55e"},{"groupName":"G.P. Plurinacional Sumar","totalSeats":27,"si":24,"no":0,"abstencion":3,"noVota":0,"color":"#ec4899"},{"groupName":"G.P. Republicano (ERC)","totalSeats":7,"si":0,"no":0,"abstencion":7,"noVota":0,"color":"#f59e0b"},{"groupName":"G.P. Junts per Catalunya","totalSeats":7,"si":0,"no":0,"abstencion":7,"noVota":0,"color":"#06b6d4"},{"groupName":"G.P. Euskal Herria Bildu","totalSeats":6,"si":0,"no":0,"abstencion":6,"noVota":0,"color":"#84cc16"},{"groupName":"G.P. Vasco (EAJ-PNV)","totalSeats":5,"si":0,"no":0,"abstencion":5,"noVota":0,"color":"#10b981"},{"groupName":"G.P. Mixto (Podemos/BNG/CC/UPN)","totalSeats":7,"si":0,"no":0,"abstencion":4,"noVota":3,"color":"#8b5cf6"}],
    bocgUrl: "https://www.congreso.es/datos-abiertos",
    expedienteNumber: "121/20260520",
  },
  {
    id: "congreso-2026-05-20-6",
    title: "Medidas urgentes para víctimas de DANA y contribuyentes",
    officialTitle: "Tramitación como Proyecto de Ley por el procedimiento de urgencia del Real Decreto-ley 10/2026, de 28 de abril, por el que se aprueban medidas tributarias urgentes y otras medidas de apoyo en respuesta a los daños causados a las víctimas de siniestros de la DANA y otras situaciones de emergencia.",
    chamber: "congreso",
    date: "2026-05-20",
    time: "18:00 h",
    type: "real_decreto_ley",
    status: "aprobado",
    category: "Vivienda",
    summary: "El Congreso aprueba medidas urgentes para proteger a las víctimas de DANA y aliviar la carga fiscal de los contribuyentes, mejorando la calidad de vida de muchas familias.",
    isOmnibus: true,
    threeKeys: {
      "what": "Medidas urgentes para víctimas de DANA y apoyo fiscal",
      "pocket": "Ayuda a familias afectadas por alquileres más bajos y alivio fiscal para contribuyentes",
      "clash": "Inquilinos temen subidas de precios mientras propietarios buscan equilibrio"
},
    beforeVsAfter: {
      "before": "Antes, las familias afectadas por DANA pagaban alquileres más altos y contribuyentes se enfrentaban a impuestos más pesados.",
      "after": "Ahora, los alquileres se regulan para evitar subidas y los contribuyentes pueden beneficiarse de rebajas fiscales."
},
    measures: [
      {
            "id": "congreso-2026-05-20-6-m1",
            "title": "Regulación de alquileres para proteger a las familias",
            "category": "Alquileres",
            "plainDescription": "Se establecen límites máximos para los alquileres para evitar subidas desmesuradas y proteger a las familias afectadas por DANA.",
            "whoIsAffected": [
                  "Familias afectadas por DANA",
                  "Inquilinos"
            ],
            "realWorldExample": "María, una madre soltera con dos hijos, ve cómo su alquiler se mantiene estable a pesar de la subida del coste de vida, gracias a la regulación de alquileres.",
            "argumentsPro": [
                  "Protección de los inquilinos contra subidas desmesuradas",
                  "Ayuda a mantener el techo sobre la cabeza de las familias"
            ],
            "argumentsContra": [
                  "Inquietud sobre el impacto en el mercado inmobiliario",
                  "Posible reducción de la oferta de alquileres"
            ]
      }
],
    votesSummary: {"si":347,"no":0,"abstencion":0,"noVota":3,"total":350},
    groupVotes: [{"groupName":"G.P. Popular (PP)","totalSeats":137,"si":137,"no":0,"abstencion":0,"noVota":0,"color":"#0ea5e9"},{"groupName":"G.P. Socialista (PSOE)","totalSeats":121,"si":121,"no":0,"abstencion":0,"noVota":0,"color":"#ef4444"},{"groupName":"G.P. VOX","totalSeats":33,"si":33,"no":0,"abstencion":0,"noVota":0,"color":"#22c55e"},{"groupName":"G.P. Plurinacional Sumar","totalSeats":27,"si":27,"no":0,"abstencion":0,"noVota":0,"color":"#ec4899"},{"groupName":"G.P. Republicano (ERC)","totalSeats":7,"si":7,"no":0,"abstencion":0,"noVota":0,"color":"#f59e0b"},{"groupName":"G.P. Junts per Catalunya","totalSeats":7,"si":7,"no":0,"abstencion":0,"noVota":0,"color":"#06b6d4"},{"groupName":"G.P. Euskal Herria Bildu","totalSeats":6,"si":6,"no":0,"abstencion":0,"noVota":0,"color":"#84cc16"},{"groupName":"G.P. Vasco (EAJ-PNV)","totalSeats":5,"si":5,"no":0,"abstencion":0,"noVota":0,"color":"#10b981"},{"groupName":"G.P. Mixto (Podemos/BNG/CC/UPN)","totalSeats":7,"si":4,"no":0,"abstencion":0,"noVota":3,"color":"#8b5cf6"}],
    bocgUrl: "https://www.congreso.es/datos-abiertos",
    expedienteNumber: "121/20260520",
  },
  {
    id: "congreso-2026-05-19-1",
    title: "Ley para proteger viviendas y vecindarios",
    officialTitle: "Proposición de Ley del Grupo Parlamentario Popular en el Congreso, Orgánica contra la ocupación ilegal de inmuebles y para la convivencia vecinal y la protección de la seguridad de las personas y cosas en las comunidades de propietarios.",
    chamber: "congreso",
    date: "2026-05-19",
    time: "18:00 h",
    type: "proposicion_ley",
    status: "aprobado",
    category: "Vivienda",
    summary: "El Congreso discute una ley que busca regular la ocupación ilegal de inmuebles para proteger a los vecinos y promover la convivencia pacífica en las comunidades.",
    isOmnibus: false,
    threeKeys: {
      "what": "Regula la ocupación ilegal de inmuebles para mejorar la convivencia.",
      "pocket": "Ayuda a evitar costos adicionales y conflictos en comunidades de propietarios.",
      "clash": "Defensores de la ley buscan seguridad y orden, mientras que opositores temen restricciones innecesarias."
},
    beforeVsAfter: {
      "before": "Antes, inquilinos y propietarios vivían en tensión por ocupaciones ilegales.",
      "after": "Ahora, vecindarios podrán convivir de manera más armoniosa y segura."
},
    measures: [
      {
            "id": "congreso-2026-05-19-1-m1",
            "title": "Regulación de ocupaciones ilegales",
            "category": "Convivencia vecinal",
            "plainDescription": "Establece normas para prevenir y resolver conflictos relacionados con la ocupación ilegal de inmuebles.",
            "whoIsAffected": [
                  "Propietarios de viviendas",
                  "Inquilinos"
            ],
            "realWorldExample": "Juan, un propietario, se siente aliviado al saber que ahora puede tomar medidas legales para evitar que su inquilino le ocupe ilegalmente su propiedad durante un viaje de varios meses.",
            "argumentsPro": [
                  "Prevención de conflictos entre vecinos",
                  "Protección de los derechos de los propietarios"
            ],
            "argumentsContra": [
                  "Posible restricción de libertades",
                  "Incertidumbre sobre el proceso legal"
            ]
      }
],
    votesSummary: {"si":171,"no":164,"abstencion":11,"noVota":4,"total":350},
    groupVotes: [{"groupName":"G.P. Popular (PP)","totalSeats":137,"si":137,"no":0,"abstencion":0,"noVota":0,"color":"#0ea5e9"},{"groupName":"G.P. Socialista (PSOE)","totalSeats":121,"si":34,"no":87,"abstencion":0,"noVota":0,"color":"#ef4444"},{"groupName":"G.P. VOX","totalSeats":33,"si":0,"no":33,"abstencion":0,"noVota":0,"color":"#22c55e"},{"groupName":"G.P. Plurinacional Sumar","totalSeats":27,"si":0,"no":27,"abstencion":0,"noVota":0,"color":"#ec4899"},{"groupName":"G.P. Republicano (ERC)","totalSeats":7,"si":0,"no":7,"abstencion":0,"noVota":0,"color":"#f59e0b"},{"groupName":"G.P. Junts per Catalunya","totalSeats":7,"si":0,"no":7,"abstencion":0,"noVota":0,"color":"#06b6d4"},{"groupName":"G.P. Euskal Herria Bildu","totalSeats":6,"si":0,"no":3,"abstencion":3,"noVota":0,"color":"#84cc16"},{"groupName":"G.P. Vasco (EAJ-PNV)","totalSeats":5,"si":0,"no":0,"abstencion":5,"noVota":0,"color":"#10b981"},{"groupName":"G.P. Mixto (Podemos/BNG/CC/UPN)","totalSeats":7,"si":0,"no":0,"abstencion":3,"noVota":4,"color":"#8b5cf6"}],
    bocgUrl: "https://www.congreso.es/datos-abiertos",
    expedienteNumber: "121/20260519",
  },
  {
    id: "congreso-2026-05-19-2",
    title: "Modificación de la Ley Electoral: Impacto en la Democracia",
    officialTitle: "Proposición de Ley del Grupo Parlamentario Socialista, Orgánica para la modificación de la Ley Orgánica 5/1985, de 19 de junio, del Régimen Electoral General.",
    chamber: "congreso",
    date: "2026-05-19",
    time: "18:00 h",
    type: "proposicion_ley",
    status: "aprobado",
    category: "Justicia",
    summary: "El Congreso debate la modificación de la Ley Electoral para mejorar la representación política. Esto supone un avance en la democracia, asegurando que cada voto cuente de manera más justa.",
    isOmnibus: false,
    threeKeys: {
      "what": "Se actualiza la Ley Electoral para garantizar un sistema más justo y representativo.",
      "pocket": "Los cambios buscan equilibrar el poder de los votos y facilitar el acceso a la representación política.",
      "clash": "Los partidos defienden la necesidad de reformas para una democracia más inclusiva, mientras que otros temen que esto pueda alterar el equilibrio político existente."
},
    beforeVsAfter: {
      "before": "Actualmente, el sistema electoral no garantiza una representación equitativa de todos los votos.",
      "after": "Con la nueva regulación, se espera que la representación en el Congreso refleje mejor la voluntad del electorado."
},
    measures: [
      {
            "id": "congreso-2026-05-19-2-m1",
            "title": "Equilibrio Electoral",
            "category": "Representación",
            "plainDescription": "Se implementan reformas para garantizar que cada voto tenga el mismo peso en la elección de representantes.",
            "whoIsAffected": [
                  "Votantes",
                  "Políticos y partidos"
            ],
            "realWorldExample": "Juan, un joven trabajador, y María, una jubilada, podrían ver mejor representadas sus opiniones en el Congreso. Esto significa que sus votos tendrían el mismo peso que los de otros ciudadanos, independientemente de su edad o situación laboral.",
            "argumentsPro": [
                  "Mejor representación de la diversidad de opiniones en el Congreso",
                  "Reducir la desigualdad en el poder de los votos"
            ],
            "argumentsContra": [
                  "Posible desestabilización del sistema político actual",
                  "Riesgo de cambios que podrían beneficiar a ciertos grupos a expensas de otros"
            ]
      }
],
    votesSummary: {"si":313,"no":33,"abstencion":1,"noVota":3,"total":350},
    groupVotes: [{"groupName":"G.P. Popular (PP)","totalSeats":137,"si":137,"no":0,"abstencion":0,"noVota":0,"color":"#0ea5e9"},{"groupName":"G.P. Socialista (PSOE)","totalSeats":121,"si":121,"no":0,"abstencion":0,"noVota":0,"color":"#ef4444"},{"groupName":"G.P. VOX","totalSeats":33,"si":33,"no":0,"abstencion":0,"noVota":0,"color":"#22c55e"},{"groupName":"G.P. Plurinacional Sumar","totalSeats":27,"si":22,"no":5,"abstencion":0,"noVota":0,"color":"#ec4899"},{"groupName":"G.P. Republicano (ERC)","totalSeats":7,"si":0,"no":7,"abstencion":0,"noVota":0,"color":"#f59e0b"},{"groupName":"G.P. Junts per Catalunya","totalSeats":7,"si":0,"no":7,"abstencion":0,"noVota":0,"color":"#06b6d4"},{"groupName":"G.P. Euskal Herria Bildu","totalSeats":6,"si":0,"no":6,"abstencion":0,"noVota":0,"color":"#84cc16"},{"groupName":"G.P. Vasco (EAJ-PNV)","totalSeats":5,"si":0,"no":5,"abstencion":0,"noVota":0,"color":"#10b981"},{"groupName":"G.P. Mixto (Podemos/BNG/CC/UPN)","totalSeats":7,"si":0,"no":3,"abstencion":1,"noVota":3,"color":"#8b5cf6"}],
    bocgUrl: "https://www.congreso.es/datos-abiertos",
    expedienteNumber: "121/20260519",
  },
  {
    id: "congreso-2026-05-14-1",
    title: "Ley para reducir el desperdicio alimentario",
    officialTitle: "Proyecto de Ley de Prevención de las Pérdidas y el Desperdicio Alimentario en la cadena de distribución, restauración y comercio minorista.",
    chamber: "congreso",
    date: "2026-05-14",
    time: "18:00 h",
    type: "proyecto_ley",
    status: "aprobado",
    category: "Agricultura",
    summary: "La ley busca prevenir el desperdicio de alimentos en la cadena de distribución, restauración y comercio minorista, con el objetivo de mejorar la sostenibilidad y ahorrar recursos.",
    isOmnibus: false,
    threeKeys: {
      "what": "Establece normas para prevenir el desperdicio de alimentos en la distribución, restauración y comercio minorista.",
      "pocket": "Prevé reducir hasta un 50% el desperdicio alimentario, ahorrando hasta 1.000 millones de euros anuales.",
      "clash": "Partidarios ven la ley como necesaria para la sostenibilidad, mientras que críticos temen que pueda ser costosa y complicada de implementar."
},
    beforeVsAfter: {
      "before": "Actualmente, no hay regulaciones específicas para prevenir el desperdicio alimentario en la cadena de distribución.",
      "after": "Se implementarán medidas para reducir el desperdicio en supermercados, restaurantes y almacenes."
},
    measures: [
      {
            "id": "congreso-2026-05-14-1-m1",
            "title": "Etiquetado de fechas de consumo",
            "category": "Restauración",
            "plainDescription": "Requiere que los restaurantes indiquen claramente las fechas de consumo en los platos para evitar malentendidos.",
            "whoIsAffected": [
                  "Restaurantes",
                  "Consumidores"
            ],
            "realWorldExample": "Un restaurante marca claramente en el menú que un plato es apto para comer hasta el día 15, ahorrando 100 euros al mes en alimentos.",
            "argumentsPro": [
                  "Ayuda a los consumidores a tomar decisiones informadas",
                  "Prevé un uso más eficiente de los alimentos"
            ],
            "argumentsContra": [
                  "Puede generar confusión entre los clientes",
                  "Requiere formación adicional para el personal"
            ]
      }
],
    votesSummary: {"si":298,"no":35,"abstencion":17,"noVota":0,"total":350},
    groupVotes: [{"groupName":"G.P. Popular (PP)","totalSeats":137,"si":137,"no":0,"abstencion":0,"noVota":0,"color":"#0ea5e9"},{"groupName":"G.P. Socialista (PSOE)","totalSeats":121,"si":121,"no":0,"abstencion":0,"noVota":0,"color":"#ef4444"},{"groupName":"G.P. VOX","totalSeats":33,"si":33,"no":0,"abstencion":0,"noVota":0,"color":"#22c55e"},{"groupName":"G.P. Plurinacional Sumar","totalSeats":27,"si":7,"no":20,"abstencion":0,"noVota":0,"color":"#ec4899"},{"groupName":"G.P. Republicano (ERC)","totalSeats":7,"si":0,"no":7,"abstencion":0,"noVota":0,"color":"#f59e0b"},{"groupName":"G.P. Junts per Catalunya","totalSeats":7,"si":0,"no":7,"abstencion":0,"noVota":0,"color":"#06b6d4"},{"groupName":"G.P. Euskal Herria Bildu","totalSeats":6,"si":0,"no":1,"abstencion":5,"noVota":0,"color":"#84cc16"},{"groupName":"G.P. Vasco (EAJ-PNV)","totalSeats":5,"si":0,"no":0,"abstencion":5,"noVota":0,"color":"#10b981"},{"groupName":"G.P. Mixto (Podemos/BNG/CC/UPN)","totalSeats":7,"si":0,"no":0,"abstencion":7,"noVota":0,"color":"#8b5cf6"}],
    bocgUrl: "https://www.congreso.es/datos-abiertos",
    expedienteNumber: "121/000061",
  },
  {
    id: "senado-2026-05-13-1",
    title: "Veto al amnistía: impacto en la economía catalana",
    officialTitle: "Propuesta de veto nº 1 presentada por el Grupo Parlamentario Popular a la Proposición de Ley Orgánica de amnistía para la normalización institucional, política y social en Cataluña.",
    chamber: "senado",
    date: "2026-05-13",
    time: "18:30 h",
    type: "enmienda_totalidad",
    status: "aprobado",
    category: "Economía",
    summary: "El Congreso debate si aprobar o vetar una ley que busca normalizar la situación de catalanes. Esta decisión afectará a la economía local y las expectativas de estabilidad para los autónomos y pequeños comerciantes.",
    isOmnibus: false,
    threeKeys: {
      "what": "El PP propone vetar una ley que busca normalizar la situación de catalanes.",
      "pocket": "Los autónomos y pequeños comerciantes podrían verse afectados por cambios en la economía local.",
      "clash": "El PP defiende la estabilidad económica, mientras los partidarios de la amnistía ven en la ley una oportunidad para la normalización social."
},
    beforeVsAfter: {
      "before": "Antes, los negocios locales operaban con incertidumbre sobre su situación legal.",
      "after": "Con el veto, la economía catalana podría experimentar cambios en la estabilidad y las expectativas de inversión."
},
    measures: [
      {
            "id": "senado-2026-05-13-1-m1",
            "title": "Veto a la Proposición de Ley Orgánica de amnistía",
            "category": "Economía",
            "plainDescription": "El Grupo Parlamentario Popular propone vetar una ley que busca normalizar la situación de catalanes, afectando a la economía local.",
            "whoIsAffected": [
                  "Autónomos",
                  "Pequeños comerciantes"
            ],
            "realWorldExample": "Juan, un pequeño comerciante de Barcelona, podría verse afectado por cambios en la economía local si la ley se aprueba. El veto podría mantener la estabilidad en su negocio, pero también podría generar incertidumbre sobre su situación legal.",
            "argumentsPro": [
                  "Estabilidad económica",
                  "Prevención de riesgos legales"
            ],
            "argumentsContra": [
                  "Normalización social",
                  "Justicia para los ciudadanos"
            ]
      }
],
    votesSummary: {"si":149,"no":113,"abstencion":4,"noVota":0,"total":266},
    groupVotes: [{"groupName":"G.P. Popular en el Senado (PP)","totalSeats":144,"si":144,"no":0,"abstencion":0,"noVota":0,"color":"#0ea5e9"},{"groupName":"G.P. Socialista (PSOE)","totalSeats":88,"si":5,"no":83,"abstencion":0,"noVota":0,"color":"#ef4444"},{"groupName":"G.P. Izquierdas por la Independencia (ERC/Bildu)","totalSeats":10,"si":0,"no":10,"abstencion":0,"noVota":0,"color":"#f59e0b"},{"groupName":"G.P. Plural en el Senado (Junts/CC/BNG)","totalSeats":6,"si":0,"no":6,"abstencion":0,"noVota":0,"color":"#06b6d4"},{"groupName":"G.P. Vasco en el Senado (EAJ-PNV)","totalSeats":5,"si":0,"no":5,"abstencion":0,"noVota":0,"color":"#10b981"},{"groupName":"G.P. VOX","totalSeats":3,"si":0,"no":3,"abstencion":0,"noVota":0,"color":"#22c55e"},{"groupName":"G.P. Mixto (UPN/Compromís/Más Madrid)","totalSeats":10,"si":0,"no":6,"abstencion":4,"noVota":0,"color":"#8b5cf6"}],
    bocgUrl: "https://www.senado.es/datos-abiertos",
    expedienteNumber: "621/000012",
  },
  {
    id: "congreso-2026-04-30-1",
    title: "Salud bucodental y visual incluidas en el SNS",
    officialTitle: "Proposición de Ley para la incorporación universal de la salud bucodental y la salud visual preventiva en la cartera común del Sistema Nacional de Salud.",
    chamber: "congreso",
    date: "2026-04-30",
    time: "17:15 h",
    type: "proposicion_ley",
    status: "aprobado",
    category: "Sanidad",
    summary: "Se propone incluir la atención bucodental y visual en el Sistema Nacional de Salud, mejorando la prevención y el acceso a estos servicios para todos los ciudadanos.",
    isOmnibus: false,
    threeKeys: {
      "what": "La iniciativa busca integrar la salud bucodental y visual en el Sistema Nacional de Salud.",
      "pocket": "Los costes se financiarán a través de la actualización del presupuesto sanitario, sin incremento de impuestos.",
      "clash": "Los defensores argumentan que es necesario para la prevención, mientras que los opositores temen un aumento de la carga financiera."
},
    beforeVsAfter: {
      "before": "Actualmente, la salud bucodental y visual no están incluidas en el SNS.",
      "after": "A partir de la aprobación, estas áreas de salud se integrarán en el SNS, garantizando su atención preventiva."
},
    measures: [
      {
            "id": "congreso-2026-04-30-1-m1",
            "title": "Incorporación de la salud bucodental y visual en el SNS",
            "category": "Salud preventiva",
            "plainDescription": "Se establecerán programas de prevención y atención en salud bucodental y visual, cubiertos por el SNS.",
            "whoIsAffected": [
                  "Niños y adolescentes",
                  "Personas mayores"
            ],
            "realWorldExample": "Un niño de 6 años recibirá un chequeo dental anual cubierto por el SNS, evitando posibles problemas de salud en el futuro.",
            "argumentsPro": [
                  "Mejora la calidad de vida y previene enfermedades crónicas",
                  "Reducción de costos a largo plazo al prevenir enfermedades"
            ],
            "argumentsContra": [
                  "Posible aumento de la carga financiera del SNS",
                  "Necesidad de ajustar presupuestos existentes"
            ]
      }
],
    votesSummary: {"si":312,"no":33,"abstencion":5,"noVota":0,"total":350},
    groupVotes: [{"groupName":"G.P. Popular (PP)","totalSeats":137,"si":137,"no":0,"abstencion":0,"noVota":0,"color":"#0ea5e9"},{"groupName":"G.P. Socialista (PSOE)","totalSeats":121,"si":121,"no":0,"abstencion":0,"noVota":0,"color":"#ef4444"},{"groupName":"G.P. VOX","totalSeats":33,"si":33,"no":0,"abstencion":0,"noVota":0,"color":"#22c55e"},{"groupName":"G.P. Plurinacional Sumar","totalSeats":27,"si":21,"no":6,"abstencion":0,"noVota":0,"color":"#ec4899"},{"groupName":"G.P. Republicano (ERC)","totalSeats":7,"si":0,"no":7,"abstencion":0,"noVota":0,"color":"#f59e0b"},{"groupName":"G.P. Junts per Catalunya","totalSeats":7,"si":0,"no":7,"abstencion":0,"noVota":0,"color":"#06b6d4"},{"groupName":"G.P. Euskal Herria Bildu","totalSeats":6,"si":0,"no":6,"abstencion":0,"noVota":0,"color":"#84cc16"},{"groupName":"G.P. Vasco (EAJ-PNV)","totalSeats":5,"si":0,"no":5,"abstencion":0,"noVota":0,"color":"#10b981"},{"groupName":"G.P. Mixto (Podemos/BNG/CC/UPN)","totalSeats":7,"si":0,"no":2,"abstencion":5,"noVota":0,"color":"#8b5cf6"}],
    bocgUrl: "https://www.congreso.es/datos-abiertos",
    expedienteNumber: "122/000055",
  },
  {
    id: "congreso-2026-04-28-1",
    title: "Consorcio público: inversión conjunta para el bienestar",
    officialTitle: "Proposición de Ley del Grupo Parlamentario Republicano, para la constitución de un consorcio de inversiones entre la Administración General del Estado y la Generalitat de Cataluña.",
    chamber: "congreso",
    date: "2026-04-28",
    time: "18:00 h",
    type: "proposicion_ley",
    status: "rechazado",
    category: "Economía",
    summary: "El Congreso votará sobre la creación de un consorcio público que busca apoyar a los autónomos y pequeños empresarios, mejorando su acceso a la financiación y promoviendo la economía local.",
    isOmnibus: false,
    threeKeys: {
      "what": "Se crea un consorcio entre el Estado y la Generalitat para invertir en proyectos económicos.",
      "pocket": "Los autónomos y pequeños empresarios podrían beneficiarse de financiación más accesible, reduciendo costes y alivio en el bolsillo.",
      "clash": "Los defensores ven en este consorcio una oportunidad para impulsar la economía, mientras que los críticos temen que pueda favorecer a grandes empresas."
},
    beforeVsAfter: {
      "before": "Antes, los autónomos y pequeños empresarios tenían dificultades para acceder a financiación asequible.",
      "after": "Con la nueva regulación, podrían obtener préstamos más fáciles y atractivos, impulsando su actividad."
},
    measures: [
      {
            "id": "congreso-2026-04-28-1-m1",
            "title": "Financiación accesible para autónomos y pequeños empresarios",
            "category": "Emprendimiento",
            "plainDescription": "La medida busca facilitar el acceso a la financiación para autónomos y pequeños empresarios, mejorando sus condiciones de crédito y reduciendo costes.",
            "whoIsAffected": [
                  "Autónomos",
                  "Pequeños empresarios"
            ],
            "realWorldExample": "Juan, un pequeño empresario de hostelería, podría obtener un préstamo de 100.000 euros a un interés del 2%, aportando estabilidad a su negocio y permitiéndole invertir en mejoras y expansión. Este préstamo, que antes era difícil de conseguir, ahora se ofrece con condiciones más favorables, aliviando su carga financiera.",
            "argumentsPro": [
                  "Acceso a la financiación esencial para el crecimiento de pequeñas empresas",
                  "Reducción de costes a través de intereses más bajos"
            ],
            "argumentsContra": [
                  "Posible desigualdad en el trato a grandes empresas",
                  "Necesidad de supervisión para evitar malversación de fondos"
            ]
      }
],
    votesSummary: {"si":168,"no":181,"abstencion":0,"noVota":1,"total":350},
    groupVotes: [{"groupName":"G.P. Popular (PP)","totalSeats":137,"si":137,"no":0,"abstencion":0,"noVota":0,"color":"#0ea5e9"},{"groupName":"G.P. Socialista (PSOE)","totalSeats":121,"si":31,"no":90,"abstencion":0,"noVota":0,"color":"#ef4444"},{"groupName":"G.P. VOX","totalSeats":33,"si":0,"no":33,"abstencion":0,"noVota":0,"color":"#22c55e"},{"groupName":"G.P. Plurinacional Sumar","totalSeats":27,"si":0,"no":27,"abstencion":0,"noVota":0,"color":"#ec4899"},{"groupName":"G.P. Republicano (ERC)","totalSeats":7,"si":0,"no":7,"abstencion":0,"noVota":0,"color":"#f59e0b"},{"groupName":"G.P. Junts per Catalunya","totalSeats":7,"si":0,"no":7,"abstencion":0,"noVota":0,"color":"#06b6d4"},{"groupName":"G.P. Euskal Herria Bildu","totalSeats":6,"si":0,"no":6,"abstencion":0,"noVota":0,"color":"#84cc16"},{"groupName":"G.P. Vasco (EAJ-PNV)","totalSeats":5,"si":0,"no":5,"abstencion":0,"noVota":0,"color":"#10b981"},{"groupName":"G.P. Mixto (Podemos/BNG/CC/UPN)","totalSeats":7,"si":0,"no":6,"abstencion":0,"noVota":1,"color":"#8b5cf6"}],
    bocgUrl: "https://www.congreso.es/datos-abiertos",
    expedienteNumber: "121/20260428",
  },
  {
    id: "congreso-2026-04-28-2",
    title: "VOX propone proteger a menores desamparados",
    officialTitle: "Proposición de Ley del Grupo Parlamentario VOX, de modificación del Código Civil, para la protección de los menores tutelados en situación de desamparo.",
    chamber: "congreso",
    date: "2026-04-28",
    time: "18:00 h",
    type: "proposicion_ley",
    status: "rechazado",
    category: "Justicia",
    summary: "El Congreso debatirá sobre la protección de menores desamparados, buscando mejorar su bienestar y seguridad. Esta propuesta busca equilibrar las necesidades de los niños con las preocupaciones de los ciudadanos sobre el coste y la eficacia de las medidas.",
    isOmnibus: false,
    threeKeys: {
      "what": "VOX plantea nuevas normas para cuidar a menores sin familia",
      "pocket": "No afecta directamente al bolsillo, pero mejora la seguridad de los más vulnerables",
      "clash": "Defensores ven una medida necesaria, mientras que opositores temen que sea un exceso"
},
    beforeVsAfter: {
      "before": "Actualmente, los menores sin familia tutelada carecen de protección especial",
      "after": "La nueva ley garantizará un cuidado más riguroso y personalizado"
},
    measures: [
      {
            "id": "congreso-2026-04-28-2-m1",
            "title": "Nuevas normas para tutelar a menores desamparados",
            "category": "Protección de menores",
            "plainDescription": "La ley establecerá un sistema más riguroso de tutela para menores sin familia, asegurando su bienestar y protección.",
            "whoIsAffected": [
                  "Menores sin familia tutelados",
                  "Familias que puedan adoptar o acoger a menores"
            ],
            "realWorldExample": "Juan, un niño de 10 años, quedó sin familiares de cuidado. Con la nueva ley, un equipo de profesionales lo atenderá personalmente, garantizando su estabilidad y bienestar. Sus padres adoptivos podrán acceder a formación especializada para mejorar su capacidad de cuidado.",
            "argumentsPro": [
                  "Mejora la protección de los menores",
                  "Asegura un cuidado más personalizado"
            ],
            "argumentsContra": [
                  "Puede ser costoso para el Estado",
                  "Se teme que sea un exceso de regulación"
            ]
      }
],
    votesSummary: {"si":33,"no":178,"abstencion":138,"noVota":1,"total":350},
    groupVotes: [{"groupName":"G.P. Popular (PP)","totalSeats":137,"si":33,"no":104,"abstencion":0,"noVota":0,"color":"#0ea5e9"},{"groupName":"G.P. Socialista (PSOE)","totalSeats":121,"si":0,"no":74,"abstencion":47,"noVota":0,"color":"#ef4444"},{"groupName":"G.P. VOX","totalSeats":33,"si":0,"no":0,"abstencion":33,"noVota":0,"color":"#22c55e"},{"groupName":"G.P. Plurinacional Sumar","totalSeats":27,"si":0,"no":0,"abstencion":27,"noVota":0,"color":"#ec4899"},{"groupName":"G.P. Republicano (ERC)","totalSeats":7,"si":0,"no":0,"abstencion":7,"noVota":0,"color":"#f59e0b"},{"groupName":"G.P. Junts per Catalunya","totalSeats":7,"si":0,"no":0,"abstencion":7,"noVota":0,"color":"#06b6d4"},{"groupName":"G.P. Euskal Herria Bildu","totalSeats":6,"si":0,"no":0,"abstencion":6,"noVota":0,"color":"#84cc16"},{"groupName":"G.P. Vasco (EAJ-PNV)","totalSeats":5,"si":0,"no":0,"abstencion":5,"noVota":0,"color":"#10b981"},{"groupName":"G.P. Mixto (Podemos/BNG/CC/UPN)","totalSeats":7,"si":0,"no":0,"abstencion":6,"noVota":1,"color":"#8b5cf6"}],
    bocgUrl: "https://www.congreso.es/datos-abiertos",
    expedienteNumber: "121/20260428",
  },
  {
    id: "congreso-2026-04-28-3",
    title: "Nueva Ley para Alquileres: Protección y Equilibrio",
    officialTitle: "Real Decreto-ley 8/2026, de 20 de marzo, de medidas en el alquiler en respuesta a las consecuencias económicas y sociales de la Guerra de Irán.",
    chamber: "congreso",
    date: "2026-04-28",
    time: "18:00 h",
    type: "real_decreto_ley",
    status: "rechazado",
    category: "Vivienda",
    summary: "El Congreso aprueba medidas para limitar los alquileres, buscando aliviar la presión económica sobre los inquilinos y proteger sus ingresos. Esto supone un cambio positivo para las familias con bajos ingresos, que podrán mantenerse en sus hogares sin verse obligadas a mudarse.",
    isOmnibus: true,
    threeKeys: {
      "what": "Establece límites a los alquileres para aliviar la presión económica.",
      "pocket": "Ayuda a familias con bajos ingresos al limitar el aumento del alquiler.",
      "clash": "Defensores de la medida argumentan que es necesario para proteger a los inquilinos, mientras que los propietarios temen que pueda afectar su capacidad para invertir."
},
    beforeVsAfter: {
      "before": "Antes, los inquilinos veían aumentos de alquiler frecuentes y significativos.",
      "after": "Ahora, los alquileres no podrán aumentar más del 5% anual, protegiendo a los inquilinos."
},
    measures: [
      {
            "id": "congreso-2026-04-28-3-m1",
            "title": "Límites a los Aumentos de Alquiler",
            "category": "Alquileres",
            "plainDescription": "Establece un tope del 5% anual en los aumentos de alquiler para proteger a los inquilinos.",
            "whoIsAffected": [
                  "Familias con bajos ingresos",
                  "Estudiantes y jóvenes trabajadores"
            ],
            "realWorldExample": "María, una estudiante de 22 años, ve cómo su alquiler de 600 euros no aumentará más del 5% anual, lo que le permite seguir viviendo en su piso sin preocuparse por un aumento excesivo.",
            "argumentsPro": [
                  "Ayuda a mantener a los inquilinos en sus hogares",
                  "Prevención de la desigualdad social"
            ],
            "argumentsContra": [
                  "Puede disuadir a los propietarios de invertir en viviendas",
                  "Posible escasez de ofertas de alquiler"
            ]
      }
],
    votesSummary: {"si":166,"no":177,"abstencion":5,"noVota":2,"total":350},
    groupVotes: [{"groupName":"G.P. Popular (PP)","totalSeats":137,"si":137,"no":0,"abstencion":0,"noVota":0,"color":"#0ea5e9"},{"groupName":"G.P. Socialista (PSOE)","totalSeats":121,"si":29,"no":92,"abstencion":0,"noVota":0,"color":"#ef4444"},{"groupName":"G.P. VOX","totalSeats":33,"si":0,"no":33,"abstencion":0,"noVota":0,"color":"#22c55e"},{"groupName":"G.P. Plurinacional Sumar","totalSeats":27,"si":0,"no":27,"abstencion":0,"noVota":0,"color":"#ec4899"},{"groupName":"G.P. Republicano (ERC)","totalSeats":7,"si":0,"no":7,"abstencion":0,"noVota":0,"color":"#f59e0b"},{"groupName":"G.P. Junts per Catalunya","totalSeats":7,"si":0,"no":7,"abstencion":0,"noVota":0,"color":"#06b6d4"},{"groupName":"G.P. Euskal Herria Bildu","totalSeats":6,"si":0,"no":6,"abstencion":0,"noVota":0,"color":"#84cc16"},{"groupName":"G.P. Vasco (EAJ-PNV)","totalSeats":5,"si":0,"no":5,"abstencion":0,"noVota":0,"color":"#10b981"},{"groupName":"G.P. Mixto (Podemos/BNG/CC/UPN)","totalSeats":7,"si":0,"no":0,"abstencion":5,"noVota":2,"color":"#8b5cf6"}],
    bocgUrl: "https://www.congreso.es/datos-abiertos",
    expedienteNumber: "121/20260428",
  },
  {
    id: "europarl-2026-04-23-1",
    title: "Rehabilitación energética: un futuro más sostenible para todos",
    officialTitle: "Directiva sobre la Eficiencia Energética de los Edificios (revisión): objetivos obligatorios de descarbonización y rehabilitación de viviendas para 2030 y 2035.",
    chamber: "europarl",
    date: "2026-04-23",
    time: "13:00 h (Bruselas)",
    type: "proyecto_ley",
    status: "aprobado",
    category: "Vivienda",
    summary: "El Congreso aprueba directivas para la eficiencia energética de los edificios, con objetivos de descarbonización y rehabilitación. Esto beneficiará a los hogares, mejorando su aislamiento y reduciendo costes energéticos.",
    isOmnibus: false,
    threeKeys: {
      "what": "Objetivos de descarbonización y rehabilitación para 2030 y 2035.",
      "pocket": "Ayudas económicas para la rehabilitación, reduciendo costes de luz y gas.",
      "clash": "Inquilinos preocupados por el coste, propietarios que ven oportunidades de ahorro y valorización."
},
    beforeVsAfter: {
      "before": "Viviendas con altos gastos energéticos y bajos niveles de confort.",
      "after": "Edificios más eficientes, reducción de facturas y mejor calidad de vida."
},
    measures: [
      {
            "id": "europarl-2026-04-23-1-m1",
            "title": "Ayudas para la rehabilitación energética",
            "category": "Economía doméstica",
            "plainDescription": "Se establecen ayudas económicas para la rehabilitación energética de viviendas, facilitando a los propietarios y alquileres el aislamiento y la mejora de la eficiencia.",
            "whoIsAffected": [
                  "Propietarios de viviendas",
                  "Inquilinos"
            ],
            "realWorldExample": "Ana, una propietaria de una casa antigua, recibió una ayuda de 10,000 euros para aislamiento y mejora de su vivienda, lo que reducirá sus facturas de luz y gas en un 30%. Juan, inquilino de un edificio antiguo, beneficiará de estas ayudas, mejorando la calidad de su vivienda y reduciendo sus gastos mensuales.",
            "argumentsPro": [
                  "Reducción de costes energéticos",
                  "Mejora de la calidad de vida"
            ],
            "argumentsContra": [
                  "Coste inicial de la rehabilitación",
                  "Incertidumbre sobre el retorno de la inversión"
            ]
      }
],
    votesSummary: {"si":44,"no":12,"abstencion":5,"noVota":0,"total":61},
    groupVotes: [{"groupName":"G.P. Popular Europeo (PP)","totalSeats":22,"si":22,"no":0,"abstencion":0,"noVota":0,"color":"#0ea5e9"},{"groupName":"G.P. Socialistas y Demócratas (PSOE)","totalSeats":20,"si":20,"no":0,"abstencion":0,"noVota":0,"color":"#ef4444"},{"groupName":"Patriotas por Europa (VOX)","totalSeats":6,"si":2,"no":4,"abstencion":0,"noVota":0,"color":"#22c55e"},{"groupName":"La Izquierda Europea (Podemos / Sumar)","totalSeats":5,"si":0,"no":5,"abstencion":0,"noVota":0,"color":"#ec4899"},{"groupName":"Los Verdes / Alianza Libre Europea (ERC / BNG)","totalSeats":3,"si":0,"no":3,"abstencion":0,"noVota":0,"color":"#84cc16"},{"groupName":"Renew Europe (EAJ-PNV / CC)","totalSeats":1,"si":0,"no":0,"abstencion":1,"noVota":0,"color":"#f59e0b"},{"groupName":"No Inscritos / Otros (SALF / Junts)","totalSeats":4,"si":0,"no":0,"abstencion":4,"noVota":0,"color":"#8b5cf6"}],
    bocgUrl: "https://data.europarl.europa.eu/api/v1/plenary-votes",
    expedienteNumber: "2021/0426(COD)",
  },
  {
    id: "congreso-2026-04-22-1",
    title: "Medidas urgentes contra la inseguridad con cuchillos",
    officialTitle: "Proposición no de Ley del Grupo Parlamentario Popular en el Congreso, para la adopción de medidas urgentes en la lucha contra la inseguridad ciudadana causada por el incremento de uso de armas blancas.",
    chamber: "congreso",
    date: "2026-04-22",
    time: "18:00 h",
    type: "mocion",
    status: "aprobado",
    category: "Justicia",
    summary: "El Congreso votará medidas para controlar el comercio de cuchillos, buscando proteger a la ciudadanía. Esto supone un cambio en la forma de vida de los comerciantes y la sociedad en general, buscando un equilibrio entre la seguridad y el derecho al comercio.",
    isOmnibus: false,
    threeKeys: {
      "what": "Implementar controles más estrictos en tiendas de cuchillos.",
      "pocket": "Los comerciantes pagarán un impuesto adicional de 50 euros por venta, que se destinará a formación en prevención de violencia.",
      "clash": "Los comerciantes temen que los controles puedan afectar a su negocio, mientras que los defensores de la medida argumentan que es necesario para proteger a la sociedad."
},
    beforeVsAfter: {
      "before": "Antes, los ciudadanos vivían con el temor constante de encontrarse con cuchillos en la calle.",
      "after": "Con la nueva regulación, se espera una disminución en los casos de agresiones con cuchillos y una sensación de mayor seguridad en las calles."
},
    measures: [
      {
            "id": "congreso-2026-04-22-1-m1",
            "title": "Controles más estrictos en tiendas de cuchillos",
            "category": "Seguridad",
            "plainDescription": "Se establecerán controles más rigurosos en las tiendas de cuchillos para prevenir el uso de armas blancas en delitos.",
            "whoIsAffected": [
                  "Comerciantes de cuchillos",
                  "Consumidores de cuchillos"
            ],
            "realWorldExample": "Juan, un comerciante de cuchillos, deberá registrar todas las ventas de cuchillos superiores a 50 euros. Esto significa que cada vez que vende un cuchillo a un cliente, debe verificar su identidad y realizar un registro en el sistema. Este cambio podría afectar su negocio, ya que el proceso de registro puede ser engorroso y disuasivo para algunos clientes.",
            "argumentsPro": [
                  "Se prevendrá el acceso a armas blancas a menores y personas con antecedentes penales.",
                  "Se recaudará fondos para formación en prevención de violencia, beneficiando a toda la sociedad."
            ],
            "argumentsContra": [
                  "Los controles podrían disuadir a clientes potenciales, afectando negativamente el negocio.",
                  "Se podría generar una sensación de intrusión en la privacidad de los clientes."
            ]
      }
],
    votesSummary: {"si":169,"no":161,"abstencion":12,"noVota":8,"total":350},
    groupVotes: [{"groupName":"G.P. Popular (PP)","totalSeats":137,"si":137,"no":0,"abstencion":0,"noVota":0,"color":"#0ea5e9"},{"groupName":"G.P. Socialista (PSOE)","totalSeats":121,"si":32,"no":89,"abstencion":0,"noVota":0,"color":"#ef4444"},{"groupName":"G.P. VOX","totalSeats":33,"si":0,"no":33,"abstencion":0,"noVota":0,"color":"#22c55e"},{"groupName":"G.P. Plurinacional Sumar","totalSeats":27,"si":0,"no":27,"abstencion":0,"noVota":0,"color":"#ec4899"},{"groupName":"G.P. Republicano (ERC)","totalSeats":7,"si":0,"no":7,"abstencion":0,"noVota":0,"color":"#f59e0b"},{"groupName":"G.P. Junts per Catalunya","totalSeats":7,"si":0,"no":5,"abstencion":2,"noVota":0,"color":"#06b6d4"},{"groupName":"G.P. Euskal Herria Bildu","totalSeats":6,"si":0,"no":0,"abstencion":6,"noVota":0,"color":"#84cc16"},{"groupName":"G.P. Vasco (EAJ-PNV)","totalSeats":5,"si":0,"no":0,"abstencion":4,"noVota":1,"color":"#10b981"},{"groupName":"G.P. Mixto (Podemos/BNG/CC/UPN)","totalSeats":7,"si":0,"no":0,"abstencion":0,"noVota":7,"color":"#8b5cf6"}],
    bocgUrl: "https://www.congreso.es/datos-abiertos",
    expedienteNumber: "121/20260422",
  },
  {
    id: "congreso-2026-04-22-2",
    title: "Erradicar el matrimonio forzado: un paso hacia la libertad",
    officialTitle: "Proposición no de Ley del Grupo Parlamentario Socialista, para impulsar la erradicación del matrimonio forzado a nivel global.",
    chamber: "congreso",
    date: "2026-04-22",
    time: "18:00 h",
    type: "mocion",
    status: "aprobado",
    category: "Justicia",
    summary: "El Congreso votará sobre una ley que busca erradicar el matrimonio forzado, protegiendo a las personas y promoviendo la igualdad.",
    isOmnibus: false,
    threeKeys: {
      "what": "Prohíbe el matrimonio forzado para proteger a las víctimas.",
      "pocket": "Ayuda a familias a evitar gastos innecesarios y a liberar recursos.",
      "clash": "Defensores ven la medida como un avance en derechos, mientras opositores temen que atente contra la tradición."
},
    beforeVsAfter: {
      "before": "Antes, personas vulnerables podían ser forzadas a contraer matrimonio sin consentimiento.",
      "after": "Ahora, se garantiza el derecho a la libertad personal y el consentimiento en los matrimonios."
},
    measures: [
      {
            "id": "congreso-2026-04-22-2-m1",
            "title": "Prohibición del matrimonio forzado",
            "category": "Derechos humanos",
            "plainDescription": "Establece penas para quienes intenten o realicen matrimonios forzados y ofrece apoyo a las víctimas.",
            "whoIsAffected": [
                  "Víctimas de matrimonio forzado",
                  "Familias de víctimas"
            ],
            "realWorldExample": "María, una joven de 18 años, fue forzada a contraer matrimonio con un hombre mayor. Con la nueva ley, pudo escapar y buscar ayuda, liberando recursos económicos y emocionales de su familia.",
            "argumentsPro": [
                  "Protege a las víctimas de abuso",
                  "Fomenta la igualdad de género"
            ],
            "argumentsContra": [
                  "Puede atentar contra la libertad de elección",
                  "Puede afectar tradiciones culturales"
            ]
      }
],
    votesSummary: {"si":176,"no":33,"abstencion":136,"noVota":5,"total":350},
    groupVotes: [{"groupName":"G.P. Popular (PP)","totalSeats":137,"si":137,"no":0,"abstencion":0,"noVota":0,"color":"#0ea5e9"},{"groupName":"G.P. Socialista (PSOE)","totalSeats":121,"si":39,"no":33,"abstencion":49,"noVota":0,"color":"#ef4444"},{"groupName":"G.P. VOX","totalSeats":33,"si":0,"no":0,"abstencion":33,"noVota":0,"color":"#22c55e"},{"groupName":"G.P. Plurinacional Sumar","totalSeats":27,"si":0,"no":0,"abstencion":27,"noVota":0,"color":"#ec4899"},{"groupName":"G.P. Republicano (ERC)","totalSeats":7,"si":0,"no":0,"abstencion":7,"noVota":0,"color":"#f59e0b"},{"groupName":"G.P. Junts per Catalunya","totalSeats":7,"si":0,"no":0,"abstencion":7,"noVota":0,"color":"#06b6d4"},{"groupName":"G.P. Euskal Herria Bildu","totalSeats":6,"si":0,"no":0,"abstencion":6,"noVota":0,"color":"#84cc16"},{"groupName":"G.P. Vasco (EAJ-PNV)","totalSeats":5,"si":0,"no":0,"abstencion":5,"noVota":0,"color":"#10b981"},{"groupName":"G.P. Mixto (Podemos/BNG/CC/UPN)","totalSeats":7,"si":0,"no":0,"abstencion":2,"noVota":5,"color":"#8b5cf6"}],
    bocgUrl: "https://www.congreso.es/datos-abiertos",
    expedienteNumber: "121/20260422",
  },
  {
    id: "congreso-2026-04-22-3",
    title: "Gobierno propone retirar tropas y frenar rearme",
    officialTitle: "Moción consecuencia de interpelación urgente del Grupo Parlamentario Mixto (Sra. Belarra Urteaga), relativa a los planes del Gobierno para abandonar la guerra y el rearme criminal.",
    chamber: "congreso",
    date: "2026-04-22",
    time: "18:00 h",
    type: "mocion",
    status: "rechazado",
    category: "Justicia",
    summary: "El Congreso debate sobre la retirada de tropas y el freno del rearme, lo que podría beneficiar el bienestar económico y social de los ciudadanos al liberar recursos para otros servicios.",
    isOmnibus: false,
    threeKeys: {
      "what": "El Gobierno plantea un plan para finalizar la participación en la guerra y detener el rearme.",
      "pocket": "Esta medida podría reducir gastos militares y liberar recursos para otros servicios públicos.",
      "clash": "Defensores de la seguridad nacional temen por la protección del país, mientras que críticos ven en esto un paso hacia la paz y la reducción de conflictos."
},
    beforeVsAfter: {
      "before": "La situación actual implica un alto coste económico y emocional para las familias debido a la participación en la guerra y el rearme.",
      "after": "Con la nueva regulación, se espera una disminución en los costos y una mayor estabilidad para los ciudadanos."
},
    measures: [
      {
            "id": "congreso-2026-04-22-3-m1",
            "title": "Plan de retiro de tropas y freno del rearme",
            "category": "Defensa",
            "plainDescription": "El plan busca finalizar la participación en la guerra y detener el rearme, destinando los recursos a otros sectores.",
            "whoIsAffected": [
                  "Familias con miembros en el ejército",
                  "Empresas de la industria militar"
            ],
            "realWorldExample": "María, una madre de tres hijos, ha visto aumentar los impuestos para financiar el rearme. Con la nueva medida, se espera que estos costos se reduzcan, permitiendo a María invertir más en la educación de sus hijos.",
            "argumentsPro": [
                  "Reducir el gasto militar excesivo",
                  "Dirigir recursos a servicios sociales"
            ],
            "argumentsContra": [
                  "Peligro de vulnerar la seguridad nacional",
                  "Impacto económico en empresas de defensa"
            ]
      }
],
    votesSummary: {"si":20,"no":300,"abstencion":25,"noVota":5,"total":350},
    groupVotes: [{"groupName":"G.P. Popular (PP)","totalSeats":137,"si":20,"no":117,"abstencion":0,"noVota":0,"color":"#0ea5e9"},{"groupName":"G.P. Socialista (PSOE)","totalSeats":121,"si":0,"no":121,"abstencion":0,"noVota":0,"color":"#ef4444"},{"groupName":"G.P. VOX","totalSeats":33,"si":0,"no":33,"abstencion":0,"noVota":0,"color":"#22c55e"},{"groupName":"G.P. Plurinacional Sumar","totalSeats":27,"si":0,"no":27,"abstencion":0,"noVota":0,"color":"#ec4899"},{"groupName":"G.P. Republicano (ERC)","totalSeats":7,"si":0,"no":2,"abstencion":5,"noVota":0,"color":"#f59e0b"},{"groupName":"G.P. Junts per Catalunya","totalSeats":7,"si":0,"no":0,"abstencion":7,"noVota":0,"color":"#06b6d4"},{"groupName":"G.P. Euskal Herria Bildu","totalSeats":6,"si":0,"no":0,"abstencion":6,"noVota":0,"color":"#84cc16"},{"groupName":"G.P. Vasco (EAJ-PNV)","totalSeats":5,"si":0,"no":0,"abstencion":5,"noVota":0,"color":"#10b981"},{"groupName":"G.P. Mixto (Podemos/BNG/CC/UPN)","totalSeats":7,"si":0,"no":0,"abstencion":2,"noVota":5,"color":"#8b5cf6"}],
    bocgUrl: "https://www.congreso.es/datos-abiertos",
    expedienteNumber: "121/20260422",
  },
  {
    id: "congreso-2026-04-22-4",
    title: "VOX pide prioridades claras para el Gobierno",
    officialTitle: "Moción consecuencia de interpelación urgente del Grupo Parlamentario VOX, sobre cuáles van a ser las prioridades del Gobierno en el desarrollo de las políticas públicas lo que queda de legislatura.",
    chamber: "congreso",
    date: "2026-04-22",
    time: "18:00 h",
    type: "mocion",
    status: "rechazado",
    category: "Política",
    summary: "El Grupo Parlamentario VOX solicita al Gobierno definir sus políticas prioritarias para el resto de la legislatura, buscando claridad y estabilidad para los ciudadanos.",
    isOmnibus: false,
    threeKeys: {
      "what": "Propone áreas clave para el Gobierno en la recta final de la legislatura.",
      "pocket": "Impacto incierto en el bolsillo de los ciudadanos, dependiendo de las decisiones del Ejecutivo.",
      "clash": "Postura del Gobierno vs. oposición sobre las políticas prioritarias."
},
    beforeVsAfter: {
      "before": "Actualmente, la incertidumbre política afecta a la planificación de las familias.",
      "after": "Las prioridades definidas ayudarán a orientar las expectativas y acciones de los ciudadanos."
},
    measures: [
      {
            "id": "congreso-2026-04-22-4-m1",
            "title": "Definición de políticas prioritarias",
            "category": "Gobierno",
            "plainDescription": "La moción busca que el Gobierno defina claramente sus políticas para el resto de la legislatura, asegurando transparencia y coherencia en la gestión.",
            "whoIsAffected": [
                  "Todos los ciudadanos"
            ],
            "realWorldExample": "Un autónomo podría sentirse más seguro sabiendo que el Gobierno prioriza la regulación de su actividad, mientras que una familia podría planificar mejor su futuro si se conoce claramente el enfoque en la educación.",
            "argumentsPro": [
                  "Transparencia y coherencia en la gestión gubernamental",
                  "Estabilidad para las decisiones de inversión y planificación personal"
            ],
            "argumentsContra": [
                  "Posible desviación de recursos hacia áreas menos urgentes",
                  "Riesgo de politización de las prioridades"
            ]
      }
],
    votesSummary: {"si":33,"no":310,"abstencion":0,"noVota":7,"total":350},
    groupVotes: [{"groupName":"G.P. Popular (PP)","totalSeats":137,"si":33,"no":104,"abstencion":0,"noVota":0,"color":"#0ea5e9"},{"groupName":"G.P. Socialista (PSOE)","totalSeats":121,"si":0,"no":121,"abstencion":0,"noVota":0,"color":"#ef4444"},{"groupName":"G.P. VOX","totalSeats":33,"si":0,"no":33,"abstencion":0,"noVota":0,"color":"#22c55e"},{"groupName":"G.P. Plurinacional Sumar","totalSeats":27,"si":0,"no":27,"abstencion":0,"noVota":0,"color":"#ec4899"},{"groupName":"G.P. Republicano (ERC)","totalSeats":7,"si":0,"no":7,"abstencion":0,"noVota":0,"color":"#f59e0b"},{"groupName":"G.P. Junts per Catalunya","totalSeats":7,"si":0,"no":7,"abstencion":0,"noVota":0,"color":"#06b6d4"},{"groupName":"G.P. Euskal Herria Bildu","totalSeats":6,"si":0,"no":6,"abstencion":0,"noVota":0,"color":"#84cc16"},{"groupName":"G.P. Vasco (EAJ-PNV)","totalSeats":5,"si":0,"no":5,"abstencion":0,"noVota":0,"color":"#10b981"},{"groupName":"G.P. Mixto (Podemos/BNG/CC/UPN)","totalSeats":7,"si":0,"no":0,"abstencion":0,"noVota":7,"color":"#8b5cf6"}],
    bocgUrl: "https://www.congreso.es/datos-abiertos",
    expedienteNumber: "121/20260422",
  },
  {
    id: "congreso-2026-04-22-5",
    title: "Urgente: Ley contra el infierno fiscal",
    officialTitle: "Moción consecuencia de interpelación urgente del Grupo Parlamentario Popular en el Congreso, sobre el infierno fiscal al que ha condenado el Gobierno a todos los españoles.",
    chamber: "congreso",
    date: "2026-04-22",
    time: "18:00 h",
    type: "mocion",
    status: "aprobado",
    category: "Vivienda",
    summary: "El Congreso debate una moción para aliviar el coste del alquiler y la hipoteca, mejorando la calidad de vida de miles de familias.",
    isOmnibus: false,
    threeKeys: {
      "what": "Propone medidas para aliviar el coste del alquiler y la hipoteca.",
      "pocket": "Ayuda a familias con bajos ingresos y autónomos a ahorrar en el pago de alquileres y hipotecas.",
      "clash": "Defensores de la medida argumentan que es necesaria para aliviar la crisis económica, mientras que críticos temen que podría aumentar el coste de la vivienda."
},
    beforeVsAfter: {
      "before": "Antes, muchos españoles luchaban contra el coste elevado del alquiler y la hipoteca.",
      "after": "Ahora, las nuevas regulaciones buscan hacer frente a estos desafíos cotidianos."
},
    measures: [
      {
            "id": "congreso-2026-04-22-5-m1",
            "title": "Subvenciones para alquileres y hipotecas",
            "category": "Ayudas económicas",
            "plainDescription": "Ofrece subvenciones para reducir el coste del alquiler y la hipoteca a familias con bajos ingresos y autónomos.",
            "whoIsAffected": [
                  "Familias con bajos ingresos",
                  "Autónomos"
            ],
            "realWorldExample": "Juan, un autónomo, podría ahorrar 200 euros al mes en su hipoteca gracias a la subvención. Ana, una madre soltera, vería disminuidos sus pagos de alquiler en 150 euros.",
            "argumentsPro": [
                  "Ayuda a mantener el techo sobre la cabeza de quienes luchan económicamente",
                  "Permite a autónomos invertir en su negocio sin preocuparse por el alquiler"
            ],
            "argumentsContra": [
                  "Podría aumentar el coste de la vivienda al incrementar la demanda",
                  "Puede crear dependencia de las ayudas"
            ]
      }
],
    votesSummary: {"si":177,"no":163,"abstencion":5,"noVota":5,"total":350},
    groupVotes: [{"groupName":"G.P. Popular (PP)","totalSeats":137,"si":137,"no":0,"abstencion":0,"noVota":0,"color":"#0ea5e9"},{"groupName":"G.P. Socialista (PSOE)","totalSeats":121,"si":40,"no":81,"abstencion":0,"noVota":0,"color":"#ef4444"},{"groupName":"G.P. VOX","totalSeats":33,"si":0,"no":33,"abstencion":0,"noVota":0,"color":"#22c55e"},{"groupName":"G.P. Plurinacional Sumar","totalSeats":27,"si":0,"no":27,"abstencion":0,"noVota":0,"color":"#ec4899"},{"groupName":"G.P. Republicano (ERC)","totalSeats":7,"si":0,"no":7,"abstencion":0,"noVota":0,"color":"#f59e0b"},{"groupName":"G.P. Junts per Catalunya","totalSeats":7,"si":0,"no":7,"abstencion":0,"noVota":0,"color":"#06b6d4"},{"groupName":"G.P. Euskal Herria Bildu","totalSeats":6,"si":0,"no":6,"abstencion":0,"noVota":0,"color":"#84cc16"},{"groupName":"G.P. Vasco (EAJ-PNV)","totalSeats":5,"si":0,"no":2,"abstencion":3,"noVota":0,"color":"#10b981"},{"groupName":"G.P. Mixto (Podemos/BNG/CC/UPN)","totalSeats":7,"si":0,"no":0,"abstencion":2,"noVota":5,"color":"#8b5cf6"}],
    bocgUrl: "https://www.congreso.es/datos-abiertos",
    expedienteNumber: "121/20260422",
  },
  {
    id: "congreso-2026-04-22-6",
    title: "2ª fase del Canal de Navarra: cuándo licitarán y adjudicarán obras",
    officialTitle: "Moción consecuencia de interpelación urgente del Grupo Parlamentario Mixto (Sr. Catalán Higueras), sobre cuándo se van a licitar y adjudicar las obras de construcción de la 2ª fase del Canal de Navarra.",
    chamber: "congreso",
    date: "2026-04-22",
    time: "18:00 h",
    type: "mocion",
    status: "aprobado",
    category: "Vivienda",
    summary: "El Congreso aprueba la licitación y adjudicación de las obras para la segunda fase del Canal de Navarra, mejorando la calidad de las viviendas y reduciendo costes de reforma. Esto supone un alivio para los inquilinos y propietarios, aunque ambas partes buscan garantías.",
    isOmnibus: false,
    threeKeys: {
      "what": "Se aprueba la licitación y adjudicación de obras para mejorar viviendas",
      "pocket": "Ayuda a reducir la carestía de la reforma y mejora la calidad de vida",
      "clash": "Inquilinos buscan alivio en alquileres más bajos, mientras propietarios temen bajos precios en ventas"
},
    beforeVsAfter: {
      "before": "Antes, los inquilinos y propietarios vivían con incertidumbre sobre cuándo se ejecutarían las obras",
      "after": "Ahora, se espera una mayor certeza y mejora en la calidad de las viviendas"
},
    measures: [
      {
            "id": "congreso-2026-04-22-6-m1",
            "title": "Licitación y adjudicación de obras",
            "category": "Infraestructuras",
            "plainDescription": "Se establece un cronograma para licitar y adjudicar las obras de la segunda fase del Canal de Navarra, mejorando la calidad de las viviendas y reduciendo costes de reforma.",
            "whoIsAffected": [
                  "Inquilinos",
                  "Propietarios"
            ],
            "realWorldExample": "Juan, un inquilino, y María, una propietaria, esperan que las obras mejoren la calidad de sus viviendas y reduzcan costes de reforma. Juan, que ha pagado 1.500 euros mensuales en alquiler, espera que las mejoras en el edificio reduzcan su desembolso. María, que ha invertido 200.000 euros en su propiedad, busca garantías de que las obras no afectarán negativamente su valor.",
            "argumentsPro": [
                  "Mejora en la calidad de vida y seguridad",
                  "Reducción de costes de reforma"
            ],
            "argumentsContra": [
                  "Inquietud sobre el impacto en el valor de la propiedad",
                  "Posible aumento de costes en el corto plazo"
            ]
      }
],
    votesSummary: {"si":170,"no":20,"abstencion":155,"noVota":5,"total":350},
    groupVotes: [{"groupName":"G.P. Popular (PP)","totalSeats":137,"si":137,"no":0,"abstencion":0,"noVota":0,"color":"#0ea5e9"},{"groupName":"G.P. Socialista (PSOE)","totalSeats":121,"si":33,"no":20,"abstencion":68,"noVota":0,"color":"#ef4444"},{"groupName":"G.P. VOX","totalSeats":33,"si":0,"no":0,"abstencion":33,"noVota":0,"color":"#22c55e"},{"groupName":"G.P. Plurinacional Sumar","totalSeats":27,"si":0,"no":0,"abstencion":27,"noVota":0,"color":"#ec4899"},{"groupName":"G.P. Republicano (ERC)","totalSeats":7,"si":0,"no":0,"abstencion":7,"noVota":0,"color":"#f59e0b"},{"groupName":"G.P. Junts per Catalunya","totalSeats":7,"si":0,"no":0,"abstencion":7,"noVota":0,"color":"#06b6d4"},{"groupName":"G.P. Euskal Herria Bildu","totalSeats":6,"si":0,"no":0,"abstencion":6,"noVota":0,"color":"#84cc16"},{"groupName":"G.P. Vasco (EAJ-PNV)","totalSeats":5,"si":0,"no":0,"abstencion":5,"noVota":0,"color":"#10b981"},{"groupName":"G.P. Mixto (Podemos/BNG/CC/UPN)","totalSeats":7,"si":0,"no":0,"abstencion":2,"noVota":5,"color":"#8b5cf6"}],
    bocgUrl: "https://www.congreso.es/datos-abiertos",
    expedienteNumber: "121/20260422",
  },
  {
    id: "congreso-2026-04-21-1",
    title: "Seguridad jurídica para vivienda y desarrollo urbano",
    officialTitle: "Proposición de Ley del Grupo Parlamentario Popular en el Congreso, de medidas administrativas y procesales para la seguridad jurídica de la ordenación territorial y urbanística, el impulso del desarrollo urbano y la vivienda.",
    chamber: "congreso",
    date: "2026-04-21",
    time: "18:00 h",
    type: "proposicion_ley",
    status: "aprobado",
    category: "Vivienda",
    summary: "El Congreso aprueba una ley que busca proteger a los consumidores de vivienda y promover el desarrollo urbano sostenible, mejorando la calidad de vida de los ciudadanos.",
    isOmnibus: false,
    threeKeys: {
      "what": "Establece regulaciones para mejorar la vivienda y el desarrollo urbano.",
      "pocket": "Ayuda a estabilizar precios y garantiza proyectos de vivienda más accesibles.",
      "clash": "Defensores ven en esta ley un paso hacia la seguridad jurídica, mientras que opositores temen que limiten la flexibilidad del mercado."
},
    beforeVsAfter: {
      "before": "Antes, los inquilinos y compradores vivían con incertidumbre en el mercado inmobiliario.",
      "after": "Ahora, las normas prometen mayor estabilidad y previsibilidad en la vivienda."
},
    measures: [
      {
            "id": "congreso-2026-04-21-1-m1",
            "title": "Garantía de proyectos de vivienda",
            "category": "Seguridad jurídica",
            "plainDescription": "Establece un marco legal que asegura la continuidad de los proyectos de vivienda y su finalización.",
            "whoIsAffected": [
                  "Inquilinos y compradores de viviendas",
                  "Desarrolladores inmobiliarios"
            ],
            "realWorldExample": "Juan, un inquilino, se siente más seguro sabiendo que su edificio de alquiler no será demolido y reconvertido en un complejo comercial, gracias a la nueva regulación que garantiza la continuidad de los proyectos de vivienda.",
            "argumentsPro": [
                  "Evita la especulación y la demolición de edificios habitables",
                  "Promueve la confianza en el mercado inmobiliario"
            ],
            "argumentsContra": [
                  "Puede limitar la flexibilidad para adaptar proyectos a nuevas necesidades",
                  "Puede aumentar los costos de construcción"
            ]
      }
],
    votesSummary: {"si":178,"no":163,"abstencion":6,"noVota":3,"total":350},
    groupVotes: [{"groupName":"G.P. Popular (PP)","totalSeats":137,"si":137,"no":0,"abstencion":0,"noVota":0,"color":"#0ea5e9"},{"groupName":"G.P. Socialista (PSOE)","totalSeats":121,"si":41,"no":80,"abstencion":0,"noVota":0,"color":"#ef4444"},{"groupName":"G.P. VOX","totalSeats":33,"si":0,"no":33,"abstencion":0,"noVota":0,"color":"#22c55e"},{"groupName":"G.P. Plurinacional Sumar","totalSeats":27,"si":0,"no":27,"abstencion":0,"noVota":0,"color":"#ec4899"},{"groupName":"G.P. Republicano (ERC)","totalSeats":7,"si":0,"no":7,"abstencion":0,"noVota":0,"color":"#f59e0b"},{"groupName":"G.P. Junts per Catalunya","totalSeats":7,"si":0,"no":7,"abstencion":0,"noVota":0,"color":"#06b6d4"},{"groupName":"G.P. Euskal Herria Bildu","totalSeats":6,"si":0,"no":6,"abstencion":0,"noVota":0,"color":"#84cc16"},{"groupName":"G.P. Vasco (EAJ-PNV)","totalSeats":5,"si":0,"no":3,"abstencion":2,"noVota":0,"color":"#10b981"},{"groupName":"G.P. Mixto (Podemos/BNG/CC/UPN)","totalSeats":7,"si":0,"no":0,"abstencion":4,"noVota":3,"color":"#8b5cf6"}],
    bocgUrl: "https://www.congreso.es/datos-abiertos",
    expedienteNumber: "121/20260421",
  },
  {
    id: "congreso-2026-04-21-2",
    title: "Ley sobre crioconservación: protege el futuro reproductivo",
    officialTitle: "Proposición de Ley del Grupo Parlamentario Socialista, de modificación de la regulación sobre la crioconservación de ovocitos.",
    chamber: "congreso",
    date: "2026-04-21",
    time: "18:00 h",
    type: "proposicion_ley",
    status: "aprobado",
    category: "Sanidad",
    summary: "El Congreso debate sobre la regulación de la crioconservación de óvulos, permitiendo a las mujeres congelar sus óvulos para futuras maternidades. Esto ofrece una opción vital para el futuro, aunque genera debate sobre la complejidad médica asociada.",
    isOmnibus: false,
    threeKeys: {
      "what": "Permite a las mujeres congelar sus óvulos para futuras maternidades.",
      "pocket": "No afecta directamente el bolsillo, pero ofrece una opción vital para el futuro.",
      "clash": "Defensores ven la ley como un avance en la autonomía reproductiva; opositores temen un aumento en la complejidad médica."
},
    beforeVsAfter: {
      "before": "Antes, las mujeres no tenían opciones para congelar sus óvulos.",
      "after": "Ahora, podrán preservar su fertilidad para el futuro, si lo desean."
},
    measures: [
      {
            "id": "congreso-2026-04-21-2-m1",
            "title": "Opciones de crioconservación",
            "category": "Reproductividad",
            "plainDescription": "Permite a las mujeres congelar sus óvulos para futuras maternidades, ofreciendo una opción vital para el futuro.",
            "whoIsAffected": [
                  "Mujeres de entre 18 y 35 años",
                  "Couples planning future families"
            ],
            "realWorldExample": "María, una mujer de 30 años, decide congelar sus óvulos para poder tener hijos en un futuro, cuando su carrera profesional esté más establecida. Esto le permite planificar su futuro sin preocupaciones sobre la fertilidad.",
            "argumentsPro": [
                  "Permite a las mujeres planificar su futuro sin preocupaciones sobre la fertilidad",
                  "Ofrece opciones para aquellas que no pueden tener hijos en la actualidad"
            ],
            "argumentsContra": [
                  "Puede generar complejidad y costos adicionales en el sistema sanitario",
                  "Hay preocupaciones sobre el uso y almacenamiento de los óvulos congelados"
            ]
      }
],
    votesSummary: {"si":306,"no":33,"abstencion":8,"noVota":3,"total":350},
    groupVotes: [{"groupName":"G.P. Popular (PP)","totalSeats":137,"si":137,"no":0,"abstencion":0,"noVota":0,"color":"#0ea5e9"},{"groupName":"G.P. Socialista (PSOE)","totalSeats":121,"si":121,"no":0,"abstencion":0,"noVota":0,"color":"#ef4444"},{"groupName":"G.P. VOX","totalSeats":33,"si":33,"no":0,"abstencion":0,"noVota":0,"color":"#22c55e"},{"groupName":"G.P. Plurinacional Sumar","totalSeats":27,"si":15,"no":12,"abstencion":0,"noVota":0,"color":"#ec4899"},{"groupName":"G.P. Republicano (ERC)","totalSeats":7,"si":0,"no":7,"abstencion":0,"noVota":0,"color":"#f59e0b"},{"groupName":"G.P. Junts per Catalunya","totalSeats":7,"si":0,"no":7,"abstencion":0,"noVota":0,"color":"#06b6d4"},{"groupName":"G.P. Euskal Herria Bildu","totalSeats":6,"si":0,"no":6,"abstencion":0,"noVota":0,"color":"#84cc16"},{"groupName":"G.P. Vasco (EAJ-PNV)","totalSeats":5,"si":0,"no":1,"abstencion":4,"noVota":0,"color":"#10b981"},{"groupName":"G.P. Mixto (Podemos/BNG/CC/UPN)","totalSeats":7,"si":0,"no":0,"abstencion":4,"noVota":3,"color":"#8b5cf6"}],
    bocgUrl: "https://www.congreso.es/datos-abiertos",
    expedienteNumber: "121/20260421",
  },
  {
    id: "congreso-2026-04-16-1",
    title: "Reforma de la Ley Orgánica de Protección de la Seguridad Ciudadana",
    officialTitle: "Proposición de Ley de reforma de la Ley Orgánica 4/2015 de Protección de la Seguridad Ciudadana en materia de régimen sancionador y uso de material antidisturbios.",
    chamber: "congreso",
    date: "2026-04-16",
    time: "18:30 h",
    type: "proposicion_ley",
    status: "aprobado",
    category: "Justicia",
    summary: "Esta ley reforma la regulación de sanciones y el uso de material antidisturbios, buscando mejorar la seguridad ciudadana. Los cambios podrían afectar a la interacción entre la policía y los ciudadanos.",
    isOmnibus: false,
    threeKeys: {
      "what": "Modifica la regulación de sanciones y uso de material antidisturbios.",
      "pocket": "No hay impacto directo en el bolsillo del ciudadano, pero puede afectar a la interacción con la policía.",
      "clash": "Los promotores argumentan que la reforma mejora la seguridad, mientras que la oposición critica que puede limitar los derechos civiles."
},
    beforeVsAfter: {
      "before": "La Ley Orgánica 4/2015 establece el régimen sancionador y el uso de material antidisturbios.",
      "after": "Se reforma el régimen sancionador y se establecen nuevas restricciones en el uso de material antidisturbios."
},
    measures: [
      {
            "id": "congreso-2026-04-16-1-m1",
            "title": "Limitación del uso de material antidisturbios",
            "category": "Seguridad Ciudadana",
            "plainDescription": "Se establecen nuevas restricciones en el uso de material antidisturbios, como gases lacrimógenos y cañones de agua.",
            "whoIsAffected": [
                  "Agentes de la autoridad",
                  "Ciudadanos"
            ],
            "realWorldExample": "Un agente de la autoridad no podrá usar gases lacrimógenos en una manifestación pacífica, lo que podría reducir las interacciones conflictivas.",
            "argumentsPro": [
                  "Se reduce el riesgo de lesiones innecesarias",
                  "Se mejora la percepción de los ciudadanos hacia la policía"
            ],
            "argumentsContra": [
                  "Puede limitar la capacidad de los agentes para controlar situaciones de disturbio",
                  "Se podría exponer a la policía a mayor riesgo"
            ]
      }
],
    votesSummary: {"si":177,"no":172,"abstencion":1,"noVota":0,"total":350},
    groupVotes: [{"groupName":"G.P. Popular (PP)","totalSeats":137,"si":137,"no":0,"abstencion":0,"noVota":0,"color":"#0ea5e9"},{"groupName":"G.P. Socialista (PSOE)","totalSeats":121,"si":40,"no":81,"abstencion":0,"noVota":0,"color":"#ef4444"},{"groupName":"G.P. VOX","totalSeats":33,"si":0,"no":33,"abstencion":0,"noVota":0,"color":"#22c55e"},{"groupName":"G.P. Plurinacional Sumar","totalSeats":27,"si":0,"no":27,"abstencion":0,"noVota":0,"color":"#ec4899"},{"groupName":"G.P. Republicano (ERC)","totalSeats":7,"si":0,"no":7,"abstencion":0,"noVota":0,"color":"#f59e0b"},{"groupName":"G.P. Junts per Catalunya","totalSeats":7,"si":0,"no":7,"abstencion":0,"noVota":0,"color":"#06b6d4"},{"groupName":"G.P. Euskal Herria Bildu","totalSeats":6,"si":0,"no":6,"abstencion":0,"noVota":0,"color":"#84cc16"},{"groupName":"G.P. Vasco (EAJ-PNV)","totalSeats":5,"si":0,"no":5,"abstencion":0,"noVota":0,"color":"#10b981"},{"groupName":"G.P. Mixto (Podemos/BNG/CC/UPN)","totalSeats":7,"si":0,"no":6,"abstencion":1,"noVota":0,"color":"#8b5cf6"}],
    bocgUrl: "https://www.congreso.es/datos-abiertos",
    expedienteNumber: "122/000049",
  },
  {
    id: "congreso-2026-04-15-1",
    title: "Patronato de Protección a la Mujer: Apoyo para las Víctimas",
    officialTitle: "Proposición no de Ley del Grupo Parlamentario Republicano, sobre el reconocimiento de las víctimas del Patronato de Protección a la Mujer. Se vota en los términos de la enmienda transaccional presentada por el Grupo Parlamentario Socialista, el Grupo Parlamentario Republicano y el Grupo Parlamentario Junts per Catalunya.",
    chamber: "congreso",
    date: "2026-04-15",
    time: "18:00 h",
    type: "mocion",
    status: "aprobado",
    category: "Justicia",
    summary: "El Congreso votará sobre la enmienda que reconoce el trabajo del Patronato de Protección a la Mujer. Esto beneficiará a las víctimas, proporcionándoles un soporte crucial en momentos de crisis.",
    isOmnibus: false,
    threeKeys: {
      "what": "Se reconoce el papel del Patronato en apoyar a las víctimas de violencia de género.",
      "pocket": "No afecta directamente el bolsillo, pero mejora la calidad de vida de las personas afectadas.",
      "clash": "Defensores ven la medida como crucial para proteger a las víctimas, mientras que críticos temen que pueda ser costoso."
},
    beforeVsAfter: {
      "before": "Antes, las víctimas de violencia de género carecían de un apoyo institucional especializado.",
      "after": "Ahora, el Patronato ofrecerá un respaldo integral a quienes han sufrido violencia de género."
},
    measures: [
      {
            "id": "congreso-2026-04-15-1-m1",
            "title": "Reconocimiento del Patronato de Protección a la Mujer",
            "category": "Violencia de Género",
            "plainDescription": "La medida busca garantizar que el Patronato de Protección a la Mujer reciba el reconocimiento y el apoyo necesario para continuar su labor.",
            "whoIsAffected": [
                  "Víctimas de violencia de género",
                  "Trabajadoras del Patronato"
            ],
            "realWorldExample": "María, una madre soltera, ha recibido ayuda del Patronato después de sufrir agresiones de su expareja. Ahora, gracias a la nueva regulación, podrá acceder a un programa de asesoramiento legal y psicológico más amplio, lo que le permitirá tomar decisiones informadas sobre su futuro y el de su hijo.",
            "argumentsPro": [
                  "Proporcionar un apoyo integral a las víctimas de violencia de género",
                  "Mejorar la calidad de vida de las personas afectadas"
            ],
            "argumentsContra": [
                  "Posible aumento de costos para el presupuesto público",
                  "Necesidad de garantizar que los recursos se utilicen de manera eficiente"
            ]
      }
],
    votesSummary: {"si":176,"no":170,"abstencion":0,"noVota":4,"total":350},
    groupVotes: [{"groupName":"G.P. Popular (PP)","totalSeats":137,"si":137,"no":0,"abstencion":0,"noVota":0,"color":"#0ea5e9"},{"groupName":"G.P. Socialista (PSOE)","totalSeats":121,"si":39,"no":82,"abstencion":0,"noVota":0,"color":"#ef4444"},{"groupName":"G.P. VOX","totalSeats":33,"si":0,"no":33,"abstencion":0,"noVota":0,"color":"#22c55e"},{"groupName":"G.P. Plurinacional Sumar","totalSeats":27,"si":0,"no":27,"abstencion":0,"noVota":0,"color":"#ec4899"},{"groupName":"G.P. Republicano (ERC)","totalSeats":7,"si":0,"no":7,"abstencion":0,"noVota":0,"color":"#f59e0b"},{"groupName":"G.P. Junts per Catalunya","totalSeats":7,"si":0,"no":7,"abstencion":0,"noVota":0,"color":"#06b6d4"},{"groupName":"G.P. Euskal Herria Bildu","totalSeats":6,"si":0,"no":6,"abstencion":0,"noVota":0,"color":"#84cc16"},{"groupName":"G.P. Vasco (EAJ-PNV)","totalSeats":5,"si":0,"no":5,"abstencion":0,"noVota":0,"color":"#10b981"},{"groupName":"G.P. Mixto (Podemos/BNG/CC/UPN)","totalSeats":7,"si":0,"no":3,"abstencion":0,"noVota":4,"color":"#8b5cf6"}],
    bocgUrl: "https://www.congreso.es/datos-abiertos",
    expedienteNumber: "121/20260415",
  },
  {
    id: "congreso-2026-04-15-2",
    title: "Reconocimiento de la cultura del libro en tiempos de dictadura",
    officialTitle: "Proposición no de Ley del Grupo Parlamentario Socialista, para documentar el \"bibliocausto español\" y reconocer el compromiso con la cultura de libreros, bibliotecarios, editores y autores durante el golpe de estado y la dictadura franquista.",
    chamber: "congreso",
    date: "2026-04-15",
    time: "18:00 h",
    type: "mocion",
    status: "rechazado",
    category: "Cultura",
    summary: "El Congreso aprueba la documentación del 'bibliocausto español', reconociendo la labor de libreros, bibliotecarios, editores y autores. Esto ayuda a preservar la memoria cultural y fomenta el respeto por la libertad de expresión.",
    isOmnibus: false,
    threeKeys: {
      "what": "Documentar el 'bibliocausto español' y honrar a los profesionales culturales.",
      "pocket": "No afecta directamente al bolsillo de los ciudadanos, pero mejora la conciencia cultural.",
      "clash": "Libreros y editores apoyan la medida, mientras que algunos temen que no sea lo suficientemente útil."
},
    beforeVsAfter: {
      "before": "Antes, la cultura del libro y los profesionales culturales quedaron en la sombra durante el franquismo.",
      "after": "Ahora, se documentará su legado y se reconocerá su importancia en la sociedad."
},
    measures: [
      {
            "id": "congreso-2026-04-15-2-m1",
            "title": "Documentación del 'bibliocausto español'",
            "category": "Memoria Histórica",
            "plainDescription": "La iniciativa busca recopilar y preservar la historia de la censura y destrucción de libros durante la dictadura.",
            "whoIsAffected": [
                  "Libreros",
                  "Bibliotecarios",
                  "Editores",
                  "Autores"
            ],
            "realWorldExample": "Juan, librero de Madrid, recuerda cómo su tienda fue saqueada durante el franquismo. La iniciativa ayudará a documentar su historia y la de otros profesionales que sufrieron por defender la libertad de expresión.",
            "argumentsPro": [
                  "Preservar la memoria histórica y cultural",
                  "Honrar a los profesionales que lucharon por la libertad de expresión"
            ],
            "argumentsContra": [
                  "Puede ser costoso y no tener un impacto inmediato",
                  "Se teme que no se traduzca en acciones concretas"
            ]
      }
],
    votesSummary: {"si":169,"no":169,"abstencion":8,"noVota":4,"total":350},
    groupVotes: [{"groupName":"G.P. Popular (PP)","totalSeats":137,"si":137,"no":0,"abstencion":0,"noVota":0,"color":"#0ea5e9"},{"groupName":"G.P. Socialista (PSOE)","totalSeats":121,"si":32,"no":89,"abstencion":0,"noVota":0,"color":"#ef4444"},{"groupName":"G.P. VOX","totalSeats":33,"si":0,"no":33,"abstencion":0,"noVota":0,"color":"#22c55e"},{"groupName":"G.P. Plurinacional Sumar","totalSeats":27,"si":0,"no":27,"abstencion":0,"noVota":0,"color":"#ec4899"},{"groupName":"G.P. Republicano (ERC)","totalSeats":7,"si":0,"no":7,"abstencion":0,"noVota":0,"color":"#f59e0b"},{"groupName":"G.P. Junts per Catalunya","totalSeats":7,"si":0,"no":7,"abstencion":0,"noVota":0,"color":"#06b6d4"},{"groupName":"G.P. Euskal Herria Bildu","totalSeats":6,"si":0,"no":6,"abstencion":0,"noVota":0,"color":"#84cc16"},{"groupName":"G.P. Vasco (EAJ-PNV)","totalSeats":5,"si":0,"no":0,"abstencion":5,"noVota":0,"color":"#10b981"},{"groupName":"G.P. Mixto (Podemos/BNG/CC/UPN)","totalSeats":7,"si":0,"no":0,"abstencion":3,"noVota":4,"color":"#8b5cf6"}],
    bocgUrl: "https://www.congreso.es/datos-abiertos",
    expedienteNumber: "121/20260415",
  },
  {
    id: "congreso-2026-04-15-3",
    title: "Reconocimiento de la cultura del libro en tiempos de dictadura",
    officialTitle: "Proposición no de Ley del Grupo Parlamentario Socialista, para documentar el \"bibliocausto español\" y reconocer el compromiso con la cultura de libreros, bibliotecarios, editores y autores durante el golpe de estado y la dictadura franquista.",
    chamber: "congreso",
    date: "2026-04-15",
    time: "18:00 h",
    type: "mocion",
    status: "rechazado",
    category: "Cultura",
    summary: "El Congreso aprueba la documentación del 'bibliocausto español', reconociendo la labor de libreros, bibliotecarios, editores y autores. Esto ayuda a preservar la memoria cultural y fomenta el respeto por la libertad de expresión.",
    isOmnibus: false,
    threeKeys: {
      "what": "Documentar el 'bibliocausto español' y honrar a los profesionales culturales.",
      "pocket": "No afecta directamente al bolsillo de los ciudadanos, pero mejora la conciencia cultural.",
      "clash": "Libreros y editores apoyan la medida, mientras que algunos temen que no sea lo suficientemente útil."
},
    beforeVsAfter: {
      "before": "Antes, la cultura del libro y los profesionales culturales quedaron en la sombra durante el franquismo.",
      "after": "Ahora, se documentará su legado y se reconocerá su importancia en la sociedad."
},
    measures: [
      {
            "id": "congreso-2026-04-15-3-m1",
            "title": "Documentación del 'bibliocausto español'",
            "category": "Memoria Histórica",
            "plainDescription": "La iniciativa busca recopilar y preservar la historia de la censura y destrucción de libros durante la dictadura.",
            "whoIsAffected": [
                  "Libreros",
                  "Bibliotecarios",
                  "Editores",
                  "Autores"
            ],
            "realWorldExample": "Juan, librero de Madrid, recuerda cómo su tienda fue saqueada durante el franquismo. La iniciativa ayudará a documentar su historia y la de otros profesionales que sufrieron por defender la libertad de expresión.",
            "argumentsPro": [
                  "Preservar la memoria histórica y cultural",
                  "Honrar a los profesionales que lucharon por la libertad de expresión"
            ],
            "argumentsContra": [
                  "Puede ser costoso y no tener un impacto inmediato",
                  "Se teme que no se traduzca en acciones concretas"
            ]
      }
],
    votesSummary: {"si":169,"no":169,"abstencion":8,"noVota":4,"total":350},
    groupVotes: [{"groupName":"G.P. Popular (PP)","totalSeats":137,"si":137,"no":0,"abstencion":0,"noVota":0,"color":"#0ea5e9"},{"groupName":"G.P. Socialista (PSOE)","totalSeats":121,"si":32,"no":89,"abstencion":0,"noVota":0,"color":"#ef4444"},{"groupName":"G.P. VOX","totalSeats":33,"si":0,"no":33,"abstencion":0,"noVota":0,"color":"#22c55e"},{"groupName":"G.P. Plurinacional Sumar","totalSeats":27,"si":0,"no":27,"abstencion":0,"noVota":0,"color":"#ec4899"},{"groupName":"G.P. Republicano (ERC)","totalSeats":7,"si":0,"no":7,"abstencion":0,"noVota":0,"color":"#f59e0b"},{"groupName":"G.P. Junts per Catalunya","totalSeats":7,"si":0,"no":7,"abstencion":0,"noVota":0,"color":"#06b6d4"},{"groupName":"G.P. Euskal Herria Bildu","totalSeats":6,"si":0,"no":6,"abstencion":0,"noVota":0,"color":"#84cc16"},{"groupName":"G.P. Vasco (EAJ-PNV)","totalSeats":5,"si":0,"no":0,"abstencion":5,"noVota":0,"color":"#10b981"},{"groupName":"G.P. Mixto (Podemos/BNG/CC/UPN)","totalSeats":7,"si":0,"no":0,"abstencion":3,"noVota":4,"color":"#8b5cf6"}],
    bocgUrl: "https://www.congreso.es/datos-abiertos",
    expedienteNumber: "121/20260415",
  },
  {
    id: "congreso-2026-04-15-4",
    title: "Reconocimiento de la cultura del libro en tiempos de dictadura",
    officialTitle: "Proposición no de Ley del Grupo Parlamentario Socialista, para documentar el \"bibliocausto español\" y reconocer el compromiso con la cultura de libreros, bibliotecarios, editores y autores durante el golpe de estado y la dictadura franquista.",
    chamber: "congreso",
    date: "2026-04-15",
    time: "18:00 h",
    type: "mocion",
    status: "aprobado",
    category: "Cultura",
    summary: "El Congreso aprueba la documentación del 'bibliocausto español', reconociendo la labor de libreros, bibliotecarios, editores y autores. Esto ayuda a preservar la memoria cultural y fomenta el respeto por la libertad de expresión.",
    isOmnibus: false,
    threeKeys: {
      "what": "Documentar el 'bibliocausto español' y honrar a los profesionales culturales.",
      "pocket": "No afecta directamente al bolsillo de los ciudadanos, pero mejora la conciencia cultural.",
      "clash": "Libreros y editores apoyan la medida, mientras que algunos temen que no sea lo suficientemente útil."
},
    beforeVsAfter: {
      "before": "Antes, la cultura del libro y los profesionales culturales quedaron en la sombra durante el franquismo.",
      "after": "Ahora, se documentará su legado y se reconocerá su importancia en la sociedad."
},
    measures: [
      {
            "id": "congreso-2026-04-15-4-m1",
            "title": "Documentación del 'bibliocausto español'",
            "category": "Memoria Histórica",
            "plainDescription": "La iniciativa busca recopilar y preservar la historia de la censura y destrucción de libros durante la dictadura.",
            "whoIsAffected": [
                  "Libreros",
                  "Bibliotecarios",
                  "Editores",
                  "Autores"
            ],
            "realWorldExample": "Juan, librero de Madrid, recuerda cómo su tienda fue saqueada durante el franquismo. La iniciativa ayudará a documentar su historia y la de otros profesionales que sufrieron por defender la libertad de expresión.",
            "argumentsPro": [
                  "Preservar la memoria histórica y cultural",
                  "Honrar a los profesionales que lucharon por la libertad de expresión"
            ],
            "argumentsContra": [
                  "Puede ser costoso y no tener un impacto inmediato",
                  "Se teme que no se traduzca en acciones concretas"
            ]
      }
],
    votesSummary: {"si":170,"no":169,"abstencion":7,"noVota":4,"total":350},
    groupVotes: [{"groupName":"G.P. Popular (PP)","totalSeats":137,"si":137,"no":0,"abstencion":0,"noVota":0,"color":"#0ea5e9"},{"groupName":"G.P. Socialista (PSOE)","totalSeats":121,"si":33,"no":88,"abstencion":0,"noVota":0,"color":"#ef4444"},{"groupName":"G.P. VOX","totalSeats":33,"si":0,"no":33,"abstencion":0,"noVota":0,"color":"#22c55e"},{"groupName":"G.P. Plurinacional Sumar","totalSeats":27,"si":0,"no":27,"abstencion":0,"noVota":0,"color":"#ec4899"},{"groupName":"G.P. Republicano (ERC)","totalSeats":7,"si":0,"no":7,"abstencion":0,"noVota":0,"color":"#f59e0b"},{"groupName":"G.P. Junts per Catalunya","totalSeats":7,"si":0,"no":7,"abstencion":0,"noVota":0,"color":"#06b6d4"},{"groupName":"G.P. Euskal Herria Bildu","totalSeats":6,"si":0,"no":6,"abstencion":0,"noVota":0,"color":"#84cc16"},{"groupName":"G.P. Vasco (EAJ-PNV)","totalSeats":5,"si":0,"no":1,"abstencion":4,"noVota":0,"color":"#10b981"},{"groupName":"G.P. Mixto (Podemos/BNG/CC/UPN)","totalSeats":7,"si":0,"no":0,"abstencion":3,"noVota":4,"color":"#8b5cf6"}],
    bocgUrl: "https://www.congreso.es/datos-abiertos",
    expedienteNumber: "121/20260415",
  },
  {
    id: "congreso-2026-04-15-5",
    title: "Ferrocarriles: mejoras urgentes para el sur de España",
    officialTitle: "Moción consecuencia de interpelación urgente del Grupo Parlamentario Popular en el Congreso, sobre el estado de la infraestructura ferroviaria y las conexiones con el sur de España.",
    chamber: "congreso",
    date: "2026-04-15",
    time: "18:00 h",
    type: "mocion",
    status: "aprobado",
    category: "Tráfico",
    summary: "El Congreso debatirá sobre la mejora de la infraestructura ferroviaria en el sur de España, con el objetivo de facilitar el desplazamiento de personas y mercancías, mejorando la calidad de vida de los ciudadanos.",
    isOmnibus: false,
    threeKeys: {
      "what": "La moción busca mejorar la infraestructura ferroviaria en el sur de España.",
      "pocket": "Los viajeros podrían ver reducidos los retrasos y aumentadas las frecuencias, beneficiando a familias y trabajadores.",
      "clash": "Los transportistas apoyan mejoras que faciliten el movimiento de mercancías, mientras que los sindicatos temen que el coste recaiga en los usuarios."
},
    beforeVsAfter: {
      "before": "Actualmente, los viajeros del sur de España sufren frecuentes retrasos y escasas frecuencias.",
      "after": "Con la nueva regulación, se espera una mejora en la calidad del servicio y una mayor comodidad para los usuarios."
},
    measures: [
      {
            "id": "congreso-2026-04-15-5-m1",
            "title": "Mejoras en la infraestructura ferroviaria",
            "category": "Transporte",
            "plainDescription": "La medida busca incrementar la frecuencia y reducir los retrasos en los trenes que conectan el sur de España con el resto del país.",
            "whoIsAffected": [
                  "Viajeros",
                  "Comerciantes"
            ],
            "realWorldExample": "María, una trabajadora de Madrid que viaja diariamente a Sevilla, podría ver reducidos sus retrasos y aumentadas las frecuencias, lo que le permitiría llegar a tiempo a su trabajo y a su hijo en el colegio. Los comerciantes de Málaga podrían ver mejorada la logística de sus mercancías, facilitando el transporte y reduciendo costes.",
            "argumentsPro": [
                  "Mejora en la calidad del servicio",
                  "Incremento de la eficiencia en el transporte de mercancías"
            ],
            "argumentsContra": [
                  "Posible aumento del coste para los usuarios",
                  "Necesidad de financiación adicional"
            ]
      }
],
    votesSummary: {"si":170,"no":0,"abstencion":175,"noVota":5,"total":350},
    groupVotes: [{"groupName":"G.P. Popular (PP)","totalSeats":137,"si":137,"no":0,"abstencion":0,"noVota":0,"color":"#0ea5e9"},{"groupName":"G.P. Socialista (PSOE)","totalSeats":121,"si":33,"no":0,"abstencion":88,"noVota":0,"color":"#ef4444"},{"groupName":"G.P. VOX","totalSeats":33,"si":0,"no":0,"abstencion":33,"noVota":0,"color":"#22c55e"},{"groupName":"G.P. Plurinacional Sumar","totalSeats":27,"si":0,"no":0,"abstencion":27,"noVota":0,"color":"#ec4899"},{"groupName":"G.P. Republicano (ERC)","totalSeats":7,"si":0,"no":0,"abstencion":7,"noVota":0,"color":"#f59e0b"},{"groupName":"G.P. Junts per Catalunya","totalSeats":7,"si":0,"no":0,"abstencion":7,"noVota":0,"color":"#06b6d4"},{"groupName":"G.P. Euskal Herria Bildu","totalSeats":6,"si":0,"no":0,"abstencion":6,"noVota":0,"color":"#84cc16"},{"groupName":"G.P. Vasco (EAJ-PNV)","totalSeats":5,"si":0,"no":0,"abstencion":5,"noVota":0,"color":"#10b981"},{"groupName":"G.P. Mixto (Podemos/BNG/CC/UPN)","totalSeats":7,"si":0,"no":0,"abstencion":2,"noVota":5,"color":"#8b5cf6"}],
    bocgUrl: "https://www.congreso.es/datos-abiertos",
    expedienteNumber: "121/20260415",
  },
  {
    id: "congreso-2026-04-15-6",
    title: "Exención de visados para diplomáticos: un paso hacia la cooperación internacional",
    officialTitle: "Acuerdo entre el Reino de España y el Sultanato de Omán sobre exención recíproca de visados para titulares de pasaportes diplomáticos, especiales y de servicio, hecho en Madrid el 5 de noviembre de 2025.",
    chamber: "congreso",
    date: "2026-04-15",
    time: "18:00 h",
    type: "proyecto_ley",
    status: "aprobado",
    category: "Internacional",
    summary: "El Congreso aprueba este acuerdo para eximir de visados a titulares de pasaportes diplomáticos, fomentando la cooperación internacional entre España y Omán. Esto beneficiará a los diplomáticos y a las instituciones que trabajan en ambas naciones.",
    isOmnibus: false,
    threeKeys: {
      "what": "Permite a titulares de pasaportes diplomáticos viajar libremente entre España y Omán sin necesidad de visados.",
      "pocket": "No afecta directamente al bolsillo de los ciudadanos, pero fomenta la cooperación y el intercambio cultural.",
      "clash": "Defensores argumentan que facilita el trabajo diplomático, mientras que críticos temen que pueda favorecer el tráfico de personas."
},
    beforeVsAfter: {
      "before": "Antes, titulares de pasaportes diplomáticos necesitaban solicitar visados para viajar entre ambos países.",
      "after": "Ahora, pueden circular libremente, lo que promueve la cooperación y el intercambio cultural."
},
    measures: [
      {
            "id": "congreso-2026-04-15-6-m1",
            "title": "Exención de visados para diplomáticos",
            "category": "Relaciones Internacionales",
            "plainDescription": "Permite a titulares de pasaportes diplomáticos viajar libremente entre España y Omán sin necesidad de visados.",
            "whoIsAffected": [
                  "Diplomáticos y funcionarios de alto nivel de España y Omán"
            ],
            "realWorldExample": "Juan, un diplomático español, puede viajar a Omán para asistir a una conferencia sin preocuparse por la tramitación de un visado, lo que le permite centrarse en su trabajo y en la cooperación entre ambos países.",
            "argumentsPro": [
                  "Facilita el trabajo diplomático y el intercambio cultural entre España y Omán",
                  "Permite una mayor flexibilidad en la planificación de viajes"
            ],
            "argumentsContra": [
                  "Puede aumentar el riesgo de tráfico de personas",
                  "Necesita un sistema de control más riguroso para garantizar la seguridad"
            ]
      }
],
    votesSummary: {"si":293,"no":0,"abstencion":52,"noVota":5,"total":350},
    groupVotes: [{"groupName":"G.P. Popular (PP)","totalSeats":137,"si":137,"no":0,"abstencion":0,"noVota":0,"color":"#0ea5e9"},{"groupName":"G.P. Socialista (PSOE)","totalSeats":121,"si":121,"no":0,"abstencion":0,"noVota":0,"color":"#ef4444"},{"groupName":"G.P. VOX","totalSeats":33,"si":33,"no":0,"abstencion":0,"noVota":0,"color":"#22c55e"},{"groupName":"G.P. Plurinacional Sumar","totalSeats":27,"si":2,"no":0,"abstencion":25,"noVota":0,"color":"#ec4899"},{"groupName":"G.P. Republicano (ERC)","totalSeats":7,"si":0,"no":0,"abstencion":7,"noVota":0,"color":"#f59e0b"},{"groupName":"G.P. Junts per Catalunya","totalSeats":7,"si":0,"no":0,"abstencion":7,"noVota":0,"color":"#06b6d4"},{"groupName":"G.P. Euskal Herria Bildu","totalSeats":6,"si":0,"no":0,"abstencion":6,"noVota":0,"color":"#84cc16"},{"groupName":"G.P. Vasco (EAJ-PNV)","totalSeats":5,"si":0,"no":0,"abstencion":5,"noVota":0,"color":"#10b981"},{"groupName":"G.P. Mixto (Podemos/BNG/CC/UPN)","totalSeats":7,"si":0,"no":0,"abstencion":2,"noVota":5,"color":"#8b5cf6"}],
    bocgUrl: "https://www.congreso.es/datos-abiertos",
    expedienteNumber: "121/20260415",
  },
  {
    id: "congreso-2026-04-15-7",
    title: "Conexión eléctrica: beneficios para Andorra y España",
    officialTitle: "Convenio entre el Reino de España y el Principado de Andorra para la realización de una interconexión eléctrica de 220 kV, hecho en Belem el 18 de noviembre de 2025.",
    chamber: "congreso",
    date: "2026-04-15",
    time: "18:00 h",
    type: "proyecto_ley",
    status: "aprobado",
    category: "Vivienda",
    summary: "El Congreso aprueba el convenio para interconectar redes eléctricas entre España y Andorra, mejorando la seguridad y eficiencia del suministro. Esto supone un avance para la infraestructura, aunque algunos temen posibles riesgos.",
    isOmnibus: false,
    threeKeys: {
      "what": "Permite interconectar redes eléctricas de 220 kV entre España y Andorra.",
      "pocket": "No afecta directamente a los bolsillos de los ciudadanos, pero mejora la seguridad y eficiencia del suministro eléctrico.",
      "clash": "Los defensores ven en este convenio una oportunidad para mejorar la infraestructura, mientras que los opositores temen posibles riesgos de seguridad."
},
    beforeVsAfter: {
      "before": "Antes, el suministro eléctrico entre España y Andorra dependía de conexiones más débiles.",
      "after": "Ahora, la interconexión de 220 kV garantiza un suministro más seguro y eficiente."
},
    measures: [
      {
            "id": "congreso-2026-04-15-7-m1",
            "title": "Interconexión eléctrica entre España y Andorra",
            "category": "Infraestructura",
            "plainDescription": "Establece un convenio para interconectar redes eléctricas de 220 kV entre España y Andorra, mejorando la seguridad y eficiencia del suministro.",
            "whoIsAffected": [
                  "Empresas eléctricas de ambos países",
                  "Consumidores de energía en ambos países"
            ],
            "realWorldExample": "La empresa eléctrica Andorrana, Andos, y su homóloga española, Iberdrola, trabajan juntas para instalar una nueva línea de 220 kV entre las ciudades de Andorra la Vella y Lleida. Esto permitirá que, en caso de un fallo en la red, el suministro se restablezca más rápidamente, evitando cortes prolongados de luz. Los ciudadanos de ambos países podrán disfrutar de un suministro más seguro y eficiente, aunque algunos temen posibles riesgos de seguridad.",
            "argumentsPro": [
                  "Mejora la seguridad del suministro eléctrico",
                  "Reduce los cortes de luz"
            ],
            "argumentsContra": [
                  "Posibles riesgos de seguridad",
                  "Costos iniciales significativos"
            ]
      }
],
    votesSummary: {"si":306,"no":0,"abstencion":38,"noVota":6,"total":350},
    groupVotes: [{"groupName":"G.P. Popular (PP)","totalSeats":137,"si":137,"no":0,"abstencion":0,"noVota":0,"color":"#0ea5e9"},{"groupName":"G.P. Socialista (PSOE)","totalSeats":121,"si":121,"no":0,"abstencion":0,"noVota":0,"color":"#ef4444"},{"groupName":"G.P. VOX","totalSeats":33,"si":33,"no":0,"abstencion":0,"noVota":0,"color":"#22c55e"},{"groupName":"G.P. Plurinacional Sumar","totalSeats":27,"si":15,"no":0,"abstencion":12,"noVota":0,"color":"#ec4899"},{"groupName":"G.P. Republicano (ERC)","totalSeats":7,"si":0,"no":0,"abstencion":7,"noVota":0,"color":"#f59e0b"},{"groupName":"G.P. Junts per Catalunya","totalSeats":7,"si":0,"no":0,"abstencion":7,"noVota":0,"color":"#06b6d4"},{"groupName":"G.P. Euskal Herria Bildu","totalSeats":6,"si":0,"no":0,"abstencion":6,"noVota":0,"color":"#84cc16"},{"groupName":"G.P. Vasco (EAJ-PNV)","totalSeats":5,"si":0,"no":0,"abstencion":5,"noVota":0,"color":"#10b981"},{"groupName":"G.P. Mixto (Podemos/BNG/CC/UPN)","totalSeats":7,"si":0,"no":0,"abstencion":1,"noVota":6,"color":"#8b5cf6"}],
    bocgUrl: "https://www.congreso.es/datos-abiertos",
    expedienteNumber: "121/20260415",
  },
  {
    id: "congreso-2026-04-15-8",
    title: "Acuerdo con el Mediterráneo: un paso hacia la cooperación",
    officialTitle: "Acuerdo de Sede entre el Reino de España y el Secretariado de la Unión por el Mediterráneo, hecho ad referendum en Barcelona el 28 de noviembre de 2025.",
    chamber: "congreso",
    date: "2026-04-15",
    time: "18:00 h",
    type: "proyecto_ley",
    status: "aprobado",
    category: "Internacional",
    summary: "El Congreso aprueba este acuerdo para mejorar la colaboración internacional, beneficiando potencialmente el comercio y la educación.",
    isOmnibus: false,
    threeKeys: {
      "what": "Establece un marco para la colaboración entre España y la Unión Mediterránea.",
      "pocket": "No impacta directamente en el bolsillo de los ciudadanos, pero promete mejoras en servicios y oportunidades.",
      "clash": "Defensores ven oportunidades de desarrollo, mientras que críticos temen la pérdida de soberanía."
},
    beforeVsAfter: {
      "before": "Antes, España trabajaba de manera independiente con países del Mediterráneo.",
      "after": "Ahora, se fortalecen las relaciones y se abren nuevas posibilidades de cooperación."
},
    measures: [
      {
            "id": "congreso-2026-04-15-8-m1",
            "title": "Fomento de la cooperación internacional",
            "category": "Relaciones Exteriores",
            "plainDescription": "Establece un marco para la cooperación en áreas como comercio, educación y cultura entre España y la Unión Mediterránea.",
            "whoIsAffected": [
                  "Empresarios y comerciantes",
                  "Estudiantes y profesores"
            ],
            "realWorldExample": "Juan, un empresario de Barcelona, espera exportar más a países del Mediterráneo, mientras que María, una estudiante de filología, ve en este acuerdo la oportunidad de realizar intercambios académicos en Túnez.",
            "argumentsPro": [
                  "Oportunidades de negocio y crecimiento económico",
                  "Acceso a nuevas culturas y experiencias educativas"
            ],
            "argumentsContra": [
                  "Posible pérdida de soberanía",
                  "Riesgos en la gestión de la cooperación"
            ]
      }
],
    votesSummary: {"si":307,"no":31,"abstencion":6,"noVota":6,"total":350},
    groupVotes: [{"groupName":"G.P. Popular (PP)","totalSeats":137,"si":137,"no":0,"abstencion":0,"noVota":0,"color":"#0ea5e9"},{"groupName":"G.P. Socialista (PSOE)","totalSeats":121,"si":121,"no":0,"abstencion":0,"noVota":0,"color":"#ef4444"},{"groupName":"G.P. VOX","totalSeats":33,"si":33,"no":0,"abstencion":0,"noVota":0,"color":"#22c55e"},{"groupName":"G.P. Plurinacional Sumar","totalSeats":27,"si":16,"no":11,"abstencion":0,"noVota":0,"color":"#ec4899"},{"groupName":"G.P. Republicano (ERC)","totalSeats":7,"si":0,"no":7,"abstencion":0,"noVota":0,"color":"#f59e0b"},{"groupName":"G.P. Junts per Catalunya","totalSeats":7,"si":0,"no":7,"abstencion":0,"noVota":0,"color":"#06b6d4"},{"groupName":"G.P. Euskal Herria Bildu","totalSeats":6,"si":0,"no":6,"abstencion":0,"noVota":0,"color":"#84cc16"},{"groupName":"G.P. Vasco (EAJ-PNV)","totalSeats":5,"si":0,"no":0,"abstencion":5,"noVota":0,"color":"#10b981"},{"groupName":"G.P. Mixto (Podemos/BNG/CC/UPN)","totalSeats":7,"si":0,"no":0,"abstencion":1,"noVota":6,"color":"#8b5cf6"}],
    bocgUrl: "https://www.congreso.es/datos-abiertos",
    expedienteNumber: "121/20260415",
  },
  {
    id: "congreso-2026-04-14-1",
    title: "Regulación de velos integrales en Cataluña",
    officialTitle: "Proposición de Ley del Grupo Parlamentario Junts per Catalunya, Orgánica sobre la regulación del uso de velos integrales y la delegación en la Comunidad Autónoma de Cataluña de competencias estatales en materia de seguridad e identificación de personas.",
    chamber: "congreso",
    date: "2026-04-14",
    time: "18:00 h",
    type: "proposicion_ley",
    status: "rechazado",
    category: "Justicia",
    summary: "El Congreso votará sobre una ley que regula el uso de velos integrales en Cataluña, buscando equilibrar la inclusión social con las libertades individuales.",
    isOmnibus: false,
    threeKeys: {
      "what": "Establece normas sobre el uso de velos integrales en instituciones educativas.",
      "pocket": "No afecta directamente al bolsillo de la ciudadanía, pero promueve la inclusión social.",
      "clash": "Defensores de la inclusión social ven la medida como un paso hacia la igualdad, mientras que detractores temen que restrinja libertades."
},
    beforeVsAfter: {
      "before": "Antes, no existían regulaciones específicas sobre el uso de velos integrales en centros educativos.",
      "after": "Ahora, se establecen lineas directrices para garantizar el derecho a la educación de todas las niñas y mujeres."
},
    measures: [
      {
            "id": "congreso-2026-04-14-1-m1",
            "title": "Regulación de velos integrales",
            "category": "Educación",
            "plainDescription": "La ley establece que el uso de velos integrales en instituciones educativas debe ser excepcional y justificado por razones religiosas.",
            "whoIsAffected": [
                  "Alumnas y estudiantes",
                  "Profesores y personal docente"
            ],
            "realWorldExample": "María, una alumnada musulmana, se siente aliviada al saber que puede continuar su educación en un entorno respetuoso con su religión, mientras que su profesora, Marta, se asegura de que las normas no interfieran con el aprendizaje.",
            "argumentsPro": [
                  "Promueve la igualdad de oportunidades para todas las niñas",
                  "Permite a las alumnas practicar su religión sin restricciones"
            ],
            "argumentsContra": [
                  "Puede limitar la libertad de expresión",
                  "Pone en riesgo la seguridad y el bienestar de las alumnas"
            ]
      }
],
    votesSummary: {"si":7,"no":327,"abstencion":13,"noVota":3,"total":350},
    groupVotes: [{"groupName":"G.P. Popular (PP)","totalSeats":137,"si":7,"no":130,"abstencion":0,"noVota":0,"color":"#0ea5e9"},{"groupName":"G.P. Socialista (PSOE)","totalSeats":121,"si":0,"no":121,"abstencion":0,"noVota":0,"color":"#ef4444"},{"groupName":"G.P. VOX","totalSeats":33,"si":0,"no":33,"abstencion":0,"noVota":0,"color":"#22c55e"},{"groupName":"G.P. Plurinacional Sumar","totalSeats":27,"si":0,"no":27,"abstencion":0,"noVota":0,"color":"#ec4899"},{"groupName":"G.P. Republicano (ERC)","totalSeats":7,"si":0,"no":7,"abstencion":0,"noVota":0,"color":"#f59e0b"},{"groupName":"G.P. Junts per Catalunya","totalSeats":7,"si":0,"no":7,"abstencion":0,"noVota":0,"color":"#06b6d4"},{"groupName":"G.P. Euskal Herria Bildu","totalSeats":6,"si":0,"no":2,"abstencion":4,"noVota":0,"color":"#84cc16"},{"groupName":"G.P. Vasco (EAJ-PNV)","totalSeats":5,"si":0,"no":0,"abstencion":5,"noVota":0,"color":"#10b981"},{"groupName":"G.P. Mixto (Podemos/BNG/CC/UPN)","totalSeats":7,"si":0,"no":0,"abstencion":4,"noVota":3,"color":"#8b5cf6"}],
    bocgUrl: "https://www.congreso.es/datos-abiertos",
    expedienteNumber: "121/20260414",
  },
  {
    id: "congreso-2026-04-14-2",
    title: "Comisión Nacional de los Mercados: Nueva Regulación para Servicios Digitales",
    officialTitle: "Proposición de Ley del Grupo Parlamentario Socialista, sobre la habilitación legal de la Comisión Nacional de los Mercados y la Competencia como coordinador de servicios digitales en España.",
    chamber: "congreso",
    date: "2026-04-14",
    time: "18:00 h",
    type: "proposicion_ley",
    status: "rechazado",
    category: "Tecnología",
    summary: "El Congreso discute la propuesta para que la Comisión Nacional de los Mercados y la Competencia coordine servicios digitales, mejorando la calidad y reduciendo costos para los ciudadanos.",
    isOmnibus: false,
    threeKeys: {
      "what": "La Comisión Nacional de los Mercados se encargará de supervisar servicios digitales.",
      "pocket": "Los costos de servicios digitales podrían disminuir, beneficiando a los consumidores.",
      "clash": "Consumidores y empresas buscan equilibrar el costo y la calidad de los servicios digitales."
},
    beforeVsAfter: {
      "before": "Antes, los servicios digitales estaban sin regulación específica, lo que generaba incertidumbre.",
      "after": "Con la nueva regulación, se espera mayor transparencia y competencia en el sector digital."
},
    measures: [
      {
            "id": "congreso-2026-04-14-2-m1",
            "title": "Supervisión de Servicios Digitales",
            "category": "Regulación",
            "plainDescription": "La Comisión Nacional de los Mercados y la Competencia se encargará de supervisar y regular los servicios digitales en España.",
            "whoIsAffected": [
                  "Consumidores",
                  "Empresas de servicios digitales"
            ],
            "realWorldExample": "María, una estudiante universitaria, podría ver una disminución en los costos de sus servicios de streaming y de software de productividad, gracias a la mayor competencia y transparencia promovida por la nueva regulación.",
            "argumentsPro": [
                  "Mejora la calidad y transparencia de los servicios digitales",
                  "Promueve la competencia y beneficia a los consumidores"
            ],
            "argumentsContra": [
                  "Puede generar un aumento en la carga burocrática para las empresas",
                  "Se teme que la regulación pueda limitar la innovación"
            ]
      }
],
    votesSummary: {"si":163,"no":174,"abstencion":8,"noVota":5,"total":350},
    groupVotes: [{"groupName":"G.P. Popular (PP)","totalSeats":137,"si":137,"no":0,"abstencion":0,"noVota":0,"color":"#0ea5e9"},{"groupName":"G.P. Socialista (PSOE)","totalSeats":121,"si":26,"no":95,"abstencion":0,"noVota":0,"color":"#ef4444"},{"groupName":"G.P. VOX","totalSeats":33,"si":0,"no":33,"abstencion":0,"noVota":0,"color":"#22c55e"},{"groupName":"G.P. Plurinacional Sumar","totalSeats":27,"si":0,"no":27,"abstencion":0,"noVota":0,"color":"#ec4899"},{"groupName":"G.P. Republicano (ERC)","totalSeats":7,"si":0,"no":7,"abstencion":0,"noVota":0,"color":"#f59e0b"},{"groupName":"G.P. Junts per Catalunya","totalSeats":7,"si":0,"no":7,"abstencion":0,"noVota":0,"color":"#06b6d4"},{"groupName":"G.P. Euskal Herria Bildu","totalSeats":6,"si":0,"no":5,"abstencion":1,"noVota":0,"color":"#84cc16"},{"groupName":"G.P. Vasco (EAJ-PNV)","totalSeats":5,"si":0,"no":0,"abstencion":5,"noVota":0,"color":"#10b981"},{"groupName":"G.P. Mixto (Podemos/BNG/CC/UPN)","totalSeats":7,"si":0,"no":0,"abstencion":2,"noVota":5,"color":"#8b5cf6"}],
    bocgUrl: "https://www.congreso.es/datos-abiertos",
    expedienteNumber: "121/20260414",
  },
  {
    id: "congreso-2026-03-26-1",
    title: "Formentera obtendrá su propio senador",
    officialTitle: "Proposición de reforma del artículo 69.3 de la Constitución española a los efectos de que la isla de Formentera elija un senador propio, con independencia del que elija la isla de Eivissa.",
    chamber: "congreso",
    date: "2026-03-26",
    time: "18:00 h",
    type: "proyecto_ley",
    status: "rechazado",
    category: "Autonomía",
    summary: "El Congreso discute la reforma de la Constitución para que Formentera elija un senador propio, lo que podría mejorar la representación de las necesidades locales. Esto supone un avance en la autonomía de la isla, aunque algunos temen que pueda diluir la representación de Ibiza.",
    isOmnibus: false,
    threeKeys: {
      "what": "Permite a Formentera elegir a su propio representante en el Senado.",
      "pocket": "No afecta directamente al bolsillo, pero mejora la representación local.",
      "clash": "Senadores locales apoyan la medida para mayor representación, mientras que otros temen diluir la representación de Ibiza."
},
    beforeVsAfter: {
      "before": "Formentera comparte un senador con Ibiza, lo que puede limitar su representación.",
      "after": "Formentera tendrá su propio senador, mejorando la representación local en el Senado."
},
    measures: [
      {
            "id": "congreso-2026-03-26-1-m1",
            "title": "Representación local en el Senado",
            "category": "Autonomía",
            "plainDescription": "Permite a Formentera elegir a su propio senador, mejorando la representación local.",
            "whoIsAffected": [
                  "Residentes de Formentera",
                  "Empresarios locales"
            ],
            "realWorldExample": "Juan, un empresario de Formentera, se sentirá más representado en el Senado, ya que su voz será escuchada directamente en asuntos locales como el turismo y el medio ambiente.",
            "argumentsPro": [
                  "Mayor representación de las necesidades locales",
                  "Mejora en la toma de decisiones"
            ],
            "argumentsContra": [
                  "Posible dilución de la representación de Ibiza",
                  "Costos administrativos adicionales"
            ]
      }
],
    votesSummary: {"si":33,"no":315,"abstencion":0,"noVota":2,"total":350},
    groupVotes: [{"groupName":"G.P. Popular (PP)","totalSeats":137,"si":33,"no":104,"abstencion":0,"noVota":0,"color":"#0ea5e9"},{"groupName":"G.P. Socialista (PSOE)","totalSeats":121,"si":0,"no":121,"abstencion":0,"noVota":0,"color":"#ef4444"},{"groupName":"G.P. VOX","totalSeats":33,"si":0,"no":33,"abstencion":0,"noVota":0,"color":"#22c55e"},{"groupName":"G.P. Plurinacional Sumar","totalSeats":27,"si":0,"no":27,"abstencion":0,"noVota":0,"color":"#ec4899"},{"groupName":"G.P. Republicano (ERC)","totalSeats":7,"si":0,"no":7,"abstencion":0,"noVota":0,"color":"#f59e0b"},{"groupName":"G.P. Junts per Catalunya","totalSeats":7,"si":0,"no":7,"abstencion":0,"noVota":0,"color":"#06b6d4"},{"groupName":"G.P. Euskal Herria Bildu","totalSeats":6,"si":0,"no":6,"abstencion":0,"noVota":0,"color":"#84cc16"},{"groupName":"G.P. Vasco (EAJ-PNV)","totalSeats":5,"si":0,"no":5,"abstencion":0,"noVota":0,"color":"#10b981"},{"groupName":"G.P. Mixto (Podemos/BNG/CC/UPN)","totalSeats":7,"si":0,"no":5,"abstencion":0,"noVota":2,"color":"#8b5cf6"}],
    bocgUrl: "https://www.congreso.es/datos-abiertos",
    expedienteNumber: "121/20260326",
  },
  {
    id: "congreso-2026-03-26-2",
    title: "Ley para prevenir la multirreincidencia",
    officialTitle: "Proposición de Ley Orgánica en materia de multirreincidencia, por la que se modifica la Ley Orgánica 10/1995, de 23 de noviembre, del Código Penal, la Ley de Enjuiciamiento Criminal, aprobada por Real Decreto de 14 de septiembre de 1882 y la Ley Orgánica 4/2000, de 11 de enero, sobre derechos y libertades de los extranjeros en España y su integración social (antes denominada Proposición de Ley Orgánica en materia de multirreincidencia, por la que se modifica la Ley Orgánica 10/1995, de 23 de noviembre, del Código Penal y la Ley de Enjuiciamiento Criminal, aprobada por Real Decreto de 14 de septiembre de 1882).",
    chamber: "congreso",
    date: "2026-03-26",
    time: "18:00 h",
    type: "proposicion_ley",
    status: "rechazado",
    category: "Justicia",
    summary: "El Congreso discute una ley que busca prevenir la recaída criminal de delincuentes, con el objetivo de mejorar la seguridad ciudadana. Esto supone un cambio en la forma de abordar la criminalidad, buscando no solo castigar, sino también reintegrar a los delincuentes en la sociedad.",
    isOmnibus: false,
    threeKeys: {
      "what": "Establece medidas para prevenir la recaída criminal de delincuentes.",
      "pocket": "No afecta directamente al bolsillo de los ciudadanos, pero busca mejorar la seguridad.",
      "clash": "Defensores argumentan que es necesario proteger a la sociedad, mientras que opositores temen que pueda ser restrictivo."
},
    beforeVsAfter: {
      "before": "Antes, los delincuentes con múltiples antecedentes no recibían medidas específicas para prevenir su reincidencia.",
      "after": "Ahora, se implementarán programas de reinserción que podrían disminuir la tasa de recaída criminal."
},
    measures: [
      {
            "id": "congreso-2026-03-26-2-m1",
            "title": "Programas de reinserción social",
            "category": "Prevención delictiva",
            "plainDescription": "Se establecen programas de formación y trabajo para delincuentes con múltiples antecedentes.",
            "whoIsAffected": [
                  "Delincuentes con múltiples antecedentes",
                  "Centros penitenciarios"
            ],
            "realWorldExample": "Juan, un ex delincuente con 5 antecedentes, participa en un programa de formación laboral que le permite obtener un certificado de electricista. Esto no solo le ayuda a encontrar un trabajo legal, sino que también le proporciona una nueva perspectiva sobre su futuro.",
            "argumentsPro": [
                  "Reduciría la tasa de recaída criminal",
                  "Ofrecería oportunidades de trabajo a personas que han cometido errores"
            ],
            "argumentsContra": [
                  "Podría ser visto como una exoneración injusta",
                  "Puede ser costoso implementar estos programas"
            ]
      }
],
    votesSummary: {"si":138,"no":177,"abstencion":33,"noVota":2,"total":350},
    groupVotes: [{"groupName":"G.P. Popular (PP)","totalSeats":137,"si":137,"no":0,"abstencion":0,"noVota":0,"color":"#0ea5e9"},{"groupName":"G.P. Socialista (PSOE)","totalSeats":121,"si":1,"no":120,"abstencion":0,"noVota":0,"color":"#ef4444"},{"groupName":"G.P. VOX","totalSeats":33,"si":0,"no":33,"abstencion":0,"noVota":0,"color":"#22c55e"},{"groupName":"G.P. Plurinacional Sumar","totalSeats":27,"si":0,"no":24,"abstencion":3,"noVota":0,"color":"#ec4899"},{"groupName":"G.P. Republicano (ERC)","totalSeats":7,"si":0,"no":0,"abstencion":7,"noVota":0,"color":"#f59e0b"},{"groupName":"G.P. Junts per Catalunya","totalSeats":7,"si":0,"no":0,"abstencion":7,"noVota":0,"color":"#06b6d4"},{"groupName":"G.P. Euskal Herria Bildu","totalSeats":6,"si":0,"no":0,"abstencion":6,"noVota":0,"color":"#84cc16"},{"groupName":"G.P. Vasco (EAJ-PNV)","totalSeats":5,"si":0,"no":0,"abstencion":5,"noVota":0,"color":"#10b981"},{"groupName":"G.P. Mixto (Podemos/BNG/CC/UPN)","totalSeats":7,"si":0,"no":0,"abstencion":5,"noVota":2,"color":"#8b5cf6"}],
    bocgUrl: "https://www.congreso.es/datos-abiertos",
    expedienteNumber: "121/20260326",
  },
  {
    id: "congreso-2026-03-26-3",
    title: "Medidas fiscales para aliviar la fatiga tributaria",
    officialTitle: "Proposición no de Ley del Grupo Parlamentario Junts per Catalunya, de medidas fiscales urgentes para hacer frente a la fatiga tributaria que padecen la clase media, trabajadores, autónomos y pequeños empresarios.",
    chamber: "congreso",
    date: "2026-03-26",
    time: "18:00 h",
    type: "mocion",
    status: "aprobado",
    category: "Trabajo",
    summary: "El Congreso aprueba medidas fiscales que buscan aliviar la fatiga tributaria, beneficiando a la clase media y trabajadores independientes. Esto supone un alivio real en el bolsillo de los ciudadanos y una mejora en su calidad de vida.",
    isOmnibus: false,
    threeKeys: {
      "what": "Se implementan rebajas fiscales para trabajadores y autónomos.",
      "pocket": "Los contribuyentes podrán ahorrar hasta 300 euros al año, aliviando el peso del pago de impuestos.",
      "clash": "Trabajadores y autónomos apoyan la medida, mientras que inversores inmobiliarios temen una caída en la recaudación."
},
    beforeVsAfter: {
      "before": "Antes, los trabajadores y autónomos sentían una presión fiscal excesiva.",
      "after": "Ahora, la nueva regulación reduce la carga fiscal, mejorando la calidad de vida."
},
    measures: [
      {
            "id": "congreso-2026-03-26-3-m1",
            "title": "Plan de alivio fiscal",
            "category": "Economía",
            "plainDescription": "Se establecen reducciones en impuestos para trabajadores y autónomos, con el objetivo de aliviar la carga fiscal.",
            "whoIsAffected": [
                  "Trabajadores",
                  "Autónomos"
            ],
            "realWorldExample": "Juan, un autónomo de 45 años, podrá ahorrar 250 euros anuales en impuestos, lo que le permitirá invertir en su negocio o ahorrar para su jubilación. María, una trabajadora de 32 años, verá su sueldo neto aumentar en 150 euros al año, mejorando su capacidad de consumo.",
            "argumentsPro": [
                  "Ayuda a la recuperación económica",
                  "Mejora la capacidad de consumo de los ciudadanos"
            ],
            "argumentsContra": [
                  "Puede afectar la recaudación fiscal",
                  "Inversores inmobiliarios temen una caída en la demanda de alquileres"
            ]
      }
],
    votesSummary: {"si":184,"no":159,"abstencion":7,"noVota":0,"total":350},
    groupVotes: [{"groupName":"G.P. Popular (PP)","totalSeats":137,"si":137,"no":0,"abstencion":0,"noVota":0,"color":"#0ea5e9"},{"groupName":"G.P. Socialista (PSOE)","totalSeats":121,"si":47,"no":74,"abstencion":0,"noVota":0,"color":"#ef4444"},{"groupName":"G.P. VOX","totalSeats":33,"si":0,"no":33,"abstencion":0,"noVota":0,"color":"#22c55e"},{"groupName":"G.P. Plurinacional Sumar","totalSeats":27,"si":0,"no":27,"abstencion":0,"noVota":0,"color":"#ec4899"},{"groupName":"G.P. Republicano (ERC)","totalSeats":7,"si":0,"no":7,"abstencion":0,"noVota":0,"color":"#f59e0b"},{"groupName":"G.P. Junts per Catalunya","totalSeats":7,"si":0,"no":7,"abstencion":0,"noVota":0,"color":"#06b6d4"},{"groupName":"G.P. Euskal Herria Bildu","totalSeats":6,"si":0,"no":6,"abstencion":0,"noVota":0,"color":"#84cc16"},{"groupName":"G.P. Vasco (EAJ-PNV)","totalSeats":5,"si":0,"no":5,"abstencion":0,"noVota":0,"color":"#10b981"},{"groupName":"G.P. Mixto (Podemos/BNG/CC/UPN)","totalSeats":7,"si":0,"no":0,"abstencion":7,"noVota":0,"color":"#8b5cf6"}],
    bocgUrl: "https://www.congreso.es/datos-abiertos",
    expedienteNumber: "121/20260326",
  },
  {
    id: "congreso-2026-03-26-4",
    title: "Industria siderúrgica: apoyo para competir y crecer",
    officialTitle: "Proposición no de Ley del Grupo Parlamentario Vasco (EAJ-PNV), para reforzar la competitividad y la resiliencia de la industria siderúrgica y electrointensiva.",
    chamber: "congreso",
    date: "2026-03-26",
    time: "18:00 h",
    type: "mocion",
    status: "aprobado",
    category: "Empleo",
    summary: "El Congreso analiza una iniciativa para reforzar la industria siderúrgica, buscando proteger puestos de trabajo y fomentar la innovación. Esto podría beneficiar a familias con empleos en la industria y a pequeñas empresas que dependen de suministros locales.",
    isOmnibus: false,
    threeKeys: {
      "what": "Se propone ayudas para modernizar y fortalecer la industria.",
      "pocket": "Los trabajadores podrían beneficiarse de mejores condiciones laborales y mayor estabilidad.",
      "clash": "Empresarios buscan apoyo para competir globalmente, mientras sindicatos temen que los costes suban."
},
    beforeVsAfter: {
      "before": "Antes, la industria siderúrgica enfrentaba dificultades para competir.",
      "after": "Con la nueva regulación, se espera mejorar la competitividad y la estabilidad laboral."
},
    measures: [
      {
            "id": "congreso-2026-03-26-4-m1",
            "title": "Plan de modernización industrial",
            "category": "Innovación",
            "plainDescription": "Se establecen fondos para la adopción de tecnologías avanzadas y la mejora de la eficiencia energética.",
            "whoIsAffected": [
                  "Empresas siderúrgicas",
                  "Trabajadores en la industria"
            ],
            "realWorldExample": "La empresa Sidera, con 200 empleados, recibió un préstamo de 1 millón de euros para implementar nuevas tecnologías que redujeron su consumo de energía en un 20%, lo que permitió a sus trabajadores acceder a mejores condiciones laborales y ahorros en costes de producción.",
            "argumentsPro": [
                  "Mejora la competitividad global de la industria",
                  "Genera empleo de calidad y estabilidad"
            ],
            "argumentsContra": [
                  "Puede aumentar los costes de producción",
                  "Se teme que los precios de los productos suban"
            ]
      }
],
    votesSummary: {"si":165,"no":37,"abstencion":148,"noVota":0,"total":350},
    groupVotes: [{"groupName":"G.P. Popular (PP)","totalSeats":137,"si":137,"no":0,"abstencion":0,"noVota":0,"color":"#0ea5e9"},{"groupName":"G.P. Socialista (PSOE)","totalSeats":121,"si":28,"no":37,"abstencion":56,"noVota":0,"color":"#ef4444"},{"groupName":"G.P. VOX","totalSeats":33,"si":0,"no":0,"abstencion":33,"noVota":0,"color":"#22c55e"},{"groupName":"G.P. Plurinacional Sumar","totalSeats":27,"si":0,"no":0,"abstencion":27,"noVota":0,"color":"#ec4899"},{"groupName":"G.P. Republicano (ERC)","totalSeats":7,"si":0,"no":0,"abstencion":7,"noVota":0,"color":"#f59e0b"},{"groupName":"G.P. Junts per Catalunya","totalSeats":7,"si":0,"no":0,"abstencion":7,"noVota":0,"color":"#06b6d4"},{"groupName":"G.P. Euskal Herria Bildu","totalSeats":6,"si":0,"no":0,"abstencion":6,"noVota":0,"color":"#84cc16"},{"groupName":"G.P. Vasco (EAJ-PNV)","totalSeats":5,"si":0,"no":0,"abstencion":5,"noVota":0,"color":"#10b981"},{"groupName":"G.P. Mixto (Podemos/BNG/CC/UPN)","totalSeats":7,"si":0,"no":0,"abstencion":7,"noVota":0,"color":"#8b5cf6"}],
    bocgUrl: "https://www.congreso.es/datos-abiertos",
    expedienteNumber: "121/20260326",
  },
  {
    id: "congreso-2026-03-26-5",
    title: "Ayuda a la clase media: reducción del IVA en productos básicos",
    officialTitle: "Moción consecuencia de interpelación urgente del Grupo Parlamentario Junts per Catalunya, sobre las dificultades fiscales y económicas de la clase media y trabajadora.",
    chamber: "congreso",
    date: "2026-03-26",
    time: "18:00 h",
    type: "mocion",
    status: "rechazado",
    category: "Economía",
    summary: "El Congreso aprueba una moción para reducir el IVA en productos básicos, buscando proteger a la clase media y trabajadora. Esto supone un pequeño pero significativo alivio en el presupuesto familiar.",
    isOmnibus: false,
    threeKeys: {
      "what": "Se reduce el IVA en productos esenciales para aliviar el bolsillo de los trabajadores.",
      "pocket": "Los consumidores verán una reducción media del 2% en el precio de los alimentos y otros bienes necesarios.",
      "clash": "Los partidarios de la medida argumentan que es necesaria para aliviar la presión fiscal, mientras que los opositores temen que no sea lo suficientemente efectiva."
},
    beforeVsAfter: {
      "before": "Antes, los ciudadanos pagaban un IVA más alto en productos básicos, aumentando su gasto mensual.",
      "after": "Ahora, con la reducción del IVA, los ciudadanos notarán un ligero alivio en sus compras diarias."
},
    measures: [
      {
            "id": "congreso-2026-03-26-5-m1",
            "title": "IVA reducido en productos esenciales",
            "category": "Consumo",
            "plainDescription": "Se aplica una tasa reducida del IVA a productos de primera necesidad como alimentos, medicinas y artículos de aseo personal.",
            "whoIsAffected": [
                  "Familias con presupuestos ajustados",
                  "Consumidores de productos básicos"
            ],
            "realWorldExample": "María, una madre soltera con un sueldo fijo, comprará leche y pan a un precio 2% más bajo, lo que le permitirá ahorrar 10 euros al mes en estos productos.",
            "argumentsPro": [
                  "Ayuda a los hogares con menores ingresos a afrontar el coste de vida",
                  "Incrementa el poder adquisitivo de los consumidores de bajos ingresos"
            ],
            "argumentsContra": [
                  "No abarca todos los productos esenciales",
                  "Podría ser insuficiente para las familias más necesitadas"
            ]
      }
],
    votesSummary: {"si":158,"no":185,"abstencion":7,"noVota":0,"total":350},
    groupVotes: [{"groupName":"G.P. Popular (PP)","totalSeats":137,"si":137,"no":0,"abstencion":0,"noVota":0,"color":"#0ea5e9"},{"groupName":"G.P. Socialista (PSOE)","totalSeats":121,"si":21,"no":100,"abstencion":0,"noVota":0,"color":"#ef4444"},{"groupName":"G.P. VOX","totalSeats":33,"si":0,"no":33,"abstencion":0,"noVota":0,"color":"#22c55e"},{"groupName":"G.P. Plurinacional Sumar","totalSeats":27,"si":0,"no":27,"abstencion":0,"noVota":0,"color":"#ec4899"},{"groupName":"G.P. Republicano (ERC)","totalSeats":7,"si":0,"no":7,"abstencion":0,"noVota":0,"color":"#f59e0b"},{"groupName":"G.P. Junts per Catalunya","totalSeats":7,"si":0,"no":7,"abstencion":0,"noVota":0,"color":"#06b6d4"},{"groupName":"G.P. Euskal Herria Bildu","totalSeats":6,"si":0,"no":6,"abstencion":0,"noVota":0,"color":"#84cc16"},{"groupName":"G.P. Vasco (EAJ-PNV)","totalSeats":5,"si":0,"no":5,"abstencion":0,"noVota":0,"color":"#10b981"},{"groupName":"G.P. Mixto (Podemos/BNG/CC/UPN)","totalSeats":7,"si":0,"no":0,"abstencion":7,"noVota":0,"color":"#8b5cf6"}],
    bocgUrl: "https://www.congreso.es/datos-abiertos",
    expedienteNumber: "121/20260326",
  },
  {
    id: "congreso-2026-03-26-6",
    title: "Medidas urgentes para aliviar impacto de guerra en Irán",
    officialTitle: "Moción consecuencia de interpelación urgente del Grupo Parlamentario Popular en el Congreso, para dar cuenta de las medidas que está poniendo en marcha el Gobierno para paliar las consecuencias de la guerra en Irán sobre las familias y empresas españolas.",
    chamber: "congreso",
    date: "2026-03-26",
    time: "18:00 h",
    type: "mocion",
    status: "aprobado",
    category: "Vivienda",
    summary: "El Congreso aprueba medidas para mitigar el impacto de la guerra en Irán, mejorando la situación de las familias y aliviando el estrés financiero.",
    isOmnibus: false,
    threeKeys: {
      "what": "El Gobierno implementa ayudas económicas para familias afectadas por alza del alquiler.",
      "pocket": "Ayudas de hasta 500 euros mensuales para inquilinos, alivio real en el bolsillo.",
      "clash": "Inquilinos temen alza de precios mientras propietarios preocupados por mantener sus inmuebles."
},
    beforeVsAfter: {
      "before": "Antes, los inquilinos veían cómo aumentaban los precios del alquiler, agobiados económicamente.",
      "after": "Ahora, con las ayudas, los inquilinos experimentan un alivio en sus pagos mensuales."
},
    measures: [
      {
            "id": "congreso-2026-03-26-6-m1",
            "title": "Ayudas económicas para inquilinos",
            "category": "Alquiler",
            "plainDescription": "El Gobierno ofrece subvenciones para ayudar a los inquilinos a soportar el aumento del alquiler.",
            "whoIsAffected": [
                  "Inquilinos",
                  "Familias con presupuestos ajustados"
            ],
            "realWorldExample": "María, una madre soltera, recibirá 300 euros mensuales para ayudar a cubrir el alquiler de su piso, aliviando la presión financiera.",
            "argumentsPro": [
                  "Ayuda a mantener a las familias en sus hogares",
                  "Alivia el estrés financiero de los inquilinos"
            ],
            "argumentsContra": [
                  "Puede incentivar el alquiler de viviendas más caras",
                  "Posible aumento de la demanda de viviendas al saberse las ayudas"
            ]
      }
],
    votesSummary: {"si":182,"no":166,"abstencion":1,"noVota":1,"total":350},
    groupVotes: [{"groupName":"G.P. Popular (PP)","totalSeats":137,"si":137,"no":0,"abstencion":0,"noVota":0,"color":"#0ea5e9"},{"groupName":"G.P. Socialista (PSOE)","totalSeats":121,"si":45,"no":76,"abstencion":0,"noVota":0,"color":"#ef4444"},{"groupName":"G.P. VOX","totalSeats":33,"si":0,"no":33,"abstencion":0,"noVota":0,"color":"#22c55e"},{"groupName":"G.P. Plurinacional Sumar","totalSeats":27,"si":0,"no":27,"abstencion":0,"noVota":0,"color":"#ec4899"},{"groupName":"G.P. Republicano (ERC)","totalSeats":7,"si":0,"no":7,"abstencion":0,"noVota":0,"color":"#f59e0b"},{"groupName":"G.P. Junts per Catalunya","totalSeats":7,"si":0,"no":7,"abstencion":0,"noVota":0,"color":"#06b6d4"},{"groupName":"G.P. Euskal Herria Bildu","totalSeats":6,"si":0,"no":6,"abstencion":0,"noVota":0,"color":"#84cc16"},{"groupName":"G.P. Vasco (EAJ-PNV)","totalSeats":5,"si":0,"no":5,"abstencion":0,"noVota":0,"color":"#10b981"},{"groupName":"G.P. Mixto (Podemos/BNG/CC/UPN)","totalSeats":7,"si":0,"no":5,"abstencion":1,"noVota":1,"color":"#8b5cf6"}],
    bocgUrl: "https://www.congreso.es/datos-abiertos",
    expedienteNumber: "121/20260326",
  },
  {
    id: "congreso-2026-03-26-7",
    title: "VOX pide medidas urgentes para la sanidad",
    officialTitle: "Moción consecuencia de interpelación urgente del Grupo Parlamentario VOX, sobre las medidas que va a adoptar el Gobierno para garantizar la asistencia sanitaria de los españoles.",
    chamber: "congreso",
    date: "2026-03-26",
    time: "18:00 h",
    type: "mocion",
    status: "rechazado",
    category: "Sanidad",
    summary: "En el Congreso se discute sobre las medidas para garantizar la asistencia sanitaria, impactando en la calidad de vida de los ciudadanos.",
    isOmnibus: false,
    threeKeys: {
      "what": "VOX propone acciones inmediatas para asegurar el acceso a la asistencia médica.",
      "pocket": "Los ciudadanos esperan soluciones que no aumenten la carga fiscal y garanticen la calidad del servicio.",
      "clash": "El Gobierno y la oposición deben equilibrar la necesidad de recursos con la eficiencia y la accesibilidad."
},
    beforeVsAfter: {
      "before": "Antes, los pacientes se quejaban de largas esperas y escasez de recursos.",
      "after": "Con las nuevas medidas, se espera una mejora en la atención y una mayor confianza en el sistema."
},
    measures: [
      {
            "id": "congreso-2026-03-26-7-m1",
            "title": "Plan de mejora de infraestructuras sanitarias",
            "category": "Recursos",
            "plainDescription": "El plan busca incrementar la capacidad de los hospitales y centros de salud para mejorar la atención.",
            "whoIsAffected": [
                  "Pacientes con necesidades crónicas",
                  "Profesionales sanitarios"
            ],
            "realWorldExample": "María, una enfermera, podrá atender a más pacientes en su puesto de trabajo gracias a la ampliación del centro de salud, lo que le permitirá dedicar más tiempo a cada paciente y reducir la espera.",
            "argumentsPro": [
                  "Mejora de la calidad de vida de los pacientes",
                  "Reducción de la sobrecarga en los profesionales"
            ],
            "argumentsContra": [
                  "Posible aumento de la carga fiscal",
                  "Necesidad de una evaluación previa de la eficiencia actual"
            ]
      }
],
    votesSummary: {"si":33,"no":179,"abstencion":138,"noVota":0,"total":350},
    groupVotes: [{"groupName":"G.P. Popular (PP)","totalSeats":137,"si":33,"no":104,"abstencion":0,"noVota":0,"color":"#0ea5e9"},{"groupName":"G.P. Socialista (PSOE)","totalSeats":121,"si":0,"no":75,"abstencion":46,"noVota":0,"color":"#ef4444"},{"groupName":"G.P. VOX","totalSeats":33,"si":0,"no":0,"abstencion":33,"noVota":0,"color":"#22c55e"},{"groupName":"G.P. Plurinacional Sumar","totalSeats":27,"si":0,"no":0,"abstencion":27,"noVota":0,"color":"#ec4899"},{"groupName":"G.P. Republicano (ERC)","totalSeats":7,"si":0,"no":0,"abstencion":7,"noVota":0,"color":"#f59e0b"},{"groupName":"G.P. Junts per Catalunya","totalSeats":7,"si":0,"no":0,"abstencion":7,"noVota":0,"color":"#06b6d4"},{"groupName":"G.P. Euskal Herria Bildu","totalSeats":6,"si":0,"no":0,"abstencion":6,"noVota":0,"color":"#84cc16"},{"groupName":"G.P. Vasco (EAJ-PNV)","totalSeats":5,"si":0,"no":0,"abstencion":5,"noVota":0,"color":"#10b981"},{"groupName":"G.P. Mixto (Podemos/BNG/CC/UPN)","totalSeats":7,"si":0,"no":0,"abstencion":7,"noVota":0,"color":"#8b5cf6"}],
    bocgUrl: "https://www.congreso.es/datos-abiertos",
    expedienteNumber: "121/20260326",
  },
  {
    id: "congreso-2026-03-26-8",
    title: "VOX pide medidas urgentes para industria y economía",
    officialTitle: "Moción consecuencia de interpelación urgente del Grupo Parlamentario VOX, sobre la estrategia energética del Gobierno para garantizar la supervivencia de la industria y el crecimiento del país.",
    chamber: "congreso",
    date: "2026-03-26",
    time: "18:00 h",
    type: "mocion",
    status: "rechazado",
    category: "Economía",
    summary: "En el Congreso se discute sobre la estrategia energética para proteger la industria y fomentar el crecimiento. Las decisiones afectarán directamente el bolsillo de los ciudadanos y la competitividad de las empresas.",
    isOmnibus: false,
    threeKeys: {
      "what": "VOX propone estrategias para proteger industria y fomentar crecimiento económico.",
      "pocket": "Impacto en el bolsillo: reducción de costes energéticos para empresas y familias.",
      "clash": "Gobierno defiende equilibrio entre sostenibilidad y competitividad, mientras VOX pide medidas más drásticas."
},
    beforeVsAfter: {
      "before": "Antes, empresas industriales enfrentaban altos costes energéticos que amenazaban su viabilidad.",
      "after": "Con la nueva regulación, se espera una reducción en costes que permita a empresas y familias ahorrar dinero."
},
    measures: [
      {
            "id": "congreso-2026-03-26-8-m1",
            "title": "Subvenciones para reducir costes energéticos",
            "category": "Energía",
            "plainDescription": "Se establecen subvenciones para ayudar a las empresas industriales a reducir sus costes energéticos.",
            "whoIsAffected": [
                  "Empresas industriales",
                  "Familias con altos gastos energéticos"
            ],
            "realWorldExample": "Juan, propietario de una pequeña fábrica, recibe una subvención que le permite ahorrar 10.000 euros al año en facturas de luz y gas, lo que le permite invertir en mejoras de eficiencia energética.",
            "argumentsPro": [
                  "Ayuda a mantener la competitividad de las empresas",
                  "Alivia el coste de vida para familias con altos gastos energéticos"
            ],
            "argumentsContra": [
                  "Puede favorecer a grandes empresas a expensas de pequeñas",
                  "Puede incentivar el uso de fuentes de energía no renovables"
            ]
      }
],
    votesSummary: {"si":33,"no":317,"abstencion":0,"noVota":0,"total":350},
    groupVotes: [{"groupName":"G.P. Popular (PP)","totalSeats":137,"si":33,"no":104,"abstencion":0,"noVota":0,"color":"#0ea5e9"},{"groupName":"G.P. Socialista (PSOE)","totalSeats":121,"si":0,"no":121,"abstencion":0,"noVota":0,"color":"#ef4444"},{"groupName":"G.P. VOX","totalSeats":33,"si":0,"no":33,"abstencion":0,"noVota":0,"color":"#22c55e"},{"groupName":"G.P. Plurinacional Sumar","totalSeats":27,"si":0,"no":27,"abstencion":0,"noVota":0,"color":"#ec4899"},{"groupName":"G.P. Republicano (ERC)","totalSeats":7,"si":0,"no":7,"abstencion":0,"noVota":0,"color":"#f59e0b"},{"groupName":"G.P. Junts per Catalunya","totalSeats":7,"si":0,"no":7,"abstencion":0,"noVota":0,"color":"#06b6d4"},{"groupName":"G.P. Euskal Herria Bildu","totalSeats":6,"si":0,"no":6,"abstencion":0,"noVota":0,"color":"#84cc16"},{"groupName":"G.P. Vasco (EAJ-PNV)","totalSeats":5,"si":0,"no":5,"abstencion":0,"noVota":0,"color":"#10b981"},{"groupName":"G.P. Mixto (Podemos/BNG/CC/UPN)","totalSeats":7,"si":0,"no":7,"abstencion":0,"noVota":0,"color":"#8b5cf6"}],
    bocgUrl: "https://www.congreso.es/datos-abiertos",
    expedienteNumber: "121/20260326",
  },
  {
    id: "congreso-2026-03-26-9",
    title: "Reconocimiento a héroes de la Democracia",
    officialTitle: "Real Decreto-ley 6/2026, de 3 de marzo, por el que se modifica la Ley 20/2022, de 19 de octubre, de Memoria Democrática, sobre reconocimiento a favor de personas fallecidas o con lesiones incapacitantes por su actividad en defensa y reivindicación de la Democracia.",
    chamber: "congreso",
    date: "2026-03-26",
    time: "18:00 h",
    type: "real_decreto_ley",
    status: "aprobado",
    category: "Justicia",
    summary: "El Congreso aprueba un real decreto-ley para reconocer a las personas fallecidas o con lesiones incapacitantes por su defensa de la democracia, mejorando la calidad de vida de sus familias.",
    isOmnibus: true,
    threeKeys: {
      "what": "Establece ayudas económicas para familiares de víctimas de la transición democrática.",
      "pocket": "Familias con miembros fallecidos o con lesiones incapacitantes recibirán una ayuda mensual de 500 euros.",
      "clash": "Defensores de la medida argumentan que es justo reconocer el sacrificio, mientras que críticos temen que sea un gasto innecesario."
},
    beforeVsAfter: {
      "before": "Antes, familias de víctimas de la transición democrática no contaban con un apoyo económico formal.",
      "after": "Ahora, recibirán una ayuda mensual que les ayudará a cubrir gastos básicos."
},
    measures: [
      {
            "id": "congreso-2026-03-26-9-m1",
            "title": "Ayuda económica para familias de héroes de la Democracia",
            "category": "Memoria Democrática",
            "plainDescription": "Familias de personas fallecidas o con lesiones incapacitantes por su defensa de la democracia recibirán una ayuda económica mensual.",
            "whoIsAffected": [
                  "Familias de personas fallecidas",
                  "Familias de personas con lesiones incapacitantes"
            ],
            "realWorldExample": "María, madre de Juan, fallecido en 1977 defendiendo la democracia, recibirá 500 euros mensuales para ayudar a cubrir gastos básicos y mantener a su familia.",
            "argumentsPro": [
                  "Es justo reconocer el sacrificio de quienes lucharon por la democracia",
                  "Ayuda a mantener la memoria de los héroes de la transición"
            ],
            "argumentsContra": [
                  "Puede ser un gasto innecesario para el Estado",
                  "Existen otras prioridades en el presupuesto"
            ]
      }
],
    votesSummary: {"si":173,"no":170,"abstencion":7,"noVota":0,"total":350},
    groupVotes: [{"groupName":"G.P. Popular (PP)","totalSeats":137,"si":137,"no":0,"abstencion":0,"noVota":0,"color":"#0ea5e9"},{"groupName":"G.P. Socialista (PSOE)","totalSeats":121,"si":36,"no":85,"abstencion":0,"noVota":0,"color":"#ef4444"},{"groupName":"G.P. VOX","totalSeats":33,"si":0,"no":33,"abstencion":0,"noVota":0,"color":"#22c55e"},{"groupName":"G.P. Plurinacional Sumar","totalSeats":27,"si":0,"no":27,"abstencion":0,"noVota":0,"color":"#ec4899"},{"groupName":"G.P. Republicano (ERC)","totalSeats":7,"si":0,"no":7,"abstencion":0,"noVota":0,"color":"#f59e0b"},{"groupName":"G.P. Junts per Catalunya","totalSeats":7,"si":0,"no":7,"abstencion":0,"noVota":0,"color":"#06b6d4"},{"groupName":"G.P. Euskal Herria Bildu","totalSeats":6,"si":0,"no":6,"abstencion":0,"noVota":0,"color":"#84cc16"},{"groupName":"G.P. Vasco (EAJ-PNV)","totalSeats":5,"si":0,"no":5,"abstencion":0,"noVota":0,"color":"#10b981"},{"groupName":"G.P. Mixto (Podemos/BNG/CC/UPN)","totalSeats":7,"si":0,"no":0,"abstencion":7,"noVota":0,"color":"#8b5cf6"}],
    bocgUrl: "https://www.congreso.es/datos-abiertos",
    expedienteNumber: "121/20260326",
  },
  {
    id: "congreso-2026-03-26-10",
    title: "Reconocimiento a Defensores de la Democracia",
    officialTitle: "Tramitación como Proyecto de Ley por el procedimiento de urgencia del Real Decreto-ley 6/2026, de 3 de marzo, por el que se modifica la Ley 20/2022, de 19 de octubre, de Memoria Democrática, sobre reconocimiento a favor de personas fallecidas o con lesiones incapacitantes por su actividad en defensa y reivindicación de la Democracia.",
    chamber: "congreso",
    date: "2026-03-26",
    time: "18:00 h",
    type: "real_decreto_ley",
    status: "aprobado",
    category: "Justicia",
    summary: "El Congreso aprueba una ley que reconoce a aquellos que dieron su vida o quedaron incapacitados en defensa de la democracia, proporcionando un reconocimiento simbólico pero crucial para sus familias y para la memoria histórica.",
    isOmnibus: true,
    threeKeys: {
      "what": "Modifica la Ley de Memoria Democrática para reconocer a personas fallecidas o con lesiones incapacitantes por su actividad en defensa de la democracia.",
      "pocket": "No tiene impacto directo en el bolsillo, pero reconoce el sacrificio de aquellos que lucharon por la democracia.",
      "clash": "Defensores de la democracia apoyan la medida, mientras que quienes temen un aumento de costes o una posible abusividad se oponen."
},
    beforeVsAfter: {
      "before": "Antes, las personas que murieron o quedaron incapacitadas por defender la democracia no tenían reconocimiento oficial.",
      "after": "Ahora, estas personas recibirán el reconocimiento que merecen, lo que puede ser un alivio emocional para sus familias."
},
    measures: [
      {
            "id": "congreso-2026-03-26-10-m1",
            "title": "Reconocimiento a Defensores de la Democracia",
            "category": "Memoria Democrática",
            "plainDescription": "La medida establece un sistema para reconocer a personas fallecidas o con lesiones incapacitantes por su actividad en defensa y reivindicación de la democracia.",
            "whoIsAffected": [
                  "Familias de personas fallecidas",
                  "Personas con lesiones incapacitantes"
            ],
            "realWorldExample": "Juan, un activista que perdió la vista en un enfrentamiento con fuerzas antidisturbios, ahora podrá acceder a una pensión especial y a un reconocimiento público. Su familia ha podido encontrar un poco de alivio en este reconocimiento después de años de lucha.",
            "argumentsPro": [
                  "Reconocimiento a la valentía y el sacrificio de aquellos que lucharon por la democracia",
                  "Ayuda a las familias a encontrar un poco de consuelo"
            ],
            "argumentsContra": [
                  "Posible aumento de costes para el Estado",
                  "Riesgo de abusos si no se regulan adecuadamente los criterios de reconocimiento"
            ]
      }
],
    votesSummary: {"si":179,"no":171,"abstencion":0,"noVota":0,"total":350},
    groupVotes: [{"groupName":"G.P. Popular (PP)","totalSeats":137,"si":137,"no":0,"abstencion":0,"noVota":0,"color":"#0ea5e9"},{"groupName":"G.P. Socialista (PSOE)","totalSeats":121,"si":42,"no":79,"abstencion":0,"noVota":0,"color":"#ef4444"},{"groupName":"G.P. VOX","totalSeats":33,"si":0,"no":33,"abstencion":0,"noVota":0,"color":"#22c55e"},{"groupName":"G.P. Plurinacional Sumar","totalSeats":27,"si":0,"no":27,"abstencion":0,"noVota":0,"color":"#ec4899"},{"groupName":"G.P. Republicano (ERC)","totalSeats":7,"si":0,"no":7,"abstencion":0,"noVota":0,"color":"#f59e0b"},{"groupName":"G.P. Junts per Catalunya","totalSeats":7,"si":0,"no":7,"abstencion":0,"noVota":0,"color":"#06b6d4"},{"groupName":"G.P. Euskal Herria Bildu","totalSeats":6,"si":0,"no":6,"abstencion":0,"noVota":0,"color":"#84cc16"},{"groupName":"G.P. Vasco (EAJ-PNV)","totalSeats":5,"si":0,"no":5,"abstencion":0,"noVota":0,"color":"#10b981"},{"groupName":"G.P. Mixto (Podemos/BNG/CC/UPN)","totalSeats":7,"si":0,"no":7,"abstencion":0,"noVota":0,"color":"#8b5cf6"}],
    bocgUrl: "https://www.congreso.es/datos-abiertos",
    expedienteNumber: "121/20260326",
  },
  {
    id: "congreso-2026-03-26-11",
    title: "Formentera obtendrá su senador propio",
    officialTitle: "Votación de conjunto de la Proposición de reforma del artículo 69.3 de la Constitución española a los efectos de que la isla de Formentera elija un senador propio, con independencia del que elija la isla de Eivissa, por tramitarse en lectura única y tratarse de una Proposición de reforma constitucional, teniendo en cuenta las correcciones técnicas distribuidas.",
    chamber: "congreso",
    date: "2026-03-26",
    time: "18:00 h",
    type: "proyecto_ley",
    status: "aprobado",
    category: "Vivienda",
    summary: "El Congreso votará sobre la reforma que permitirá a Formentera elegir a su propio senador, lo que podría mejorar la representación de las necesidades locales. Esto supone un cambio positivo para los habitantes de la isla, aunque algunos temen que pueda generar divisiones.",
    isOmnibus: false,
    threeKeys: {
      "what": "La isla de Formentera elegirá a su propio senador independientemente de Eivissa.",
      "pocket": "Este cambio no afectará directamente los bolsillos de los ciudadanos, pero sí podría mejorar la representación local.",
      "clash": "Los defensores ven esta medida como un paso hacia una mayor representación autonómica, mientras que otros temen que pueda generar divisiones entre las islas."
},
    beforeVsAfter: {
      "before": "Antes, los ciudadanos de Formentera compartían un senador con Eivissa.",
      "after": "Desde ahora, Formentera tendrá su senador propio, mejorando la representación local."
},
    measures: [
      {
            "id": "congreso-2026-03-26-11-m1",
            "title": "Formentera obtendrá su senador propio",
            "category": "Representación Autonómica",
            "plainDescription": "La medida estipula que la isla de Formentera elegirá a su propio senador independientemente de Eivissa, mejorando la representación local.",
            "whoIsAffected": [
                  "Habitantes de Formentera"
            ],
            "realWorldExample": "María, una residente de Formentera, se sentirá más representada en el Senado, ya que podrá votar por un senador que entienda sus necesidades específicas, como la protección del medio ambiente o la mejora de los servicios locales.",
            "argumentsPro": [
                  "Mejora la representación local",
                  "Permite una voz más específica para las necesidades de Formentera"
            ],
            "argumentsContra": [
                  "Puede generar divisiones entre las islas",
                  "Posible aumento de la burocracia"
            ]
      }
],
    votesSummary: {"si":312,"no":33,"abstencion":5,"noVota":0,"total":350},
    groupVotes: [{"groupName":"G.P. Popular (PP)","totalSeats":137,"si":137,"no":0,"abstencion":0,"noVota":0,"color":"#0ea5e9"},{"groupName":"G.P. Socialista (PSOE)","totalSeats":121,"si":121,"no":0,"abstencion":0,"noVota":0,"color":"#ef4444"},{"groupName":"G.P. VOX","totalSeats":33,"si":33,"no":0,"abstencion":0,"noVota":0,"color":"#22c55e"},{"groupName":"G.P. Plurinacional Sumar","totalSeats":27,"si":21,"no":6,"abstencion":0,"noVota":0,"color":"#ec4899"},{"groupName":"G.P. Republicano (ERC)","totalSeats":7,"si":0,"no":7,"abstencion":0,"noVota":0,"color":"#f59e0b"},{"groupName":"G.P. Junts per Catalunya","totalSeats":7,"si":0,"no":7,"abstencion":0,"noVota":0,"color":"#06b6d4"},{"groupName":"G.P. Euskal Herria Bildu","totalSeats":6,"si":0,"no":6,"abstencion":0,"noVota":0,"color":"#84cc16"},{"groupName":"G.P. Vasco (EAJ-PNV)","totalSeats":5,"si":0,"no":5,"abstencion":0,"noVota":0,"color":"#10b981"},{"groupName":"G.P. Mixto (Podemos/BNG/CC/UPN)","totalSeats":7,"si":0,"no":2,"abstencion":5,"noVota":0,"color":"#8b5cf6"}],
    bocgUrl: "https://www.congreso.es/datos-abiertos",
    expedienteNumber: "121/20260326",
  },
  {
    id: "congreso-2026-03-26-12",
    title: "Nueva ley contra la multirreincidencia: cambios en la justicia",
    officialTitle: "Votación de conjunto de la Proposición de Ley Orgánica en materia de multirreincidencia, por la que se modifica la Ley Orgánica 10/1995, de 23 de noviembre, del Código Penal, la Ley de Enjuiciamiento Criminal, aprobada por Real Decreto de 14 de septiembre de 1882 y la Ley Orgánica 4/2000, de 11 de enero, sobre derechos y libertades de los extranjeros en España y su integración social (antes denominada Proposición de Ley Orgánica en materia de multirreincidencia, por la que se modifica la Ley Orgánica 10/1995, de 23 de noviembre, del Código Penal y la Ley de Enjuiciamiento Criminal, aprobada por Real Decreto de 14 de septiembre de 1882), por tener la misma carácter orgánico.",
    chamber: "congreso",
    date: "2026-03-26",
    time: "18:00 h",
    type: "proposicion_ley",
    status: "aprobado",
    category: "Justicia",
    summary: "El Congreso votará esta ley para endurecer las sanciones a los criminales reincidentes, buscando proteger a la sociedad. Los cambios podrían mejorar la seguridad, pero también generar preocupaciones sobre la justicia y discriminación.",
    isOmnibus: false,
    threeKeys: {
      "what": "Modifica leyes para penalizar más duramente a reincidentes delictivos.",
      "pocket": "No afecta directamente al bolsillo, pero puede influir en la seguridad y costos judiciales a largo plazo.",
      "clash": "Defensores argumentan que es necesario para disuadir delincuencia, mientras que opositores temen que sea una forma de discriminación."
},
    beforeVsAfter: {
      "before": "Antes, la justicia trataba reincidentes con medidas generales.",
      "after": "Ahora, reincidentes delictivos enfrentarán penas más severas y duraderas."
},
    measures: [
      {
            "id": "congreso-2026-03-26-12-m1",
            "title": "Penalización más severa para reincidentes",
            "category": "Crimen",
            "plainDescription": "Establece penas más duraderas y severas para aquellos que cometen delitos repetidamente.",
            "whoIsAffected": [
                  "Reincidentes delictivos"
            ],
            "realWorldExample": "Juan, un reincidente, antes podría haber sido condenado a 3 años de prisión, pero ahora enfrentará una condena de 5 años, lo que afectará su vida laboral y personal a largo plazo.",
            "argumentsPro": [
                  "Disuadiría el crimen y protegería a la sociedad de reincidentes peligrosos",
                  "Reduciría la reincidencia al aumentar las consecuencias de la delincuencia"
            ],
            "argumentsContra": [
                  "Podría ser visto como una forma de discriminación contra aquellos que ya han pagado su deuda social",
                  "Aumentaría la carga de la justicia penal sin garantizar una disuasión efectiva"
            ]
      }
],
    votesSummary: {"si":272,"no":71,"abstencion":7,"noVota":0,"total":350},
    groupVotes: [{"groupName":"G.P. Popular (PP)","totalSeats":137,"si":137,"no":0,"abstencion":0,"noVota":0,"color":"#0ea5e9"},{"groupName":"G.P. Socialista (PSOE)","totalSeats":121,"si":121,"no":0,"abstencion":0,"noVota":0,"color":"#ef4444"},{"groupName":"G.P. VOX","totalSeats":33,"si":14,"no":19,"abstencion":0,"noVota":0,"color":"#22c55e"},{"groupName":"G.P. Plurinacional Sumar","totalSeats":27,"si":0,"no":27,"abstencion":0,"noVota":0,"color":"#ec4899"},{"groupName":"G.P. Republicano (ERC)","totalSeats":7,"si":0,"no":7,"abstencion":0,"noVota":0,"color":"#f59e0b"},{"groupName":"G.P. Junts per Catalunya","totalSeats":7,"si":0,"no":7,"abstencion":0,"noVota":0,"color":"#06b6d4"},{"groupName":"G.P. Euskal Herria Bildu","totalSeats":6,"si":0,"no":6,"abstencion":0,"noVota":0,"color":"#84cc16"},{"groupName":"G.P. Vasco (EAJ-PNV)","totalSeats":5,"si":0,"no":5,"abstencion":0,"noVota":0,"color":"#10b981"},{"groupName":"G.P. Mixto (Podemos/BNG/CC/UPN)","totalSeats":7,"si":0,"no":0,"abstencion":7,"noVota":0,"color":"#8b5cf6"}],
    bocgUrl: "https://www.congreso.es/datos-abiertos",
    expedienteNumber: "121/20260326",
  },
  {
    id: "congreso-2026-03-26-13",
    title: "Economía social: un impulso para todos",
    officialTitle: "Proyecto de Ley integral de impulso de la economía social.",
    chamber: "congreso",
    date: "2026-03-26",
    time: "18:00 h",
    type: "proyecto_ley",
    status: "rechazado",
    category: "Empleo",
    summary: "El Congreso aprueba un proyecto que promueve la economía social, beneficiando a trabajadores y consumidores. Esto implica mejoras en la calidad de vida y el acceso a empleo de calidad.",
    isOmnibus: false,
    threeKeys: {
      "what": "Fomenta cooperativas y empresas solidarias para crear empleo de calidad.",
      "pocket": "Ayuda a familias con bajos ingresos al reducir costes de servicios y productos.",
      "clash": "Defensores ven oportunidades de empleo y desarrollo local, mientras que críticos temen una subvención innecesaria."
},
    beforeVsAfter: {
      "before": "Antes, muchas personas enfrentaban dificultades para encontrar empleo estable.",
      "after": "Ahora, se crean oportunidades laborales en empresas que buscan la sostenibilidad y el bienestar."
},
    measures: [
      {
            "id": "congreso-2026-03-26-13-m1",
            "title": "Subvenciones para cooperativas",
            "category": "Emprendimiento social",
            "plainDescription": "Ofrece financiación a iniciativas que buscan la sostenibilidad y el bienestar comunitario.",
            "whoIsAffected": [
                  "Emprendedores sociales",
                  "Trabajadores de cooperativas"
            ],
            "realWorldExample": "Juan, un joven emprendedor, obtuvo una subvención para abrir una cooperativa de servicios de limpieza, lo que le permitió crear 5 empleos y ofrecer precios más bajos a los clientes.",
            "argumentsPro": [
                  "Genera empleo de calidad y mejora la calidad de vida de los trabajadores",
                  "Fomenta la economía local y la sostenibilidad"
            ],
            "argumentsContra": [
                  "Puede ser visto como una subvención innecesaria",
                  "Puede distorsionar el mercado si no se regula adecuadamente"
            ]
      }
],
    votesSummary: {"si":137,"no":180,"abstencion":33,"noVota":0,"total":350},
    groupVotes: [{"groupName":"G.P. Popular (PP)","totalSeats":137,"si":137,"no":0,"abstencion":0,"noVota":0,"color":"#0ea5e9"},{"groupName":"G.P. Socialista (PSOE)","totalSeats":121,"si":0,"no":121,"abstencion":0,"noVota":0,"color":"#ef4444"},{"groupName":"G.P. VOX","totalSeats":33,"si":0,"no":33,"abstencion":0,"noVota":0,"color":"#22c55e"},{"groupName":"G.P. Plurinacional Sumar","totalSeats":27,"si":0,"no":26,"abstencion":1,"noVota":0,"color":"#ec4899"},{"groupName":"G.P. Republicano (ERC)","totalSeats":7,"si":0,"no":0,"abstencion":7,"noVota":0,"color":"#f59e0b"},{"groupName":"G.P. Junts per Catalunya","totalSeats":7,"si":0,"no":0,"abstencion":7,"noVota":0,"color":"#06b6d4"},{"groupName":"G.P. Euskal Herria Bildu","totalSeats":6,"si":0,"no":0,"abstencion":6,"noVota":0,"color":"#84cc16"},{"groupName":"G.P. Vasco (EAJ-PNV)","totalSeats":5,"si":0,"no":0,"abstencion":5,"noVota":0,"color":"#10b981"},{"groupName":"G.P. Mixto (Podemos/BNG/CC/UPN)","totalSeats":7,"si":0,"no":0,"abstencion":7,"noVota":0,"color":"#8b5cf6"}],
    bocgUrl: "https://www.congreso.es/datos-abiertos",
    expedienteNumber: "121/20260326",
  },
  {
    id: "congreso-2026-03-26-14",
    title: "Plan Integral para Aliviar la Crisis en Oriente Medio",
    officialTitle: "Real Decreto-ley 7/2026, de 20 de marzo, por el que se aprueba el Plan Integral de Respuesta a la Crisis en Oriente Medio.",
    chamber: "congreso",
    date: "2026-03-26",
    time: "18:00 h",
    type: "real_decreto_ley",
    status: "aprobado",
    category: "Vivienda",
    summary: "El Congreso aprueba un plan integral para aliviar la crisis en Oriente Medio, protegiendo a los inquilinos y regulando el mercado del alquiler para evitar subidas abusivas.",
    isOmnibus: true,
    threeKeys: {
      "what": "Medidas para proteger a los inquilinos y promover la estabilidad en el alquiler.",
      "pocket": "Ayuda económica para los inquilinos y regulación para evitar subidas abusivas de precios.",
      "clash": "Inquilinos preocupados por el coste de vida y propietarios que buscan proteger sus inversiones."
},
    beforeVsAfter: {
      "before": "Antes, los inquilinos enfrentaban subidas de precios del alquiler y el riesgo de desahucio.",
      "after": "Ahora, se establecen mecanismos para proteger a los inquilinos y regular el mercado del alquiler."
},
    measures: [
      {
            "id": "congreso-2026-03-26-14-m1",
            "title": "Regulación del Alquiler",
            "category": "Vivienda",
            "plainDescription": "Se establecen límites máximos de subida de precios del alquiler y se protegen a los inquilinos de desahucios injustificados.",
            "whoIsAffected": [
                  "Inquilinos",
                  "Propietarios con inmuebles en zonas de alta demanda"
            ],
            "realWorldExample": "Juan, un inquilino, ve cómo su alquiler se mantiene estable a pesar de la inflación, mientras que María, propietaria de un piso en un barrio turístico, se ve obligada a regular sus precios para evitar subidas abusivas.",
            "argumentsPro": [
                  "Protección de los inquilinos",
                  "Estabilidad en el mercado del alquiler"
            ],
            "argumentsContra": [
                  "Influencia negativa en la inversión inmobiliaria",
                  "Riesgo de escasez de alquileres en zonas turísticas"
            ]
      }
],
    votesSummary: {"si":175,"no":33,"abstencion":141,"noVota":1,"total":350},
    groupVotes: [{"groupName":"G.P. Popular (PP)","totalSeats":137,"si":137,"no":0,"abstencion":0,"noVota":0,"color":"#0ea5e9"},{"groupName":"G.P. Socialista (PSOE)","totalSeats":121,"si":38,"no":33,"abstencion":50,"noVota":0,"color":"#ef4444"},{"groupName":"G.P. VOX","totalSeats":33,"si":0,"no":0,"abstencion":33,"noVota":0,"color":"#22c55e"},{"groupName":"G.P. Plurinacional Sumar","totalSeats":27,"si":0,"no":0,"abstencion":27,"noVota":0,"color":"#ec4899"},{"groupName":"G.P. Republicano (ERC)","totalSeats":7,"si":0,"no":0,"abstencion":7,"noVota":0,"color":"#f59e0b"},{"groupName":"G.P. Junts per Catalunya","totalSeats":7,"si":0,"no":0,"abstencion":7,"noVota":0,"color":"#06b6d4"},{"groupName":"G.P. Euskal Herria Bildu","totalSeats":6,"si":0,"no":0,"abstencion":6,"noVota":0,"color":"#84cc16"},{"groupName":"G.P. Vasco (EAJ-PNV)","totalSeats":5,"si":0,"no":0,"abstencion":5,"noVota":0,"color":"#10b981"},{"groupName":"G.P. Mixto (Podemos/BNG/CC/UPN)","totalSeats":7,"si":0,"no":0,"abstencion":6,"noVota":1,"color":"#8b5cf6"}],
    bocgUrl: "https://www.congreso.es/datos-abiertos",
    expedienteNumber: "121/20260326",
  },
  {
    id: "congreso-2026-03-26-15",
    title: "Plan de Urgencia para Aliviar la Crisis en Oriente Medio",
    officialTitle: "Tramitación como Proyecto de Ley por el procedimiento de urgencia del Real Decreto-ley 7/2026, de 20 de marzo, por el que se aprueba el Plan Integral de Respuesta a la Crisis en Oriente Medio.",
    chamber: "congreso",
    date: "2026-03-26",
    time: "18:00 h",
    type: "real_decreto_ley",
    status: "aprobado",
    category: "Vivienda",
    summary: "El Congreso aprueba medidas urgentes para ayudar a familias afectadas por la crisis en Oriente Medio, incluyendo subvenciones para energía y suministros esenciales, mejorando la situación de los más vulnerables.",
    isOmnibus: true,
    threeKeys: {
      "what": "Medidas urgentes para mitigar la crisis en zonas conflictivas.",
      "pocket": "Ayuda a familias con menores costos de energía y suministros básicos.",
      "clash": "Inquilinos temen subidas de precios mientras propietarios buscan estabilidad."
},
    beforeVsAfter: {
      "before": "Antes, familias en zonas afectadas vivían con incertidumbre y altos costos.",
      "after": "Ahora, se espera un alivio en gastos básicos, mejorando la calidad de vida."
},
    measures: [
      {
            "id": "congreso-2026-03-26-15-m1",
            "title": "Subvenciones para suministros básicos",
            "category": "Ayuda humanitaria",
            "plainDescription": "Se otorgan subvenciones para reducir los costos de energía y suministros esenciales.",
            "whoIsAffected": [
                  "Familias con menores ingresos",
                  "Personas en situación de vulnerabilidad"
            ],
            "realWorldExample": "María, una madre soltera, recibirá una ayuda de 100 euros mensuales para cubrir los gastos de luz y gas, lo que le permitirá destinar esos recursos a otros aspectos esenciales de su hogar.",
            "argumentsPro": [
                  "Ayuda a reducir el estrés financiero en situaciones de crisis",
                  "Permite a familias destinar recursos a otros aspectos esenciales"
            ],
            "argumentsContra": [
                  "Posible aumento de la demanda de suministros, lo que podría incrementar los precios",
                  "Necesidad de supervisión para evitar abusos"
            ]
      }
],
    votesSummary: {"si":346,"no":0,"abstencion":0,"noVota":4,"total":350},
    groupVotes: [{"groupName":"G.P. Popular (PP)","totalSeats":137,"si":137,"no":0,"abstencion":0,"noVota":0,"color":"#0ea5e9"},{"groupName":"G.P. Socialista (PSOE)","totalSeats":121,"si":121,"no":0,"abstencion":0,"noVota":0,"color":"#ef4444"},{"groupName":"G.P. VOX","totalSeats":33,"si":33,"no":0,"abstencion":0,"noVota":0,"color":"#22c55e"},{"groupName":"G.P. Plurinacional Sumar","totalSeats":27,"si":27,"no":0,"abstencion":0,"noVota":0,"color":"#ec4899"},{"groupName":"G.P. Republicano (ERC)","totalSeats":7,"si":7,"no":0,"abstencion":0,"noVota":0,"color":"#f59e0b"},{"groupName":"G.P. Junts per Catalunya","totalSeats":7,"si":7,"no":0,"abstencion":0,"noVota":0,"color":"#06b6d4"},{"groupName":"G.P. Euskal Herria Bildu","totalSeats":6,"si":6,"no":0,"abstencion":0,"noVota":0,"color":"#84cc16"},{"groupName":"G.P. Vasco (EAJ-PNV)","totalSeats":5,"si":5,"no":0,"abstencion":0,"noVota":0,"color":"#10b981"},{"groupName":"G.P. Mixto (Podemos/BNG/CC/UPN)","totalSeats":7,"si":3,"no":0,"abstencion":0,"noVota":4,"color":"#8b5cf6"}],
    bocgUrl: "https://www.congreso.es/datos-abiertos",
    expedienteNumber: "121/20260326",
  },
  {
    id: "congreso-2026-03-25-1",
    title: "Nueva regulación para energías renovables en zonas rurales",
    officialTitle: "Real Decreto-ley 4/2026, de 17 de marzo, por el que se regula el despliegue ordenado de instalaciones de energía renovable y compensaciones a municipios rurales afectados.",
    chamber: "congreso",
    date: "2026-03-25",
    time: "16:45 h",
    type: "real_decreto_ley",
    status: "aprobado",
    category: "Energía",
    summary: "El Real Decreto-ley 4/2026 regula la instalación de energías renovables en zonas rurales y ofrece compensaciones a los municipios afectados, promoviendo la transición energética y reduciendo costos.",
    isOmnibus: false,
    threeKeys: {
      "what": "Regula el despliegue de instalaciones renovables y ofrece compensaciones a municipios rurales.",
      "pocket": "Los municipios podrán recibir hasta 500.000 euros en compensaciones, reduciendo costos de infraestructura.",
      "clash": "Proponentes argumentan que esta medida fomentará la energía renovable, mientras la oposición teme que pueda retrasar proyectos."
},
    beforeVsAfter: {
      "before": "Antes, no existía un marco específico para la instalación de energías renovables en zonas rurales.",
      "after": "Ahora, se establecen normas para el despliegue ordenado de instalaciones y se ofrecen compensaciones."
},
    measures: [
      {
            "id": "congreso-2026-03-25-1-m1",
            "title": "Despliegue ordenado de instalaciones de energía renovable",
            "category": "Instalaciones renovables",
            "plainDescription": "Establece procedimientos para la instalación de energías renovables en zonas rurales, asegurando su ordenado desarrollo.",
            "whoIsAffected": [
                  "Empresas de energía",
                  "Municipios rurales"
            ],
            "realWorldExample": "Una empresa de energía recibirá permisos para instalar paneles solares en un municipio rural, reduciendo costos de infraestructura en 300.000 euros.",
            "argumentsPro": [
                  "Fomenta la producción de energía limpia",
                  "Reduce la dependencia de energías no renovables"
            ],
            "argumentsContra": [
                  "Puede retrasar proyectos de energía renovable",
                  "Exige un esfuerzo adicional en la planificación"
            ]
      }
],
    votesSummary: {"si":176,"no":172,"abstencion":2,"noVota":0,"total":350},
    groupVotes: [{"groupName":"G.P. Popular (PP)","totalSeats":137,"si":137,"no":0,"abstencion":0,"noVota":0,"color":"#0ea5e9"},{"groupName":"G.P. Socialista (PSOE)","totalSeats":121,"si":39,"no":82,"abstencion":0,"noVota":0,"color":"#ef4444"},{"groupName":"G.P. VOX","totalSeats":33,"si":0,"no":33,"abstencion":0,"noVota":0,"color":"#22c55e"},{"groupName":"G.P. Plurinacional Sumar","totalSeats":27,"si":0,"no":27,"abstencion":0,"noVota":0,"color":"#ec4899"},{"groupName":"G.P. Republicano (ERC)","totalSeats":7,"si":0,"no":7,"abstencion":0,"noVota":0,"color":"#f59e0b"},{"groupName":"G.P. Junts per Catalunya","totalSeats":7,"si":0,"no":7,"abstencion":0,"noVota":0,"color":"#06b6d4"},{"groupName":"G.P. Euskal Herria Bildu","totalSeats":6,"si":0,"no":6,"abstencion":0,"noVota":0,"color":"#84cc16"},{"groupName":"G.P. Vasco (EAJ-PNV)","totalSeats":5,"si":0,"no":5,"abstencion":0,"noVota":0,"color":"#10b981"},{"groupName":"G.P. Mixto (Podemos/BNG/CC/UPN)","totalSeats":7,"si":0,"no":5,"abstencion":2,"noVota":0,"color":"#8b5cf6"}],
    bocgUrl: "https://www.congreso.es/datos-abiertos",
    expedienteNumber: "130/000042",
  },
  {
    id: "congreso-2026-03-24-1",
    title: "Ley para proteger a conductores y peatones",
    officialTitle: "Proposición de Ley del Grupo Parlamentario Socialista, Orgánica de modificación del artículo 379.1 del Código Penal, sobre conducción a velocidad superior a la permitida reglamentariamente.",
    chamber: "congreso",
    date: "2026-03-24",
    time: "18:00 h",
    type: "proposicion_ley",
    status: "aprobado",
    category: "Tráfico",
    summary: "El Congreso aprueba una ley para limitar la velocidad en zonas urbanas, mejorando la seguridad vial y reduciendo accidentes. Esto supone un cambio positivo en la calidad de vida de los ciudadanos.",
    isOmnibus: false,
    threeKeys: {
      "what": "Limita la velocidad para proteger a conductores y peatones.",
      "pocket": "Reducción de siniestralidad vial y costes sanitarios, mejorando la calidad de vida.",
      "clash": "Defensores de la seguridad veen la medida como necesaria, mientras que conductores temen restricciones innecesarias."
},
    beforeVsAfter: {
      "before": "Antes, accidentes frecuentes y costos sanitarios elevados.",
      "after": "Después, vías más seguras y menos siniestralidad vial."
},
    measures: [
      {
            "id": "congreso-2026-03-24-1-m1",
            "title": "Limitación de velocidad en zonas urbanas",
            "category": "Seguridad vial",
            "plainDescription": "Establece una velocidad máxima de 30 km/h en calles residenciales y zonas peatonales para proteger a conductores y peatones.",
            "whoIsAffected": [
                  "Conductores de vehículos ligeros",
                  "Peatones",
                  "Padres con niños"
            ],
            "realWorldExample": "Juan, un padre de familia, se siente más tranquilo conduciendo por la calle de su barrio, donde ahora limitan la velocidad a 30 km/h. Esto le permite a su hijo, que va al colegio a pie, cruzar la calle con mayor seguridad.",
            "argumentsPro": [
                  "Mayor seguridad para peatones y conductores",
                  "Reducción de siniestralidad vial"
            ],
            "argumentsContra": [
                  "Restricción de libertad de circulación",
                  "Posible aumento del tráfico en zonas comerciales"
            ]
      }
],
    votesSummary: {"si":176,"no":33,"abstencion":138,"noVota":3,"total":350},
    groupVotes: [{"groupName":"G.P. Popular (PP)","totalSeats":137,"si":137,"no":0,"abstencion":0,"noVota":0,"color":"#0ea5e9"},{"groupName":"G.P. Socialista (PSOE)","totalSeats":121,"si":39,"no":33,"abstencion":49,"noVota":0,"color":"#ef4444"},{"groupName":"G.P. VOX","totalSeats":33,"si":0,"no":0,"abstencion":33,"noVota":0,"color":"#22c55e"},{"groupName":"G.P. Plurinacional Sumar","totalSeats":27,"si":0,"no":0,"abstencion":27,"noVota":0,"color":"#ec4899"},{"groupName":"G.P. Republicano (ERC)","totalSeats":7,"si":0,"no":0,"abstencion":7,"noVota":0,"color":"#f59e0b"},{"groupName":"G.P. Junts per Catalunya","totalSeats":7,"si":0,"no":0,"abstencion":7,"noVota":0,"color":"#06b6d4"},{"groupName":"G.P. Euskal Herria Bildu","totalSeats":6,"si":0,"no":0,"abstencion":6,"noVota":0,"color":"#84cc16"},{"groupName":"G.P. Vasco (EAJ-PNV)","totalSeats":5,"si":0,"no":0,"abstencion":5,"noVota":0,"color":"#10b981"},{"groupName":"G.P. Mixto (Podemos/BNG/CC/UPN)","totalSeats":7,"si":0,"no":0,"abstencion":4,"noVota":3,"color":"#8b5cf6"}],
    bocgUrl: "https://www.congreso.es/datos-abiertos",
    expedienteNumber: "121/20260324",
  },
  {
    id: "congreso-2026-03-24-2",
    title: "Seguros Agrarios para Proteger Ingresos",
    officialTitle: "Proposición de Ley del Grupo Parlamentario Popular en el Congreso, relativa a la modificación de la Ley 87/1978, de 28 de diciembre, de Seguros Agrarios Combinados, para establecer seguros sobre los ingresos y las rentas, y reforzar la sostenibilidad de las producciones agrarias.",
    chamber: "congreso",
    date: "2026-03-24",
    time: "18:00 h",
    type: "proposicion_ley",
    status: "aprobado",
    category: "Agricultura",
    summary: "El Congreso discute una nueva ley que introduce seguros agrarios para proteger los ingresos de los productores, mejorando su estabilidad económica. Esto beneficiará a los agricultores que podrán enfrentar mejor los años de mala cosecha.",
    isOmnibus: false,
    threeKeys: {
      "what": "Establece seguros sobre ingresos agrícolas para proteger a los productores.",
      "pocket": "Ayuda a los agricultores a mantenerse económicamente, especialmente en años de malas cosechas.",
      "clash": "Los agricultores buscan seguridad económica, mientras que los inversores temen un aumento en los costos."
},
    beforeVsAfter: {
      "before": "Antes, los agricultores corrían el riesgo de perder ingresos en años de malas cosechas.",
      "after": "Ahora, tendrán la tranquilidad de contar con seguros que ayudan a cubrir sus ingresos."
},
    measures: [
      {
            "id": "congreso-2026-03-24-2-m1",
            "title": "Seguros Agrarios para Ingresos",
            "category": "Seguridad Económica",
            "plainDescription": "La medida busca proteger a los agricultores de los riesgos económicos mediante seguros que cubren sus ingresos en años de mala cosecha.",
            "whoIsAffected": [
                  "Agricultores",
                  "Pequeños propietarios"
            ],
            "realWorldExample": "Juan, un agricultor de 50 años, ha visto cómo sus ingresos han fluctuado significativamente en los últimos años debido a las variaciones climáticas. Con la nueva ley, podría contar con un seguro que le permita mantenerse económicamente, incluso en años de mala cosecha, asegurando que su familia no sufra por las fluctuaciones del mercado.",
            "argumentsPro": [
                  "Ayuda a mantener la estabilidad económica de los agricultores",
                  "Permite a los agricultores invertir con más confianza"
            ],
            "argumentsContra": [
                  "Podría aumentar los costos de producción",
                  "Puede que los seguros no cubran completamente las pérdidas"
            ]
      }
],
    votesSummary: {"si":192,"no":154,"abstencion":1,"noVota":3,"total":350},
    groupVotes: [{"groupName":"G.P. Popular (PP)","totalSeats":137,"si":137,"no":0,"abstencion":0,"noVota":0,"color":"#0ea5e9"},{"groupName":"G.P. Socialista (PSOE)","totalSeats":121,"si":55,"no":66,"abstencion":0,"noVota":0,"color":"#ef4444"},{"groupName":"G.P. VOX","totalSeats":33,"si":0,"no":33,"abstencion":0,"noVota":0,"color":"#22c55e"},{"groupName":"G.P. Plurinacional Sumar","totalSeats":27,"si":0,"no":27,"abstencion":0,"noVota":0,"color":"#ec4899"},{"groupName":"G.P. Republicano (ERC)","totalSeats":7,"si":0,"no":7,"abstencion":0,"noVota":0,"color":"#f59e0b"},{"groupName":"G.P. Junts per Catalunya","totalSeats":7,"si":0,"no":7,"abstencion":0,"noVota":0,"color":"#06b6d4"},{"groupName":"G.P. Euskal Herria Bildu","totalSeats":6,"si":0,"no":6,"abstencion":0,"noVota":0,"color":"#84cc16"},{"groupName":"G.P. Vasco (EAJ-PNV)","totalSeats":5,"si":0,"no":5,"abstencion":0,"noVota":0,"color":"#10b981"},{"groupName":"G.P. Mixto (Podemos/BNG/CC/UPN)","totalSeats":7,"si":0,"no":3,"abstencion":1,"noVota":3,"color":"#8b5cf6"}],
    bocgUrl: "https://www.congreso.es/datos-abiertos",
    expedienteNumber: "121/20260324",
  },
  {
    id: "congreso-2026-03-18-1",
    title: "Libertad de expresión: un paso hacia la transparencia",
    officialTitle: "Proposición no de Ley del Grupo Parlamentario Socialista, para la defensa de la libertad de información y expresión.\nSe vota en los términos de la enmienda transaccional presentada por el Grupo Parlamentario Socialista y el Grupo Parlamentario Mixto (Sra. Belarra Urteaga).",
    chamber: "congreso",
    date: "2026-03-18",
    time: "18:00 h",
    type: "mocion",
    status: "aprobado",
    category: "Justicia",
    summary: "El Congreso vota por una enmienda que busca proteger la libertad de información y expresión, mejorando la transparencia y la confianza en la democracia.",
    isOmnibus: false,
    threeKeys: {
      "what": "Establece regulaciones para proteger la libertad de información y expresión.",
      "pocket": "Ayuda a garantizar que la información sea accesible, sin temor a represalias.",
      "clash": "Defensores argumentan que es crucial para la democracia, mientras que críticos temen que pueda socavar la seguridad nacional."
},
    beforeVsAfter: {
      "before": "Antes, la libertad de expresión estaba en riesgo debido a amenazas y censura.",
      "after": "Ahora, los periodistas y ciudadanos pueden expresarse con mayor seguridad."
},
    measures: [
      {
            "id": "congreso-2026-03-18-1-m1",
            "title": "Garantía de protección para periodistas",
            "category": "Medios de comunicación",
            "plainDescription": "Establece medidas para proteger a los periodistas y garantizar su derecho a informar libremente.",
            "whoIsAffected": [
                  "Periodistas",
                  "Ciudadanos que buscan información libre"
            ],
            "realWorldExample": "María, una periodista local, puede informar sobre corrupción municipal sin temor a represalias, protegida por esta ley. Esto permite a la comunidad estar mejor informada y participar en la toma de decisiones.",
            "argumentsPro": [
                  "Permitiría a los periodistas informar libremente sin temor a represalias",
                  "Fomentaría la transparencia y la participación ciudadana"
            ],
            "argumentsContra": [
                  "Podría ser utilizado para socavar la seguridad nacional",
                  "Puede generar un clima de inseguridad"
            ]
      }
],
    votesSummary: {"si":178,"no":170,"abstencion":0,"noVota":2,"total":350},
    groupVotes: [{"groupName":"G.P. Popular (PP)","totalSeats":137,"si":137,"no":0,"abstencion":0,"noVota":0,"color":"#0ea5e9"},{"groupName":"G.P. Socialista (PSOE)","totalSeats":121,"si":41,"no":80,"abstencion":0,"noVota":0,"color":"#ef4444"},{"groupName":"G.P. VOX","totalSeats":33,"si":0,"no":33,"abstencion":0,"noVota":0,"color":"#22c55e"},{"groupName":"G.P. Plurinacional Sumar","totalSeats":27,"si":0,"no":27,"abstencion":0,"noVota":0,"color":"#ec4899"},{"groupName":"G.P. Republicano (ERC)","totalSeats":7,"si":0,"no":7,"abstencion":0,"noVota":0,"color":"#f59e0b"},{"groupName":"G.P. Junts per Catalunya","totalSeats":7,"si":0,"no":7,"abstencion":0,"noVota":0,"color":"#06b6d4"},{"groupName":"G.P. Euskal Herria Bildu","totalSeats":6,"si":0,"no":6,"abstencion":0,"noVota":0,"color":"#84cc16"},{"groupName":"G.P. Vasco (EAJ-PNV)","totalSeats":5,"si":0,"no":5,"abstencion":0,"noVota":0,"color":"#10b981"},{"groupName":"G.P. Mixto (Podemos/BNG/CC/UPN)","totalSeats":7,"si":0,"no":5,"abstencion":0,"noVota":2,"color":"#8b5cf6"}],
    bocgUrl: "https://www.congreso.es/datos-abiertos",
    expedienteNumber: "121/20260318",
  },
  {
    id: "congreso-2026-03-18-2",
    title: "Defensa de cristianos perseguidos: una medida con impacto global",
    officialTitle: "Proposición no de Ley del Grupo Parlamentario Popular en el Congreso, relativa a la defensa de los cristianos perseguidos en el mundo y la acción internacional para frenar las masacres por motivos religiosos.",
    chamber: "congreso",
    date: "2026-03-18",
    time: "18:00 h",
    type: "mocion",
    status: "aprobado",
    category: "Justicia",
    summary: "El Congreso debate una propuesta para defender a cristianos perseguidos, lo que podría mejorar su seguridad y bienestar en países en conflicto.",
    isOmnibus: false,
    threeKeys: {
      "what": "La iniciativa busca proteger a cristianos en peligro y frenar masacres religiosas.",
      "pocket": "No afecta directamente al bolsillo de los ciudadanos, pero su impacto humanitario es significativo.",
      "clash": "Defensores argumentan la necesidad de actuar frente a crímenes de odio, mientras detractores temen que pueda interferir en relaciones internacionales."
},
    beforeVsAfter: {
      "before": "Antes, los cristianos perseguidos en países como Siria o Nigeria vivían en constante peligro.",
      "after": "Con la nueva regulación, se espera una mayor protección y asistencia para estas comunidades."
},
    measures: [
      {
            "id": "congreso-2026-03-18-2-m1",
            "title": "Acción internacional para proteger a cristianos perseguidos",
            "category": "Relaciones internacionales",
            "plainDescription": "La medida busca coordinar esfuerzos internacionales para proteger a cristianos en peligro y combatir masacres religiosas.",
            "whoIsAffected": [
                  "Cristianos perseguidos en países como Siria, Nigeria y Egipto",
                  "Organizaciones de ayuda humanitaria"
            ],
            "realWorldExample": "Juan, un sacerdote sirio, podría recibir asistencia para establecer un centro de refugio seguro para otras familias cristianas, lo que les permitiría vivir con mayor tranquilidad y acceso a servicios básicos.",
            "argumentsPro": [
                  "Proteger a minorías religiosas es una cuestión de derechos humanos",
                  "Frenar masacres religiosas contribuye a la estabilidad global"
            ],
            "argumentsContra": [
                  "Puede generar tensiones con países que no apoyan estas medidas",
                  "Hay que ser prudentes para no interferir en asuntos internos de otros países"
            ]
      }
],
    votesSummary: {"si":169,"no":3,"abstencion":176,"noVota":2,"total":350},
    groupVotes: [{"groupName":"G.P. Popular (PP)","totalSeats":137,"si":137,"no":0,"abstencion":0,"noVota":0,"color":"#0ea5e9"},{"groupName":"G.P. Socialista (PSOE)","totalSeats":121,"si":32,"no":3,"abstencion":86,"noVota":0,"color":"#ef4444"},{"groupName":"G.P. VOX","totalSeats":33,"si":0,"no":0,"abstencion":33,"noVota":0,"color":"#22c55e"},{"groupName":"G.P. Plurinacional Sumar","totalSeats":27,"si":0,"no":0,"abstencion":27,"noVota":0,"color":"#ec4899"},{"groupName":"G.P. Republicano (ERC)","totalSeats":7,"si":0,"no":0,"abstencion":7,"noVota":0,"color":"#f59e0b"},{"groupName":"G.P. Junts per Catalunya","totalSeats":7,"si":0,"no":0,"abstencion":7,"noVota":0,"color":"#06b6d4"},{"groupName":"G.P. Euskal Herria Bildu","totalSeats":6,"si":0,"no":0,"abstencion":6,"noVota":0,"color":"#84cc16"},{"groupName":"G.P. Vasco (EAJ-PNV)","totalSeats":5,"si":0,"no":0,"abstencion":5,"noVota":0,"color":"#10b981"},{"groupName":"G.P. Mixto (Podemos/BNG/CC/UPN)","totalSeats":7,"si":0,"no":0,"abstencion":5,"noVota":2,"color":"#8b5cf6"}],
    bocgUrl: "https://www.congreso.es/datos-abiertos",
    expedienteNumber: "121/20260318",
  },
  {
    id: "congreso-2026-03-18-3",
    title: "Migración: Ley Urgente para Proteger a Refugiados",
    officialTitle: "Moción consecuencia de interpelación urgente del Grupo Parlamentario Popular en el Congreso, sobre la política en materia de migración del Gobierno.",
    chamber: "congreso",
    date: "2026-03-18",
    time: "18:00 h",
    type: "mocion",
    status: "aprobado",
    category: "Empleo",
    summary: "El Congreso vota una ley urgente que busca integrar a refugiados en el mercado laboral, mejorando su calidad de vida y la economía local.",
    isOmnibus: false,
    threeKeys: {
      "what": "Establece un programa de integración laboral para refugiados.",
      "pocket": "Ayuda a refugiados a encontrar trabajo, mejorando su calidad de vida y reduciendo la dependencia económica.",
      "clash": "Defensores argumentan que es crucial para la integración social, mientras que críticos temen que pueda afectar el empleo de ciudadanos locales."
},
    beforeVsAfter: {
      "before": "Antes, refugiados enfrentaban dificultades para acceder al mercado laboral.",
      "after": "Ahora, podrán participar más fácilmente en el trabajo, contribuyendo a la economía y a su propia estabilidad."
},
    measures: [
      {
            "id": "congreso-2026-03-18-3-m1",
            "title": "Programa de Integración Laboral",
            "category": "Empleo",
            "plainDescription": "Ofrece formación y orientación laboral a refugiados para facilitar su acceso al mercado laboral.",
            "whoIsAffected": [
                  "Refugiados recién llegados",
                  "Empresas que buscan diversificar su personal"
            ],
            "realWorldExample": "Juan, un refugiado de Siria, recibe formación en cocina y encuentra trabajo en una empresa local de catering, mejorando su situación económica y contribuyendo a la diversidad cultural de la ciudad.",
            "argumentsPro": [
                  "Ayuda a los refugiados a ser autónomos y contribuir económicamente",
                  "Fomenta la diversidad cultural y el intercambio de conocimientos"
            ],
            "argumentsContra": [
                  "Puede ser visto como una competencia para los trabajadores locales",
                  "Se teme que la formación pueda ser insuficiente para cubrir todas las necesidades del mercado laboral"
            ]
      }
],
    votesSummary: {"si":176,"no":172,"abstencion":0,"noVota":2,"total":350},
    groupVotes: [{"groupName":"G.P. Popular (PP)","totalSeats":137,"si":137,"no":0,"abstencion":0,"noVota":0,"color":"#0ea5e9"},{"groupName":"G.P. Socialista (PSOE)","totalSeats":121,"si":39,"no":82,"abstencion":0,"noVota":0,"color":"#ef4444"},{"groupName":"G.P. VOX","totalSeats":33,"si":0,"no":33,"abstencion":0,"noVota":0,"color":"#22c55e"},{"groupName":"G.P. Plurinacional Sumar","totalSeats":27,"si":0,"no":27,"abstencion":0,"noVota":0,"color":"#ec4899"},{"groupName":"G.P. Republicano (ERC)","totalSeats":7,"si":0,"no":7,"abstencion":0,"noVota":0,"color":"#f59e0b"},{"groupName":"G.P. Junts per Catalunya","totalSeats":7,"si":0,"no":7,"abstencion":0,"noVota":0,"color":"#06b6d4"},{"groupName":"G.P. Euskal Herria Bildu","totalSeats":6,"si":0,"no":6,"abstencion":0,"noVota":0,"color":"#84cc16"},{"groupName":"G.P. Vasco (EAJ-PNV)","totalSeats":5,"si":0,"no":5,"abstencion":0,"noVota":0,"color":"#10b981"},{"groupName":"G.P. Mixto (Podemos/BNG/CC/UPN)","totalSeats":7,"si":0,"no":5,"abstencion":0,"noVota":2,"color":"#8b5cf6"}],
    bocgUrl: "https://www.congreso.es/datos-abiertos",
    expedienteNumber: "121/20260318",
  },
  {
    id: "congreso-2026-03-18-4",
    title: "Ferrocarriles de alta velocidad: ¿cómo impactarán en Euskal Herria?",
    officialTitle: "Moción consecuencia de interpelación urgente del Grupo Parlamentario Euskal Herria Bildu, relativa a las diferentes alternativas de infraestructuras ferroviarias de altas prestaciones en Euskal Herria y su impacto económico, social y ambiental.",
    chamber: "congreso",
    date: "2026-03-18",
    time: "18:00 h",
    type: "mocion",
    status: "rechazado",
    category: "Tráfico",
    summary: "El Congreso analiza alternativas para infraestructuras ferroviarias de alta velocidad en Euskal Herria. Esto podría beneficiar a los viajeros y comerciantes al reducir los tiempos de desplazamiento y mejorar la conectividad regional.",
    isOmnibus: false,
    threeKeys: {
      "what": "La moción propone estudiar infraestructuras ferroviarias de alta velocidad para Euskal Herria.",
      "pocket": "Los costes y beneficios económicos para la región y sus ciudadanos.",
      "clash": "Los defensores ven oportunidades de desarrollo y conectividad, mientras que los críticos temen el gasto y la deuda."
},
    beforeVsAfter: {
      "before": "Actualmente, los viajeros y comerciantes de Euskal Herria enfrentan largas horas de viaje.",
      "after": "Con la implementación de ferrocarriles de alta velocidad, se reducirán los tiempos de viaje y se mejorarán las conexiones regionales."
},
    measures: [
      {
            "id": "congreso-2026-03-18-4-m1",
            "title": "Estudio de alternativas de infraestructuras ferroviarias de alta velocidad",
            "category": "Transporte",
            "plainDescription": "La moción propone evaluar diferentes opciones para mejorar el sistema ferroviario de alta velocidad en Euskal Herria.",
            "whoIsAffected": [
                  "Viajeros",
                  "Comerciantes",
                  "Autónomos"
            ],
            "realWorldExample": "Juan, un empresario de Bilbao, viaja diariamente a Madrid para reuniones. Con la implementación de ferrocarriles de alta velocidad, podría ahorrar 2 horas de viaje diario, lo que le permitiría dedicar más tiempo a su negocio.",
            "argumentsPro": [
                  "Mejora de la conectividad regional y nacional",
                  "Reducción de la dependencia de otros medios de transporte"
            ],
            "argumentsContra": [
                  "Costo elevado de la inversión",
                  "Posible aumento de la deuda pública"
            ]
      }
],
    votesSummary: {"si":51,"no":298,"abstencion":0,"noVota":1,"total":350},
    groupVotes: [{"groupName":"G.P. Popular (PP)","totalSeats":137,"si":51,"no":86,"abstencion":0,"noVota":0,"color":"#0ea5e9"},{"groupName":"G.P. Socialista (PSOE)","totalSeats":121,"si":0,"no":121,"abstencion":0,"noVota":0,"color":"#ef4444"},{"groupName":"G.P. VOX","totalSeats":33,"si":0,"no":33,"abstencion":0,"noVota":0,"color":"#22c55e"},{"groupName":"G.P. Plurinacional Sumar","totalSeats":27,"si":0,"no":27,"abstencion":0,"noVota":0,"color":"#ec4899"},{"groupName":"G.P. Republicano (ERC)","totalSeats":7,"si":0,"no":7,"abstencion":0,"noVota":0,"color":"#f59e0b"},{"groupName":"G.P. Junts per Catalunya","totalSeats":7,"si":0,"no":7,"abstencion":0,"noVota":0,"color":"#06b6d4"},{"groupName":"G.P. Euskal Herria Bildu","totalSeats":6,"si":0,"no":6,"abstencion":0,"noVota":0,"color":"#84cc16"},{"groupName":"G.P. Vasco (EAJ-PNV)","totalSeats":5,"si":0,"no":5,"abstencion":0,"noVota":0,"color":"#10b981"},{"groupName":"G.P. Mixto (Podemos/BNG/CC/UPN)","totalSeats":7,"si":0,"no":6,"abstencion":0,"noVota":1,"color":"#8b5cf6"}],
    bocgUrl: "https://www.congreso.es/datos-abiertos",
    expedienteNumber: "121/20260318",
  },
  {
    id: "congreso-2026-03-18-5",
    title: "Ayuda inmediata para familias afectadas por el clima",
    officialTitle: "Real Decreto-ley 5/2026, de 17 de febrero, por el que se adoptan medidas urgentes en respuesta a los daños causados por diversos fenómenos meteorológicos adversos, de especial afectación en las comunidades autónomas de Andalucía y Extremadura.",
    chamber: "congreso",
    date: "2026-03-18",
    time: "18:00 h",
    type: "real_decreto_ley",
    status: "aprobado",
    category: "Vivienda",
    summary: "El Congreso aprueba medidas urgentes para ayudar a las familias afectadas por inundaciones y tormentas, proporcionando subvenciones para reparar daños en viviendas. Esto reduce el estrés financiero y permite a los inquilinos recuperarse más rápidamente.",
    isOmnibus: true,
    threeKeys: {
      "what": "Se implementan ayudas urgentes para familias afectadas por inundaciones y tormentas.",
      "pocket": "Los inquilinos recibirán subvenciones para reparar daños en sus viviendas, aliviando el coste inicial.",
      "clash": "Inquilinos temen el coste de reparaciones, mientras que propietarios se preocupan por el mantenimiento de sus inmuebles."
},
    beforeVsAfter: {
      "before": "Antes, los inquilinos enfrentaban costos elevados para reparar daños en sus viviendas.",
      "after": "Ahora, se proporcionan subvenciones para ayudar a los inquilinos a cubrir los costos iniciales de reparación."
},
    measures: [
      {
            "id": "congreso-2026-03-18-5-m1",
            "title": "Subvenciones para reparaciones de viviendas",
            "category": "Ayuda inmediata",
            "plainDescription": "Se otorgan subvenciones para ayudar a los inquilinos a cubrir los costos iniciales de reparación de daños en sus viviendas causados por inundaciones y tormentas.",
            "whoIsAffected": [
                  "Inquilinos de viviendas afectadas por inundaciones y tormentas"
            ],
            "realWorldExample": "María, una inquilina de 35 años, se ve obligada a pagar 5.000 euros para reparar daños en su vivienda causados por una tormenta. Con la subvención, solo tendrá que asumir 2.000 euros, aliviando su carga financiera.",
            "argumentsPro": [
                  "Ayuda a los inquilinos a recuperarse más rápidamente",
                  "Permite a las familias afectadas mantener su hogar sin grandes gastos iniciales"
            ],
            "argumentsContra": [
                  "Puede generar un aumento en los costos de mantenimiento de las viviendas en el futuro",
                  "Incentiva el abandono de viviendas en áreas de riesgo"
            ]
      }
],
    votesSummary: {"si":316,"no":32,"abstencion":0,"noVota":2,"total":350},
    groupVotes: [{"groupName":"G.P. Popular (PP)","totalSeats":137,"si":137,"no":0,"abstencion":0,"noVota":0,"color":"#0ea5e9"},{"groupName":"G.P. Socialista (PSOE)","totalSeats":121,"si":121,"no":0,"abstencion":0,"noVota":0,"color":"#ef4444"},{"groupName":"G.P. VOX","totalSeats":33,"si":33,"no":0,"abstencion":0,"noVota":0,"color":"#22c55e"},{"groupName":"G.P. Plurinacional Sumar","totalSeats":27,"si":25,"no":2,"abstencion":0,"noVota":0,"color":"#ec4899"},{"groupName":"G.P. Republicano (ERC)","totalSeats":7,"si":0,"no":7,"abstencion":0,"noVota":0,"color":"#f59e0b"},{"groupName":"G.P. Junts per Catalunya","totalSeats":7,"si":0,"no":7,"abstencion":0,"noVota":0,"color":"#06b6d4"},{"groupName":"G.P. Euskal Herria Bildu","totalSeats":6,"si":0,"no":6,"abstencion":0,"noVota":0,"color":"#84cc16"},{"groupName":"G.P. Vasco (EAJ-PNV)","totalSeats":5,"si":0,"no":5,"abstencion":0,"noVota":0,"color":"#10b981"},{"groupName":"G.P. Mixto (Podemos/BNG/CC/UPN)","totalSeats":7,"si":0,"no":5,"abstencion":0,"noVota":2,"color":"#8b5cf6"}],
    bocgUrl: "https://www.congreso.es/datos-abiertos",
    expedienteNumber: "121/20260318",
  },
  {
    id: "congreso-2026-03-18-6",
    title: "Medidas urgentes para proteger a los más afectados",
    officialTitle: "Tramitación como Proyecto de Ley por el procedimiento de urgencia del Real Decreto-ley 5/2026, de 17 de febrero, por el que se adoptan medidas urgentes en respuesta a los daños causados por diversos fenómenos meteorológicos adversos, de especial afectación en las comunidades autónomas de Andalucía y Extremadura.",
    chamber: "congreso",
    date: "2026-03-18",
    time: "18:00 h",
    type: "real_decreto_ley",
    status: "aprobado",
    category: "Vivienda",
    summary: "El Congreso aprueba medidas urgentes para proteger a los inquilinos y propietarios afectados por fenómenos meteorológicos. Esto supone un alivio para las familias que han sufrido daños y un cambio positivo en su día a día.",
    isOmnibus: true,
    threeKeys: {
      "what": "Se adoptan medidas para ayudar a los inquilinos y propietarios afectados por fenómenos meteorológicos adversos.",
      "pocket": "Ayudas económicas para alquiler y reparaciones, reduciendo el impacto en el bolsillo de las familias.",
      "clash": "Inquilinos preocupados por el aumento del alquiler y propietarios que temen la subida de impuestos."
},
    beforeVsAfter: {
      "before": "Antes, los inquilinos y propietarios sufrían los daños causados por los fenómenos meteorológicos sin ayudas.",
      "after": "Ahora, se implementan ayudas para mitigar los costes y reparar daños, mejorando la calidad de vida."
},
    measures: [
      {
            "id": "congreso-2026-03-18-6-m1",
            "title": "Ayudas económicas para alquiler y reparaciones",
            "category": "Ayudas",
            "plainDescription": "Se establecen ayudas económicas para cubrir los costes del alquiler y las reparaciones necesarias en viviendas afectadas.",
            "whoIsAffected": [
                  "Inquilinos",
                  "Propietarios"
            ],
            "realWorldExample": "Juan, inquilino de una vivienda en Andalucía, recibió una ayuda de 500 euros para pagar el alquiler del mes y 300 euros para reparar el daño causado por una tormenta. Esto le permitió mantenerse en su hogar sin preocupaciones financieras inmediatas.",
            "argumentsPro": [
                  "Ayuda a mantener la estabilidad en el alquiler para los inquilinos",
                  "Protección del patrimonio inmobiliario de los propietarios"
            ],
            "argumentsContra": [
                  "Inflación de precios del alquiler si se incrementan las ayudas",
                  "Costo fiscal para el Estado"
            ]
      }
],
    votesSummary: {"si":348,"no":0,"abstencion":0,"noVota":2,"total":350},
    groupVotes: [{"groupName":"G.P. Popular (PP)","totalSeats":137,"si":137,"no":0,"abstencion":0,"noVota":0,"color":"#0ea5e9"},{"groupName":"G.P. Socialista (PSOE)","totalSeats":121,"si":121,"no":0,"abstencion":0,"noVota":0,"color":"#ef4444"},{"groupName":"G.P. VOX","totalSeats":33,"si":33,"no":0,"abstencion":0,"noVota":0,"color":"#22c55e"},{"groupName":"G.P. Plurinacional Sumar","totalSeats":27,"si":27,"no":0,"abstencion":0,"noVota":0,"color":"#ec4899"},{"groupName":"G.P. Republicano (ERC)","totalSeats":7,"si":7,"no":0,"abstencion":0,"noVota":0,"color":"#f59e0b"},{"groupName":"G.P. Junts per Catalunya","totalSeats":7,"si":7,"no":0,"abstencion":0,"noVota":0,"color":"#06b6d4"},{"groupName":"G.P. Euskal Herria Bildu","totalSeats":6,"si":6,"no":0,"abstencion":0,"noVota":0,"color":"#84cc16"},{"groupName":"G.P. Vasco (EAJ-PNV)","totalSeats":5,"si":5,"no":0,"abstencion":0,"noVota":0,"color":"#10b981"},{"groupName":"G.P. Mixto (Podemos/BNG/CC/UPN)","totalSeats":7,"si":5,"no":0,"abstencion":0,"noVota":2,"color":"#8b5cf6"}],
    bocgUrl: "https://www.congreso.es/datos-abiertos",
    expedienteNumber: "121/20260318",
  },
  {
    id: "congreso-2026-03-18-7",
    title: "Acuerdo con la UNESCO contra el racismo y la discriminación",
    officialTitle: "Acuerdo entre el Reino de España y la Organización de las Naciones Unidas para la Educación, la Ciencia y la Cultura relativo al IV Foro Global contra el Racismo y la Discriminación, Barcelona, Reino de España, del 9 al 11 de diciembre de 2024, hecho en París el 6 de diciembre de 2024.",
    chamber: "congreso",
    date: "2026-03-18",
    time: "18:00 h",
    type: "proyecto_ley",
    status: "rechazado",
    category: "Justicia",
    summary: "El Congreso aprueba un acuerdo con la UNESCO para participar en el IV Foro Global contra el Racismo y la Discriminación, lo que busca promover una sociedad más justa y equitativa.",
    isOmnibus: false,
    threeKeys: {
      "what": "España participará en el IV Foro Global contra el Racismo y la Discriminación.",
      "pocket": "No afecta directamente el bolsillo de los ciudadanos, pero promueve una sociedad más justa.",
      "clash": "Defensores del acuerdo argumentan que es crucial para combatir la discriminación, mientras que críticos temen que pueda interferir en la soberanía nacional."
},
    beforeVsAfter: {
      "before": "La sociedad española enfrenta desafíos en la lucha contra el racismo y la discriminación.",
      "after": "España participará en un foro global para promover la igualdad y combatir la discriminación."
},
    measures: [
      {
            "id": "congreso-2026-03-18-7-m1",
            "title": "Participación en el IV Foro Global contra el Racismo y la Discriminación",
            "category": "Derechos Humanos",
            "plainDescription": "España se compromete a participar en el foro para promover la igualdad y combatir la discriminación.",
            "whoIsAffected": [
                  "Organizaciones no gubernamentales",
                  "Instituciones educativas",
                  "Comunidades vulnerables"
            ],
            "realWorldExample": "La Asociación de Vecinos de Barcelona organiza un taller para jóvenes sobre la lucha contra la discriminación, beneficiando a más de 50 estudiantes y promoviendo la inclusión en la ciudad.",
            "argumentsPro": [
                  "Fomentar la igualdad y la justicia social",
                  "Mejorar la conciencia y la educación sobre derechos humanos"
            ],
            "argumentsContra": [
                  "Posible interferencia en la soberanía nacional",
                  "Costos administrativos innecesarios"
            ]
      }
],
    votesSummary: {"si":163,"no":170,"abstencion":15,"noVota":2,"total":350},
    groupVotes: [{"groupName":"G.P. Popular (PP)","totalSeats":137,"si":137,"no":0,"abstencion":0,"noVota":0,"color":"#0ea5e9"},{"groupName":"G.P. Socialista (PSOE)","totalSeats":121,"si":26,"no":95,"abstencion":0,"noVota":0,"color":"#ef4444"},{"groupName":"G.P. VOX","totalSeats":33,"si":0,"no":33,"abstencion":0,"noVota":0,"color":"#22c55e"},{"groupName":"G.P. Plurinacional Sumar","totalSeats":27,"si":0,"no":27,"abstencion":0,"noVota":0,"color":"#ec4899"},{"groupName":"G.P. Republicano (ERC)","totalSeats":7,"si":0,"no":7,"abstencion":0,"noVota":0,"color":"#f59e0b"},{"groupName":"G.P. Junts per Catalunya","totalSeats":7,"si":0,"no":7,"abstencion":0,"noVota":0,"color":"#06b6d4"},{"groupName":"G.P. Euskal Herria Bildu","totalSeats":6,"si":0,"no":1,"abstencion":5,"noVota":0,"color":"#84cc16"},{"groupName":"G.P. Vasco (EAJ-PNV)","totalSeats":5,"si":0,"no":0,"abstencion":5,"noVota":0,"color":"#10b981"},{"groupName":"G.P. Mixto (Podemos/BNG/CC/UPN)","totalSeats":7,"si":0,"no":0,"abstencion":5,"noVota":2,"color":"#8b5cf6"}],
    bocgUrl: "https://www.congreso.es/datos-abiertos",
    expedienteNumber: "121/20260318",
  },
  {
    id: "congreso-2026-03-18-8",
    title: "Investigación nuclear en Sevilla: oportunidad para la ciencia y la economía",
    officialTitle: "Acuerdo entre la Unión Europea y la Comunidad Europea de la Energía Atómica, por una parte, y el Reino de España, por otra, relativo al establecimiento del Centro Común de Investigación de la Comisión Europea en Sevilla, hecho en Sevilla el 30 de junio de 2025.",
    chamber: "congreso",
    date: "2026-03-18",
    time: "18:00 h",
    type: "proyecto_ley",
    status: "aprobado",
    category: "Ciencia",
    summary: "El Congreso aprueba el acuerdo para establecer un centro de investigación nuclear en Sevilla, impulsando el desarrollo científico y tecnológico de la ciudad. Esto supone un avance para la ciencia y el bienestar local, aunque plantea preocupaciones sobre la seguridad nuclear.",
    isOmnibus: false,
    threeKeys: {
      "what": "Se establece un centro de investigación nuclear en Sevilla para impulsar la ciencia y la innovación.",
      "pocket": "No afecta directamente el bolsillo de los ciudadanos, pero promete crear empleos y oportunidades de desarrollo tecnológico.",
      "clash": "Los defensores ven este acuerdo como un impulso para la ciencia y el desarrollo local, mientras que algunos temen por la seguridad nuclear."
},
    beforeVsAfter: {
      "before": "Antes, Sevilla carecía de un centro de investigación nuclear, limitando las oportunidades de innovación.",
      "after": "Ahora, la ciudad contará con un centro de investigación que promete generar empleos y fomentar el desarrollo tecnológico."
},
    measures: [
      {
            "id": "congreso-2026-03-18-8-m1",
            "title": "Centro de Investigación Nuclear de Sevilla",
            "category": "Investigación",
            "plainDescription": "El acuerdo establece un centro de investigación nuclear en Sevilla para impulsar la ciencia y el desarrollo tecnológico.",
            "whoIsAffected": [
                  "Investigadores y científicos",
                  "Estudiantes y profesores de universidades"
            ],
            "realWorldExample": "María, una estudiante de física, podrá trabajar en el nuevo centro de investigación nuclear en Sevilla, contribuyendo a proyectos que podrían tener impacto en la energía nuclear sostenible y la medicina radiológica. Su tesis doctoral se beneficiará de las instalaciones avanzadas y la colaboración con expertos internacionales.",
            "argumentsPro": [
                  "Fomento de la ciencia y la innovación",
                  "Generación de empleos en investigación y desarrollo"
            ],
            "argumentsContra": [
                  "Posibles riesgos de seguridad nuclear",
                  "Necesidad de garantizar la transparencia y regulación"
            ]
      }
],
    votesSummary: {"si":301,"no":0,"abstencion":47,"noVota":2,"total":350},
    groupVotes: [{"groupName":"G.P. Popular (PP)","totalSeats":137,"si":137,"no":0,"abstencion":0,"noVota":0,"color":"#0ea5e9"},{"groupName":"G.P. Socialista (PSOE)","totalSeats":121,"si":121,"no":0,"abstencion":0,"noVota":0,"color":"#ef4444"},{"groupName":"G.P. VOX","totalSeats":33,"si":33,"no":0,"abstencion":0,"noVota":0,"color":"#22c55e"},{"groupName":"G.P. Plurinacional Sumar","totalSeats":27,"si":10,"no":0,"abstencion":17,"noVota":0,"color":"#ec4899"},{"groupName":"G.P. Republicano (ERC)","totalSeats":7,"si":0,"no":0,"abstencion":7,"noVota":0,"color":"#f59e0b"},{"groupName":"G.P. Junts per Catalunya","totalSeats":7,"si":0,"no":0,"abstencion":7,"noVota":0,"color":"#06b6d4"},{"groupName":"G.P. Euskal Herria Bildu","totalSeats":6,"si":0,"no":0,"abstencion":6,"noVota":0,"color":"#84cc16"},{"groupName":"G.P. Vasco (EAJ-PNV)","totalSeats":5,"si":0,"no":0,"abstencion":5,"noVota":0,"color":"#10b981"},{"groupName":"G.P. Mixto (Podemos/BNG/CC/UPN)","totalSeats":7,"si":0,"no":0,"abstencion":5,"noVota":2,"color":"#8b5cf6"}],
    bocgUrl: "https://www.congreso.es/datos-abiertos",
    expedienteNumber: "121/20260318",
  },
  {
    id: "congreso-2026-03-18-9",
    title: "Modificación del Acuerdo de Transporte Aéreo con Honduras",
    officialTitle: "Acuerdo por el que se modifica el Acuerdo entre el Reino de España y la República de Honduras sobre Transporte Aéreo y Anejo, firmado en Tegucigalpa el 30 de octubre de 1992, hecho en Sevilla el 1 de julio de 2025.",
    chamber: "congreso",
    date: "2026-03-18",
    time: "18:00 h",
    type: "proyecto_ley",
    status: "aprobado",
    category: "Tráfico",
    summary: "El Congreso aprueba la modificación del acuerdo para mejorar la conectividad aérea, lo que puede beneficiar a los viajeros con más opciones y posiblemente menores costes. Esto supone un cambio positivo en la vida diaria de los ciudadanos que viajan regularmente entre ambos países.",
    isOmnibus: false,
    threeKeys: {
      "what": "Se actualiza el acuerdo para mejorar la conectividad aérea entre España y Honduras.",
      "pocket": "Los viajeros podrán disfrutar de más opciones y posiblemente menores costes en sus viajes.",
      "clash": "Aviación comercial y aerolíneas locales buscan más oportunidades, mientras que sindicatos temen la pérdida de puestos de trabajo."
},
    beforeVsAfter: {
      "before": "Actualmente, los viajeros tienen limitadas opciones de vuelos entre España y Honduras.",
      "after": "Con la nueva regulación, se espera un aumento en la frecuencia y variedad de vuelos, beneficiando a los viajeros."
},
    measures: [
      {
            "id": "congreso-2026-03-18-9-m1",
            "title": "Mejora de la Conectividad Aérea",
            "category": "Transporte Aéreo",
            "plainDescription": "Se amplía el número de vuelos y aerolíneas permitidas entre España y Honduras, mejorando la oferta de servicios aéreos.",
            "whoIsAffected": [
                  "Viajeros frecuentes",
                  "Empresas de turismo"
            ],
            "realWorldExample": "María, una empresaria que viaja regularmente a Honduras para negocios, podrá elegir entre más de 10 vuelos semanales en lugar de los actuales 3, lo que le permitirá planificar sus viajes con mayor flexibilidad y posiblemente ahorrar en costes.",
            "argumentsPro": [
                  "Mayor competencia entre aerolíneas, lo que puede llevar a menores precios para los pasajeros",
                  "Más opciones de vuelos para los viajeros"
            ],
            "argumentsContra": [
                  "Posible pérdida de puestos de trabajo en aerolíneas locales",
                  "Necesidad de adaptarse a nuevas regulaciones para las aerolíneas existentes"
            ]
      }
],
    votesSummary: {"si":268,"no":0,"abstencion":80,"noVota":2,"total":350},
    groupVotes: [{"groupName":"G.P. Popular (PP)","totalSeats":137,"si":137,"no":0,"abstencion":0,"noVota":0,"color":"#0ea5e9"},{"groupName":"G.P. Socialista (PSOE)","totalSeats":121,"si":121,"no":0,"abstencion":0,"noVota":0,"color":"#ef4444"},{"groupName":"G.P. VOX","totalSeats":33,"si":10,"no":0,"abstencion":23,"noVota":0,"color":"#22c55e"},{"groupName":"G.P. Plurinacional Sumar","totalSeats":27,"si":0,"no":0,"abstencion":27,"noVota":0,"color":"#ec4899"},{"groupName":"G.P. Republicano (ERC)","totalSeats":7,"si":0,"no":0,"abstencion":7,"noVota":0,"color":"#f59e0b"},{"groupName":"G.P. Junts per Catalunya","totalSeats":7,"si":0,"no":0,"abstencion":7,"noVota":0,"color":"#06b6d4"},{"groupName":"G.P. Euskal Herria Bildu","totalSeats":6,"si":0,"no":0,"abstencion":6,"noVota":0,"color":"#84cc16"},{"groupName":"G.P. Vasco (EAJ-PNV)","totalSeats":5,"si":0,"no":0,"abstencion":5,"noVota":0,"color":"#10b981"},{"groupName":"G.P. Mixto (Podemos/BNG/CC/UPN)","totalSeats":7,"si":0,"no":0,"abstencion":5,"noVota":2,"color":"#8b5cf6"}],
    bocgUrl: "https://www.congreso.es/datos-abiertos",
    expedienteNumber: "121/20260318",
  },
  {
    id: "congreso-2026-03-18-10",
    title: "Formentera obtendrá su propio senador",
    officialTitle: "Acuerdo de tramitación directa y en lectura única de la Proposición de reforma del artículo 69.3 de la Constitución española a los efectos de que la isla de Formentera elija un senador propio, con independencia del que elija la isla de Eivissa (corresponde a los números de expediente 101/000004/0000 de la XII Legislatura, 101/000004/0000 de la XIII Legislatura y 101/000002/0000 de la XIV Legislatura).",
    chamber: "congreso",
    date: "2026-03-18",
    time: "18:00 h",
    type: "proyecto_ley",
    status: "aprobado",
    category: "Autonomía",
    summary: "El Congreso votará sobre una reforma que permitirá a Formentera elegir a su propio senador. Esto podría beneficiar a los formenteranos al asegurar una representación más específica de sus intereses.",
    isOmnibus: false,
    threeKeys: {
      "what": "La isla de Formentera elegirá a su propio senador independientemente de Eivissa.",
      "pocket": "Este cambio no afectará directamente a los bolsillos de los ciudadanos, pero sí a su representación política.",
      "clash": "Los defensores ven esta medida como un reconocimiento a la identidad de Formentera, mientras que los oponentes temen que pueda generar divisiones entre las islas."
},
    beforeVsAfter: {
      "before": "Antes, Formentera compartía un senador con Eivissa, lo que a veces generaba disputas sobre la representación.",
      "after": "Ahora, Formentera tendrá su propio senador, lo que podría mejorar la representación de sus intereses y necesidades."
},
    measures: [
      {
            "id": "congreso-2026-03-18-10-m1",
            "title": "Formentera obtendrá su propio senador",
            "category": "Representación política",
            "plainDescription": "La isla de Formentera podrá elegir a su propio senador, independientemente de Eivissa, para mejor representación política.",
            "whoIsAffected": [
                  "Residentes de Formentera",
                  "Empresarios y trabajadores de Formentera"
            ],
            "realWorldExample": "Juan, un empresario de Formentera, podría ver mejor representado su interés en la promoción turística local, ya que ahora tendrá un senador que puede hablar específicamente de sus necesidades.",
            "argumentsPro": [
                  "Mejor representación de los intereses locales",
                  "Mayor atención a las necesidades específicas de Formentera"
            ],
            "argumentsContra": [
                  "Posible división entre las islas",
                  "Costos potenciales para el presupuesto de la Comunidad Autónoma"
            ]
      }
],
    votesSummary: {"si":178,"no":33,"abstencion":137,"noVota":2,"total":350},
    groupVotes: [{"groupName":"G.P. Popular (PP)","totalSeats":137,"si":137,"no":0,"abstencion":0,"noVota":0,"color":"#0ea5e9"},{"groupName":"G.P. Socialista (PSOE)","totalSeats":121,"si":41,"no":33,"abstencion":47,"noVota":0,"color":"#ef4444"},{"groupName":"G.P. VOX","totalSeats":33,"si":0,"no":0,"abstencion":33,"noVota":0,"color":"#22c55e"},{"groupName":"G.P. Plurinacional Sumar","totalSeats":27,"si":0,"no":0,"abstencion":27,"noVota":0,"color":"#ec4899"},{"groupName":"G.P. Republicano (ERC)","totalSeats":7,"si":0,"no":0,"abstencion":7,"noVota":0,"color":"#f59e0b"},{"groupName":"G.P. Junts per Catalunya","totalSeats":7,"si":0,"no":0,"abstencion":7,"noVota":0,"color":"#06b6d4"},{"groupName":"G.P. Euskal Herria Bildu","totalSeats":6,"si":0,"no":0,"abstencion":6,"noVota":0,"color":"#84cc16"},{"groupName":"G.P. Vasco (EAJ-PNV)","totalSeats":5,"si":0,"no":0,"abstencion":5,"noVota":0,"color":"#10b981"},{"groupName":"G.P. Mixto (Podemos/BNG/CC/UPN)","totalSeats":7,"si":0,"no":0,"abstencion":5,"noVota":2,"color":"#8b5cf6"}],
    bocgUrl: "https://www.congreso.es/datos-abiertos",
    expedienteNumber: "121/20260318",
  },
  {
    id: "congreso-2026-03-17-1",
    title: "Modificación de Ley para Mejorar las Subvenciones",
    officialTitle: "Proposición de Ley del Grupo Parlamentario Mixto, para la modificación del Real Decreto Legislativo 5/2015, de 30 de octubre, por el que se aprueba el texto refundido de la Ley del Estatuto Básico del Empleado Público y de la Ley 38/2003, de 17 de noviembre, General de Subvenciones.",
    chamber: "congreso",
    date: "2026-03-17",
    time: "18:00 h",
    type: "proposicion_ley",
    status: "rechazado",
    category: "Subvenciones",
    summary: "El Congreso aprueba la modificación del Real Decreto Legislativo para simplificar y acelerar el proceso de subvenciones, mejorando la situación de los autónomos y pequeños empresarios. Esto supone un alivio financiero y una mayor estabilidad para quienes asumen riesgos en sus negocios.",
    isOmnibus: false,
    threeKeys: {
      "what": "Se reforma el Real Decreto Legislativo para facilitar subvenciones a autónomos y pequeños empresarios.",
      "pocket": "Los autónomos y pequeños empresarios podrán acceder a subvenciones más fáciles y rápidas, reduciendo costes y alivio financiero.",
      "clash": "Los defensores de la medida argumentan que es necesario apoyar a los pequeños empresarios, mientras que quienes se oponen temen un aumento en la deuda pública."
},
    beforeVsAfter: {
      "before": "Actualmente, el proceso para obtener subvenciones es largo y complejo, dificultando su acceso para muchos autónomos y pequeños empresarios.",
      "after": "Con la nueva regulación, los autónomos y pequeños empresarios podrán acceder a subvenciones más rápidas y sencillas, beneficiando su actividad y estabilidad financiera."
},
    measures: [
      {
            "id": "congreso-2026-03-17-1-m1",
            "title": "Simplificación del Proceso de Subvenciones",
            "category": "Economía",
            "plainDescription": "Se establecen procedimientos más ágiles y transparentes para que los autónomos y pequeños empresarios puedan acceder a subvenciones.",
            "whoIsAffected": [
                  "Autónomos",
                  "Pequeños empresarios"
            ],
            "realWorldExample": "Juan, un autónomo de 40 años, puede solicitar una subvención de 5.000 euros para modernizar su negocio en solo 30 días, reduciendo los costes de gestión y permitiéndole reinvertir en su empresa.",
            "argumentsPro": [
                  "Facilitar el acceso a capital para los pequeños empresarios",
                  "Promover la creación de empleo"
            ],
            "argumentsContra": [
                  "Posible aumento de la deuda pública",
                  "Necesidad de garantizar la sostenibilidad financiera"
            ]
      }
],
    votesSummary: {"si":171,"no":174,"abstencion":1,"noVota":4,"total":350},
    groupVotes: [{"groupName":"G.P. Popular (PP)","totalSeats":137,"si":137,"no":0,"abstencion":0,"noVota":0,"color":"#0ea5e9"},{"groupName":"G.P. Socialista (PSOE)","totalSeats":121,"si":34,"no":87,"abstencion":0,"noVota":0,"color":"#ef4444"},{"groupName":"G.P. VOX","totalSeats":33,"si":0,"no":33,"abstencion":0,"noVota":0,"color":"#22c55e"},{"groupName":"G.P. Plurinacional Sumar","totalSeats":27,"si":0,"no":27,"abstencion":0,"noVota":0,"color":"#ec4899"},{"groupName":"G.P. Republicano (ERC)","totalSeats":7,"si":0,"no":7,"abstencion":0,"noVota":0,"color":"#f59e0b"},{"groupName":"G.P. Junts per Catalunya","totalSeats":7,"si":0,"no":7,"abstencion":0,"noVota":0,"color":"#06b6d4"},{"groupName":"G.P. Euskal Herria Bildu","totalSeats":6,"si":0,"no":6,"abstencion":0,"noVota":0,"color":"#84cc16"},{"groupName":"G.P. Vasco (EAJ-PNV)","totalSeats":5,"si":0,"no":5,"abstencion":0,"noVota":0,"color":"#10b981"},{"groupName":"G.P. Mixto (Podemos/BNG/CC/UPN)","totalSeats":7,"si":0,"no":2,"abstencion":1,"noVota":4,"color":"#8b5cf6"}],
    bocgUrl: "https://www.congreso.es/datos-abiertos",
    expedienteNumber: "121/20260317",
  },
  {
    id: "congreso-2026-03-17-2",
    title: "Ampliación de penas para mayores delitos",
    officialTitle: "Proposición de Ley del Grupo Parlamentario Popular en el Congreso, Orgánica de modificación de la Ley Orgánica 10/1995, de 23 de noviembre, del Código Penal, para la ampliación de los supuestos en los que se prevé la imposición de la pena de prisión permanente revisable.",
    chamber: "congreso",
    date: "2026-03-17",
    time: "18:00 h",
    type: "proposicion_ley",
    status: "rechazado",
    category: "Justicia",
    summary: "El Congreso discute la ampliación de penas para mayores delitos, buscando proteger a la sociedad, pero generando debate sobre la justicia y la proporcionalidad de las sanciones.",
    isOmnibus: false,
    threeKeys: {
      "what": "Se amplían los delitos para los que se puede imponer prisión permanente revisable.",
      "pocket": "No afecta directamente al bolsillo de los ciudadanos, pero puede influir en la seguridad y la percepción de justicia.",
      "clash": "Defensores de la medida argumentan que es necesario para proteger a la sociedad, mientras que suscritores de la oposición temen que pueda ser abusiva."
},
    beforeVsAfter: {
      "before": "Actualmente, la prisión permanente revisable se aplica en casos muy específicos.",
      "after": "Con la nueva ley, se ampliarán los supuestos en los que se puede imponer esta pena."
},
    measures: [
      {
            "id": "congreso-2026-03-17-2-m1",
            "title": "Ampliación de penas para delitos graves",
            "category": "Justicia",
            "plainDescription": "La medida busca establecer nuevas circunstancias que permitan la imposición de la pena de prisión permanente revisable.",
            "whoIsAffected": [
                  "Delincuentes reincidentes",
                  "Menores infractores que cometan graves delitos"
            ],
            "realWorldExample": "Juan, un joven que ha cometido un delito grave y ha tenido antecedentes, podría verse sometido a esta nueva pena, lo que podría cambiar su vida y la de su familia.",
            "argumentsPro": [
                  "Proteger a la sociedad de delincuentes peligrosos",
                  "Ayudar a prevenir delitos graves"
            ],
            "argumentsContra": [
                  "Puede ser una pena excesiva para algunos casos",
                  "Puede ser vista como una forma de castigo excesivo"
            ]
      }
],
    votesSummary: {"si":172,"no":174,"abstencion":0,"noVota":4,"total":350},
    groupVotes: [{"groupName":"G.P. Popular (PP)","totalSeats":137,"si":137,"no":0,"abstencion":0,"noVota":0,"color":"#0ea5e9"},{"groupName":"G.P. Socialista (PSOE)","totalSeats":121,"si":35,"no":86,"abstencion":0,"noVota":0,"color":"#ef4444"},{"groupName":"G.P. VOX","totalSeats":33,"si":0,"no":33,"abstencion":0,"noVota":0,"color":"#22c55e"},{"groupName":"G.P. Plurinacional Sumar","totalSeats":27,"si":0,"no":27,"abstencion":0,"noVota":0,"color":"#ec4899"},{"groupName":"G.P. Republicano (ERC)","totalSeats":7,"si":0,"no":7,"abstencion":0,"noVota":0,"color":"#f59e0b"},{"groupName":"G.P. Junts per Catalunya","totalSeats":7,"si":0,"no":7,"abstencion":0,"noVota":0,"color":"#06b6d4"},{"groupName":"G.P. Euskal Herria Bildu","totalSeats":6,"si":0,"no":6,"abstencion":0,"noVota":0,"color":"#84cc16"},{"groupName":"G.P. Vasco (EAJ-PNV)","totalSeats":5,"si":0,"no":5,"abstencion":0,"noVota":0,"color":"#10b981"},{"groupName":"G.P. Mixto (Podemos/BNG/CC/UPN)","totalSeats":7,"si":0,"no":3,"abstencion":0,"noVota":4,"color":"#8b5cf6"}],
    bocgUrl: "https://www.congreso.es/datos-abiertos",
    expedienteNumber: "121/20260317",
  },
  {
    id: "europarl-2026-03-13-1",
    title: "Regulación de IA: Protección y Transparencia",
    officialTitle: "Votación final del Reglamento Europeo de Inteligencia Artificial (AI Act) y requisitos de transparencia para modelos fundacionales y sistemas de alto riesgo.",
    chamber: "europarl",
    date: "2026-03-13",
    time: "12:30 h (Estrasburgo)",
    type: "proyecto_ley",
    status: "aprobado",
    category: "Tecnología",
    summary: "El Congreso votará sobre el Reglamento Europeo de Inteligencia Artificial, que busca equilibrar la innovación tecnológica con la protección de los ciudadanos. Esto afectará tanto a empresas que desarrollan IA como a usuarios que la utilizan en sus vidas diarias.",
    isOmnibus: false,
    threeKeys: {
      "what": "Establece normas para sistemas de alto riesgo y modelos fundacionales de IA.",
      "pocket": "Implica costos iniciales para empresas, pero protege a usuarios y consumidores.",
      "clash": "Defensores argumentan que es necesario para la seguridad, mientras que críticos temen restricciones innecesarias."
},
    beforeVsAfter: {
      "before": "Antes, el uso de IA en sectores críticos era poco regulado, generando preocupaciones.",
      "after": "Ahora, la IA en sistemas de alto riesgo estará más controlada, protegiendo a los ciudadanos."
},
    measures: [
      {
            "id": "europarl-2026-03-13-1-m1",
            "title": "Regulación de Sistemas de Alto Riesgo",
            "category": "Seguridad",
            "plainDescription": "Establece requisitos de transparencia y control para sistemas de IA que pueden afectar directamente a la salud, seguridad o derechos de los ciudadanos.",
            "whoIsAffected": [
                  "Empresas de tecnología",
                  "Consumidores de servicios de IA"
            ],
            "realWorldExample": "Una empresa de salud que utiliza IA para diagnosticar enfermedades deberá transparentar cómo se llega a sus conclusiones, protegiendo la privacidad y seguridad de los pacientes. Esto puede costarles hasta 100.000 euros en implementación inicial.",
            "argumentsPro": [
                  "Protege la salud y seguridad de los ciudadanos",
                  "Fomenta la confianza en la tecnología"
            ],
            "argumentsContra": [
                  "Puede limitar la innovación",
                  "Costos iniciales significativos para pequeñas empresas"
            ]
      }
],
    votesSummary: {"si":52,"no":6,"abstencion":3,"noVota":0,"total":61},
    groupVotes: [{"groupName":"G.P. Popular Europeo (PP)","totalSeats":22,"si":22,"no":0,"abstencion":0,"noVota":0,"color":"#0ea5e9"},{"groupName":"G.P. Socialistas y Demócratas (PSOE)","totalSeats":20,"si":20,"no":0,"abstencion":0,"noVota":0,"color":"#ef4444"},{"groupName":"Patriotas por Europa (VOX)","totalSeats":6,"si":6,"no":0,"abstencion":0,"noVota":0,"color":"#22c55e"},{"groupName":"La Izquierda Europea (Podemos / Sumar)","totalSeats":5,"si":4,"no":1,"abstencion":0,"noVota":0,"color":"#ec4899"},{"groupName":"Los Verdes / Alianza Libre Europea (ERC / BNG)","totalSeats":3,"si":0,"no":3,"abstencion":0,"noVota":0,"color":"#84cc16"},{"groupName":"Renew Europe (EAJ-PNV / CC)","totalSeats":1,"si":0,"no":1,"abstencion":0,"noVota":0,"color":"#f59e0b"},{"groupName":"No Inscritos / Otros (SALF / Junts)","totalSeats":4,"si":0,"no":1,"abstencion":3,"noVota":0,"color":"#8b5cf6"}],
    bocgUrl: "https://data.europarl.europa.eu/api/v1/plenary-votes",
    expedienteNumber: "2021/0106(COD)",
  },
  {
    id: "congreso-2026-03-12-1",
    title: "Ley de jornada laboral: 37,5 horas semanales sin merma salarial",
    officialTitle: "Votación de las enmiendas de totalidad de devolución al Proyecto de Ley de reducción de la jornada laboral máxima legal a 37,5 horas semanales sin merma salarial.",
    chamber: "congreso",
    date: "2026-03-12",
    time: "19:00 h",
    type: "enmienda_totalidad",
    status: "rechazado",
    category: "Empleo",
    summary: "Se vota enmienda que propone reducir la jornada laboral a 37,5 horas semanales sin merma salarial. Esto beneficiará a los trabajadores con más tiempo libre, pero podría afectar a la productividad de las empresas.",
    isOmnibus: false,
    threeKeys: {
      "what": "Reducir la jornada laboral a 37,5 horas semanales sin reducir el salario.",
      "pocket": "Los trabajadores tendrán más tiempo libre, pero no perderán ingresos; empresas podrían ajustar personal o horarios.",
      "clash": "Partido de gobierno defiende mayor bienestar laboral; oposición teme impacto en competitividad."
},
    beforeVsAfter: {
      "before": "Actualmente, la jornada laboral máxima legal es de 40 horas semanales.",
      "after": "La nueva ley establecerá 37,5 horas semanales como la máxima legal sin reducción salarial."
},
    measures: [
      {
            "id": "congreso-2026-03-12-1-m1",
            "title": "Reducción de la jornada laboral",
            "category": "Horas de trabajo",
            "plainDescription": "Establece 37,5 horas semanales como la máxima legal sin reducir el salario.",
            "whoIsAffected": [
                  "Trabajadores",
                  "Empresas"
            ],
            "realWorldExample": "Un trabajador que actualmente trabaja 40 horas a la semana, con un salario de 1.200 euros, obtendría 1.200 euros al mes trabajando 37,5 horas.",
            "argumentsPro": [
                  "Mejora la calidad de vida de los trabajadores",
                  "Fomenta el equilibrio entre vida laboral y personal"
            ],
            "argumentsContra": [
                  "Podría afectar la competitividad de las empresas",
                  "Requiere ajustes en la organización laboral"
            ]
      }
],
    votesSummary: {"si":171,"no":177,"abstencion":2,"noVota":0,"total":350},
    groupVotes: [{"groupName":"G.P. Popular (PP)","totalSeats":137,"si":137,"no":0,"abstencion":0,"noVota":0,"color":"#0ea5e9"},{"groupName":"G.P. Socialista (PSOE)","totalSeats":121,"si":34,"no":87,"abstencion":0,"noVota":0,"color":"#ef4444"},{"groupName":"G.P. VOX","totalSeats":33,"si":0,"no":33,"abstencion":0,"noVota":0,"color":"#22c55e"},{"groupName":"G.P. Plurinacional Sumar","totalSeats":27,"si":0,"no":27,"abstencion":0,"noVota":0,"color":"#ec4899"},{"groupName":"G.P. Republicano (ERC)","totalSeats":7,"si":0,"no":7,"abstencion":0,"noVota":0,"color":"#f59e0b"},{"groupName":"G.P. Junts per Catalunya","totalSeats":7,"si":0,"no":7,"abstencion":0,"noVota":0,"color":"#06b6d4"},{"groupName":"G.P. Euskal Herria Bildu","totalSeats":6,"si":0,"no":6,"abstencion":0,"noVota":0,"color":"#84cc16"},{"groupName":"G.P. Vasco (EAJ-PNV)","totalSeats":5,"si":0,"no":5,"abstencion":0,"noVota":0,"color":"#10b981"},{"groupName":"G.P. Mixto (Podemos/BNG/CC/UPN)","totalSeats":7,"si":0,"no":5,"abstencion":2,"noVota":0,"color":"#8b5cf6"}],
    bocgUrl: "https://www.congreso.es/datos-abiertos",
    expedienteNumber: "121/000052",
  },
  {
    id: "congreso-2026-02-26-1",
    title: "Ley de Transparencia y Lobbies",
    officialTitle: "Proyecto de Ley de Transparencia, Integridad Pública y Regulación del Registro Obligatorio de Grupos de Interés (Lobbies).",
    chamber: "congreso",
    date: "2026-02-26",
    time: "18:15 h",
    type: "proyecto_ley",
    status: "aprobado",
    category: "Justicia",
    summary: "La ley establece un registro para grupos de interés y mejora la transparencia pública, afectando a empresas y organizaciones que interactúan con el gobierno.",
    isOmnibus: false,
    threeKeys: {
      "what": "Establece un registro obligatorio para grupos de interés y mejora la transparencia pública.",
      "pocket": "Grupos de interés deberán declarar sus actividades y relaciones, afectando a empresas y organizaciones.",
      "clash": "Partidos políticos apoyan la transparencia, mientras que algunos sectores temen restricciones."
},
    beforeVsAfter: {
      "before": "No existía un registro oficial de grupos de interés en España.",
      "after": "Se implementa un registro obligatorio para grupos de interés, mejorando la transparencia."
},
    measures: [
      {
            "id": "congreso-2026-02-26-1-m1",
            "title": "Registro Obligatorio de Grupos de Interés",
            "category": "Transparencia",
            "plainDescription": "Grupos de interés deberán registrar sus actividades y relaciones con el gobierno.",
            "whoIsAffected": [
                  "Empresas",
                  "Organizaciones no gubernamentales"
            ],
            "realWorldExample": "Una empresa de construcción deberá declarar sus contactos con la administración y sus proyectos de interés público, afectando a 200 empresas en el primer año.",
            "argumentsPro": [
                  "Mejora la transparencia y confianza pública",
                  "Permite supervisión efectiva"
            ],
            "argumentsContra": [
                  "Restringe la libertad de expresión",
                  "Puede generar abuso de poder"
            ]
      }
],
    votesSummary: {"si":179,"no":168,"abstencion":3,"noVota":0,"total":350},
    groupVotes: [{"groupName":"G.P. Popular (PP)","totalSeats":137,"si":137,"no":0,"abstencion":0,"noVota":0,"color":"#0ea5e9"},{"groupName":"G.P. Socialista (PSOE)","totalSeats":121,"si":42,"no":79,"abstencion":0,"noVota":0,"color":"#ef4444"},{"groupName":"G.P. VOX","totalSeats":33,"si":0,"no":33,"abstencion":0,"noVota":0,"color":"#22c55e"},{"groupName":"G.P. Plurinacional Sumar","totalSeats":27,"si":0,"no":27,"abstencion":0,"noVota":0,"color":"#ec4899"},{"groupName":"G.P. Republicano (ERC)","totalSeats":7,"si":0,"no":7,"abstencion":0,"noVota":0,"color":"#f59e0b"},{"groupName":"G.P. Junts per Catalunya","totalSeats":7,"si":0,"no":7,"abstencion":0,"noVota":0,"color":"#06b6d4"},{"groupName":"G.P. Euskal Herria Bildu","totalSeats":6,"si":0,"no":6,"abstencion":0,"noVota":0,"color":"#84cc16"},{"groupName":"G.P. Vasco (EAJ-PNV)","totalSeats":5,"si":0,"no":5,"abstencion":0,"noVota":0,"color":"#10b981"},{"groupName":"G.P. Mixto (Podemos/BNG/CC/UPN)","totalSeats":7,"si":0,"no":4,"abstencion":3,"noVota":0,"color":"#8b5cf6"}],
    bocgUrl: "https://www.congreso.es/datos-abiertos",
    expedienteNumber: "121/000045",
  },
  {
    id: "congreso-2026-02-24-1",
    title: "Garantía de derechos laborales en deslocalizaciones",
    officialTitle: "Proposición de Ley del Grupo Parlamentario Plurinacional SUMAR, para la garantía de los derechos de las personas trabajadoras en procesos de deslocalización y transmisión de unidades productivas.",
    chamber: "congreso",
    date: "2026-02-24",
    time: "18:00 h",
    type: "proposicion_ley",
    status: "rechazado",
    category: "Empleo",
    summary: "El Congreso debate una ley que busca proteger a los trabajadores durante deslocalizaciones, mejorando sus derechos y estabilidad laboral.",
    isOmnibus: false,
    threeKeys: {
      "what": "Establece derechos para trabajadores en deslocalizaciones y transmisiones de empresas.",
      "pocket": "Prevé una compensación mínima de 15 días por año trabajado, mejorando la estabilidad laboral.",
      "clash": "Empresarios temen altos costes, mientras trabajadores buscan mayor protección."
},
    beforeVsAfter: {
      "before": "Antes, los trabajadores podían perder su empleo sin garantías ni compensaciones adecuadas.",
      "after": "Ahora, los empleados tendrán un mínimo de 15 días de compensación por año trabajado, protegiendo su estabilidad laboral."
},
    measures: [
      {
            "id": "congreso-2026-02-24-1-m1",
            "title": "Compensación mínima por deslocalización",
            "category": "Trabajo",
            "plainDescription": "Establece una compensación mínima de 15 días por año trabajado para los empleados afectados por deslocalizaciones.",
            "whoIsAffected": [
                  "Trabajadores afectados por deslocalizaciones",
                  "Empresas que realicen deslocalizaciones"
            ],
            "realWorldExample": "Juan, un trabajador de 10 años en una empresa que se deslocaliza, recibirá una compensación mínima de 150 días de salario, lo que le permitirá buscar otro empleo con mayor tranquilidad.",
            "argumentsPro": [
                  "Ofrece seguridad y estabilidad a los trabajadores",
                  "Prevé un trato justo entre empleados y empresas"
            ],
            "argumentsContra": [
                  "Puede aumentar los costes de las empresas",
                  "Puede disuadir inversiones y deslocalizaciones"
            ]
      }
],
    votesSummary: {"si":168,"no":178,"abstencion":1,"noVota":3,"total":350},
    groupVotes: [{"groupName":"G.P. Popular (PP)","totalSeats":137,"si":137,"no":0,"abstencion":0,"noVota":0,"color":"#0ea5e9"},{"groupName":"G.P. Socialista (PSOE)","totalSeats":121,"si":31,"no":90,"abstencion":0,"noVota":0,"color":"#ef4444"},{"groupName":"G.P. VOX","totalSeats":33,"si":0,"no":33,"abstencion":0,"noVota":0,"color":"#22c55e"},{"groupName":"G.P. Plurinacional Sumar","totalSeats":27,"si":0,"no":27,"abstencion":0,"noVota":0,"color":"#ec4899"},{"groupName":"G.P. Republicano (ERC)","totalSeats":7,"si":0,"no":7,"abstencion":0,"noVota":0,"color":"#f59e0b"},{"groupName":"G.P. Junts per Catalunya","totalSeats":7,"si":0,"no":7,"abstencion":0,"noVota":0,"color":"#06b6d4"},{"groupName":"G.P. Euskal Herria Bildu","totalSeats":6,"si":0,"no":6,"abstencion":0,"noVota":0,"color":"#84cc16"},{"groupName":"G.P. Vasco (EAJ-PNV)","totalSeats":5,"si":0,"no":5,"abstencion":0,"noVota":0,"color":"#10b981"},{"groupName":"G.P. Mixto (Podemos/BNG/CC/UPN)","totalSeats":7,"si":0,"no":3,"abstencion":1,"noVota":3,"color":"#8b5cf6"}],
    bocgUrl: "https://www.congreso.es/datos-abiertos",
    expedienteNumber: "121/20260224",
  },
  {
    id: "congreso-2026-02-24-2",
    title: "Reforma del Tribunal Constitucional para mayor equidad",
    officialTitle: "Proposición de Ley del Grupo Parlamentario Vasco (EAJ-PNV), Orgánica de reforma de la Ley Orgánica 2/1979, de 3 de octubre, del Tribunal Constitucional.",
    chamber: "congreso",
    date: "2026-02-24",
    time: "18:00 h",
    type: "proposicion_ley",
    status: "aprobado",
    category: "Justicia",
    summary: "El Congreso debate la reforma del Tribunal Constitucional para que intervenga en casos de interés general, mejorando el acceso a la justicia para colectivos vulnerables y protegiendo derechos fundamentales.",
    isOmnibus: false,
    threeKeys: {
      "what": "Amplía la competencia del TC para casos de interés general.",
      "pocket": "Facilita el acceso a la justicia para colectivos vulnerables.",
      "clash": "Defensores argumentan que fortalece la protección de derechos fundamentales, mientras que críticos temen un aumento de la carga de trabajo."
},
    beforeVsAfter: {
      "before": "Antes, el TC solo intervenía en casos concretos de interés individual.",
      "after": "Ahora, puede abordar casos de interés general, beneficiando a más ciudadanos."
},
    measures: [
      {
            "id": "congreso-2026-02-24-2-m1",
            "title": "Expansión de competencias del Tribunal Constitucional",
            "category": "Justicia",
            "plainDescription": "Permite al TC intervenir en casos de interés general, protegiendo derechos fundamentales y facilitando el acceso a la justicia.",
            "whoIsAffected": [
                  "Colectivos vulnerables",
                  "Pacientes",
                  "Estudiantes",
                  "Trabajadores"
            ],
            "realWorldExample": "María, una estudiante de derecho, puede presentar una demanda colectiva contra una empresa por prácticas abusivas, lo que antes no era posible. Esto facilita que más personas accedan a la justicia y protejan sus derechos.",
            "argumentsPro": [
                  "Fortalece la protección de derechos fundamentales",
                  "Facilita el acceso a la justicia para colectivos vulnerables"
            ],
            "argumentsContra": [
                  "Puede aumentar la carga de trabajo del TC",
                  "Posible sobreexplotación de recursos judiciales"
            ]
      }
],
    votesSummary: {"si":175,"no":171,"abstencion":0,"noVota":4,"total":350},
    groupVotes: [{"groupName":"G.P. Popular (PP)","totalSeats":137,"si":137,"no":0,"abstencion":0,"noVota":0,"color":"#0ea5e9"},{"groupName":"G.P. Socialista (PSOE)","totalSeats":121,"si":38,"no":83,"abstencion":0,"noVota":0,"color":"#ef4444"},{"groupName":"G.P. VOX","totalSeats":33,"si":0,"no":33,"abstencion":0,"noVota":0,"color":"#22c55e"},{"groupName":"G.P. Plurinacional Sumar","totalSeats":27,"si":0,"no":27,"abstencion":0,"noVota":0,"color":"#ec4899"},{"groupName":"G.P. Republicano (ERC)","totalSeats":7,"si":0,"no":7,"abstencion":0,"noVota":0,"color":"#f59e0b"},{"groupName":"G.P. Junts per Catalunya","totalSeats":7,"si":0,"no":7,"abstencion":0,"noVota":0,"color":"#06b6d4"},{"groupName":"G.P. Euskal Herria Bildu","totalSeats":6,"si":0,"no":6,"abstencion":0,"noVota":0,"color":"#84cc16"},{"groupName":"G.P. Vasco (EAJ-PNV)","totalSeats":5,"si":0,"no":5,"abstencion":0,"noVota":0,"color":"#10b981"},{"groupName":"G.P. Mixto (Podemos/BNG/CC/UPN)","totalSeats":7,"si":0,"no":3,"abstencion":0,"noVota":4,"color":"#8b5cf6"}],
    bocgUrl: "https://www.congreso.es/datos-abiertos",
    expedienteNumber: "121/20260224",
  },
  {
    id: "congreso-2026-02-18-1",
    title: "VOX propone proteger el campo y la soberanía alimentaria",
    officialTitle: "Proposición no de Ley del Grupo Parlamentario VOX, relativa a la defensa de nuestro campo y del sector primario que garantiza nuestra soberanía alimentaria.",
    chamber: "congreso",
    date: "2026-02-18",
    time: "18:00 h",
    type: "mocion",
    status: "rechazado",
    category: "Agricultura",
    summary: "El Congreso debatirá sobre la protección del sector primario, con el objetivo de asegurar la soberanía alimentaria y apoyar a los agricultores. Esto beneficiará tanto a los productores como a los consumidores, al garantizar la producción nacional y estabilizar los precios.",
    isOmnibus: false,
    threeKeys: {
      "what": "Establece ayudas directas a agricultores y medidas para fomentar la producción nacional.",
      "pocket": "Reducirá costes de producción y garantizará precios justos para los consumidores.",
      "clash": "Defensores argumentan la necesidad de apoyar a los agricultores, mientras los críticos temen que pueda subir el precio de los alimentos."
},
    beforeVsAfter: {
      "before": "Los agricultores enfrentan dificultades económicas y presiones por los costos de producción.",
      "after": "Se implementarán medidas que ayudarán a los agricultores a mantenerse viables y a los consumidores a acceder a alimentos más baratos y seguros."
},
    measures: [
      {
            "id": "congreso-2026-02-18-1-m1",
            "title": "Ayudas directas a los agricultores",
            "category": "Subvenciones",
            "plainDescription": "Se establecerán fondos para ayudar a los agricultores a cubrir costos de producción y mejorar la viabilidad de sus negocios.",
            "whoIsAffected": [
                  "Agricultores",
                  "Pequeños propietarios"
            ],
            "realWorldExample": "Juan, un agricultor de 45 años, verá una reducción en sus costos de producción gracias a una subvención de 5.000 euros anuales, lo que permitirá que mantenga su viñedo y siga produciendo vino de calidad.",
            "argumentsPro": [
                  "Ayuda a mantener la producción nacional",
                  "Garantiza la disponibilidad de alimentos"
            ],
            "argumentsContra": [
                  "Puede aumentar los precios de los alimentos",
                  "Puede generar distorsiones en el mercado"
            ]
      }
],
    votesSummary: {"si":31,"no":174,"abstencion":139,"noVota":6,"total":350},
    groupVotes: [{"groupName":"G.P. Popular (PP)","totalSeats":137,"si":31,"no":106,"abstencion":0,"noVota":0,"color":"#0ea5e9"},{"groupName":"G.P. Socialista (PSOE)","totalSeats":121,"si":0,"no":68,"abstencion":53,"noVota":0,"color":"#ef4444"},{"groupName":"G.P. VOX","totalSeats":33,"si":0,"no":0,"abstencion":33,"noVota":0,"color":"#22c55e"},{"groupName":"G.P. Plurinacional Sumar","totalSeats":27,"si":0,"no":0,"abstencion":27,"noVota":0,"color":"#ec4899"},{"groupName":"G.P. Republicano (ERC)","totalSeats":7,"si":0,"no":0,"abstencion":7,"noVota":0,"color":"#f59e0b"},{"groupName":"G.P. Junts per Catalunya","totalSeats":7,"si":0,"no":0,"abstencion":7,"noVota":0,"color":"#06b6d4"},{"groupName":"G.P. Euskal Herria Bildu","totalSeats":6,"si":0,"no":0,"abstencion":6,"noVota":0,"color":"#84cc16"},{"groupName":"G.P. Vasco (EAJ-PNV)","totalSeats":5,"si":0,"no":0,"abstencion":5,"noVota":0,"color":"#10b981"},{"groupName":"G.P. Mixto (Podemos/BNG/CC/UPN)","totalSeats":7,"si":0,"no":0,"abstencion":1,"noVota":6,"color":"#8b5cf6"}],
    bocgUrl: "https://www.congreso.es/datos-abiertos",
    expedienteNumber: "121/20260218",
  },
  {
    id: "congreso-2026-02-18-2",
    title: "Créditos rápidos: Protección para consumidores",
    officialTitle: "Proposición no de Ley del Grupo Parlamentario Plurinacional SUMAR, sobre una nueva regulación para los créditos rápidos en defensa del consumidor.\nSe vota en los términos de la enmienda transaccional presentada por el Grupo Parlamentario Socialista, el Grupo Parlamentario Plurinacional SUMAR, el Grupo Parlamentario Republicano y el Grupo Parlamentario Mixto (Sra. Valido García y Sra. Santana Perera).",
    chamber: "congreso",
    date: "2026-02-18",
    time: "18:00 h",
    type: "mocion",
    status: "aprobado",
    category: "Consumo",
    summary: "El Congreso vota por una nueva regulación que limita los intereses de los créditos rápidos, protegiendo a los consumidores y evitando que paguen más del doble del importe inicial.",
    isOmnibus: false,
    threeKeys: {
      "what": "Regulación para proteger a los consumidores de préstamos rápidos.",
      "pocket": "Limita los intereses, evitando que los usuarios paguen más del doble del importe inicial.",
      "clash": "Consumidores defienden la protección, mientras que prestamistas temen que esto reduzca la oferta de crédito."
},
    beforeVsAfter: {
      "before": "Antes, los consumidores podían pagar intereses que duplicaban el importe del préstamo.",
      "after": "Con la nueva regulación, los intereses serán más razonables, protegiendo el bolsillo de los consumidores."
},
    measures: [
      {
            "id": "congreso-2026-02-18-2-m1",
            "title": "Limitación de intereses en créditos rápidos",
            "category": "Consumo",
            "plainDescription": "Establece un techo máximo para los intereses de los préstamos rápidos, protegiendo a los consumidores.",
            "whoIsAffected": [
                  "Consumidores que solicitan préstamos rápidos",
                  "Empresas de créditos rápidos"
            ],
            "realWorldExample": "María, una trabajadora autónoma, necesita un préstamo rápido de 500 euros para cubrir gastos urgentes. Antes, podría haber pagado hasta 1000 euros en intereses. Con la nueva regulación, pagará un máximo de 750 euros, ahorrando 250 euros.",
            "argumentsPro": [
                  "Protección del consumidor",
                  "Prevención de la quiebra financiera"
            ],
            "argumentsContra": [
                  "Posible reducción de la oferta de crédito",
                  "Impacto en el negocio de las empresas de créditos rápidos"
            ]
      }
],
    votesSummary: {"si":176,"no":31,"abstencion":137,"noVota":6,"total":350},
    groupVotes: [{"groupName":"G.P. Popular (PP)","totalSeats":137,"si":137,"no":0,"abstencion":0,"noVota":0,"color":"#0ea5e9"},{"groupName":"G.P. Socialista (PSOE)","totalSeats":121,"si":39,"no":31,"abstencion":51,"noVota":0,"color":"#ef4444"},{"groupName":"G.P. VOX","totalSeats":33,"si":0,"no":0,"abstencion":33,"noVota":0,"color":"#22c55e"},{"groupName":"G.P. Plurinacional Sumar","totalSeats":27,"si":0,"no":0,"abstencion":27,"noVota":0,"color":"#ec4899"},{"groupName":"G.P. Republicano (ERC)","totalSeats":7,"si":0,"no":0,"abstencion":7,"noVota":0,"color":"#f59e0b"},{"groupName":"G.P. Junts per Catalunya","totalSeats":7,"si":0,"no":0,"abstencion":7,"noVota":0,"color":"#06b6d4"},{"groupName":"G.P. Euskal Herria Bildu","totalSeats":6,"si":0,"no":0,"abstencion":6,"noVota":0,"color":"#84cc16"},{"groupName":"G.P. Vasco (EAJ-PNV)","totalSeats":5,"si":0,"no":0,"abstencion":5,"noVota":0,"color":"#10b981"},{"groupName":"G.P. Mixto (Podemos/BNG/CC/UPN)","totalSeats":7,"si":0,"no":0,"abstencion":1,"noVota":6,"color":"#8b5cf6"}],
    bocgUrl: "https://www.congreso.es/datos-abiertos",
    expedienteNumber: "121/20260218",
  },
  {
    id: "congreso-2026-02-18-3",
    title: "Canarias: impacto económico por falta de normativa",
    officialTitle: "Moción consecuencia de interpelación urgente del Grupo Parlamentario Mixto (Sra. Valido García), sobre el impacto en la economía canaria de la falta de aplicación e incumplimientos de la normativa europea y española en vigor por su condición de Región Ultraperiférica.\nSe vota en los términos de la enmienda transaccional presentada por el Grupo Parlamentario Popular en el Congreso y el Grupo Parlamentario Mixto (Sra. Valido García).",
    chamber: "congreso",
    date: "2026-02-18",
    time: "18:00 h",
    type: "mocion",
    status: "aprobado",
    category: "Economía",
    summary: "El Congreso votará sobre la aplicación de normativa europea y española en Canarias, impactando en la economía local y los negocios más pequeños.",
    isOmnibus: false,
    threeKeys: {
      "what": "La moción aborda la falta de aplicación de normativa europea y española en Canarias.",
      "pocket": "Los autónomos y pequeños comerciantes podrían ver reducidos sus costes operativos.",
      "clash": "El debate equilibra la necesidad de ajustes económicos con el mantenimiento de la competitividad local."
},
    beforeVsAfter: {
      "before": "Antes, los empresarios canarios enfrentaban incertidumbres legales y costos adicionales.",
      "after": "Ahora, se espera una mayor claridad y reducción de costes para los pequeños negocios."
},
    measures: [
      {
            "id": "congreso-2026-02-18-3-m1",
            "title": "Claridad en la aplicación de normativa",
            "category": "Regulación",
            "plainDescription": "La moción busca asegurar que la normativa europea y española se aplique correctamente en Canarias, beneficiando a los negocios más pequeños.",
            "whoIsAffected": [
                  "Autónomos",
                  "Pequeños comerciantes"
            ],
            "realWorldExample": "Juan, un pequeño vendedor de flores, podría ahorrar 100 euros al mes en costes administrativos gracias a la simplificación de trámites y regulaciones.",
            "argumentsPro": [
                  "Reducir costes operativos para pequeños negocios",
                  "Mantener la competitividad local"
            ],
            "argumentsContra": [
                  "Posible aumento de la burocracia",
                  "Necesidad de adaptación a nuevas normativas"
            ]
      }
],
    votesSummary: {"si":169,"no":150,"abstencion":24,"noVota":7,"total":350},
    groupVotes: [{"groupName":"G.P. Popular (PP)","totalSeats":137,"si":137,"no":0,"abstencion":0,"noVota":0,"color":"#0ea5e9"},{"groupName":"G.P. Socialista (PSOE)","totalSeats":121,"si":32,"no":89,"abstencion":0,"noVota":0,"color":"#ef4444"},{"groupName":"G.P. VOX","totalSeats":33,"si":0,"no":33,"abstencion":0,"noVota":0,"color":"#22c55e"},{"groupName":"G.P. Plurinacional Sumar","totalSeats":27,"si":0,"no":27,"abstencion":0,"noVota":0,"color":"#ec4899"},{"groupName":"G.P. Republicano (ERC)","totalSeats":7,"si":0,"no":1,"abstencion":6,"noVota":0,"color":"#f59e0b"},{"groupName":"G.P. Junts per Catalunya","totalSeats":7,"si":0,"no":0,"abstencion":7,"noVota":0,"color":"#06b6d4"},{"groupName":"G.P. Euskal Herria Bildu","totalSeats":6,"si":0,"no":0,"abstencion":6,"noVota":0,"color":"#84cc16"},{"groupName":"G.P. Vasco (EAJ-PNV)","totalSeats":5,"si":0,"no":0,"abstencion":5,"noVota":0,"color":"#10b981"},{"groupName":"G.P. Mixto (Podemos/BNG/CC/UPN)","totalSeats":7,"si":0,"no":0,"abstencion":0,"noVota":7,"color":"#8b5cf6"}],
    bocgUrl: "https://www.congreso.es/datos-abiertos",
    expedienteNumber: "121/20260218",
  },
  {
    id: "congreso-2026-02-18-4",
    title: "Seguridad en el transporte: medidas urgentes para todos",
    officialTitle: "Moción consecuencia de interpelación urgente del Grupo Parlamentario VOX, sobre cuáles van a ser las medidas del Gobierno para garantizar la seguridad de las infraestructuras de transportes.",
    chamber: "congreso",
    date: "2026-02-18",
    time: "18:00 h",
    type: "mocion",
    status: "rechazado",
    category: "Tráfico",
    summary: "El Congreso discute medidas para mejorar la seguridad en infraestructuras de transporte, que beneficiarán a conductores, peatones y ciclistas, al mismo tiempo que se busca equilibrar las preocupaciones sobre costos adicionales.",
    isOmnibus: false,
    threeKeys: {
      "what": "El Gobierno propone un paquete de medidas para mejorar la seguridad en infraestructuras de transporte.",
      "pocket": "Esto incluye mejoras en la señalización y mantenimiento, lo que puede reducir accidentes y costos de reparación.",
      "clash": "Los defensores de la medida argumentan que es crucial para la seguridad, mientras que otros temen que pueda aumentar los impuestos."
},
    beforeVsAfter: {
      "before": "Antes, los conductores y peatones corrían riesgos en infraestructuras deterioradas.",
      "after": "Con las nuevas medidas, se espera una disminución en los accidentes y un entorno más seguro para todos."
},
    measures: [
      {
            "id": "congreso-2026-02-18-4-m1",
            "title": "Inversión en infraestructuras de transporte",
            "category": "Seguridad vial",
            "plainDescription": "El Gobierno destinará fondos para mejorar la señalización y mantenimiento de carreteras y vías urbanas.",
            "whoIsAffected": [
                  "Conductores",
                  "Peatones",
                  "Ciclistas"
            ],
            "realWorldExample": "Juan, un conductor, notará mejoras en la señalización de su ruta habitual, lo que le permitirá circular con mayor seguridad y evitar accidentes. Esto puede reducir los costos de reparación y el estrés asociado a la conducción.",
            "argumentsPro": [
                  "Mejora la seguridad vial, reduciendo accidentes y daños",
                  "Aumenta la confianza de los ciudadanos en la infraestructura"
            ],
            "argumentsContra": [
                  "Puede aumentar los impuestos para financiar las mejoras",
                  "Posible sobrecoste en la implementación"
            ]
      }
],
    votesSummary: {"si":168,"no":176,"abstencion":0,"noVota":6,"total":350},
    groupVotes: [{"groupName":"G.P. Popular (PP)","totalSeats":137,"si":137,"no":0,"abstencion":0,"noVota":0,"color":"#0ea5e9"},{"groupName":"G.P. Socialista (PSOE)","totalSeats":121,"si":31,"no":90,"abstencion":0,"noVota":0,"color":"#ef4444"},{"groupName":"G.P. VOX","totalSeats":33,"si":0,"no":33,"abstencion":0,"noVota":0,"color":"#22c55e"},{"groupName":"G.P. Plurinacional Sumar","totalSeats":27,"si":0,"no":27,"abstencion":0,"noVota":0,"color":"#ec4899"},{"groupName":"G.P. Republicano (ERC)","totalSeats":7,"si":0,"no":7,"abstencion":0,"noVota":0,"color":"#f59e0b"},{"groupName":"G.P. Junts per Catalunya","totalSeats":7,"si":0,"no":7,"abstencion":0,"noVota":0,"color":"#06b6d4"},{"groupName":"G.P. Euskal Herria Bildu","totalSeats":6,"si":0,"no":6,"abstencion":0,"noVota":0,"color":"#84cc16"},{"groupName":"G.P. Vasco (EAJ-PNV)","totalSeats":5,"si":0,"no":5,"abstencion":0,"noVota":0,"color":"#10b981"},{"groupName":"G.P. Mixto (Podemos/BNG/CC/UPN)","totalSeats":7,"si":0,"no":1,"abstencion":0,"noVota":6,"color":"#8b5cf6"}],
    bocgUrl: "https://www.congreso.es/datos-abiertos",
    expedienteNumber: "121/20260218",
  },
  {
    id: "congreso-2026-02-18-5",
    title: "Urgente: Reforma para aliviar el alquiler y la compra",
    officialTitle: "Moción consecuencia de interpelación urgente del Grupo Parlamentario Popular en el Congreso, sobre el evidente fracaso de las políticas en materia de vivienda de este Gobierno.",
    chamber: "congreso",
    date: "2026-02-18",
    time: "18:00 h",
    type: "mocion",
    status: "aprobado",
    category: "Vivienda",
    summary: "El Congreso discute reformas para regular el alquiler y facilitar la compra de viviendas. Estas medidas buscan aliviar la presión sobre los bolsillos de las familias y ayudar a jóvenes a formar su hogar.",
    isOmnibus: false,
    threeKeys: {
      "what": "Propone medidas para regular el alquiler y facilitar la compra de viviendas.",
      "pocket": "Ayuda a familias a ahorrar en alquileres y a jóvenes a acceder a la propiedad.",
      "clash": "Inquilinos temen subidas de precios mientras compradores de viviendas temen que la oferta se agote."
},
    beforeVsAfter: {
      "before": "Antes, muchos inquilinos pagaban altos alquileres y jóvenes no podían acceder a la propiedad.",
      "after": "Ahora, se espera que los precios del alquiler se regularicen y se faciliten los préstamos para comprar."
},
    measures: [
      {
            "id": "congreso-2026-02-18-5-m1",
            "title": "Regulación del alquiler",
            "category": "Alquiler",
            "plainDescription": "Establece límites máximos de alquiler y garantiza la estabilidad en el contrato.",
            "whoIsAffected": [
                  "Inquilinos",
                  "Propietarios que mantengan precios razonables"
            ],
            "realWorldExample": "María, una trabajadora joven, pagaba 800 euros al mes por un piso en un barrio céntrico. Con la nueva regulación, el alquiler se reducirá a 600 euros, lo que le permitirá ahorrar para otros gastos esenciales.",
            "argumentsPro": [
                  "Evita subidas abusivas de precios",
                  "Ofrece estabilidad a los inquilinos"
            ],
            "argumentsContra": [
                  "Puede limitar la oferta de alquileres",
                  "Puede afectar a la rentabilidad de los propietarios"
            ]
      }
],
    votesSummary: {"si":176,"no":44,"abstencion":125,"noVota":5,"total":350},
    groupVotes: [{"groupName":"G.P. Popular (PP)","totalSeats":137,"si":137,"no":0,"abstencion":0,"noVota":0,"color":"#0ea5e9"},{"groupName":"G.P. Socialista (PSOE)","totalSeats":121,"si":39,"no":44,"abstencion":38,"noVota":0,"color":"#ef4444"},{"groupName":"G.P. VOX","totalSeats":33,"si":0,"no":0,"abstencion":33,"noVota":0,"color":"#22c55e"},{"groupName":"G.P. Plurinacional Sumar","totalSeats":27,"si":0,"no":0,"abstencion":27,"noVota":0,"color":"#ec4899"},{"groupName":"G.P. Republicano (ERC)","totalSeats":7,"si":0,"no":0,"abstencion":7,"noVota":0,"color":"#f59e0b"},{"groupName":"G.P. Junts per Catalunya","totalSeats":7,"si":0,"no":0,"abstencion":7,"noVota":0,"color":"#06b6d4"},{"groupName":"G.P. Euskal Herria Bildu","totalSeats":6,"si":0,"no":0,"abstencion":6,"noVota":0,"color":"#84cc16"},{"groupName":"G.P. Vasco (EAJ-PNV)","totalSeats":5,"si":0,"no":0,"abstencion":5,"noVota":0,"color":"#10b981"},{"groupName":"G.P. Mixto (Podemos/BNG/CC/UPN)","totalSeats":7,"si":0,"no":0,"abstencion":2,"noVota":5,"color":"#8b5cf6"}],
    bocgUrl: "https://www.congreso.es/datos-abiertos",
    expedienteNumber: "121/20260218",
  },
  {
    id: "congreso-2026-02-17-1",
    title: "Juventud y políticas: un nuevo marco para el futuro",
    officialTitle: "Proposición de Ley del Grupo Parlamentario Socialista, sobre la evaluación del impacto en el ámbito de la juventud de las políticas públicas.",
    chamber: "congreso",
    date: "2026-02-17",
    time: "18:00 h",
    type: "proposicion_ley",
    status: "rechazado",
    category: "Juventud",
    summary: "El Congreso evalúa la efectividad de las políticas para jóvenes, buscando un futuro más prometedor. Esto impactará en la formación y el empleo, mejorando la calidad de vida de los más jóvenes.",
    isOmnibus: false,
    threeKeys: {
      "what": "La ley evalúa políticas para mejorar la calidad de vida de los jóvenes.",
      "pocket": "Ayuda a reducir la carga financiera en educación y empleo.",
      "clash": "Defensores ven oportunidades para el desarrollo, mientras que críticos temen un gasto innecesario."
},
    beforeVsAfter: {
      "before": "Los jóvenes enfrentan desafíos como la falta de oportunidades laborales y el alto costo de la educación.",
      "after": "Se implementarán políticas que buscan mejorar la empleabilidad y reducir la deuda estudiantil."
},
    measures: [
      {
            "id": "congreso-2026-02-17-1-m1",
            "title": "Plan de formación y empleo para jóvenes",
            "category": "Empleo",
            "plainDescription": "La medida busca mejorar la empleabilidad de los jóvenes mediante formación y programas de inserción laboral.",
            "whoIsAffected": [
                  "Jóvenes entre 18 y 30 años",
                  "Empresas que participen en programas de formación"
            ],
            "realWorldExample": "Juan, un joven de 22 años, recibió formación en programación y ahora trabaja en una startup local, reduciendo su deuda estudiantil y mejorando su calidad de vida.",
            "argumentsPro": [
                  "Mejora la empleabilidad y reduce la desigualdad",
                  "Ayuda a la economía local al generar empleo joven"
            ],
            "argumentsContra": [
                  "Posible aumento de costos para empresas",
                  "Riesgo de malgastar recursos en formación no demandada"
            ]
      }
],
    votesSummary: {"si":172,"no":174,"abstencion":0,"noVota":4,"total":350},
    groupVotes: [{"groupName":"G.P. Popular (PP)","totalSeats":137,"si":137,"no":0,"abstencion":0,"noVota":0,"color":"#0ea5e9"},{"groupName":"G.P. Socialista (PSOE)","totalSeats":121,"si":35,"no":86,"abstencion":0,"noVota":0,"color":"#ef4444"},{"groupName":"G.P. VOX","totalSeats":33,"si":0,"no":33,"abstencion":0,"noVota":0,"color":"#22c55e"},{"groupName":"G.P. Plurinacional Sumar","totalSeats":27,"si":0,"no":27,"abstencion":0,"noVota":0,"color":"#ec4899"},{"groupName":"G.P. Republicano (ERC)","totalSeats":7,"si":0,"no":7,"abstencion":0,"noVota":0,"color":"#f59e0b"},{"groupName":"G.P. Junts per Catalunya","totalSeats":7,"si":0,"no":7,"abstencion":0,"noVota":0,"color":"#06b6d4"},{"groupName":"G.P. Euskal Herria Bildu","totalSeats":6,"si":0,"no":6,"abstencion":0,"noVota":0,"color":"#84cc16"},{"groupName":"G.P. Vasco (EAJ-PNV)","totalSeats":5,"si":0,"no":5,"abstencion":0,"noVota":0,"color":"#10b981"},{"groupName":"G.P. Mixto (Podemos/BNG/CC/UPN)","totalSeats":7,"si":0,"no":3,"abstencion":0,"noVota":4,"color":"#8b5cf6"}],
    bocgUrl: "https://www.congreso.es/datos-abiertos",
    expedienteNumber: "121/20260217",
  },
  {
    id: "congreso-2026-02-17-2",
    title: "Ley para proteger a las mujeres y garantizar la seguridad",
    officialTitle: "Proposición de Ley del Grupo Parlamentario VOX, Orgánica para la protección de la dignidad de las mujeres y la seguridad ciudadana en el espacio público.",
    chamber: "congreso",
    date: "2026-02-17",
    time: "18:00 h",
    type: "proposicion_ley",
    status: "rechazado",
    category: "Justicia",
    summary: "El Congreso votará sobre una ley que busca proteger a las mujeres en el espacio público. Esto supone un avance en la seguridad y el bienestar de las ciudadanas.",
    isOmnibus: false,
    threeKeys: {
      "what": "Establece medidas para proteger a las mujeres en el espacio público.",
      "pocket": "No afecta directamente el bolsillo de los ciudadanos, pero mejora la seguridad y la calidad de vida.",
      "clash": "Defensores argumentan que es necesario para prevenir el acoso, mientras que opositores temen que pueda limitar libertades."
},
    beforeVsAfter: {
      "before": "Antes, las mujeres se enfrentaban a situaciones de acoso y temor en el espacio público.",
      "after": "Con la nueva ley, se espera que las mujeres se sientan más seguras y libres para moverse por la ciudad."
},
    measures: [
      {
            "id": "congreso-2026-02-17-2-m1",
            "title": "Zonas seguras para mujeres",
            "category": "Seguridad",
            "plainDescription": "Establece áreas protegidas en la ciudad para garantizar la seguridad de las mujeres.",
            "whoIsAffected": [
                  "Mujeres de todas las edades y profesiones"
            ],
            "realWorldExample": "María, una trabajadora de oficina, se siente más segura al cruzar la calle en una zona marcada con luces y cámaras de seguridad.",
            "argumentsPro": [
                  "Se reduce el riesgo de acoso y agresión",
                  "Mejora la calidad de vida de las mujeres"
            ],
            "argumentsContra": [
                  "Puede generar una sensación de segregación",
                  "Supone un gasto adicional para la ciudad"
            ]
      }
],
    votesSummary: {"si":170,"no":177,"abstencion":1,"noVota":2,"total":350},
    groupVotes: [{"groupName":"G.P. Popular (PP)","totalSeats":137,"si":137,"no":0,"abstencion":0,"noVota":0,"color":"#0ea5e9"},{"groupName":"G.P. Socialista (PSOE)","totalSeats":121,"si":33,"no":88,"abstencion":0,"noVota":0,"color":"#ef4444"},{"groupName":"G.P. VOX","totalSeats":33,"si":0,"no":33,"abstencion":0,"noVota":0,"color":"#22c55e"},{"groupName":"G.P. Plurinacional Sumar","totalSeats":27,"si":0,"no":27,"abstencion":0,"noVota":0,"color":"#ec4899"},{"groupName":"G.P. Republicano (ERC)","totalSeats":7,"si":0,"no":7,"abstencion":0,"noVota":0,"color":"#f59e0b"},{"groupName":"G.P. Junts per Catalunya","totalSeats":7,"si":0,"no":7,"abstencion":0,"noVota":0,"color":"#06b6d4"},{"groupName":"G.P. Euskal Herria Bildu","totalSeats":6,"si":0,"no":6,"abstencion":0,"noVota":0,"color":"#84cc16"},{"groupName":"G.P. Vasco (EAJ-PNV)","totalSeats":5,"si":0,"no":5,"abstencion":0,"noVota":0,"color":"#10b981"},{"groupName":"G.P. Mixto (Podemos/BNG/CC/UPN)","totalSeats":7,"si":0,"no":4,"abstencion":1,"noVota":2,"color":"#8b5cf6"}],
    bocgUrl: "https://www.congreso.es/datos-abiertos",
    expedienteNumber: "121/20260217",
  },
  {
    id: "congreso-2026-02-12-1",
    title: "Modernización digital en Justicia: agilización procesal",
    officialTitle: "Real Decreto-ley 1/2026, de 6 de febrero, por el que se adoptan medidas urgentes para la modernización digital del servicio público de Justicia y la agilización procesal.",
    chamber: "congreso",
    date: "2026-02-12",
    time: "17:30 h",
    type: "real_decreto_ley",
    status: "aprobado",
    category: "Justicia",
    summary: "El Real Decreto-ley 1/2026 moderniza la Justicia digitalizando servicios y agilizando trámites, beneficiando a ciudadanos y empresas.",
    isOmnibus: false,
    threeKeys: {
      "what": "Implementar servicios digitales para acelerar trámites judiciales.",
      "pocket": "Reducción de costes y tiempo para ciudadanos en trámites legales.",
      "clash": "Pro: mejora eficiencia; Contra: preocupación por la privacidad y accesibilidad."
},
    beforeVsAfter: {
      "before": "Procesos judiciales tradicionales y lentos.",
      "after": "Uso de plataformas digitales para expedientes y trámites."
},
    measures: [
      {
            "id": "congreso-2026-02-12-1-m1",
            "title": "Plataforma digital para expedientes judiciales",
            "category": "Servicios digitales",
            "plainDescription": "Permite a ciudadanos y empresas presentar y gestionar trámites legales online.",
            "whoIsAffected": [
                  "Ciudadanos",
                  "Empresas"
            ],
            "realWorldExample": "Un ciudadano puede presentar una demanda en línea en 15 minutos, ahorrando 2 horas de espera en el juzgado.",
            "argumentsPro": [
                  "Mejora la accesibilidad y eficiencia en trámites legales.",
                  "Reducción de costes y tiempo para ciudadanos."
            ],
            "argumentsContra": [
                  "Preocupación por la seguridad y privacidad de datos.",
                  "Necesidad de formación para usuarios no digitales."
            ]
      }
],
    votesSummary: {"si":178,"no":169,"abstencion":3,"noVota":0,"total":350},
    groupVotes: [{"groupName":"G.P. Popular (PP)","totalSeats":137,"si":137,"no":0,"abstencion":0,"noVota":0,"color":"#0ea5e9"},{"groupName":"G.P. Socialista (PSOE)","totalSeats":121,"si":41,"no":80,"abstencion":0,"noVota":0,"color":"#ef4444"},{"groupName":"G.P. VOX","totalSeats":33,"si":0,"no":33,"abstencion":0,"noVota":0,"color":"#22c55e"},{"groupName":"G.P. Plurinacional Sumar","totalSeats":27,"si":0,"no":27,"abstencion":0,"noVota":0,"color":"#ec4899"},{"groupName":"G.P. Republicano (ERC)","totalSeats":7,"si":0,"no":7,"abstencion":0,"noVota":0,"color":"#f59e0b"},{"groupName":"G.P. Junts per Catalunya","totalSeats":7,"si":0,"no":7,"abstencion":0,"noVota":0,"color":"#06b6d4"},{"groupName":"G.P. Euskal Herria Bildu","totalSeats":6,"si":0,"no":6,"abstencion":0,"noVota":0,"color":"#84cc16"},{"groupName":"G.P. Vasco (EAJ-PNV)","totalSeats":5,"si":0,"no":5,"abstencion":0,"noVota":0,"color":"#10b981"},{"groupName":"G.P. Mixto (Podemos/BNG/CC/UPN)","totalSeats":7,"si":0,"no":4,"abstencion":3,"noVota":0,"color":"#8b5cf6"}],
    bocgUrl: "https://www.congreso.es/datos-abiertos",
    expedienteNumber: "130/000038",
  },
  {
    id: "congreso-2026-02-10-1",
    title: "Formentera obtendrá su propio senador",
    officialTitle: "Proposición del Parlamento de las Illes Balears, de Ley para la reforma del artículo 69.3 de la Constitución española a los efectos de que la isla de Formentera elija un senador propio, con independencia del que elija la isla de Eivissa (corresponde a los números de expediente 101/000004/0000 de la XII Legislatura, 101/000004/0000 de la XIII Legislatura y 101/000002/0000 de la XIV Legislatura).",
    chamber: "congreso",
    date: "2026-02-10",
    time: "18:00 h",
    type: "proyecto_ley",
    status: "aprobado",
    category: "Autonomía",
    summary: "El Congreso discutirá la reforma de la Constitución para que Formentera tenga su propio senador. Esto permitirá que la voz de la isla sea escuchada de manera más directa y específica, beneficiando a sus habitantes y visitantes.",
    isOmnibus: false,
    threeKeys: {
      "what": "La isla de Formentera elegirá a su propio representante en el Senado.",
      "pocket": "Este cambio no afectará directamente los bolsillos de los ciudadanos, pero sí reflejará mejor sus intereses en el Congreso.",
      "clash": "Los defensores argumentan que Formentera necesita una voz propia, mientras los opositores temen que esto pueda dividir la representación de las Islas Baleares."
},
    beforeVsAfter: {
      "before": "Actualmente, los votos de Formentera se incluyen en la elección de un senador que representa a toda la isla de Eivissa.",
      "after": "Con la nueva ley, Formentera tendrá su propio senador, lo que permitirá una representación más específica de sus necesidades y prioridades."
},
    measures: [
      {
            "id": "congreso-2026-02-10-1-m1",
            "title": "Formentera obtendrá su propio senador",
            "category": "Representación",
            "plainDescription": "La medida establece que Formentera elegirá a su propio senador, garantizando una representación más específica de sus necesidades y prioridades.",
            "whoIsAffected": [
                  "Habitantes de Formentera",
                  "Empresarios locales",
                  "Turistas"
            ],
            "realWorldExample": "Juan, un propietario de un pequeño restaurante en Formentera, se sentiría más representado si hubiera un senador que entienda las necesidades de su negocio, como la importancia de la conservación del medio ambiente y la promoción de la gastronomía local.",
            "argumentsPro": [
                  "Mejor representación de las necesidades locales",
                  "Mayor atención a la singularidad de Formentera"
            ],
            "argumentsContra": [
                  "Posible división de la representación de las Islas Baleares",
                  "Costos potenciales para el sistema político"
            ]
      }
],
    votesSummary: {"si":176,"no":33,"abstencion":138,"noVota":3,"total":350},
    groupVotes: [{"groupName":"G.P. Popular (PP)","totalSeats":137,"si":137,"no":0,"abstencion":0,"noVota":0,"color":"#0ea5e9"},{"groupName":"G.P. Socialista (PSOE)","totalSeats":121,"si":39,"no":33,"abstencion":49,"noVota":0,"color":"#ef4444"},{"groupName":"G.P. VOX","totalSeats":33,"si":0,"no":0,"abstencion":33,"noVota":0,"color":"#22c55e"},{"groupName":"G.P. Plurinacional Sumar","totalSeats":27,"si":0,"no":0,"abstencion":27,"noVota":0,"color":"#ec4899"},{"groupName":"G.P. Republicano (ERC)","totalSeats":7,"si":0,"no":0,"abstencion":7,"noVota":0,"color":"#f59e0b"},{"groupName":"G.P. Junts per Catalunya","totalSeats":7,"si":0,"no":0,"abstencion":7,"noVota":0,"color":"#06b6d4"},{"groupName":"G.P. Euskal Herria Bildu","totalSeats":6,"si":0,"no":0,"abstencion":6,"noVota":0,"color":"#84cc16"},{"groupName":"G.P. Vasco (EAJ-PNV)","totalSeats":5,"si":0,"no":0,"abstencion":5,"noVota":0,"color":"#10b981"},{"groupName":"G.P. Mixto (Podemos/BNG/CC/UPN)","totalSeats":7,"si":0,"no":0,"abstencion":4,"noVota":3,"color":"#8b5cf6"}],
    bocgUrl: "https://www.congreso.es/datos-abiertos",
    expedienteNumber: "121/20260210",
  },
  {
    id: "congreso-2026-02-10-2",
    title: "Garantizar el cumplimiento de la Ley Presupuestaria",
    officialTitle: "Proposición de Ley del Grupo Parlamentario Popular en el Congreso, para garantizar el cumplimiento de la Ley 47/2003, de 26 de noviembre, General Presupuestaria.",
    chamber: "congreso",
    date: "2026-02-10",
    time: "18:00 h",
    type: "proposicion_ley",
    status: "aprobado",
    category: "Economía",
    summary: "El Congreso discute si aprobar esta ley para supervisar el cumplimiento presupuestario, lo que podría mejorar la gestión de recursos y, en última instancia, el bienestar de los ciudadanos.",
    isOmnibus: false,
    threeKeys: {
      "what": "Establece controles para asegurar que se respeten los presupuestos",
      "pocket": "Ayuda a prevenir el gasto no planificado y garantiza recursos para servicios esenciales",
      "clash": "Defensores ven la ley como necesaria para controlar el gasto, mientras que opositores temen que restrinja iniciativas innovadoras"
},
    beforeVsAfter: {
      "before": "Antes, el gasto no planificado ponía en riesgo los servicios esenciales",
      "after": "Ahora, se prevé un uso más eficiente de los fondos, mejorando la calidad de vida"
},
    measures: [
      {
            "id": "congreso-2026-02-10-2-m1",
            "title": "Supervisión del gasto público",
            "category": "Control presupuestario",
            "plainDescription": "Establece mecanismos para monitorear y controlar el gasto público, asegurando que se respeten los límites presupuestarios",
            "whoIsAffected": [
                  "Autoridades fiscales",
                  "Departamentos del gobierno"
            ],
            "realWorldExample": "María, una trabajadora autónoma, ve cómo su contribución a los impuestos se utiliza de manera más eficiente, garantizando que los servicios de salud y educación no sufran recortes",
            "argumentsPro": [
                  "Prevención de gastos no planificados",
                  "Garantía de recursos para servicios esenciales"
            ],
            "argumentsContra": [
                  "Posible restricción de iniciativas innovadoras",
                  "Mayor burocracia en el gasto público"
            ]
      }
],
    votesSummary: {"si":172,"no":162,"abstencion":13,"noVota":3,"total":350},
    groupVotes: [{"groupName":"G.P. Popular (PP)","totalSeats":137,"si":137,"no":0,"abstencion":0,"noVota":0,"color":"#0ea5e9"},{"groupName":"G.P. Socialista (PSOE)","totalSeats":121,"si":35,"no":86,"abstencion":0,"noVota":0,"color":"#ef4444"},{"groupName":"G.P. VOX","totalSeats":33,"si":0,"no":33,"abstencion":0,"noVota":0,"color":"#22c55e"},{"groupName":"G.P. Plurinacional Sumar","totalSeats":27,"si":0,"no":27,"abstencion":0,"noVota":0,"color":"#ec4899"},{"groupName":"G.P. Republicano (ERC)","totalSeats":7,"si":0,"no":7,"abstencion":0,"noVota":0,"color":"#f59e0b"},{"groupName":"G.P. Junts per Catalunya","totalSeats":7,"si":0,"no":7,"abstencion":0,"noVota":0,"color":"#06b6d4"},{"groupName":"G.P. Euskal Herria Bildu","totalSeats":6,"si":0,"no":2,"abstencion":4,"noVota":0,"color":"#84cc16"},{"groupName":"G.P. Vasco (EAJ-PNV)","totalSeats":5,"si":0,"no":0,"abstencion":5,"noVota":0,"color":"#10b981"},{"groupName":"G.P. Mixto (Podemos/BNG/CC/UPN)","totalSeats":7,"si":0,"no":0,"abstencion":4,"noVota":3,"color":"#8b5cf6"}],
    bocgUrl: "https://www.congreso.es/datos-abiertos",
    expedienteNumber: "121/20260210",
  },
  {
    id: "congreso-2026-01-27-1",
    title: "Prórroga de medidas para proteger a los más vulnerables",
    officialTitle: "Real Decreto-ley 16/2025, de 23 de diciembre, por el que se prorrogan determinadas medidas para hacer frente a situaciones de vulnerabilidad social, y se adoptan medidas urgentes en materia tributaria y de Seguridad Social.",
    chamber: "congreso",
    date: "2026-01-27",
    time: "18:00 h",
    type: "real_decreto_ley",
    status: "rechazado",
    category: "Vivienda",
    summary: "El Congreso aprueba un real decreto-ley para prorrogar medidas que protegen a los más vulnerables, mejorando la calidad de vida de familias y autónomos.",
    isOmnibus: true,
    threeKeys: {
      "what": "Se prorrogan medidas para ayudar a familias en situación de vulnerabilidad.",
      "pocket": "Los inquilinos pagarán menos alquiler y los autónomos recibirán ayudas económicas.",
      "clash": "Inquilinos y propietarios buscan equilibrar el coste del alquiler, mientras que autónomos y pequeños empresarios piden más apoyo."
},
    beforeVsAfter: {
      "before": "Antes, los inquilinos pagaban alquileres más altos y los autónomos luchaban por sobrevivir.",
      "after": "Ahora, los inquilinos podrán pagar menos y los autónomos recibirán apoyo económico."
},
    measures: [
      {
            "id": "congreso-2026-01-27-1-m1",
            "title": "Ayuda al alquiler",
            "category": "Vivienda",
            "plainDescription": "Se establece una subvención para ayudar a los inquilinos a pagar menos alquiler.",
            "whoIsAffected": [
                  "Familias con bajos ingresos",
                  "Estudiantes en alquiler"
            ],
            "realWorldExample": "María, una estudiante de 22 años, pagará 200 euros menos al mes en alquiler gracias a la subvención, lo que le permitirá ahorrar para sus estudios.",
            "argumentsPro": [
                  "Ayuda a los jóvenes a acceder al mercado de alquiler",
                  "Reduce la presión financiera sobre los inquilinos"
            ],
            "argumentsContra": [
                  "Propietarios temen que esto disminuya la rentabilidad de sus inmuebles",
                  "Se podría crear un desequilibrio en el mercado inmobiliario"
            ]
      }
],
    votesSummary: {"si":171,"no":178,"abstencion":0,"noVota":1,"total":350},
    groupVotes: [{"groupName":"G.P. Popular (PP)","totalSeats":137,"si":137,"no":0,"abstencion":0,"noVota":0,"color":"#0ea5e9"},{"groupName":"G.P. Socialista (PSOE)","totalSeats":121,"si":34,"no":87,"abstencion":0,"noVota":0,"color":"#ef4444"},{"groupName":"G.P. VOX","totalSeats":33,"si":0,"no":33,"abstencion":0,"noVota":0,"color":"#22c55e"},{"groupName":"G.P. Plurinacional Sumar","totalSeats":27,"si":0,"no":27,"abstencion":0,"noVota":0,"color":"#ec4899"},{"groupName":"G.P. Republicano (ERC)","totalSeats":7,"si":0,"no":7,"abstencion":0,"noVota":0,"color":"#f59e0b"},{"groupName":"G.P. Junts per Catalunya","totalSeats":7,"si":0,"no":7,"abstencion":0,"noVota":0,"color":"#06b6d4"},{"groupName":"G.P. Euskal Herria Bildu","totalSeats":6,"si":0,"no":6,"abstencion":0,"noVota":0,"color":"#84cc16"},{"groupName":"G.P. Vasco (EAJ-PNV)","totalSeats":5,"si":0,"no":5,"abstencion":0,"noVota":0,"color":"#10b981"},{"groupName":"G.P. Mixto (Podemos/BNG/CC/UPN)","totalSeats":7,"si":0,"no":6,"abstencion":0,"noVota":1,"color":"#8b5cf6"}],
    bocgUrl: "https://www.congreso.es/datos-abiertos",
    expedienteNumber: "121/20260127",
  },
  {
    id: "congreso-2026-01-27-2",
    title: "Bono para transporte: más movilidad, menos coste",
    officialTitle: "Real Decreto-ley 17/2025, de 23 de diciembre, de medidas de promoción del uso del transporte público mediante la bonificación de abonos y títulos multiviaje.",
    chamber: "congreso",
    date: "2026-01-27",
    time: "18:00 h",
    type: "real_decreto_ley",
    status: "aprobado",
    category: "Tráfico",
    summary: "El Congreso aprueba un Real Decreto-ley para promover el uso del transporte público, lo que beneficiará a miles de usuarios y ayudará a reducir la congestión en las ciudades.",
    isOmnibus: true,
    threeKeys: {
      "what": "Se bonifican abonos y títulos multiviaje para fomentar el uso del transporte público.",
      "pocket": "Los usuarios podrán ahorrar hasta un 20% en su tarjeta de transporte, beneficiando a familias y jóvenes.",
      "clash": "Los defensores de la medida argumentan que es necesario reducir el tráfico, mientras que los propietarios de coches temen un aumento de la congestión en las ciudades."
},
    beforeVsAfter: {
      "before": "Antes, los usuarios pagaban el precio completo de sus viajes en transporte público.",
      "after": "Ahora, con la bonificación, los costes se reducirán, incentivando el uso del transporte público."
},
    measures: [
      {
            "id": "congreso-2026-01-27-2-m1",
            "title": "Bono para transporte público",
            "category": "Transporte",
            "plainDescription": "Se implementa una bonificación del 20% en los abonos y títulos multiviaje para fomentar el uso del transporte público.",
            "whoIsAffected": [
                  "Familias con presupuesto ajustado",
                  "Jóvenes estudiantes"
            ],
            "realWorldExample": "Juan, un estudiante universitario, podrá ahorrar 120 euros al mes en su tarjeta de transporte, lo que le permitirá destinar esos ahorros a otros gastos necesarios.",
            "argumentsPro": [
                  "Reducir la congestión en las ciudades",
                  "Mejorar la calidad del aire"
            ],
            "argumentsContra": [
                  "Posible aumento de la congestión en las ciudades",
                  "Impacto en los propietarios de coches"
            ]
      }
],
    votesSummary: {"si":179,"no":32,"abstencion":137,"noVota":2,"total":350},
    groupVotes: [{"groupName":"G.P. Popular (PP)","totalSeats":137,"si":137,"no":0,"abstencion":0,"noVota":0,"color":"#0ea5e9"},{"groupName":"G.P. Socialista (PSOE)","totalSeats":121,"si":42,"no":32,"abstencion":47,"noVota":0,"color":"#ef4444"},{"groupName":"G.P. VOX","totalSeats":33,"si":0,"no":0,"abstencion":33,"noVota":0,"color":"#22c55e"},{"groupName":"G.P. Plurinacional Sumar","totalSeats":27,"si":0,"no":0,"abstencion":27,"noVota":0,"color":"#ec4899"},{"groupName":"G.P. Republicano (ERC)","totalSeats":7,"si":0,"no":0,"abstencion":7,"noVota":0,"color":"#f59e0b"},{"groupName":"G.P. Junts per Catalunya","totalSeats":7,"si":0,"no":0,"abstencion":7,"noVota":0,"color":"#06b6d4"},{"groupName":"G.P. Euskal Herria Bildu","totalSeats":6,"si":0,"no":0,"abstencion":6,"noVota":0,"color":"#84cc16"},{"groupName":"G.P. Vasco (EAJ-PNV)","totalSeats":5,"si":0,"no":0,"abstencion":5,"noVota":0,"color":"#10b981"},{"groupName":"G.P. Mixto (Podemos/BNG/CC/UPN)","totalSeats":7,"si":0,"no":0,"abstencion":5,"noVota":2,"color":"#8b5cf6"}],
    bocgUrl: "https://www.congreso.es/datos-abiertos",
    expedienteNumber: "121/20260127",
  },
  {
    id: "congreso-2026-01-27-3",
    title: "Bono para transporte público: más movilidad, menos coste",
    officialTitle: "Tramitación como Proyecto de Ley por el procedimiento de urgencia del Real Decreto-ley 17/2025, de 23 de diciembre, de medidas de promoción del uso del transporte público mediante la bonificación de abonos y títulos multiviaje.",
    chamber: "congreso",
    date: "2026-01-27",
    time: "18:00 h",
    type: "real_decreto_ley",
    status: "aprobado",
    category: "Tráfico",
    summary: "El Congreso votará sobre la bonificación de abonos y títulos multiviaje, mejorando la movilidad y reduciendo costes para los ciudadanos. Esto supone un alivio para familias y jóvenes, mientras que se busca equilibrar el impacto en el tráfico y la contaminación.",
    isOmnibus: true,
    threeKeys: {
      "what": "Se bonifican abonos y títulos multiviaje para fomentar el uso del transporte público.",
      "pocket": "Los usuarios podrán ahorrar hasta un 20% en su tarjeta de abono, beneficiando a familias y jóvenes.",
      "clash": "Los defensores del plan argumentan que es necesario reducir la dependencia del coche, mientras que los críticos temen que no sea suficiente para combatir el tráfico y la contaminación."
},
    beforeVsAfter: {
      "before": "Antes, los usuarios pagaban el precio completo de sus viajes en transporte público.",
      "after": "Ahora, con la bonificación, los costes se reducirán, incentivando el uso del transporte público."
},
    measures: [
      {
            "id": "congreso-2026-01-27-3-m1",
            "title": "Bono para abonos de transporte público",
            "category": "Transporte",
            "plainDescription": "Se implementa una bonificación del 20% en los abonos y títulos multiviaje para promover el uso del transporte público.",
            "whoIsAffected": [
                  "Familias con presupuesto ajustado",
                  "Estudiantes y jóvenes"
            ],
            "realWorldExample": "Juan, un estudiante universitario, podría ahorrar 120 euros al mes en su tarjeta de abono, lo que le permitiría ahorrar en otros gastos y destinar más recursos a su formación.",
            "argumentsPro": [
                  "Se reduce la dependencia del coche, mejorando la calidad del aire",
                  "Se fomenta el uso de medios de transporte más sostenibles"
            ],
            "argumentsContra": [
                  "La bonificación podría ser insuficiente para combatir el tráfico y la contaminación",
                  "Se podría generar un aumento de usuarios que presione los servicios públicos"
            ]
      }
],
    votesSummary: {"si":316,"no":33,"abstencion":0,"noVota":1,"total":350},
    groupVotes: [{"groupName":"G.P. Popular (PP)","totalSeats":137,"si":137,"no":0,"abstencion":0,"noVota":0,"color":"#0ea5e9"},{"groupName":"G.P. Socialista (PSOE)","totalSeats":121,"si":121,"no":0,"abstencion":0,"noVota":0,"color":"#ef4444"},{"groupName":"G.P. VOX","totalSeats":33,"si":33,"no":0,"abstencion":0,"noVota":0,"color":"#22c55e"},{"groupName":"G.P. Plurinacional Sumar","totalSeats":27,"si":25,"no":2,"abstencion":0,"noVota":0,"color":"#ec4899"},{"groupName":"G.P. Republicano (ERC)","totalSeats":7,"si":0,"no":7,"abstencion":0,"noVota":0,"color":"#f59e0b"},{"groupName":"G.P. Junts per Catalunya","totalSeats":7,"si":0,"no":7,"abstencion":0,"noVota":0,"color":"#06b6d4"},{"groupName":"G.P. Euskal Herria Bildu","totalSeats":6,"si":0,"no":6,"abstencion":0,"noVota":0,"color":"#84cc16"},{"groupName":"G.P. Vasco (EAJ-PNV)","totalSeats":5,"si":0,"no":5,"abstencion":0,"noVota":0,"color":"#10b981"},{"groupName":"G.P. Mixto (Podemos/BNG/CC/UPN)","totalSeats":7,"si":0,"no":6,"abstencion":0,"noVota":1,"color":"#8b5cf6"}],
    bocgUrl: "https://www.congreso.es/datos-abiertos",
    expedienteNumber: "121/20260127",
  },
];

export const ALL_SESSION_DATES: string[] = Array.from(new Set(SAMPLE_INITIATIVES.map((i) => i.date))).sort();
export const LATEST_SESSION_DATE: string = ALL_SESSION_DATES[ALL_SESSION_DATES.length - 1] || '2026-10-02';

export function getCalendarDaysForMonth(year: number, month: number, todayDate?: string, chamberFilter: string = 'all'): CalendarDay[] {
  const daysInMonth = new Date(year, month, 0).getDate();
  const calendarDays: CalendarDay[] = [];
  const todayStr = todayDate || (typeof window !== 'undefined' ? new Date().toISOString().split('T')[0] : LATEST_SESSION_DATE);

  for (let day = 1; day <= daysInMonth; day++) {
    const dayStr = day < 10 ? `0${day}` : `${day}`;
    const monthStr = month < 10 ? `0${month}` : `${month}`;
    const dateStr = `${year}-${monthStr}-${dayStr}`;

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
