import React, { useState, useEffect } from 'react';
import type { Sponsor } from '../../types/parliament';
import { X, Check, Ban, ExternalLink, RefreshCw } from 'lucide-react';

interface MecenasAdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  onModerated: () => void;
}

const PREDEFINED_REASONS = [
  { label: '🎰 Apuestas / Casinos', reason: 'No admitimos negocios de juegos de azar ni apuestas en nuestra gaceta.' },
  { label: '🪙 Criptomonedas / Trading', reason: 'No publicamos proyectos de especulación financiera, criptomonedas ni trading.' },
  { label: '📢 Curso Vendehumos', reason: 'Solo aceptamos proyectos y productos útiles; no admitimos fórmulas de enriquecimiento rápido.' },
  { label: '⚖️ Propaganda Partidista', reason: 'Diario del Voto mantiene una estricta neutralidad parlamentaria; no admitimos consignas políticas partidistas.' },
  { label: '⚠️ Enlace Sospechoso / Spam', reason: 'El enlace o contenido proporcionado no cumple nuestros estándares de seguridad y confianza.' },
  { label: '✏️ Texto Inapropiado', reason: 'El texto remitido vulnera las normas básicas de respeto de la comunidad.' },
];

export const MecenasAdminModal: React.FC<MecenasAdminModalProps> = ({
  isOpen,
  onClose,
  onModerated,
}) => {
  const [pending, setPending] = useState<Sponsor[]>([]);
  const [loading, setLoading] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const refreshPending = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/sponsors/pending');
      if (res.ok) {
        const data = await res.json();
        setPending(data);
      }
    } catch {
      console.warn('Error al cargar pendientes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    let isCancelled = false;
    fetch('/api/sponsors/pending')
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (!isCancelled) {
          setPending(data);
        }
      })
      .catch(() => {});

    return () => {
      isCancelled = true;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleApprove = async (id: string) => {
    setProcessingId(id);
    try {
      const res = await fetch('/api/sponsors/moderate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action: 'approve' }),
      });
      if (res.ok) {
        await refreshPending();
        onModerated();
      } else {
        const data = await res.json().catch(() => ({}));
        alert(`Error al aprobar: ${data.error || 'Fallo en el servidor'}`);
      }
    } catch (err: any) {
      alert(`Error de conexión: ${err.message}`);
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (id: string, reason: string) => {
    setProcessingId(id);
    try {
      const res = await fetch('/api/sponsors/moderate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action: 'reject', rejectionReason: reason }),
      });
      if (res.ok) {
        await refreshPending();
        onModerated();
      } else {
        const data = await res.json().catch(() => ({}));
        alert(`Error al rechazar: ${data.error || 'Fallo al procesar el reembolso en PayPal'}`);
      }
    } catch (err: any) {
      alert(`Error de conexión: ${err.message}`);
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="bg-[#FFFFFF] border-4 border-[#1B1A17] shadow-[6px_6px_0px_#1B1A17] max-w-2xl w-full max-h-[90vh] flex flex-col font-editorial relative overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-mecenas-title"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabecera */}
        <div className="bg-[#FAF7EE] border-b-2 border-[#1B1A17] p-3.5 sm:p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">⚙️</span>
            <div>
              <span className="text-[10px] font-mono tracking-widest uppercase text-[#8F1D1D] font-bold block">
                DIRECCIÓN EDITORIAL · MODERACIÓN DE PATROCINIOS
              </span>
              <h3 id="admin-mecenas-title" className="text-lg sm:text-xl font-headline font-bold text-[#1B1A17]">
                Peticiones de Mecenas Pendientes ({pending.length})
              </h3>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={refreshPending}
              disabled={loading}
              className="p-1 border border-[#1B1A17] bg-[#FFFFFF] hover:bg-[#FAF7EE] transition"
              title="Recargar peticiones"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-1 border border-[#1B1A17] bg-[#FFFFFF] hover:bg-[#8F1D1D] hover:text-[#FFFFFF] transition"
              aria-label="Cerrar panel"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Lista de Solicitudes */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 bg-[#FAF7F0] flex-1">
          {pending.length === 0 ? (
            <div className="text-center py-10 space-y-2">
              <p className="text-base font-headline font-bold text-[#1B1A17]">
                No hay solicitudes pendientes de moderación
              </p>
              <p className="text-xs font-editorial text-[#6E695F] italic">
                Cuando un lector o proyecto envíe una puja, aparecerá aquí con los botones de aprobación y los motivos predefinidos de rechazo.
              </p>
            </div>
          ) : (
            pending.map((p) => (
              <div
                key={p.id}
                className="bg-[#FFFFFF] border-2 border-[#1B1A17] p-4 shadow-[2px_2px_0px_#1B1A17] space-y-3"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-[#E5DECD] pb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-headline font-bold text-base text-[#1B1A17]">
                      {p.name}
                    </span>
                    <a
                      href={p.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-mono text-[#8F1D1D] hover:underline flex items-center gap-0.5"
                    >
                      {p.url.replace(/^https?:\/\//, '').slice(0, 30)}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {p.paypalCaptureId && (
                      <span className="text-[10px] font-mono px-1.5 py-0.5 bg-[#E8F5E9] text-[#1F4D36] border border-[#1F4D36] font-bold">
                        PayPal ✓
                      </span>
                    )}
                    <span className="text-sm font-typewriter font-bold px-2 py-0.5 bg-[#FAF7EE] border border-[#1B1A17] text-[#1B1A17]">
                      {p.amountEur.toFixed(2)} €
                    </span>
                  </div>
                </div>

                <p className="text-sm font-editorial italic text-[#3D3A35] bg-[#FAF7EE] p-2.5 border border-[#D8D1C3]">
                  «{p.message}»
                </p>

                {/* Botón de Aprobación */}
                <div className="pt-1 flex flex-col sm:flex-row gap-2">
                  <button
                    onClick={() => handleApprove(p.id)}
                    disabled={processingId === p.id}
                    className="flex-1 py-2 px-3 bg-[#1F4D36] hover:bg-[#163827] text-[#FFFFFF] font-typewriter font-bold text-xs border border-[#1B1A17] flex items-center justify-center gap-1.5 transition shadow-[1px_1px_0px_#1B1A17] disabled:opacity-50"
                  >
                    <Check className="w-4 h-4 text-[#86EFAC]" />
                    <span>Aprobar y Publicar (Garantía 24h)</span>
                  </button>
                </div>

                {/* Botonera de Motivos Predefinidos de Rechazo */}
                <div className="pt-2 border-t border-[#E5DECD] space-y-1.5">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[#8F1D1D] font-bold block flex items-center gap-1">
                    <Ban className="w-3 h-3" />
                    O rechazar con motivo oficial (Reembolsa el 100% en PayPal):
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                    {PREDEFINED_REASONS.map((r, rIdx) => (
                      <button
                        key={rIdx}
                        onClick={() => handleReject(p.id, r.reason)}
                        disabled={processingId === p.id}
                        className="text-left text-[11px] font-mono px-2 py-1.5 border border-[#1B1A17] bg-[#FFFFFF] hover:bg-[#FDF2F2] hover:border-[#8F1D1D] text-[#1B1A17] transition truncate disabled:opacity-50"
                        title={r.reason}
                      >
                        {r.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pie Informativo */}
        <div className="bg-[#FAF7EE] border-t border-[#1B1A17] p-2.5 text-[10px] font-editorial text-center text-[#5C574F]">
          Al rechazar con un motivo, la API de PayPal ejecuta el reembolso del 100% y envía al comprador la explicación formal.
        </div>
      </div>
    </div>
  );
};
