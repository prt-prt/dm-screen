'use client';

import { useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useCanvasStore } from '@/lib/store';
import { NoteEditor } from './NoteEditor';
import { StatblockEditor } from './StatblockEditor';
import { InitiativeEditor } from './InitiativeEditor';
import { AudioSceneEditor } from './AudioSceneEditor';
import { FileText, Skull, ListOrdered, Layers } from 'lucide-react';

export function ModuleModal() {
  const { modalOpen, modalModuleId, modalModuleType, closeModal, nodes } =
    useCanvasStore();

  const node = nodes.find((n) => n.id === modalModuleId);
  const referenceId = node?.data?.referenceId;

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeModal();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [closeModal]);

  const renderEditor = () => {
    if (!referenceId) {
      return (
        <div className="text-center text-[#666] py-8 text-sm">
          no data linked
        </div>
      );
    }

    switch (modalModuleType) {
      case 'note':
        return <NoteEditor noteId={referenceId} onClose={closeModal} />;
      case 'statblock':
        return <StatblockEditor statblockId={referenceId} onClose={closeModal} />;
      case 'initiative':
        return <InitiativeEditor trackerId={referenceId} onClose={closeModal} />;
      case 'audio-scene':
        return <AudioSceneEditor sceneId={referenceId} onClose={closeModal} />;
      default:
        return (
          <div className="text-center text-[#666] py-8 text-sm">
            no editor available
          </div>
        );
    }
  };

  const getIcon = () => {
    switch (modalModuleType) {
      case 'note': return <FileText className="h-4 w-4 text-[#fbbf24]" />;
      case 'statblock': return <Skull className="h-4 w-4 text-[#f87171]" />;
      case 'initiative': return <ListOrdered className="h-4 w-4 text-[#60a5fa]" />;
      case 'audio-scene': return <Layers className="h-4 w-4 text-[#34d399]" />;
      default: return null;
    }
  };

  const getTitle = () => {
    switch (modalModuleType) {
      case 'note': return 'note';
      case 'statblock': return 'statblock';
      case 'initiative': return 'initiative';
      case 'audio-scene': return 'audio scene';
      default: return 'edit';
    }
  };

  return (
    <Dialog open={modalOpen} onOpenChange={(open) => !open && closeModal()}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto bg-[#1f1f1f] border-[#333]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-sm font-normal text-[#888]">
            {getIcon()}
            {getTitle()}
          </DialogTitle>
        </DialogHeader>
        {renderEditor()}
      </DialogContent>
    </Dialog>
  );
}
