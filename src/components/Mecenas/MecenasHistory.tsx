import React from 'react';
import type { Sponsor } from '../../types/parliament';
import { X, History, ExternalLink } from 'lucide-react';

interface MecenasHistoryProps {
  isOpen: boolean;
  onClose: () => void;
  history: Sponsor[];
}

export const MecenasHistory: React.FC<MecenasHistoryProps> = ({
  isOpen,
  onClose,
  history,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="bg-[#FFFFFF] border-4 border-[#1B1A17] shadow-[6px_6px_0px_#1B1A17] max-w-2xl w-full max-h-[85vh] flex flex-col font-editorial relative overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-labelledby="history-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabecera */}
        <div className="bg-[#FAF7EE] border-b-2 border-[#1B1A17] p-3.5 sm:p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-[#8F1D1D]" />
            <div>
              <span className="text-[10px] font-mono tracking-widest uppercase text-[#6E695F] font-bold block">
                HEMEROTECA CÍVICA · ARCHIVO DE AUSPICIOS
              </span>
              <h3 id="history-modal-title" className="text-lg sm:text-xl font-headline font-bold text-[#1B1A17]">
                Registro de los Últimos 10 Mecenas
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 border border-[#1B1A17] bg-[#FFFFFF] hover:bg-[#8F1D1D] hover:text-[#FFFFFF] transition"
            aria-label="Cerrar modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Lista de Mecenas Anteriores */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-3 bg-[#FAF7F0]">
          {history.length === 0 ? (
            <p className="text-center text-sm font-editorial italic text-[#6E695F] py-8">
              Aún no hay mecenas archivados. Las aportaciones que concluyan sus 24 horas figurarán en este registro.
            </p>
          ) : (
            <div className="divide-y divide-[#D8D1C3] border border-[#1B1A17] bg-[#FFFFFF]">
              {history.map((s, idx) => (
                <div key={s.id || idx} className="p-3 sm:p-3.5 space-y-1 hover:bg-[#FAF7EE] transition">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-[#8F1D1D]">
                        #{idx + 1}
                      </span>
                      <a
                        href={s.url}
                        target="_blank"
                        rel="noopener sponsored"
                        className="font-headline font-bold text-[#1B1A17] hover:text-[#8F1D1D] underline text-sm sm:text-base flex items-center gap-1 group"
                      >
                        {s.name}
                        <ExternalLink className="w-3 h-3 opacity-60 group-hover:opacity-100" />
                      </a>
                    </div>
                    <span className="text-xs font-mono font-bold px-2 py-0.5 bg-[#FAF7EE] border border-[#1B1A17] text-[#1B1A17]">
                      {s.amountEur.toFixed(2)} €
                    </span>
                  </div>
                  <p className="text-xs font-editorial italic text-[#4E4B44]">
                    «{s.message}»
                  </p>
                  <div className="text-[10px] font-mono text-[#8C877D]">
                    Fecha de edición: {s.startsAt ? s.startsAt.split(' ')[0] : s.createdAt.split(' ')[0]}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pie */}
        <div className="bg-[#FAF7EE] border-t border-[#1B1A17] p-3 text-[11px] font-editorial text-center text-[#5C574F]">
          El archivo de mecenas preserva el reconocimiento público a quienes sufragan la infraestructura cívica de QueVotan.
        </div>
      </div>
    </div>
  );
};
