/// <reference lib="webworker" />

type CsvRow = {
  transaction_id: string;
  sender_id: string;
  receiver_id: string;
  amount: string;
  timestamp: string;
};

type Edge = {
  sender: string;
  receiver: string;
  amount: number;
  timestamp: number;
};

type MessageIn = {
  csvText?: string;
  rows?: CsvRow[];
  source?: string;
  mode?: 'append' | 'replace';
};

const splitCsvLine = (line: string): string[] => {
  const cells: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (ch === ',' && !inQuotes) {
      cells.push(current);
      current = '';
      continue;
    }
    current += ch;
  }
  cells.push(current);
  return cells;
};

const parseCsv = (text: string): CsvRow[] => {
  const lines = text.trim().split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return [];
  const headers = splitCsvLine(lines[0]).map((h) => h.trim());
  const senderIdx = headers.indexOf('sender_id');
  const receiverIdx = headers.indexOf('receiver_id');
  const idIdx = headers.indexOf('transaction_id');
  const amountIdx = headers.indexOf('amount');
  const timeIdx = headers.indexOf('timestamp');

  if (senderIdx === -1 || receiverIdx === -1) return [];

  return lines.slice(1).map((line) => {
    const cells = splitCsvLine(line).map((c) => c.trim());
    return {
      transaction_id: cells[idIdx] ?? '',
      sender_id: cells[senderIdx] ?? '',
      receiver_id: cells[receiverIdx] ?? '',
      amount: cells[amountIdx] ?? '',
      timestamp: cells[timeIdx] ?? '',
    };
  });
};

const ctx = self as unknown as DedicatedWorkerGlobalScope;
let wasmReady: Promise<void> | null = null;
let bufferedRows: CsvRow[] = [];
let wasmAnalyze: ((edgeCount: number) => number) | null = null;
let wasmFanIn:
  | ((
      nodeCount: number,
      senders: Uint32Array,
      receivers: Uint32Array,
      timestamps: Float64Array,
      amounts: Float64Array,
      smallThreshold: number,
      windowMs: number,
      minUnique: number
    ) => Uint32Array)
  | null = null;
let wasmFanOut:
  | ((
      nodeCount: number,
      senders: Uint32Array,
      receivers: Uint32Array,
      timestamps: Float64Array,
      amounts: Float64Array,
      smallThreshold: number,
      windowMs: number,
      minUnique: number
    ) => Uint32Array)
  | null = null;
let wasmCycles:
  | ((
      nodeCount: number,
      senders: Uint32Array,
      receivers: Uint32Array,
      minLen: number,
      maxLen: number,
      maxPathsPerStart: number,
      maxNeighbors: number
    ) => Uint32Array)
  | null = null;
let wasmShellChains:
  | ((
      nodeCount: number,
      senders: Uint32Array,
      receivers: Uint32Array,
      degrees: Uint32Array,
      maxDepth: number,
      maxPathsPerStart: number,
      maxNeighbors: number
    ) => Uint32Array)
  | null = null;

const initWasm = async () => {
  if (!wasmReady) {
    wasmReady = (async () => {
      const mod = await import('../wasm/pkg/muling_wasm');
      await mod.default();
      wasmAnalyze = mod.analyze_stub;
      wasmFanIn = mod.detect_fan_in;
      wasmFanOut = mod.detect_fan_out;
      wasmCycles = mod.detect_cycles;
      wasmShellChains = mod.detect_shell_chains;
    })();
  }
  return wasmReady;
};

