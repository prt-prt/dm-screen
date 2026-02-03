'use client';

import { useEffect, useState, useCallback } from 'react';
import { Note } from '@/types/modules';
import { useCanvasStore } from '@/lib/store';

interface NoteEditorProps {
  noteId: string;
  onClose: () => void;
}

export function NoteEditor({ noteId, onClose }: NoteEditorProps) {
  const [note, setNote] = useState<Note | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);
  const { triggerRefresh } = useCanvasStore();

  useEffect(() => {
    fetch(`/api/notes/${noteId}`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        setNote(data.note);
        setTitle(data.note.title);
        setContent(data.note.content);
      })
      .catch((error) => console.error('Failed to load note:', error));
  }, [noteId]);

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      await fetch(`/api/notes/${noteId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content }),
      });
      triggerRefresh();
      onClose();
    } catch (error) {
      console.error('Failed to save note:', error);
    } finally {
      setSaving(false);
    }
  }, [noteId, title, content, onClose, triggerRefresh]);

  if (!note) {
    return <div className="py-8 text-center text-[#666] text-sm">loading...</div>;
  }

  return (
    <div className="space-y-3">
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="title"
        className="w-full px-3 py-2 text-sm bg-[#242424] border border-[#333] rounded text-[#e5e5e5] placeholder-[#555] focus:outline-none focus:border-[#555]"
      />
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="write your note..."
        className="w-full h-80 px-3 py-2 text-sm bg-[#242424] border border-[#333] rounded text-[#e5e5e5] placeholder-[#555] resize-none focus:outline-none focus:border-[#555]"
      />
      <div className="flex justify-end gap-2">
        <button
          onClick={onClose}
          className="px-3 py-1.5 text-xs text-[#888] hover:text-[#e5e5e5] transition-colors"
        >
          cancel
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-3 py-1.5 text-xs bg-[#333] text-[#e5e5e5] rounded hover:bg-[#444] disabled:opacity-50 transition-colors"
        >
          {saving ? 'saving...' : 'save'}
        </button>
      </div>
    </div>
  );
}
