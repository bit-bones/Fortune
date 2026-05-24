import {
  MarkerType,
  type Connection,
  type DefaultEdgeOptions,
  type Edge,
  type Node,
} from '@xyflow/react'

export type NodeKind = 'income' | 'account' | 'investment' | 'goal'

export type FlowCadence =
  | 'weekly'
  | 'biweekly'
  | 'monthly'
  | 'quarterly'
  | 'annual'

export interface FinanceNodeData extends Record<string, unknown> {
  kind: NodeKind
  title: string
  symbol: string
  amount: number
  cadence: FlowCadence
  note: string
}

export interface MoneyEdgeData extends Record<string, unknown> {
  amount: number
  cadence: FlowCadence
  memo: string
}

export type FinanceNode = Node<FinanceNodeData, 'finance'>
export type MoneyEdge = Edge<MoneyEdgeData> & {
  data: MoneyEdgeData
}

export interface StoredBoard {
  nodes: FinanceNode[]
  edges: MoneyEdge[]
}

export const storageKey = 'fortune-board-v1'

export const kindMeta: Record<
  NodeKind,
  {
    label: string
    hint: string
    accent: string
    minimap: string
  }
> = {
  income: {
    label: 'Income stream',
    hint: 'Salary, freelance, rent, or dividends',
    accent: '#0b8b7b',
    minimap: '#3eb7a7',
  },
  account: {
    label: 'Bank account',
    hint: 'Checking, HYSA, or spending buffer',
    accent: '#1e6091',
    minimap: '#4f96ca',
  },
  investment: {
    label: 'ETF / stock',
    hint: 'Brokerage, retirement, ETF, or stock',
    accent: '#c46d1a',
    minimap: '#eda55f',
  },
  goal: {
    label: 'Goal bucket',
    hint: 'Emergency fund, tax bucket, or purchase goal',
    accent: '#bf4b5a',
    minimap: '#e57b88',
  },
}

export const kindOptions = [
  {
    value: 'income',
    label: 'Income Stream',
    description: 'Map a paycheck, freelance work, or another inflow source.',
  },
  {
    value: 'account',
    label: 'Bank Account',
    description: 'Track cash in checking, savings, or a cash management account.',
  },
  {
    value: 'investment',
    label: 'ETF / Stock',
    description: 'Visualize holdings, brokerages, retirement accounts, or tickers.',
  },
  {
    value: 'goal',
    label: 'Goal Bucket',
    description: 'Set aside a destination for taxes, emergencies, or future spending.',
  },
] as const satisfies Array<{
  value: NodeKind
  label: string
  description: string
}>

export const cadenceOptions = [
  { value: 'weekly', label: 'Weekly' },
  { value: 'biweekly', label: 'Biweekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'annual', label: 'Annual' },
] as const satisfies Array<{ value: FlowCadence; label: string }>

export const defaultEdgeOptions: DefaultEdgeOptions = {
  type: 'smoothstep',
  animated: true,
  markerEnd: {
    type: MarkerType.ArrowClosed,
    color: '#23415b',
    width: 20,
    height: 20,
  },
  style: {
    stroke: '#23415b',
    strokeWidth: 2.4,
  },
  labelStyle: {
    fill: '#23415b',
    fontSize: 12,
    fontWeight: 800,
    letterSpacing: '0.05em',
  },
  labelBgStyle: {
    fill: '#fffaf2',
    stroke: 'rgba(35, 65, 91, 0.14)',
    strokeWidth: 1,
  },
  labelBgPadding: [10, 6],
  labelBgBorderRadius: 999,
}

const formatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
})

const cadenceLabel: Record<FlowCadence, string> = {
  weekly: 'weekly',
  biweekly: 'biweekly',
  monthly: 'monthly',
  quarterly: 'quarterly',
  annual: 'annual',
}

const cadenceUnit: Record<FlowCadence, string> = {
  weekly: 'week',
  biweekly: '2 weeks',
  monthly: 'month',
  quarterly: 'quarter',
  annual: 'year',
}

