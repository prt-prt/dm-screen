'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { AudioScene, AudioChannel, AudioFile } from '@/types/modules';
import { Slider } from '@/components/ui/slider';
import { Plus, Trash2, Upload, Repeat } from 'lucide-react';
import { useCanvasStore } from '@/lib/store';

interface AudioSceneEditorProps {
  sceneId: string;
  onClose: () => void;
}

export function AudioSceneEditor({ sceneId, onClose }: AudioSceneEditorProps) {
  const [scene, setScene] = useState<AudioScene | null>(null);
  const [audioFiles, setAudioFiles] = useState<AudioFile[]>([]);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { triggerRefresh } = useCanvasStore();

  useEffect(() => {
    fetch(`/api/audio-scenes/${sceneId}`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => setScene(data.audioScene))
      .catch((error) => console.error('Failed to load audio scene:', error));

    fetch('/api/audio')
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => setAudioFiles(data.audioFiles || []))
      .catch((error) => console.error('Failed to load audio files:', error));
  }, [sceneId]);

  const handleAddChannel = useCallback(
    (audioFile: AudioFile) => {
      if (!scene) return;
      const newChannel: AudioChannel = {
        id: crypto.randomUUID(),
        audioFileId: audioFile.id,
        audioFile,
        volume: 0.5,
        loop: true,
      };
      setScene({ ...scene, channels: [...(scene.channels || []), newChannel] });
    },
    [scene]
  );

  const handleUpdateChannel = useCallback(
    (channelId: string, field: keyof AudioChannel, value: number | boolean) => {
      if (!scene) return;
      setScene({
        ...scene,
        channels: scene.channels.map((c) =>
          c.id === channelId ? { ...c, [field]: value } : c
        ),
      });
    },
    [scene]
  );

  const handleRemoveChannel = useCallback(
    (channelId: string) => {
      if (!scene) return;
      setScene({ ...scene, channels: scene.channels.filter((c) => c.id !== channelId) });
    },
    [scene]
  );

  const handleFileUpload = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      const formData = new FormData();
      formData.append('file', file);

      try {
        const res = await fetch('/api/audio', { method: 'POST', body: formData });
        const data = await res.json();
        setAudioFiles([...audioFiles, data.audioFile]);
        handleAddChannel(data.audioFile);
      } catch (error) {
        console.error('Failed to upload audio:', error);
      }
    },
    [audioFiles, handleAddChannel]
  );

  const handleSave = useCallback(async () => {
    if (!scene) return;
    setSaving(true);
    try {
      await fetch(`/api/audio-scenes/${sceneId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: scene.name, channels: scene.channels }),
      });
      triggerRefresh();
      onClose();
    } catch (error) {
      console.error('Failed to save audio scene:', error);
    } finally {
      setSaving(false);
    }
  }, [sceneId, scene, onClose, triggerRefresh]);

  if (!scene) {
    return <div className="py-8 text-center text-[#666] text-sm">loading...</div>;
  }

  const availableFiles = audioFiles.filter(
    (af) => !scene.channels?.some((c) => c.audioFileId === af.id)
  );

  return (
    <div className="space-y-4">
      <input
        value={scene.name}
        onChange={(e) => setScene({ ...scene, name: e.target.value })}
        placeholder="scene name"
        className="w-full px-3 py-2 text-sm bg-[#242424] border border-[#333] rounded text-[#e5e5e5] placeholder-[#555] focus:outline-none focus:border-[#555]"
      />

      <div className="space-y-2">
        <div className="text-[10px] text-[#666] uppercase tracking-wide">channels</div>
        {scene.channels?.map((channel) => (
          <div key={channel.id} className="flex items-center gap-3 p-2 border border-[#333] rounded bg-[#242424]">
            <span className="w-24 truncate text-xs text-[#888]">{channel.audioFile?.name}</span>
            <Slider
              value={[channel.volume]}
              onValueChange={(v) => handleUpdateChannel(channel.id, 'volume', v[0])}
              max={1}
              step={0.01}
              className="flex-1"
            />
            <button
              onClick={() => handleUpdateChannel(channel.id, 'loop', !channel.loop)}
              className={`h-6 w-6 flex items-center justify-center rounded border ${
                channel.loop
                  ? 'border-[#34d399] text-[#34d399]'
                  : 'border-[#333] text-[#555] hover:text-[#888]'
              }`}
            >
              <Repeat className="h-3 w-3" />
            </button>
            <button
              onClick={() => handleRemoveChannel(channel.id)}
              className="text-[#666] hover:text-[#f87171]"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          </div>
        ))}
        {(!scene.channels || scene.channels.length === 0) && (
          <div className="text-center text-[#555] text-xs py-4">no channels</div>
        )}
      </div>

      <div className="space-y-2">
        <div className="text-[10px] text-[#666] uppercase tracking-wide">add audio</div>
        <div className="flex gap-1.5 flex-wrap">
          {availableFiles.map((file) => (
            <button
              key={file.id}
              onClick={() => handleAddChannel(file)}
              className="px-2 py-1 text-[10px] text-[#888] hover:text-[#e5e5e5] border border-[#333] rounded hover:border-[#555] flex items-center gap-1"
            >
              <Plus className="h-2.5 w-2.5" /> {file.name}
            </button>
          ))}
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*"
            onChange={handleFileUpload}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-2 py-1 text-[10px] text-[#888] hover:text-[#e5e5e5] border border-dashed border-[#333] rounded hover:border-[#555] flex items-center gap-1"
          >
            <Upload className="h-2.5 w-2.5" /> upload
          </button>
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <button onClick={onClose} className="px-3 py-1.5 text-xs text-[#888] hover:text-[#e5e5e5] transition-colors">
          cancel
        </button>
        <button onClick={handleSave} disabled={saving} className="px-3 py-1.5 text-xs bg-[#333] text-[#e5e5e5] rounded hover:bg-[#444] disabled:opacity-50 transition-colors">
          {saving ? 'saving...' : 'save'}
        </button>
      </div>
    </div>
  );
}
