'use client';

import { Canvas } from '@/components/canvas/Canvas';
import { SceneSelector } from '@/components/canvas/SceneSelector';
import { ModuleModal } from '@/components/modals/ModuleModal';

export default function Home() {
  return (
    <main className="h-screen w-screen overflow-hidden">
      <Canvas />
      <SceneSelector />
      <ModuleModal />
    </main>
  );
}