interface FinanceNodeTemplate {
  title: string
  symbol: string
  amount: number
  cadence: FlowCadence
  note: string
}

const nodeTemplates: Record<NodeKind, FinanceNodeTemplate> = {
  income: {
    title: 'Income Stream',
    symbol: 'Primary salary',
    amount: 5400,
    cadence: 'monthly',
    note: 'Net dollars available to route into accounts and investments.',
  },
  account: {
    title: 'Bank Account',
    symbol: 'Checking or savings',
    amount: 12000,
    cadence: 'monthly',
    note: 'Use this for liquid cash, spending buffers, or reserves.',
  },
  investment: {
    title: 'ETF / Stock',
    symbol: 'VTI',
    amount: 24000,
    cadence: 'monthly',
    note: 'Track a holding, brokerage account, or retirement sleeve.',
  },
  goal: {
    title: 'Goal Bucket',
    symbol: 'Emergency fund',
    amount: 15000,
    cadence: 'monthly',
    note: 'Reserve money for a specific target or planned expense.',
  },
}

const seedBoard: StoredBoard = {
  nodes: [
    buildSeedNode('job-pay', 'income', { x: 70, y: 90 }, {
      title: 'Primary Job',
      symbol: 'Product salary',
      amount: 6200,
      cadence: 'monthly',
      note: 'Main take-home pay that kicks off the monthly allocation plan.',
    }),
    buildSeedNode('check-main', 'account', { x: 450, y: 40 }, {
      title: 'Checking',
      symbol: 'Bills and daily spend',
      amount: 8600,
      cadence: 'monthly',
      note: 'Operational cash for bills, subscriptions, and short-term float.',
    }),
    buildSeedNode('save-hysa', 'account', { x: 450, y: 300 }, {
      title: 'High-Yield Savings',
      symbol: 'Emergency reserve',
      amount: 24000,
      cadence: 'monthly',
      note: 'Cash reserve parked for safety and near-term optionality.',
    }),
    buildSeedNode('broker-main', 'investment', { x: 830, y: 40 }, {
      title: 'Brokerage',
      symbol: 'Taxable investing',
      amount: 185000,
      cadence: 'monthly',
      note: 'Main investing lane for long-term wealth accumulation.',
    }),
    buildSeedNode('vti-core', 'investment', { x: 1160, y: 40 }, {
      title: 'VTI',
      symbol: 'US total market ETF',
      amount: 126000,
      cadence: 'monthly',
      note: 'Core market exposure inside the taxable portfolio.',
    }),
    buildSeedNode('goal-emergency', 'goal', { x: 830, y: 310 }, {
      title: 'Emergency Fund',
      symbol: '12 months runway',
      amount: 15000,
      cadence: 'monthly',
      note: 'Dedicated buffer for layoffs, repairs, or unexpected shocks.',
    }),
    buildSeedNode('free-side', 'income', { x: 70, y: 360 }, {
      title: 'Consulting',
      symbol: 'Side income',
      amount: 1600,
      cadence: 'monthly',
      note: 'Variable side work routed straight into reserves and investing.',
    }),
  ],
  edges: [
    buildSeedEdge('job-pay', 'check-main', 4800, 'monthly', 'Cash for bills and core spending'),
    buildSeedEdge('job-pay', 'broker-main', 1100, 'monthly', 'Automated investing transfer'),
    buildSeedEdge('free-side', 'save-hysa', 900, 'monthly', 'Side income builds safety margin'),
    buildSeedEdge('free-side', 'broker-main', 500, 'monthly', 'Overflow income into long-term assets'),
    buildSeedEdge('check-main', 'goal-emergency', 700, 'monthly', 'Intentional reserve contribution'),
    buildSeedEdge('broker-main', 'vti-core', 1500, 'monthly', 'Core ETF purchase cadence'),
  ],
}

export function formatCurrency(value: number): string {
  return formatter.format(value)
}

