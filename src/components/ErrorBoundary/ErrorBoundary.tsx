import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('QueVotan ErrorBoundary:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#FBF8F1] flex items-center justify-center p-6 font-editorial">
          <div className="bg-[#FFFFFF] border-4 border-[#1B1A17] p-8 max-w-lg shadow-[6px_6px_0px_#1B1A17] text-center space-y-4">
            <div className="inline-flex p-3 bg-[#FAF7EE] border-2 border-[#8F1D1D] rounded-full text-[#8F1D1D]">
              <AlertCircle className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-mono tracking-widest uppercase text-[#8F1D1D] font-bold block">
                CORTES GENERALES · FE DE ERRATAS TÉCNICA
              </span>
              <h2 className="text-2xl font-headline font-bold text-[#1B1A17]">
                Incidencia en la Tirada Digital
              </h2>
            </div>

            <p className="font-editorial text-sm text-[#4E4B44] leading-relaxed">
              Se ha producido una anomalía inesperada al maquetar la edición parlamentaria. 
              El equipo de redacción técnica ha sido notificado.
            </p>

            <button
              onClick={() => window.location.reload()}
              className="px-5 py-2.5 bg-[#1B1A17] hover:bg-[#8F1D1D] text-[#FFFFFF] font-typewriter text-xs font-bold uppercase tracking-wider transition shadow-[2px_2px_0px_#8F1D1D] inline-flex items-center gap-2 cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              Reimprimir y Cargar Edición
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
