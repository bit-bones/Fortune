import type { PointerEvent } from 'react'

import { Handle, Position, type NodeProps } from '@xyflow/react'

import {
  formatNodeAmount,
  formatNodeMeta,
  type FinanceNode as FinanceFlowNode,
  kindMeta,
} from './finance'
import { useFinanceNodeActions } from './FinanceNodeContext'

function FinanceNode({ id, data, selected }: NodeProps<FinanceFlowNode>) {
  const { removeNode, updateNode } = useFinanceNodeActions()

  function stopCanvasEvent(event: PointerEvent<HTMLElement>) {
    event.stopPropagation()
  }

  function parseAmount(value: string) {
    const parsed = Number(value)

    return Number.isFinite(parsed) ? parsed : 0
  }

  return (
    <article
      className={`finance-node finance-node--${data.kind}${selected ? ' is-selected' : ''}`}
    >
      <Handle className="finance-node__handle" type="target" position={Position.Left} />

      <div className="finance-node__topline">
        <span className="finance-node__kind">{kindMeta[data.kind].label}</span>
        <span className="finance-node__metric">
          {selected ? 'Canvas edit' : data.kind === 'income' ? 'Live inflow' : 'Tracked value'}
        </span>
      </div>

      {selected ? (
        <div className="finance-node__inline-editor nodrag nowheel" onPointerDown={stopCanvasEvent}>
          <label className="finance-node__field">
            <span>Name</span>
            <input
              value={data.title}
              onChange={(event) =>
                updateNode(id, {
                  title: event.target.value,
                })
              }
            />
          </label>

          <label className="finance-node__field">
            <span>Ticker / label</span>
            <input
              value={data.symbol}
              placeholder={kindMeta[data.kind].hint}
              onChange={(event) =>
                updateNode(id, {
                  symbol: event.target.value,
                })
              }
            />
          </label>

          <label className="finance-node__field">
            <span>{data.kind === 'income' ? 'Inflow amount' : 'Tracked amount'}</span>
            <input
              type="number"
              step="50"
              value={data.amount}
              onChange={(event) =>
                updateNode(id, {
                  amount: parseAmount(event.target.value),
                })
              }
            />
          </label>

          <div className="finance-node__inline-footer">
            <span>{formatNodeAmount(data)}</span>
            <button
              type="button"
              className="finance-node__delete nodrag nowheel"
              onClick={() => removeNode(id)}
              onPointerDown={stopCanvasEvent}
            >
              Delete box
            </button>
          </div>
        </div>
      ) : (
        <>
          <h3>{data.title}</h3>
          <p className="finance-node__symbol">{data.symbol || kindMeta[data.kind].hint}</p>
          <p className="finance-node__amount">{formatNodeAmount(data)}</p>
        </>
      )}

      <div className="finance-node__footer">
        <span>{formatNodeMeta(data)}</span>
        <span>
          {selected ? 'Edits save instantly' : data.note ? 'Editable' : 'Needs context'}
        </span>
      </div>

      {data.note ? <p className="finance-node__note">{data.note}</p> : null}

      <Handle className="finance-node__handle" type="source" position={Position.Right} />
    </article>
  )
}

export default FinanceNode