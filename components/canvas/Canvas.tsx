'use client';

import { useCallback, useEffect, useState } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  Node,
  NodeChange,
  applyNodeChanges,
  useReactFlow,
  ReactFlowProvider,
  BackgroundVariant,
} from 'reactflow';
import 'reactflow/dist/style.css';
import './canvas.css';

import { useCanvasStore } from '@/lib/store';
import { ModuleType, DEFAULT_MODULE_SIZES, GRID_SIZE } from '@/types/canvas';
import { MODULE_COLORS, COLLISION_GAP, COLLISION_MAX_RADIUS } from '@/lib/constants';
import { NoteModule } from '@/components/modules/NoteModule';
import { StatblockModule } from '@/components/modules/StatblockModule';
import { AudioChannelModule } from '@/components/modules/AudioChannelModule';
import { AudioSceneModule } from '@/components/modules/AudioSceneModule';
import { InitiativeModule } from '@/components/modules/InitiativeModule';
import { CalculatorModule } from '@/components/modules/CalculatorModule';
import { CanvasControls } from './CanvasControls';
import { ModuleToolbar } from './ModuleToolbar';

const nodeTypes = {
  'note': NoteModule,
  'statblock': StatblockModule,
  'audio-channel': AudioChannelModule,
  'audio-scene': AudioSceneModule,
  'initiative': InitiativeModule,
  'calculator': CalculatorModule,
};

// Helper to get node dimensions
function getNodeBounds(node: Node) {
  const width = (node.style?.width as number) || 200;
  const height = (node.style?.height as number) || 150;
  return {
    left: node.position.x,
    right: node.position.x + width,
    top: node.position.y,
    bottom: node.position.y + height,
    width,
    height,
  };
}

// Check if two nodes overlap
function nodesOverlap(a: Node, b: Node, gap = 10): boolean {
  const boundsA = getNodeBounds(a);
  const boundsB = getNodeBounds(b);
  return !(
    boundsA.right + gap <= boundsB.left ||
    boundsA.left >= boundsB.right + gap ||
    boundsA.bottom + gap <= boundsB.top ||
    boundsA.top >= boundsB.bottom + gap
  );
}

// Check if a position would cause any overlap with other nodes
function hasCollision(
  nodeId: string,
  position: { x: number; y: number },
  width: number,
  height: number,
  otherNodes: Node[],
  gap: number
): boolean {
  const testNode = {
    id: nodeId,
    position,
    style: { width, height },
  } as Node;

  return otherNodes.some(
    (other) => other.id !== nodeId && nodesOverlap(testNode, other, gap)
  );
}

// Generate all candidate positions adjacent to existing nodes
function getCandidatePositions(
  draggedNode: Node,
  otherNodes: Node[],
  gridSize: number,
  gap: number
): { x: number; y: number }[] {
  const candidates: { x: number; y: number }[] = [];
  const draggedBounds = getNodeBounds(draggedNode);

  // For each other node, generate 4 candidate positions (one on each side)
  for (const other of otherNodes) {
    if (other.id === draggedNode.id) continue;

    const otherBounds = getNodeBounds(other);

    // Left of the other node
    candidates.push({
      x: Math.round((otherBounds.left - draggedBounds.width - gap) / gridSize) * gridSize,
      y: Math.round(other.position.y / gridSize) * gridSize,
    });

    // Right of the other node
    candidates.push({
      x: Math.round((otherBounds.right + gap) / gridSize) * gridSize,
      y: Math.round(other.position.y / gridSize) * gridSize,
    });

    // Above the other node
    candidates.push({
      x: Math.round(other.position.x / gridSize) * gridSize,
      y: Math.round((otherBounds.top - draggedBounds.height - gap) / gridSize) * gridSize,
    });

    // Below the other node
    candidates.push({
      x: Math.round(other.position.x / gridSize) * gridSize,
      y: Math.round((otherBounds.bottom + gap) / gridSize) * gridSize,
    });
  }

  return candidates;
}

