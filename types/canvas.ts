import { ModuleType } from './modules';
export type { ModuleType } from './modules';

export interface CanvasViewport {
  x: number;
  y: number;
  zoom: number;
}

export interface CanvasScene {
  id: string;
  name: string;
  viewport: CanvasViewport;
  createdAt: string;
  updatedAt: string;
}

export interface CanvasNodeData {
  referenceId?: string;
  config: Record<string, unknown>;
  label?: string;
}

export interface CanvasNode {
  id: string;
  sceneId: string;
  type: ModuleType;
  position: { x: number; y: number };
  width: number;
  height: number;
  data: CanvasNodeData;
}

export interface ModuleSize {
  width: number;
  height: number;
}

export const DEFAULT_MODULE_SIZES: Record<ModuleType, ModuleSize> = {
  'note': { width: 280, height: 200 },
  'statblock': { width: 320, height: 400 },
  'audio-channel': { width: 200, height: 120 },
  'audio-scene': { width: 300, height: 200 },
  'initiative': { width: 320, height: 400 },
  'calculator': { width: 240, height: 180 },
};

export const MIN_MODULE_SIZE = { width: 150, height: 100 };
export const MAX_MODULE_SIZE = { width: 800, height: 800 };
export const GRID_SIZE = 20;
