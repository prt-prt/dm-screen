'use client';

import { memo, useCallback, useEffect, useState } from 'react';
import { NodeProps, useReactFlow } from 'reactflow';
import { ModuleWrapper } from './ModuleWrapper';
import { useCanvasStore } from '@/lib/store';
import { InitiativeTracker, Combatant } from '@/types/modules';
import { ListOrdered, SkipForward, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';

export const InitiativeModule = memo(function InitiativeModule(props: NodeProps) {
  const { data, id } = props;
  const [tracker, setTracker] = useState<InitiativeTracker | null>(null);
  const [selectedCombatant, setSelectedCombatant] = useState<string | null>(null);
  const [hpChange, setHpChange] = useState('');
  const { openModal, currentSceneId, refreshCounter } = useCanvasStore();
  const { setNodes, getNodes } = useReactFlow();

  useEffect(() => {
    if (data.referenceId) {
      fetch(`/api/initiative/${data.referenceId}`)
        .then((res) => {
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          return res.json();
        })
        .then((data) => setTracker(data.tracker))
        .catch((error) => console.error('Failed to load initiative tracker:', error));
    }
  }, [data.referenceId, refreshCounter]);

  const handleOpenDetail = useCallback(() => {
    openModal(id, 'initiative');
  }, [id, openModal]);

  const handleNextTurn = useCallback(async () => {
    if (!tracker || tracker.combatants.length === 0) return;
    const combatants = tracker.combatants;
    let nextTurn = (tracker.currentTurn + 1) % combatants.length;
    let round = tracker.round;
    if (nextTurn === 0) round += 1;

    const updated = { ...tracker, currentTurn: nextTurn, round };
    setTracker(updated);

    await fetch(`/api/initiative/${tracker.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentTurn: nextTurn, round }),
    }).catch((error) => console.error('Failed to advance turn:', error));
  }, [tracker]);

  const handleReset = useCallback(async () => {
    if (!tracker) return;
    const resetCombatants = tracker.combatants.map((c) => ({ ...c, hp: c.maxHp }));
    const updated = { ...tracker, combatants: resetCombatants, currentTurn: 0, round: 1 };
    setTracker(updated);

    await fetch(`/api/initiative/${tracker.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ combatants: resetCombatants, currentTurn: 0, round: 1 }),
    }).catch((error) => console.error('Failed to reset combat:', error));
  }, [tracker]);

  const handleHpChange = useCallback(
    async (combatantId: string, delta: number) => {
      if (!tracker) return;
      const updatedCombatants = tracker.combatants.map((c) =>
        c.id === combatantId
          ? { ...c, hp: Math.max(0, Math.min(c.maxHp, c.hp + delta)) }
          : c
      );
      const updated = { ...tracker, combatants: updatedCombatants };
      setTracker(updated);
      setSelectedCombatant(null);
      setHpChange('');

      await fetch(`/api/initiative/${tracker.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ combatants: updatedCombatants }),
      }).catch((error) => console.error('Failed to update HP:', error));
    },
    [tracker]
  );

  const handleCreateTracker = useCallback(async () => {
    const trackerId = crypto.randomUUID();
    const newTracker: InitiativeTracker = {
      id: trackerId,
      name: 'combat',
      combatants: [],
      currentTurn: 0,
      round: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      await fetch('/api/initiative', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTracker),
      });

      await fetch(`/api/scenes/${currentSceneId}/nodes/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ referenceId: trackerId }),
      });

      setTracker(newTracker);

      const nodes = getNodes();
      setNodes(
        nodes.map((n) =>
          n.id === id ? { ...n, data: { ...n.data, referenceId: trackerId } } : n
        )
      );

      openModal(id, 'initiative');
    } catch (error) {
      console.error('Failed to create initiative tracker:', error);
    }
  }, [currentSceneId, id, getNodes, setNodes, openModal]);

  const sortedCombatants = tracker?.combatants
    ?.slice()
    .sort((a, b) => b.initiative - a.initiative) || [];

  return (
    <ModuleWrapper
      nodeProps={props}
      icon={<ListOrdered className="h-3.5 w-3.5" />}
      color="text-[#60a5fa]"
      onOpenDetail={handleOpenDetail}
    >
      {tracker ? (
        <div className="h-full flex flex-col">
          {/* Round indicator */}
          <div className="text-[10px] text-[#666] mb-1">round {tracker.round}</div>

          {/* Combatant list */}
          <div className="flex-1 space-y-0.5 overflow-auto min-h-0">
            {sortedCombatants.map((combatant, index) => {
              const isSelected = selectedCombatant === combatant.id;
              const hpPercent = (combatant.hp / combatant.maxHp) * 100;
              const hpColor =
                hpPercent > 50 ? 'text-[#34d399]' : hpPercent > 25 ? 'text-[#fbbf24]' : 'text-[#f87171]';

              return (
                <div key={combatant.id}>
                  <div
                    onClick={() => setSelectedCombatant(isSelected ? null : combatant.id)}
                    className={cn(
                      'flex items-center gap-2 px-1.5 py-0.5 rounded text-[10px] cursor-pointer transition-colors',
                      index === tracker.currentTurn
                        ? 'bg-[#60a5fa]/20 text-[#e5e5e5]'
                        : 'text-[#888] hover:bg-[#333]/50'
                    )}
                  >
                    <span className="w-4 text-center font-mono text-[#666]">
                      {combatant.initiative}
                    </span>
                    <span className="flex-1 truncate">{combatant.name}</span>
                    <span className="text-[#666] font-mono">{combatant.ac}</span>
                    <span className={cn('font-mono', hpColor)}>
                      {combatant.hp}/{combatant.maxHp}
                    </span>
                  </div>

                  {/* HP adjustment controls */}
                  {isSelected && (
                    <div className="flex items-center gap-1.5 py-1 ml-6 text-[10px]">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          const value = parseInt(hpChange) || 0;
                          if (value > 0) handleHpChange(combatant.id, -value);
                        }}
                        className="text-[#888] hover:text-[#f87171] transition-colors"
                      >
                        −
                      </button>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={hpChange}
                        onChange={(e) => setHpChange(e.target.value.replace(/[^0-9]/g, ''))}
                        onKeyDown={(e) => e.stopPropagation()}
                        onClick={(e) => e.stopPropagation()}
                        placeholder="0"
                        className="w-8 px-1 py-0.5 text-[10px] text-center bg-transparent border-b border-[#444] text-[#e5e5e5] focus:outline-none focus:border-[#666] placeholder-[#555]"
                      />
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          const value = parseInt(hpChange) || 0;
                          if (value > 0) handleHpChange(combatant.id, value);
                        }}
                        className="text-[#888] hover:text-[#34d399] transition-colors"
                      >
                        +
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
            {sortedCombatants.length === 0 && (
              <div className="text-center text-[#555] text-[10px] py-2">
                no combatants
              </div>
            )}
          </div>

          {/* Action buttons at bottom */}
          <div className="flex gap-1 pt-2 mt-auto border-t border-[#333]">
            <button
              onClick={handleNextTurn}
              disabled={sortedCombatants.length === 0}
              className="flex-1 h-6 flex items-center justify-center gap-1 rounded text-[10px] text-[#888] hover:text-[#e5e5e5] hover:bg-[#333] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <SkipForward className="h-3 w-3" />
              next
            </button>
            <button
              onClick={handleReset}
              className="flex-1 h-6 flex items-center justify-center gap-1 rounded text-[10px] text-[#888] hover:text-[#e5e5e5] hover:bg-[#333] transition-colors"
            >
              <RotateCcw className="h-3 w-3" />
              reset
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={handleCreateTracker}
          className="w-full h-full flex items-center justify-center text-xs text-[#555] hover:text-[#888] transition-colors"
        >
          + start combat
        </button>
      )}
    </ModuleWrapper>
  );
});