export function formatCadence(cadence: FlowCadence): string {
  return cadenceLabel[cadence]
}

export function formatNodeAmount(data: FinanceNodeData): string {
  if (data.kind === 'income') {
    return `${formatCurrency(data.amount)} / ${cadenceUnit[data.cadence]}`
  }

  return formatCurrency(data.amount)
}

export function formatNodeMeta(data: FinanceNodeData): string {
  switch (data.kind) {
    case 'income':
      return `Paid ${formatCadence(data.cadence)}`
    case 'account':
      return `Cash lane · ${formatCadence(data.cadence)} review`
    case 'investment':
      return `Contribution cadence · ${formatCadence(data.cadence)}`
    case 'goal':
      return `Funding cadence · ${formatCadence(data.cadence)}`
  }
}

export function edgeLabel(data: MoneyEdgeData): string {
  if (data.amount <= 0) {
    return 'Set flow'
  }

  return `${formatCurrency(data.amount)} / ${cadenceUnit[data.cadence]}`
}

export function toMonthlyAmount(value: number, cadence: FlowCadence): number {
  switch (cadence) {
    case 'weekly':
      return value * 52 / 12
    case 'biweekly':
      return value * 26 / 12
    case 'monthly':
      return value
    case 'quarterly':
      return value / 3
    case 'annual':
      return value / 12
  }
}

export function createFinanceNode(
  kind: NodeKind,
  position: { x: number; y: number },
): FinanceNode {
  const template = nodeTemplates[kind]

  return {
    id: crypto.randomUUID(),
    type: 'finance',
    position,
    data: {
      kind,
      title: template.title,
      symbol: template.symbol,
      amount: template.amount,
      cadence: template.cadence,
      note: template.note,
    },
  }
}

export function createMoneyEdge(connection: Connection): MoneyEdge {
  if (!connection.source || !connection.target) {
    throw new Error('Money edges require both a source and a target node.')
  }

  const data: MoneyEdgeData = {
    amount: 0,
    cadence: 'monthly',
    memo: '',
  }

  return {
    id: crypto.randomUUID(),
    source: connection.source,
    target: connection.target,
    sourceHandle: connection.sourceHandle ?? undefined,
    targetHandle: connection.targetHandle ?? undefined,
    data,
    label: edgeLabel(data),
  }
}

export function normalizeStoredBoard(board: StoredBoard): StoredBoard {
  return {
    nodes: board.nodes.map((node) => ({
      ...node,
      type: 'finance',
      data: {
        kind: node.data?.kind ?? 'account',
        title: node.data?.title ?? 'Untitled box',
        symbol: node.data?.symbol ?? '',
        amount: node.data?.amount ?? 0,
        cadence: node.data?.cadence ?? 'monthly',
        note: node.data?.note ?? '',
      },
    })),
    edges: board.edges.map((edge) => {
      const data: MoneyEdgeData = {
        amount: edge.data?.amount ?? 0,
        cadence: edge.data?.cadence ?? 'monthly',
        memo: edge.data?.memo ?? '',
      }

      return {
        ...edge,
        data,
        label: edgeLabel(data),
      }
    }),
  }
}

export function createInitialBoard(): StoredBoard {
  return normalizeStoredBoard(seedBoard)
}

function buildSeedNode(
  id: string,
  kind: NodeKind,
  position: { x: number; y: number },
  data: FinanceNodeTemplate,
): FinanceNode {
  return {
    id,
    type: 'finance',
    position,
    data: {
      kind,
      title: data.title,
      symbol: data.symbol,
      amount: data.amount,
      cadence: data.cadence,
      note: data.note,
    },
  }
}

function buildSeedEdge(
  source: string,
  target: string,
  amount: number,
  cadence: FlowCadence,
  memo: string,
): MoneyEdge {
  const data: MoneyEdgeData = {
    amount,
    cadence,
    memo,
  }

  return {
    id: `${source}-${target}-${amount}`,
    source,
    target,
    data,
    label: edgeLabel(data),
  }
}