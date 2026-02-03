'use client';

import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { NodeProps, useReactFlow } from 'reactflow';
import { ModuleWrapper } from './ModuleWrapper';
import { useCanvasStore } from '@/lib/store';
import { AudioScene, AudioChannel } from '@/types/modules';
import { Slider } from '@/components/ui/slider';
import { Layers, Play, Pause, Square } from 'lucide-react';

export const AudioSceneModule = memo(function AudioSceneModule(props: NodeProps) {
  const { data, id } = props;
  const [audioScene, setAudioScene] = useState<AudioScene | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [channelVolumes, setChannelVolumes] = useState<Record<string, number>>({});
  const audioRefs = useRef<Record<string, HTMLAudioElement>>({});
  const { openModal, currentSceneId, refreshCounter } = useCanvasStore();
  const { setNodes, getNodes } = useReactFlow();

  useEffect(() => {
    if (data.referenceId) {
      fetch(`/api/audio-scenes/${data.referenceId}`)
        .then((res) => {
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          return res.json();
        })
        .then((data) => {
          setAudioScene(data.audioScene);
          const volumes: Record<string, number> = {};
          data.audioScene?.channels?.forEach((ch: AudioChannel) => {
            volumes[ch.id] = ch.volume;
          });
          setChannelVolumes(volumes);
        })
        .catch((error) => console.error('Failed to load audio scene:', error));
    }
  }, [data.referenceId, refreshCounter]);

  const handlePlayAll = useCallback(() => {
    Object.values(audioRefs.current).forEach((audio) => audio.play());
    setIsPlaying(true);
  }, []);

  const handlePauseAll = useCallback(() => {
    Object.values(audioRefs.current).forEach((audio) => audio.pause());
    setIsPlaying(false);
  }, []);

  const handleStopAll = useCallback(() => {
    Object.values(audioRefs.current).forEach((audio) => {
      audio.pause();
      audio.currentTime = 0;
    });
    setIsPlaying(false);
  }, []);

  const handleChannelVolume = useCallback(
    (channelId: string, value: number[]) => {
      const newVolume = value[0];
      setChannelVolumes((prev) => ({ ...prev, [channelId]: newVolume }));
      if (audioRefs.current[channelId]) {
        audioRefs.current[channelId].volume = newVolume;
      }
    },
    []
  );

  const handleOpenDetail = useCallback(() => {
    openModal(id, 'audio-scene');
  }, [id, openModal]);

  const handleCreateScene = useCallback(async () => {
    const sceneId = crypto.randomUUID();
    const newScene: AudioScene = {
      id: sceneId,
      name: 'audio scene',
      channels: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      await fetch('/api/audio-scenes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newScene),
      });

      await fetch(`/api/scenes/${currentSceneId}/nodes/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ referenceId: sceneId }),
      });

      setAudioScene(newScene);

      const nodes = getNodes();
      setNodes(
        nodes.map((n) =>
          n.id === id ? { ...n, data: { ...n.data, referenceId: sceneId } } : n
        )
      );

      openModal(id, 'audio-scene');
    } catch (error) {
      console.error('Failed to create audio scene:', error);
    }
  }, [currentSceneId, id, getNodes, setNodes, openModal]);

  return (
    <ModuleWrapper
      nodeProps={props}
      icon={<Layers className="h-3.5 w-3.5" />}
      color="text-[#34d399]"
      onOpenDetail={handleOpenDetail}
    >
      {audioScene ? (
        <div className="space-y-2">
          <div className="flex items-center gap-1.5">
            <button
              onClick={isPlaying ? handlePauseAll : handlePlayAll}
              className="h-6 w-6 flex items-center justify-center rounded border border-[#333] bg-[#1f1f1f] text-[#888] hover:text-[#e5e5e5] hover:border-[#555]"
            >
              {isPlaying ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
            </button>
            <button
              onClick={handleStopAll}
              className="h-6 w-6 flex items-center justify-center rounded border border-[#333] bg-[#1f1f1f] text-[#888] hover:text-[#e5e5e5] hover:border-[#555]"
            >
              <Square className="h-3 w-3" />
            </button>
            <span className="text-[10px] text-[#666] ml-1">
              {audioScene.channels?.length || 0} tracks
            </span>
          </div>
          <div className="space-y-1.5 max-h-24 overflow-auto">
            {audioScene.channels?.map((channel) => (
              <div key={channel.id} className="flex items-center gap-2">
                <audio
                  ref={(el) => { if (el) audioRefs.current[channel.id] = el; }}
                  src={`/audio/${channel.audioFile?.filename}`}
                  loop={channel.loop}
                />
                <span className="text-[10px] text-[#666] truncate w-16">
                  {channel.audioFile?.name}
                </span>
                <Slider
                  value={[channelVolumes[channel.id] ?? channel.volume]}
                  onValueChange={(v) => handleChannelVolume(channel.id, v)}
                  max={1}
                  step={0.01}
                  className="flex-1"
                />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <button
          onClick={handleCreateScene}
          className="w-full h-full flex items-center justify-center text-xs text-[#555] hover:text-[#888] transition-colors"
        >
          + new scene
        </button>
      )}
    </ModuleWrapper>
  );
});
