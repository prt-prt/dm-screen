import { useMidiStore } from '@/lib/midi';
import { MidiCommand } from '@/types/midi';

export function useMidiCommand(nodeId: string): MidiCommand | undefined {
  return useMidiStore((state) => state.commands[nodeId]);
}

export function useMidiChannelCommand(nodeId: string, channelId: string): MidiCommand | undefined {
  const key = `${nodeId}:${channelId}`;
  return useMidiStore((state) => state.channelCommands[key]);
}
