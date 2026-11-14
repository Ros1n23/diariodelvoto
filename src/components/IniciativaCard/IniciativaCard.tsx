import React, { useState, useMemo, lazy, Suspense } from 'react';
import type { Initiative } from '../../types/parliament';
import { 
  build350Deputies, 
  build266Senators, 
  build61Eurodeputies,
  build69DiputacionPermanente
} from '../../data/mockParliament';

const Hemiciclo = lazy(() => import('../Hemiciclo/Hemiciclo').then((m) => ({ default: m.Hemiciclo })));

import { 
  ChevronDown, 
  ChevronUp, 
  Layers, 
  Scale, 
  Target, 
  Wallet, 
  Swords, 
  Check, 
  X, 
  Share2, 
  CheckCheck,
  ExternalLink
} from 'lucide-react';

interface IniciativaCardProps {
  initiative: Initiative;
}

type ActiveTab = 'impacto' | 'votos' | 'debate';

function getTargetEmoji(target: string): string {
  const t = target.toLowerCase();
  if (t.includes('estudiante') || t.includes('becario') || t.includes('universidad') || t.includes('joven') || t.includes('alumn')) return '🎓';
  if (t.includes('inquilino') || t.includes('alquiler') || t.includes('hogar') || t.includes('arrendatari')) return '🏠';
  if (t.includes('propietario') || t.includes('dueño') || t.includes('arrendador') || t.includes('tenedor')) return '🔑';
  if (t.includes('autónomo') || t.includes('freelance')) return '🛠️';
  if (t.includes('empresa') || t.includes('pyme') || t.includes('negocio') || t.includes('comercio') || t.includes('patronal')) return '🏢';
  if (t.includes('trabajador') || t.includes('empleado') || t.includes('asalariad') || t.includes('plantilla')) return '💼';
  if (t.includes('pensionista') || t.includes('jubilad') || t.includes('mayor')) return '👴';
  if (t.includes('paciente') || t.includes('sanitari') || t.includes('médic') || t.includes('enferm') || t.includes('salud')) return '🩺';
  if (t.includes('familia') || t.includes('hijo') || t.includes('menor') || t.includes('padre') || t.includes('madre')) return '👨‍👩‍👧';
  if (t.includes('patinete') || t.includes('conductor') || t.includes('coche') || t.includes('tráfico') || t.includes('peatón')) return '🛴';
  if (t.includes('consumidor') || t.includes('cliente') || t.includes('comprador')) return '🛒';
  if (t.includes('medio rural') || t.includes('agricult') || t.includes('campo')) return '🚜';
  return '👥';
}

function getCleanGroupName(fullName: string): string {
  if (fullName.toLowerCase().includes('mixto')) return 'Mixto';
  const parenMatch = fullName.match(/\(([^)]+)\)/);
  if (parenMatch && parenMatch[1].length <= 12) return parenMatch[1];
  if (fullName.toLowerCase().includes('sumar')) return 'Sumar';
  if (fullName.toLowerCase().includes('bildu')) return 'EH Bildu';
  if (fullName.toLowerCase().includes('junts')) return 'Junts';
  if (fullName.toLowerCase().includes('vox')) return 'VOX';
  if (fullName.toLowerCase().includes('socialista') || fullName.toLowerCase().includes('psoe')) return 'PSOE';
  if (fullName.toLowerCase().includes('popular') || fullName.toLowerCase().includes('pp')) return 'PP';
  return fullName.replace(/^G\.P\.\s*/i, '').trim();
}

