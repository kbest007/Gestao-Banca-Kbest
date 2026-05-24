import { TransactionType } from './types';

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

export function formatDate(dateString: string): string {
  if (!dateString) return '';
  const parts = dateString.split('-');
  if (parts.length === 3) {
    const [year, month, day] = parts;
    return `${day}/${month}/${year}`;
  }
  return dateString;
}

export const TRANSACTION_TYPE_LABELS: Record<TransactionType, { label: string; text: string; bg: string; border: string }> = {
  deposit: { label: 'Aporte (+)', text: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
  withdraw: { label: 'Saída (-)', text: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
  win: { label: 'Green (Venceu)', text: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/25' },
  loss: { label: 'Red (Perdeu)', text: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/25' },
};

export const STAGE_LABELS: Record<1 | 2 | 3, { label: string; suffix: string; colorClass: string; bgClass: string }> = {
  1: { label: '1ª Entrada', suffix: 'Estágio Inicial', colorClass: 'text-blue-400', bgClass: 'bg-blue-500/10' },
  2: { label: '2ª Entrada', suffix: 'Recuperação 1 (Gale 1)', colorClass: 'text-orange-400', bgClass: 'bg-orange-500/10' },
  3: { label: '3ª Entrada', suffix: 'Recuperação Máxima (Gale 2)', colorClass: 'text-red-400', bgClass: 'bg-red-500/10' },
};
