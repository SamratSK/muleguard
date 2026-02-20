/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import {
  ShieldAlert,
  Upload,
  FileText,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  Lock,
  Search,
  AlertTriangle,
  Activity,
  Network,
  Table as TableIcon,
  Shuffle,
  Layers,
  Download,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Routes, Route, useNavigate } from 'react-router-dom';
import cytoscape, { type Core } from 'cytoscape';
import { useAnalysisStore } from './store';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

function HomePage() {
  const setCsvText = useAnalysisStore((s) => s.setCsvText);
  const wsUrl = useAnalysisStore((s) => s.wsUrl);
  const setWsUrl = useAnalysisStore((s) => s.setWsUrl);
  const setWsShouldConnect = useAnalysisStore((s) => s.setWsShouldConnect);
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [wsError, setWsError] = useState<string | null>(null);

  const onDrop = useCallback((acceptedFiles: File[], fileRejections: any[]) => {
    setError(null);

    if (fileRejections.length > 0) {
      const rejection = fileRejections[0];
      if (rejection.file.size > 5 * 1024 * 1024) {
        setError('File is too large. Maximum size is 5MB.');
      } else {
        setError('Invalid file type. Please upload a CSV file.');
      }
      return;
    }

    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
    },
    maxSize: 5 * 1024 * 1024, // 5MB
    multiple: false,
  } as any);

  const handleAnalyze = async () => {
    if (!file) return;
    setIsAnalyzing(true);
    try {
      const text = await file.text();
      setCsvText(text);
      navigate('/graph');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen font-sans selection:bg-emerald-100 selection:text-emerald-900">
      {/* Navigation */}
      <nav className="border-b border-slate-200 bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
              <ShieldAlert className="text-white w-5 h-5" />
            </div>
            <span className="font-display font-bold text-xl tracking-tight">MuleGuard</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
            <a href="#" className="hover:text-emerald-600 transition-colors">
              About
            </a>
            <a
              href="#"
              className="bg-slate-900 text-white px-4 py-2 rounded-full hover:bg-slate-800 transition-all"
            >
              Working
            </a>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-24">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Hero Content */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="font-display text-5xl md:text-6xl font-bold text-slate-900 leading-[1.1] mb-6">
              Expose Money Muling <br />
              <span className="text-emerald-600 italic">Before</span> It Happens.
            </h1>

            <p className="text-lg text-slate-600 mb-10 max-w-lg leading-relaxed">
              Our advanced neural patterns identify suspicious transaction flows, protecting your
              institution from sophisticated financial crime networks.
            </p>

            {/* 3 Points */}
            <div className="space-y-6 mb-12">
              {[
                {
                  icon: Search,
                  title: 'Pattern Recognition',
                  desc: 'Identify rapid-fire transfers and unusual layering patterns.',
                },
                {
                  icon: Lock,
                  title: 'Risk Scoring',
                  desc: 'Automated risk assessment for every transaction chain.',
                },
                {
                  icon: CheckCircle2,
                  title: 'Regulatory Ready',
                  desc: 'Generate audit-ready reports for AML compliance.',
                },
              ].map((point, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + i * 0.1 }}
                  className="flex gap-4"
                >
                  <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center justify-center">
                    <point.icon className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900">{point.title}</h3>
                    <p className="text-sm text-slate-500">{point.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Upload Section */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="relative"
          >
            <div className="absolute -inset-4 bg-emerald-500/5 rounded-[2.5rem] blur-2xl" />
            <div className="relative mb-6 rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm">
              <div className="text-[11px] font-semibold tracking-widest text-slate-400 mb-2">
                LIVE STREAM
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={wsUrl}
                  onChange={(e) => {
                    setWsError(null);
                    setWsUrl(e.target.value);
                  }}
                  placeholder="wss://your-stream"
                  className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 outline-none focus:ring-2 focus:ring-emerald-200"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (!wsUrl.trim()) {
                      setWsError('Enter a WebSocket URL to start streaming.');
                      return;
                    }
                    setWsShouldConnect(true);
                    navigate('/graph');
                  }}
                  className="px-3 py-2 rounded-lg text-xs font-semibold border border-emerald-200 bg-emerald-600 text-white hover:bg-emerald-700"
                >
                  Start Live
                </button>
              </div>
              {wsError && <div className="mt-2 text-[11px] text-red-500">{wsError}</div>}
            </div>
            <div className="relative bg-white border border-slate-200 rounded-3xl p-8 shadow-xl shadow-slate-200/50">
              <div className="mb-8">
                <h2 className="font-display text-2xl font-bold text-slate-900 mb-2">
                  Analyze Transactions
                </h2>
                <p className="text-sm text-slate-500">
                  Upload your transaction log to start the AI scan.
                </p>
              </div>

              <div
                {...getRootProps()}
                className={cn(
                  'border-2 border-dashed rounded-2xl p-10 transition-all cursor-pointer flex flex-col items-center justify-center text-center',
                  isDragActive
                    ? 'border-emerald-500 bg-emerald-50/50'
                    : 'border-slate-200 hover:border-slate-300',
                  file ? 'border-emerald-500 bg-emerald-50/10' : ''
                )}
              >
                <input {...getInputProps()} />

                <AnimatePresence mode="wait">
                  {!file ? (
                    <motion.div
                      key="empty"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex flex-col items-center"
                    >
                      <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mb-4">
                        <Upload className="w-8 h-8 text-slate-400" />
                      </div>
                      <p className="text-slate-900 font-medium mb-1">Drop your CSV here</p>
                      <p className="text-xs text-slate-400">Max file size 5MB • CSV only</p>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="file"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex flex-col items-center"
                    >
                      <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mb-4">
                        <FileText className="w-8 h-8 text-emerald-600" />
                      </div>
                      <p className="text-slate-900 font-medium mb-1 truncate max-w-[200px]">
                        {file.name}
                      </p>
                      <p className="text-xs text-emerald-600 font-medium">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setFile(null);
                        }}
                        className="mt-4 text-xs text-slate-400 hover:text-slate-600 underline"
                      >
                        Remove file
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 flex items-center gap-2 text-red-500 text-sm font-medium"
                >
                  <AlertCircle className="w-4 h-4" />
                  {error}
                </motion.div>
              )}

              <button
                disabled={!file || isAnalyzing}
                onClick={handleAnalyze}
                className={cn(
                  'w-full mt-8 py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg',
                  file && !isAnalyzing
                    ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-200'
                    : 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none'
                )}
              >
                {isAnalyzing ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Analyzing Patterns...
                  </>
                ) : (
                  <>
                    Start Security Scan
                    <ChevronRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-2 opacity-50 grayscale">
            <ShieldAlert className="w-5 h-5" />
            <span className="font-display font-bold text-lg">MuleGuard AI</span>
          </div>
          <div className="flex gap-8 text-sm text-slate-400">
            <a href="#" className="hover:text-slate-600">
              Privacy Policy
            </a>
            <a href="#" className="hover:text-slate-600">
              Terms of Service
            </a>
            <a href="#" className="hover:text-slate-600">
              Contact Support
            </a>
          </div>
          <p className="text-sm text-slate-400">© 2026 MuleGuard AI. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

function GraphPage() {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [paneWidthPct, setPaneWidthPct] = useState(40);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [hoverInfo, setHoverInfo] = useState<{ id: string; x: number; y: number } | null>(null);
  const [zoomPct, setZoomPct] = useState(100);
  const [suspicionDialog, setSuspicionDialog] = useState<{ title: string; body: string } | null>(
    null
  );
  const [wsStatus, setWsStatus] = useState<'disconnected' | 'connecting' | 'connected'>(
    'disconnected'
  );
  const wsUrl = useAnalysisStore((s) => s.wsUrl);
  const wsShouldConnect = useAnalysisStore((s) => s.wsShouldConnect);
  const setWsShouldConnect = useAnalysisStore((s) => s.setWsShouldConnect);
  const analysisMs = useAnalysisStore((s) => s.analysisMs);
  const setAnalysisMs = useAnalysisStore((s) => s.setAnalysisMs);
  const analysisJson = useAnalysisStore((s) => s.analysisJson);
  const csvText = useAnalysisStore((s) => s.csvText);
  const setAnalysisJson = useAnalysisStore((s) => s.setAnalysisJson);
  const analysisError = useAnalysisStore((s) => s.analysisError);
  const setAnalysisError = useAnalysisStore((s) => s.setAnalysisError);
  const detectionSummary = useAnalysisStore((s) => s.detectionSummary);
  const setDetectionSummary = useAnalysisStore((s) => s.setDetectionSummary);
  const ringPaths = useAnalysisStore((s) => s.ringPaths);
  const setRingPaths = useAnalysisStore((s) => s.setRingPaths);
  const fanInGroups = useAnalysisStore((s) => s.fanInGroups);
  const setFanInGroups = useAnalysisStore((s) => s.setFanInGroups);
  const fanOutGroups = useAnalysisStore((s) => s.fanOutGroups);
  const setFanOutGroups = useAnalysisStore((s) => s.setFanOutGroups);
  const shellChains = useAnalysisStore((s) => s.shellChains);
  const setShellChains = useAnalysisStore((s) => s.setShellChains);
  const ringMembers = useAnalysisStore((s) => s.ringMembers);
  const setRingMembers = useAnalysisStore((s) => s.setRingMembers);
  const ringDisplays = useAnalysisStore((s) => s.ringDisplays);
  const setRingDisplays = useAnalysisStore((s) => s.setRingDisplays);
  const fraudRings = useAnalysisStore((s) => s.fraudRings);
  const setFraudRings = useAnalysisStore((s) => s.setFraudRings);
  const suspiciousAccounts = useAnalysisStore((s) => s.suspiciousAccounts);
  const setSuspiciousAccounts = useAnalysisStore((s) => s.setSuspiciousAccounts);
  const suspicionExplanations = useAnalysisStore((s) => s.suspicionExplanations);
  const setSuspicionExplanations = useAnalysisStore((s) => s.setSuspicionExplanations);
  const nodeDetails = useAnalysisStore((s) => s.nodeDetails);
  const setNodeDetails = useAnalysisStore((s) => s.setNodeDetails);
  const edgeDetails = useAnalysisStore((s) => s.edgeDetails);
  const setEdgeDetails = useAnalysisStore((s) => s.setEdgeDetails);
  const selectedNodeId = useAnalysisStore((s) => s.selectedNodeId);
  const setSelectedNodeId = useAnalysisStore((s) => s.setSelectedNodeId);
  const selectedEdgeId = useAnalysisStore((s) => s.selectedEdgeId);
  const setSelectedEdgeId = useAnalysisStore((s) => s.setSelectedEdgeId);
  const pinnedInfo = useAnalysisStore((s) => s.pinnedNode);
  const setPinnedInfo = useAnalysisStore((s) => s.setPinnedNode);
  const pinnedEdgeInfo = useAnalysisStore((s) => s.pinnedEdge);
  const setPinnedEdgeInfo = useAnalysisStore((s) => s.setPinnedEdge);
  const connectedNodesPopup = useAnalysisStore((s) => s.connectedNodesPopup);
  const setConnectedNodesPopup = useAnalysisStore((s) => s.setConnectedNodesPopup);
  const miniGraphRef = useRef<HTMLDivElement | null>(null);
  const miniCyRef = useRef<Core | null>(null);
  const workerRef = useRef<Worker | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const wsBufferRef = useRef<
    { transaction_id: string; sender_id: string; receiver_id: string; amount: string; timestamp: string }[]
  >([]);
  const wsTimerRef = useRef<number | null>(null);
  const analysisStartRef = useRef<number | null>(null);
  // analysis state is centralized in the store
  const isResizingRef = useRef(false);
  const containerWrapRef = useRef<HTMLDivElement | null>(null);
  const paneRef = useRef<HTMLDivElement | null>(null);
  const widthPctRef = useRef(40);
  const rafRef = useRef<number | null>(null);
  const cyRef = useRef<Core | null>(null);

  const splitCsvLine = useCallback((line: string) => {
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
    return cells.map((c) => c.trim());
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;

    const cy = cytoscape({
      container: containerRef.current,
      elements: [],
      layout: { name: 'cose', animate: false },
      boxSelectionEnabled: true,
      selectionType: 'additive',
      style: [
        {
          selector: 'node',
          style: {
            'background-color': '#10b981',
            'border-color': '#334155',
            'border-width': 1,
            color: '#0f172a',
            label: 'data(label)',
            'font-size': 10,
            'text-background-color': '#ffffff',
            'text-background-opacity': 0.7,
            'text-background-padding': '2',
            'text-valign': 'bottom',
            'text-halign': 'center',
          },
        },
        {
          selector: 'node.cycle',
          style: {
            'background-color': '#ef4444',
            'border-color': '#b91c1c',
          },
        },
        {
          selector: 'node.fan-in',
          style: {
            'background-color': '#f59e0b',
            'border-color': '#d97706',
          },
        },
        {
          selector: 'node.fan-out',
          style: {
            'background-color': '#f59e0b',
            'border-color': '#d97706',
          },
        },
        {
          selector: 'node.stage-1',
          style: {
            'background-color': '#f59e0b',
            'border-color': '#d97706',
          },
        },
        {
          selector: 'node.stage-2',
          style: {
            'background-color': '#f43f5e',
            'border-color': '#be123c',
          },
        },
        {
          selector: 'node.stage-3',
          style: {
            'background-color': '#f97316',
            'border-color': '#ea580c',
          },
        },
        {
          selector: 'node.selected-node',
          style: {
            'border-width': 3,
            'border-color': '#ef4444',
          },
        },
        {
          selector: 'edge',
          style: {
            width: 1.2,
            'line-color': '#94a3b8',
            'target-arrow-color': '#94a3b8',
            'target-arrow-shape': 'triangle',
            'curve-style': 'bezier',
          },
        },
        {
          selector: 'edge.selected-edge',
          style: {
            width: 5,
            'line-color': '#ef4444',
            'target-arrow-color': '#ef4444',
            'line-style': 'solid',
            'z-index': 999,
            opacity: 1,
          },
        },
        {
          selector: 'edge:selected',
          style: {
            width: 5,
            'line-color': '#ef4444',
            'target-arrow-color': '#ef4444',
            'line-style': 'solid',
            'z-index': 999,
            opacity: 1,
          },
        },
      ],
    });

    cyRef.current = cy;
    cy.on('zoom', () => {
      setZoomPct(Math.round(cy.zoom() * 100));
    });
    const worker = new Worker(new URL('./analysis.worker.ts', import.meta.url), { type: 'module' });
    workerRef.current = worker;
    const loadCsv = async () => {
      const startedAt = performance.now();
      try {
        if (!csvText) {
          return;
        }
        const text = csvText;
        setAnalysisMs(null);
        setAnalysisError(null);
        analysisStartRef.current = startedAt;
        const lines = text.trim().split(/\r?\n/);
        const header = lines.shift() ?? '';
        const chunkSize = Math.ceil(lines.length / 4);
        const chunks = [0, 1, 2, 3].map((i) => lines.slice(i * chunkSize, (i + 1) * chunkSize));

        const parseWorkers = chunks.map(() => new Worker(new URL('./parse.worker.ts', import.meta.url), { type: 'module' }));

        const parsePromises = parseWorkers.map(
          (w, idx) =>
            new Promise<{ rows: any[] }>((resolve) => {
              w.onmessage = (e) => resolve(e.data);
              w.postMessage({ header, lines: chunks[idx] });
            })
        );

        const results = await Promise.all(parsePromises);
        parseWorkers.forEach((w) => w.terminate());
        const parseError = results.find((r: any) => r.error)?.error as string | undefined;
        if (parseError) {
          setAnalysisError(parseError);
          return;
        }
        const rows = results.flatMap((r) => r.rows || []);

        worker.postMessage({ rows, source: 'upload.csv', mode: 'replace' });
      } catch {
        setAnalysisError('Failed to load CSV for analysis.');
      }
    };

    worker.onmessage = (event) => {
      if (event.data?.error) {
        setAnalysisError(String(event.data.error));
        setAnalysisMs(event.data.analysisMs ?? null);
        return;
      }
      const {
        nodes,
        edges,
        classes,
        rings,
        smurfing,
        layered,
        counts,
        analysisMs: workerMs,
        analysisPayload,
      } = event.data as {
        nodes: { id: string; label: string }[];
        edges: { id: string; source: string; target: string; label?: string; timestamp?: string }[];
        classes: {
          cycle: string[];
          fanIn: string[];
          fanOut: string[];
          stage1: string[];
          stage2: string[];
          stage3: string[];
        };
        rings: string[];
        smurfing: { fanIn: string[]; fanOut: string[] };
        layered: string[];
        counts: { rings: number; smurfing: number; layered: number };
        analysisMs: number;
        analysisPayload: Record<string, unknown>;
      };

      cy.elements().remove();
      cy.add([
        ...nodes.map((n) => ({ data: { id: n.id, label: n.label }, classes: 'node-default' })),
        ...edges.map((e) => ({
          data: {
            id: e.id,
            source: e.source,
            target: e.target,
            label: e.label,
            timestamp: e.timestamp,
          },
        })),
      ]);
      const useCose = nodes.length <= 400 && edges.length <= 800;
      const layout = cy.layout({ name: useCose ? 'cose' : 'grid', animate: false });
      layout.run();
      if (useCose) {
        const timeoutId = window.setTimeout(() => {
          if (layout.running()) {
            layout.stop();
            cy.layout({ name: 'grid', animate: false }).run();
          }
        }, 2000);
        if ((layout as any).on) {
          (layout as any).on('layoutstop', () => window.clearTimeout(timeoutId));
        }
      }

      cy.removeListener('tap');
      cy.on('tap', 'node', (evt) => {
        const id = evt.target.id();
        cy.nodes().removeClass('selected-node');
        evt.target.addClass('selected-node');
        setSelectedNodeId(id);
        const pos = evt.renderedPosition || { x: 0, y: 0 };
        setPinnedInfo({ id, x: pos.x, y: pos.y });
        cy.edges().removeClass('selected-edge');
        setSelectedEdgeId(null);
        setPinnedEdgeInfo(null);
        setConnectedNodesPopup(null);
      });
      cy.on('mouseover', 'node', (evt) => {
        const id = evt.target.id();
        const pos = evt.renderedPosition || { x: 0, y: 0 };
        setHoverInfo({ id, x: pos.x, y: pos.y });
      });
      cy.on('mouseout', 'node', () => setHoverInfo(null));
      cy.on('dblclick', 'node', (evt) => {
        const id = evt.target.id();
        const node = evt.target;
        const neighbors = node.connectedEdges().connectedNodes().map((n) => n.id()).sort();
        setConnectedNodesPopup({ id, title: `Connections for ${id}`, nodes: neighbors, x: 0, y: 0 });
      });
      cy.on('tap', 'edge', (evt) => {
        const edge = evt.target;
        cy.edges().removeClass('selected-edge');
        edge.addClass('selected-edge');
        edge.select();
        const source = edge.data('source');
        const target = edge.data('target');
        const edgeKey = `${source}→${target}`;
        const pos = evt.renderedPosition || { x: 0, y: 0 };
        setSelectedEdgeId(edgeKey);
        setPinnedEdgeInfo({ id: edgeKey, x: pos.x, y: pos.y });
        cy.nodes().removeClass('selected-node');
        setSelectedNodeId(null);
        setPinnedInfo(null);
      });
      cy.on('tap', (evt) => {
        if (evt.target === cy) {
          cy.nodes().removeClass('selected-node');
          setSelectedNodeId(null);
          setPinnedInfo(null);
          cy.edges().removeClass('selected-edge');
          setSelectedEdgeId(null);
          setPinnedEdgeInfo(null);
          setConnectedNodesPopup(null);
        }
      });
      cy.nodes().selectify();

      classes.cycle.forEach((id) => cy.getElementById(id).addClass('cycle'));
      classes.fanIn.forEach((id) => cy.getElementById(id).addClass('fan-in'));
      classes.fanOut.forEach((id) => cy.getElementById(id).addClass('fan-out'));
      classes.stage1.forEach((id) => cy.getElementById(id).addClass('stage-1'));
      classes.stage2.forEach((id) => cy.getElementById(id).addClass('stage-2'));
      classes.stage3.forEach((id) => cy.getElementById(id).addClass('stage-3'));

      setDetectionSummary(counts);
      setRingPaths(rings);
      setFanInGroups(smurfing.fanIn);
      setFanOutGroups(smurfing.fanOut);
      setShellChains(layered);
      const exactPayload = {
        suspicious_accounts: analysisPayload.suspicious_accounts || [],
        fraud_rings: analysisPayload.fraud_rings || [],
        summary: analysisPayload.summary || {},
      };
      setAnalysisJson(exactPayload);
      setSuspiciousAccounts(analysisPayload.suspicious_accounts || []);
      setSuspicionExplanations(analysisPayload.suspicion_explanations || {});
      setNodeDetails(analysisPayload.node_details || {});
      setEdgeDetails(analysisPayload.edge_details || {});
      const ringMap: Record<string, string[]> = {};
      (analysisPayload.fraud_rings || []).forEach((r: any) => {
        ringMap[r.ring_id] = r.member_accounts || [];
      });
      setRingMembers(ringMap);
      setRingDisplays(analysisPayload.ring_displays || {});
      setFraudRings(analysisPayload.fraud_rings || []);
      const elapsed = analysisStartRef.current ? performance.now() - analysisStartRef.current : workerMs;
      setAnalysisMs(elapsed);
      setAnalysisError(null);
      cyRef.current?.resize();
    };

    worker.onerror = () => {
      setAnalysisError('Worker error');
      setAnalysisMs(null);
    };

    worker.onmessageerror = () => {
      setAnalysisError('Worker message error');
      setAnalysisMs(null);
    };

    void loadCsv();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      if (wsTimerRef.current !== null) {
        window.clearInterval(wsTimerRef.current);
        wsTimerRef.current = null;
      }
      setWsStatus('disconnected');
      worker.terminate();
      workerRef.current = null;
      cy.removeListener('tap');
      cy.removeListener('dblclick');
      cy.removeListener('mouseover');
      cy.removeListener('mouseout');
      cy.destroy();
      cyRef.current = null;
    };
  }, [csvText, splitCsvLine, wsUrl]);

  useEffect(() => {
    if (!csvText && !wsUrl.trim()) {
      navigate('/');
    }
  }, [csvText, navigate, wsUrl]);

  const connectWebSocket = useCallback(() => {
    if (!wsUrl.trim()) return;
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    if (wsTimerRef.current !== null) {
      window.clearInterval(wsTimerRef.current);
      wsTimerRef.current = null;
    }
    wsBufferRef.current = [];
    setWsStatus('connecting');
    const ws = new WebSocket(wsUrl.trim());
    wsRef.current = ws;

    ws.onopen = () => setWsStatus('connected');
    ws.onclose = () => setWsStatus('disconnected');
    ws.onerror = () => setWsStatus('disconnected');
    ws.onmessage = (event) => {
      let payload = event.data as unknown;
      if (typeof payload === 'string') {
        const trimmed = payload.trim();
        if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
          try {
            payload = JSON.parse(trimmed);
          } catch {
            payload = trimmed;
          }
        } else {
          payload = trimmed;
        }
      }
      const line =
        typeof payload === 'string'
          ? payload
          : typeof (payload as any)?.row === 'string'
            ? (payload as any).row
            : '';
      const normalized = String(line ?? '').trim();
      if (!normalized) return;
      const cells = splitCsvLine(normalized);
      if (cells.length < 5) return;
      wsBufferRef.current.push({
        transaction_id: cells[0] ?? '',
        sender_id: cells[1] ?? '',
        receiver_id: cells[2] ?? '',
        amount: cells[3] ?? '',
        timestamp: cells[4] ?? '',
      });
    };

    wsTimerRef.current = window.setInterval(() => {
      const batch = wsBufferRef.current;
      if (batch.length === 0) return;
      wsBufferRef.current = [];
      analysisStartRef.current = performance.now();
      workerRef.current?.postMessage({ rows: batch, source: 'ws', mode: 'append' });
    }, 1000);
  }, [splitCsvLine, wsUrl]);

  const disconnectWebSocket = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    if (wsTimerRef.current !== null) {
      window.clearInterval(wsTimerRef.current);
      wsTimerRef.current = null;
    }
    wsBufferRef.current = [];
    setWsStatus('disconnected');
  }, []);

  useEffect(() => {
    if (!wsShouldConnect) return;
    if (!wsUrl.trim()) {
      setWsShouldConnect(false);
      return;
    }
    connectWebSocket();
    setWsShouldConnect(false);
  }, [connectWebSocket, setWsShouldConnect, wsShouldConnect, wsUrl]);

  const handleResizeMove = (event: React.PointerEvent) => {
    if (!isResizingRef.current || !containerWrapRef.current || !paneRef.current) return;
    const rect = containerWrapRef.current.getBoundingClientRect();
    const minPx = rect.width * 0.2;
    const maxPx = rect.width * 0.6;
    const px = Math.min(maxPx, Math.max(minPx, rect.right - event.clientX));
    const pct = (px / rect.width) * 100;
    widthPctRef.current = pct;

    if (rafRef.current !== null) return;
    rafRef.current = window.requestAnimationFrame(() => {
      rafRef.current = null;
      if (!paneRef.current) return;
      paneRef.current.style.width = `${px}px`;
    });
  };

  const handleResizeEnd = () => {
    isResizingRef.current = false;
    setIsResizing(false);
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    setPaneWidthPct(widthPctRef.current);
    cyRef.current?.resize();
  };

  useEffect(() => {
    if (!paneRef.current) return;
    paneRef.current.style.width = `${paneWidthPct}%`;
    widthPctRef.current = paneWidthPct;
  }, [isCollapsed, paneWidthPct]);

  useEffect(() => {
    if (!connectedNodesPopup || !miniGraphRef.current) return;
    const cy = cytoscape({
      container: miniGraphRef.current,
      elements: [],
      style: [
        {
          selector: 'node',
          style: {
            'background-color': '#10b981',
            'border-color': '#334155',
            'border-width': 1,
            color: '#0f172a',
            label: 'data(label)',
            'font-size': 10,
            'text-background-color': '#ffffff',
            'text-background-opacity': 0.7,
            'text-background-padding': '2',
            'text-valign': 'bottom',
            'text-halign': 'center',
          },
        },
        {
          selector: 'node.center',
          style: {
            'border-width': 3,
            'border-color': '#ef4444',
          },
        },
        {
          selector: 'edge',
          style: {
            width: 1.4,
            'line-color': '#94a3b8',
            'target-arrow-color': '#94a3b8',
            'target-arrow-shape': 'triangle',
            'curve-style': 'bezier',
          },
        },
      ],
      layout: { name: 'grid', animate: false },
    });

    const cyMain = cyRef.current;
    const nodeIds = new Set(connectedNodesPopup.nodes);
    const nodes = Array.from(nodeIds).map((id) => ({
      data: { id, label: id },
      classes: id === connectedNodesPopup.id ? 'center' : '',
    }));

    const edges: { data: { id: string; source: string; target: string } }[] = [];
    if (cyMain) {
      cyMain.edges().forEach((e) => {
        const s = e.data('source');
        const t = e.data('target');
        if (nodeIds.has(s) && nodeIds.has(t)) {
          edges.push({ data: { id: `${s}→${t}`, source: s, target: t } });
        }
      });
    }

    cy.add([...nodes, ...edges]);
    cy.layout({ name: 'grid', animate: false }).run();
    miniCyRef.current = cy;

    return () => {
      cy.destroy();
      miniCyRef.current = null;
    };
  }, [connectedNodesPopup]);

  const handleResizeStart = (event: React.PointerEvent) => {
    isResizingRef.current = true;
    setIsResizing(true);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    cyRef.current?.resize();
  };

  const toggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      return next;
    });
    setTimeout(() => cyRef.current?.resize(), 0);
  };

  const updateZoomPct = () => {
    const cy = cyRef.current;
    if (!cy) return;
    setZoomPct(Math.round(cy.zoom() * 100));
  };

  const zoomTo = (level: number) => {
    const cy = cyRef.current;
    const container = containerRef.current;
    if (!cy || !container) return;
    const rect = container.getBoundingClientRect();
    const clamped = Math.min(4, Math.max(0.2, level));
    cy.zoom({ level: clamped, renderedPosition: { x: rect.width / 2, y: rect.height / 2 } });
    setZoomPct(Math.round(clamped * 100));
  };

  const handleDownloadJson = () => {
    if (!analysisJson) return;
    const blob = new Blob([JSON.stringify(analysisJson, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'muling-analysis.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const selectNodeById = (id: string) => {
    const cy = cyRef.current;
    if (!cy) return;
    const node = cy.getElementById(id);
    if (!node || node.empty()) return;
    cy.nodes().removeClass('selected-node');
    node.addClass('selected-node');
    const pos = node.renderedPosition();
    setSelectedNodeId(id);
    setPinnedInfo({ id, x: pos.x, y: pos.y });
    cy.edges().removeClass('selected-edge');
    setSelectedEdgeId(null);
    setPinnedEdgeInfo(null);
    setConnectedNodesPopup(null);
  };

  const selectNodesAndEdges = (
    memberSet: Set<string>,
    edgeMatch?: (source: string, target: string) => boolean,
    zoom?: boolean
  ) => {
    const cy = cyRef.current;
    if (!cy) return;
    cy.nodes().removeClass('selected-node');
    cy.edges().removeClass('selected-edge');
    const selected = cy.collection();
    memberSet.forEach((m) => {
      const node = cy.getElementById(m);
      node.addClass('selected-node');
      selected.merge(node);
    });
    cy.edges().forEach((e) => {
      const s = e.data('source');
      const t = e.data('target');
      if (edgeMatch) {
        if (edgeMatch(s, t)) {
          e.addClass('selected-edge');
          selected.merge(e);
        }
      } else if (memberSet.has(s) && memberSet.has(t)) {
        e.addClass('selected-edge');
        selected.merge(e);
      }
    });
    if (zoom && selected.length > 0) {
      cy.animate(
        {
          fit: {
            eles: selected,
            padding: 60,
          },
        },
        { duration: 400 }
      );
    }
  };

  const computeGroupStats = (
    members: string[],
    edgeMatch?: (source: string, target: string) => boolean
  ) => {
    const memberSet = new Set(members);
    let totalAmount = 0;
    let edgeCount = 0;
    Object.entries(edgeDetails).forEach(([key, detail]) => {
      const [s, t] = key.split('→');
      if (!s || !t) return;
      const inSet = memberSet.has(s) && memberSet.has(t);
      if (edgeMatch ? edgeMatch(s, t) : inSet) {
        totalAmount += detail.net;
        edgeCount += detail.count;
      }
    });
    let mostSuspicious: { id: string; score: number } | null = null;
    members.forEach((m) => {
      const d = nodeDetails[m];
      if (!d) return;
      if (!mostSuspicious || d.suspicion_score > mostSuspicious.score) {
        mostSuspicious = { id: m, score: d.suspicion_score };
      }
    });
    return {
      nodeCount: members.length,
      totalAmount: Number(totalAmount.toFixed(2)),
      transactionCount: edgeCount,
      mostSuspicious,
    };
  };

  return (
    <div className="min-h-screen w-screen bg-slate-100 font-sans selection:bg-emerald-100 selection:text-emerald-900">
      <div ref={containerWrapRef} className="h-screen w-screen flex">
        <div className="relative h-full flex-1">
          <div ref={containerRef} className="h-full w-full graph-grid" />
          <div className="absolute left-5 bottom-5 z-20 flex flex-col items-center rounded-2xl border border-slate-200 bg-white/90 shadow-lg backdrop-blur">
            <button
              type="button"
              className="px-3 py-2 text-sm font-bold text-slate-700 hover:text-emerald-600"
              onClick={() => {
                const cy = cyRef.current;
                if (!cy) return;
                zoomTo(cy.zoom() * 1.1);
              }}
              aria-label="Zoom in"
            >
              +
            </button>
            <button
              type="button"
              className="w-full border-y border-slate-200 px-3 py-2 text-[11px] font-semibold text-slate-600 hover:text-emerald-600"
              onClick={() => {
                const cy = cyRef.current;
                if (!cy) return;
                cy.fit(undefined, 60);
                updateZoomPct();
              }}
              aria-label="Fit all"
            >
              {zoomPct}%
            </button>
            <button
              type="button"
              className="px-3 py-2 text-sm font-bold text-slate-700 hover:text-emerald-600"
              onClick={() => {
                const cy = cyRef.current;
                if (!cy) return;
                zoomTo(cy.zoom() / 1.1);
              }}
              aria-label="Zoom out"
            >
              −
            </button>
          </div>
          {hoverInfo && nodeDetails[hoverInfo.id] && (
            <div
              className="absolute z-20 -translate-y-full rounded-md border border-slate-200 bg-white/90 px-2 py-1 text-[11px] text-slate-700 shadow"
              style={{ left: hoverInfo.x + 10, top: hoverInfo.y - 10 }}
            >
              {nodeDetails[hoverInfo.id].name} — SS {nodeDetails[hoverInfo.id].suspicion_score.toFixed(1)}%
            </div>
          )}
          {pinnedInfo && nodeDetails[pinnedInfo.id] && (
            <div
              className="absolute z-30 -translate-y-full rounded-lg border border-slate-200 bg-white/95 px-3 py-2 text-xs text-slate-700 shadow-lg"
              style={{ left: pinnedInfo.x + 12, top: pinnedInfo.y - 12 }}
              tabIndex={0}
              onBlur={() => setPinnedInfo(null)}
            >
              <div className="font-medium text-slate-900">
                {nodeDetails[pinnedInfo.id].name} (SS: {nodeDetails[pinnedInfo.id].suspicion_score.toFixed(1)}%)
              </div>
              <div className="mt-1">Net balance: {nodeDetails[pinnedInfo.id].net_balance}</div>
              <div>Credits: {nodeDetails[pinnedInfo.id].credits}</div>
              <div>Debits: {nodeDetails[pinnedInfo.id].debits}</div>
              {(() => {
                const rings = nodeDetails[pinnedInfo.id].rings || [];
                const smurfs = nodeDetails[pinnedInfo.id].smurfs || [];
                const shells = nodeDetails[pinnedInfo.id].shells || [];
                const total = rings.length + smurfs.length + shells.length;
                if (total === 0) return null;
                const showAll = total <= 3;
                const ringsShow = showAll ? rings : rings.slice(0, 3);
                const smurfsShow = showAll ? smurfs : smurfs.slice(0, 3);
                const shellsShow = showAll ? shells : shells.slice(0, 2);
                return (
                  <>
                    {ringsShow.length > 0 && (
                      <div className="mt-1">Rings: {ringsShow.join(', ')}</div>
                    )}
                    {smurfsShow.length > 0 && (
                      <div>Smurfing: {smurfsShow.join(', ')}</div>
                    )}
                    {shellsShow.length > 0 && (
                      <div>Shells: {shellsShow.join(', ')}</div>
                    )}
                  </>
                );
              })()}
              {nodeDetails[pinnedInfo.id].first_txn && (
                <div className="mt-1">
                  Time from: {new Date(nodeDetails[pinnedInfo.id].first_txn).toLocaleString()}
                </div>
              )}
              {nodeDetails[pinnedInfo.id].last_txn && (
                <div>
                  Time to: {new Date(nodeDetails[pinnedInfo.id].last_txn).toLocaleString()}
                </div>
              )}
            </div>
          )}
          {pinnedEdgeInfo && edgeDetails[pinnedEdgeInfo.id] && (
            <div
              className="absolute z-30 -translate-y-full rounded-lg border border-slate-200 bg-white/95 px-3 py-2 text-xs text-slate-700 shadow-lg"
              style={{ left: pinnedEdgeInfo.x + 12, top: pinnedEdgeInfo.y - 12 }}
              tabIndex={0}
              onBlur={() => setPinnedEdgeInfo(null)}
            >
              <div className="font-medium text-slate-900">Edge: {pinnedEdgeInfo.id}</div>
              <div className="mt-1">Net amount: {edgeDetails[pinnedEdgeInfo.id].net}</div>
              <div>Transactions: {edgeDetails[pinnedEdgeInfo.id].count}</div>
              {edgeDetails[pinnedEdgeInfo.id].first_txn && (
                <div className="mt-1">
                  Time from: {new Date(edgeDetails[pinnedEdgeInfo.id].first_txn).toLocaleString()}
                </div>
              )}
              {edgeDetails[pinnedEdgeInfo.id].last_txn && (
                <div>
                  Time to: {new Date(edgeDetails[pinnedEdgeInfo.id].last_txn).toLocaleString()}
                </div>
              )}
            </div>
          )}
          {connectedNodesPopup && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
              <div className="w-[900px] max-w-[95vw] h-[80vh] rounded-2xl border border-slate-200 bg-white shadow-xl overflow-hidden">
                <div className="flex items-center justify-between px-5 py-3 border-b border-slate-200">
                  <div className="text-sm font-bold text-slate-900">
                    {connectedNodesPopup.title}
                  </div>
                  <button
                    type="button"
                    className="px-3 py-1 rounded-full text-xs font-medium border border-slate-200 bg-white hover:bg-slate-50"
                    onClick={() => setConnectedNodesPopup(null)}
                  >
                    ✕
                  </button>
                </div>
                <div className="flex h-[calc(80vh-52px-56px)]">
                  <div className="flex-1 bg-slate-100">
                    <div ref={miniGraphRef} className="h-full w-full graph-grid" />
                  </div>
                  <div className="w-[320px] border-l border-slate-200 p-4 overflow-y-auto">
                    {nodeDetails[connectedNodesPopup.id] && (
                      <>
                        <div className="text-xs font-medium tracking-widest text-slate-400 mb-2">
                          NODE DETAILS
                        </div>
                        <div className="font-medium text-slate-900">
                          {nodeDetails[connectedNodesPopup.id].name} (SS:{' '}
                          {nodeDetails[connectedNodesPopup.id].suspicion_score.toFixed(1)}%)
                        </div>
                        <div className="mt-1">
                          Net balance: {nodeDetails[connectedNodesPopup.id].net_balance}
                        </div>
                        <div>Credits: {nodeDetails[connectedNodesPopup.id].credits}</div>
                        <div>Debits: {nodeDetails[connectedNodesPopup.id].debits}</div>
                        {nodeDetails[connectedNodesPopup.id].first_txn && (
                          <div className="mt-1">
                            Time from:{' '}
                            {new Date(nodeDetails[connectedNodesPopup.id].first_txn).toLocaleString()}
                          </div>
                        )}
                        {nodeDetails[connectedNodesPopup.id].last_txn && (
                          <div>
                            Time to:{' '}
                            {new Date(nodeDetails[connectedNodesPopup.id].last_txn).toLocaleString()}
                          </div>
                        )}
                      </>
                    )}
                    {(() => {
                      const stats = computeGroupStats(connectedNodesPopup.nodes);
                      return (
                        <div className="mt-4">
                          <div className="text-xs font-medium tracking-widest text-slate-400 mb-2">
                            GROUP STATS
                          </div>
                          <div>Nodes involved: {stats.nodeCount}</div>
                          <div>Total amount: {stats.totalAmount}</div>
                          <div>Transactions: {stats.transactionCount}</div>
                          {stats.mostSuspicious && (
                            <div>
                              Most suspicious: {stats.mostSuspicious.id} ({stats.mostSuspicious.score.toFixed(1)}%)
                            </div>
                          )}
                        </div>
                      );
                    })()}
                    <div className="mt-4 text-xs font-medium tracking-widest text-slate-400 mb-2">
                      CONNECTED NODES
                    </div>
                    {connectedNodesPopup.nodes.length === 0 ? (
                      <div className="text-slate-400">No connections</div>
                    ) : (
                      <ul className="space-y-1 text-sm text-slate-700">
                        {connectedNodesPopup.nodes.map((n) => (
                          <li key={n}>{n}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-end px-5 py-3 border-t border-slate-200 bg-white">
                  <button
                    type="button"
                    className="px-4 py-2 rounded-full text-xs font-medium border border-slate-200 bg-white hover:bg-slate-50"
                    onClick={() => setConnectedNodesPopup(null)}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}
          {suspicionDialog && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
              <div className="w-[420px] max-w-[92vw] rounded-2xl border border-slate-200 bg-white shadow-xl overflow-hidden">
                <div className="flex items-center justify-between px-5 py-3 border-b border-slate-200">
                  <div className="text-sm font-bold text-slate-900">
                    {suspicionDialog.title}
                  </div>
                  <button
                    type="button"
                    className="px-3 py-1 rounded-full text-xs font-medium border border-slate-200 bg-white hover:bg-slate-50"
                    onClick={() => setSuspicionDialog(null)}
                  >
                    ✕
                  </button>
                </div>
                <div className="px-5 py-4 text-xs text-slate-700 whitespace-pre-wrap">
                  {suspicionDialog.body}
                </div>
                <div className="flex items-center justify-end px-5 py-3 border-t border-slate-200 bg-white">
                  <button
                    type="button"
                    className="px-4 py-2 rounded-full text-xs font-medium border border-slate-200 bg-white hover:bg-slate-50"
                    onClick={() => setSuspicionDialog(null)}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        <div
          className="h-full flex-none"
          style={{
            width: isCollapsed ? '0%' : `${paneWidthPct}%`,
            minWidth: isCollapsed ? '0' : '240px',
          }}
        />

        <div
          ref={paneRef}
          className={cn(
            'fixed right-0 top-0 h-screen flex-none border-l border-slate-200 bg-white transition-all',
            'shadow-[-8px_0_24px_-12px_rgba(24,24,27,0.25)]',
            'transition-[transform,padding] duration-300 ease-in-out',
            isCollapsed ? 'p-0 overflow-hidden pointer-events-none' : 'p-6'
          )}
          style={{
            width: `${paneWidthPct}%`,
            minWidth: '240px',
            transform: isCollapsed ? 'translate3d(100%, 0, 0)' : 'translate3d(0, 0, 0)',
            willChange: 'transform, padding',
          }}
        >
          {!isCollapsed && (
            <div
              role="separator"
              aria-orientation="vertical"
              className={cn(
                'absolute left-0 top-0 h-full w-3 -translate-x-full cursor-col-resize',
                'bg-transparent transition-colors flex items-center touch-none group',
                'hover:bg-emerald-100/60'
              )}
              onPointerDown={handleResizeStart}
            >
              <div className="mx-auto h-20 w-1.5 rounded-full bg-slate-300 group-hover:bg-emerald-400/70 transition-colors" />
            </div>
          )}
          <div className="h-full w-full rounded-2xl bg-white flex flex-col">
            <div className="min-h-0 flex-1 overflow-y-auto pr-4 scrollbar-slim">
              <div className="mb-8 px-1 space-y-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-8 w-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <AlertTriangle className="h-4 w-4" />
                  </div>
                  <div className="text-sm font-semibold tracking-wide text-emerald-700">
                    IDENTIFIED MULING
                  </div>
                </div>
                <div className="mb-4 h-px w-full bg-emerald-100" />
                {analysisError && (
                  <div className="mb-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                    {analysisError}
                  </div>
                )}
              <div className="text-sm text-slate-700">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 mb-4 tracking-medium">
  <Activity className="h-5 w-5 text-amber-500" />
  <span>Suspicion Scores</span>
</div>
                {suspiciousAccounts.length === 0 ? (
                  <div className="text-slate-400 text-sm py-2">None detected</div>
                ) : (
                    <ol className="list-decimal list-inside space-y-2">
                      {suspiciousAccounts.map((acc) => (
                        <li key={acc.account_id} className="text-slate-700">
                          <button
                            type="button"
                            className="text-left hover:text-emerald-600 transition-colors font-medium text-sm"
                            onClick={() => {
                              selectNodeById(acc.account_id);
                            }}
                            onDoubleClick={() => {
                              const msg =
                                suspicionExplanations[acc.account_id] ||
                                `Account: ${acc.account_id}\nScore: ${acc.suspicion_score.toFixed(1)}/100`;
                              setSuspicionDialog({
                                title: `Suspicion Score: ${acc.account_id}`,
                                body: msg,
                              });
                            }}
                          >
                            {acc.account_id} — <span className="text-red-600 font-semibold">{acc.suspicion_score.toFixed(1)}</span>
                          </button>
                        </li>
                      ))}
                    </ol>
                  )}
                  <div className="mt-8 pt-6 border-t border-slate-200 flex items-center gap-2 text-sm font-semibold text-slate-900 tracking-medium">
  <Network className="h-5 w-5 text-violet-500" />
  <span>Rings</span>
</div>
                  {fraudRings.filter((r) => r.pattern_type === 'cycle').length === 0 ? (
                    <div className="text-slate-400 text-sm py-2">None detected</div>
                  ) : (
                    <ol className="list-decimal list-inside space-y-3 mt-3">
                      {fraudRings
                        .filter((r) => r.pattern_type === 'cycle')
                        .map((r, idx) => {
                        const ringId = r.ring_id;
                        const ring = ringDisplays[ringId] || r.member_accounts.join(' → ');
                        return (
                          <li key={`${ring}-${idx}`} className="flex items-start justify-between gap-2 text-slate-700 py-1.5">
                            <button
                              type="button"
                              className="text-left hover:text-emerald-600 transition-colors font-medium text-sm"
                              onClick={() => {
                                const members = ringMembers[ringId] || [];
                                const memberSet = new Set(members);
                                selectNodesAndEdges(memberSet, undefined, false);
                              }}
                              onDoubleClick={() => {
                                const members = ringMembers[ringId] || [];
                                const memberSet = new Set(members);
                                selectNodesAndEdges(memberSet, undefined, true);
                              }}
                            >
                              {ring}
                            </button>
                            <button
                              type="button"
                              className="mt-0.5 text-slate-400 hover:text-slate-700 transition-colors"
                              onClick={() => {
                                const members = ringMembers[ringId] || [];
                                setConnectedNodesPopup({
                                  id: ringId,
                                  title: `Ring ${ringId}`,
                                  nodes: members,
                                  x: 0,
                                  y: 0,
                                });
                              }}
                              aria-label="Open ring graph"
                            >
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                                <path
                                  d="M14 5h5v5M9 15l10-10M19 14v5H5V5h5"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                            </button>
                          </li>
                        );
                      })}
                    </ol>
                  )}
                  <div className="mt-8 pt-6 border-t border-slate-200 flex items-center gap-2 text-sm font-semibold text-slate-900 tracking-medium">
  <TableIcon className="h-5 w-5 text-slate-500" />
  <span>Fraud Ring Summary</span>
</div>
                  {fraudRings.length === 0 ? (
                    <div className="text-slate-400 text-sm py-2">None detected</div>
                  ) : (
                    <div className="mt-4 border border-slate-200 rounded-lg overflow-hidden text-xs text-slate-700">
                      <div className="grid grid-cols-5 gap-2 bg-slate-50 px-4 py-3 font-semibold text-slate-700 border-b border-slate-200">
                        <div>Ring ID</div>
                        <div>Pattern</div>
                        <div>Members</div>
                        <div>Risk</div>
                        <div>Accounts</div>
                      </div>
                      <div className="max-h-64 overflow-y-auto">
                        {fraudRings.map((r, idx) => {
                          const isHighRisk = r.risk_score >= 80;
                          return (
                            <div
                              key={r.ring_id}
                              className={cn(
                                'grid grid-cols-5 gap-2 px-4 py-3 border-t border-slate-100 transition-colors',
                                idx % 2 === 1 && 'bg-slate-50/50',
                                isHighRisk && 'bg-red-50/80 text-red-700'
                              )}
                            >
                              <div className="font-semibold text-red-600">{r.ring_id}</div>
                              <div>{r.pattern_type}</div>
                              <div>{r.member_accounts.length}</div>
                              <div>{r.risk_score.toFixed(1)}</div>
                              <div className="truncate" title={r.member_accounts.join(', ')}>
                                {r.member_accounts.join(', ')}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                <div className="mt-8 pt-6 border-t border-slate-200 flex items-center gap-2 text-sm font-semibold text-slate-900 tracking-medium">
  <Shuffle className="h-5 w-5 text-slate-500" />
  <span>Smurfing</span>
</div>
                <div className="mt-4 text-slate-500 text-xs uppercase tracking-wider font-medium">Fan-in</div>
                    {fanInGroups.length === 0 ? (
                      <div className="text-slate-400 text-sm py-2">None detected</div>
                    ) : (
                      <ol className="list-decimal list-inside space-y-2 mt-2">
                        {fanInGroups.map((item, idx) => (
                          <li key={`fanin-${idx}`} className="flex items-start justify-between gap-2 text-slate-700">
                            <button
                              type="button"
                              className="text-left hover:text-emerald-600 transition-colors font-medium text-sm"
                              onClick={() => {
                                const parts = item.split('←').map((p) => p.trim());
                                if (parts.length !== 2) return;
                                const receiver = parts[0];
                                const senders = parts[1].split(',').map((s) => s.trim()).filter(Boolean);
                                const memberSet = new Set([receiver, ...senders]);
                                selectNodesAndEdges(memberSet, (s, t) => senders.includes(s) && t === receiver, false);
                              }}
                              onDoubleClick={() => {
                                const parts = item.split('←').map((p) => p.trim());
                                if (parts.length !== 2) return;
                                const receiver = parts[0];
                                const senders = parts[1].split(',').map((s) => s.trim()).filter(Boolean);
                                const memberSet = new Set([receiver, ...senders]);
                                selectNodesAndEdges(memberSet, (s, t) => senders.includes(s) && t === receiver, true);
                              }}
                            >
                              {item}
                            </button>
                            <button
                              type="button"
                              className="mt-0.5 text-slate-400 hover:text-slate-700 transition-colors"
                              onClick={() => {
                                const parts = item.split('←').map((p) => p.trim());
                                if (parts.length !== 2) return;
                                const receiver = parts[0];
                                const senders = parts[1].split(',').map((s) => s.trim()).filter(Boolean);
                                setConnectedNodesPopup({
                                  id: `SMURF_IN_${idx + 1}`,
                                  title: `Smurfing Fan-In ${idx + 1}`,
                                  nodes: [receiver, ...senders],
                                  x: 0,
                                  y: 0,
                                });
                              }}
                              aria-label="Open smurfing graph"
                            >
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                                <path
                                  d="M14 5h5v5M9 15l10-10M19 14v5H5V5h5"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                            </button>
                          </li>
                        ))}
                      </ol>
                    )}
                <div className="mt-5 text-slate-500 text-xs uppercase tracking-wider font-medium">Fan-out</div>
                    {fanOutGroups.length === 0 ? (
                      <div className="text-slate-400 text-sm py-2">None detected</div>
                    ) : (
                      <ol className="list-decimal list-inside space-y-2 mt-2">
                        {fanOutGroups.map((item, idx) => (
                          <li key={`fanout-${idx}`} className="flex items-start justify-between gap-2 text-slate-700">
                            <button
                              type="button"
                              className="text-left hover:text-emerald-600 transition-colors font-medium text-sm"
                              onClick={() => {
                                const parts = item.split('→').map((p) => p.trim());
                                if (parts.length !== 2) return;
                                const sender = parts[0];
                                const receivers = parts[1].split(',').map((s) => s.trim()).filter(Boolean);
                                const memberSet = new Set([sender, ...receivers]);
                                selectNodesAndEdges(memberSet, (s, t) => s === sender && receivers.includes(t), false);
                              }}
                              onDoubleClick={() => {
                                const parts = item.split('→').map((p) => p.trim());
                                if (parts.length !== 2) return;
                                const sender = parts[0];
                                const receivers = parts[1].split(',').map((s) => s.trim()).filter(Boolean);
                                const memberSet = new Set([sender, ...receivers]);
                                selectNodesAndEdges(memberSet, (s, t) => s === sender && receivers.includes(t), true);
                              }}
                            >
                              {item}
                            </button>
                            <button
                              type="button"
                              className="mt-0.5 text-slate-400 hover:text-slate-700 transition-colors"
                              onClick={() => {
                                const parts = item.split('→').map((p) => p.trim());
                                if (parts.length !== 2) return;
                                const sender = parts[0];
                                const receivers = parts[1].split(',').map((s) => s.trim()).filter(Boolean);
                                setConnectedNodesPopup({
                                  id: `SMURF_OUT_${idx + 1}`,
                                  title: `Smurfing Fan-Out ${idx + 1}`,
                                  nodes: [sender, ...receivers],
                                  x: 0,
                                  y: 0,
                                });
                              }}
                              aria-label="Open smurfing graph"
                            >
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                                <path
                                  d="M14 5h5v5M9 15l10-10M19 14v5H5V5h5"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                            </button>
                          </li>
                        ))}
                      </ol>
                    )}
                <div className="mt-8 pt-6 border-t border-slate-200 flex items-center gap-2 text-sm font-semibold text-slate-900 tracking-medium">
  <Layers className="h-5 w-5 text-slate-500" />
  <span>Layered Shell Networks</span>
</div>
                    {shellChains.length === 0 ? (
                      <div className="text-slate-400 text-sm py-2">None detected</div>
                    ) : (
                      <ol className="list-decimal list-inside space-y-3 mt-3">
                        {shellChains.map((item, idx) => (
                          <li key={`shell-${idx}`} className="flex items-start justify-between gap-2 text-slate-700 py-1.5">
                            <button
                              type="button"
                              className="text-left hover:text-emerald-600 transition-colors font-medium text-sm"
                              onClick={() => {
                                const nodes = item.split('→').map((p) => p.trim()).filter(Boolean);
                                const memberSet = new Set(nodes);
                                selectNodesAndEdges(memberSet, (s, t) => {
                                  const i = nodes.indexOf(s);
                                  return i !== -1 && nodes[i + 1] === t;
                                }, false);
                              }}
                              onDoubleClick={() => {
                                const nodes = item.split('→').map((p) => p.trim()).filter(Boolean);
                                const memberSet = new Set(nodes);
                                selectNodesAndEdges(memberSet, (s, t) => {
                                  const i = nodes.indexOf(s);
                                  return i !== -1 && nodes[i + 1] === t;
                                }, true);
                              }}
                            >
                              {item}
                            </button>
                            <button
                              type="button"
                              className="mt-0.5 text-slate-400 hover:text-slate-700 transition-colors"
                              onClick={() => {
                                const nodes = item.split('→').map((p) => p.trim()).filter(Boolean);
                                setConnectedNodesPopup({
                                  id: `SHELL_${idx + 1}`,
                                  title: `Shell Chain ${idx + 1}`,
                                  nodes,
                                  x: 0,
                                  y: 0,
                                });
                              }}
                              aria-label="Open shell graph"
                            >
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                                <path
                                  d="M14 5h5v5M9 15l10-10M19 14v5H5V5h5"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                            </button>
                          </li>
                        ))}
                      </ol>
                    )}
              </div>
            </div>
            </div>
            <div className="mt-auto pt-6 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
              <div>
                Time:{' '}
                {analysisMs === null
                  ? '—'
                  : `${(analysisMs / 1000).toFixed(analysisMs % 1000 === 0 ? 0 : 1)}s`}
              </div>
              <button
                onClick={handleDownloadJson}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium',
                  'bg-emerald-600 text-white shadow-md shadow-emerald-200/60 hover:bg-emerald-700 hover:shadow-emerald-300/70 transition-colors',
                  !analysisJson && 'opacity-50 cursor-not-allowed shadow-none'
                )}
                disabled={!analysisJson}
              >
                <Download className="h-4 w-4" />
                Download JSON
              </button>
            </div>
          </div>
        </div>
      </div>

      {isResizing && (
        <div
          className="fixed inset-0 z-40 cursor-col-resize"
          onPointerMove={handleResizeMove}
          onPointerUp={handleResizeEnd}
          onPointerCancel={handleResizeEnd}
        />
      )}

      <button
        onClick={toggleCollapse}
        className={cn(
          'absolute top-6 right-6 z-10 px-3 py-2 rounded-full text-xs font-medium border border-slate-200',
          'bg-white/90 backdrop-blur-md hover:bg-white transition-all'
        )}
      >
        {isCollapsed ? 'Expand Panel' : 'Collapse Panel'}
      </button>
    </div>
  );
}


function NotFoundPage() {
  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center px-6">
      <div className="text-center">
        <div className="text-xs font-medium tracking-widest text-slate-400 mb-2">404</div>
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Page not found</h1>
        <p className="text-sm text-slate-500">The page you are looking for doesn’t exist.</p>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/graph" element={<GraphPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
