'use client';

import { useState } from 'react';
import { Canvas } from '@/components/canvas/Canvas';
import { SceneSelector } from '@/components/canvas/SceneSelector';
import { ModuleModal } from '@/components/modals/ModuleModal';
import { MidiButton } from '@/components/midi/MidiButton';
import { MidiModal } from '@/components/midi/MidiModal';

export default function Home() {
  const [midiModalOpen, setMidiModalOpen] = useState(false);

  return (
    <main className="h-screen w-screen overflow-hidden">
      <Canvas />
      <div className="absolute top-3 left-13 z-10 flex items-center gap-1.5">
        <SceneSelector />
        <MidiButton onClick={() => setMidiModalOpen(true)} />
      </div>
      <ModuleModal />
      <MidiModal open={midiModalOpen} onOpenChange={setMidiModalOpen} />
    </main>
  );
}
