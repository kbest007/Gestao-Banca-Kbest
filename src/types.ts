export type TransactionType = 'deposit' | 'withdraw' | 'win' | 'loss';

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;       // Quantidade da transação
  balanceAfter: number; // Saldo após a transação
  date: string;         // Data (Format YYYY-MM-DD ou DD/MM/YYYY)
  description: string;  // Descrição do movimento
  cycleId?: string;     // ID do ciclo vinculado
  stageNumber?: 1 | 2 | 3; // Estágio de entrada vinculado
}

export interface OptionalOption {
  name: string;
  played: boolean;
  stake: number;
  odds: number;
  status: 'win' | 'loss';
}

export interface EntryStage {
  stageNumber: 1 | 2 | 3;
  baseStake: number;       // Entrada base, ex: 100 no 1º, 100 no 2º, 200 no 3º
  baseOdds: number;        // Odds da entrada base
  baseStatus: 'win' | 'loss'; // Status da entrada principal (venceu ou perdeu)
  protectionStake: number; // Valor sobressalente da proteção (pode ser zerado ou alterado)
  options: Record<string, OptionalOption>; // As 7 opções adicionais de placar/mercado
  status: 'pending' | 'win' | 'loss';
  winAmount?: number;      // Resultado financeiro total deste estágio (lucro ou prejuízo líquido)
  dateTime?: string;       // Data/Hora opcional do registro
}

export interface BettingCycle {
  id: string;
  startDate: string;
  status: 'active' | 'completed_win' | 'completed_loss';
  currentStage: 1 | 2 | 3;
  stages: Record<1 | 2 | 3, EntryStage | null>;
  totalLoss?: number;      // Total perdido se o ciclo der red no estágio 3
  totalNetProfit?: number; // Lucro líquido final se ganho em algum estágio
}

export interface BankrollState {
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
}
