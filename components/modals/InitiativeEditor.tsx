'use client';

import { useEffect, useState, useCallback } from 'react';
import { InitiativeTracker, Combatant } from '@/types/modules';
import { Plus, Trash2, Dices, ArrowUpDown } from 'lucide-react';
import { useCanvasStore } from '@/lib/store';
import { cn } from '@/lib/utils';

interface InitiativeEditorProps {
  trackerId: string;
  onClose: () => void;
}

export function InitiativeEditor({ trackerId, onClose }: InitiativeEditorProps) {
  const [tracker, setTracker] = useState<InitiativeTracker | null>(null);
  const [saving, setSaving] = useState(false);
  const { triggerRefresh } = useCanvasStore();

  useEffect(() => {
    fetch(`/api/initiative/${trackerId}`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => setTracker(data.tracker))
      .catch((error) => console.error('Failed to load initiative tracker:', error));
  }, [trackerId]);

  const handleAddCombatant = useCallback(() => {
    if (!tracker) return;
    const newCombatant: Combatant = {
      id: crypto.randomUUID(),
      name: 'combatant',
      initiative: 10,
      hp: 10,
      maxHp: 10,
      ac: 10,
      isPlayer: false,
    };
    setTracker({ ...tracker, combatants: [...tracker.combatants, newCombatant] });
  }, [tracker]);

  const handleUpdateCombatant = useCallback(
    (combatantId: string, field: keyof Combatant, value: string | number | boolean) => {
      if (!tracker) return;
      setTracker({
        ...tracker,
        combatants: tracker.combatants.map((c) =>
          c.id === combatantId ? { ...c, [field]: value } : c
        ),
      });
    },
    [tracker]
  );

  const handleRemoveCombatant = useCallback(
    (combatantId: string) => {
      if (!tracker) return;
      setTracker({ ...tracker, combatants: tracker.combatants.filter((c) => c.id !== combatantId) });
    },
    [tracker]
  );

  const handleRollAll = useCallback(() => {
    if (!tracker) return;
    setTracker({
      ...tracker,
      combatants: tracker.combatants.map((c) => ({
        ...c,
        initiative: Math.floor(Math.random() * 20) + 1,
      })),
    });
  }, [tracker]);

  const handleSortByInitiative = useCallback(() => {
    if (!tracker) return;
    setTracker({
      ...tracker,
      combatants: [...tracker.combatants].sort((a, b) => b.initiative - a.initiative),
      currentTurn: 0,
    });
  }, [tracker]);

  const handleSave = useCallback(async () => {
    if (!tracker) return;
    setSaving(true);
    try {
      await fetch(`/api/initiative/${trackerId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: tracker.name,
          combatants: tracker.combatants,
          currentTurn: tracker.currentTurn,
          round: tracker.round,
        }),
      });
      triggerRefresh();
      onClose();
    } catch (error) {
      console.error('Failed to save initiative tracker:', error);
    } finally {
      setSaving(false);
    }
  }, [trackerId, tracker, onClose, triggerRefresh]);

  if (!tracker) {
    return <div className="py-8 text-center text-[#666] text-sm">loading...</div>;
  }

  const inputClass = "px-2 py-1 text-xs bg-[#242424] border border-[#333] rounded text-[#e5e5e5] focus:outline-none focus:border-[#555]";

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <input
          value={tracker.name}
          onChange={(e) => setTracker({ ...tracker, name: e.target.value })}
          placeholder="combat name"
          className={cn(inputClass, 'flex-1')}
        />
        <div className="flex gap-1">
          <button
            onClick={handleRollAll}
            className="h-7 px-2 flex items-center gap-1 text-[10px] text-[#888] hover:text-[#e5e5e5] border border-[#333] rounded hover:border-[#555] transition-colors"
          >
            <Dices className="h-3 w-3" /> roll
          </button>
          <button
            onClick={handleSortByInitiative}
            className="h-7 px-2 flex items-center gap-1 text-[10px] text-[#888] hover:text-[#e5e5e5] border border-[#333] rounded hover:border-[#555] transition-colors"
          >
            <ArrowUpDown className="h-3 w-3" /> sort
          </button>
        </div>
      </div>

      <div className="border border-[#333] rounded overflow-hidden">
        <table className="w-full text-xs">
          <thead className="bg-[#1f1f1f]">
            <tr className="text-[10px] text-[#666] uppercase">
              <th className="px-2 py-1.5 text-left font-normal">name</th>
              <th className="px-2 py-1.5 text-center font-normal w-14">init</th>
              <th className="px-2 py-1.5 text-center font-normal w-14">hp</th>
              <th className="px-2 py-1.5 text-center font-normal w-14">max</th>
              <th className="px-2 py-1.5 text-center font-normal w-12">ac</th>
              <th className="px-2 py-1.5 text-center font-normal w-10">pc</th>
              <th className="px-2 py-1.5 w-8"></th>
            </tr>
          </thead>
          <tbody>
            {tracker.combatants.map((combatant, index) => (
              <tr
                key={combatant.id}
                className={cn(
                  'border-t border-[#333]',
                  index === tracker.currentTurn && 'bg-[#60a5fa]/10'
                )}
              >
                <td className="px-2 py-1">
                  <input
                    value={combatant.name}
                    onChange={(e) => handleUpdateCombatant(combatant.id, 'name', e.target.value)}
                    className="w-full bg-transparent text-[#e5e5e5] focus:outline-none"
                  />
                </td>
                <td className="px-2 py-1">
                  <input
                    type="text"
                    inputMode="numeric"
                    value={combatant.initiative}
                    onChange={(e) => handleUpdateCombatant(combatant.id, 'initiative', parseInt(e.target.value) || 0)}
                    className="w-full bg-transparent text-center text-[#e5e5e5] focus:outline-none"
                  />
                </td>
                <td className="px-2 py-1">
                  <input
                    type="text"
                    inputMode="numeric"
                    value={combatant.hp}
                    onChange={(e) => handleUpdateCombatant(combatant.id, 'hp', parseInt(e.target.value) || 0)}
                    className="w-full bg-transparent text-center text-[#e5e5e5] focus:outline-none"
                  />
                </td>
                <td className="px-2 py-1">
                  <input
                    type="text"
                    inputMode="numeric"
                    value={combatant.maxHp}
                    onChange={(e) => handleUpdateCombatant(combatant.id, 'maxHp', parseInt(e.target.value) || 0)}
                    className="w-full bg-transparent text-center text-[#e5e5e5] focus:outline-none"
                  />
                </td>
                <td className="px-2 py-1">
                  <input
                    type="text"
                    inputMode="numeric"
                    value={combatant.ac}
                    onChange={(e) => handleUpdateCombatant(combatant.id, 'ac', parseInt(e.target.value) || 0)}
                    className="w-full bg-transparent text-center text-[#e5e5e5] focus:outline-none"
                  />
                </td>
                <td className="px-2 py-1 text-center">
                  <input
                    type="checkbox"
                    checked={combatant.isPlayer}
                    onChange={(e) => handleUpdateCombatant(combatant.id, 'isPlayer', e.target.checked)}
                    className="h-3 w-3 accent-[#60a5fa]"
                  />
                </td>
                <td className="px-2 py-1">
                  <button
                    onClick={() => handleRemoveCombatant(combatant.id)}
                    className="text-[#666] hover:text-[#f87171]"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <button
        onClick={handleAddCombatant}
        className="w-full py-1.5 text-xs text-[#666] hover:text-[#888] border border-dashed border-[#333] rounded hover:border-[#555] transition-colors flex items-center justify-center gap-1"
      >
        <Plus className="h-3 w-3" /> add combatant
      </button>

      <div className="flex justify-end gap-2 pt-2">
        <button onClick={onClose} className="px-3 py-1.5 text-xs text-[#888] hover:text-[#e5e5e5] transition-colors">
          cancel
        </button>
        <button onClick={handleSave} disabled={saving} className="px-3 py-1.5 text-xs bg-[#333] text-[#e5e5e5] rounded hover:bg-[#444] disabled:opacity-50 transition-colors">
          {saving ? 'saving...' : 'save'}
        </button>
      </div>
    </div>
  );
}
