'use client';

import { memo, useCallback, useEffect, useState } from 'react';
import { NodeProps, useReactFlow } from 'reactflow';
import { ModuleWrapper } from './ModuleWrapper';
import { useCanvasStore } from '@/lib/store';
import { Note } from '@/types/modules';
import { FileText } from 'lucide-react';

export const NoteModule = memo(function NoteModule(props: NodeProps) {
  const { data, id } = props;
  const [note, setNote] = useState<Note | null>(null);
  const { openModal, currentSceneId, refreshCounter } = useCanvasStore();
  const { setNodes, getNodes } = useReactFlow();

  useEffect(() => {
    if (data.referenceId) {
      fetch(`/api/notes/${data.referenceId}`)
        .then((res) => {
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          return res.json();
        })
        .then((data) => setNote(data.note))
        .catch((error) => console.error('Failed to load note:', error));
    }
  }, [data.referenceId, refreshCounter]);

  const handleOpenDetail = useCallback(() => {
    openModal(id, 'note');
  }, [id, openModal]);

  const handleCreateNote = useCallback(async () => {
    const noteId = crypto.randomUUID();
    const newNote: Note = {
      id: noteId,
      title: 'new note',
      content: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newNote),
      });

      await fetch(`/api/scenes/${currentSceneId}/nodes/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ referenceId: noteId }),
      });

      setNote(newNote);

      const nodes = getNodes();
      setNodes(
        nodes.map((n) =>
          n.id === id
            ? { ...n, data: { ...n.data, referenceId: noteId } }
            : n
        )
      );

      openModal(id, 'note');
    } catch (error) {
      console.error('Failed to create note:', error);
    }
  }, [currentSceneId, id, getNodes, setNodes, openModal]);

  return (
    <ModuleWrapper
      nodeProps={props}
      icon={<FileText className="h-3.5 w-3.5" />}
      color="text-[#fbbf24]"
      onOpenDetail={handleOpenDetail}
    >
      {note ? (
        <div className="text-xs leading-relaxed">
          <div className="text-[#888] mb-1 truncate">{note.title}</div>
          <div className="text-[#666] whitespace-pre-wrap line-clamp-6">
            {note.content || 'empty'}
          </div>
        </div>
      ) : (
        <button
          onClick={handleCreateNote}
          className="w-full h-full flex items-center justify-center text-xs text-[#555] hover:text-[#888] transition-colors"
        >
          + new note
        </button>
      )}
    </ModuleWrapper>
  );
});
