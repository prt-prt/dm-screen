'use client';

import { useMidiStore } from '@/lib/midi';
import { Sliders } from 'lucide-react';

interface MidiButtonProps {
  onClick: () => void;
}

export function MidiButton({ onClick }: MidiButtonProps) {
  const connectedDevices = useMidiStore((s) => s.connectedDevices);
  const isConnected = connectedDevices.length > 0;

  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 h-7 px-2 rounded border bg-[#242424] transition-colors text-xs ${
        isConnected
          ? 'border-[#34d399] text-[#34d399] hover:bg-[#2a2a2a]'
          : 'border-[#333] text-[#888] hover:text-[#e5e5e5] hover:bg-[#2a2a2a]'
      }`}
      title={isConnected ? `MIDI: ${connectedDevices.join(', ')}` : 'MIDI: no device'}
    >
      <Sliders className="h-3 w-3" />
      <span>midi</span>
    </button>
  );
}
