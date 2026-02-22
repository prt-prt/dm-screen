'use client';

import { useCallback, useMemo, useState } from 'react';
import { useMidiStore } from '@/lib/midi';
import { MidiMapping, MidiTargetType } from '@/types/midi';
import { AudioChannel } from '@/types/modules';
import { MidiMappingRow } from './MidiMappingRow';
import { ChevronRight, Plus } from 'lucide-react';

interface MidiMappingInlineProps {
  nodeId: string;
  nodeType: 'audio-channel' | 'audio-scene';
  /** Channels for audio-scene nodes — enables the channel dropdown */
  channels?: AudioChannel[];
}

const DEFAULT_TARGET: Record<string, MidiTargetType> = {
  'audio-channel': 'audio-channel-volume',
  'audio-scene': 'audio-scene-master',
};

export function MidiMappingInline({ nodeId, nodeType, channels }: MidiMappingInlineProps) {
  const [expanded, setExpanded] = useState(false);
  const allMappings = useMidiStore((s) => s.mappings);
  const addMapping = useMidiStore((s) => s.addMapping);
  const mappings = useMemo(
    () => allMappings.filter((m) => m.nodeId === nodeId),
    [allMappings, nodeId]
  );

  const handleAdd = useCallback(() => {
    const mapping: MidiMapping = {
      id: crypto.randomUUID(),
      label: '',
      messageType: 'cc',
      midiChannel: 0,
      ccNumber: 0,
      targetType: DEFAULT_TARGET[nodeType],
      nodeId,
    };
    addMapping(mapping);
    setExpanded(true);
  }, [nodeId, nodeType, addMapping]);

  return (
    <div className="border-t border-[#333] mt-2 pt-1">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-1 text-[10px] text-[#555] hover:text-[#888] transition-colors w-full"
      >
        <ChevronRight
          className={`h-3 w-3 transition-transform ${expanded ? 'rotate-90' : ''}`}
        />
        <span>midi</span>
        {mappings.length > 0 && (
          <span className="text-[#666]">({mappings.length})</span>
        )}
      </button>

      {expanded && (
        <div className="mt-1.5 space-y-1.5">
          {mappings.map((m) => (
            <MidiMappingRow
              key={m.id}
              mapping={m}
              channels={channels}
              hideNodeSelector
            />
          ))}
          <button
            onClick={handleAdd}
            className="flex items-center gap-1 text-[10px] text-[#555] hover:text-[#888] transition-colors px-2 py-1"
          >
            <Plus className="h-3 w-3" />
            add mapping
          </button>
        </div>
      )}
    </div>
  );
}
