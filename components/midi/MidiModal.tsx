'use client';

import { useEffect } from 'react';
import { useMidiStore } from '@/lib/midi';
import { MidiMappingRow } from './MidiMappingRow';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Plus, AlertTriangle, Usb } from 'lucide-react';

interface MidiModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MidiModal({ open, onOpenChange }: MidiModalProps) {
  const { supported, connectedDevices, mappings, addMapping, init, midiAccess } = useMidiStore();

  // Lazy init: request MIDI access when modal first opens
  useEffect(() => {
    if (open && supported && !midiAccess) {
      init();
    }
  }, [open, supported, midiAccess, init]);

  const handleAddMapping = () => {
    addMapping({
      id: crypto.randomUUID(),
      label: '',
      messageType: 'cc',
      midiChannel: 0,
      ccNumber: 0,
      targetType: 'audio-channel-volume',
      nodeId: '',
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#1e1e1e] border-[#333] text-[#e5e5e5] sm:max-w-lg max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-sm text-[#e5e5e5]">MIDI Controller</DialogTitle>
          <DialogDescription className="text-xs text-[#666]">
            Map MIDI controls to audio modules
          </DialogDescription>
        </DialogHeader>

        {/* Browser support warning */}
        {!supported && (
          <div className="flex items-center gap-2 p-2 rounded bg-[#2a2a00] border border-[#554400] text-xs text-[#f59e0b]">
            <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
            <span>Web MIDI is not supported in this browser. Use Chrome or Edge.</span>
          </div>
        )}

        {/* Device status */}
        {supported && (
          <div className="flex items-center gap-2 p-2 rounded bg-[#242424] border border-[#333]">
            <Usb className={`h-3.5 w-3.5 ${connectedDevices.length > 0 ? 'text-[#34d399]' : 'text-[#555]'}`} />
            <span className="text-xs text-[#888]">
              {connectedDevices.length > 0
                ? connectedDevices.join(', ')
                : 'No MIDI device connected'}
            </span>
          </div>
        )}

        {/* Mappings list */}
        <div className="flex-1 overflow-auto space-y-2 min-h-0">
          {mappings.map((mapping) => (
            <MidiMappingRow key={mapping.id} mapping={mapping} />
          ))}
          {mappings.length === 0 && (
            <div className="text-center text-xs text-[#555] py-4">
              No mappings yet. Add one below.
            </div>
          )}
        </div>

        {/* Add mapping button */}
        {supported && (
          <button
            onClick={handleAddMapping}
            className="flex items-center justify-center gap-1.5 w-full py-2 rounded border border-[#333] text-xs text-[#888] hover:text-[#e5e5e5] hover:border-[#555] transition-colors"
          >
            <Plus className="h-3 w-3" />
            add mapping
          </button>
        )}
      </DialogContent>
    </Dialog>
  );
}
