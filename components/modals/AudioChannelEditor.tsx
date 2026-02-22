'use client';

import { MidiMappingInline } from '@/components/midi/MidiMappingInline';

interface AudioChannelEditorProps {
  nodeId: string;
  onClose: () => void;
}

export function AudioChannelEditor({ nodeId, onClose }: AudioChannelEditorProps) {
  return (
    <div className="space-y-4">
      <MidiMappingInline nodeId={nodeId} nodeType="audio-channel" />
      <div className="flex justify-end pt-2">
        <button
          onClick={onClose}
          className="px-3 py-1.5 text-xs text-[#888] hover:text-[#e5e5e5] transition-colors"
        >
          close
        </button>
      </div>
    </div>
  );
}
