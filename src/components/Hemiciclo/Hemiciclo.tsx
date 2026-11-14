import React, { useState, useMemo } from 'react';
import type { DeputyVote, GroupVoteSummary } from '../../types/parliament';

interface HemicicloProps {
  deputies: DeputyVote[];
  groupVotes?: GroupVoteSummary[];
}

export const Hemiciclo: React.FC<HemicicloProps> = ({ deputies, groupVotes }) => {
  const [hoveredDeputy, setHoveredDeputy] = useState<DeputyVote | null>(null);

  const isDiputacionPermanente = deputies.length === 69;
  const isSenado = deputies.length === 266;
  const isEuroparl = deputies.length === 61;
  const totalSeats = deputies.length;

  // Adaptación de los arcos concéntricos según la cámara parlamentaria
  const rows = useMemo(() => {
    if (isDiputacionPermanente) {
      // 69 Miembros Diputación Permanente: 3 arcos concéntricos equilibrados (18 + 24 + 27 = 69)
      return [
        { radius: 110, seats: 18 },
        { radius: 155, seats: 24 },
        { radius: 200, seats: 27 },
      ];
    }
    if (isEuroparl) {
      // 61 Eurodiputados: 3 arcos concéntricos equilibrados (16 + 21 + 24 = 61)
      return [
        { radius: 110, seats: 16 },
        { radius: 155, seats: 21 },
        { radius: 200, seats: 24 },
      ];
    }
    if (isSenado) {
      // 266 Senadores: 5 arcos concéntricos (35 + 45 + 55 + 63 + 68 = 266)
      return [
        { radius: 100, seats: 35 },
        { radius: 135, seats: 45 },
        { radius: 170, seats: 55 },
        { radius: 205, seats: 63 },
        { radius: 240, seats: 68 },
      ];
    }
    // 350 Diputados Congreso: 45 + 58 + 72 + 85 + 90 = 350
    return [
      { radius: 100, seats: 45 },
      { radius: 135, seats: 58 },
      { radius: 170, seats: 72 },
      { radius: 205, seats: 85 },
      { radius: 240, seats: 90 },
    ];
  }, [isDiputacionPermanente, isEuroparl, isSenado]);

  // Distribute seats across arcs (PI to 0 in radians, from left to right)
  const seatPositions: Array<{ x: number; y: number; deputy: DeputyVote }> = [];
  let deputyIndex = 0;

  for (const row of rows) {
    const angleStep = Math.PI / (row.seats - 1);
    for (let i = 0; i < row.seats; i++) {
      if (deputyIndex < deputies.length) {
        const angle = Math.PI - i * angleStep;
        // Center of the hemicycle at (280, 260)
        const x = 280 + row.radius * Math.cos(angle);
        const y = 260 - row.radius * Math.sin(angle);
        seatPositions.push({
          x,
          y,
          deputy: deputies[deputyIndex],
        });
        deputyIndex++;
      }
    }
  }

  const getVoteColor = (vote: string) => {
    switch (vote) {
      case 'si':
        return '#1F4D36'; // Tinta verde bosque
      case 'no':
        return '#8F1D1D'; // Carmesí de imprenta
      case 'abstencion':
        return '#A26815'; // Siena / ocre
      default:
        return '#7A756C'; // Grafito de plomo
    }
  };

  return (
    <div className="bg-[#FAF7F0] border-2 border-[#1B1A17] p-5 relative shadow-[2px_2px_0px_#1B1A17]">
      {/* Decorative Corner Ornaments */}
      <span className="absolute top-1 left-1.5 text-xs text-[#1B1A17] select-none">✦</span>
      <span className="absolute top-1 right-1.5 text-xs text-[#1B1A17] select-none">✦</span>
      <span className="absolute bottom-1 left-1.5 text-xs text-[#1B1A17] select-none">✦</span>
      <span className="absolute bottom-1 right-1.5 text-xs text-[#1B1A17] select-none">✦</span>

      {/* Header Infografía de Prensa */}
      <div className="border-b-2 border-[#1B1A17] pb-3 mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <span className="text-[10px] font-mono tracking-widest uppercase text-[#6E695F] block font-bold">
            GRABADO LITOGRÁFICO DE LAS CORTES • PLANO DE ESCRUTINIO
          </span>
          <h4 className="text-base sm:text-lg font-headline font-bold text-[#1B1A17] tracking-tight">
            {isDiputacionPermanente
              ? 'Distribución Nominal de los 69 Miembros de la Diputación Permanente'
              : isEuroparl
              ? 'Distribución Nominal de los 61 Eurodiputados Españoles'
              : isSenado
              ? 'Distribución Nominal de los 266 Escaños del Senado de España'
              : 'Distribución Nominal de los 350 Escaños del Congreso de los Diputados'}
          </h4>
          <p className="text-xs font-editorial text-[#4E4B44] italic">
            Coloque el cursor sobre cualquier escaño para consultar la filiación y el sentido del voto individual.
          </p>
        </div>

        {/* Hovered Tooltip Info (Estilo Papeleta Mecanografiada) */}
        <div className="min-h-[40px] px-3 py-1.5 bg-[#FFFFFF] border border-[#1B1A17] shadow-sm text-xs font-typewriter flex items-center gap-2 self-stretch sm:self-auto">
          {hoveredDeputy ? (
            <>
              <span
                className="w-3 h-3 border border-[#1B1A17] inline-block shrink-0"
                style={{ backgroundColor: getVoteColor(hoveredDeputy.vote) }}
              />
              <span className="font-bold text-[#1B1A17]">{hoveredDeputy.name}</span>
              <span className="text-[#6E695F]">({hoveredDeputy.party} · {hoveredDeputy.province}):</span>
              <span
                className="font-bold uppercase px-1.5 py-0.5 border text-[11px]"
                style={{
                  color: getVoteColor(hoveredDeputy.vote),
                  borderColor: getVoteColor(hoveredDeputy.vote),
                  backgroundColor: 'rgba(0,0,0,0.03)',
                }}
              >
                VOTO: {hoveredDeputy.vote}
              </span>
            </>
          ) : (
            <span className="text-[#8C877D] italic">☞ Pase el cursor sobre un escaño...</span>
          )}
        </div>
      </div>

      {/* SVG Hemicycle Grabado Calcográfico */}
      <div className="w-full flex flex-col items-center justify-center py-2 bg-[#F6F1E5] border border-[#D8D1C3] p-3">
        <svg viewBox="0 0 560 280" className="w-full max-w-xl h-auto">
          {/* Arcos guía concéntricos adaptados a la geometría de la cámara */}
          {rows.map((r, i) => (
            <path
              key={i}
              d={`M ${280 - r.radius} 260 A ${r.radius} ${r.radius} 0 0 1 ${280 + r.radius} 260`}
              fill="none"
              stroke="#D8D1C3"
              strokeWidth="0.8"
              strokeDasharray="2,2"
            />
          ))}

          {/* Presidential Table Pod (Tribuna Presidencial) */}
          <rect x="210" y="246" width="140" height="20" fill="#2D2B27" stroke="#1B1A17" strokeWidth="1" />
          <text x="280" y="259" textAnchor="middle" fill="#FAF7EE" fontSize="7.5" fontFamily="Newsreader, serif" fontWeight="700" letterSpacing="0.05em">
            {isEuroparl ? 'MESA DE LA EUROCÁMARA' : isSenado ? 'MESA DEL SENADO' : 'MESA DEL CONGRESO'}
          </text>

          {/* Seats */}
          {seatPositions.map((pos, idx) => {
            const isHovered = hoveredDeputy?.id === pos.deputy.id;
            return (
              <circle
                key={idx}
                cx={pos.x}
                cy={pos.y}
                r={isHovered ? 5.5 : 4}
                fill={getVoteColor(pos.deputy.vote)}
                stroke="#1B1A17"
                strokeWidth={isHovered ? 1.8 : 0.8}
                className="cursor-pointer transition-all duration-150 hover:opacity-90"
                onMouseEnter={() => setHoveredDeputy(pos.deputy)}
                onMouseLeave={() => setHoveredDeputy(null)}
              />
            );
          })}
        </svg>

        {/* Grabado Legend */}
        <div className="flex flex-wrap items-center justify-center gap-4 mt-3 pt-2 border-t border-[#D8D1C3] text-xs font-editorial">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full border border-[#1B1A17] bg-[#1F4D36]"></span>
            <span className="text-[#1B1A17] font-semibold">Voto Favorable (Sí)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full border border-[#1B1A17] bg-[#8F1D1D]"></span>
            <span className="text-[#1B1A17] font-semibold">Voto Contrario (No)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full border border-[#1B1A17] bg-[#A26815]"></span>
            <span className="text-[#1B1A17] font-semibold">Abstención</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full border border-[#1B1A17] bg-[#7A756C]"></span>
            <span className="text-[#6E695F]">No emite voto</span>
          </div>
        </div>
      </div>

      {/* Groups summary table (Formato Tabla Estadística Decimonónica) */}
      {groupVotes && (
        <div className="mt-4 pt-3 border-t-2 border-[#1B1A17]">
          <div className="flex items-center justify-between mb-2">
            <h5 className="text-xs font-mono font-bold uppercase tracking-wider text-[#1B1A17]">
              CUADRO GENERAL DE ESCRUTINIO POR GRUPOS PARLAMENTARIOS
            </h5>
            <span className="text-[11px] font-typewriter text-[#6E695F]">Total escaños: {totalSeats}</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 text-xs">
            {groupVotes.map((g) => (
              <div
                key={g.groupName}
                className="p-2.5 bg-[#FFFFFF] border border-[#D8D1C3] shadow-[1px_1px_0px_#D8D1C3] flex flex-col justify-between"
              >
                <div className="border-b border-[#D8D1C3] pb-1 mb-1.5 flex items-center justify-between">
                  <span className="font-headline font-bold text-[#1B1A17] truncate">{g.groupName}</span>
                  <span className="font-typewriter text-[10px] text-[#6E695F]">{g.totalSeats} esc.</span>
                </div>
                <div className="flex items-center justify-between font-typewriter text-[11px]">
                  <span className="text-[#1F4D36] font-bold">Sí: {g.si}</span>
                  <span className="text-[#8F1D1D] font-bold">No: {g.no}</span>
                  {g.abstencion > 0 && <span className="text-[#A26815]">Abs: {g.abstencion}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
