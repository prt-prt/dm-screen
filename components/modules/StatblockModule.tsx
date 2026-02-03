'use client';

import { memo, useCallback, useEffect, useState } from 'react';
import { NodeProps, useReactFlow } from 'reactflow';
import { ModuleWrapper } from './ModuleWrapper';
import { useCanvasStore } from '@/lib/store';
import { Statblock } from '@/types/modules';
import { Skull } from 'lucide-react';

function getModifier(score: number): string {
  const mod = Math.floor((score - 10) / 2);
  return mod >= 0 ? `+${mod}` : `${mod}`;
}

export const StatblockModule = memo(function StatblockModule(props: NodeProps) {
  const { data, id } = props;
  const [statblock, setStatblock] = useState<Statblock | null>(null);
  const { openModal, currentSceneId, refreshCounter } = useCanvasStore();
  const { setNodes, getNodes } = useReactFlow();

  useEffect(() => {
    if (data.referenceId) {
      fetch(`/api/statblocks/${data.referenceId}`)
        .then((res) => {
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          return res.json();
        })
        .then((data) => setStatblock(data.statblock))
        .catch((error) => console.error('Failed to load statblock:', error));
    }
  }, [data.referenceId, refreshCounter]);

  const handleOpenDetail = useCallback(() => {
    openModal(id, 'statblock');
  }, [id, openModal]);

  const handleCreateStatblock = useCallback(async () => {
    const statblockId = crypto.randomUUID();
    const newStatblock: Statblock = {
      id: statblockId,
      name: 'creature',
      size: 'Medium',
      type: 'Humanoid',
      alignment: 'Unaligned',
      armorClass: 10,
      hitPoints: 10,
      hitDice: '2d8',
      speed: '30 ft.',
      str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10,
      senses: 'passive Perception 10',
      languages: 'Common',
      challenge: '0',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      await fetch('/api/statblocks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newStatblock),
      });

      await fetch(`/api/scenes/${currentSceneId}/nodes/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ referenceId: statblockId }),
      });

      setStatblock(newStatblock);

      const nodes = getNodes();
      setNodes(
        nodes.map((n) =>
          n.id === id ? { ...n, data: { ...n.data, referenceId: statblockId } } : n
        )
      );

      openModal(id, 'statblock');
    } catch (error) {
      console.error('Failed to create statblock:', error);
    }
  }, [currentSceneId, id, getNodes, setNodes, openModal]);

  return (
    <ModuleWrapper
      nodeProps={props}
      icon={<Skull className="h-3.5 w-3.5" />}
      color="text-[#f87171]"
      onOpenDetail={handleOpenDetail}
    >
      {statblock ? (
        <div className="text-xs space-y-1.5">
          <div className="font-medium">{statblock.name}</div>
          <div className="text-[#666] text-[10px]">
            {statblock.size} {statblock.type}
          </div>
          <div className="flex gap-3 text-[10px]">
            <span><span className="text-[#666]">AC</span> {statblock.armorClass}</span>
            <span><span className="text-[#666]">HP</span> {statblock.hitPoints}</span>
            <span><span className="text-[#666]">CR</span> {statblock.challenge}</span>
          </div>
          <div className="grid grid-cols-6 gap-0.5 text-center text-[10px] pt-1 border-t border-[#333]">
            {(['str', 'dex', 'con', 'int', 'wis', 'cha'] as const).map((stat) => (
              <div key={stat}>
                <div className="text-[#666] uppercase">{stat}</div>
                <div>{getModifier(statblock[stat])}</div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <button
          onClick={handleCreateStatblock}
          className="w-full h-full flex items-center justify-center text-xs text-[#555] hover:text-[#888] transition-colors"
        >
          + new statblock
        </button>
      )}
    </ModuleWrapper>
  );
});