// Find non-overlapping position
function resolveCollision(
  draggedNode: Node,
  otherNodes: Node[],
  gridSize: number
): { x: number; y: number } {
  const gap = COLLISION_GAP;
  const originalPosition = { ...draggedNode.position };
  const draggedBounds = getNodeBounds(draggedNode);

  // Check if original position has no collision
  if (!hasCollision(draggedNode.id, originalPosition, draggedBounds.width, draggedBounds.height, otherNodes, gap)) {
    return originalPosition;
  }

  // Generate all candidate positions adjacent to other nodes
  const candidates = getCandidatePositions(draggedNode, otherNodes, gridSize, gap);

  // Also add the snapped original position as a candidate
  candidates.unshift(originalPosition);

  // Filter to only valid (non-overlapping) positions
  const validCandidates = candidates.filter(
    (pos) => !hasCollision(draggedNode.id, pos, draggedBounds.width, draggedBounds.height, otherNodes, gap)
  );

  if (validCandidates.length === 0) {
    // If no valid candidates found, try a spiral search outward from original position
    return findFreePositionSpiral(draggedNode, otherNodes, gridSize, gap);
  }

  // Find the closest valid position to the original drop location
  let closestPosition = validCandidates[0];
  let closestDist = Math.hypot(
    closestPosition.x - originalPosition.x,
    closestPosition.y - originalPosition.y
  );

  for (const pos of validCandidates) {
    const dist = Math.hypot(pos.x - originalPosition.x, pos.y - originalPosition.y);
    if (dist < closestDist) {
      closestDist = dist;
      closestPosition = pos;
    }
  }

  return closestPosition;
}

// Spiral search to find a free position when all adjacent spots are taken
function findFreePositionSpiral(
  draggedNode: Node,
  otherNodes: Node[],
  gridSize: number,
  gap: number
): { x: number; y: number } {
  const draggedBounds = getNodeBounds(draggedNode);
  const startX = Math.round(draggedNode.position.x / gridSize) * gridSize;
  const startY = Math.round(draggedNode.position.y / gridSize) * gridSize;

  // Spiral outward from the original position
  const maxRadius = COLLISION_MAX_RADIUS;
  for (let radius = 1; radius <= maxRadius; radius++) {
    const step = gridSize * radius;

    // Check positions in a square ring around the original position
    for (let dx = -step; dx <= step; dx += gridSize) {
      for (let dy = -step; dy <= step; dy += gridSize) {
        // Only check the outer ring of the current radius
        if (Math.abs(dx) !== step && Math.abs(dy) !== step) continue;

        const testPos = { x: startX + dx, y: startY + dy };
        if (!hasCollision(draggedNode.id, testPos, draggedBounds.width, draggedBounds.height, otherNodes, gap)) {
          return testPos;
        }
      }
    }
  }

  // Fallback: return original position if no free spot found (shouldn't happen)
  return { x: startX, y: startY };
}