ctx.onmessage = async (event: MessageEvent<MessageIn>) => {
  const startedAt = performance.now();
  const { csvText, rows: inputRows, source = 'abc.csv', mode = 'replace' } = event.data;

  try {
    await initWasm();
    const incoming = (inputRows ?? parseCsv(csvText ?? '')).filter(
      (r) => r.sender_id && r.receiver_id
    );
    if (mode === 'replace') {
      bufferedRows = incoming;
    } else if (incoming.length > 0) {
      bufferedRows = bufferedRows.concat(incoming);
    }
    const rows = bufferedRows;

    const nodeSet = new Set<string>();
    const edges: Edge[] = [];
    rows.forEach((r) => {
      nodeSet.add(r.sender_id);
      nodeSet.add(r.receiver_id);
      edges.push({
        sender: r.sender_id,
        receiver: r.receiver_id,
        amount: Number.parseFloat(r.amount || '0') || 0,
        timestamp: r.timestamp ? Date.parse(r.timestamp) : NaN,
      });
    });

  const nodes = Array.from(nodeSet);

  const degrees = new Map<string, number>();
  const nodeDays = new Map<string, Set<string>>();
  const counterparties = new Map<string, Set<string>>();

  nodes.forEach((id) => {
    degrees.set(id, 0);
    nodeDays.set(id, new Set());
    counterparties.set(id, new Set());
  });

  edges.forEach((e) => {
    degrees.set(e.sender, (degrees.get(e.sender) ?? 0) + 1);
    degrees.set(e.receiver, (degrees.get(e.receiver) ?? 0) + 1);
    counterparties.get(e.sender)?.add(e.receiver);
    counterparties.get(e.receiver)?.add(e.sender);
    if (Number.isFinite(e.timestamp)) {
      const day = new Date(e.timestamp).toISOString().slice(0, 10);
      nodeDays.get(e.sender)?.add(day);
      nodeDays.get(e.receiver)?.add(day);
    }
  });

  const amounts = edges.map((e) => e.amount).filter((v) => Number.isFinite(v));
  const sortedAmounts = [...amounts].sort((a, b) => a - b);
  const median =
    sortedAmounts.length === 0 ? 0 : sortedAmounts[Math.floor(sortedAmounts.length / 2)];
  const smallThreshold = median > 0 ? median * 0.5 : 0;

  const isSuppressed = (id: string) => {
    const total = degrees.get(id) ?? 0;
    const unique = counterparties.get(id)?.size ?? 0;
    const days = nodeDays.get(id)?.size ?? 0;
    return total >= 200 && unique >= 50 && days >= 20;
  };

  const nodeIndex = new Map<string, number>();
  nodes.forEach((id, idx) => nodeIndex.set(id, idx));

  const sendersIdx = new Uint32Array(edges.length);
  const receiversIdx = new Uint32Array(edges.length);
  const timestampsArr = new Float64Array(edges.length);
  const amountsArr = new Float64Array(edges.length);
  const degreesArr = new Uint32Array(nodes.length);

  edges.forEach((e, i) => {
    sendersIdx[i] = nodeIndex.get(e.sender) ?? 0;
    receiversIdx[i] = nodeIndex.get(e.receiver) ?? 0;
    timestampsArr[i] = e.timestamp;
    amountsArr[i] = e.amount;
  });
  nodes.forEach((id, idx) => {
    degreesArr[idx] = degrees.get(id) ?? 0;
  });

  // Cycles (3-5) via WASM
  const flaggedCycles = new Set<string>();
  const ringList: string[] = [];
  const cycleGroups: string[][] = [];
  if (wasmCycles) {
    const cycleFlat = wasmCycles(
      nodes.length,
      sendersIdx,
      receiversIdx,
      3,
      5,
      1500,
      60
    );
    let current: string[] = [];
    for (let i = 0; i < cycleFlat.length; i += 1) {
      const v = cycleFlat[i];
      if (v === 0xffffffff) {
        if (current.length >= 3) {
          current.forEach((id) => flaggedCycles.add(id));
          const hasSuppressed = current.some((id) => isSuppressed(id));
          if (!hasSuppressed) {
            ringList.push(`${current.join(' → ')} → ${current[0]}`);
            cycleGroups.push([...current]);
          }
        }
        current = [];
        continue;
      }
      current.push(nodes[v]);
    }
  }

  // Smurfing within 72h window (WASM)
  const flaggedFanIn = new Set<string>();
  const flaggedFanOut = new Set<string>();
  const fanInList: string[] = [];
  const fanOutList: string[] = [];
  const windowMs = 72 * 60 * 60 * 1000;

  const fanInMap = new Map<string, Set<string>>();
  const fanOutMap = new Map<string, Set<string>>();
  if (wasmFanIn && wasmFanOut) {
    const fanInPairs = wasmFanIn(
      nodes.length,
      sendersIdx,
      receiversIdx,
      timestampsArr,
      amountsArr,
      smallThreshold,
      windowMs,
      10
    );
    const fanOutPairs = wasmFanOut(
      nodes.length,
      sendersIdx,
      receiversIdx,
      timestampsArr,
      amountsArr,
      smallThreshold,
      windowMs,
      10
    );

    for (let i = 0; i < fanInPairs.length; i += 2) {
      const receiverId = nodes[fanInPairs[i]];
      const senderId = nodes[fanInPairs[i + 1]];
      if (!fanInMap.has(receiverId)) fanInMap.set(receiverId, new Set());
      fanInMap.get(receiverId)!.add(senderId);
    }
    fanInMap.forEach((senders, receiver) => {
      if (!isSuppressed(receiver)) {
        flaggedFanIn.add(receiver);
        fanInList.push(`${receiver} ← ${Array.from(senders).join(', ')}`);
      }
    });

    for (let i = 0; i < fanOutPairs.length; i += 2) {
      const senderId = nodes[fanOutPairs[i]];
      const receiverId = nodes[fanOutPairs[i + 1]];
      if (!fanOutMap.has(senderId)) fanOutMap.set(senderId, new Set());
      fanOutMap.get(senderId)!.add(receiverId);
    }
    fanOutMap.forEach((receivers, sender) => {
      if (!isSuppressed(sender)) {
        flaggedFanOut.add(sender);
        fanOutList.push(`${sender} → ${Array.from(receivers).join(', ')}`);
      }
    });
  }

  // Layered shell networks (3+ hops) via WASM
  const stage1 = new Set<string>();
  const stage2 = new Set<string>();
  const stage3plus = new Set<string>();
  const shellSet = new Set<string>();
  const shellList: string[] = [];

  if (!wasmShellChains) {
    throw new Error('WASM shell detection not loaded. Rebuild WASM.');
  }
  const shellChains: string[][] = [];
  if (wasmShellChains) {
    const chainsFlat = wasmShellChains(
      nodes.length,
      sendersIdx,
      receiversIdx,
      degreesArr,
      5,
      2000,
      60
    );
    let current: string[] = [];
    for (let i = 0; i < chainsFlat.length; i += 1) {
      const v = chainsFlat[i];
      if (v === 0xffffffff) {
        if (current.length >= 4) {
          const intermediates = current.slice(1, -1);
          const hasSuppressed = intermediates.some((id) => isSuppressed(id));
          if (!hasSuppressed) {
            intermediates.forEach((nodeId, idx) => {
              if (idx === 0) stage1.add(nodeId);
              else if (idx === 1) stage2.add(nodeId);
              else stage3plus.add(nodeId);
            });
            const chainDisplay = `${current.join(' → ')}`;
            if (!shellSet.has(chainDisplay)) {
              shellSet.add(chainDisplay);
              shellList.push(chainDisplay);
              shellChains.push([...current]);
            }
          }
        }
        current = [];
        continue;
      }
      current.push(nodes[v]);
    }
  }

  const classes = {
    cycle: Array.from(flaggedCycles).filter((id) => !isSuppressed(id)),
    fanIn: Array.from(flaggedFanIn).filter((id) => !isSuppressed(id)),
    fanOut: Array.from(flaggedFanOut).filter((id) => !isSuppressed(id)),
    stage1: Array.from(stage1).filter((id) => !isSuppressed(id)),
    stage2: Array.from(stage2).filter((id) => !isSuppressed(id)),
    stage3: Array.from(stage3plus).filter((id) => !isSuppressed(id)),
  };

  // Deterministic ring IDs and suspicion scores
  const ringEntries: { ring_id: string; member_accounts: string[]; pattern_type: string; risk_score: number }[] = [];
  const ringKeySet = new Set<string>();
  const ringCandidates: { key: string; pattern: string; members: string[]; base: number; display?: string }[] = [];

  const addRing = (pattern: string, members: string[], baseScore: number, display?: string) => {
    const filtered = members.filter((m) => !isSuppressed(m));
    if (filtered.length === 0) return;
    const sorted = [...new Set(filtered)].sort();
    const key = `${pattern}:${sorted.join('|')}`;
    if (ringKeySet.has(key)) return;
    ringKeySet.add(key);
    ringCandidates.push({ key, pattern, members: sorted, base: baseScore, display });
  };

  cycleGroups.forEach((g) => addRing('cycle', g, 90, `${g.join(' → ')} → ${g[0]}`));
  shellChains.forEach((g) => addRing('shell_chain', g, 85));
  fanInMap.forEach((senders, receiver) => addRing('fan_in', [receiver, ...senders], 70));
  fanOutMap.forEach((receivers, sender) => addRing('fan_out', [sender, ...receivers], 70));

  const ringDisplays: Record<string, string> = {};
  ringCandidates
    .sort((a, b) => (a.pattern === b.pattern ? a.key.localeCompare(b.key) : a.pattern.localeCompare(b.pattern)))
    .forEach((r, idx) => {
      const ring_id = `RING_${String(idx + 1).padStart(3, '0')}`;
      ringEntries.push({
        ring_id,
        member_accounts: r.members,
        pattern_type: r.pattern,
        risk_score: Math.min(100, r.base + Math.min(20, r.members.length * 2)),
      });
      if (r.display) ringDisplays[ring_id] = r.display;
    });

  const accountPatterns = new Map<string, Set<string>>();
  const accountRing = new Map<string, { ring_id: string; risk: number }>();

  ringEntries.forEach((ring) => {
    ring.member_accounts.forEach((acc) => {
      if (!accountPatterns.has(acc)) accountPatterns.set(acc, new Set());
      accountPatterns.get(acc)!.add(ring.pattern_type);
      const current = accountRing.get(acc);
      if (!current || ring.risk_score > current.risk) {
        accountRing.set(acc, { ring_id: ring.ring_id, risk: ring.risk_score });
      }
    });
  });

  const patternLabel = (p: string) => {
    if (p === 'cycle') return 'cycle_length_3_5';
    if (p === 'fan_in') return 'fan_in_10_plus_72h';
    if (p === 'fan_out') return 'fan_out_10_plus_72h';
    if (p === 'shell_chain') return 'layered_shell_3_hops';
    return p;
  };

  const suspicion_explanations: Record<string, string> = {};
  const suspicious_accounts = Array.from(accountPatterns.entries()).map(([acc, patterns]) => {
    const base = Array.from(patterns).reduce((sum, p) => {
      if (p === 'cycle') return sum + 40;
      if (p === 'shell_chain') return sum + 35;
      if (p === 'fan_in' || p === 'fan_out') return sum + 25;
      return sum;
    }, 0);
    const bonus = Math.max(0, patterns.size - 1) * 5;
    const score = Math.min(100, base + bonus);
    const detected = Array.from(patterns).map(patternLabel).sort();
    const ring = accountRing.get(acc);
    const explanation = [
      `Account: ${acc}`,
      `Detected patterns: ${detected.join(', ') || 'none'}`,
      `Ring ID: ${ring ? ring.ring_id : 'RING_000'}`,
      `Score formula: base(${base}) + bonus(${bonus}) = ${Math.min(100, base + bonus)}`,
    ].join('\n');
    suspicion_explanations[acc] = explanation;
    return {
      account_id: acc,
      suspicion_score: Number(score.toFixed(1)),
      detected_patterns: detected,
      ring_id: ring ? ring.ring_id : 'RING_000',
    };
  });

  suspicious_accounts.sort((a, b) => b.suspicion_score - a.suspicion_score);

  const accountStats = new Map<
    string,
    { credits: number; debits: number; net: number; rings: string[]; smurfs: string[]; shells: string[]; minTime: number; maxTime: number }
  >();
  nodes.forEach((id) => {
    accountStats.set(id, { credits: 0, debits: 0, net: 0, rings: [], smurfs: [], shells: [], minTime: Infinity, maxTime: -Infinity });
  });

  edges.forEach((e) => {
    const sender = accountStats.get(e.sender);
    const receiver = accountStats.get(e.receiver);
    if (sender) {
      sender.debits += 1;
      sender.net -= e.amount;
      if (Number.isFinite(e.timestamp)) {
        sender.minTime = Math.min(sender.minTime, e.timestamp);
        sender.maxTime = Math.max(sender.maxTime, e.timestamp);
      }
    }
    if (receiver) {
      receiver.credits += 1;
      receiver.net += e.amount;
      if (Number.isFinite(e.timestamp)) {
        receiver.minTime = Math.min(receiver.minTime, e.timestamp);
        receiver.maxTime = Math.max(receiver.maxTime, e.timestamp);
      }
    }
  });

  ringEntries.forEach((ring) => {
    if (ring.pattern_type !== 'cycle') return;
    ring.member_accounts.forEach((acc) => {
      const stats = accountStats.get(acc);
      if (stats) stats.rings.push(ring.ring_id);
    });
  });

  const smurfInEntries = Array.from(fanInMap.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  smurfInEntries.forEach(([receiver, senders], idx) => {
    const id = `SMURF_IN_${String(idx + 1).padStart(3, '0')}`;
    const statsR = accountStats.get(receiver);
    if (statsR) statsR.smurfs.push(id);
    senders.forEach((s) => {
      const statsS = accountStats.get(s);
      if (statsS) statsS.smurfs.push(id);
    });
  });

  const smurfOutEntries = Array.from(fanOutMap.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  smurfOutEntries.forEach(([sender, receivers], idx) => {
    const id = `SMURF_OUT_${String(idx + 1).padStart(3, '0')}`;
    const statsS = accountStats.get(sender);
    if (statsS) statsS.smurfs.push(id);
    receivers.forEach((r) => {
      const statsR = accountStats.get(r);
      if (statsR) statsR.smurfs.push(id);
    });
  });

  const shellEntries = shellChains
    .map((c) => c.join('|'))
    .sort()
    .map((key, idx) => ({ key, id: `SHELL_${String(idx + 1).padStart(3, '0')}` }));
  shellEntries.forEach((entry) => {
    const members = entry.key.split('|');
    members.forEach((m) => {
      const stats = accountStats.get(m);
      if (stats) stats.shells.push(entry.id);
    });
  });

  const suspicionByAccount = new Map<string, number>();
  suspicious_accounts.forEach((acc) => {
    suspicionByAccount.set(acc.account_id, acc.suspicion_score);
  });

  const node_details: Record<
    string,
    {
      name: string;
      suspicion_score: number;
      net_balance: number;
      credits: number;
      debits: number;
      rings: string[];
      smurfs: string[];
      shells: string[];
      rings_count: number;
      first_txn: string | null;
      last_txn: string | null;
    }
  > = {};

  accountStats.forEach((stats, acc) => {
    node_details[acc] = {
      name: acc,
      suspicion_score: suspicionByAccount.get(acc) ?? 0,
      net_balance: Number(stats.net.toFixed(2)),
      credits: stats.credits,
      debits: stats.debits,
      rings: stats.rings,
      smurfs: stats.smurfs,
      shells: stats.shells,
      rings_count: stats.rings.length,
      first_txn: Number.isFinite(stats.minTime) ? new Date(stats.minTime).toISOString() : null,
      last_txn: Number.isFinite(stats.maxTime) ? new Date(stats.maxTime).toISOString() : null,
    };
  });

  const edgeAgg = new Map<string, { net: number; minTime: number; maxTime: number; count: number }>();
  rows.forEach((r) => {
    const key = `${r.sender_id}→${r.receiver_id}`;
    const amount = Number.parseFloat(r.amount || '0') || 0;
    const ts = r.timestamp ? Date.parse(r.timestamp) : NaN;
    if (!edgeAgg.has(key)) {
      edgeAgg.set(key, { net: 0, minTime: Infinity, maxTime: -Infinity, count: 0 });
    }
    const agg = edgeAgg.get(key)!;
    agg.net += amount;
    agg.count += 1;
    if (Number.isFinite(ts)) {
      agg.minTime = Math.min(agg.minTime, ts);
      agg.maxTime = Math.max(agg.maxTime, ts);
    }
  });

  const edge_details: Record<
    string,
    { net: number; count: number; first_txn: string | null; last_txn: string | null }
  > = {};
  edgeAgg.forEach((agg, key) => {
    edge_details[key] = {
      net: Number(agg.net.toFixed(2)),
      count: agg.count,
      first_txn: Number.isFinite(agg.minTime) ? new Date(agg.minTime).toISOString() : null,
      last_txn: Number.isFinite(agg.maxTime) ? new Date(agg.maxTime).toISOString() : null,
    };
  });

  const analysisPayload = {
    suspicious_accounts,
    suspicion_explanations,
    node_details,
    edge_details,
    fraud_rings: ringEntries,
    ring_displays: ringDisplays,
    summary: {
      total_accounts_analyzed: nodes.length,
      suspicious_accounts_flagged: suspicious_accounts.length,
      fraud_rings_detected: ringEntries.length,
      processing_time_seconds: 0,
    },
  };

  const analysisMs = performance.now() - startedAt;
  analysisPayload.summary.processing_time_seconds = Number((analysisMs / 1000).toFixed(1));
  if (wasmAnalyze) wasmAnalyze(rows.length);

  const edgeIdCounts = new Map<string, number>();
  const response = {
    nodes: nodes.map((id) => ({ id, label: id })),
    edges: rows.map((r, index) => {
      const baseId = r.transaction_id || `edge-${index}`;
      const count = (edgeIdCounts.get(baseId) ?? 0) + 1;
      edgeIdCounts.set(baseId, count);
      const id = count > 1 ? `${baseId}-${count}` : baseId;
      return {
        id,
        source: r.sender_id,
        target: r.receiver_id,
        label: r.amount ? `Amount: ${r.amount}` : undefined,
        timestamp: r.timestamp,
      };
    }),
    classes,
    rings: ringList,
    smurfing: { fanIn: fanInList, fanOut: fanOutList },
    layered: shellList,
    counts: {
      rings: ringList.length,
      smurfing: fanInList.length + fanOutList.length,
      layered: shellList.length,
    },
    analysisMs,
    analysisPayload,
  };

    ctx.postMessage(response);
  } catch (error) {
    ctx.postMessage({
      error: error instanceof Error ? error.message : 'Analysis failed',
      analysisMs: performance.now() - startedAt,
    });
  }
};

export {};