export const IniciativaCard: React.FC<IniciativaCardProps> = ({ initiative }) => {
  const isTargetInUrl = typeof window !== 'undefined' && (
    new URLSearchParams(window.location.search).get('initiative') === initiative.id ||
    window.location.hash === `#${initiative.id}`
  );

  const [activeTab, setActiveTab] = useState<ActiveTab>('impacto');
  const [showHemiciclo, setShowHemiciclo] = useState(false);
  const [expandedMeasures, setExpandedMeasures] = useState<Record<string, boolean>>({});
  const [copied, setCopied] = useState(false);

  const handleCopyLink = () => {
    const shareUrl = `${window.location.origin}/?initiative=${initiative.id}`;
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }).catch(() => {});
  };

  const activeDeputies = useMemo(() => {
    if (initiative.deputies && initiative.deputies.length > 0) return initiative.deputies;
    if (!initiative.votesSummary) return [];
    const { si, no, abstencion } = initiative.votesSummary;
    if (initiative.votesSummary.total === 69) {
      return build69DiputacionPermanente(si, no, abstencion).deputies;
    }
    if (initiative.chamber === 'senado') {
      return build266Senators(si, no, abstencion).deputies;
    }
    if (initiative.chamber === 'europarl') {
      return build61Eurodeputies(si, no, abstencion).deputies;
    }
    return build350Deputies(si, no, abstencion).deputies;
  }, [initiative]);

  const toggleMeasure = (id: string) => {
    setExpandedMeasures((prev) => {
      const current = prev[id] === undefined ? true : prev[id];
      return { ...prev, [id]: !current };
    });
  };

  const isAprobado = initiative.status === 'aprobado';
  const isRechazado = initiative.status === 'rechazado';
  const isEnTramite = initiative.status === 'en_tramite';
  const isAgendado = initiative.status === 'agendado';

  // Colectivos afectados únicos
  const affectedGroups = useMemo(() => {
    const groups = new Set<string>();
    for (const m of initiative.measures || []) {
      if (m.whoIsAffected && Array.isArray(m.whoIsAffected)) {
        m.whoIsAffected.forEach((g) => groups.add(g));
      }
    }
    return Array.from(groups).slice(0, 6);
  }, [initiative]);

  // Síntesis directa de impacto ciudadano en 1 frase
  const quickImpact = useMemo(() => {
    if (initiative.threeKeys?.pocket) return initiative.threeKeys.pocket;
    if (initiative.summary) return initiative.summary;
    return 'Consulte el desglose de medidas para conocer el impacto de esta ley.';
  }, [initiative]);

  // Desglose de grupos en bloques para el Termómetro
  const siGroups = initiative.groupVotes
    ? initiative.groupVotes.filter((g) => g.si > g.no && g.si > g.abstencion && g.si > 0)
    : [];
  const noGroups = initiative.groupVotes
    ? initiative.groupVotes.filter((g) => g.no > g.si && g.no > g.abstencion && g.no > 0)
    : [];

  const votes = initiative.votesSummary;

  return (
    <article
      id={initiative.id}
      className={`bg-[#FFFFFF] border-2 border-[#1B1A17] shadow-[3px_3px_0px_#1B1A17] transition-all relative ${
        isTargetInUrl ? 'ring-2 ring-[#8F1D1D]' : ''
      }`}
    >
      {/* ============================================================== */}
      {/* VISTAZO PRINCIPAL: RESULTADO, TITULAR Y QUÉ SUPONE PARA TI     */}
      {/* ============================================================== */}
      <div className="p-5 sm:p-7 space-y-4">
        {/* Antetítulo y Veredicto Parlamentario */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#D8D1C3]">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-typewriter text-[11px] font-bold px-2 py-0.5 bg-[#FAF7EE] border border-[#1B1A17] text-[#1B1A17] uppercase tracking-wider flex items-center gap-1">
              {initiative.chamber === 'europarl' && <span>🇪🇺</span>}
              {initiative.chamber === 'senado' ? 'SENADO' : initiative.chamber === 'europarl' ? 'PARLAMENTO EUROPEO' : 'CONGRESO'}
            </span>
            <span className="font-typewriter text-[11px] font-bold px-2 py-0.5 bg-[#F6F2E9] border border-[#D8D1C3] text-[#4E4B44] uppercase">
              {initiative.category}
            </span>
            <span className="font-typewriter text-[11px] font-bold px-2 py-0.5 bg-[#FAF7EE] border border-[#D8D1C3] text-[#6E695F]">
              📅 {initiative.date}
            </span>
            {initiative.isOmnibus && (
              <span className="inline-flex items-center gap-1 font-typewriter text-[11px] font-bold px-2 py-0.5 border border-[#8F1D1D] text-[#8F1D1D] bg-[#FDF8F8] uppercase">
                <Layers className="w-3.5 h-3.5" /> Ómnibus ({initiative.measures.length} medidas)
              </span>
            )}
          </div>

          {/* Badge del Veredicto Oficial */}
          <div>
            {isAprobado && (
              <span className="inline-flex items-center gap-1.5 font-typewriter text-xs font-bold px-3 py-1 bg-[#1F4D36] text-[#FFFFFF] border border-[#1B1A17] shadow-[2px_2px_0px_#1B1A17]">
                <Check className="w-3.5 h-3.5" /> CONVALIDADA {votes ? `· ${votes.si} SÍ / ${votes.no} NO` : ''}
              </span>
            )}
            {isRechazado && (
              <span className="inline-flex items-center gap-1.5 font-typewriter text-xs font-bold px-3 py-1 bg-[#8F1D1D] text-[#FFFFFF] border border-[#1B1A17] shadow-[2px_2px_0px_#1B1A17]">
                <X className="w-3.5 h-3.5" /> RECHAZADA {votes ? `· ${votes.no} EN CONTRA / ${votes.si} SÍ` : ''}
              </span>
            )}
            {isEnTramite && (
              <span className="inline-flex items-center gap-1.5 font-typewriter text-xs font-bold px-3 py-1 bg-[#A26815] text-[#FFFFFF] border border-[#1B1A17] shadow-[2px_2px_0px_#1B1A17]">
                ● EN DEBATE
              </span>
            )}
            {isAgendado && (
              <span className="inline-flex items-center gap-1.5 font-typewriter text-xs font-bold px-3 py-1 bg-[#4E4B44] text-[#FFFFFF] border border-[#1B1A17] shadow-[2px_2px_0px_#1B1A17]">
                ◷ EN ORDEN DEL DÍA
              </span>
            )}
          </div>
        </div>

        {/* Titular Periodístico Principal */}
        <h3 className="text-2xl sm:text-3xl font-headline font-bold text-[#1B1A17] tracking-tight leading-tight">
          {initiative.title}
        </h3>

        {/* Impacto en tu vida en 1 frase */}
        <div className="p-3.5 bg-[#FAF7EE] border-l-4 border-[#8F1D1D] border-y border-r border-[#D8D1C3]">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#8F1D1D] block mb-1">
            QUÉ SUPONE PARA TI EN LA PRÁCTICA:
          </span>
          <p className="font-editorial text-base sm:text-lg text-[#1B1A17] leading-snug font-medium">
            {quickImpact}
          </p>
        </div>

        {/* Resumen en 3 Claves: 1. ¿En qué consiste? · 2. En tu día a día · 3. El choque político */}
        {initiative.threeKeys && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
            <div className="p-3.5 bg-[#FAF7EE] border border-[#1B1A17] shadow-[1px_1px_0px_#1B1A17]">
              <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-[#1F4D36] uppercase pb-1.5 mb-2 border-b border-[#D8D1C3]">
                <Target className="w-3.5 h-3.5 text-[#1F4D36]" />
                <span>1. ¿En qué consiste?</span>
              </div>
              <p className="font-editorial text-sm text-[#1B1A17] leading-snug">
                {initiative.threeKeys.what}
              </p>
            </div>

            <div className="p-3.5 bg-[#FAF7EE] border border-[#1B1A17] shadow-[1px_1px_0px_#1B1A17]">
              <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-[#8F1D1D] uppercase pb-1.5 mb-2 border-b border-[#D8D1C3]">
                <Wallet className="w-3.5 h-3.5 text-[#8F1D1D]" />
                <span>2. En tu día a día</span>
              </div>
              <p className="font-editorial text-sm text-[#1B1A17] leading-snug">
                {initiative.threeKeys.pocket}
              </p>
            </div>

            <div className="p-3.5 bg-[#FAF7EE] border border-[#1B1A17] shadow-[1px_1px_0px_#1B1A17]">
              <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-[#A26815] uppercase pb-1.5 mb-2 border-b border-[#D8D1C3]">
                <Swords className="w-3.5 h-3.5 text-[#A26815]" />
                <span>3. El choque político</span>
              </div>
              <p className="font-editorial text-sm text-[#1B1A17] leading-snug">
                {initiative.threeKeys.clash}
              </p>
            </div>
          </div>
        )}

        {/* Alianzas parlamentarias directas en portada */}
        {initiative.groupVotes && initiative.groupVotes.length > 0 && votes && (
          <div className="p-3 bg-[#FAF7EE] border border-[#1B1A17] shadow-[1px_1px_0px_#1B1A17] flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs font-typewriter">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-bold px-1.5 py-0.5 bg-[#1F4D36] text-[#FFFFFF] text-[10px] uppercase tracking-wider shrink-0">
                🟢 A FAVOR ({votes.si}):
              </span>
              <span className="text-[#1F4D36] font-bold">
                {siGroups.length > 0
                  ? siGroups.map((g) => getCleanGroupName(g.groupName)).join(', ')
                  : 'Sin apoyos mayoritarios'}
              </span>
            </div>

            <div className="hidden sm:block text-[#D8D1C3]">|</div>

            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-bold px-1.5 py-0.5 bg-[#8F1D1D] text-[#FFFFFF] text-[10px] uppercase tracking-wider shrink-0">
                🔴 EN CONTRA ({votes.no}):
              </span>
              <span className="text-[#8F1D1D] font-bold">
                {noGroups.length > 0
                  ? noGroups.map((g) => getCleanGroupName(g.groupName)).join(', ')
                  : 'Sin votos en contra'}
              </span>
            </div>
          </div>
        )}

        {/* Colectivos Afectados y Botón Compartir */}
        <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {affectedGroups.length > 0 ? (
            <div className="flex flex-wrap items-center gap-1.5 text-xs font-typewriter">
              <span className="text-[#6E695F] font-bold mr-1">Afecta a:</span>
              {affectedGroups.map((g, idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 bg-[#FAF7EE] border border-[#D8D1C3] text-[#1B1A17] text-[11px] font-semibold flex items-center gap-1 shadow-[1px_1px_0px_#D8D1C3]"
                >
                  <span>{getTargetEmoji(g)}</span>
                  <span>{g}</span>
                </span>
              ))}
            </div>
          ) : <div />}

          <button
            onClick={handleCopyLink}
            className="self-end sm:self-auto p-1.5 px-2.5 border border-[#1B1A17] bg-[#FAF7EE] hover:bg-[#EDE6D6] text-[#1B1A17] transition shadow-[1px_1px_0px_#1B1A17] cursor-pointer flex items-center gap-1.5 text-xs font-typewriter font-semibold"
            title="Copiar enlace a esta votación"
            aria-label="Compartir acta"
          >
            {copied ? <CheckCheck className="w-3.5 h-3.5 text-emerald-600" /> : <Share2 className="w-3.5 h-3.5 text-[#8F1D1D]" />}
            <span>{copied ? '¡Enlace copiado!' : 'Compartir'}</span>
          </button>
        </div>
      </div>

      {/* ============================================================== */}
      {/* SECCIÓN MODULAR 1, 2 Y 3: SIEMPRE VISIBLE DIRECTAMENTE         */}
      {/* ============================================================== */}
      <div className="border-t-2 border-[#1B1A17] bg-[#FDFBF7]">
        {/* Barra de Pestañas de Profundización */}
        <div className="flex border-b-2 border-[#1B1A17] bg-[#F4EFE6] font-typewriter text-xs font-bold uppercase tracking-wider overflow-x-auto">
          <button
            onClick={() => setActiveTab('impacto')}
            className={`px-4 py-3 border-r-2 border-[#1B1A17] flex items-center gap-2 shrink-0 transition cursor-pointer ${
              activeTab === 'impacto'
                ? 'bg-[#FFFFFF] text-[#8F1D1D] border-b-2 border-b-[#FFFFFF] -mb-[2px] shadow-sm'
                : 'text-[#4E4B44] hover:bg-[#EAE4D7] hover:text-[#1B1A17]'
            }`}
          >
            <Wallet className="w-4 h-4 text-[#8F1D1D]" />
            <span>1. Despiece y Bolsillo</span>
          </button>

          <button
            onClick={() => setActiveTab('votos')}
            className={`px-4 py-3 border-r-2 border-[#1B1A17] flex items-center gap-2 shrink-0 transition cursor-pointer ${
              activeTab === 'votos'
                ? 'bg-[#FFFFFF] text-[#1B365D] border-b-2 border-b-[#FFFFFF] -mb-[2px] shadow-sm'
                : 'text-[#4E4B44] hover:bg-[#EAE4D7] hover:text-[#1B1A17]'
            }`}
          >
            <Scale className="w-4 h-4 text-[#1B365D]" />
            <span>2. Votos y Hemiciclo</span>
          </button>

          <button
            onClick={() => setActiveTab('debate')}
            className={`px-4 py-3 flex items-center gap-2 shrink-0 transition cursor-pointer ${
              activeTab === 'debate'
                ? 'bg-[#FFFFFF] text-[#1F4D36] border-b-2 border-b-[#FFFFFF] -mb-[2px] shadow-sm'
                : 'text-[#4E4B44] hover:bg-[#EAE4D7] hover:text-[#1B1A17]'
            }`}
          >
            <Swords className="w-4 h-4 text-[#1F4D36]" />
            <span>3. Debate y Ley Oficial</span>
          </button>
        </div>

        {/* Contenido de la Pestaña Activa */}
        <div className="p-5 sm:p-7 space-y-6">
          {/* -------------------------------------------------------- */}
          {/* PESTAÑA 1: IMPACTO EN EL BOLSILLO                        */}
          {/* -------------------------------------------------------- */}
          {activeTab === 'impacto' && (
            <div className="space-y-6 animate-fadeIn">
              {/* Comparativa directa Antes vs Con esta ley */}
              {initiative.beforeVsAfter && (
                <section className="border-2 border-[#1B1A17] bg-[#FFFFFF] shadow-[2px_2px_0px_#1B1A17] overflow-hidden">
                  <div className="bg-[#1B1A17] text-[#FAF7EE] px-4 py-2 font-typewriter text-xs font-bold uppercase tracking-wider flex items-center justify-between">
                    <span>⚖️ Comparativa directa: Situación previa vs. Con esta Ley</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x-2 divide-[#1B1A17]">
                    <div className="p-4 bg-[#FAF7F2]">
                      <div className="flex items-center gap-2 font-headline font-bold text-xs uppercase text-[#8F1D1D] mb-1.5">
                        <span className="w-5 h-5 rounded-full bg-[#8F1D1D]/15 text-[#8F1D1D] flex items-center justify-center font-mono font-black text-xs">✕</span>
                        <span>Marco previo (antes de esta norma)</span>
                      </div>
                      <p className="font-editorial text-sm sm:text-base text-[#3E3C38] leading-relaxed">
                        {initiative.beforeVsAfter.before}
                      </p>
                    </div>

                    <div className="p-4 bg-[#F6FAF5]">
                      <div className="flex items-center gap-2 font-headline font-bold text-xs uppercase text-[#1F4D36] mb-1.5">
                        <span className="w-5 h-5 rounded-full bg-[#1F4D36]/15 text-[#1F4D36] flex items-center justify-center font-mono font-black text-xs">✓</span>
                        <span>Nueva regulación (con esta norma)</span>
                      </div>
                      <p className="font-editorial text-sm sm:text-base text-[#1B1A17] font-medium leading-relaxed">
                        {initiative.beforeVsAfter.after}
                      </p>
                    </div>
                  </div>
                </section>
              )}

              {/* Despiece de medidas articuladas */}
              <div className="space-y-3 pt-2">
                <h4 className="font-mono text-xs font-bold uppercase tracking-wider text-[#1B1A17] pb-1 border-b border-[#1B1A17] flex items-center justify-between">
                  <span>Despiece articulado ({initiative.measures.length} {initiative.measures.length === 1 ? 'medida' : 'medidas'})</span>
                  <span className="text-[10px] text-[#6E695F] font-normal">Pulse para contraer/desplegar cada medida</span>
                </h4>

                <div className="space-y-2.5">
                  {initiative.measures.map((measure, index) => {
                    const isMeasureExp = expandedMeasures[measure.id] === undefined ? true : expandedMeasures[measure.id];
                    return (
                      <div key={measure.id} className="border border-[#1B1A17] bg-[#FFFFFF] shadow-[1px_1px_0px_#1B1A17]">
                        <button
                          onClick={() => toggleMeasure(measure.id)}
                          className="w-full p-3 text-left flex items-center justify-between gap-3 bg-[#FAF7EE] hover:bg-[#F3EFE4] transition cursor-pointer"
                        >
                          <div className="flex items-center gap-2.5">
                            <span className="w-5 h-5 bg-[#1B1A17] text-[#FFFFFF] font-typewriter text-xs font-bold flex items-center justify-center shrink-0">
                              {index + 1}
                            </span>
                            <div>
                              <h5 className="text-sm font-headline font-bold text-[#1B1A17]">{measure.title}</h5>
                              <span className="text-[10px] font-mono text-[#6E695F] uppercase">Área: {measure.category}</span>
                            </div>
                          </div>
                          {isMeasureExp ? <ChevronUp className="w-4 h-4 text-[#1B1A17]" /> : <ChevronDown className="w-4 h-4 text-[#1B1A17]" />}
                        </button>

                        {isMeasureExp && (
                          <div className="p-4 space-y-3 font-editorial text-sm border-t border-[#D8D1C3] bg-[#FFFFFF]">
                            <p className="text-base text-[#1B1A17] leading-relaxed">
                              {measure.plainDescription}
                            </p>

                            {/* Ejemplo Práctico con Cifras */}
                            {measure.realWorldExample && (
                              <div className="p-3 bg-[#FBF8ED] border border-[#D8D1C3] font-editorial text-xs sm:text-sm text-[#1B1A17] italic">
                                <span className="font-bold font-mono not-italic text-[#8F1D1D] block mb-1 text-[11px] uppercase">
                                  💶 Caso práctico cotidiano:
                                </span>
                                "{measure.realWorldExample}"
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* -------------------------------------------------------- */}
          {/* PESTAÑA 2: VOTOS Y HEMICICLO                            */}
          {/* -------------------------------------------------------- */}
          {activeTab === 'votos' && (
            <div className="space-y-6 animate-fadeIn">
              {votes && (
                <>
                  {/* Explicación en lenguaje directo */}
                  <div className="p-4 bg-[#FFFFFF] border-2 border-[#1B1A17] font-editorial text-sm text-[#1B1A17] shadow-[2px_2px_0px_#1B1A17]">
                    {isAprobado && (
                      <span>
                        <strong>Resultado parlamentario:</strong> La iniciativa superó la votación al sumar <strong>{votes.si} votos a favor</strong>, alcanzando la mayoría requerida ({initiative.chamber === 'senado' ? '134 escaños' : initiative.chamber === 'europarl' ? '31 eurodiputados' : '176 escaños'}).
                      </span>
                    )}
                    {isRechazado && (
                      <span>
                        <strong>Resultado parlamentario:</strong> La iniciativa fue rechazada por el Pleno al quedarse en <strong>{votes.si} votos a favor</strong> frente a <strong>{votes.no} en contra</strong> (faltaron {(initiative.chamber === 'senado' ? 134 : initiative.chamber === 'europarl' ? 31 : 176) - votes.si} apoyos para convalidarla).
                      </span>
                    )}
                    {isEnTramite && (
                      <span>
                        <strong>Resultado parlamentario:</strong> La norma se somete a deliberación. Requiere el apoyo de al menos {initiative.chamber === 'senado' ? '134 senadores' : initiative.chamber === 'europarl' ? '31 eurodiputados' : '176 diputados'} para prosperar.
                      </span>
                    )}
                  </div>

                  {/* Barra Termómetro con Mayoría Absoluta */}
                  {(() => {
                    const isSen = initiative.chamber === 'senado';
                    const isEu = initiative.chamber === 'europarl';
                    const totalSeats = isSen ? 266 : (isEu ? 61 : 350);
                    const majoritySeats = isSen ? 134 : (isEu ? 31 : 176);
                    const absentCount = Math.max(0, totalSeats - votes.si - votes.no - votes.abstencion);

                    return (
                      <div className="space-y-2 pt-2">
                        <div className="flex items-center justify-between text-xs font-mono text-[#6E695F]">
                          <span>Distribución del Pleno ({totalSeats} escaños)</span>
                          <span className="font-bold text-[#1B1A17]">Mayoría: {majoritySeats} votos</span>
                        </div>

                        <div className="relative pt-4">
                          {/* Marcador Mayoría */}
                          <div
                            className="absolute top-0 -translate-x-1/2 flex flex-col items-center pointer-events-none z-10"
                            style={{ left: `${(majoritySeats / totalSeats) * 100}%` }}
                          >
                            <span className="font-mono text-[9px] font-bold px-1 bg-[#1B1A17] text-[#FFFFFF]">
                              ▲ {majoritySeats}
                            </span>
                          </div>

                          <div className="h-8 w-full bg-[#E5DFD3] border-2 border-[#1B1A17] flex relative shadow-[2px_2px_0px_#1B1A17] overflow-hidden">
                            {votes.si > 0 && (
                              <div
                                style={{ width: `${(votes.si / totalSeats) * 100}%` }}
                                className="h-full bg-[#1F4D36] text-[#FFFFFF] font-typewriter text-xs font-bold flex items-center justify-center truncate px-1"
                                title={`SÍ: ${votes.si}`}
                              >
                                SÍ ({votes.si})
                              </div>
                            )}
                            {votes.no > 0 && (
                              <div
                                style={{ width: `${(votes.no / totalSeats) * 100}%` }}
                                className="h-full bg-[#8F1D1D] text-[#FFFFFF] font-typewriter text-xs font-bold flex items-center justify-center truncate px-1 border-l border-[#FAF7EE]/30"
                                title={`NO: ${votes.no}`}
                              >
                                NO ({votes.no})
                              </div>
                            )}
                            {votes.abstencion > 0 && (
                              <div
                                style={{ width: `${(votes.abstencion / totalSeats) * 100}%` }}
                                className="h-full bg-[#A26815] text-[#FFFFFF] font-typewriter text-xs font-bold flex items-center justify-center truncate px-1 border-l border-[#FAF7EE]/30"
                                title={`ABSTENCIÓN: ${votes.abstencion}`}
                              >
                                ABS ({votes.abstencion})
                              </div>
                            )}
                            {absentCount > 0 && (
                              <div
                                style={{ width: `${(absentCount / totalSeats) * 100}%` }}
                                className="h-full bg-[#C8C2B3] text-[#4E4B44] font-typewriter text-xs font-bold flex items-center justify-center truncate px-1 border-l border-[#FAF7EE]/30"
                                title={`AUSENTES: ${absentCount}`}
                              >
                                AUS ({absentCount})
                              </div>
                            )}
                            {/* Línea vertical mayoría */}
                            <div
                              className="absolute top-0 bottom-0 w-[2px] bg-[#1B1A17] z-10 pointer-events-none"
                              style={{ left: `${(majoritySeats / totalSeats) * 100}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Alianzas por Grupos Políticos */}
                  {(siGroups.length > 0 || noGroups.length > 0) && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                      <div className="p-3 bg-[#F6FAF5] border border-[#1F4D36] shadow-[1px_1px_0px_#1F4D36]">
                        <span className="font-typewriter text-xs font-bold text-[#1F4D36] block mb-1.5">
                          🟢 BLOQUE DEL SÍ ({votes.si} votos):
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {siGroups.map((g) => (
                            <span key={g.groupName} className="font-typewriter text-xs px-2 py-0.5 bg-[#FFFFFF] border border-[#1F4D36] text-[#1F4D36]">
                              {g.groupName.replace('G.P. ', '')}: <strong>{g.si}</strong>
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="p-3 bg-[#FAF4F4] border border-[#8F1D1D] shadow-[1px_1px_0px_#8F1D1D]">
                        <span className="font-typewriter text-xs font-bold text-[#8F1D1D] block mb-1.5">
                          🔴 BLOQUE DEL NO ({votes.no} votos):
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {noGroups.map((g) => (
                            <span key={g.groupName} className="font-typewriter text-xs px-2 py-0.5 bg-[#FFFFFF] border border-[#8F1D1D] text-[#8F1D1D]">
                              {g.groupName.replace('G.P. ', '')}: <strong>{g.no}</strong>
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Hemiciclo Interactivo Escaño por Escaño */}
                  <div className="pt-3 border-t border-[#D8D1C3]">
                    <div className="flex items-center justify-between pb-3">
                      <span className="font-mono text-xs font-bold uppercase text-[#1B1A17]">
                        Hemiciclo Interactivo (Escrutinio Nominal de los 350 escaños)
                      </span>
                      <button
                        onClick={() => setShowHemiciclo(!showHemiciclo)}
                        className="text-xs font-typewriter font-bold px-3 py-1.5 border border-[#1B1A17] bg-[#FAF7EE] hover:bg-[#EDE6D6] text-[#1B1A17] transition flex items-center gap-1.5 shadow-[1px_1px_0px_#1B1A17] cursor-pointer"
                      >
                        <Scale className="w-3.5 h-3.5" />
                        <span>{showHemiciclo ? 'Ocultar escaños' : 'Ver mapa de escaños'}</span>
                        {showHemiciclo ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </button>
                    </div>

                    {showHemiciclo && activeDeputies.length > 0 && (
                      <div className="animate-fadeIn pt-2">
                        <Suspense fallback={
                          <div className="p-6 text-center font-typewriter text-xs text-[#6E695F] bg-[#FAF7EE] border border-[#D8D1C3]">
                            Componiendo hemiciclo interactivo...
                          </div>
                        }>
                          <Hemiciclo deputies={activeDeputies} groupVotes={initiative.groupVotes} />
                        </Suspense>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          {/* -------------------------------------------------------- */}
          {/* PESTAÑA 3: DEBATE Y ACTA OFICIAL                         */}
          {/* -------------------------------------------------------- */}
          {activeTab === 'debate' && (
            <div className="space-y-6 animate-fadeIn">
              {/* Tribuna de Debate: Pros y Contras */}
              {initiative.measures.length > 0 && initiative.measures[0].argumentsPro.length > 0 && (
                <div>
                  <h4 className="font-mono text-xs font-bold uppercase tracking-wider text-[#1B1A17] mb-3 pb-1 border-b border-[#1B1A17]">
                    Tribuna de debate: Argumentos enfrentados
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-[#FAFDF9] border border-[#1F4D36] shadow-[1px_1px_0px_#1F4D36]">
                      <h5 className="text-xs font-headline font-bold text-[#1F4D36] uppercase tracking-wide mb-2 pb-1 border-b border-[#1F4D36]/30 flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5 text-[#1F4D36]" /> Motivos de defensa del proyecto
                      </h5>
                      <ul className="space-y-2 text-xs font-editorial text-[#1B1A17]">
                        {initiative.measures[0].argumentsPro.map((arg, idx) => (
                          <li key={idx} className="flex items-start gap-1.5">
                            <span className="text-[#1F4D36] font-bold shrink-0">✦</span>
                            <span>{arg}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="p-4 bg-[#FDF9F9] border border-[#8F1D1D] shadow-[1px_1px_0px_#8F1D1D]">
                      <h5 className="text-xs font-headline font-bold text-[#8F1D1D] uppercase tracking-wide mb-2 pb-1 border-b border-[#8F1D1D]/30 flex items-center gap-1.5">
                        <X className="w-3.5 h-3.5 text-[#8F1D1D]" /> Inquietudes y objeciones críticas
                      </h5>
                      <ul className="space-y-2 text-xs font-editorial text-[#1B1A17]">
                        {initiative.measures[0].argumentsContra.map((arg, idx) => (
                          <li key={idx} className="flex items-start gap-1.5">
                            <span className="text-[#8F1D1D] font-bold shrink-0">✦</span>
                            <span>{arg}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* Ficha Técnica y Enlace Oficial */}
              <div className="p-4 bg-[#FAF7EE] border border-[#1B1A17] shadow-[1px_1px_0px_#1B1A17] space-y-2 text-xs font-typewriter">
                <span className="font-bold uppercase tracking-wider text-[#1B1A17] block">
                  Ficha Técnica Parlamentaria:
                </span>
                <div className="text-[#4E4B44] space-y-1">
                  <p><strong>Denominación oficial:</strong> {initiative.officialTitle}</p>
                  {initiative.expedienteNumber && <p><strong>Expediente:</strong> {initiative.expedienteNumber}</p>}
                  <p><strong>Fecha y hora de votación:</strong> {initiative.date} {initiative.time || ''}</p>
                </div>

                {initiative.bocgUrl && (
                  <div className="pt-2">
                    <a
                      href={initiative.bocgUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#1B365D] text-[#FFFFFF] font-bold hover:bg-[#12243F] transition shadow-sm"
                    >
                      <ExternalLink className="w-3.5 h-3.5" /> Consultar acta oficial en BOCG / BOE
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </article>
  );
};
