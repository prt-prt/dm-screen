'use client';

import { useCallback } from 'react';
import { MidiMapping, MidiTargetType } from '@/types/midi';
import { useMidiStore } from '@/lib/midi';
import { useCanvasStore } from '@/lib/store';
import { AudioChannel } from '@/types/modules';
import { Trash2 } from 'lucide-react';

interface MidiMappingRowProps {
  mapping: MidiMapping;
  /** When provided, replaces the free-text channelId input with a dropdown */
  channels?: AudioChannel[];
  /** When true, hides the node selector (used in inline mode where node is implicit) */
  hideNodeSelector?: boolean;
}

const TARGET_TYPE_LABELS: Record<MidiTargetType, string> = {
  'audio-channel-volume': 'Channel Volume',
  'audio-channel-play': 'Channel Play/Pause',
  'audio-scene-channel-volume': 'Scene Ch. Volume',
  'audio-scene-master': 'Scene Master',
};

export function MidiMappingRow({ mapping, channels, hideNodeSelector }: MidiMappingRowProps) {
  const { updateMapping, deleteMapping, startLearn, learnState } = useMidiStore();
  const nodes = useCanvasStore((s) => s.nodes);
  const isLearning = learnState?.mappingId === mapping.id;

  // Filter nodes to audio types
  const audioNodes = nodes.filter(
    (n) => n.type === 'audio-channel' || n.type === 'audio-scene'
  );

  const handleTargetTypeChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      updateMapping(mapping.id, { targetType: e.target.value as MidiTargetType });
    },
    [mapping.id, updateMapping]
  );

  const handleNodeChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      updateMapping(mapping.id, { nodeId: e.target.value, channelId: undefined });
    },
    [mapping.id, updateMapping]
  );

  const handleChannelIdChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      updateMapping(mapping.id, { channelId: e.target.value });
    },
    [mapping.id, updateMapping]
  );

  const handleLabelChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      updateMapping(mapping.id, { label: e.target.value });
    },
    [mapping.id, updateMapping]
  );

  const handleManualCc = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = parseInt(e.target.value, 10);
      if (!isNaN(val) && val >= 0 && val <= 127) {
        updateMapping(mapping.id, { ccNumber: val });
      }
    },
    [mapping.id, updateMapping]
  );

  const handleManualChannel = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = parseInt(e.target.value, 10);
      if (!isNaN(val) && val >= 0 && val <= 15) {
        updateMapping(mapping.id, { midiChannel: val });
      }
    },
    [mapping.id, updateMapping]
  );

  const selectedNode = audioNodes.find((n) => n.id === mapping.nodeId);
  const needsChannelId = mapping.targetType === 'audio-scene-channel-volume';

  return (
    <div className="flex flex-col gap-2 p-2 rounded border border-[#333] bg-[#1a1a1a]">
      {/* Row 1: Label + delete */}
      <div className="flex items-center gap-2">
        <input
          value={mapping.label}
          onChange={handleLabelChange}
          placeholder="Label"
          className="flex-1 bg-transparent border border-[#333] rounded px-2 py-1 text-xs text-[#e5e5e5] outline-none focus:border-[#555]"
        />
        <button
          onClick={() => deleteMapping(mapping.id)}
          className="text-[#555] hover:text-[#f87171] transition-colors"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Row 2: Target type + Node selector */}
      <div className="flex items-center gap-2">
        <select
          value={mapping.targetType}
          onChange={handleTargetTypeChange}
          className="bg-[#242424] border border-[#333] rounded px-1.5 py-1 text-xs text-[#e5e5e5] outline-none"
        >
          {Object.entries(TARGET_TYPE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        {!hideNodeSelector && (
          <select
            value={mapping.nodeId}
            onChange={handleNodeChange}
            className="flex-1 bg-[#242424] border border-[#333] rounded px-1.5 py-1 text-xs text-[#e5e5e5] outline-none"
          >
            <option value="">-- select node --</option>
            {audioNodes.map((node) => (
              <option key={node.id} value={node.id}>
                {node.data?.label || node.type} ({node.id.slice(0, 6)})
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Row 3: Channel ID (dropdown if channels provided, text input otherwise) */}
      {needsChannelId && (
        channels ? (
          <select
            value={mapping.channelId || ''}
            onChange={handleChannelIdChange}
            className="bg-[#242424] border border-[#333] rounded px-1.5 py-1 text-xs text-[#e5e5e5] outline-none"
          >
            <option value="">-- select channel --</option>
            {channels.map((ch) => (
              <option key={ch.id} value={ch.id}>
                {ch.audioFile?.name || ch.id}
              </option>
            ))}
          </select>
        ) : (
          <input
            value={mapping.channelId || ''}
            onChange={handleChannelIdChange as React.ChangeEventHandler<HTMLInputElement>}
            placeholder="Channel ID"
            className="bg-transparent border border-[#333] rounded px-2 py-1 text-xs text-[#e5e5e5] outline-none focus:border-[#555]"
          />
        )
      )}

      {/* Row 4: MIDI assignment */}
      <div className="flex items-center gap-2">
        <span className="text-[10px] text-[#666]">Ch:</span>
        <input
          type="number"
          min={0}
          max={15}
          value={mapping.midiChannel}
          onChange={handleManualChannel}
          className="w-10 bg-[#242424] border border-[#333] rounded px-1.5 py-1 text-xs text-[#e5e5e5] outline-none text-center"
        />
        <span className="text-[10px] text-[#666]">CC:</span>
        <input
          type="number"
          min={0}
          max={127}
          value={mapping.ccNumber}
          onChange={handleManualCc}
          className="w-12 bg-[#242424] border border-[#333] rounded px-1.5 py-1 text-xs text-[#e5e5e5] outline-none text-center"
        />
        <button
          onClick={() => startLearn(mapping.id)}
          className={`ml-auto px-2 py-1 rounded text-xs border transition-colors ${
            isLearning
              ? 'border-[#f59e0b] text-[#f59e0b] animate-pulse'
              : 'border-[#333] text-[#888] hover:text-[#e5e5e5] hover:border-[#555]'
          }`}
        >
          {isLearning ? 'listening...' : 'learn'}
        </button>
      </div>
    </div>
  );
}
