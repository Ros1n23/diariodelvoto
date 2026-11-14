import React, { useState } from 'react';
import { X, ShieldCheck, FileText, Cookie, Scale, ExternalLink, Award } from 'lucide-react';

export type LegalTab = 'aviso-legal' | 'privacidad' | 'cookies' | 'neutralidad' | 'mecenazgo';

interface LegalModalProps {
  isOpen: boolean;
  initialTab?: LegalTab;
  onClose: () => void;
}

export const LegalModal: React.FC<LegalModalProps> = ({
  isOpen,
  initialTab = 'aviso-legal',
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<LegalTab>(initialTab);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn"
      onClick={onClose}
    >
      <div 
        className="bg-[#FFFFFF] border-4 border-[#1B1A17] shadow-[6px_6px_0px_#1B1A17] max-w-3xl w-full max-h-[90vh] flex flex-col font-editorial relative overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-labelledby="legal-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabecera del Documento Legal */}
        <div className="bg-[#FAF7EE] border-b-2 border-[#1B1A17] p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl text-[#8F1D1D] font-bold">❦</span>
            <div>
              <span className="text-[10px] font-mono tracking-widest uppercase text-[#6E695F] font-bold block">
                CORTES GENERALES · TRANSPARENCIA CIUDADANA Y MARCO NORMATIVO
              </span>
              <h3 id="legal-modal-title" className="text-xl sm:text-2xl font-headline font-bold text-[#1B1A17]">
                Marco Legal, Privacidad y Compromiso Cívico
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 border border-[#1B1A17] bg-[#FFFFFF] hover:bg-[#8F1D1D] hover:text-[#FFFFFF] transition shadow-[1px_1px_0px_#1B1A17]"
            title="Cerrar documento"
            aria-label="Cerrar documento"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Pestañas de Navegación del Pliego Legal */}
        <div className="flex flex-wrap border-b-2 border-[#1B1A17] bg-[#F6F2E9] font-typewriter text-xs">
          <button
            onClick={() => setActiveTab('aviso-legal')}
            className={`px-4 py-2.5 font-bold flex items-center gap-1.5 border-r border-[#1B1A17] transition ${
              activeTab === 'aviso-legal'
                ? 'bg-[#FFFFFF] text-[#1B1A17] border-b-2 border-b-[#FFFFFF] -mb-[2px]'
                : 'text-[#6E695F] hover:bg-[#FAF7EE] hover:text-[#1B1A17]'
            }`}
          >
            <FileText className="w-4 h-4 text-[#8F1D1D]" />
            Aviso Legal (LSSI)
          </button>

          <button
            onClick={() => setActiveTab('privacidad')}
            className={`px-4 py-2.5 font-bold flex items-center gap-1.5 border-r border-[#1B1A17] transition ${
              activeTab === 'privacidad'
                ? 'bg-[#FFFFFF] text-[#1B1A17] border-b-2 border-b-[#FFFFFF] -mb-[2px]'
                : 'text-[#6E695F] hover:bg-[#FAF7EE] hover:text-[#1B1A17]'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-[#1F4D36]" />
            Privacidad (RGPD)
          </button>

          <button
            onClick={() => setActiveTab('cookies')}
            className={`px-4 py-2.5 font-bold flex items-center gap-1.5 border-r border-[#1B1A17] transition ${
              activeTab === 'cookies'
                ? 'bg-[#FFFFFF] text-[#1B1A17] border-b-2 border-b-[#FFFFFF] -mb-[2px]'
                : 'text-[#6E695F] hover:bg-[#FAF7EE] hover:text-[#1B1A17]'
            }`}
          >
            <Cookie className="w-4 h-4 text-[#A26815]" />
            Cero Rastreadores (ePrivacy)
          </button>

          <button
            onClick={() => setActiveTab('neutralidad')}
            className={`px-4 py-2.5 font-bold flex items-center gap-1.5 border-r border-[#1B1A17] transition ${
              activeTab === 'neutralidad'
                ? 'bg-[#FFFFFF] text-[#1B1A17] border-b-2 border-b-[#FFFFFF] -mb-[2px]'
                : 'text-[#6E695F] hover:bg-[#FAF7EE] hover:text-[#1B1A17]'
            }`}
          >
            <Scale className="w-4 h-4 text-[#1B365D]" />
            Neutralidad y Fuentes
          </button>

          <button
            onClick={() => setActiveTab('mecenazgo')}
            className={`px-4 py-2.5 font-bold flex items-center gap-1.5 transition ${
              activeTab === 'mecenazgo'
                ? 'bg-[#FFFFFF] text-[#1B1A17] border-b-2 border-b-[#FFFFFF] -mb-[2px]'
                : 'text-[#6E695F] hover:bg-[#FAF7EE] hover:text-[#1B1A17]'
            }`}
          >
            <Award className="w-4 h-4 text-[#8F1D1D]" />
            Auspicio Cívico (RGPD)
          </button>
        </div>

        {/* Cuerpo del Pliego Legal con Scroll */}
        <div className="p-6 overflow-y-auto space-y-4 font-editorial text-sm sm:text-base leading-relaxed text-[#1B1A17] flex-1">
          {/* TAB 1: AVISO LEGAL (LSSI-CE) */}
          {activeTab === 'aviso-legal' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="p-3 bg-[#FAF7EE] border border-[#1B1A17] font-typewriter text-xs text-[#4E4B44]">
                <strong>RÉGIMEN JURÍDICO APLICABLE:</strong> Ley 34/2002 (LSSI-CE), Ley 37/2007 de Reutilización de la Información del Sector Público y Constitución Española (Art. 20.1.d).
              </div>

              <h4 className="font-headline font-bold text-lg text-[#1B1A17]">
                1. Titularidad y Naturaleza de la Plataforma
              </h4>
              <p>
                <strong>Diario del Voto</strong> es una iniciativa cívica, abierta y sin ánimo de lucro dedicada a acercar la actividad legislativa de las Cortes Generales (Congreso de los Diputados y Senado de España) a la ciudadanía mediante resúmenes accesibles, neutrales y verificables.
              </p>
              <p>
                No representa a ninguna institución oficial del Estado, partido político, grupo parlamentario ni entidad con fines partidistas.
              </p>

              <h4 className="font-headline font-bold text-lg text-[#1B1A17]">
                2. Exención de Responsabilidad y Fuentes Oficiales
              </h4>
              <p>
                Los datos parlamentarios, recuentos de votaciones y textos oficiales proceden de las publicaciones públicas del <strong>Boletín Oficial de las Cortes Generales (BOCG)</strong>, el <strong>Diario de Sesiones</strong> y los portales de Datos Abiertos de las Cámaras.
              </p>
              <p>
                Las síntesis tienen una finalidad divulgativa y cívica. Los únicos textos legales jurídicamente vinculantes son los publicados oficialmente en el <strong>Boletín Oficial del Estado (BOE)</strong> y en los diarios oficiales de las instituciones correspondientes.
              </p>

              <h4 className="font-headline font-bold text-lg text-[#1B1A17]">
                3. Buzón Ciudadano y Corrección de Erratas
              </h4>
              <p>
                Cualquier persona u organización que detecte una errata en el cómputo de un acta o en la síntesis de una iniciativa puede solicitar su rectificación inmediata mediante comunicación al buzón público de la plataforma: <strong className="font-mono text-[#8F1D1D]">contacto@diariodelvoto.es</strong>.
              </p>
            </div>
          )}

          {/* TAB 2: POLÍTICA DE PRIVACIDAD (RGPD / LOPDGDD) */}
          {activeTab === 'privacidad' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="p-3 bg-[#F6FAF5] border border-[#1F4D36] font-typewriter text-xs text-[#1F4D36]">
                <strong>CUMPLIMIENTO RGPD (UE 2016/679) Y LOPDGDD 3/2018:</strong> Principio de minimización radical de datos y tratamiento legítimo de información representativa de acceso público.
              </div>

              <h4 className="font-headline font-bold text-lg text-[#1B1A17]">
                1. Datos de los Representantes Públicos (350 Diputados)
              </h4>
              <p>
                La plataforma recopila y expone públicamente los nombres, formaciones políticas, circunscripciones y el sentido nominal del voto emitido en las sesiones plenarias por los diputados y senadores.
              </p>
              <p>
                <strong>Base legal del tratamiento:</strong> Conforme al <strong>Artículo 6.1(e) del RGPD</strong> *(misión de interés público vinculada a la transparencia democrática y el derecho a la información)* y el <strong>Artículo 6.1(f)</strong> *(interés legítimo de la ciudadanía en conocer las decisiones de sus representantes electos)*. Todos los datos proceden de las actas oficiales de las Cortes Generales publicadas de forma irrestricta.
              </p>

              <h4 className="font-headline font-bold text-lg text-[#1B1A17]">
                2. Privacidad de los Visitantes y Lectores
              </h4>
              <p>
                <strong>Diario del Voto NO exige registro ni cuentas de usuario.</strong> En estricta aplicación del principio de minimización de datos (Art. 5.1.c RGPD), la plataforma no almacena nombres, correos electrónicos ni datos identificativos de los lectores.
              </p>
              <p>
                Los registros técnicos de conexión (logs de acceso del servidor web) registran exclusivamente metadatos esenciales de comunicación por motivos de seguridad informática y prevención de denegaciones de servicio (DoS), con política de rotación y depuración automática periódica.
              </p>

              <h4 className="font-headline font-bold text-lg text-[#1B1A17]">
                3. Derechos de los Interesados (ARCO / RGPD)
              </h4>
              <p>
                Para cualquier consulta relativa al ejercicio de los derechos de acceso, rectificación o limitación del tratamiento, puede dirigirse por escrito a <strong className="font-mono text-[#1F4D36]">privacidad@diariodelvoto.es</strong>.
              </p>
            </div>
          )}

          {/* TAB 3: CERO RASTREADORES (ZERO-COOKIES) */}
          {activeTab === 'cookies' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="p-3 bg-[#FAF8F2] border border-[#A26815] font-typewriter text-xs text-[#A26815]">
                <strong>DIRECTIVA EPRIWACY Y ART. 22.2 LSSI-CE:</strong> Web limpia de publicidad, sin balizas web y sin cesión a redes publicitarias.
              </div>

              <h4 className="font-headline font-bold text-lg text-[#1B1A17]">
                1. ¿Por qué no mostramos ningún banner invasivo de cookies?
              </h4>
              <p>
                El <strong>Artículo 22.2 de la LSSI-CE</strong> y las directrices de la Agencia Española de Protección de Datos (AEPD) exigen solicitar consentimiento previo únicamente cuando se instalan dispositivos de almacenamiento o rastreo en el equipo del usuario con fines publicitarios, de analítica invasiva o perfilado.
              </p>
              <p className="font-bold">
                Diario del Voto no instala ninguna cookie publicitaria, ni cookies de terceros (sin Facebook Pixel, sin Google DoubleClick, sin balizas de retargeting).
              </p>

              <h4 className="font-headline font-bold text-lg text-[#1B1A17]">
                2. Almacenamiento Local Estrictamente Necesario
              </h4>
              <p>
                La web puede utilizar únicamente tecnologías de memoria temporal o almacenamiento local en su navegador (*localStorage*) con carácter meramente técnico y funcional:
              </p>
              <ul className="list-disc pl-5 space-y-1 text-sm">
                <li>Recordar si ha desplegado u ocultado el gráfico del Hemiciclo nominal.</li>
                <li>Preservar el mes seleccionado en el almanaque durante su sesión de navegación.</li>
              </ul>
              <p>
                Estos datos nunca salen de su dispositivo ni son transmitidos a servidores externos.
              </p>
            </div>
          )}

          {/* TAB 4: NEUTRALIDAD Y FUENTES */}
          {activeTab === 'neutralidad' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="p-3 bg-[#F4F6F9] border border-[#1B365D] font-typewriter text-xs text-[#1B365D]">
                <strong>COMPROMISO DE RIGOR INSTITUCIONAL:</strong> Transparencia algorítmica y neutralidad periodística al servicio del escrutinio cívico.
              </div>

              <h4 className="font-headline font-bold text-lg text-[#1B1A17]">
                1. Metodología de Despiece Equitativo
              </h4>
              <p>
                Toda síntesis parlamentaria elaborada en Diario del Voto sigue un protocolo estricto de doble contraste:
              </p>
              <ul className="list-disc pl-5 space-y-1 text-sm">
                <li><strong>Traducción divulgativa:</strong> Describir el alcance real de la ley (quién resulta beneficiado o gravado y qué importes o plazos estipula).</li>
                <li><strong>Tribuna equilibrada:</strong> Identificar con idéntico rigor los argumentos en defensa del proyecto esgrimidos por sus promotores y las objeciones razonadas presentadas por la oposición.</li>
              </ul>

              <h4 className="font-headline font-bold text-lg text-[#1B1A17]">
                2. Reutilización Oficial y Verificación
              </h4>
              <p>
                Cada votación incorpora un enlace directo y verificable al expediente oficial y a la publicación correspondiente en el Diario de Sesiones del Congreso:
              </p>
              <div className="p-3 bg-[#FAF7EE] border border-[#1B1A17] font-typewriter text-xs">
                <span>Fuente oficial primaria: </span>
                <a
                  href="https://www.congreso.es/datos-abiertos"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-bold text-[#1B365D] hover:underline inline-flex items-center gap-1"
                >
                  Portal de Datos Abiertos del Congreso de los Diputados <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          )}

          {/* TAB 5: MECENAZGO CÍVICO, CONDICIONES Y PRIVACIDAD */}
          {activeTab === 'mecenazgo' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="p-3 bg-[#FAF7EE] border border-[#1B1A17] font-typewriter text-xs text-[#4E4B44]">
                <strong>RÉGIMEN DE AUSPICIO CÍVICO:</strong> Micromecenazgo para sufragar servidores e infraestructura cívica (Art. 6.1.b y 5.1.c del Reglamento General de Protección de Datos UE 2016/679).
              </div>

              <h4 className="font-headline font-bold text-lg text-[#1B1A17]">
                1. Filosofía Editorial: «Solo Proyectos y Productos Útiles de Verdad»
              </h4>
              <p>
                El mecenazgo cívico de Diario del Voto está concebido para dar voz a proyectos con utilidad real para la ciudadanía: profesionales autónomos, oficios tradicionales (carpintería, fontanería, diseño, talleres), pymes de proximidad, software de código abierto, divulgación científica, libros y causas sociales.
              </p>
              <div className="p-3 bg-[#FDF2F2] border border-[#8F1D1D] text-xs font-mono text-[#8F1D1D] space-y-1">
                <strong>VETO EDITORIAL ESTRICTO:</strong>
                <p>
                  No se admiten bajo ninguna circunstancia anuncios de casas de apuestas, casinos online, esquemas de criptomonedas o trading especulativo, cursos «vendehumos» de enriquecimiento rápido, pornografía, estafas ni propaganda partidista o electoral.
                </p>
              </div>

              <h4 className="font-headline font-bold text-lg text-[#1B1A17]">
                2. Política de Privacidad Radical (Minimización de Datos)
              </h4>
              <p>
                En aplicación del <strong>principio de minimización del RGPD</strong>, Diario del Voto solo almacena los datos indispensables y públicos por definición: el nombre de la iniciativa, su enlace web (`https://`) y el mensaje divulgativo de hasta 90 caracteres.
              </p>
              <ul className="list-disc pl-5 space-y-1 text-sm">
                <li><strong>Cero datos bancarios o números de tarjeta:</strong> El pago se procesa al 100% en los servidores seguros y certificados de PayPal.</li>
                <li><strong>Cero DNI, direcciones postales o teléfonos.</strong></li>
                <li><strong>Cero cookies de rastreo publicitario:</strong> El enlace se muestra con formato HTML limpio y atributo `rel="noopener sponsored"`.</li>
              </ul>

              <h4 className="font-headline font-bold text-lg text-[#1B1A17]">
                3. Moderación Previa y Garantía de Reembolso Automático
              </h4>
              <p>
                Ningún anuncio se publica de forma automática. Toda propuesta pasa por revisión manual previa. Si la dirección de la gaceta rechaza una propuesta por no ajustarse a la línea editorial o por vulnerar estas normas, <strong>la API de PayPal ejecuta de forma inmediata el reembolso íntegro del 100%</strong> al comprador, adjuntando la explicación formal correspondiente.
              </p>
            </div>
          )}
        </div>

        {/* Pie del Modal */}
        <div className="bg-[#FAF7EE] border-t-2 border-[#1B1A17] p-3 px-6 flex flex-col sm:flex-row items-center justify-between gap-2 font-typewriter text-xs text-[#6E695F]">
          <span>Diario del Voto · Transparencia Democrática y Acceso Universal</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-[#1B1A17] text-[#FFFFFF] font-bold uppercase tracking-wider hover:bg-[#8F1D1D] transition shadow-[1px_1px_0px_#1B1A17]"
          >
            Entendido y Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
