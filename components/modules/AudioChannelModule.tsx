'use client';

import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { NodeProps, useReactFlow } from 'reactflow';
import { ModuleWrapper } from './ModuleWrapper';
import { useCanvasStore } from '@/lib/store';
import { useMidiCommand } from '@/lib/useMidiCommand';
import { AudioFile } from '@/types/modules';
import { Slider } from '@/components/ui/slider';
import { Music, Play, Pause, Repeat, Upload } from 'lucide-react';

export const AudioChannelModule = memo(function AudioChannelModule(props: NodeProps) {
  const { data, id } = props;
  const [audioFile, setAudioFile] = useState<AudioFile | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(data.config?.volume ?? 0.5);
  const [loop, setLoop] = useState(data.config?.loop ?? true);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { currentSceneId, refreshCounter } = useCanvasStore();
  const { setNodes, getNodes } = useReactFlow();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const midiCommand = useMidiCommand(id);
  const volumeSaveTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    if (data.referenceId) {
      fetch(`/api/audio/${data.referenceId}`)
        .then((res) => {
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          return res.json();
        })
        .then((data) => setAudioFile(data.audioFile))
        .catch((error) => console.error('Failed to load audio file:', error));
    }
  }, [data.referenceId, refreshCounter]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
      audioRef.current.loop = loop;
    }
  }, [volume, loop]);

  // MIDI command handler
  useEffect(() => {
    if (!midiCommand || !audioRef.current) return;
    switch (midiCommand.type) {
      case 'setVolume': {
        const v = midiCommand.value ?? 0;
        setVolume(v);
        audioRef.current.volume = v;
        // Debounce the API write
        clearTimeout(volumeSaveTimerRef.current);
        volumeSaveTimerRef.current = setTimeout(() => {
          fetch(`/api/scenes/${currentSceneId}/nodes/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ config: { ...data.config, volume: v } }),
          }).catch((err) => console.error('Failed to save MIDI volume:', err));
        }, 500);
        break;
      }
      case 'togglePlay':
        if (audioRef.current.paused) {
          audioRef.current.play();
          setIsPlaying(true);
        } else {
          audioRef.current.pause();
          setIsPlaying(false);
        }
        break;
      case 'stop':
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        setIsPlaying(false);
        break;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [midiCommand?.seq]);

  const handlePlayPause = useCallback(() => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  }, [isPlaying]);

  const handleVolumeChange = useCallback(
    (value: number[]) => {
      const newVolume = value[0];
      setVolume(newVolume);
      if (audioRef.current) audioRef.current.volume = newVolume;
      fetch(`/api/scenes/${currentSceneId}/nodes/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config: { ...data.config, volume: newVolume } }),
      }).catch((error) => console.error('Failed to save volume:', error));
    },
    [currentSceneId, id, data.config]
  );

  const handleToggleLoop = useCallback(() => {
    const newLoop = !loop;
    setLoop(newLoop);
    if (audioRef.current) audioRef.current.loop = newLoop;
    fetch(`/api/scenes/${currentSceneId}/nodes/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ config: { ...data.config, loop: newLoop } }),
    }).catch((error) => console.error('Failed to save loop setting:', error));
  }, [loop, currentSceneId, id, data.config]);

  const handleFileUpload = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      const formData = new FormData();
      formData.append('file', file);

      try {
        const res = await fetch('/api/audio', { method: 'POST', body: formData });
        const data = await res.json();

        await fetch(`/api/scenes/${currentSceneId}/nodes/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ referenceId: data.audioFile.id }),
        });

        setAudioFile(data.audioFile);

        const nodes = getNodes();
        setNodes(
          nodes.map((n) =>
            n.id === id ? { ...n, data: { ...n.data, referenceId: data.audioFile.id } } : n
          )
        );
      } catch (error) {
        console.error('Failed to upload audio:', error);
      }
    },
    [currentSceneId, id, getNodes, setNodes]
  );

  return (
    <ModuleWrapper
      nodeProps={props}
      icon={<Music className="h-3.5 w-3.5" />}
      color="text-[#34d399]"
    >
      {audioFile ? (
        <div className="space-y-2">
          <audio
            ref={audioRef}
            src={`/audio/${audioFile.filename}`}
            loop={loop}
            onEnded={() => setIsPlaying(false)}
          />
          <div className="text-xs text-[#888] truncate">{audioFile.name}</div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePlayPause}
              className="h-6 w-6 flex items-center justify-center rounded border border-[#333] bg-[#1f1f1f] text-[#888] hover:text-[#e5e5e5] hover:border-[#555]"
            >
              {isPlaying ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
            </button>
            <Slider
              value={[volume]}
              onValueChange={handleVolumeChange}
              max={1}
              step={0.01}
              className="flex-1"
            />
            <button
              onClick={handleToggleLoop}
              className={`h-6 w-6 flex items-center justify-center rounded border ${
                loop
                  ? 'border-[#34d399] text-[#34d399]'
                  : 'border-[#333] text-[#555] hover:text-[#888]'
              }`}
            >
              <Repeat className="h-3 w-3" />
            </button>
          </div>
        </div>
      ) : (
        <>
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*"
            onChange={handleFileUpload}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full h-full flex flex-col items-center justify-center text-xs text-[#555] hover:text-[#888] transition-colors gap-1"
          >
            <Upload className="h-4 w-4" />
            upload
          </button>
        </>
      )}
    </ModuleWrapper>
  );
});
