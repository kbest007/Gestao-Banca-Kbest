import React, { useState, useEffect, useMemo } from 'react';
import { Transaction, BettingCycle, EntryStage } from './types';
import { 
  DEFAULT_INITIAL_BALANCE, 
  DEFAULT_PRESETS,
  INITIAL_TRANSACTIONS, 
  INITIAL_COMPLETED_CYCLES 
} from './initialData';
import DashboardTab from './components/DashboardTab';
import TransactionsTab from './components/TransactionsTab';
import SettingsTab from './components/SettingsTab';
import { formatCurrency } from './utils';
import { 
  Coins, 
  Sliders,
  History,
  Activity,
  AlertTriangle,
  Check,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'transactions' | 'settings'>('dashboard');

  // Unified Custom Alert & Confirmation dialog state
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void | Promise<void>;
    confirmText?: string;
    cancelText?: string;
    variant?: 'danger' | 'warning' | 'info';
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  const triggerConfirm = (
    title: string,
    message: string,
    onConfirm: () => void | Promise<void>,
    confirmText = 'Confirmar',
    cancelText = 'Cancelar',
    variant: 'danger' | 'warning' | 'info' = 'warning'
  ) => {
    setConfirmModal({
      isOpen: true,
      title,
      message,
      onConfirm: async () => {
        try {
          await onConfirm();
        } catch (err) {
          console.error(err);
        }
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      },
      confirmText,
      cancelText,
      variant
    });
  };

  // React states initialized directly from localStorage with factory fallbacks
  const [initialBalance, setInitialBalance] = useState<number>(() => {
    try {
      const stored = localStorage.getItem('gestaogale:initialBalance');
      return stored !== null ? parseFloat(stored) : DEFAULT_INITIAL_BALANCE;
    } catch {
      return DEFAULT_INITIAL_BALANCE;
    }
  });

  const [presets, setPresets] = useState(() => {
    try {
      const stored = localStorage.getItem('gestaogale:presets');
      return stored !== null ? JSON.parse(stored) : DEFAULT_PRESETS;
    } catch {
      return DEFAULT_PRESETS;
    }
  });

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    try {
      const stored = localStorage.getItem('gestaogale:transactions');
      return stored !== null ? JSON.parse(stored) : INITIAL_TRANSACTIONS;
    } catch {
      return INITIAL_TRANSACTIONS;
    }
  });

  const [activeCycle, setActiveCycle] = useState<BettingCycle | null>(() => {
    try {
      const stored = localStorage.getItem('gestaogale:activeCycle');
      return stored !== null ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [completedCycles, setCompletedCycles] = useState<BettingCycle[]>(() => {
    try {
      const stored = localStorage.getItem('gestaogale:completedCycles');
      return stored !== null ? JSON.parse(stored) : INITIAL_COMPLETED_CYCLES;
    } catch {
      return INITIAL_COMPLETED_CYCLES;
    }
  });

  // Sync state changes to localStorage whenever they mutate
  useEffect(() => {
    localStorage.setItem('gestaogale:initialBalance', initialBalance.toString());
  }, [initialBalance]);

  useEffect(() => {
    localStorage.setItem('gestaogale:presets', JSON.stringify(presets));
  }, [presets]);

  useEffect(() => {
    localStorage.setItem('gestaogale:transactions', JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    if (activeCycle) {
      localStorage.setItem('gestaogale:activeCycle', JSON.stringify(activeCycle));
    } else {
      localStorage.removeItem('gestaogale:activeCycle');
    }
  }, [activeCycle]);

  useEffect(() => {
    localStorage.setItem('gestaogale:completedCycles', JSON.stringify(completedCycles));
  }, [completedCycles]);

  // Derived current calculated balance
  const currentCalculatedBalance = useMemo(() => {
    if (transactions.length === 0) return initialBalance;
    // Keep it synced to the last item's running balance
    return transactions[transactions.length - 1].balanceAfter;
  }, [initialBalance, transactions]);

  // Handle Updates
  const handleUpdateInitialBalance = async (amount: number) => {
    setInitialBalance(amount);
    
    // Recalculate balanceAfter values for all transactions and sync changes
    let running = amount;
    const sortedTransactions = [...transactions].sort((a, b) => {
      const tA = (a as any).createdAt || a.date || '';
      const tB = (b as any).createdAt || b.date || '';
      return tA.localeCompare(tB);
    });

    const updatedTxList = sortedTransactions.map((t) => {
      if (t.type === 'win' || t.type === 'deposit') {
        running += t.amount;
      } else {
        running -= t.amount;
      }
      return {
        ...t,
        balanceAfter: running
      };
    });

    setTransactions(updatedTxList);
  };

  const handleUpdatePresets = async (newPresets: any) => {
    setPresets(newPresets);
  };

  const handleAddTransaction = async (newTx: Omit<Transaction, 'id' | 'balanceAfter'>) => {
    let nextCalculatedBalance = currentCalculatedBalance;
    
    if (newTx.type === 'win' || newTx.type === 'deposit') {
      nextCalculatedBalance += newTx.amount;
    } else {
      nextCalculatedBalance -= newTx.amount;
    }

    const freshId = 'tx_' + Math.random().toString(36).substring(2, 9);
    const freshTx: Transaction = {
      ...newTx,
      id: freshId,
      balanceAfter: nextCalculatedBalance,
    };

    setTransactions(prev => [...prev, freshTx]);
  };

  const handleDeleteTransaction = async (id: string) => {
    triggerConfirm(
      'Excluir este Lançamento?',
      'Tem certeza de que deseja excluir permanentemente esta movimentação? O saldo das transações posteriores será recalculado automaticamente.',
      async () => {
        const filtered = transactions.filter((tx) => tx.id !== id);
        let running = initialBalance;
        
        const recalculated = filtered.map((tx) => {
          if (tx.type === 'win' || tx.type === 'deposit') {
            running += tx.amount;
          } else {
            running -= tx.amount;
          }
          return {
            ...tx,
            balanceAfter: running
          };
        });

        setTransactions(recalculated);
      },
      'Excluir',
      'Cancelar',
      'danger'
    );
  };

  // Preset operations
  const handleResetToDemoData = async () => {
    triggerConfirm(
      'Restaurar Dados de Demonstração?',
      'Tem certeza de que deseja restaurar as simulações e dados de demonstração de fábrica? Isso limpará seus lançamentos pessoais atuais.',
      async () => {
        setInitialBalance(DEFAULT_INITIAL_BALANCE);
        setPresets(DEFAULT_PRESETS);
        setActiveCycle(null);
        setTransactions(INITIAL_TRANSACTIONS);
        setCompletedCycles(INITIAL_COMPLETED_CYCLES);
        setActiveTab('dashboard');
      },
      'Restaurar',
      'Cancelar',
      'warning'
    );
  };

  const handleClearAllData = async () => {
    triggerConfirm(
      'Zerar Toda a sua Banca?',
      'Tem certeza de que deseja zerar TODA a sua banca? Essa ação apagará permanentemente todos os seus dados salvos no navegador (redefinindo o saldo para R$ 0,00).',
      async () => {
        setInitialBalance(0);
        setPresets(DEFAULT_PRESETS);
        setActiveCycle(null);
        setTransactions([]);
        setCompletedCycles([]);
        setActiveTab('settings');
      },
      'Zerar Tudo',
      'Cancelar',
      'danger'
    );
  };

  // Active progression cycle state events
  const handleStartCycle = async () => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    
    const freshCycle: BettingCycle = {
      id: 'cycle_' + Math.random().toString(36).substring(2, 9),
      startDate: `${yyyy}-${mm}-${dd}`,
      status: 'active',
      currentStage: 1,
      stages: {
        1: null,
        2: null,
        3: null
      }
    };

    setActiveCycle(freshCycle);
  };

  const handleCancelActiveCycle = async () => {
    triggerConfirm(
      'Descartar Ciclo Ativo?',
      'Tem certeza de que deseja descartar este ciclo? Os dados não salvos deste ciclo ativo de 3 estágios serão apagados definitivamente.',
      async () => {
        setActiveCycle(null);
      },
      'Descartar',
      'Manter Ativo',
      'danger'
    );
  };

  const handleRecordStageResult = async (
    netResult: number,
    completedStage: EntryStage
  ) => {
    if (!activeCycle) return;
    const stageNum = activeCycle.currentStage;
    
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const formattedToday = `${yyyy}-${mm}-${dd}`;

    const isOverallWin = netResult > 0;
    const absAmount = Math.abs(parseFloat(netResult.toFixed(2)));
    const nextBalanceAfter = currentCalculatedBalance + parseFloat(netResult.toFixed(2));

    const freshTxId = 'tx_' + Math.random().toString(36).substring(2, 9);
    const freshTx: Transaction = {
      id: freshTxId,
      type: isOverallWin ? 'win' : 'loss',
      amount: absAmount,
      balanceAfter: parseFloat(nextBalanceAfter.toFixed(2)),
      date: formattedToday,
      description: isOverallWin 
        ? `Green no Estágio ${stageNum} (Líquido: +R$ ${absAmount.toFixed(2)})`
        : `Red no Estágio ${stageNum} (Líquido: -R$ ${absAmount.toFixed(2)})`,
      cycleId: activeCycle.id,
      stageNumber: stageNum as 1 | 2 | 3
    };

    const updatedStages = {
      ...activeCycle.stages,
      [stageNum]: {
        ...completedStage,
        winAmount: parseFloat(netResult.toFixed(2)),
        status: isOverallWin ? 'win' : 'loss'
      }
    };

    // Save transaction
    setTransactions(prev => [...prev, freshTx]);

    if (isOverallWin) {
      // Complete current cycle as WIN state
      const updatedCycle: BettingCycle = {
        ...activeCycle,
        status: 'completed_win',
        currentStage: stageNum as 1 | 2 | 3,
        totalNetProfit: parseFloat(netResult.toFixed(2)),
        stages: updatedStages
      };

      setCompletedCycles(prev => [updatedCycle, ...prev]);
      setActiveCycle(null);
    } else {
      if (stageNum === 1) {
        setActiveCycle({
          ...activeCycle,
          currentStage: 2,
          stages: updatedStages
        });
      } 
      else if (stageNum === 2) {
        setActiveCycle({
          ...activeCycle,
          currentStage: 3,
          stages: updatedStages
        });
      } 
      else {
        // Stop Loss reached on Stage 3 loss
        const calcTotalLoss = Math.abs(
          parseFloat((updatedStages[1]?.winAmount || 0).toFixed(2)) +
          parseFloat((updatedStages[2]?.winAmount || 0).toFixed(2)) +
          parseFloat((updatedStages[3]?.winAmount || 0).toFixed(2))
        );

        const updatedCycle: BettingCycle = {
          ...activeCycle,
          status: 'completed_loss',
          currentStage: 3,
          totalLoss: calcTotalLoss,
          stages: updatedStages
        };

        setCompletedCycles(prev => [updatedCycle, ...prev]);
        setActiveCycle(null);
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 relative pb-16">
      
      {/* Premium ambient decorative elements */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-indigo-500/[0.02] rounded-full filter blur-3xl pointer-events-none" />
      <div className="absolute top-[30%] right-1/4 w-[400px] h-[400px] bg-emerald-500/[0.02] rounded-full filter blur-3xl pointer-events-none" />

      {/* Main Header Panel */}
      <header className="border-b border-slate-900 bg-slate-900/30 backdrop-blur-md sticky top-0 z-40 select-none">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-col sm:flex-row items-center justify-between gap-4">
          
          {/* Logo brand / App Title */}
          <div className="flex items-center space-x-3">
            <span className="p-2.5 bg-gradient-to-tr from-indigo-500 via-indigo-600 to-blue-600 rounded-xl text-white shadow-lg shadow-indigo-600/10">
              <Activity className="h-5.5 w-5.5" />
            </span>
            <div>
              <h1 className="text-base font-black tracking-tight text-white flex items-center">
                Gestão<span className="bg-gradient-to-r from-indigo-400 to-blue-400 bg-clip-text text-transparent">Gale</span>
              </h1>
              <span className="text-[10px] text-slate-400 font-extrabold block uppercase tracking-widest leading-none mt-0.5">Controle de Banca Inteligente</span>
            </div>
          </div>

          {/* Running Balance Widgets & Offline Badge */}
          <div className="flex items-center gap-3 flex-wrap">
            {/* Running Balance Widget */}
            <div className="flex items-center space-x-3.5 border border-slate-800 bg-slate-950/60 pl-4 pr-5 py-2 rounded-2xl shadow-inner shadow-slate-950 h-11">
              <div className="p-1.5 bg-indigo-500/10 text-indigo-400 rounded-xl">
                <Coins className="h-4.5 w-4.5 animate-pulse" />
              </div>
              <div>
                <span className="text-[9px] text-slate-500 uppercase font-extrabold tracking-wider block">Saldo Geral Atual</span>
                <span className={`text-sm font-black font-mono leading-none ${currentCalculatedBalance >= 0 ? 'text-indigo-400' : 'text-rose-500'}`}>
                  {formatCurrency(currentCalculatedBalance)}
                </span>
              </div>
            </div>

            {/* Offline Database Safe badge */}
            <div className="flex items-center space-x-2 border border-slate-800 bg-slate-950/40 pl-3 pr-4 py-1.5 rounded-2xl h-11 select-none">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <div className="flex flex-col items-start leading-none">
                <span className="text-[8px] text-slate-500 font-black uppercase tracking-wider">Storage</span>
                <span className="text-[10px] text-emerald-400 font-extrabold mt-0.5">Banco Local Salvo</span>
              </div>
            </div>
          </div>

        </div>
      </header>

      {/* Main container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        
        {/* Navigation Selector Tabs */}
        <div className="flex items-center space-x-1.5 border-b border-slate-900/80 mb-8 select-none overflow-x-auto pb-1.5 scrollbar-none">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer border ${
              activeTab === 'dashboard' 
                ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-600/10' 
                : 'bg-transparent border-transparent text-slate-400 hover:text-white hover:bg-slate-900/60'
            }`}
            id="tab-btn-dashboard"
          >
            <Activity className="h-4 w-4" />
            <span>Simulador & Painel</span>
          </button>

          <button
            onClick={() => setActiveTab('transactions')}
            className={`inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer border ${
              activeTab === 'transactions' 
                ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-600/10' 
                : 'bg-transparent border-transparent text-slate-400 hover:text-white hover:bg-slate-900/60'
            }`}
            id="tab-btn-transactions"
          >
            <History className="h-4 w-4" />
            <span>Livro de Caixa</span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer border ${
              activeTab === 'settings' 
                ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-600/10' 
                : 'bg-transparent border-transparent text-slate-400 hover:text-white hover:bg-slate-900/60'
            }`}
            id="tab-btn-settings"
          >
            <Sliders className="h-4 w-4" />
            <span>Ajustes & Presets</span>
          </button>
        </div>

        {/* Actionable Active Viewport container */}
        <div id="active-tab-container" className="min-h-[480px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.12 }}
            >
              {activeTab === 'dashboard' && (
                <DashboardTab
                  initialBalance={initialBalance}
                  transactions={transactions}
                  activeCycle={activeCycle}
                  completedCycles={completedCycles}
                  presets={presets}
                  onStartCycle={handleStartCycle}
                  onRecordStageResult={handleRecordStageResult}
                  onCancelActiveCycle={handleCancelActiveCycle}
                  onShowAlert={(title, msg) => {
                    triggerConfirm(title, msg, () => {}, 'Entendi', '', 'info');
                  }}
                />
              )}

              {activeTab === 'transactions' && (
                <TransactionsTab
                  transactions={transactions}
                  onAddTransaction={handleAddTransaction}
                  onDeleteTransaction={handleDeleteTransaction}
                />
              )}

              {activeTab === 'settings' && (
                <SettingsTab
                  initialBalance={initialBalance}
                  onUpdateInitialBalance={handleUpdateInitialBalance}
                  presets={presets}
                  onUpdatePresets={handleUpdatePresets}
                  onResetToDemoData={handleResetToDemoData}
                  onClearAllData={handleClearAllData}
                  transactionsCount={transactions.length}
                  completedCyclesCount={completedCycles.length}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>

      </main>

      {/* Visual Custom Confirm Dialog Modal */}
      <AnimatePresence>
        {confirmModal.isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                if (confirmModal.cancelText === '') return; // Alert mode, don't close on backdrop click
                setConfirmModal(prev => ({ ...prev, isOpen: false }));
              }}
              className="absolute inset-0 bg-slate-950 backdrop-blur-sm"
            />

            {/* Dialog Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              transition={{ type: 'spring', duration: 0.35 }}
              className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl overflow-hidden"
            >
              {/* Variant Accent indicator */}
              <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-transparent via-transparent to-transparent"
                style={{
                  backgroundImage: confirmModal.variant === 'danger' 
                    ? 'linear-gradient(to right, #f43f5e, #e11d48)' 
                    : confirmModal.variant === 'warning' 
                    ? 'linear-gradient(to right, #f59e0b, #d97706)' 
                    : 'linear-gradient(to right, #6366f1, #4f46e5)'
                }}
              />

              <div className="flex gap-4">
                {/* Icon box */}
                <div className={`p-3 rounded-2xl shrink-0 h-12 w-12 flex items-center justify-center ${
                  confirmModal.variant === 'danger' 
                    ? 'bg-rose-500/10 text-rose-400' 
                    : confirmModal.variant === 'warning' 
                    ? 'bg-amber-500/10 text-amber-400' 
                    : 'bg-indigo-500/10 text-indigo-400'
                }`}>
                  <AlertTriangle className="h-6 w-6" />
                </div>

                {/* Text Content */}
                <div className="space-y-1.5 flex-1">
                  <h3 className="text-base font-black text-white tracking-tight">{confirmModal.title}</h3>
                  <p className="text-xs text-slate-400 leading-relaxed font-semibold">{confirmModal.message}</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-slate-800/60">
                {confirmModal.cancelText !== '' && (
                  <button
                    onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                    className="px-4 py-2 border border-slate-800 hover:border-slate-700 bg-slate-950/20 hover:bg-slate-950/50 hover:text-white text-slate-400 rounded-xl text-xs font-bold transition-all cursor-pointer"
                  >
                    {confirmModal.cancelText}
                  </button>
                )}
                <button
                  onClick={async () => {
                    await confirmModal.onConfirm();
                  }}
                  className={`px-5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer text-white shadow-md ${
                    confirmModal.variant === 'danger' 
                      ? 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/10' 
                      : confirmModal.variant === 'warning' 
                      ? 'bg-amber-500 hover:bg-amber-400 shadow-amber-500/10 text-slate-950' 
                      : 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/10'
                  }`}
                >
                  {confirmModal.confirmText}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
