# MuleGuard AI

MuleGuard AI is a client‑side transaction analysis and visualization app for spotting money‑muling patterns. It ingests CSV files or live WebSocket streams, runs inference in a Web Worker (with WASM acceleration), and renders interactive graph insights in the browser.

## Features
- CSV upload and parsing (client‑side).
- Live streaming via WebSocket (batched every 1s).
- Pattern detection:
  - Cycles (rings)
  - Smurfing (fan‑in / fan‑out)
  - Layered shell chains
- Interactive Cytoscape graph with selection, zoom, and detail overlays.
- Side panel with suspicious accounts, ring summaries, smurfing groups, and layered chains.
- Export results as JSON.

## Performance Notes
- On typical hardware, ~10k rows process in about **5 seconds** end‑to‑end (parse + inference + render).
- Layout performance is adaptive:
  - Small graphs use `cose` for better aesthetics.
  - Larger graphs fall back to `grid` (with a 2s `cose` timeout) for responsiveness.

## Tech Stack
- React + TypeScript
- Vite
- Zustand (state)
- Cytoscape (graph rendering)
- Web Workers + WASM (analysis)
- Tailwind CSS

## Getting Started

### Prerequisites
- Node.js (LTS recommended)

### Install
```bash
npm install
```

### Run locally
```bash
npm run dev
```

## Usage

### 1) CSV Upload
1. Open the home page.
2. Upload a CSV file with the schema below.
3. Click **Start Security Scan** to analyze and visualize.

### 2) Live Streaming
1. On the home page, enter your WebSocket URL.
2. Click **Start Live**.
3. Each incoming transaction line is buffered and processed every 1s.

### CSV / Stream Format
Plaintext CSV lines (no header for stream):
```
transaction_id,sender_id,receiver_id,amount,timestamp
TXN_00000001,ACC_00123,ACC_00456,15000,2024-01-21 03:01:00
```
- WebSocket payloads can be:
  - a raw CSV string, or
  - JSON containing `{ "row": "<csv line>" }`.

## Behavior Overview
- Uploaded CSV replaces any existing dataset in memory.
- WebSocket batches are appended to the in‑memory dataset.
- If `/graph` is opened directly without a CSV or WS URL, it redirects back to `/`.

## Outputs
- **Suspicious accounts:** ranked by detected patterns.
- **Fraud rings:** deterministic ring IDs with risk scoring.
- **Smurfing groups:** fan‑in and fan‑out clusters.
- **Shell chains:** layered transfer paths.
- **Export:** JSON via the **Download JSON** button.

## Project Structure
- `src/App.tsx` — UI + graph behavior
- `src/store.ts` — Zustand state
- `src/analysis.worker.ts` — inference pipeline + WASM integration
- `src/parse.worker.ts` — CSV parsing workers
- `wasm/` — WASM artifacts

## Limitations
- CSV parsing is line‑based and expects consistent comma‑separated fields.
- Client‑side analysis is bound by browser memory and CPU.
- Extremely large graphs should favor fast layouts for responsiveness.

## Tips
- For live streaming, prefer steady rates (e.g. 1–5 lines/sec) and keep batches small.
- For large datasets, use the download JSON output to archive and review results.

## License
Apache‑2.0
