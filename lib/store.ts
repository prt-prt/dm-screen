import { create } from 'zustand';
import { CanvasScene, CanvasNode, CanvasViewport } from '@/types/canvas';
import { Node, Edge } from 'reactflow';

interface CanvasState {
  // Scene management
  scenes: CanvasScene[];
  currentSceneId: string;

  // Nodes
  nodes: Node[];
  edges: Edge[];

  // Viewport
  viewport: CanvasViewport;

  // UI state
  gridSnap: boolean;
  selectedNodeId: string | null;

  // Modal state
  modalOpen: boolean;
  modalModuleId: string | null;
  modalModuleType: string | null;

  // Refresh counter - incremented when data changes that modules should refetch
  refreshCounter: number;

  // Actions
  setScenes: (scenes: CanvasScene[]) => void;
  setCurrentScene: (sceneId: string) => void;
  addScene: (scene: CanvasScene) => void;
  updateScene: (sceneId: string, updates: Partial<CanvasScene>) => void;
  deleteScene: (sceneId: string) => void;

  setNodes: (nodes: Node[]) => void;
  addNode: (node: Node) => void;
  updateNode: (nodeId: string, updates: Partial<Node>) => void;
  deleteNode: (nodeId: string) => void;

  setViewport: (viewport: CanvasViewport) => void;
  setGridSnap: (enabled: boolean) => void;
  setSelectedNode: (nodeId: string | null) => void;

  openModal: (moduleId: string, moduleType: string) => void;
  closeModal: () => void;
  triggerRefresh: () => void;
}

export const useCanvasStore = create<CanvasState>((set, get) => ({
  // Initial state
  scenes: [],
  currentSceneId: 'default',
  nodes: [],
  edges: [],
  viewport: { x: 0, y: 0, zoom: 1 },
  gridSnap: true,
  selectedNodeId: null,
  modalOpen: false,
  modalModuleId: null,
  modalModuleType: null,
  refreshCounter: 0,

  // Scene actions
  setScenes: (scenes) => set({ scenes }),

  setCurrentScene: (sceneId) => set({ currentSceneId: sceneId }),

  addScene: (scene) => set((state) => ({
    scenes: [...state.scenes, scene],
  })),

  updateScene: (sceneId, updates) => set((state) => ({
    scenes: state.scenes.map((s) =>
      s.id === sceneId ? { ...s, ...updates } : s
    ),
  })),

  deleteScene: (sceneId) => set((state) => ({
    scenes: state.scenes.filter((s) => s.id !== sceneId),
  })),

  // Node actions
  setNodes: (nodes) => set({ nodes }),

  addNode: (node) => set((state) => ({
    nodes: [...state.nodes, node],
  })),

  updateNode: (nodeId, updates) => set((state) => ({
    nodes: state.nodes.map((n) =>
      n.id === nodeId ? { ...n, ...updates } : n
    ),
  })),

  deleteNode: (nodeId) => set((state) => ({
    nodes: state.nodes.filter((n) => n.id !== nodeId),
    selectedNodeId: state.selectedNodeId === nodeId ? null : state.selectedNodeId,
  })),

  // Viewport actions
  setViewport: (viewport) => set({ viewport }),

  setGridSnap: (enabled) => set({ gridSnap: enabled }),

  setSelectedNode: (nodeId) => set({ selectedNodeId: nodeId }),

  // Modal actions
  openModal: (moduleId, moduleType) => set({
    modalOpen: true,
    modalModuleId: moduleId,
    modalModuleType: moduleType,
  }),

  closeModal: () => set({
    modalOpen: false,
    modalModuleId: null,
    modalModuleType: null,
  }),

  triggerRefresh: () => set((state) => ({
    refreshCounter: state.refreshCounter + 1,
  })),
}));
