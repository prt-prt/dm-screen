'use client';

import { useEffect, useState } from 'react';
import { useCanvasStore } from '@/lib/store';
import { CanvasScene } from '@/types/canvas';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { ChevronDown, Plus, Trash2, Edit2, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export function SceneSelector() {
  const { scenes, setScenes, currentSceneId, setCurrentScene, addScene, deleteScene, updateScene } =
    useCanvasStore();
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');

  useEffect(() => {
    async function loadScenes() {
      try {
        const res = await fetch('/api/scenes');
        if (res.ok) {
          const data = await res.json();
          setScenes(data.scenes || []);
        }
      } catch (error) {
        console.error('Failed to load scenes:', error);
      }
    }
    loadScenes();
  }, [setScenes]);

  const handleCreateScene = async () => {
    const id = crypto.randomUUID();
    const name = `scene ${scenes.length + 1}`;
    const newScene: CanvasScene = {
      id,
      name,
      viewport: { x: 0, y: 0, zoom: 1 },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      await fetch('/api/scenes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newScene),
      });
      addScene(newScene);
      setCurrentScene(id);
    } catch (error) {
      console.error('Failed to create scene:', error);
    }
  };

  const handleDeleteScene = async (sceneId: string) => {
    if (scenes.length <= 1) return;

    try {
      await fetch(`/api/scenes/${sceneId}`, { method: 'DELETE' });
      deleteScene(sceneId);
      if (currentSceneId === sceneId) {
        const remaining = scenes.filter((s) => s.id !== sceneId);
        setCurrentScene(remaining[0]?.id || 'default');
      }
    } catch (error) {
      console.error('Failed to delete scene:', error);
    }
  };

  const handleRenameScene = async () => {
    if (!editName.trim()) {
      setIsEditing(false);
      return;
    }

    try {
      await fetch(`/api/scenes/${currentSceneId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editName }),
      });
      updateScene(currentSceneId, { name: editName });
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to rename scene:', error);
    }
  };

  const currentScene = scenes.find((s) => s.id === currentSceneId);

  return (
    <>
      {isEditing ? (
        <div className="flex items-center gap-1 bg-[#242424] border border-[#333] rounded px-2 py-1">
          <input
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleRenameScene()}
            className="bg-transparent text-xs text-[#e5e5e5] w-24 outline-none"
            autoFocus
          />
          <button
            onClick={handleRenameScene}
            className="text-[#34d399] hover:text-[#4ade80]"
          >
            <Check className="h-3 w-3" />
          </button>
          <button
            onClick={() => setIsEditing(false)}
            className="text-[#888] hover:text-[#e5e5e5]"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      ) : (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-1.5 h-7 px-2 rounded border border-[#333] bg-[#242424] text-[#888] hover:text-[#e5e5e5] hover:bg-[#2a2a2a] transition-colors text-xs">
              <span className="max-w-24 truncate">{currentScene?.name || 'scene'}</span>
              <ChevronDown className="h-3 w-3" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="min-w-32 bg-[#242424] border-[#333]">
            {scenes.map((scene) => (
              <DropdownMenuItem
                key={scene.id}
                onClick={() => setCurrentScene(scene.id)}
                className={cn(
                  'cursor-pointer text-xs gap-2',
                  scene.id === currentSceneId
                    ? 'text-[#e5e5e5] bg-[#2a2a2a]'
                    : 'text-[#888] hover:text-[#e5e5e5] hover:bg-[#2a2a2a]'
                )}
              >
                {scene.name}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator className="bg-[#333]" />
            <DropdownMenuItem
              onClick={() => {
                setEditName(currentScene?.name || '');
                setIsEditing(true);
              }}
              className="cursor-pointer text-xs text-[#888] hover:text-[#e5e5e5] hover:bg-[#2a2a2a] gap-2"
            >
              <Edit2 className="h-3 w-3" />
              rename
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={handleCreateScene}
              className="cursor-pointer text-xs text-[#888] hover:text-[#e5e5e5] hover:bg-[#2a2a2a] gap-2"
            >
              <Plus className="h-3 w-3" />
              new scene
            </DropdownMenuItem>
            {scenes.length > 1 && (
              <DropdownMenuItem
                onClick={() => handleDeleteScene(currentSceneId)}
                className="cursor-pointer text-xs text-[#f87171] hover:text-[#fca5a5] hover:bg-[#2a2a2a] gap-2"
              >
                <Trash2 className="h-3 w-3" />
                delete
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </>
  );
}
