import { startTransition, useEffect, useState, type DragEvent } from 'react'
import {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  applyEdgeChanges,
  applyNodeChanges,
  type Connection,
  type EdgeChange,
  type NodeChange,
  type ReactFlowInstance,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'

import FinanceNode from './FinanceNode'
import { FinanceNodeActionsContext } from './FinanceNodeContext'
import './App.css'

import {
  cadenceOptions,
  createFinanceNode,
  createInitialBoard,
  createMoneyEdge,
  defaultEdgeOptions,
  edgeLabel,
  formatCadence,
  formatCurrency,
  kindMeta,
  kindOptions,
  normalizeStoredBoard,
  storageKey,
  toMonthlyAmount,
  type FinanceNode as FinanceFlowNode,
  type MoneyEdge,
  type NodeKind,
  type StoredBoard,
} from './finance'

const nodeTypes = {
  finance: FinanceNode,
}

type Selection =
  | {
      kind: 'node'
      id: string
    }
  | {
      kind: 'edge'
      id: string
    }
  | null

function loadStoredBoard(): StoredBoard | null {
  if (typeof window === 'undefined') {
    return null
  }

  const raw = window.localStorage.getItem(storageKey)

  if (!raw) {
    return null
  }

  try {
    const parsed = JSON.parse(raw) as Partial<StoredBoard>

    if (!Array.isArray(parsed.nodes) || !Array.isArray(parsed.edges)) {
      return null
    }

    return normalizeStoredBoard({
      nodes: parsed.nodes as FinanceFlowNode[],
      edges: parsed.edges as MoneyEdge[],
    })
  } catch {
    return null
  }
}

function App() {
  return (
    <ReactFlowProvider>
      <FortuneBoard />
    </ReactFlowProvider>
  )
}

function FortuneBoard() {
  const [initialBoard] = useState<StoredBoard>(() => loadStoredBoard() ?? createInitialBoard())
  const [nodes, setNodes] = useState<FinanceFlowNode[]>(initialBoard.nodes)
  const [edges, setEdges] = useState<MoneyEdge[]>(initialBoard.edges)
  const [selection, setSelection] = useState<Selection>(null)
  const [flowInstance, setFlowInstance] = useState<
    ReactFlowInstance<FinanceFlowNode, MoneyEdge> | null
  >(null)

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    window.localStorage.setItem(storageKey, JSON.stringify({ nodes, edges }))
  }, [edges, nodes])

  const nodeLookup: Record<string, FinanceFlowNode> = {}
  for (const node of nodes) {
    nodeLookup[node.id] = node
  }

  const selectedNode =
    selection?.kind === 'node'
      ? nodes.find((node) => node.id === selection.id) ?? null
      : null

  const selectedEdge =
    selection?.kind === 'edge'
      ? edges.find((edge) => edge.id === selection.id) ?? null
      : null

  const trackedBalances = nodes.reduce((sum, node) => {
    if (node.data.kind === 'income') {
      return sum
    }

    return sum + node.data.amount
  }, 0)

  const monthlyIncome = nodes.reduce((sum, node) => {
    if (node.data.kind !== 'income') {
      return sum
    }

    return sum + toMonthlyAmount(node.data.amount, node.data.cadence)
  }, 0)

  const mappedIncome = edges.reduce((sum, edge) => {
    const sourceNode = nodeLookup[edge.source]

    if (!sourceNode || sourceNode.data.kind !== 'income') {
      return sum
    }

    return sum + toMonthlyAmount(edge.data.amount, edge.data.cadence)
  }, 0)

  const investmentFlow = edges.reduce((sum, edge) => {
    const targetNode = nodeLookup[edge.target]

    if (!targetNode || targetNode.data.kind !== 'investment') {
      return sum
    }

    return sum + toMonthlyAmount(edge.data.amount, edge.data.cadence)
  }, 0)

  const routingCoverage = monthlyIncome > 0 ? Math.round(mappedIncome / monthlyIncome * 100) : 0
  const routingBalance = monthlyIncome - mappedIncome

  const summaryCards = [
    {
      label: 'Tracked balances',
      value: formatCurrency(trackedBalances),
      note: `${nodes.filter((node) => node.data.kind !== 'income').length} destination boxes on the board`,
    },
    {
      label: 'Monthly inflow',
      value: formatCurrency(monthlyIncome),
      note: `${nodes.filter((node) => node.data.kind === 'income').length} income streams normalized to monthly`,
    },
    {
      label: 'Income routed',
      value: formatCurrency(mappedIncome),
      note:
        monthlyIncome > 0
          ? `${routingCoverage}% of inflow mapped${routingBalance >= 0 ? '' : ' and currently over-allocated'}`
          : 'Add an income stream to start routing money',
    },
    {
      label: 'To investments',
      value: formatCurrency(investmentFlow),
      note: 'Monthly equivalent landing in ETF or stock boxes',
    },
  ]

  function resolvePlacement(index: number) {
    const column = index % 3
    const row = Math.floor(index / 3)

    return {
      x: 140 + column * 320,
      y: 120 + row * 210,
    }
  }

  function addNode(kind: NodeKind, position?: { x: number; y: number }) {
    const nextNode = createFinanceNode(kind, position ?? resolvePlacement(nodes.length))

    startTransition(() => {
      setNodes((currentNodes) => currentNodes.concat(nextNode))
    })

    setSelection({ kind: 'node', id: nextNode.id })
  }

  function updateNode(nodeId: string, patch: Partial<FinanceFlowNode['data']>) {
    setNodes((currentNodes) =>
      currentNodes.map((node) =>
        node.id === nodeId
          ? {
              ...node,
              data: {
                ...node.data,
                ...patch,
              } as FinanceFlowNode['data'],
            }
          : node,
      ),
    )
  }

  function updateEdge(edgeId: string, patch: Partial<MoneyEdge['data']>) {
    setEdges((currentEdges) =>
      currentEdges.map((edge) => {
        if (edge.id !== edgeId) {
          return edge
        }

        const data = {
          ...edge.data,
          ...patch,
        } as MoneyEdge['data']

        return {
          ...edge,
          data,
          label: edgeLabel(data),
        }
      }),
    )
  }

  function removeNode(nodeId: string) {
    startTransition(() => {
      setNodes((currentNodes) => currentNodes.filter((node) => node.id !== nodeId))
      setEdges((currentEdges) =>
        currentEdges.filter((edge) => edge.source !== nodeId && edge.target !== nodeId),
      )
    })

    setSelection((currentSelection) =>
      currentSelection?.kind === 'node' && currentSelection.id === nodeId
        ? null
        : currentSelection,
    )
  }

  function removeEdge(edgeId: string) {
    startTransition(() => {
      setEdges((currentEdges) => currentEdges.filter((edge) => edge.id !== edgeId))
    })

    setSelection((currentSelection) =>
      currentSelection?.kind === 'edge' && currentSelection.id === edgeId
        ? null
        : currentSelection,
    )
  }

  function removeSelection() {
    if (!selection) {
      return
    }

    if (selection.kind === 'node') {
      removeNode(selection.id)
      return
    }

    removeEdge(selection.id)
  }

  function resetDemoBoard() {
    const nextBoard = createInitialBoard()

    startTransition(() => {
      setNodes(nextBoard.nodes)
      setEdges(nextBoard.edges)
    })

    setSelection(null)
  }

  function createBlankBoard() {
    startTransition(() => {
      setNodes([])
      setEdges([])
    })

    setSelection(null)
  }

  function handleNodesChange(changes: NodeChange<FinanceFlowNode>[]) {
    setNodes((currentNodes) => applyNodeChanges<FinanceFlowNode>(changes, currentNodes))
  }

  function handleEdgesChange(changes: EdgeChange<MoneyEdge>[]) {
    setEdges((currentEdges) => applyEdgeChanges<MoneyEdge>(changes, currentEdges))
  }

  function handleConnect(connection: Connection) {
    if (!connection.source || !connection.target) {
      return
    }

    const nextEdge = createMoneyEdge(connection)

    startTransition(() => {
      setEdges((currentEdges) => currentEdges.concat(nextEdge))
    })

    setSelection({ kind: 'edge', id: nextEdge.id })
  }

  function handlePaletteDragStart(event: DragEvent<HTMLButtonElement>, kind: NodeKind) {
    event.dataTransfer.setData('application/fortune-node', kind)
    event.dataTransfer.effectAllowed = 'move'
  }

  function handleCanvasDragOver(event: DragEvent<HTMLElement>) {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
  }

  function handleCanvasDrop(event: DragEvent<HTMLElement>) {
    event.preventDefault()

    const kind = event.dataTransfer.getData('application/fortune-node') as NodeKind

    if (!kind || !flowInstance) {
      return
    }

    addNode(
      kind,
      flowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      }),
    )
  }

  function parseAmount(value: string) {
    const parsed = Number(value)

    return Number.isFinite(parsed) ? parsed : 0
  }

  return (
    <FinanceNodeActionsContext.Provider
      value={{
        updateNode,
        removeNode,
      }}
    >
      <main className="fortune-app">
        <div className="fortune-shell">
          <aside className="panel sidebar">
          <div className="brand-block">
            <div className="brand-block__mark">F</div>
            <div>
              <p className="eyebrow">Fortune</p>
              <h2>Wealth canvas</h2>
            </div>
          </div>

          <p className="sidebar__lede">
            Build a living map of your cash, holdings, and recurring income. Drag boxes
            onto the board, then pull flow lines between them to show where money moves.
          </p>

          <div className="summary-grid">
            {summaryCards.map((card) => (
              <article key={card.label} className="summary-card">
                <span>{card.label}</span>
                <strong>{card.value}</strong>
                <small>{card.note}</small>
              </article>
            ))}
          </div>

          <section className="sidebar__section">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Node library</p>
                <h3>Drag or click to add</h3>
              </div>
              <span className="status-pill">Autosaves locally</span>
            </div>

            <div className="palette-grid">
              {kindOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={`palette-card palette-card--${option.value}`}
                  draggable
                  onClick={() => addNode(option.value)}
                  onDragStart={(event) => handlePaletteDragStart(event, option.value)}
                >
                  <span className="palette-card__eyebrow">{kindMeta[option.value].label}</span>
                  <strong>{option.label}</strong>
                  <span>{option.description}</span>
                </button>
              ))}
            </div>
          </section>

          <div className="action-row">
            <button type="button" className="ghost-button" onClick={createBlankBoard}>
              New blank board
            </button>
            <button type="button" className="solid-button" onClick={resetDemoBoard}>
              Restore sample
            </button>
          </div>

          <p className="sidebar__footnote">
            Tip: click a box to edit its name, ticker, amount, or delete it in place.
            Use the side inspector for notes, type changes, and flow details.
          </p>
          </aside>

          <section className="panel canvas-panel">
          <header className="canvas-panel__header">
            <div>
              <p className="eyebrow">Allocation workspace</p>
              <h1>Visualize every account, position, and income stream.</h1>
              <p className="canvas-panel__copy">
                Use the canvas like a financial whiteboard: drag boxes, pan around, and
                connect recurring flows so your allocation story is visible at a glance.
              </p>
            </div>

            <div className="legend-row">
              {kindOptions.map((option) => (
                <span key={option.value} className={`legend-pill legend-pill--${option.value}`}>
                  {option.label}
                </span>
              ))}
            </div>
          </header>

          <div
            className="canvas-panel__stage"
            onDragOver={handleCanvasDragOver}
            onDrop={handleCanvasDrop}
          >
            {nodes.length === 0 ? (
              <div className="empty-state">
                <p className="eyebrow">Empty canvas</p>
                <h3>Drag a box from the left rail to start mapping your money.</h3>
                <p>
                  Add income streams, bank accounts, ETF or stock positions, then connect
                  them with flows that show how cash moves across your portfolio.
                </p>
              </div>
            ) : null}

            <ReactFlow<FinanceFlowNode, MoneyEdge>
              nodes={nodes}
              edges={edges}
              nodeTypes={nodeTypes}
              defaultEdgeOptions={defaultEdgeOptions}
              onNodesChange={handleNodesChange}
              onEdgesChange={handleEdgesChange}
              onConnect={handleConnect}
              onInit={(instance) => setFlowInstance(instance)}
              onPaneClick={() => setSelection(null)}
              onNodeClick={(_, node) => setSelection({ kind: 'node', id: node.id })}
              onEdgeClick={(_, edge) => setSelection({ kind: 'edge', id: edge.id })}
              fitView
              fitViewOptions={{ padding: 0.18 }}
              minZoom={0.35}
              maxZoom={1.6}
              snapToGrid
              snapGrid={[16, 16]}
              className="fortune-flow"
            >
              <MiniMap
                nodeColor={(node) =>
                  kindMeta[(node.data as FinanceFlowNode['data']).kind].minimap
                }
                maskColor="rgba(243, 234, 215, 0.55)"
              />
              <Controls />
              <Background
                variant={BackgroundVariant.Dots}
                gap={24}
                size={1.4}
                color="rgba(23, 48, 71, 0.12)"
              />
            </ReactFlow>
          </div>
          </section>

          <aside className="panel inspector">
          {selectedNode ? (
            <div className="inspector__content">
              <div className="inspector__header">
                <div>
                  <p className="eyebrow">Selected box</p>
                  <h2>{selectedNode.data.title}</h2>
                </div>
                <span className={`legend-pill legend-pill--${selectedNode.data.kind}`}>
                  {kindMeta[selectedNode.data.kind].label}
                </span>
              </div>

              <p className="inspector__lede">
                Rename, relabel, change the amount, or delete this node directly on the
                canvas. This panel now keeps the slower-changing fields.
              </p>

              <div className="inspector__meta">
                <span>{selectedNode.data.symbol || kindMeta[selectedNode.data.kind].hint}</span>
                <span>{formatCurrency(selectedNode.data.amount)}</span>
              </div>

              <label className="field">
                <span>Type</span>
                <select
                  value={selectedNode.data.kind}
                  onChange={(event) =>
                    updateNode(selectedNode.id, {
                      kind: event.target.value as NodeKind,
                    })
                  }
                >
                  {kindOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="field">
                <span>Cadence</span>
                <select
                  value={selectedNode.data.cadence}
                  onChange={(event) =>
                    updateNode(selectedNode.id, {
                      cadence: event.target.value as FinanceFlowNode['data']['cadence'],
                    })
                  }
                >
                  {cadenceOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="field field--textarea">
                <span>Notes</span>
                <textarea
                  value={selectedNode.data.note}
                  placeholder="Why this box exists, target balance, strategy notes, or rules of thumb"
                  onChange={(event) =>
                    updateNode(selectedNode.id, {
                      note: event.target.value,
                    })
                  }
                />
              </label>

              <div className="inspector__meta">
                <span>{formatCurrency(selectedNode.data.amount)}</span>
                <span>{formatCadence(selectedNode.data.cadence)}</span>
              </div>
            </div>
          ) : selectedEdge ? (
            <div className="inspector__content">
              <div className="inspector__header">
                <div>
                  <p className="eyebrow">Selected flow</p>
                  <h2>
                    {(nodeLookup[selectedEdge.source]?.data.title ?? 'Source')} to{' '}
                    {(nodeLookup[selectedEdge.target]?.data.title ?? 'Target')}
                  </h2>
                </div>
                <span className="status-pill">Flow editor</span>
              </div>

              <label className="field">
                <span>Flow amount</span>
                <input
                  type="number"
                  step="25"
                  value={selectedEdge.data.amount}
                  onChange={(event) =>
                    updateEdge(selectedEdge.id, {
                      amount: parseAmount(event.target.value),
                    })
                  }
                />
              </label>

              <label className="field">
                <span>Flow cadence</span>
                <select
                  value={selectedEdge.data.cadence}
                  onChange={(event) =>
                    updateEdge(selectedEdge.id, {
                      cadence: event.target.value as MoneyEdge['data']['cadence'],
                    })
                  }
                >
                  {cadenceOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="field field--textarea">
                <span>Memo</span>
                <textarea
                  value={selectedEdge.data.memo}
                  placeholder="Describe the purpose of this transfer or contribution"
                  onChange={(event) =>
                    updateEdge(selectedEdge.id, {
                      memo: event.target.value,
                    })
                  }
                />
              </label>

              <div className="flow-preview">
                <span>Label shown on canvas</span>
                <strong>{edgeLabel(selectedEdge.data)}</strong>
              </div>

              <button type="button" className="danger-button" onClick={removeSelection}>
                Remove flow
              </button>
            </div>
          ) : (
            <div className="inspector__content inspector__content--empty">
              <p className="eyebrow">Inspector</p>
              <h2>Shape your allocation system.</h2>
              <p className="inspector__lede">
                Click a box to edit its title, label, amount, or delete it directly on the
                canvas. Select a flow line here when you need to tune routing details.
              </p>

              <ul className="instruction-list">
                <li>Drag a library tile into the canvas, or click one to quick-add it.</li>
                <li>Move boxes around until the flow feels readable.</li>
                <li>Click a box to edit it inline without leaving the canvas.</li>
                <li>Connect income to accounts, then accounts to ETFs, stocks, or goals.</li>
                <li>Edit each line with a dollar amount and cadence.</li>
                <li>Your board saves automatically in this browser.</li>
              </ul>
            </div>
          )}
          </aside>
        </div>
      </main>
    </FinanceNodeActionsContext.Provider>
  )
}

export default App
