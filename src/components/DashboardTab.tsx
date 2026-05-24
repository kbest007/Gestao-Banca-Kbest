import React, { useState, useMemo, useEffect } from 'react';
import { Transaction, BettingCycle, EntryStage, OptionalOption } from '../types';
import { formatCurrency, formatDate, STAGE_LABELS } from '../utils';
import { 
  TrendingUp, 
  TrendingDown, 
  ArrowUpRight, 
  ArrowDownRight, 
  Activity, 
  Trophy, 
  Percent, 
  Coins, 
  Play, 
  CheckCircle2, 
  XOctagon, 
  HelpCircle,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Filter,
  Search,
  Check,
  AlertTriangle,
  Info
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell
} from 'recharts';

interface DashboardTabProps {
  initialBalance: number;
  transactions: Transaction[];
  activeCycle: BettingCycle | null;
  completedCycles: BettingCycle[];
  presets: {
    stage1Base: number;
    stage1Protection: number;
    stage2Base: number;
    stage2Protection: number;
    stage3Base: number;
    stage3Protection: number;
  };
  onStartCycle: () => void;
  onRecordStageResult: (netResult: number, completedStage: EntryStage) => void;
  onCancelActiveCycle: () => void;
  onShowAlert?: (title: string, message: string) => void;
}

