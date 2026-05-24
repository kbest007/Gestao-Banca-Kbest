import { Transaction, BettingCycle, OptionalOption } from './types';

export const DEFAULT_INITIAL_BALANCE = 0.00;

export const DEFAULT_PRESETS = {
  stage1Base: 100,
  stage1Protection: 60,
  stage2Base: 100,
  stage2Protection: 60,
  stage3Base: 200,
  stage3Protection: 60,
};

export function createDefaultOptions(): Record<string, OptionalOption> {
  return {
    '4x0': { name: '4x0', played: false, stake: 0, odds: 15.0, status: 'loss' },
    '0x4': { name: '0x4', played: false, stake: 0, odds: 15.0, status: 'loss' },
    '+5 Time': { name: '+5 Time', played: false, stake: 0, odds: 8.0, status: 'loss' },
    '5+ gols': { name: '5+ gols', played: false, stake: 0, odds: 6.0, status: 'loss' },
    '3x3': { name: '3x3', played: false, stake: 0, odds: 35.0, status: 'loss' },
    '3x2': { name: '3x2', played: false, stake: 0, odds: 20.0, status: 'loss' },
    '2x3': { name: '2x3', played: false, stake: 0, odds: 20.0, status: 'loss' },
  };
}

// Histórico de simulações realistas de apostas baseadas na estratégia descrita pelo usuário
export const INITIAL_TRANSACTIONS: Transaction[] = [
  // Ciclo 1 - Green direto no 1º Estágio (100 + 60), Odds 1.80 (ganhou a de 100, a proteção foi anulada ou devolvida)
  // Lucro líquido: 100 * 0.8 = R$ 80,00
  {
    id: 'tx_demo_1',
    type: 'win',
    amount: 80.00,
    balanceAfter: 5080.00,
    date: '2026-05-18',
    description: 'Green no Estágio 1 - Principal Venceu (Odds 1.80)',
    cycleId: 'cycle_demo_1',
    stageNumber: 1
  },
  
  // Ciclo 2 - Red no 1º Estágio (perdeu 160), mas Green no 2º Estágio (100 + 60, lucrou R$ 90, saldo líquido -160 + 90 = -70)
  // 1º Estágio (Perda de 100 + 60 = -160)
  {
    id: 'tx_demo_2a',
    type: 'loss',
    amount: 160.00,
    balanceAfter: 4920.00,
    date: '2026-05-19',
    description: 'Red no Estágio 1 (Recuperação iniciada) | Perda: R$ 160,00',
    cycleId: 'cycle_demo_2',
    stageNumber: 1
  },
  // 2º Estágio (Vitória, Lucro líquido de R$ 90,00, recuperando parte e adicionando saldo)
  {
    id: 'tx_demo_2b',
    type: 'win',
    amount: 90.00, // Ganho líquido da aposta
    balanceAfter: 5010.00,
    date: '2026-05-19',
    description: 'Green no Estágio 2 (Gale 1 completo) | Receita: R$ 90,00',
    cycleId: 'cycle_demo_2',
    stageNumber: 2
  },

  // Aporte extra de capital realizada pelo usuário
  {
    id: 'tx_demo_3',
    type: 'deposit',
    amount: 1500.00,
    balanceAfter: 6510.00,
    date: '2026-05-20',
    description: 'Aporte de Capital em Banca'
  },

  // Saída / Retirada / Saque realizado pelo usuário
  {
    id: 'tx_demo_5',
    type: 'withdraw',
    amount: 300.00,
    balanceAfter: 6210.00,
    date: '2026-05-22',
    description: 'Retirada / Saque parcial para lucro'
  },

  // Ciclo 4 - Green de 1º Estágio (100 + 60), lucrando R$ 90,00
  {
    id: 'tx_demo_6',
    type: 'win',
    amount: 90.00,
    balanceAfter: 6300.00,
    date: '2026-05-23',
    description: 'Green no Estágio 1 - Entrada Principal Venceu',
    cycleId: 'cycle_demo_4',
    stageNumber: 1
  }
];

export const INITIAL_COMPLETED_CYCLES: BettingCycle[] = [
  {
    id: 'cycle_demo_1',
    startDate: '2026-05-18',
    status: 'completed_win',
    currentStage: 1,
    totalNetProfit: 80.00,
    stages: {
      1: {
        stageNumber: 1,
        baseStake: 100,
        baseOdds: 1.80,
        baseStatus: 'win',
        protectionStake: 60,
        options: createDefaultOptions(),
        status: 'win',
        winAmount: 80.00,
        dateTime: '2026-05-18 16:00'
      },
      2: null,
      3: null
    }
  },
  {
    id: 'cycle_demo_2',
    startDate: '2026-05-19',
    status: 'completed_win',
    currentStage: 2,
    totalNetProfit: -70.00,
    stages: {
      1: {
        stageNumber: 1,
        baseStake: 100,
        baseOdds: 1.80,
        baseStatus: 'loss',
        protectionStake: 60,
        options: createDefaultOptions(),
        status: 'loss',
        winAmount: -160.00,
        dateTime: '2026-05-19 19:00'
      },
      2: {
        stageNumber: 2,
        baseStake: 100,
        baseOdds: 1.90,
        baseStatus: 'win',
        protectionStake: 60,
        options: createDefaultOptions(),
        status: 'win',
        winAmount: 90.00,
        dateTime: '2026-05-19 21:30'
      },
      3: null
    }
  }
];
