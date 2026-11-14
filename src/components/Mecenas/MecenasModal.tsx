import React, { useState, useEffect, useRef } from 'react';
import type { Sponsor } from '../../types/parliament';
import { X, Sparkles, ShieldAlert, CheckCircle2, ArrowRight, ArrowLeft, Loader2, Lock, ExternalLink, Info } from 'lucide-react';

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
  const [step, setStep] = useState<'form' | 'checkout' | 'success'>('form');
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [message, setMessage] = useState('');
  const [amount, setAmount] = useState<number>(minNextBidEur);

  // Referencias para evitar cierres obsoletos en callbacks
  const nameRef = useRef(name);
  const urlRef = useRef(url);
  const messageRef = useRef(message);
  const amountRef = useRef(amount);

  useEffect(() => { nameRef.current = name; }, [name]);
  useEffect(() => { urlRef.current = url; }, [url]);
  useEffect(() => { messageRef.current = message; }, [message]);
  useEffect(() => { amountRef.current = amount; }, [amount]);

  // Estados de PayPal SDK v6
  const [sdkReady, setSdkReady] = useState(false);
  const [sdkLoading, setSdkLoading] = useState(false);
  const [sdkError, setSdkError] = useState<string | null>(null);
  const [paypalMode, setPaypalMode] = useState<string>('sandbox');
  const [capturing, setCapturing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sdkInstanceRef = useRef<any>(null);

  // Cargar SDK v6 de PayPal al abrir el modal
  useEffect(() => {
    if (!isOpen) return;

    let isCancelled = false;

    queueMicrotask(() => {
      if (!isCancelled) {
        setSdkLoading(true);
        setSdkError(null);
      }
    });

    fetch('/api/sponsors/config')
      .then((res) => {
        if (!res.ok) throw new Error('No se pudo obtener la configuración de PayPal');
        return res.json();
      })
      .then(async (cfg) => {
        if (isCancelled) return;
        const clientId = cfg.paypalClientId;
        const mode = cfg.paypalMode || 'sandbox';
        setPaypalMode(mode);

        if (!clientId) {
          throw new Error('Identificador de cliente de PayPal no disponible en el servidor');
        }

        // URL del SDK v6 según el entorno
        const v6ScriptUrl = mode === 'live'
          ? 'https://www.paypal.com/web-sdk/v6/core'
          : 'https://www.sandbox.paypal.com/web-sdk/v6/core';

        const initSdkInstance = async () => {
          try {
            if (!(window as any).paypal?.createInstance) {
              throw new Error('PayPal SDK v6 no se cargó correctamente');
            }
            const instance = await (window as any).paypal.createInstance({
              clientId,
              components: ['paypal-payments'],
              locale: 'es_ES',
            });
            if (!isCancelled) {
              sdkInstanceRef.current = instance;
              setSdkReady(true);
              setSdkLoading(false);
            }
          } catch (initErr: any) {
            if (!isCancelled) {
              setSdkError(initErr.message || 'Error inicializando instancia del SDK v6');
              setSdkLoading(false);
            }
          }
        };

        const existingScript = document.getElementById('paypal-sdk-v6-core') as HTMLScriptElement | null;
        if (existingScript) {
          if ((window as any).paypal?.createInstance) {
            await initSdkInstance();
          } else {
            existingScript.addEventListener('load', () => {
              if (!isCancelled) initSdkInstance();
            });
            existingScript.addEventListener('error', () => {
              if (!isCancelled) {
                setSdkError('Error al descargar el núcleo de PayPal SDK v6');
                setSdkLoading(false);
              }
            });
          }
          return;
        }

        const script = document.createElement('script');
        script.id = 'paypal-sdk-v6-core';
        script.src = v6ScriptUrl;
        script.async = true;
        script.onload = () => {
          if (!isCancelled) {
            initSdkInstance();
          }
        };
        script.onerror = () => {
          if (!isCancelled) {
            setSdkError('No se pudo conectar con PayPal (SDK v6). Compruebe bloqueadores de publicidad o red.');
            setSdkLoading(false);
          }
        };
        document.head.appendChild(script);
      })
      .catch((err) => {
        if (!isCancelled) {
          setSdkError(err.message || 'Error de configuración de PayPal');
          setSdkLoading(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [isOpen]);

  // Montar sesión y componente <paypal-button> en el paso de checkout
  useEffect(() => {
    if (step !== 'checkout' || !sdkReady || !sdkInstanceRef.current) return;

    const container = document.getElementById('paypal-button-container');
    if (!container) return;

    container.innerHTML = '';

    try {
      const sdk = sdkInstanceRef.current;

      // 1. Crear sesión de pago único en el SDK v6
      const session = sdk.createPayPalOneTimePaymentSession({
        onApprove: async (data: { orderId: string }) => {
          setCapturing(true);
          setError(null);
          try {
            const res = await fetch('/api/sponsors/paypal-capture', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                orderId: data.orderId,
                name: nameRef.current.trim(),
                url: urlRef.current.trim(),
                message: messageRef.current.trim(),
                amountEur: amountRef.current,
              }),
            });
            const resData = await res.json();
            if (!res.ok) {
              throw new Error(resData.error || 'Error al formalizar la captura del pago en PayPal');
            }
            setStep('success');
            onSuccess();
          } catch (err: any) {
            setError(err.message || 'Error al verificar el cobro en el servidor');
          } finally {
            setCapturing(false);
          }
        },
        onCancel: () => {
          // El usuario cerró la ventana de PayPal
        },
        onError: (err: any) => {
          console.error('PayPal v6 session error:', err);
          setError('Ocurrió una incidencia con la pasarela de PayPal. Por favor, reinténtelo.');
        },
      });

      // 2. Crear elemento web component nativo <paypal-button>
      const btn = document.createElement('paypal-button');
      btn.setAttribute('type', 'pay');
      btn.setAttribute('color', 'paypal-gold');
      btn.style.width = '100%';
      btn.style.display = 'block';
      btn.style.minHeight = '44px';
      btn.style.cursor = 'pointer';

      // 3. Manejador de clic: invocar session.start de forma síncrona con la promesa del pedido
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        setError(null);

        const createOrderPromise = fetch('/api/sponsors/paypal-create-order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amountEur: amountRef.current,
            name: nameRef.current.trim(),
            url: urlRef.current.trim(),
            message: messageRef.current.trim(),
          }),
        }).then(async (res) => {
          const data = await res.json();
          if (!res.ok) {
            throw new Error(data.error || 'Error al generar la orden en PayPal');
          }
          return { orderId: data.orderId };
        });

        session.start(
          { presentationMode: 'auto' },
          createOrderPromise
        ).catch((err: any) => {
          console.error('PayPal v6 start error:', err);
          setError(err.message || 'Error al iniciar la pasarela de PayPal');
        });
      });

      container.appendChild(btn);
    } catch (e: any) {
      console.error('Error configurando PayPal SDK v6:', e);
      setTimeout(() => setError('No fue posible inicializar los componentes de PayPal SDK v6.'), 0);
    }

    return () => {
      if (container) {
        container.innerHTML = '';
      }
    };
  }, [step, sdkReady, onSuccess]);

  if (!isOpen) return null;

  const handleValidateForm = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedName = name.trim();
    const trimmedUrl = url.trim();
    const trimmedMessage = message.trim();

    if (!trimmedName) {
      setError('Por favor, indique el nombre de su oficio, proyecto o comercio.');
      return;
    }
    if (trimmedName.length > 40) {
      setError('El nombre no puede superar los 40 caracteres.');
      return;
    }
    if (!trimmedUrl.startsWith('https://')) {
      setError('El enlace debe ser seguro y comenzar obligatoriamente por https://');
      return;
    }
    if (!trimmedMessage) {
      setError('Por favor, redacte una frase o mención explicativa para el grabado.');
      return;
    }
    if (trimmedMessage.length > 90) {
      setError('El mensaje no puede superar los 90 caracteres.');
      return;
    }
    if (amount < minNextBidEur) {
      setError(`La puja mínima requerida para sobrepujar es de ${minNextBidEur.toFixed(2)} €.`);
      return;
    }

    setStep('checkout');
  };

  const handleResetAndClose = () => {
    setStep('form');
    setError(null);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-fadeIn"
      onClick={handleResetAndClose}
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
              {step === 'checkout'
                ? 'Confirmar y Abonar con PayPal'
                : step === 'success'
                ? '¡Auspicio Cívico Registrado!'
                : 'Patrocinar la Próxima Edición de Diario del Voto'}
            </h3>
          </div>
          <button
            onClick={handleResetAndClose}
            className="p-1 border border-[#1B1A17] bg-[#FFFFFF] hover:bg-[#8F1D1D] hover:text-[#FFFFFF] transition"
            aria-label="Cerrar modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* PASO 3: ÉXITO TRAS PAGO CAPTURADO */}
        {step === 'success' ? (
          <div className="p-6 text-center space-y-4 bg-[#FAF7F0]">
            <CheckCircle2 className="w-14 h-14 text-[#1F4D36] mx-auto animate-bounce" />
            <h4 className="text-xl font-headline font-bold text-[#1B1A17]">
              ¡Pago Verificado y Propuesta Recibida!
            </h4>
            <p className="text-sm font-editorial text-[#4E4B44] max-w-md mx-auto">
              Su aportación de <strong>{amount.toFixed(2)} €</strong> ha sido abonada mediante PayPal. La redacción revisará el texto de <strong>{name}</strong> de inmediato.
            </p>
            <div className="bg-[#FFFFFF] border border-[#1B1A17] p-3 text-xs font-mono text-[#3D3A35] max-w-md mx-auto text-left space-y-1">
              <div>✓ <strong>Proyecto:</strong> {name}</div>
              <div>✓ <strong>Enlace:</strong> {url}</div>
              <div>✓ <strong>Mensaje:</strong> «{message}»</div>
              <div>✓ <strong>Garantía:</strong> 24 horas ininterrumpidas en cabecera tras aprobación.</div>
            </div>
            <p className="text-xs font-mono text-[#6E695F] max-w-md mx-auto">
              🛡️ Recordatorio: Si la redacción desestimara la propuesta por incumplir las normas editoriales, el sistema emite el reembolso del 100% en PayPal al instante.
            </p>
            <div className="pt-2">
              <button
                onClick={handleResetAndClose}
                className="py-2.5 px-6 bg-[#1F4D36] hover:bg-[#163827] text-[#FFFFFF] font-typewriter font-bold text-xs border border-[#1B1A17] shadow-[2px_2px_0px_#1B1A17] transition"
              >
                Entendido y Volver a la Portada
              </button>
            </div>
          </div>
        ) : step === 'checkout' ? (
          /* PASO 2: CONFIRMACIÓN Y PASARELA PAYPAL (SDK v6) */
          <div className="p-4 sm:p-5 space-y-4">
            <button
              onClick={() => { setStep('form'); setError(null); }}
              className="text-xs font-mono text-[#8F1D1D] hover:underline flex items-center gap-1 font-bold mb-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Volver a editar datos del grabado
            </button>

            {/* Resumen del Pedido */}
            <div className="bg-[#FAF7EE] border-2 border-[#1B1A17] p-3.5 shadow-[2px_2px_0px_#1B1A17] space-y-2">
              <div className="flex justify-between items-baseline border-b border-[#D8D1C3] pb-2">
                <span className="text-xs font-mono uppercase font-bold text-[#6E695F]">
                  Concepto del Mecenazgo
                </span>
                <span className="text-base font-typewriter font-bold text-[#1B1A17]">
                  {amount.toFixed(2)} €
                </span>
              </div>
              <div className="text-xs font-editorial space-y-1 text-[#2B2925]">
                <p><strong>Auspiciante:</strong> {name}</p>
                <p className="flex items-center gap-1">
                  <strong>Enlace:</strong>
                  <a href={url} target="_blank" rel="noopener noreferrer" className="text-[#8F1D1D] underline flex items-center gap-0.5">
                    {url.slice(0, 45)}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </p>
                <p className="italic text-[#3D3A35] bg-[#FFFFFF] p-2 border border-[#E5DECD]">
                  «{message}»
                </p>
              </div>
            </div>

            {/* Cláusula de Devolución Íntegra */}
            <div className="bg-[#FAF7F0] border border-[#1F4D36] p-3 text-xs font-editorial space-y-1">
              <div className="font-bold font-headline text-[#1F4D36] flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5" />
                Garantía Total de Reembolso Editorial
              </div>
              <p className="text-[#3D3A35] text-[11px]">
                El abono queda retenido en su orden. Si la dirección de <em>Diario del Voto</em> rechazara el anuncio por motivos editoriales (apuestas, criptomonedas o partidismo), <strong>PayPal devolverá el 100% de los {amount.toFixed(2)} € a su cuenta automáticamente</strong>.
              </p>
            </div>

            {/* Aviso Sandbox con credenciales de prueba */}
            {paypalMode === 'sandbox' && (
              <div className="p-2.5 bg-[#EFF6FF] border border-[#3B82F6] text-[#1E40AF] text-xs font-mono space-y-1">
                <div className="flex items-center gap-1.5 font-bold">
                  <Info className="w-3.5 h-3.5 shrink-0" />
                  <span>Entorno de Pruebas (PayPal Sandbox):</span>
                </div>
                <p className="text-[11px] text-[#1E3A8A]">
                  Cuenta Sandbox: <code>sb-ad8uu50869633@business.example.com</code>
                </p>
              </div>
            )}

            {error && (
              <div className="p-2.5 bg-[#FDF2F2] border border-[#8F1D1D] text-[#8F1D1D] text-xs font-mono flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Contenedor de Botones de PayPal Web SDK v6 */}
            <div className="space-y-2 pt-1">
              <span className="text-[11px] font-mono uppercase text-[#1B1A17] font-bold block text-center">
                Abono seguro mediante PayPal SDK v6:
              </span>

              {sdkLoading && (
                <div className="py-8 flex flex-col items-center justify-center gap-2 text-xs font-mono text-[#6E695F]">
                  <Loader2 className="w-6 h-6 animate-spin text-[#8F1D1D]" />
                  <span>Conectando con la pasarela PayPal SDK v6...</span>
                </div>
              )}

              {sdkError && (
                <div className="p-3 bg-[#FDF2F2] border border-[#8F1D1D] text-xs font-mono text-[#8F1D1D] space-y-2 text-center">
                  <p>{sdkError}</p>
                  <button
                    onClick={() => window.location.reload()}
                    className="px-3 py-1 bg-[#8F1D1D] text-white text-xs font-mono uppercase font-bold"
                  >
                    Recargar página
                  </button>
                </div>
              )}

              {capturing && (
                <div className="py-6 flex flex-col items-center justify-center gap-2 bg-[#FAF7EE] border border-[#1B1A17]">
                  <Loader2 className="w-6 h-6 animate-spin text-[#1F4D36]" />
                  <span className="text-xs font-mono font-bold text-[#1B1A17]">
                    Verificando y formalizando el mecenazgo con PayPal...
                  </span>
                  <span className="text-[10px] font-mono text-[#6E695F]">
                    Por favor, no cierre esta ventana.
                  </span>
                </div>
              )}

              <div
                id="paypal-button-container"
                className={`min-h-[60px] transition flex items-center justify-center ${capturing ? 'pointer-events-none opacity-40' : ''}`}
              />

              <p className="text-[10px] font-editorial text-center text-[#6E695F] pt-1">
                🔒 Conexión cifrada TLS 1.3 de extremo a extremo. Diario del Voto nunca tiene acceso a sus datos bancarios o de tarjeta.
              </p>
            </div>
          </div>
        ) : (
          /* PASO 1: FORMULARIO DE TEXTO Y PUJA */
          <form onSubmit={handleValidateForm} className="p-4 sm:p-5 space-y-4">
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

            {/* Botón para pasar a la confirmación y pago */}
            <div className="pt-2">
              <button
                type="submit"
                className="w-full py-2.5 px-4 bg-[#FFC439] hover:bg-[#F4B400] text-[#111111] font-bold border-2 border-[#1B1A17] shadow-[2px_2px_0px_#1B1A17] flex items-center justify-center gap-2 text-sm font-typewriter transition"
              >
                <span>Avanzar al Pago Seguro de {amount.toFixed(2)} €</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </button>
              <p className="text-[10px] font-editorial text-center text-[#6E695F] mt-2">
                🔒 En el siguiente paso podrá abonar con PayPal o Tarjeta de forma 100% protegida con PayPal SDK v6.
              </p>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
