# MuleGuard AI — Graph-Based Financial Crime Detection Engine

Live Demo URL: https://samratsk.github.io/muleguard/

## Screenshots
<table>
  <tr>
    <td colspan="3" align="center">
      <img src="screenshots/landing-page.png" width="900" />
      <br />
      Landing page
    </td>
  </tr>
  <tr>
    <td colspan="3" align="center">
      <img src="screenshots/graph-1.png" width="900" />
      <br />
      General look
    </td>
  </tr>
  <tr>
    <td align="center">
      <img src="screenshots/live.png" width="280" />
      <br />
      Live stream
    </td>
    <td align="center">
      <img src="screenshots/10k.png" width="280" />
      <br />
      10k items
    </td>
    <td align="center">
      <img src="screenshots/individual-chain.png" width="280" />
      <br />
      Individual chain
    </td>
  </tr>
</table>

## Project Title
MuleGuard AI — Money Muling Detection Challenge Submission

## Tech Stack
- React + TypeScript
- Vite
- Zustand
- Cytoscape
- Web Workers + WASM (Rust)
- Tailwind CSS

## System Architecture
- **UI Layer (React):** CSV upload, live stream input, graph visualization, side panel insights, JSON export.
- **State Layer (Zustand):** Shared analysis state across pages.
- **Compute Layer (Web Workers + WASM):** Parsing and detection run off the main thread.
- **Graph Layer (Cytoscape):** Interactive rendering, selection, zoom, and styling of suspicious nodes and rings.

## Algorithm Approach (with Complexity)
1. **Graph Construction**
   - Nodes: unique `sender_id` and `receiver_id`.
   - Edges: directed transactions with amount and timestamp.
   - Complexity: `O(E)`.

2. **Cycle Detection (rings, length 3–5)**
   - Detect short cycles to identify circular fund routing.
   - Complexity (bounded): `O(V * d^L)` where `L <= 5`, `d` is average degree. Bounded depth keeps this tractable.

3. **Smurfing (Fan‑in / Fan‑out within 72 hours)**
   - Fan‑in: 10+ unique senders → 1 receiver.
   - Fan‑out: 1 sender → 10+ receivers.
   - Uses sliding time window (72h).
   - Complexity: `O(E log E)` for time sorting + window scan.

4. **Layered Shell Chains (3+ hops)**
   - Detect chains of 3+ transfers with low‑activity intermediates.
   - Complexity: bounded DFS depth `O(V * d^L)` with `L` fixed.

## Suspicion Score Methodology
Each account receives a score (0–100) from detected patterns:
- Cycle participation → base score + risk boost
- Fan‑in / Fan‑out → medium risk boost
- Shell chains → high risk boost
- Multiple patterns → additive bonus

Scores are capped at 100 and sorted descending in output. Ring IDs are deterministic and stable for reproducibility.

## Installation & Setup
### Prerequisites
- Node.js (LTS)

### Install
```bash
npm install
```

### Run
```bash
npm run dev
```

## Usage Instructions
### CSV Upload
1. Open the home page.
2. Upload CSV with the exact schema below.
3. Click **Start Security Scan**.

### Live Streaming
1. Enter WebSocket URL on the home page.
2. Click **Start Live**.
3. Each incoming CSV line is batched every 1 second and analyzed.

### Input Specification
CSV columns (exact):
```
transaction_id,sender_id,receiver_id,amount,timestamp
```
- `timestamp` format: `YYYY-MM-DD HH:MM:SS`

### Required JSON Output Format (Exact)
```
{ "suspicious_accounts": [
    { "account_id": "ACC_00123", "suspicion_score": 87.5,
      "detected_patterns": ["cycle_length_3", "high_velocity"],
      "ring_id": "RING_001" } ],
  "fraud_rings": [
    { "ring_id": "RING_001", "member_accounts": ["ACC_00123", ...],
      "pattern_type": "cycle", "risk_score": 95.3 } ],
  "summary": { "total_accounts_analyzed": 500,
    "suspicious_accounts_flagged": 15, "fraud_rings_detected": 4,
    "processing_time_seconds": 2.3 }
}
```

## Known Limitations
- Client‑side analysis is limited by browser CPU and memory.
- Extremely dense graphs may need fast layouts for responsiveness.

## Performance
- ~10k rows process in ~**5 seconds** (parse + inference + render).
- Rust + WASM accelerates graph scans and avoids GC pauses.

## Team Members
- Saikalyan C B (@saikalyancb-06)
- Samrat S K (@SamratSK)

## Submission Checklist (RIFT 2026)
- Live deployed URL (public, no auth)
- LinkedIn demo video
- Public GitHub repository
- Comprehensive README (this file)

## License
MIT
