'use client';

import { useCanvasStore } from '@/lib/store';
import { Grid3X3 } from 'lucide-react';
import { cn } from '@/lib/utils';

export function CanvasControls() {
  const { gridSnap, setGridSnap } = useCanvasStore();

  return (
    <div className="absolute top-3 right-3 flex gap-1.5 z-10">
      <button
        onClick={() => setGridSnap(!gridSnap)}
        className={cn(
          'h-8 w-8 flex items-center justify-center rounded border transition-colors',
          gridSnap
            ? 'border-[#555] bg-[#333] text-[#e5e5e5]'
            : 'border-[#333] bg-[#242424] text-[#888] hover:text-[#e5e5e5] hover:bg-[#2a2a2a]'
        )}
        title="Grid snap"
      >
        <Grid3X3 className="h-4 w-4" />
      </button>
    </div>
  );
}
