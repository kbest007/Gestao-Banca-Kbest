import React from 'react';
import { AlertTriangle, RotateCcw, Home } from 'lucide-react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

export default class ErrorBoundary extends React.Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Uncaught React Error:', error, errorInfo);
    this.setState({
      error,
      errorInfo,
    });
  }

  private handleReset = () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch (e) {
      console.error(e);
    }
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 text-slate-50 flex flex-col items-center justify-center p-4 relative font-sans">
          {/* Ambient background glows */}
          <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-rose-500/[0.03] rounded-full filter blur-3xl pointer-events-none" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-indigo-500/[0.03] rounded-full filter blur-3xl pointer-events-none" />

          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden text-center">
            {/* Visual Red Accent */}
            <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-rose-500 to-orange-500" />

            {/* Error Icon */}
            <div className="inline-flex p-4 rounded-2xl bg-rose-500/10 text-rose-400 mb-5">
              <AlertTriangle className="h-8 w-8 animate-pulse" />
            </div>

            <h1 className="text-xl font-black text-white tracking-tight">Ocorreu um erro no aplicativo</h1>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Alguma renderização falhou de forma inesperada no dispositivo atual. Tente recarregar ou limpar o cache local para restaurar.
            </p>

            {this.state.error && (
              <div className="mt-4 p-3 bg-slate-950 rounded-xl text-left border border-slate-800/60 max-h-32 overflow-auto font-mono text-[10px] text-slate-500 scrollbar-thin">
                <span className="text-rose-400 font-bold block mb-1">Crash:</span>
                {this.state.error.toString()}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 mt-6">
              <button
                onClick={() => window.location.reload()}
                className="py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
                id="error-reload-btn"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Recarregar Página
              </button>
              <button
                onClick={this.handleReset}
                className="py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-indigo-600/10 cursor-pointer flex items-center justify-center gap-1.5"
                id="error-reset-cache-btn"
              >
                <Home className="h-3.5 w-3.5" />
                Resetar Cache
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
