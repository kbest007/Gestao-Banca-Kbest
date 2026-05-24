import React, { useState } from 'react';
import { Transaction, TransactionType } from '../types';
import { formatCurrency, formatDate, TRANSACTION_TYPE_LABELS } from '../utils';
import { PlusCircle, Search, Filter, Trash2 } from 'lucide-react';

interface TransactionsTabProps {
  transactions: Transaction[];
  onAddTransaction: (newTx: Omit<Transaction, 'id' | 'balanceAfter'>) => void;
  onDeleteTransaction: (id: string) => void;
}

export default function TransactionsTab({
  transactions,
  onAddTransaction,
  onDeleteTransaction,
}: TransactionsTabProps) {
  // Filters
  const [filterType, setFilterType] = useState<TransactionType | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Add Aporte / Saída Form States
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formType, setFormType] = useState<'deposit' | 'withdraw'>('deposit');
  const [formAmount, setFormAmount] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formDate, setFormDate] = useState(() => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(formAmount);
    if (isNaN(amt) || amt <= 0) return;

    onAddTransaction({
      type: formType,
      amount: amt,
      date: formDate,
      description: formDescription.trim() || (formType === 'deposit' ? 'Aporte Administrativo' : 'Saída Administrativa'),
    });

    // Reset Form
    setFormAmount('');
    setFormDescription('');
    setIsFormOpen(false);
  };

  // Filter Transactions logic
  const filteredTransactions = transactions.filter((tx) => {
    const matchesType = filterType === 'all' || tx.type === filterType;
    const matchesSearch = tx.description.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          tx.date.includes(searchTerm);
    return matchesType && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Title with Action Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Livro de Caixa & Movimentações</h2>
          <p className="text-sm text-slate-400 mt-1">
            Insira aportes e saídas ou filtre o histórico detalhado da sua banca ao longo do tempo.
          </p>
        </div>
        
        <button
          onClick={() => {
            setFormType('deposit');
            setIsFormOpen(!isFormOpen);
          }}
          className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all cursor-pointer shadow-md shadow-indigo-500/10 shrink-0"
        >
          <PlusCircle className="h-4.5 w-4.5" />
          Registrar Aporte / Saída
        </button>
      </div>

      {/* Add Transaction Form (Aporte & Saída) */}
      {isFormOpen && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 relative overflow-hidden transition-all animate-in fade-in slide-in-from-top-4 duration-200">
          <h3 className="text-sm font-bold uppercase tracking-wider text-white mb-4">
            Nova Movimentação Manual (Fluxo de Caixa)
          </h3>
          
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wide">
                Tipo de Fluxo
              </label>
              <select
                value={formType}
                onChange={(e) => setFormType(e.target.value as 'deposit' | 'withdraw')}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
              >
                <option value="deposit">Aporte (Depósito / Capital Semente)</option>
                <option value="withdraw">Saída (Saque / Retirada de Lucro)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wide">
                Valor (R$)
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                value={formAmount}
                onChange={(e) => setFormAmount(e.target.value)}
                placeholder="R$ 500,00"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wide">
                Data do Evento
              </label>
              <input
                type="date"
                required
                value={formDate}
                onChange={(e) => setFormDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wide">
                Descrição / Notas
              </label>
              <input
                type="text"
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="Aporte de capital, retirada de dividendos..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div className="md:col-span-4 flex items-center justify-end gap-3 pt-3 border-t border-slate-800/60 mt-2">
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shadow shadow-indigo-500/10"
              >
                Confirmar Lançamento
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Grid Filtering / Search bar */}
      <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Left: Quick search input */}
        <div className="relative w-full sm:w-auto sm:min-w-[280px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <input
            type="text"
            className="w-full bg-slate-950 border border-slate-800/80 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            placeholder="Buscar por descrição..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Right: Tab selectors */}
        <div className="flex items-center space-x-1 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer inline-flex items-center gap-1.5 border ${
              filterType === 'all'
                ? 'bg-slate-800 border-slate-700 text-white'
                : 'bg-transparent border-transparent text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <span>Todos</span>
          </button>
          
          <button
            onClick={() => setFilterType('deposit')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer inline-flex items-center gap-1.5 border ${
              filterType === 'deposit'
                ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400'
                : 'bg-transparent border-transparent text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>Aportes</span>
          </button>

          <button
            onClick={() => setFilterType('withdraw')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer inline-flex items-center gap-1.5 border ${
              filterType === 'withdraw'
                ? 'bg-amber-500/10 border-amber-500/25 text-amber-400'
                : 'bg-transparent border-transparent text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            <span>Saídas</span>
          </button>

          <button
            onClick={() => setFilterType('win')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer inline-flex items-center gap-1.5 border ${
              filterType === 'win'
                ? 'bg-green-500/10 border-green-500/25 text-green-400'
                : 'bg-transparent border-transparent text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
            <span>Greens</span>
          </button>

          <button
            onClick={() => setFilterType('loss')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer inline-flex items-center gap-1.5 border ${
              filterType === 'loss'
                ? 'bg-rose-500/10 border-rose-500/25 text-rose-400'
                : 'bg-transparent border-transparent text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
            <span>Reds</span>
          </button>
        </div>
      </div>

      {/* Main Transactions Table Card */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden backdrop-blur-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/40 select-none text-[10px] text-slate-400 uppercase font-black uppercase tracking-wider">
                <th className="py-4 px-6">Data</th>
                <th className="py-4 px-6">Tipo</th>
                <th className="py-4 px-6">Descrição da Transação</th>
                <th className="py-4 px-6 text-right">Valor</th>
                <th className="py-4 px-6 text-right">Saldo Resultante</th>
                <th className="py-4 px-6 text-center w-20">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-xs text-slate-500">
                    Nenhuma movimentação encontrada com os filtros atuais.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((tx) => {
                  const labelCfg = TRANSACTION_TYPE_LABELS[tx.type];
                  return (
                    <tr key={tx.id} className="hover:bg-slate-800/15 transition-colors text-xs text-slate-200">
                      {/* Date */}
                      <td className="py-3 px-6 font-mono text-slate-400">
                        {formatDate(tx.date)}
                      </td>
                      
                      {/* Badge Type */}
                      <td className="py-3 px-6">
                        <span className={`inline-flex items-center px-2 py-1 rounded-md text-[10px] font-bold uppercase border tracking-wider ${labelCfg.bg} ${labelCfg.text} ${labelCfg.border}`}>
                          {labelCfg.label}
                        </span>
                      </td>

                      {/* Description + optional Stage indicators */}
                      <td className="py-3 px-6 max-w-sm truncate text-slate-300">
                        <div className="flex items-center gap-2">
                          <span>{tx.description}</span>
                          {tx.stageNumber && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-950/80 border border-slate-800 text-indigo-400/80 font-mono">
                              Estágio {tx.stageNumber}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Amount */}
                      <td className={`py-3 px-6 text-right font-mono font-bold ${
                        tx.type === 'win' || tx.type === 'deposit' ? 'text-green-400' : 'text-rose-400'
                      }`}>
                        {tx.type === 'win' || tx.type === 'deposit' ? '+' : '-'} {formatCurrency(tx.amount)}
                      </td>

                      {/* Cumulative Balance After */}
                      <td className="py-3 px-6 text-right font-mono font-bold text-slate-100">
                        {formatCurrency(tx.balanceAfter)}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-6 text-center">
                        <button
                          onClick={() => onDeleteTransaction(tx.id)}
                          className="p-1 px-1.5 rounded hover:bg-rose-500/10 text-slate-500 hover:text-rose-400 transition-colors cursor-pointer inline-flex items-center justify-center"
                          title="Excluir Transação"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
