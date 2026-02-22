'use client';

import { ReactNode, useCallback } from 'react';
import { NodeResizer, NodeProps } from 'reactflow';
import { useCanvasStore } from '@/lib/store';
import { MIN_MODULE_SIZE, MAX_MODULE_SIZE } from '@/types/canvas';
import { cn } from '@/lib/utils';

interface ModuleWrapperProps {
  nodeProps: NodeProps;
  icon: React.ReactNode;
  color: string;
  children: ReactNode;
  onOpenDetail?: () => void;
}

export function ModuleWrapper({
  nodeProps,
  icon,
  color,
  children,
  onOpenDetail,
}: ModuleWrapperProps) {
  const { selected, id } = nodeProps;
  const { openModal, currentSceneId } = useCanvasStore();

  const handleOpenDetail = useCallback(() => {
    if (onOpenDetail) {
      onOpenDetail();
    } else {
      openModal(id, nodeProps.type || 'unknown');
    }
  }, [id, nodeProps.type, onOpenDetail, openModal]);

  const handleResize = useCallback(
    (_: unknown, params: { width: number; height: number }) => {
      fetch(`/api/scenes/${currentSceneId}/nodes/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          width: params.width,
          height: params.height,
        }),
      }).catch((error) => console.error('Failed to save node size:', error));
    },
    [currentSceneId, id]
  );

  return (
    <>
      <NodeResizer
        minWidth={MIN_MODULE_SIZE.width}
        minHeight={MIN_MODULE_SIZE.height}
        maxWidth={MAX_MODULE_SIZE.width}
        maxHeight={MAX_MODULE_SIZE.height}
        isVisible={selected}
        lineClassName="border-[#555]"
        handleClassName="h-2 w-2 bg-[#242424] border border-[#555] rounded-sm"
        onResizeEnd={handleResize}
      />
      <div
        className={cn(
          'group h-full w-full rounded border overflow-hidden bg-[#242424] relative',
          selected ? 'border-[#555]' : 'border-[#333]'
        )}
      >
        {/* Module icon - top right */}
        <div className={cn('absolute top-2 right-2 opacity-50', color)}>
          {icon}
        </div>

        {/* Detail button - bottom right, visible on hover */}
        <button
          onClick={handleOpenDetail}
          className="absolute bottom-2 right-2 h-2 w-2 rounded-full bg-white/40 opacity-0 group-hover:opacity-100 hover:bg-white/80 transition-opacity"
          aria-label="Open details"
        />

        {/* Content */}
        <div className="w-full p-2 text-[#e5e5e5]">
          {children}
        </div>
      </div>
    </>
  );
}
