import React, { useState } from 'react';
import { formatCurrency } from '../utils';
import { Coins, ShieldAlert, RotateCcw, Trash2, Sliders, Check } from 'lucide-react';
import { motion } from 'motion/react';

interface SettingsTabProps {
  initialBalance: number;
  onUpdateInitialBalance: (val: number) => void;
  presets: {
    stage1Base: number;
    stage1Protection: number;
    stage2Base: number;
    stage2Protection: number;
    stage3Base: number;
    stage3Protection: number;
  };
  onUpdatePresets: (presets: any) => void;
  onResetToDemoData: () => void;
  onClearAllData: () => void;
  transactionsCount: number;
  completedCyclesCount: number;
}

export default function SettingsTab({
  initialBalance,
  onUpdateInitialBalance,
  presets,
  onUpdatePresets,
  onResetToDemoData,
  onClearAllData,
  transactionsCount,
  completedCyclesCount,
}: SettingsTabProps) {
  const [balanceInput, setBalanceInput] = useState(initialBalance.toString());
  const [isSavedBalance, setIsSavedBalance] = useState(false);
  const [isSavedPresets, setIsSavedPresets] = useState(false);

  // Local preset state
  const [st1Base, setSt1Base] = useState(presets.stage1Base.toString());
  const [st1Prot, setSt1Prot] = useState(presets.stage1Protection.toString());
  const [st2Base, setSt2Base] = useState(presets.stage2Base.toString());
  const [st2Prot, setSt2Prot] = useState(presets.stage2Protection.toString());
  const [st3Base, setSt3Base] = useState(presets.stage3Base.toString());
  const [st3Prot, setSt3Prot] = useState(presets.stage3Protection.toString());

  const handleSaveBalance = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseFloat(balanceInput);
    if (!isNaN(parsed) && parsed >= 0) {
      onUpdateInitialBalance(parsed);
      setIsSavedBalance(true);
      setTimeout(() => setIsSavedBalance(false), 2000);
    }
  };

  const handleSavePresets = (e: React.FormEvent) => {
    e.preventDefault();
    const newPresets = {
      stage1Base: parseFloat(st1Base) || 0,
      stage1Protection: parseFloat(st1Prot) || 0,
      stage2Base: parseFloat(st2Base) || 0,
      stage2Protection: parseFloat(st2Prot) || 0,
      stage3Base: parseFloat(st3Base) || 0,
      stage3Protection: parseFloat(st3Prot) || 0,
    };
    onUpdatePresets(newPresets);
    setIsSavedPresets(true);
    setTimeout(() => setIsSavedPresets(false), 2000);
  };

  return (
    <div className="space-y-8">
      {/* Page Title */}
      <div>
        <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
          <Sliders className="h-5 w-5 text-indigo-400" />
          Ajustes da Estratégia e Banca
        </h2>
        <p className="text-sm text-slate-400 mt-1">
          Configure a sua banca de partida, defina os valores padrão das entradas de simulação e limpe os dados.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Box 1: Banca Inicial */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 relative overflow-hidden backdrop-blur-sm">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full filter blur-xl pointer-events-none" />
          
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2 mb-4">
            <Coins className="h-4 w-4 text-emerald-400" />
            Configuração de Banca Inicial
          </h3>

          <form onSubmit={handleSaveBalance} className="space-y-4">
            <div>
              <label className="block text-xs text-slate-400 font-semibold mb-2">
                Saldo Inicial de Gestão (R$)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-mono text-slate-500 text-sm font-semibold">
                  R$
                </span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={balanceInput}
                  onChange={(e) => setBalanceInput(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 font-mono text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                  placeholder="5000.00"
                />
              </div>
              <p className="text-[11px] text-slate-500 mt-2 leading-relaxed">
                Este valor representa o capital inicial da sua banca (ex: R$ 5.000,00). 
                O saldo atual é recalculado somando todos os aportes/vitórias e subtraindo saídas/perdas.
              </p>
            </div>

            <button
              type="submit"
              className={`w-full py-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                isSavedBalance 
                  ? 'bg-emerald-500 text-white' 
                  : 'bg-indigo-600 hover:bg-indigo-505 text-white hover:shadow-lg hover:shadow-indigo-500/10'
              }`}
            >
              {isSavedBalance ? (
                <>
                  <Check className="h-4 w-4" />
                  Saldo Inicial Atualizado!
                </>
              ) : (
                'Salvar Saldo Inicial'
              )}
            </button>
          </form>
        </div>

        {/* Box 2: Perigos & Redefinição */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 relative overflow-hidden backdrop-blur-sm flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2 mb-4">
              <ShieldAlert className="h-4 w-4 text-rose-500" />
              Operações de Redefinição
            </h3>
            
            <p className="text-xs text-slate-400 leading-relaxed mb-6">
              Os dados de transações e ciclos criados ficam salvos localmente em seu navegador. 
              Você pode restaurar a simulação padrão ou apagar tudo se quiser começar uma gestão limpa.
            </p>

            <div className="grid grid-cols-2 gap-4 text-center mb-6">
              <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3">
                <span className="text-[10px] text-slate-500 block uppercase font-bold">Transações</span>
                <span className="text-lg font-black font-mono text-indigo-400">{transactionsCount}</span>
              </div>
              <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3">
                <span className="text-[10px] text-slate-500 block uppercase font-bold">Ciclos Fechados</span>
                <span className="text-lg font-black font-mono text-emerald-400">{completedCyclesCount}</span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <button
              onClick={onResetToDemoData}
              className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Resetar para Dados de Demonstração
            </button>
            
            <button
              onClick={onClearAllData}
              className="w-full bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white border border-rose-500/20 hover:border-transparent py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Limpar Absolutamente Tudo (Banca R$ 0)
            </button>
          </div>
        </div>

        {/* Box 3: Gênese de Estratégias (Presets 100+60 etc) */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 lg:col-span-2 relative overflow-hidden backdrop-blur-sm">
          <div className="absolute top-0 left-0 w-48 h-48 bg-blue-500/5 rounded-full filter blur-xl pointer-events-none" />

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <Sliders className="h-4 w-4 text-blue-400" />
              Configuração Padrão de Estágios (Estratégia)
            </h3>
            <span className="text-[10px] px-2.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 font-mono font-bold">
              Layout Recorrente do Gale
            </span>
          </div>

          <p className="text-xs text-slate-400 mb-6 leading-relaxed">
            Aqui você define os valores sugeridos por padrão para cada nível de recuperação. 
            Em cada rodada você poderá alterá-los livremente se quiser, mas estes preenchimentos pouparão digitação rápida!
          </p>

          <form onSubmit={handleSavePresets} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Estágio 1 Preset */}
              <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4.5 space-y-4">
                <h4 className="text-xs font-bold text-blue-400 uppercase tracking-wider border-b border-slate-900 pb-2">
                  1° Entrada (Estágio Inicial)
                </h4>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] text-slate-500 font-bold mb-1.5 uppercase">Entrada Base</label>
                    <input
                      type="number"
                      value={st1Base}
                      onChange={(e) => setSt1Base(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 font-mono text-xs text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500 font-bold mb-1.5 uppercase">Proteção</label>
                    <input
                      type="number"
                      value={st1Prot}
                      onChange={(e) => setSt1Prot(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 font-mono text-xs text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
                <div className="text-[11px] text-slate-500 text-center font-semibold pt-1">
                  Soma Total: <span className="font-mono text-slate-300">{formatCurrency(parseFloat(st1Base || '0') + parseFloat(st1Prot || '0'))}</span>
                </div>
              </div>

              {/* Estágio 2 Preset */}
              <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4.5 space-y-4">
                <h4 className="text-xs font-bold text-orange-400 uppercase tracking-wider border-b border-slate-900 pb-2">
                  2° Entrada (Em caso de Red)
                </h4>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] text-slate-500 font-bold mb-1.5 uppercase">Entrada Base</label>
                    <input
                      type="number"
                      value={st2Base}
                      onChange={(e) => setSt2Base(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 font-mono text-xs text-white focus:outline-none focus:border-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500 font-bold mb-1.5 uppercase">Proteção</label>
                    <input
                      type="number"
                      value={st2Prot}
                      onChange={(e) => setSt2Prot(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 font-mono text-xs text-white focus:outline-none focus:border-orange-500"
                    />
                  </div>
                </div>
                <div className="text-[11px] text-slate-500 text-center font-semibold pt-1">
                  Soma Total: <span className="font-mono text-slate-300">{formatCurrency(parseFloat(st2Base || '0') + parseFloat(st2Prot || '0'))}</span>
                </div>
              </div>

              {/* Estágio 3 Preset */}
              <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4.5 space-y-4">
                <h4 className="text-xs font-bold text-red-400 uppercase tracking-wider border-b border-slate-900 pb-2">
                  3° Entrada (Se Red do Gale 1)
                </h4>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] text-slate-500 font-bold mb-1.5 uppercase">Entrada Base</label>
                    <input
                      type="number"
                      value={st3Base}
                      onChange={(e) => setSt3Base(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 font-mono text-xs text-white focus:outline-none focus:border-red-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500 font-bold mb-1.5 uppercase">Proteção</label>
                    <input
                      type="number"
                      value={st3Prot}
                      onChange={(e) => setSt3Prot(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 font-mono text-xs text-white focus:outline-none focus:border-red-500"
                    />
                  </div>
                </div>
                <div className="text-[11px] text-slate-500 text-center font-semibold pt-1">
                  Soma Total: <span className="font-mono text-slate-300">{formatCurrency(parseFloat(st3Base || '0') + parseFloat(st3Prot || '0'))}</span>
                </div>
              </div>

            </div>

            <button
              type="submit"
              className={`w-full py-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                isSavedPresets 
                  ? 'bg-emerald-500 text-white' 
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white hover:shadow-lg hover:shadow-indigo-500/10'
              }`}
            >
              {isSavedPresets ? (
                <>
                  <Check className="h-4 w-4" />
                  Estratégia Padrão Atualizada!
                </>
              ) : (
                'Salvar Estratégia de Entrada Padrão'
              )}
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}
