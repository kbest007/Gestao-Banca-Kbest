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
import AuthScreen from './components/AuthScreen';
import { formatCurrency } from './utils';
import { 
  TrendingUp, 
  Coins, 
  Percent,
  Sliders,
  History,
  Activity,
  LogOut,
  Sparkles,
  User,
  Loader2,
  AlertTriangle,
  X,
  Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Firebase Imports
import { auth, db, handleFirestoreError, OperationType } from './firebase';
import { onAuthStateChanged, signOut, User as FirebaseUser } from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  collection, 
  query, 
  onSnapshot, 
  writeBatch 
} from 'firebase/firestore';

export default function App() {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
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

  // React states initialized with default values, populated via Firestore live sync
  const [initialBalance, setInitialBalance] = useState<number>(DEFAULT_INITIAL_BALANCE);
  const [presets, setPresets] = useState(DEFAULT_PRESETS);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [activeCycle, setActiveCycle] = useState<BettingCycle | null>(null);
  const [completedCycles, setCompletedCycles] = useState<BettingCycle[]>([]);

  // Set up Firebase Auth and Firestore syncing listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (!user) {
        setAuthLoading(false);
        return;
      }

      setAuthLoading(true);
      const userDocRef = doc(db, 'users', user.uid);
      
      // Initialize/verify user document exists in database
      try {
        const userDocSnap = await getDoc(userDocRef);
        if (!userDocSnap.exists()) {
          const batch = writeBatch(db);
          
          batch.set(userDocRef, {
            userId: user.uid,
            initialBalance: DEFAULT_INITIAL_BALANCE,
            presets: DEFAULT_PRESETS,
            activeCycle: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });

          await batch.commit();
        }
      } catch (err) {
        console.error("Erro no setup inicial do banco do usuário: ", err);
      }

      // Live Firestore snap listeners
      const unsubUser = onSnapshot(userDocRef, (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setInitialBalance(data.initialBalance ?? DEFAULT_INITIAL_BALANCE);
          setPresets(data.presets ?? DEFAULT_PRESETS);
          setActiveCycle(data.activeCycle ?? null);
        }
      }, (error) => {
        handleFirestoreError(error, OperationType.GET, `users/${user.uid}`);
      });

      const unsubTx = onSnapshot(
        query(collection(db, 'users', user.uid, 'transactions')),
        (snapshot) => {
          const list: Transaction[] = [];
          snapshot.forEach((subDoc) => {
            list.push(subDoc.data() as Transaction);
          });
          // Sort transactions by internal timestamp or relative date ascending
          list.sort((a, b) => {
            const tA = (a as any).createdAt || a.date || '';
            const tB = (b as any).createdAt || b.date || '';
            return tA.localeCompare(tB);
          });
          setTransactions(list);
        },
        (error) => {
          handleFirestoreError(error, OperationType.GET, `users/${user.uid}/transactions`);
        }
      );

      const unsubCycles = onSnapshot(
        query(collection(db, 'users', user.uid, 'completedCycles')),
        (snapshot) => {
          const list: BettingCycle[] = [];
          snapshot.forEach((subDoc) => {
            list.push(subDoc.data() as BettingCycle);
          });
          // Sort completed cycles by custom creation timestamp descending (newest first)
          list.sort((a, b) => {
            const tA = (a as any).createdAt || a.startDate || '';
            const tB = (b as any).createdAt || b.startDate || '';
            return tB.localeCompare(tA);
          });
          setCompletedCycles(list);
          setAuthLoading(false);
        },
        (error) => {
          handleFirestoreError(error, OperationType.GET, `users/${user.uid}/completedCycles`);
        }
      );

      return () => {
        unsubUser();
        unsubTx();
        unsubCycles();
      };
    }, (error) => {
      console.error("Erro no estado de autenticação: ", error);
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Derived current calculated balance
  const currentCalculatedBalance = useMemo(() => {
    if (transactions.length === 0) return initialBalance;
    // Keep it synced to the last item's running balance
    return transactions[transactions.length - 1].balanceAfter;
  }, [initialBalance, transactions]);

  // Handle Updates
  const handleUpdateInitialBalance = async (amount: number) => {
    if (!currentUser) return;
    try {
      const userDocRef = doc(db, 'users', currentUser.uid);
      const batch = writeBatch(db);

      batch.update(userDocRef, {
        initialBalance: amount,
        updatedAt: new Date().toISOString()
      });

      // Recalculate balanceAfter values for all transactions and sync changes
      let running = amount;
      const sortedTransactions = [...transactions].sort((a, b) => {
        const tA = (a as any).createdAt || a.date || '';
        const tB = (b as any).createdAt || b.date || '';
        return tA.localeCompare(tB);
      });

      sortedTransactions.forEach((t) => {
        if (t.type === 'win' || t.type === 'deposit') {
          running += t.amount;
        } else {
          running -= t.amount;
        }
        const txDocRef = doc(db, 'users', currentUser.uid, 'transactions', t.id);
        batch.update(txDocRef, {
          balanceAfter: running
        });
      });

      await batch.commit();
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${currentUser.uid}`);
    }
  };

  const handleUpdatePresets = async (newPresets: any) => {
    if (!currentUser) return;
    try {
      const userDocRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userDocRef, {
        presets: newPresets,
        updatedAt: new Date().toISOString()
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${currentUser.uid}`);
    }
  };

  const handleAddTransaction = async (newTx: Omit<Transaction, 'id' | 'balanceAfter'>) => {
    if (!currentUser) return;
    try {
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

      const txDocRef = doc(db, 'users', currentUser.uid, 'transactions', freshId);
      await setDoc(txDocRef, {
        ...freshTx,
        userId: currentUser.uid,
        createdAt: new Date().toISOString()
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `users/${currentUser.uid}/transactions`);
    }
  };

  const handleDeleteTransaction = async (id: string) => {
    if (!currentUser) return;

    triggerConfirm(
      'Excluir este Lançamento?',
      'Tem certeza de que deseja excluir permanentemente esta movimentação? O saldo das transações posteriores será recalculado automaticamente.',
      async () => {
        try {
          const batch = writeBatch(db);
          const filtered = transactions.filter((tx) => tx.id !== id);
          
          const delTxRef = doc(db, 'users', currentUser.uid, 'transactions', id);
          batch.delete(delTxRef);

          let running = initialBalance;
          filtered.forEach((tx) => {
            if (tx.type === 'win' || tx.type === 'deposit') {
              running += tx.amount;
            } else {
              running -= tx.amount;
            }
            const txDocRef = doc(db, 'users', currentUser.uid, 'transactions', tx.id);
            batch.update(txDocRef, {
              balanceAfter: running
            });
          });

          await batch.commit();
        } catch (err) {
          handleFirestoreError(err, OperationType.DELETE, `users/${currentUser.uid}/transactions/${id}`);
        }
      },
      'Excluir',
      'Cancelar',
      'danger'
    );
  };

  // Preset operations
  const handleResetToDemoData = async () => {
    if (!currentUser) return;
    
    triggerConfirm(
      'Restaurar Dados de Demonstração?',
      'Tem certeza de que deseja restaurar as simulações e dados de demonstração de fábrica? Isso limpará seus lançamentos pessoais atuais.',
      async () => {
        try {
          const batch = writeBatch(db);

          // Wipe current subcollections records asynchronously
          transactions.forEach((tx) => {
            batch.delete(doc(db, 'users', currentUser.uid, 'transactions', tx.id));
          });
          completedCycles.forEach((cycle) => {
            batch.delete(doc(db, 'users', currentUser.uid, 'completedCycles', cycle.id));
          });

          const userDocRef = doc(db, 'users', currentUser.uid);
          batch.update(userDocRef, {
            initialBalance: DEFAULT_INITIAL_BALANCE,
            presets: DEFAULT_PRESETS,
            activeCycle: null,
            updatedAt: new Date().toISOString()
          });

          INITIAL_TRANSACTIONS.forEach((tx) => {
            const txRef = doc(collection(db, 'users', currentUser.uid, 'transactions'), tx.id);
            batch.set(txRef, {
              ...tx,
              userId: currentUser.uid,
              createdAt: new Date(tx.date).toISOString()
            });
          });

          INITIAL_COMPLETED_CYCLES.forEach((cycle) => {
            const cycleRef = doc(collection(db, 'users', currentUser.uid, 'completedCycles'), cycle.id);
            batch.set(cycleRef, {
              ...cycle,
              userId: currentUser.uid,
              createdAt: new Date(cycle.startDate).toISOString()
            });
          });

          await batch.commit();
          setActiveTab('dashboard');
        } catch (err) {
          handleFirestoreError(err, OperationType.WRITE, `users/${currentUser.uid}`);
        }
      },
      'Restaurar',
      'Cancelar',
      'warning'
    );
  };

  const handleClearAllData = async () => {
    if (!currentUser) return;
    
    triggerConfirm(
      'Zerar Toda a sua Banca?',
      'Tem certeza de que deseja zerar TODA a sua banca? Essa ação apagará permanentemente todos os seus dados do banco de dados (redefinindo o saldo para R$ 0,00).',
      async () => {
        try {
          const batch = writeBatch(db);

          transactions.forEach((tx) => {
            batch.delete(doc(db, 'users', currentUser.uid, 'transactions', tx.id));
          });
          completedCycles.forEach((cycle) => {
            batch.delete(doc(db, 'users', currentUser.uid, 'completedCycles', cycle.id));
          });

          const userDocRef = doc(db, 'users', currentUser.uid);
          batch.update(userDocRef, {
            initialBalance: 0,
            presets: DEFAULT_PRESETS,
            activeCycle: null,
            updatedAt: new Date().toISOString()
          });

          await batch.commit();
          setActiveTab('settings');
        } catch (err) {
          handleFirestoreError(err, OperationType.WRITE, `users/${currentUser.uid}`);
        }
      },
      'Zerar Tudo',
      'Cancelar',
      'danger'
    );
  };

  // Active progression cycle state events
  const handleStartCycle = async () => {
    if (!currentUser) return;
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

    try {
      const userDocRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userDocRef, {
        activeCycle: freshCycle,
        updatedAt: new Date().toISOString()
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${currentUser.uid}`);
    }
  };

  const handleCancelActiveCycle = async () => {
    if (!currentUser) return;
    
    triggerConfirm(
      'Descartar Ciclo Ativo?',
      'Tem certeza de que deseja descartar este ciclo? Os dados não salvos deste ciclo ativo de 3 estágios serão apagados definitivamente.',
      async () => {
        try {
          const userDocRef = doc(db, 'users', currentUser.uid);
          await updateDoc(userDocRef, {
            activeCycle: null,
            updatedAt: new Date().toISOString()
          });
        } catch (err) {
          handleFirestoreError(err, OperationType.UPDATE, `users/${currentUser.uid}`);
        }
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
    if (!activeCycle || !currentUser) return;
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

    try {
      const batch = writeBatch(db);
      const userDocRef = doc(db, 'users', currentUser.uid);

      // Save dynamic transaction
      const txDocRef = doc(db, 'users', currentUser.uid, 'transactions', freshTxId);
      batch.set(txDocRef, {
        ...freshTx,
        userId: currentUser.uid,
        createdAt: new Date().toISOString()
      });

      if (isOverallWin) {
        // Complete current cycle as WIN state
        const updatedCycle: BettingCycle = {
          ...activeCycle,
          status: 'completed_win',
          currentStage: stageNum as 1 | 2 | 3,
          totalNetProfit: parseFloat(netResult.toFixed(2)),
          stages: updatedStages
        };

        const cycleDocRef = doc(db, 'users', currentUser.uid, 'completedCycles', activeCycle.id);
        batch.set(cycleDocRef, {
          ...updatedCycle,
          userId: currentUser.uid,
          createdAt: new Date().toISOString()
        });

        batch.update(userDocRef, {
          activeCycle: null,
          updatedAt: new Date().toISOString()
        });
      } else {
        if (stageNum === 1) {
          batch.update(userDocRef, {
            activeCycle: {
              ...activeCycle,
              currentStage: 2,
              stages: updatedStages
            },
            updatedAt: new Date().toISOString()
          });
        } 
        else if (stageNum === 2) {
          batch.update(userDocRef, {
            activeCycle: {
              ...activeCycle,
              currentStage: 3,
              stages: updatedStages
            },
            updatedAt: new Date().toISOString()
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

          const cycleDocRef = doc(db, 'users', currentUser.uid, 'completedCycles', activeCycle.id);
          batch.set(cycleDocRef, {
            ...updatedCycle,
            userId: currentUser.uid,
            createdAt: new Date().toISOString()
          });

          batch.update(userDocRef, {
            activeCycle: null,
            updatedAt: new Date().toISOString()
          });
        }
      }

      await batch.commit();
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `users/${currentUser.uid}`);
    }
  };

  const handleLogout = async () => {
    triggerConfirm(
      'Sair de sua Conta?',
      'Tem certeza de que deseja desconectar o seu acesso de Gestão do dispositivo atual?',
      async () => {
        await signOut(auth);
      },
      'Desconectar',
      'Cancelar',
      'info'
    );
  };

  // Rendering States
  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
        <Loader2 className="h-8 w-8 text-indigo-500 animate-spin mb-4" />
        <p className="text-slate-400 text-xs font-black uppercase tracking-widest animate-pulse">Sincronizando Banco de Dados...</p>
      </div>
    );
  }

  if (!currentUser) {
    return <AuthScreen />;
  }

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

          {/* Connected User Profile and Running Balance Widgets */}
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

            {/* Profile Info & Logout */}
            <div className="flex items-center space-x-2.5 border border-slate-800 bg-slate-950/40 pl-3 pr-2 py-1.5 rounded-2xl h-11">
              <div className="flex flex-col items-end">
                <span className="text-[9px] text-slate-500 font-extrabold uppercase tracking-wider">Conta Conectada</span>
                <span className="text-[11px] text-indigo-300 font-bold max-w-[120px] truncate">{currentUser.email}</span>
              </div>
              <button
                onClick={handleLogout}
                title="Sair da Conta"
                className="p-1.5 hover:bg-rose-500/10 text-slate-400 hover:text-rose-400 rounded-xl transition-all cursor-pointer"
              >
                <LogOut className="h-4 w-4" />
              </button>
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
