export type MidiTargetType =
  | 'audio-channel-volume'
  | 'audio-channel-play'
  | 'audio-scene-channel-volume'
  | 'audio-scene-master';

export interface MidiMapping {
  id: string;
  label: string;
  messageType: 'cc' | 'note';
  midiChannel: number;  // 0-15
  ccNumber: number;     // 0-127
  targetType: MidiTargetType;
  nodeId: string;       // ReactFlow node ID
  channelId?: string;   // for audio-scene-channel-volume
}

export interface MidiCommand {
  type: 'setVolume' | 'togglePlay' | 'stop';
  value?: number;  // 0-1 for volume
  seq: number;     // monotonic counter to ensure re-renders
}

export interface MidiLearnState {
  mappingId: string;
  timeoutId: ReturnType<typeof setTimeout>;
}
