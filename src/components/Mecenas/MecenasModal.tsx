import React, { useState } from 'react';
import type { Sponsor } from '../../types/parliament';
import { X, Sparkles, ShieldAlert, CheckCircle2, ArrowRight } from 'lucide-react';

interface MecenasModalProps {
  isOpen: boolean;
  onClose: () => void;
  minNextBidEur: number;
  activeSponsor?: Sponsor | null;
  onSuccess: () => void;
}

export const MecenasModal: React.FC<MecenasModalProps> = ({
  isOpen,
  onClose,
  minNextBidEur,
  onSuccess,
}) => {
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [message, setMessage] = useState('');
  const [amount, setAmount] = useState<number>(minNextBidEur);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Por favor, indique el nombre de su oficio, proyecto o comercio.');
      return;
    }
    if (name.length > 40) {
      setError('El nombre no puede superar los 40 caracteres.');
      return;
    }
    if (!url.startsWith('https://')) {
      setError('El enlace debe ser seguro y comenzar obligatoriamente por https://');
      return;
    }
    if (!message.trim()) {
      setError('Por favor, redacte una frase o mención explicativa.');
      return;
    }
    if (message.length > 90) {
      setError('El mensaje no puede superar los 90 caracteres.');
      return;
    }
    if (amount < minNextBidEur) {
      setError(`La puja mínima requerida para sobrepujar es de ${minNextBidEur.toFixed(2)} €.`);
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/sponsors/propose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          url: url.trim(),
          message: message.trim(),
          amountEur: amount,
          paypalOrderId: `PAYPAL_${Date.now()}`,
          paypalCaptureId: `CAP_${Date.now()}`,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Error al registrar la puja.');
      }

      setSuccess(true);
      setTimeout(() => {
        onSuccess();
      }, 2500);
    } catch (err: any) {
      setError(err.message || 'Error de conexión.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="bg-[#FFFFFF] border-4 border-[#1B1A17] shadow-[6px_6px_0px_#1B1A17] max-w-xl w-full max-h-[92vh] flex flex-col font-editorial relative overflow-y-auto"
        role="dialog"
        aria-modal="true"
        aria-labelledby="mecenas-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabecera del Documento */}
        <div className="bg-[#FAF7EE] border-b-2 border-[#1B1A17] p-3.5 sm:p-4 flex items-center justify-between sticky top-0 z-10">
          <div>
            <span className="text-[10px] font-mono tracking-widest uppercase text-[#8F1D1D] font-bold block">
              GACETA PARLAMENTARIA · AUSPICIO CÍVICO DE LA EDICIÓN
            </span>
            <h3 id="mecenas-modal-title" className="text-lg sm:text-xl font-headline font-bold text-[#1B1A17]">
              Patrocinar la Próxima Edición de Diario del Voto
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 border border-[#1B1A17] bg-[#FFFFFF] hover:bg-[#8F1D1D] hover:text-[#FFFFFF] transition"
            aria-label="Cerrar modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {success ? (
          <div className="p-6 text-center space-y-3 bg-[#FAF7F0]">
            <CheckCircle2 className="w-12 h-12 text-[#1F4D36] mx-auto animate-bounce" />
            <h4 className="text-xl font-headline font-bold text-[#1B1A17]">
              ¡Puja Recibida y en Espera de Publicación!
            </h4>
            <p className="text-sm font-editorial text-[#4E4B44] max-w-md mx-auto">
              Su propuesta por valor de <strong>{amount.toFixed(2)} €</strong> ha sido registrada. Tras la revisión editorial, se publicará en portada durante 24 horas ininterrumpidas.
            </p>
            <p className="text-xs font-mono text-[#6E695F]">
              En caso de no ser admitida, PayPal le reembolsará automáticamente el 100% de los fondos.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4">
            {/* Manifiesto Editorial */}
            <div className="bg-[#FAF7F0] border border-[#1B1A17] p-3 text-xs font-editorial space-y-1.5 shadow-[1px_1px_0px_#1B1A17]">
              <div className="font-bold font-headline text-[#1B1A17] flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#8F1D1D]" />
                Línea Editorial: Solo Productos y Proyectos Útiles de Verdad
              </div>
              <p className="text-[#4E4B44]">
                <strong>Bienvenidos:</strong> Pequeños comercios, oficios (carpintería, fontanería, diseño), autónomos, software de código abierto, libros, cultura e iniciativas sociales.
              </p>
              <p className="text-[#8F1D1D] text-[11px] font-mono">
                ❌ Vetado: Casinos/apuestas, esquemas cripto, cursos vendehumos y consignas partidistas.
              </p>
            </div>

            {error && (
              <div className="p-2.5 bg-[#FDF2F2] border border-[#8F1D1D] text-[#8F1D1D] text-xs font-mono flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Campos del Formulario */}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-mono uppercase text-[#1B1A17] font-bold mb-1">
                  Nombre o Proyecto (Máx. 40 car.)
                </label>
                <input
                  type="text"
                  maxLength={40}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej: Carpintería Tradicional García"
                  className="w-full text-sm font-typewriter p-2 border border-[#1B1A17] bg-[#FFFFFF] focus:outline-none focus:ring-1 focus:ring-[#8F1D1D]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-[#1B1A17] font-bold mb-1">
                  Enlace Web (Obligatorio https://)
                </label>
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://tallergarcia.es"
                  className="w-full text-sm font-typewriter p-2 border border-[#1B1A17] bg-[#FFFFFF] focus:outline-none focus:ring-1 focus:ring-[#8F1D1D]"
                  required
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-mono uppercase text-[#1B1A17] font-bold">
                    Mensaje o Eslogan de Prensa (Máx. 90 car.)
                  </label>
                  <span className={`text-[11px] font-mono ${message.length > 80 ? 'text-[#8F1D1D] font-bold' : 'text-[#6E695F]'}`}>
                    {message.length}/90
                  </span>
                </div>
                <input
                  type="text"
                  maxLength={90}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Ej: Muebles artesanos a medida y restauración con madera sostenible."
                  className="w-full text-sm font-editorial p-2 border border-[#1B1A17] bg-[#FFFFFF] focus:outline-none focus:ring-1 focus:ring-[#8F1D1D]"
                  required
                />
              </div>

              {/* Selector de Puja */}
              <div>
                <label className="block text-xs font-mono uppercase text-[#1B1A17] font-bold mb-1">
                  Importe a Pujar (Mínimo {minNextBidEur.toFixed(2)} €)
                </label>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <input
                      type="number"
                      step="1"
                      min={minNextBidEur}
                      value={amount}
                      onChange={(e) => setAmount(Math.max(minNextBidEur, parseFloat(e.target.value) || minNextBidEur))}
                      className="w-full text-base font-typewriter font-bold p-2 border border-[#1B1A17] bg-[#FFFFFF] pl-8"
                      required
                    />
                    <span className="absolute left-2.5 top-2.5 font-bold font-typewriter text-[#1B1A17]">€</span>
                  </div>

                  {/* Botones de incremento rápido */}
                  <div className="flex gap-1.5 shrink-0">
                    {[1, 5, 10].map((inc) => (
                      <button
                        key={inc}
                        type="button"
                        onClick={() => setAmount((prev) => Math.max(minNextBidEur, prev + inc))}
                        className="text-xs font-mono px-2 py-2 border border-[#1B1A17] bg-[#FAF7EE] hover:bg-[#E5DECD] text-[#1B1A17] font-bold"
                      >
                        +{inc}€
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Vista Previa en Vivo (Estilo Linotipia) */}
            <div className="border border-dashed border-[#1B1A17] p-3 bg-[#FAF7EE] space-y-1">
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#6E695F] font-bold block">
                VISTA PREVIA DEL GRABADO EN PORTADA
              </span>
              <p className="text-xs font-headline font-bold text-[#1B1A17]">
                Patrocinado por: <span className="underline">{name || 'Nombre de su proyecto'}</span> • {amount.toFixed(2)} €
              </p>
              <p className="text-xs font-editorial italic text-[#3D3A35]">
                «{message || 'Su frase explicativa aparecerá aquí tal y como se leerá en la gaceta...'}»
              </p>
            </div>

            {/* Botón de Pago con PayPal */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 px-4 bg-[#FFC439] hover:bg-[#F4B400] text-[#111111] font-bold border-2 border-[#1B1A17] shadow-[2px_2px_0px_#1B1A17] flex items-center justify-center gap-2 text-sm font-typewriter transition disabled:opacity-50"
              >
                <span>Pagar {amount.toFixed(2)} € con</span>
                <span className="font-extrabold italic tracking-tighter text-[#003087]">Pay</span>
                <span className="font-extrabold italic tracking-tighter text-[#0079C1]">Pal</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </button>
              <p className="text-[10px] font-editorial text-center text-[#6E695F] mt-2">
                🔒 Cero datos bancarios almacenados en Diario del Voto. Si la dirección de la gaceta rechaza la publicación, se reembolsa el 100% de inmediato.
              </p>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