function CanvasInner() {
  const { nodes, setNodes, setViewport, gridSnap, currentSceneId } = useCanvasStore();
  const { screenToFlowPosition, setViewport: setReactFlowViewport } = useReactFlow();
  const [isLoaded, setIsLoaded] = useState(false);

  // Load scene data (nodes + viewport) when scene changes
  useEffect(() => {
    async function loadScene() {
      setIsLoaded(false);
      try {
        // Load both scene info (for viewport) and nodes in parallel
        const [sceneRes, nodesRes] = await Promise.all([
          fetch(`/api/scenes/${currentSceneId}`),
          fetch(`/api/scenes/${currentSceneId}/nodes`),
        ]);

        if (sceneRes.ok) {
          const sceneData = await sceneRes.json();
          const viewport = sceneData.scene?.viewport || { x: 0, y: 0, zoom: 1 };
          setViewport(viewport);
          // Use ReactFlow's setViewport to actually move the canvas
          setReactFlowViewport(viewport, { duration: 0 });
        }

        if (nodesRes.ok) {
          const nodesData = await nodesRes.json();
          setNodes(nodesData.nodes || []);
        }
      } catch (error) {
        console.error('Failed to load scene:', error);
      } finally {
        setIsLoaded(true);
      }
    }
    loadScene();
  }, [currentSceneId, setNodes, setViewport, setReactFlowViewport]);

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      let updatedNodes = applyNodeChanges(changes, nodes);
      const gridSize = GRID_SIZE;

      // Handle position changes when dropping (drag ended)
      changes.forEach((change) => {
        if (change.type === 'position' && change.dragging === false) {
          const nodeIndex = updatedNodes.findIndex((n) => n.id === change.id);
          if (nodeIndex !== -1) {
            const node = updatedNodes[nodeIndex];

            // First snap to grid if enabled
            let finalPosition = gridSnap
              ? {
                x: Math.round(node.position.x / gridSize) * gridSize,
                y: Math.round(node.position.y / gridSize) * gridSize,
              }
              : { ...node.position };

            // Then resolve any collisions
            const nodeWithSnappedPos = { ...node, position: finalPosition };
            finalPosition = resolveCollision(nodeWithSnappedPos, updatedNodes, gridSize);

            updatedNodes = [
              ...updatedNodes.slice(0, nodeIndex),
              { ...node, position: finalPosition },
              ...updatedNodes.slice(nodeIndex + 1),
            ];

            // Save to backend
            fetch(`/api/scenes/${currentSceneId}/nodes/${node.id}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ position: finalPosition }),
            }).catch((error) => console.error('Failed to save node position:', error));
          }
        }
      });

      setNodes(updatedNodes);
    },
    [nodes, setNodes, currentSceneId, gridSnap]
  );

  const onMoveEnd = useCallback(
    (_: unknown, vp: { x: number; y: number; zoom: number }) => {
      setViewport(vp);
      fetch(`/api/scenes/${currentSceneId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ viewport: vp }),
      }).catch((error) => console.error('Failed to save viewport:', error));
    },
    [currentSceneId, setViewport]
  );

  const addModule = useCallback(
    async (type: ModuleType) => {
      const id = crypto.randomUUID();
      const defaultSize = DEFAULT_MODULE_SIZES[type];
      const gridSize = GRID_SIZE;

      let position = screenToFlowPosition({
        x: window.innerWidth / 2,
        y: window.innerHeight / 2,
      });

      // Snap to grid
      position = {
        x: Math.round(position.x / gridSize) * gridSize,
        y: Math.round(position.y / gridSize) * gridSize,
      };

      const newNode: Node = {
        id,
        type,
        position,
        data: {
          referenceId: null,
          config: {},
          label: type.charAt(0).toUpperCase() + type.slice(1),
        },
        style: {
          width: defaultSize.width,
          height: defaultSize.height,
        },
      };

      // Resolve collisions with existing nodes
      const finalPosition = resolveCollision(newNode, nodes, gridSize);
      newNode.position = finalPosition;

      try {
        await fetch(`/api/scenes/${currentSceneId}/nodes`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id,
            type,
            position: finalPosition,
            width: defaultSize.width,
            height: defaultSize.height,
            data: newNode.data,
          }),
        });
        setNodes([...nodes, newNode]);
      } catch (error) {
        console.error('Failed to add module:', error);
      }
    },
    [currentSceneId, nodes, setNodes, screenToFlowPosition]
  );

  const onNodesDelete = useCallback(
    (deletedNodes: Node[]) => {
      deletedNodes.forEach((node) => {
        fetch(`/api/scenes/${currentSceneId}/nodes/${node.id}`, {
          method: 'DELETE',
        }).catch((error) => console.error('Failed to delete node:', error));
      });
    },
    [currentSceneId]
  );

  return (
    <div className="w-full h-screen relative">
      <ReactFlow
        nodes={nodes}
        edges={[]}
        onNodesChange={onNodesChange}
        onNodesDelete={onNodesDelete}
        nodeTypes={nodeTypes}
        snapToGrid={gridSnap}
        snapGrid={[GRID_SIZE, GRID_SIZE]}
        onMoveEnd={onMoveEnd}
        fitView={false}
        deleteKeyCode={['Backspace', 'Delete']}
        multiSelectionKeyCode="Shift"
        selectionKeyCode="Shift"
        className="bg-[#1a1a1a]"
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={GRID_SIZE}
          size={1}
          color="#333"
        />
        <Controls showInteractive={false} />
      </ReactFlow>
      <ModuleToolbar onAddModule={addModule} />
      <CanvasControls />
    </div>
  );
}

export function Canvas() {
  return (
    <ReactFlowProvider>
      <CanvasInner />
    </ReactFlowProvider>
  );
}
