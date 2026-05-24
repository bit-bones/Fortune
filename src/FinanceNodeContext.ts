import { createContext, useContext } from 'react'

import type { FinanceNode as FinanceFlowNode } from './finance'

export interface FinanceNodeActions {
  updateNode: (nodeId: string, patch: Partial<FinanceFlowNode['data']>) => void
  removeNode: (nodeId: string) => void
}

export const FinanceNodeActionsContext = createContext<FinanceNodeActions | null>(null)

export function useFinanceNodeActions(): FinanceNodeActions {
  const context = useContext(FinanceNodeActionsContext)

  if (!context) {
    throw new Error('Finance node actions are unavailable outside the board context.')
  }

  return context
}