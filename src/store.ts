import { create } from 'zustand';

type NodeDetail = {
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
};

type EdgeDetail = {
  net: number;
  count: number;
  first_txn: string | null;
  last_txn: string | null;
};

type SuspiciousAccount = {
  account_id: string;
  suspicion_score: number;
  detected_patterns: string[];
  ring_id: string;
};

type AnalysisState = {
  detectionSummary: { rings: number; smurfing: number; layered: number };
  ringPaths: string[];
  fanInGroups: string[];
  fanOutGroups: string[];
  shellChains: string[];
  ringMembers: Record<string, string[]>;
  analysisMs: number | null;
  analysisError: string | null;
  analysisJson: Record<string, unknown> | null;
  suspiciousAccounts: SuspiciousAccount[];
  suspicionExplanations: Record<string, string>;
  nodeDetails: Record<string, NodeDetail>;
  edgeDetails: Record<string, EdgeDetail>;
  selectedNodeId: string | null;
  selectedEdgeId: string | null;
  pinnedNode: { id: string; x: number; y: number } | null;
  pinnedEdge: { id: string; x: number; y: number } | null;
  connectedNodesPopup: { id: string; title: string; nodes: string[]; x: number; y: number } | null;
  setAnalysisMs: (ms: number | null) => void;
  setAnalysisError: (msg: string | null) => void;
  setAnalysisJson: (payload: Record<string, unknown> | null) => void;
  setDetectionSummary: (summary: { rings: number; smurfing: number; layered: number }) => void;
  setRingPaths: (paths: string[]) => void;
  setFanInGroups: (groups: string[]) => void;
  setFanOutGroups: (groups: string[]) => void;
  setShellChains: (chains: string[]) => void;
  setRingMembers: (members: Record<string, string[]>) => void;
  setSuspiciousAccounts: (list: SuspiciousAccount[]) => void;
  setSuspicionExplanations: (data: Record<string, string>) => void;
  setNodeDetails: (data: Record<string, NodeDetail>) => void;
  setEdgeDetails: (data: Record<string, EdgeDetail>) => void;
  setSelectedNodeId: (id: string | null) => void;
  setSelectedEdgeId: (id: string | null) => void;
  setPinnedNode: (data: { id: string; x: number; y: number } | null) => void;
  setPinnedEdge: (data: { id: string; x: number; y: number } | null) => void;
  setConnectedNodesPopup: (data: { id: string; title: string; nodes: string[]; x: number; y: number } | null) => void;
};

export const useAnalysisStore = create<AnalysisState>((set) => ({
  detectionSummary: { rings: 0, smurfing: 0, layered: 0 },
  ringPaths: [],
  fanInGroups: [],
  fanOutGroups: [],
  shellChains: [],
  ringMembers: {},
  analysisMs: null,
  analysisError: null,
  analysisJson: null,
  suspiciousAccounts: [],
  suspicionExplanations: {},
  nodeDetails: {},
  edgeDetails: {},
  selectedNodeId: null,
  selectedEdgeId: null,
  pinnedNode: null,
  pinnedEdge: null,
  connectedNodesPopup: null,
  setAnalysisMs: (analysisMs) => set({ analysisMs }),
  setAnalysisError: (analysisError) => set({ analysisError }),
  setAnalysisJson: (analysisJson) => set({ analysisJson }),
  setDetectionSummary: (detectionSummary) => set({ detectionSummary }),
  setRingPaths: (ringPaths) => set({ ringPaths }),
  setFanInGroups: (fanInGroups) => set({ fanInGroups }),
  setFanOutGroups: (fanOutGroups) => set({ fanOutGroups }),
  setShellChains: (shellChains) => set({ shellChains }),
  setRingMembers: (ringMembers) => set({ ringMembers }),
  setSuspiciousAccounts: (suspiciousAccounts) => set({ suspiciousAccounts }),
  setSuspicionExplanations: (suspicionExplanations) => set({ suspicionExplanations }),
  setNodeDetails: (nodeDetails) => set({ nodeDetails }),
  setEdgeDetails: (edgeDetails) => set({ edgeDetails }),
  setSelectedNodeId: (selectedNodeId) => set({ selectedNodeId }),
  setSelectedEdgeId: (selectedEdgeId) => set({ selectedEdgeId }),
  setPinnedNode: (pinnedNode) => set({ pinnedNode }),
  setPinnedEdge: (pinnedEdge) => set({ pinnedEdge }),
  setConnectedNodesPopup: (connectedNodesPopup) => set({ connectedNodesPopup }),
}));