export default function DashboardTab({
  initialBalance,
  transactions,
  activeCycle,
  completedCycles,
  presets,
  onStartCycle,
  onRecordStageResult,
  onCancelActiveCycle,
  onShowAlert,
}: DashboardTabProps) {
  
  const triggerAlert = (title: string, message: string) => {
    if (onShowAlert) {
      onShowAlert(title, message);
    } else {
      alert(message);
    }
  };
  
  // Simulator input states for Main Entry
  const [baseStake, setBaseStake] = useState<number>(100);
  const [baseOdds, setBaseOdds] = useState<number>(1.80);
  const [baseStatus, setBaseStatus] = useState<'win' | 'loss'>('loss');
  const [protectionStake, setProtectionStake] = useState<number>(60);
  
  // The 7 specific football options with check boxes, stakes, odds, and status
  const [options, setOptions] = useState<Record<string, OptionalOption>>({
    '4x0': { name: '4x0', played: false, stake: 0, odds: 15.0, status: 'loss' },
    '0x4': { name: '0x4', played: false, stake: 0, odds: 15.0, status: 'loss' },
    '+5 Time': { name: '+5 Time', played: false, stake: 0, odds: 8.0, status: 'loss' },
    '5+ gols': { name: '5+ gols', played: false, stake: 0, odds: 6.0, status: 'loss' },
    '3x3': { name: '3x3', played: false, stake: 0, odds: 35.0, status: 'loss' },
    '3x2': { name: '3x2', played: false, stake: 0, odds: 20.0, status: 'loss' },
    '2x3': { name: '2x3', played: false, stake: 0, odds: 20.0, status: 'loss' },
  });

  // UI state for expandable cycle reports
  const [expandedCycleId, setExpandedCycleId] = useState<string | null>(null);
  
  // Filter states for reports
  const [filterStatus, setFilterStatus] = useState<'all' | 'completed_win' | 'completed_loss'>('all');
  const [filterOptionName, setFilterOptionName] = useState<string>('all');
  const [filterSearch, setFilterSearch] = useState<string>('');

  // Current active Stage specifications
  const activeStageConfig = useMemo(() => {
    if (!activeCycle) return null;
    const stageNum = activeCycle.currentStage;
    
    let base = presets.stage1Base;
    let prot = presets.stage1Protection;

    if (stageNum === 2) {
      base = presets.stage2Base;
      prot = presets.stage2Protection;
    } else if (stageNum === 3) {
      base = presets.stage3Base;
      prot = presets.stage3Protection;
    }

    return {
      stageNum,
      base,
      prot,
      totalRisk: base + prot
    };
  }, [activeCycle, presets]);

  // Load / Sync defaults whenever the current stage transitions
  useEffect(() => {
    if (activeStageConfig) {
      setBaseStake(activeStageConfig.base);
      setProtectionStake(activeStageConfig.prot);
      setBaseOdds(1.80);
      setBaseStatus('loss'); // default to loss to let them toggle happily
      
      setOptions({
        '4x0': { name: '4x0', played: false, stake: 0, odds: 15.0, status: 'loss' },
        '0x4': { name: '0x4', played: false, stake: 0, odds: 15.0, status: 'loss' },
        '+5 Time': { name: '+5 Time', played: false, stake: 0, odds: 8.0, status: 'loss' },
        '5+ gols': { name: '5+ gols', played: false, stake: 0, odds: 6.0, status: 'loss' },
        '3x3': { name: '3x3', played: false, stake: 0, odds: 35.0, status: 'loss' },
        '3x2': { name: '3x2', played: false, stake: 0, odds: 20.0, status: 'loss' },
        '2x3': { name: '2x3', played: false, stake: 0, odds: 20.0, status: 'loss' },
      });
    }
  }, [activeCycle?.currentStage, activeStageConfig]);

  // Derive Current Balance
  const currentBalance = useMemo(() => {
    if (transactions.length === 0) return initialBalance;
    return transactions[transactions.length - 1].balanceAfter;
  }, [initialBalance, transactions]);

  // Real-time dynamic math calculator for the current stage entries
  const liveCalc = useMemo(() => {
    const activeOptions = (Object.values(options) as OptionalOption[]).filter(o => o.played);
    const optionStakesSum = activeOptions.reduce((sum, o) => sum + o.stake, 0);

    // Sum of the invested capital
    const totalInvested = baseStake + protectionStake + optionStakesSum;

    // Sum of returned capital payouts
    const baseReturn = baseStatus === 'win' ? (baseStake * baseOdds) : 0;
    const optionReturnsSum = activeOptions
      .filter(o => o.status === 'win')
      .reduce((sum, o) => sum + (o.stake * o.odds), 0);

    const totalReturn = baseReturn + optionReturnsSum;
    const netResult = totalReturn - totalInvested;

    return {
      optionStakesSum,
      totalInvested,
      totalReturn,
      netResult
    };
  }, [baseStake, baseOdds, baseStatus, protectionStake, options]);

  // Helper to divide protectionStake equally among the active checked options
  const handleDistributeProtection = () => {
    const activeKeys = Object.keys(options).filter(k => options[k].played);
    if (activeKeys.length === 0) {
      triggerAlert('Aviso', 'Por favor, ative ao menos um opcional (marcando a caixinha) para distribuir o valor!');
      return;
    }

    if (protectionStake <= 0) {
      triggerAlert('Aviso', 'Insira um valor de proteção maior que R$ 0,00 para distribuir.');
      return;
    }

    const valuePerItem = parseFloat((protectionStake / activeKeys.length).toFixed(2));
    
    setOptions(prev => {
      const copy = { ...prev };
      Object.keys(copy).forEach(k => {
        if (copy[k].played) {
          copy[k].stake = valuePerItem;
        } else {
          copy[k].stake = 0;
        }
      });
      return copy;
    });

    // Reset standard protectionStake input to 0, since it's fully allocated
    setProtectionStake(0);
  };

  // Record active stage result and commit to transaction logs
  const handleRecordStage = () => {
    if (!activeStageConfig) return;

    if (baseStake <= 0) {
      triggerAlert('Aviso', 'Entrada Base deve ser maior que zero.');
      return;
    }

    // Verify played options values
    const playedOptions = (Object.values(options) as OptionalOption[]).filter(o => o.played);
    for (const opt of playedOptions) {
      if (opt.stake <= 0) {
        triggerAlert('Aviso', `Opcional "${opt.name}" está ativado mas a stake está zerada.`);
        return;
      }
      if (opt.odds <= 1.0) {
        triggerAlert('Aviso', `Opcional "${opt.name}" está ativado mas a odd deve ser maior que 1.00.`);
        return;
      }
    }

    const entryStageReport: EntryStage = {
      stageNumber: activeStageConfig.stageNum as 1 | 2 | 3,
      baseStake: baseStake,
      baseOdds: baseOdds,
      baseStatus: baseStatus,
      protectionStake: protectionStake,
      options: { ...options },
      status: liveCalc.netResult > 0 ? 'win' : 'loss',
      winAmount: liveCalc.netResult,
      dateTime: new Date().toLocaleDateString('pt-BR') + ' ' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    };

    onRecordStageResult(liveCalc.netResult, entryStageReport);
  };

  // Derived Statistics
  const stats = useMemo(() => {
    const wins = transactions.filter(t => t.type === 'win');
    const losses = transactions.filter(t => t.type === 'loss');
    const deposits = transactions.filter(t => t.type === 'deposit');
    const withdrawals = transactions.filter(t => t.type === 'withdraw');

    const totalDeposits = deposits.reduce((sum, t) => sum + t.amount, 0);
    const totalWithdrawals = withdrawals.reduce((sum, t) => sum + t.amount, 0);
    const totalEarned = wins.reduce((sum, t) => sum + t.amount, 0);
    const totalLost = losses.reduce((sum, t) => sum + t.amount, 0);

    const netProfit = totalEarned - totalLost;
    const totalRuns = wins.length + losses.length;
    const winRate = totalRuns > 0 ? (wins.length / totalRuns) * 100 : 0;

    let stage1Wins = 0;
    let stage2Wins = 0;
    let stage3Wins = 0;
    let fullRedLosses = 0;

    completedCycles.forEach(c => {
      if (c.status === 'completed_win') {
        if (c.stages[1]?.status === 'win') stage1Wins++;
        else if (c.stages[2]?.status === 'win') stage2Wins++;
        else if (c.stages[3]?.status === 'win') stage3Wins++;
      } else if (c.status === 'completed_loss') {
        fullRedLosses++;
      }
    });

    return {
      totalDeposits,
      totalWithdrawals,
      totalEarned,
      totalLost,
      netProfit,
      winRate,
      totalRuns,
      roi: totalRuns > 0 ? (netProfit / (totalRuns * 160)) * 100 : 0, // approximate stake risk ratio
      stageWins: [
        { name: '1ª Entrada', value: stage1Wins, color: '#3b82f6' },
        { name: '2ª Entrada', value: stage2Wins, color: '#f97316' },
        { name: '3ª Entrada', value: stage3Wins, color: '#ef4444' },
        { name: 'Red Completo', value: fullRedLosses, color: '#64748b' }
      ]
    };
  }, [transactions, completedCycles]);

  // Chart data preparing - Bankroll growth curve
  const chartData = useMemo(() => {
    const data = [{ name: 'Início', saldo: initialBalance, label: 'Capital Inicial' }];
    let current = initialBalance;
    
    const sorted = [...transactions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    sorted.forEach((tx, idx) => {
      const label = tx.description.length > 25 ? tx.description.substring(0, 22) + '...' : tx.description;
      data.push({
        name: `M${idx + 1}`,
        saldo: tx.balanceAfter,
        label: `${formatDate(tx.date)}: ${label}`
      });
    });
    return data;
  }, [initialBalance, transactions]);

  // Filter completed cycles for Section 3 Report module
  const filteredCycles = useMemo(() => {
    return completedCycles.filter(c => {
      // 1. Filter by Status
      if (filterStatus !== 'all' && c.status !== filterStatus) return false;

      // 2. Filter by Option played or won
      if (filterOptionName !== 'all') {
        let hasOptionPlayed = false;
        // Check if option was played in any of the stages
        for (const s of [1, 2, 3]) {
          const stage = c.stages[s as 1 | 2 | 3];
          if (stage && stage.options && stage.options[filterOptionName]?.played) {
            hasOptionPlayed = true;
            break;
          }
        }
        if (!hasOptionPlayed) return false;
      }

      // 3. Search text
      if (filterSearch.trim()) {
        const needle = filterSearch.toLowerCase();
        const matchesId = c.id.toLowerCase().includes(needle);
        const matchesDate = c.startDate.includes(needle);
        return matchesId || matchesDate;
      }

      return true;
    });
  }, [completedCycles, filterStatus, filterOptionName, filterSearch]);

  return (
    <div className="space-y-6">
      
      {/* 4 Cards: Metric KPIs dashboard */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 select-none">
        
        {/* Card 1: Balance Card */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 relative overflow-hidden backdrop-blur-sm">
          <div className="absolute top-0 right-0 w-16 h-16 bg-blue-500/5 rounded-full filter blur-lg" />
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] text-slate-400 uppercase font-black tracking-wider">Saldo em Caixa</span>
            <span className="p-1 px-2 rounded-md bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-[10px] font-bold font-mono">
              BRL (R$)
            </span>
          </div>
          <div className="text-2xl font-black font-mono tracking-tight text-white mt-1">
            {formatCurrency(currentBalance)}
          </div>
          <div className="text-[10px] text-slate-500 mt-2 flex items-center gap-1.5 font-medium">
            <Coins className="h-3.5 w-3.5 text-slate-400" />
            Banca Inicial: <span className="font-mono font-bold text-slate-300">{formatCurrency(initialBalance)}</span>
          </div>
        </div>

        {/* Card 2: Net profit */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 relative overflow-hidden backdrop-blur-sm">
          <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-emerald-500/5 to-teal-500/5 rounded-full filter blur-lg" />
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] text-slate-400 uppercase font-black tracking-wider">Lucro Operacional Líquido</span>
            <span className={`p-1 px-1.5 rounded-full ${stats.netProfit >= 0 ? 'bg-emerald-500/10' : 'bg-rose-500/10'}`}>
              {stats.netProfit >= 0 ? (
                <ArrowUpRight className="h-3 w-3 text-emerald-400" />
              ) : (
                <ArrowDownRight className="h-3 w-3 text-rose-400" />
              )}
            </span>
          </div>
          <div className={`text-2xl font-black font-mono tracking-tight mt-1 ${stats.netProfit >= 0 ? 'text-green-400' : 'text-rose-400'}`}>
            {stats.netProfit >= 0 ? '+' : ''}{formatCurrency(stats.netProfit)}
          </div>
          <div className="text-[10px] text-slate-500 mt-2 flex items-center gap-1 font-medium">
            <span className="text-slate-400 uppercase font-bold">Total Green:</span>
            <span className="font-mono text-green-400 font-bold">{formatCurrency(stats.totalEarned)}</span>
            <span className="text-slate-600">/</span>
            <span className="text-slate-400 uppercase font-bold">Red:</span>
            <span className="font-mono text-rose-400 font-bold">{formatCurrency(stats.totalLost)}</span>
          </div>
        </div>

        {/* Card 3: Win Rate Accuracy */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 relative overflow-hidden backdrop-blur-sm">
          <div className="absolute top-0 right-0 w-16 h-16 bg-orange-500/5 rounded-full filter blur-lg" />
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] text-slate-400 uppercase font-black tracking-wider">Taxa de Acerto</span>
            <span className="p-1 px-2 rounded-md bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-bold">
              Eficácia
            </span>
          </div>
          <div className="text-2xl font-black font-mono tracking-tight text-white mt-1 flex items-baseline gap-1">
            {stats.winRate.toFixed(1)}<span className="text-xs text-indigo-400 font-medium">%</span>
          </div>
          <div className="text-[10px] text-slate-500 mt-2 flex items-center gap-1 font-medium">
            <Trophy className="h-3.5 w-3.5 text-indigo-400" />
            Operações Feitas: <span className="font-mono font-bold text-slate-300">{stats.totalRuns} gales</span>
          </div>
        </div>

        {/* Card 4: Box for Cashflows */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 relative overflow-hidden backdrop-blur-sm">
          <div className="absolute top-0 right-0 w-16 h-16 bg-indigo-500/5 rounded-full filter blur-lg" />
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] text-slate-400 uppercase font-black tracking-wider">Fluxos de Caixa</span>
            <span className="p-1 px-2 rounded-md bg-slate-800 border border-slate-700 text-slate-300 text-[10px] font-bold">
              Histórico
            </span>
          </div>
          <div className="text-sm font-black font-mono text-white mt-2 space-y-1">
            <div className="flex justify-between items-center">
              <span className="text-slate-500 font-medium text-[10px] uppercase">Aportes:</span>
              <span className="text-emerald-400">+{formatCurrency(stats.totalDeposits)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500 font-medium text-[10px] uppercase">Saídas:</span>
              <span className="text-amber-400">-{formatCurrency(stats.totalWithdrawals)}</span>
            </div>
          </div>
        </div>

      </div>

      {/* Main operational row: Cycle progress and evolution chart */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Side (7 cols): MAIN CYCLE SIMULATOR ENGINE */}
        <div className="lg:col-span-12 xl:col-span-8 space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 relative overflow-hidden backdrop-blur-sm shadow-xl shadow-slate-950/40">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/[0.02] rounded-full filter blur-2xl pointer-events-none" />
            
            {/* Engine Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5 mb-5">
              <div className="flex items-center gap-3">
                <span className="p-2.5 bg-gradient-to-tr from-indigo-500 to-blue-600 rounded-2xl text-white shadow shadow-indigo-500/20">
                  <Activity className="h-5 w-5 animate-pulse" />
                </span>
                <div>
                  <h3 className="text-base font-black text-white">Simulador de Ciclo de Gestão</h3>
                  <p className="text-[11px] text-slate-400 font-medium">Controle de Entradas Progressivas com Cobertura Opcional no Placar</p>
                </div>
              </div>

              {activeCycle && (
                <button
                  onClick={onCancelActiveCycle}
                  className="px-3 py-1.5 rounded-xl border border-slate-800 text-[10px] font-bold text-slate-400 hover:text-rose-400 hover:border-rose-500/25 hover:bg-rose-500/5 transition-all cursor-pointer"
                >
                  Cancelar Ciclo
                </button>
              )}
            </div>

            {/* Cycle Status Layout */}
            {!activeCycle ? (
              // Case A: No active cycle, ready to start!
              <div className="text-center py-10 space-y-4">
                <div className="w-16 h-16 rounded-full bg-slate-950/80 border border-slate-800 flex items-center justify-center mx-auto shadow-inner">
                  <Play className="h-6 w-6 text-indigo-400 fill-indigo-400 ml-1 translate-x-[1px]" />
                </div>
                <div className="max-w-md mx-auto space-y-1">
                  <h4 className="text-sm font-bold text-slate-200">Sem Ciclo Ativo de Operações</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Clique abaixo para iniciar uma nova sequência. O simulador guiará você nas 3 fases de resgate com cobertura automática para placar e gols.
                  </p>
                </div>
                <button
                  onClick={onStartCycle}
                  className="bg-indigo-600 hover:bg-indigo-500 hover:shadow-lg hover:shadow-indigo-500/10 text-white px-6 py-3 rounded-2xl text-sm font-black transition-all cursor-pointer inline-flex items-center gap-2"
                >
                  <Sparkles className="h-4 w-4" />
                  Iniciar Novo Ciclo de Operação
                </button>
              </div>
            ) : (
              // Case B: Active cycle editor
              <div className="space-y-6">
                
                {/* Visual Step Indicator (Progress of 3 steps) */}
                <div className="bg-slate-950/40 border border-slate-800/80 rounded-2xl p-4.5">
                  <span className="text-[9px] text-slate-500 uppercase font-black block tracking-widest mb-3 text-center">Progresso do Ciclo Ativo</span>
                  
                  <div className="grid grid-cols-3 gap-3 relative z-10">
                    {[1, 2, 3].map((s) => {
                      const isPast = s < activeCycle.currentStage;
                      const isCurrent = s === activeCycle.currentStage;
                      const isFuture = s > activeCycle.currentStage;

                      let title = "1ª Entrada";
                      let presetBase = presets.stage1Base;
                      let presetProt = presets.stage1Protection;
                      if (s === 2) {
                        title = "2ª Entrada (G1)";
                        presetBase = presets.stage2Base;
                        presetProt = presets.stage2Protection;
                      } else if (s === 3) {
                        title = "3ª Entrada (G2)";
                        presetBase = presets.stage3Base;
                        presetProt = presets.stage3Protection;
                      }

                      return (
                        <div 
                          key={s} 
                          className={`flex flex-col items-center p-3 rounded-xl border text-center transition-all ${
                            isCurrent 
                              ? 'bg-indigo-500/10 border-indigo-500 text-slate-100 ring-1 ring-indigo-500/30 font-bold scale-[1.02]' 
                              : isPast 
                                ? 'bg-rose-500/[0.03] border-rose-950/40 text-rose-500/50 line-through' 
                                : 'bg-slate-950/20 border-slate-900/80 text-slate-500 font-medium'
                          }`}
                        >
                          <span className={`text-[10px] tracking-tight uppercase ${isCurrent ? 'text-indigo-400 font-bold' : ''}`}>
                            {title}
                          </span>
                          <span className="text-[11px] font-mono mt-1 block font-bold">
                            R$ {presetBase} + {presetProt}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* MAIN ENTRY STAGE PANEL */}
                {activeStageConfig && (
                  <div className="bg-slate-950 border border-slate-800 rounded-3xl p-5 space-y-6">
                    
                    {/* Header Values Overview inside Stage */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-900 pb-4">
                      <div>
                        <span className="text-[9px] text-slate-500 uppercase font-black tracking-widest block">Nível do Ciclo</span>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className={`${STAGE_LABELS[activeStageConfig.stageNum as 1|2|3].colorClass} text-base font-black`}>
                            {STAGE_LABELS[activeStageConfig.stageNum as 1|2|3].label}
                          </span>
                          <span className="text-slate-400 font-medium text-xs">
                            ({STAGE_LABELS[activeStageConfig.stageNum as 1|2|3].suffix})
                          </span>
                        </div>
                      </div>

                      <div className="text-center sm:text-right">
                        <span className="text-[9px] text-slate-500 uppercase font-black tracking-widest block">Total Alocado no Cupom</span>
                        <span className="text-sm font-mono font-black text-white">
                          {formatCurrency(liveCalc.totalInvested)} 
                        </span>
                      </div>
                    </div>

                    {/* Standard Inputs for Base and Protection Stakes */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-slate-900/20 p-4 rounded-2xl border border-slate-900">
                      
                      {/* Entrada Principal Base Stake */}
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1.5">Entrada Principal (R$)</label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-mono text-slate-500 font-bold">R$</span>
                          <input
                            type="number"
                            value={baseStake}
                            onChange={(e) => setBaseStake(parseFloat(e.target.value) || 0)}
                            className="w-full bg-slate-950 border border-slate-800 focus:outline-none focus:border-indigo-500 rounded-xl pl-8 pr-3 py-2 text-xs font-mono text-slate-200"
                          />
                        </div>
                      </div>

                      {/* Entrada Principal Base Odds */}
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1.5">Odds Inicial</label>
                        <input
                          type="number"
                          step="0.01"
                          min="1.01"
                          value={baseOdds}
                          onChange={(e) => setBaseOdds(parseFloat(e.target.value) || 1.80)}
                          className="w-full bg-slate-950 border border-slate-800 focus:outline-none focus:border-indigo-500 rounded-xl px-3 py-2 text-xs font-mono text-slate-200 text-center"
                        />
                      </div>

                      {/* Entrada Principal Base Status Selector */}
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1.5">Resultado Principal</label>
                        <div className="grid grid-cols-2 gap-1 bg-slate-950 p-1 rounded-xl border border-slate-900">
                          <button
                            type="button"
                            onClick={() => setBaseStatus('win')}
                            className={`py-1 text-[10px] font-black rounded-lg transition-all ${
                              baseStatus === 'win' 
                                ? 'bg-green-500 text-slate-950 shadow shadow-green-500/10' 
                                : 'text-slate-400 hover:text-slate-200'
                            }`}
                          >
                            GREEN
                          </button>
                          <button
                            type="button"
                            onClick={() => setBaseStatus('loss')}
                            className={`py-1 text-[10px] font-black rounded-lg transition-all ${
                              baseStatus === 'loss' 
                                ? 'bg-rose-500/20 text-rose-400 shadow shadow-rose-550/10' 
                                : 'text-slate-400 hover:text-slate-200'
                            }`}
                          >
                            RED
                          </button>
                        </div>
                      </div>

                      {/* Generic Protection Pool Input */}
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1.5">
                          Proteção Livre/Avulsa (R$)
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-mono text-slate-500 font-bold">R$</span>
                          <input
                            type="number"
                            value={protectionStake}
                            onChange={(e) => setProtectionStake(parseFloat(e.target.value) || 0)}
                            className="w-full bg-slate-950 border border-slate-800 focus:outline-none focus:border-indigo-500 rounded-xl pl-8 pr-3 py-2 text-xs font-mono text-slate-200"
                            placeholder="60.00"
                          />
                        </div>
                      </div>

                    </div>

                    {/* Helper to distribute protection stake to the checkboxes optionals */}
                    {protectionStake > 0 && (
                      <div className="flex items-center justify-between bg-indigo-500/5 hover:bg-indigo-500/10 border border-indigo-500/15 rounded-xl p-3 text-xs transition-colors py-2.5">
                        <span className="text-indigo-300 font-medium flex items-center gap-1.5">
                          <Info className="h-4 w-4 shrink-0" />
                          Você possui <strong className="font-mono text-white">R$ {protectionStake.toFixed(2)}</strong> de proteção livre.
                        </span>
                        <button
                          type="button"
                          onClick={handleDistributeProtection}
                          className="bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold px-3 py-1.5 rounded-lg text-[10px] transition-all flex items-center gap-1.5 cursor-pointer shadow shadow-indigo-600/15"
                        >
                          Distribuir igualmente para Opcionais
                        </button>
                      </div>
                    )}

                    {/* THE 7 SPECIFIC DETAILED OPTIONAL OPTIONS GRID */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between select-none">
                        <h4 className="text-[11px] uppercase tracking-widest font-black text-indigo-400">
                          Cobertura de Proteção: 7 Mercados Opcionais de Placar / Gols
                        </h4>
                        <span className="text-[9px] text-slate-500 font-mono font-bold">
                          Total Opcionais Joagados: R$ {liveCalc.optionStakesSum.toFixed(2)}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
                        {Object.keys(options).map((key) => {
                          const option = options[key];
                          return (
                            <div 
                              key={key} 
                              className={`rounded-2xl border p-3.5 transition-all relative ${
                                option.played
                                  ? option.status === 'win'
                                    ? 'bg-green-950/20 border-green-500/50 shadow shadow-green-500/5'
                                    : 'bg-indigo-950/15 border-indigo-500/50 shadow shadow-indigo-500/5'
                                  : 'bg-slate-950/40 border-slate-900 opacity-60 hover:opacity-85'
                              }`}
                            >
                              {/* Top Bar inside Card */}
                              <div className="flex items-center justify-between mb-2">
                                <label className="flex items-center space-x-2 cursor-pointer select-none">
                                  <input 
                                    type="checkbox"
                                    checked={option.played}
                                    onChange={(e) => {
                                      setOptions(prev => ({
                                        ...prev,
                                        [key]: {
                                          ...prev[key],
                                          played: e.target.checked,
                                          // reset stake to 0 when unchecking to prevent calculations errors
                                          stake: e.target.checked ? prev[key].stake || 10 : 0
                                        }
                                      }));
                                    }}
                                    className="rounded border-slate-800 text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5 bg-slate-900 cursor-pointer"
                                  />
                                  <span className="text-xs font-black text-white">{option.name}</span>
                                </label>

                                {option.played && (
                                  <div className="flex gap-1 bg-slate-900/80 p-0.5 rounded-lg border border-slate-800/85 scale-90">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setOptions(prev => ({
                                          ...prev,
                                          [key]: { ...prev[key], status: 'win' }
                                        }));
                                      }}
                                      className={`px-1.5 py-0.5 text-[9px] font-black rounded ${
                                        option.status === 'win' 
                                          ? 'bg-green-500 text-slate-950 font-black' 
                                          : 'text-slate-400'
                                      }`}
                                    >
                                      GREEN
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setOptions(prev => ({
                                          ...prev,
                                          [key]: { ...prev[key], status: 'loss' }
                                        }));
                                      }}
                                      className={`px-1.5 py-0.5 text-[9px] font-black rounded ${
                                        option.status === 'loss' 
                                          ? 'bg-rose-500/20 text-rose-400 font-bold' 
                                          : 'text-slate-400'
                                      }`}
                                    >
                                      RED
                                    </button>
                                  </div>
                                )}
                              </div>

                              {/* Card values grid */}
                              <div className="grid grid-cols-2 gap-2 pt-1">
                                <div>
                                  <span className="block text-[8px] uppercase font-bold text-slate-500 mb-0.5">Stake Cobertura</span>
                                  <div className="relative">
                                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[8px] text-slate-600 font-mono">R$</span>
                                    <input
                                      type="number"
                                      disabled={!option.played}
                                      value={option.played ? option.stake : ''}
                                      onChange={(e) => {
                                        const val = parseFloat(e.target.value) || 0;
                                        setOptions(prev => ({
                                          ...prev,
                                          [key]: { ...prev[key], stake: val }
                                        }));
                                      }}
                                      placeholder="0.00"
                                      className="w-full bg-slate-900/60 disabled:opacity-40 border border-slate-850 focus:outline-none focus:border-indigo-500 rounded-lg pl-5 pr-1.5 py-1 text-[11px] font-mono text-slate-200"
                                    />
                                  </div>
                                </div>

                                <div>
                                  <span className="block text-[8px] uppercase font-bold text-slate-500 mb-0.5">Odds Cobertura</span>
                                  <input
                                    type="number"
                                    disabled={!option.played}
                                    value={option.played ? option.odds : ''}
                                    onChange={(e) => {
                                      const val = parseFloat(e.target.value) || 0;
                                      setOptions(prev => ({
                                        ...prev,
                                        [key]: { ...prev[key], odds: val }
                                      }));
                                    }}
                                    placeholder="15.0"
                                    className="w-full bg-slate-900/60 disabled:opacity-40 border border-slate-850 focus:outline-none focus:border-indigo-500 rounded-lg px-2 py-1 text-[11px] font-mono text-slate-200 text-center"
                                  />
                                </div>
                              </div>

                              {/* Live return preview per optional */}
                              {option.played && (
                                <div className="text-[9px] text-right font-mono text-slate-500 mt-2">
                                  Payout: {option.status === 'win' ? (
                                    <span className="text-green-400 font-bold">
                                      +R$ {(option.stake * option.odds).toFixed(2)}
                                    </span>
                                  ) : (
                                    <span className="text-slate-400">
                                      Perda: -R$ {option.stake.toFixed(2)}
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* DETAILED DYNAMIC GENERAL CALCULATION MATH BOARD */}
                    <div className="bg-slate-950 p-5 rounded-2xl border border-slate-850/60 space-y-3 relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/[0.01] rounded-full filter blur-xl pointer-events-none" />
                      
                      <h4 className="text-xs uppercase font-black tracking-widest text-slate-400">
                        Painel de Cálculo Geral e Resultado Consolidado
                      </h4>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono py-2 bg-slate-900/40 px-4 rounded-xl border border-slate-900">
                        <div>
                          <span className="text-slate-500 uppercase block font-semibold text-[10px]">Custo Operacional Total</span>
                          <span className="text-white text-sm font-black font-mono">
                            {formatCurrency(liveCalc.totalInvested)}
                            <span className="text-[10px] text-slate-400 font-sans block mt-0.5">
                              ({baseStake} base + {protectionStake} prot. + {liveCalc.optionStakesSum} opcionais)
                            </span>
                          </span>
                        </div>

                        <div>
                          <span className="text-slate-500 uppercase block font-semibold text-[10px]">Retorno Total Obtido</span>
                          <span className="text-white text-sm font-black font-mono">
                            {formatCurrency(liveCalc.totalReturn)}
                            <span className="text-[10px] text-slate-400 font-sans block mt-0.5">
                              ({baseStatus === 'win' ? formatCurrency(baseStake * baseOdds) : 'R$ 0,00'} principal + {formatCurrency((Object.values(options) as OptionalOption[]).filter(o => o.played && o.status === 'win').reduce((sum, o) => sum + (o.stake * o.odds), 0))} opcionais)
                            </span>
                          </span>
                        </div>

                        <div>
                          <span className="text-slate-500 uppercase block font-semibold text-[10px]">Resultado Líquido</span>
                          <span className={`text-base font-black font-mono block ${
                            liveCalc.netResult > 0 ? 'text-green-400' : 'text-rose-400'
                          }`}>
                            {liveCalc.netResult > 0 ? '+' : ''}{formatCurrency(liveCalc.netResult)}
                            <span className="text-[10px] uppercase font-sans block mt-0.5 font-black">
                              {liveCalc.netResult > 0 ? '🟢 GREEN (Lucrativo)' : '🔴 RED (Prejuízo)'}
                            </span>
                          </span>
                        </div>
                      </div>

                      {/* Final Submit action button */}
                      <button
                        type="button"
                        onClick={handleRecordStage}
                        className={`w-full py-3.5 rounded-2xl text-xs font-black transition-all cursor-pointer shadow-lg flex items-center justify-center gap-2 ${
                          liveCalc.netResult > 0 
                            ? 'bg-gradient-to-tr from-green-500 to-emerald-600 text-slate-950 font-black hover:opacity-90 shadow-emerald-500/10'
                            : 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/10'
                        }`}
                      >
                        <CheckCircle2 className="h-4.5 w-4.5 shrink-0" />
                        Salvar e Registrar Resultado Geral do Estágio ({liveCalc.netResult > 0 ? 'Concluir Ciclo no Green' : 'Avançar Nível ou Fechar Ciclo'})
                      </button>

                    </div>

                  </div>
                )}

              </div>
            )}

          </div>

          {/* HISTORICAL EVOLUTION CHART */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 relative overflow-hidden backdrop-blur-sm shadow-xl">
            <h3 className="text-sm font-bold uppercase tracking-wider text-white mb-1.5 flex items-center justify-between">
              <span>Evolução do Saldo da Banca (R$)</span>
              <TrendingUp className="h-4 w-4 text-indigo-400 font-bold" />
            </h3>
            <p className="text-xs text-slate-400 mb-6 font-medium">Curva financeira de capital resultante após cada aposta, aporte ou retirada.</p>

            <div className="h-[260px] w-full font-mono text-[9px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={chartData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorSaldo" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vert={false} />
                  <XAxis 
                    dataKey="name" 
                    stroke="#475569" 
                    tickLine={false} 
                  />
                  <YAxis 
                    stroke="#475569" 
                    tickLine={false} 
                    axisLine={false}
                    tickFormatter={(v) => `R$ ${v}`}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }}
                    labelStyle={{ color: '#94a3b8', fontWeight: 'bold' }}
                    itemStyle={{ color: '#fff' }}
                    formatter={(value: any, name: any, props: any) => [formatCurrency(Number(value)), "Saldo"]}
                    labelFormatter={(label, items) => {
                      if (items[0] && items[0].payload) {
                        return items[0].payload.label || label;
                      }
                      return label;
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="saldo" 
                    stroke="#6366f1" 
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill="url(#colorSaldo)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>

        {/* Right Side (5 cols): SIGNAL PLACEMENTS stats & OPERATIONAL MANUAL */}
        <div className="lg:col-span-12 xl:col-span-4 space-y-6">
          
          {/* STATS BREAKDOWN CHART: ACCURACY BY STAGES */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 relative overflow-hidden backdrop-blur-sm shadow-xl">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200 mb-5 flex items-center justify-between">
              <span>Distribuição de Sucesso de Sinais</span>
              <Activity className="h-4 w-4 text-emerald-400" />
            </h3>

            <div className="h-[200px] w-full font-mono text-[9px] mb-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={stats.stageWins}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vert={false} />
                  <XAxis dataKey="name" stroke="#475569" tickLine={false} />
                  <YAxis stroke="#475569" tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '10px' }}
                    itemStyle={{ color: '#fff' }}
                    formatter={(v) => [v, "Vezes alcançado"]}
                  />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                    {stats.stageWins.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Stage legend stats display */}
            <div className="space-y-2 border-t border-slate-850 pt-4">
              {stats.stageWins.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs text-slate-300 font-medium font-sans">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="font-semibold">{item.name}</span>
                  </div>
                  <span className="font-mono text-xs font-black text-white">{item.value} ciclos</span>
                </div>
              ))}
            </div>
          </div>

          {/* SIMULATOR GUIDE BRIEF */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 relative overflow-hidden backdrop-blur-sm flex flex-col justify-between">
            <div className="absolute top-0 left-0 w-32 h-32 bg-blue-500/[0.01] rounded-full filter blur-xl pointer-events-none" />
            
            <div className="space-y-4 font-sans">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
                <Info className="h-4.5 w-4.5 text-indigo-400" />
                Regras de Cobertura de Placar
              </h3>

              <div className="space-y-3.5 text-xs text-slate-400 leading-relaxed font-medium">
                <div className="flex gap-2.5">
                  <span className="p-1 px-2 h-fit bg-slate-950 text-indigo-400 font-mono text-center rounded-lg font-bold">1</span>
                  <p>
                    A <strong>Entrada Principal</strong> é o seu palpite principal (ex: odds de 1.80). Ela desconta a Stake Base do saldo de banca.
                  </p>
                </div>

                <div className="flex gap-2.5">
                  <span className="p-1 px-2 h-fit bg-slate-950 text-indigo-400 font-mono text-center rounded-lg font-bold">2</span>
                  <p>
                    Você pode alocar o valor de proteção padrão (R$ 60,00) de maneira livre ou dividida equitativamente entre os <strong>7 opcionais</strong> listados.
                  </p>
                </div>

                <div className="flex gap-2.5">
                  <span className="p-1 px-2 h-fit bg-slate-950 text-indigo-400 font-mono text-center rounded-lg font-bold">3</span>
                  <p>
                    Diga se cada entrada ou cobertura foi <strong>GREEN</strong> ou <strong>RED</strong>. O sistema calcula a soma líquida exata e consolida automaticamente.
                  </p>
                </div>

                <div className="flex gap-2.5">
                  <span className="p-1 px-2 h-fit bg-slate-950 text-indigo-400 font-mono text-center rounded-lg font-bold">4</span>
                  <p>
                    <strong>Gale Seguro</strong>: Se o estágio anterior gerou prejuízo líquido, o simulador avança salvando os logs detalhados para os relatórios automáticos.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 p-3 bg-indigo-500/5 rounded-2xl border border-indigo-500/15 flex gap-2.5 items-start">
              <AlertTriangle className="h-4.5 w-4.5 text-indigo-400 shrink-0 mt-0.5" />
              <p className="text-[10px] text-indigo-300 leading-relaxed font-sans font-medium">
                <strong>Análise de Relatórios</strong>: Filtre todos os ciclos resolvidos abaixo para descobrir qual cobertura (como 4x0 ou 3x3) está salvando mais a sua estratégia!
              </p>
            </div>
          </div>

        </div>

      </div>

      {/* SECTION 3: REAL-TIME FILTERABLE REPORTS & HISTORICAL DATABASE */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 relative overflow-hidden backdrop-blur-sm shadow-2xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/[0.01] rounded-full filter blur-3xl pointer-events-none" />
        
        {/* Reports Header */}
        <div className="border-b border-slate-800 pb-5 mb-5 flex flex-col md:flex-row md:items-center justify-between gap-4 font-sans">
          <div>
            <h3 className="text-base font-black text-white flex items-center gap-2">
              <Trophy className="h-5 w-5 text-indigo-400" />
              Relatórios Detalhados de Ciclos & Coberturas
            </h3>
            <p className="text-xs text-slate-400 font-medium">Base de dados unificada com filtros avançados para auditar e otimizar entradas de placar.</p>
          </div>

          <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-900 text-xs font-mono font-bold text-slate-400 self-start">
            <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
            <span>Encontrados: {filteredCycles.length} de {completedCycles.length} ciclos</span>
          </div>
        </div>

        {/* Filter Toolbar Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6 font-sans select-none">
          
          {/* Filter Status */}
          <div>
            <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1.5">Filtro por Desempenho</label>
            <div className="relative">
              <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white focus:outline-none cursor-pointer"
              >
                <option value="all">Sinal Geral (Todos)</option>
                <option value="completed_win">Ciclos Vitoriosos (Green Final)</option>
                <option value="completed_loss">Ciclos Abatidos (Stop Loss hit)</option>
              </select>
            </div>
          </div>

          {/* Filter Cover Options */}
          <div>
            <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1.5">Filtro por Cobertura Opcional</label>
            <div className="relative">
              <Percent className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500 animate-spin-slow" />
              <select
                value={filterOptionName}
                onChange={(e) => setFilterOptionName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white focus:outline-none cursor-pointer"
              >
                <option value="all">Opcionais (Buscando Todos)</option>
                <option value="4x0">Apenas com Cobertura "4x0" activa</option>
                <option value="0x4">Apenas com Cobertura "0x4" activa</option>
                <option value="+5 Time">Apenas com Cobertura "+5 Time" activa</option>
                <option value="5+ gols">Apenas com Cobertura "5+ gols" activa</option>
                <option value="3x3">Apenas com Cobertura "3x3" activa</option>
                <option value="3x2">Apenas com Cobertura "3x2" activa</option>
                <option value="2x3">Apenas com Cobertura "2x3" activa</option>
              </select>
            </div>
          </div>

          {/* Search text input */}
          <div className="sm:col-span-2">
            <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1.5">Busca Inteligente</label>
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
              <input
                type="text"
                value={filterSearch}
                onChange={(e) => setFilterSearch(e.target.value)}
                placeholder="Busque por identificação (ex: cycle_de...) ou data (ex: 2026)..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none"
              />
            </div>
          </div>

        </div>

        {/* Database List of Completed Cycles */}
        <div className="space-y-4">
          {filteredCycles.length === 0 ? (
            <div className="text-center py-12 border border-slate-800/60 rounded-2xl bg-slate-950/20 text-slate-400 text-xs font-sans">
              <HelpCircle className="h-8 w-8 text-slate-600 mx-auto mb-2.5" />
              Nenhum ciclo simulado corresponde aos filtros solicitados nas consultas.
            </div>
          ) : (
            filteredCycles.map((c) => {
              const isWin = c.status === 'completed_win';
              const isExpanded = expandedCycleId === c.id;
              
              // Find first completed stage inside stages
              const availableStages = Object.keys(c.stages)
                .map(Number)
                .filter(s => c.stages[s as 1|2|3] !== null);

              const lastStagePlayed = Math.max(...availableStages) as 1 | 2 | 3;
              const netResultValue = isWin ? (c.totalNetProfit || 0) : -(c.totalLoss || 0);

              return (
                <div 
                  key={c.id}
                  className={`border rounded-2xl overflow-hidden transition-all duration-200 ${
                    isExpanded 
                      ? 'border-slate-700 bg-slate-900/40 shadow-lg' 
                      : 'border-slate-850 bg-slate-950/20 hover:bg-slate-900/10'
                  }`}
                >
                  {/* Row Header clickable trigger */}
                  <div 
                    onClick={() => setExpandedCycleId(isExpanded ? null : c.id)}
                    className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer select-none font-sans"
                  >
                    <div className="flex flex-wrap items-center gap-3">
                      {/* Badge Icon */}
                      <span className={`p-2 rounded-xl shrink-0 ${
                        isWin ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-450 text-rose-400'
                      }`}>
                        <Trophy className="h-4.5 w-4.5" />
                      </span>
                      
                      {/* Name / ID */}
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-extrabold text-slate-200 uppercase tracking-tight">CICLO DE OPERAÇÃO</span>
                          <span className="text-[10px] font-mono text-slate-500 font-bold">#{c.id}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 mt-1 font-medium font-mono">
                          Início: {formatDate(c.startDate)} • Finalizado no Estágio {lastStagePlayed}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between md:justify-end gap-6">
                      {/* Profit and loss overview values */}
                      <div className="text-right">
                        <span className="text-[9px] uppercase font-bold text-slate-500 block mb-0.5">Retorno Consolidado</span>
                        <span className={`text-sm font-mono font-black ${
                          isWin ? 'text-green-400' : 'text-rose-400'
                        }`}>
                          {isWin ? '+' : ''}{formatCurrency(netResultValue)}
                        </span>
                      </div>

                      {/* Chevron Toggle */}
                      <span className="p-1 px-2 rounded-lg bg-slate-950 border border-slate-900 hover:text-white text-slate-400 transition-colors">
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </span>
                    </div>

                  </div>

                  {/* Expanding detailed sections of each of the 3 stages */}
                  {isExpanded && (
                    <div className="border-t border-slate-800 bg-slate-950 p-5 space-y-5 animate-in fade-in slide-in-from-top-1.5 duration-200">
                      
                      <div className="flex items-center gap-1.5 text-[10px] uppercase font-black tracking-wider text-slate-500 border-b border-slate-900 pb-2">
                        <Info className="h-3.5 w-3.5 text-indigo-400" />
                        <span>Resumo Cronológico das Fases Interiores</span>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                        {[1, 2, 3].map((s) => {
                          const stage = c.stages[s as 1 | 2 | 3];
                          if (!stage) {
                            return (
                              <div key={s} className="border border-slate-900 bg-slate-950/20 rounded-2xl p-4 flex flex-col justify-center items-center text-center text-slate-600 italic text-[11px] min-h-[160px] font-sans">
                                <span>Estágio {s} não alcançado</span>
                                <span className="text-[9px] text-slate-750 font-normal font-sans mt-1">O ciclo foi encerrado com sucesso antes.</span>
                              </div>
                            );
                          }

                          const mainGainVal = stage.baseStatus === 'win' ? (stage.baseStake * stage.baseOdds) : 0;
                          
                          // Sum return on options
                                                     const optPlayed = (Object.values(stage.options || {}) as OptionalOption[]).filter(op => op.played);
                          const optReturnVal = optPlayed
                            .filter(op => op.status === 'win')
                            .reduce((sum, op) => sum + (op.stake * op.odds), 0);

                          const optInvestedSum = optPlayed.reduce((sum, op) => sum + op.stake, 0);
                          const sTotalInvested = stage.baseStake + (stage.protectionStake || 0) + optInvestedSum;

                          return (
                            <div key={s} className="border border-slate-850 bg-slate-900/20 rounded-2xl p-4 space-y-4 font-sans text-xs">
                              
                              {/* Stage number label header */}
                              <div className="flex items-center justify-between border-b border-slate-900 pb-2">
                                <span className="font-extrabold text-slate-200 uppercase tracking-wide">
                                  {s === 1 ? '1ª Entrada' : s === 2 ? '2ª Entrada' : '3ª Entrada'}
                                </span>
                                <span className={`p-1 px-2 font-black rounded text-[9px] tracking-wider uppercase ${
                                  (stage.winAmount || 0) > 0 
                                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                                    : 'bg-rose-500/15 text-rose-400 border border-rose-500/20'
                                }`}>
                                  {(stage.winAmount || 0) > 0 ? 'GREEN FASE' : 'RED FASE'}
                                </span>
                              </div>

                              {/* Operations summary values details */}
                              <div className="space-y-1.5 font-mono text-[11px] text-slate-300">
                                <div className="flex justify-between">
                                  <span className="text-slate-500 font-sans">Entrada Base Principal:</span>
                                  <span className="text-slate-100 font-bold">R$ {stage.baseStake.toFixed(2)} @ {stage.baseOdds.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-slate-500 font-sans">Resultado Principal:</span>
                                  <span className={stage.baseStatus === 'win' ? 'text-green-400 font-bold' : 'text-rose-450 text-rose-400'}>
                                    {stage.baseStatus === 'win' ? 'GREEN' : 'RED'} ({formatCurrency(mainGainVal)})
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-slate-500 font-sans">Proteção Avulsa:</span>
                                  <span className="text-slate-400">R$ {(stage.protectionStake || 0).toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between border-t border-slate-900 pt-1.5 text-slate-200">
                                  <span className="text-slate-500 font-sans font-bold">Total Alocado no Cupom:</span>
                                  <span className="font-bold">{formatCurrency(sTotalInvested)}</span>
                                </div>
                              </div>

                              {/* Played options covers list rendering */}
                              <div className="space-y-2 border-t border-slate-900 pt-2">
                                <span className="block text-[9px] uppercase font-black tracking-wider text-indigo-400 mb-1">
                                  Coberturas Opcionais Ativadas
                                </span>

                                {optPlayed.length === 0 ? (
                                  <span className="block text-slate-600 text-[10px] italic">
                                    Nenhum dos 7 opcionais foi jogado nesta fase.
                                  </span>
                                ) : (
                                  <div className="space-y-1.5 font-mono text-[10px]">
                                    {optPlayed.map((op, idx) => {
                                      const opGain = op.status === 'win' ? (op.stake * op.odds) : 0;
                                      return (
                                        <div key={idx} className="flex items-center justify-between bg-slate-950/60 p-1.5 rounded-lg border border-slate-900/80">
                                          <div className="flex items-center gap-1.5">
                                            <span className="font-extrabold text-white">{op.name}</span>
                                            <span className="text-slate-500">R${op.stake.toFixed(0)} @ {op.odds.toFixed(1)}</span>
                                          </div>
                                          <span className={op.status === 'win' ? 'text-green-400 font-bold' : 'text-slate-500'}>
                                            {op.status === 'win' ? `GREEN (+${formatCurrency(opGain)})` : 'RED'}
                                          </span>
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>

                              {/* Stage summary calculations footer */}
                              <div className="border-t border-slate-900 pt-2 flex items-center justify-between text-xs font-mono font-bold">
                                <span className="text-slate-500 font-sans">Resultado Líquido Fase:</span>
                                <span className={stage.winAmount && stage.winAmount > 0 ? 'text-green-400' : 'text-rose-400'}>
                                  {stage.winAmount && stage.winAmount > 0 ? '+' : ''}
                                  {formatCurrency(stage.winAmount || 0)}
                                </span>
                              </div>

                            </div>
                          );
                        })}
                      </div>

                    </div>
                  )}

                </div>
              );
            })
          )}
        </div>

      </div>

    </div>
  );
}
