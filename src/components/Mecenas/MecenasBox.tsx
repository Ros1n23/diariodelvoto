import React, { useState, useEffect, useMemo } from 'react';
import type { SponsorAuctionState } from '../../types/parliament';
import { ExternalLink, Clock, Award, History, Sparkles, ShieldCheck } from 'lucide-react';
import { MecenasModal } from './MecenasModal';
import { MecenasHistory } from './MecenasHistory';
import { MecenasAdminModal } from './MecenasAdminModal';

interface MecenasBoxProps {
  onOpenLegal?: () => void;
}

export const MecenasBox: React.FC<MecenasBoxProps> = ({ onOpenLegal }) => {
  const [state, setState] = useState<SponsorAuctionState | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(() => {
    if (typeof window === 'undefined') return false;
    return new URLSearchParams(window.location.search).has('admin_mecenas');
  });

  const [now, setNow] = useState(() => Date.now());

  const refreshState = () => {
    fetch('/api/sponsors')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) setState(data);
      })
      .catch(() => {});
  };

  useEffect(() => {
    let isCancelled = false;
    fetch('/api/sponsors')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!isCancelled && data) setState(data);
      })
      .catch(() => {});

    const interval = setInterval(() => {
      fetch('/api/sponsors')
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (!isCancelled && data) setState(data);
        })
        .catch(() => {});
    }, 60000);

    return () => {
      isCancelled = true;
      clearInterval(interval);
    };
  }, []);

  const expiresAt = state?.activeSponsor?.expiresAt;

  // Temporizador regresivo en vivo para las 24h
  useEffect(() => {
    if (!expiresAt) return;
    const timer = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(timer);
  }, [expiresAt]);

  const timeLeft = useMemo(() => {
    if (!expiresAt) return '';
    const expires = new Date(expiresAt.replace(' ', 'T')).getTime();
    const diff = expires - now;
    if (diff <= 0) {
      return '24h cumplidas · Relevo disponible';
    }
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m restantes garantizadas`;
  }, [expiresAt, now]);

  const active = state?.activeSponsor;
  const minBid = state?.minNextBidEur || 1.0;

  return (
    <section 
      aria-label="Mecenas Cívico de la Gaceta"
      className="bg-[#FAF7EE] border-2 border-[#1B1A17] p-3 sm:p-4 shadow-[3px_3px_0px_#1B1A17] relative mb-6 transition-all"
    >
      {/* Decorative Corner Ornaments */}
      <span className="absolute top-1 left-1.5 text-xs text-[#8F1D1D] select-none">✦</span>
      <span className="absolute top-1 right-1.5 text-xs text-[#8F1D1D] select-none">✦</span>
      <span className="absolute bottom-1 left-1.5 text-xs text-[#8F1D1D] select-none">✦</span>
      <span className="absolute bottom-1 right-1.5 text-xs text-[#8F1D1D] select-none">✦</span>

      {/* Header Estilo Prensa */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#1B1A17] pb-2 mb-2.5">
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-mono tracking-widest uppercase font-bold text-[#8F1D1D] flex items-center gap-1">
            <Award className="w-3.5 h-3.5" />
            AVISO AL PÚBLICO • MECENAS CÍVICO DE ESTA EDICIÓN
          </span>
        </div>

        <div className="flex items-center gap-2">
          {active && timeLeft && (
            <span className="text-[11px] font-typewriter text-[#5C574F] flex items-center gap-1 bg-[#FFFFFF] px-2 py-0.5 border border-[#D8D1C3]">
              <Clock className="w-3 h-3 text-[#8F1D1D]" />
              {timeLeft}
            </span>
          )}
          <button
            onClick={() => setIsAdminOpen(true)}
            title="Panel de moderación"
            className="text-[10px] text-[#A09A8E] hover:text-[#1B1A17] transition p-0.5"
            aria-label="Moderar mecenas"
          >
            ⚙️
          </button>
        </div>
      </div>

      {/* Contenido Principal del Mecenas */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div className="flex-1">
          {active ? (
            <div className="space-y-1">
              <div className="flex flex-wrap items-baseline gap-2">
                <span className="text-xs font-mono uppercase text-[#6E695F] font-bold">Patrocinado por:</span>
                <a
                  href={active.url}
                  target="_blank"
                  rel="noopener sponsored"
                  className="font-headline font-bold text-[#1B1A17] hover:text-[#8F1D1D] underline decoration-1 underline-offset-2 flex items-center gap-1 text-base sm:text-lg group"
                >
                  {active.name}
                  <ExternalLink className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 transition-opacity" />
                </a>
                <span className="text-[11px] font-typewriter px-1.5 py-0.5 bg-[#FFFFFF] border border-[#1B1A17] text-[#1B1A17] font-bold">
                  {active.amountEur.toFixed(2)} €
                </span>
              </div>
              <p className="text-xs sm:text-sm font-editorial italic text-[#3D3A35] leading-relaxed">
                «{active.message}»
              </p>
            </div>
          ) : (
            <div className="space-y-0.5">
              <p className="text-sm font-headline font-bold text-[#1B1A17]">
                Espacio de Auspicio Cívico Disponible
              </p>
              <p className="text-xs font-editorial text-[#5C574F] italic">
                Apoye el mantenimiento independiente de este periódico parlamentario y dé visibilidad a su oficio, comercio o proyecto útil.
              </p>
            </div>
          )}
        </div>

        {/* Botonera de Acción */}
        <div className="flex flex-wrap items-center gap-2 shrink-0 w-full sm:w-auto justify-end pt-1 md:pt-0">
          <button
            onClick={() => setIsHistoryOpen(true)}
            className="text-xs font-typewriter px-2.5 py-1.5 bg-[#FFFFFF] hover:bg-[#FAF7F0] border border-[#1B1A17] text-[#1B1A17] flex items-center gap-1.5 transition shadow-[1px_1px_0px_#1B1A17]"
            title="Ver los últimos 10 proyectos que han apoyado la gaceta"
          >
            <History className="w-3.5 h-3.5" />
            <span>Últimos 10</span>
          </button>

          <button
            onClick={() => setIsModalOpen(true)}
            className="text-xs font-typewriter font-bold px-3 py-1.5 bg-[#1B1A17] hover:bg-[#8F1D1D] text-[#FFFFFF] border border-[#1B1A17] flex items-center gap-1.5 transition shadow-[2px_2px_0px_rgba(0,0,0,0.2)]"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#FBBF24]" />
            <span>{active ? `Sobrepujar (Mín. ${minBid.toFixed(2)} €)` : 'Patrocinar (1,00 €)'}</span>
          </button>
        </div>
      </div>

      {/* Nota de Principios Éticos y Privacidad */}
      <div className="mt-2.5 pt-2 border-t border-[#E5DECD] flex flex-wrap items-center justify-between text-[10px] text-[#787266] font-editorial">
        <span className="flex items-center gap-1">
          <ShieldCheck className="w-3 h-3 text-[#1F4D36]" />
          Solo proyectos y oficios útiles. Cero datos bancarios guardados · 100% reembolsable si no se aprueba.
        </span>
        <button
          onClick={onOpenLegal}
          className="hover:underline text-[#1B1A17] font-mono uppercase"
        >
          Marco Legal & Privacidad
        </button>
      </div>

      {/* Modales */}
      <MecenasModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        minNextBidEur={minBid}
        activeSponsor={active}
        onSuccess={() => {
          setIsModalOpen(false);
          refreshState();
        }}
      />

      <MecenasHistory
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        history={state?.history || []}
      />

      <MecenasAdminModal
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
        onModerated={() => refreshState()}
      />
    </section>
  );
};
