import React from 'react';
import type { CalendarDay } from '../../types/parliament';
import { Radio, ChevronLeft, ChevronRight } from 'lucide-react';

interface ParliamentaryCalendarProps {
  days: CalendarDay[];
  selectedDate: string | null;
  onSelectDate: (dateStr: string | null) => void;
  currentMonthName: string;
  year: number;
  month?: number;
  onChangeMonth?: (year: number, month: number) => void;
  todayDate?: string;
  latestDate?: string;
  isTodaySession?: boolean;
}

const MONTH_NAMES = [
  '',
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];

const PARLIAMENTARY_ACTIVE_MONTHS = [
  { month: 2, name: 'Feb' },
  { month: 3, name: 'Mar' },
  { month: 4, name: 'Abr' },
  { month: 5, name: 'May' },
  { month: 6, name: 'Jun' },
  { month: 9, name: 'Sep' },
  { month: 10, name: 'Oct' },
];

export const ParliamentaryCalendar: React.FC<ParliamentaryCalendarProps> = ({
  days,
  selectedDate,
  onSelectDate,
  currentMonthName,
  year,
  month = 10,
  onChangeMonth,
  todayDate,
  latestDate = '2026-10-02',
  isTodaySession = false,
}) => {
  const weekDays = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

  // Target date for the quick action button
  const targetDate = isTodaySession && todayDate ? todayDate : latestDate;
  const [tY, tM, tD] = targetDate.split('-').map(Number);
  const targetMonthName = MONTH_NAMES[tM] || '';
  const buttonLabel = isTodaySession
    ? `Edición de Hoy (${tD} de ${targetMonthName})`
    : `Última Sesión (${tD} de ${targetMonthName})`;

  // Calculate day of week offset for the 1st of month (0 = Monday, 6 = Sunday)
  const firstDay = new Date(year, month - 1, 1);
  const firstDayOfWeek = (firstDay.getDay() + 6) % 7; // Convert Sunday=0 to Monday=0

  const prevMonth = month === 1 ? 12 : month - 1;
  const nextMonth = month === 12 ? 1 : month + 1;
  const prevMonthName = MONTH_NAMES[prevMonth];
  const nextMonthName = MONTH_NAMES[nextMonth];

  const handlePrevMonth = () => {
    if (!onChangeMonth) return;
    if (month === 1) onChangeMonth(year - 1, 12);
    else onChangeMonth(year, month - 1);
  };

  const handleNextMonth = () => {
    if (!onChangeMonth) return;
    if (month === 12) onChangeMonth(year + 1, 1);
    else onChangeMonth(year, month + 1);
  };

  return (
    <div className="bg-[#FFFFFF] border-2 border-[#1B1A17] p-5 shadow-[3px_3px_0px_#1B1A17] relative">
      {/* Top Header - Estilo Cartelera de Prensa */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-3 border-b-2 border-[#1B1A17]">
        <div>
          <span className="text-[10px] font-mono tracking-widest uppercase text-[#6E695F] block font-bold">
            CARTELERA OFICIAL DE LAS CORTES GENERALES • SECCIÓN PARLAMENTARIA
          </span>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-headline font-bold text-[#1B1A17] tracking-tight flex items-center gap-2">
              Almanaque Parlamentario
              <span className="font-typewriter text-xs font-normal px-2.5 py-0.5 border border-[#1B1A17] bg-[#FAF7EE] text-[#1B1A17]">
                {currentMonthName} de {year}
              </span>
            </h2>
            {onChangeMonth && (
              <div className="flex items-center gap-1 font-typewriter text-xs">
                <button
                  onClick={handlePrevMonth}
                  className="px-2 py-0.5 border border-[#1B1A17] bg-[#FAF7EE] hover:bg-[#EDE6D6] text-[#1B1A17] font-bold flex items-center gap-0.5 transition"
                  title="Mes anterior"
                >
                  <ChevronLeft className="w-3.5 h-3.5" /> {prevMonthName}
                </button>
                <button
                  onClick={handleNextMonth}
                  className="px-2 py-0.5 border border-[#1B1A17] bg-[#FAF7EE] hover:bg-[#EDE6D6] text-[#1B1A17] font-bold flex items-center gap-0.5 transition"
                  title="Mes siguiente"
                >
                  {nextMonthName} <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
          <p className="text-xs font-editorial text-[#4E4B44] italic">
            Registro diario de plenarios celebrados, debates de la jornada y proyectos legislativos agendados.
          </p>
        </div>

        {/* Quick Filter Buttons */}
        <div className="flex items-center gap-2 self-stretch sm:self-auto">
          <button
            onClick={() => {
              if (onChangeMonth && (month !== tM || year !== tY)) {
                onChangeMonth(tY, tM);
              }
              onSelectDate(targetDate);
            }}
            className="flex items-center gap-1.5 text-xs font-typewriter font-bold px-3 py-1.5 border-2 border-[#8F1D1D] bg-[#FDF8F8] text-[#8F1D1D] hover:bg-[#8F1D1D] hover:text-[#FFFFFF] transition shadow-[2px_2px_0px_#8F1D1D] cursor-pointer"
          >
            <Radio className="w-3.5 h-3.5 animate-pulse" />
            {buttonLabel}
          </button>
        </div>
      </div>

      {/* Selector de Meses de la Legislatura (Hemeroteca 2026) */}
      {onChangeMonth && (
        <div className="py-2.5 px-3 bg-[#FAF7EE] border-b border-[#D8D1C3] flex flex-wrap items-center justify-between gap-2 text-xs font-typewriter">
          <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#6E695F]">
            HEMEROTECA 2026 POR MESES:
          </span>
          <div className="flex flex-wrap items-center gap-1">
            {PARLIAMENTARY_ACTIVE_MONTHS.map((m) => {
              const isActive = month === m.month && year === 2026;
              return (
                <button
                  key={m.month}
                  onClick={() => onChangeMonth(2026, m.month)}
                  className={`px-2.5 py-1 text-xs font-bold border transition ${
                    isActive
                      ? 'bg-[#1B1A17] text-[#FAF7EE] border-[#1B1A17] shadow-[1px_1px_0px_#8F1D1D]'
                      : 'bg-[#FFFFFF] text-[#1B1A17] border-[#D8D1C3] hover:border-[#1B1A17] hover:bg-[#F3EFE4]'
                  }`}
                >
                  {m.name}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Legend showing the visual differences in classic newspaper rubrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 py-3 border-b border-[#D8D1C3] text-xs font-editorial">
        <div className="flex items-center gap-2 p-1.5 bg-[#F6F8F6] border border-[#C5D9C8]">
          <span className="w-2.5 h-2.5 bg-[#1F4D36] border border-[#1B1A17] inline-block"></span>
          <span className="text-[#1B1A17]">
            <strong className="font-headline font-bold text-[#1F4D36]">Pasado:</strong> Votado y Escrutado
          </span>
        </div>
        <div className="flex items-center gap-2 p-1.5 bg-[#F3F6FA] border border-[#BACDE2]">
          <span className="w-2.5 h-2.5 bg-[#1B365D] border border-[#1B1A17] inline-block"></span>
          <span className="text-[#1B1A17]">
            <strong className="font-headline font-bold text-[#1B365D]">Hoy:</strong> Pleno en Directo
          </span>
        </div>
        <div className="flex items-center gap-2 p-1.5 bg-[#F8F5FA] border border-[#D5CBE0]">
          <span className="w-2.5 h-2.5 bg-[#553C7B] border border-[#1B1A17] inline-block"></span>
          <span className="text-[#1B1A17]">
            <strong className="font-headline font-bold text-[#553C7B]">Próximo:</strong> Orden del Día
          </span>
        </div>
        <div className="flex items-center gap-2 p-1.5 bg-[#FAF7EE] border border-[#D8D1C3]">
          <span className="w-2.5 h-2.5 bg-[#8C877D] border border-[#1B1A17] inline-block"></span>
          <span className="text-[#6E695F] italic">Sin Sesión Plenaria</span>
        </div>
      </div>

      {/* Days of Week Header */}
      <div className="grid grid-cols-7 gap-1 text-center font-typewriter text-[11px] uppercase tracking-wider text-[#4E4B44] py-2 border-b-2 border-[#1B1A17] bg-[#FAF7EE]">
        {weekDays.map((wd) => (
          <div key={wd} className="font-bold">
            <span className="hidden sm:inline">{wd}</span>
            <span className="sm:hidden">{wd.slice(0, 3)}</span>
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1 pt-2">
        {/* Leading empty slots */}
        {Array.from({ length: firstDayOfWeek }).map((_, i) => (
          <div key={`empty-${i}`} className="min-h-[82px] bg-[#FAF7F0]/40 border border-transparent"></div>
        ))}

        {/* Days */}
        {days.map((day) => {
          const isSelected = selectedDate === day.dateStr;
          const isToday = day.status === 'today';
          const isPast = day.status === 'past' && day.hasSession;
          const isUpcoming = day.status === 'upcoming' && day.hasSession;

          let cardStyle = 'bg-[#FAF7EE]/60 border-[#E5DECD] text-[#8C877D] hover:border-[#1B1A17]';

          if (isToday) {
            cardStyle = 'bg-[#F2F6FC] border-2 border-[#1B365D] text-[#1B1A17] shadow-[2px_2px_0px_#1B365D]';
          } else if (isPast) {
            cardStyle = 'bg-[#FFFFFF] border border-[#B8B0A0] hover:border-[#1B1A17] text-[#1B1A17] shadow-[1px_1px_0px_#D8D1C3]';
          } else if (isUpcoming) {
            cardStyle = 'bg-[#FDFBFE] border border-[#C5B8D8] hover:border-[#553C7B] text-[#1B1A17] shadow-[1px_1px_0px_#D8D1C3]';
          }

          if (isSelected) {
            cardStyle += ' ring-2 ring-[#8F1D1D] border-[#8F1D1D] bg-[#FDF6E8]';
          }

          return (
            <button
              key={day.dateStr}
              onClick={() => onSelectDate(isSelected ? null : day.dateStr)}
              className={`min-h-[86px] flex flex-col justify-between p-2 border text-left transition-all duration-150 relative group ${cardStyle}`}
            >
              {/* Day Number and Status Badge */}
              <div className="flex items-center justify-between w-full">
                <span className={`text-base font-headline font-bold ${isToday ? 'text-[#1B365D]' : isPast ? 'text-[#1B1A17]' : isUpcoming ? 'text-[#553C7B]' : 'text-[#8C877D]'}`}>
                  {day.dayNumber}
                </span>

                {isToday && (
                  <span className="font-typewriter text-[9px] font-bold uppercase px-1 py-0.5 bg-[#1B365D] text-[#FFFFFF] tracking-tighter">
                    HOY
                  </span>
                )}

                {isUpcoming && (
                  <span className="font-typewriter text-[9px] font-bold px-1 py-0.5 border border-[#553C7B] text-[#553C7B]">
                    ORDEN
                  </span>
                )}

                {/* Badge if multiple votes in this day */}
                {day.initiativesCount > 1 && (
                  <span className="font-typewriter text-[9px] font-bold px-1 py-0.5 bg-[#1B1A17] text-[#FFFFFF] tracking-tight">
                    {day.initiativesCount} VOTOS
                  </span>
                )}
              </div>

              {/* Day Contents & Badges */}
              <div className="mt-1 space-y-1 w-full">
                {isPast && (
                  <div className="flex flex-col gap-0.5 text-[10px] font-typewriter">
                    {day.approvedCount > 0 && (
                      <span className="inline-block px-1 py-0.2 text-[#1F4D36] border border-[#1F4D36] bg-[#1F4D36]/10 font-bold truncate">
                        ✓ {day.approvedCount} Aprob.
                      </span>
                    )}
                    {day.rejectedCount > 0 && (
                      <span className="inline-block px-1 py-0.2 text-[#8F1D1D] border border-[#8F1D1D] bg-[#8F1D1D]/10 font-bold truncate">
                        ✗ {day.rejectedCount} Rech.
                      </span>
                    )}
                  </div>
                )}

                {isToday && (
                  <div className="text-[10px] font-editorial text-[#1B365D] leading-tight">
                    <span>Sesión matinal en curso (12:00 h)</span>
                  </div>
                )}

                {isUpcoming && (
                  <div className="text-[10px] font-editorial text-[#553C7B] leading-tight">
                    <span>{day.initiatives[0]?.title ? `${day.initiatives[0].title.slice(0, 24)}...` : 'Plenario agendado'}</span>
                  </div>
                )}
              </div>

              {/* Footer info in cell */}
              <div className="pt-1 text-[9px] font-mono text-[#8C877D] flex justify-between items-center w-full">
                <span>{day.hasSession ? `Sesión oficial` : ''}</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
