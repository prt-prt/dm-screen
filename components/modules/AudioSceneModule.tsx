'use client';

import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { NodeProps, useReactFlow } from 'reactflow';
import { ModuleWrapper } from './ModuleWrapper';
import { useCanvasStore } from '@/lib/store';
import { useMidiCommand, useMidiChannelCommand } from '@/lib/useMidiCommand';
import { AudioScene, AudioChannel } from '@/types/modules';
import { Slider } from '@/components/ui/slider';
import { Layers, Play, Pause, Square } from 'lucide-react';

// Sub-component for each channel so hooks can be called per-channel
function AudioSceneChannel({
  channel,
  nodeId,
  volume,
  onVolumeChange,
  onAudioRef,
}: {
  channel: AudioChannel;
  nodeId: string;
  volume: number;
  onVolumeChange: (channelId: string, value: number[]) => void;
  onAudioRef: (channelId: string, el: HTMLAudioElement | null) => void;
}) {
  const midiCommand = useMidiChannelCommand(nodeId, channel.id);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const setRef = useCallback(
    (el: HTMLAudioElement | null) => {
      audioRef.current = el;
      onAudioRef(channel.id, el);
    },
    [channel.id, onAudioRef]
  );

  // Apply MIDI channel commands
  useEffect(() => {
    if (!midiCommand || !audioRef.current) return;
    if (midiCommand.type === 'setVolume') {
      const v = midiCommand.value ?? 0;
      audioRef.current.volume = v;
      onVolumeChange(channel.id, [v]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [midiCommand?.seq]);

  return (
    <div className="flex items-center gap-2">
      <audio
        ref={setRef}
        src={`/audio/${channel.audioFile?.filename}`}
        loop={channel.loop}
      />
      <span className="text-[10px] text-[#666] truncate w-16">
        {channel.audioFile?.name}
      </span>
      <Slider
        value={[volume]}
        onValueChange={(v) => onVolumeChange(channel.id, v)}
        max={1}
        step={0.01}
        className="flex-1"
      />
    </div>
  );
}

export const AudioSceneModule = memo(function AudioSceneModule(props: NodeProps) {
  const { data, id } = props;
  const [audioScene, setAudioScene] = useState<AudioScene | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [channelVolumes, setChannelVolumes] = useState<Record<string, number>>({});
  const audioRefs = useRef<Record<string, HTMLAudioElement>>({});
  const { openModal, currentSceneId, refreshCounter } = useCanvasStore();
  const { setNodes, getNodes } = useReactFlow();
  const midiCommand = useMidiCommand(id);

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

  // MIDI master command handler
  useEffect(() => {
    if (!midiCommand) return;
    switch (midiCommand.type) {
      case 'togglePlay':
        if (isPlaying) {
          handlePauseAll();
        } else {
          handlePlayAll();
        }
        break;
      case 'stop':
        handleStopAll();
        break;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [midiCommand?.seq]);

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

  const handleAudioRef = useCallback(
    (channelId: string, el: HTMLAudioElement | null) => {
      if (el) {
        audioRefs.current[channelId] = el;
      } else {
        delete audioRefs.current[channelId];
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
          <div className="space-y-1.5">
            {audioScene.channels?.map((channel) => (
              <AudioSceneChannel
                key={channel.id}
                channel={channel}
                nodeId={id}
                volume={channelVolumes[channel.id] ?? channel.volume}
                onVolumeChange={handleChannelVolume}
                onAudioRef={handleAudioRef}
              />
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
