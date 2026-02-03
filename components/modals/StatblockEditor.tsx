'use client';

import { useEffect, useState, useCallback } from 'react';
import { Statblock } from '@/types/modules';
import { useCanvasStore } from '@/lib/store';
import { CREATURE_SIZES, ALIGNMENTS } from '@/lib/constants';

interface StatblockEditorProps {
  statblockId: string;
  onClose: () => void;
}

export function StatblockEditor({ statblockId, onClose }: StatblockEditorProps) {
  const [statblock, setStatblock] = useState<Statblock | null>(null);
  const [saving, setSaving] = useState(false);
  const { triggerRefresh } = useCanvasStore();

  useEffect(() => {
    fetch(`/api/statblocks/${statblockId}`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => setStatblock(data.statblock))
      .catch((error) => console.error('Failed to load statblock:', error));
  }, [statblockId]);

  const handleChange = useCallback(
    (field: keyof Statblock, value: string | number) => {
      if (!statblock) return;
      setStatblock({ ...statblock, [field]: value });
    },
    [statblock]
  );

  const handleSave = useCallback(async () => {
    if (!statblock) return;
    setSaving(true);
    try {
      await fetch(`/api/statblocks/${statblockId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(statblock),
      });
      triggerRefresh();
      onClose();
    } catch (error) {
      console.error('Failed to save statblock:', error);
    } finally {
      setSaving(false);
    }
  }, [statblockId, statblock, onClose, triggerRefresh]);

  if (!statblock) {
    return <div className="py-8 text-center text-[#666] text-sm">loading...</div>;
  }

  const inputClass = "w-full px-2 py-1.5 text-xs bg-[#242424] border border-[#333] rounded text-[#e5e5e5] placeholder-[#555] focus:outline-none focus:border-[#555]";
  const selectClass = "w-full px-2 py-1.5 text-xs bg-[#242424] border border-[#333] rounded text-[#e5e5e5] focus:outline-none";
  const labelClass = "text-[10px] text-[#666] uppercase tracking-wide";

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <label className={labelClass}>name</label>
          <input className={inputClass} value={statblock.name} onChange={(e) => handleChange('name', e.target.value)} />
        </div>
        <div>
          <label className={labelClass}>size</label>
          <select className={selectClass} value={statblock.size} onChange={(e) => handleChange('size', e.target.value)}>
            {CREATURE_SIZES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className={labelClass}>type</label>
          <input className={inputClass} value={statblock.type} onChange={(e) => handleChange('type', e.target.value)} />
        </div>
        <div>
          <label className={labelClass}>alignment</label>
          <select className={selectClass} value={statblock.alignment} onChange={(e) => handleChange('alignment', e.target.value)}>
            {ALIGNMENTS.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>
        <div>
          <label className={labelClass}>challenge</label>
          <input className={inputClass} value={statblock.challenge} onChange={(e) => handleChange('challenge', e.target.value)} />
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3">
        <div>
          <label className={labelClass}>AC</label>
          <input type="number" className={inputClass} value={statblock.armorClass} onChange={(e) => handleChange('armorClass', parseInt(e.target.value) || 0)} />
        </div>
        <div>
          <label className={labelClass}>HP</label>
          <input type="number" className={inputClass} value={statblock.hitPoints} onChange={(e) => handleChange('hitPoints', parseInt(e.target.value) || 0)} />
        </div>
        <div>
          <label className={labelClass}>hit dice</label>
          <input className={inputClass} value={statblock.hitDice} onChange={(e) => handleChange('hitDice', e.target.value)} />
        </div>
        <div>
          <label className={labelClass}>speed</label>
          <input className={inputClass} value={statblock.speed} onChange={(e) => handleChange('speed', e.target.value)} />
        </div>
      </div>

      <div>
        <label className={labelClass}>ability scores</label>
        <div className="grid grid-cols-6 gap-2 mt-1">
          {(['str', 'dex', 'con', 'int', 'wis', 'cha'] as const).map((stat) => (
            <div key={stat} className="text-center">
              <div className="text-[10px] text-[#666] uppercase mb-1">{stat}</div>
              <input
                type="number"
                value={statblock[stat]}
                onChange={(e) => handleChange(stat, parseInt(e.target.value) || 10)}
                className="w-full px-1 py-1 text-xs text-center bg-[#242424] border border-[#333] rounded text-[#e5e5e5] focus:outline-none focus:border-[#555]"
              />
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>saving throws</label>
          <input className={inputClass} value={statblock.savingThrows || ''} onChange={(e) => handleChange('savingThrows', e.target.value)} placeholder="DEX +5, CON +3" />
        </div>
        <div>
          <label className={labelClass}>skills</label>
          <input className={inputClass} value={statblock.skills || ''} onChange={(e) => handleChange('skills', e.target.value)} placeholder="Perception +5" />
        </div>
        <div>
          <label className={labelClass}>senses</label>
          <input className={inputClass} value={statblock.senses} onChange={(e) => handleChange('senses', e.target.value)} />
        </div>
        <div>
          <label className={labelClass}>languages</label>
          <input className={inputClass} value={statblock.languages} onChange={(e) => handleChange('languages', e.target.value)} />
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <label className={labelClass}>traits</label>
          <textarea value={statblock.traits || ''} onChange={(e) => handleChange('traits', e.target.value)} className="w-full h-16 px-2 py-1.5 text-xs bg-[#242424] border border-[#333] rounded text-[#e5e5e5] resize-none focus:outline-none focus:border-[#555]" />
        </div>
        <div>
          <label className={labelClass}>actions</label>
          <textarea value={statblock.actions || ''} onChange={(e) => handleChange('actions', e.target.value)} className="w-full h-20 px-2 py-1.5 text-xs bg-[#242424] border border-[#333] rounded text-[#e5e5e5] resize-none focus:outline-none focus:border-[#555]" />
        </div>
      </div>

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
