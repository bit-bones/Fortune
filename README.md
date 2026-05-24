# Fortune

Fortune is a canvas-style money and portfolio tracker built with React, TypeScript, and React Flow.

It gives you a visual board where you can map income sources, bank accounts, ETF or stock positions, and savings goals as draggable boxes. You can then connect those boxes with money-flow lines to show exactly where your cash is routed.

## Features

- Drag new boxes onto the canvas for income streams, bank accounts, ETF or stock positions, and goal buckets.
- Rearrange boxes freely to organize your wealth map visually.
- Draw flow lines between boxes to represent transfers and allocations.
- Edit names, tickers, balances, income amounts, cadence, and notes from the inspector panel.
- Edit recurring flow amounts and cadence for each connection.
- Start from a sample allocation map or clear the board and build your own.
- Keep changes automatically saved in local browser storage.

## Run locally

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Stack

- React 19
- TypeScript
- Vite
- @xyflow/react for the draggable canvas and money-flow connections
