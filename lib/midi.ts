import { create } from 'zustand';
import { MidiMapping, MidiCommand, MidiLearnState } from '@/types/midi';

const STORAGE_KEY = 'dm-screen-midi-mappings';

interface MidiState {
  // Connection
  midiAccess: MIDIAccess | null;
  connectedDevices: string[];
  supported: boolean;

  // Mappings
  mappings: MidiMapping[];

  // Command bus: nodeId -> latest command
  commands: Record<string, MidiCommand>;
  // Channel-level commands: `${nodeId}:${channelId}` -> latest command
  channelCommands: Record<string, MidiCommand>;

  // Learn mode
  learnState: MidiLearnState | null;

  // Seq counter
  _seq: number;

  // Actions
  init: () => Promise<void>;
  addMapping: (mapping: MidiMapping) => void;
  updateMapping: (id: string, updates: Partial<MidiMapping>) => void;
  deleteMapping: (id: string) => void;
  startLearn: (mappingId: string) => void;
  cancelLearn: () => void;
  dispatch: (nodeId: string, command: Omit<MidiCommand, 'seq'>) => void;
  dispatchChannel: (nodeId: string, channelId: string, command: Omit<MidiCommand, 'seq'>) => void;
}

function loadMappings(): MidiMapping[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveMappings(mappings: MidiMapping[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(mappings));
  } catch {
    // localStorage full or unavailable
  }
}

export const useMidiStore = create<MidiState>((set, get) => ({
  midiAccess: null,
  connectedDevices: [],
  supported: typeof navigator !== 'undefined' && 'requestMIDIAccess' in navigator,
  mappings: loadMappings(),
  commands: {},
  channelCommands: {},
  learnState: null,
  _seq: 0,

  init: async () => {
    if (!navigator.requestMIDIAccess) {
      set({ supported: false });
      return;
    }

    try {
      const access = await navigator.requestMIDIAccess();
      set({ midiAccess: access });

      const updateDevices = () => {
        const devices: string[] = [];
        access.inputs.forEach((input) => {
          devices.push(input.name || 'Unknown device');
        });
        set({ connectedDevices: devices });
      };

      updateDevices();
      access.onstatechange = updateDevices;

      // Attach message handler to all inputs
      access.inputs.forEach((input) => {
        input.onmidimessage = (event) => handleMidiMessage(event);
      });

      // Re-attach on state change (new devices)
      access.onstatechange = (event) => {
        updateDevices();
        access.inputs.forEach((input) => {
          input.onmidimessage = (event) => handleMidiMessage(event);
        });
      };
    } catch (err) {
      console.error('Failed to access MIDI:', err);
    }
  },

  addMapping: (mapping) => {
    const mappings = [...get().mappings, mapping];
    set({ mappings });
    saveMappings(mappings);
  },

  updateMapping: (id, updates) => {
    const mappings = get().mappings.map((m) =>
      m.id === id ? { ...m, ...updates } : m
    );
    set({ mappings });
    saveMappings(mappings);
  },

  deleteMapping: (id) => {
    const mappings = get().mappings.filter((m) => m.id !== id);
    set({ mappings });
    saveMappings(mappings);
  },

  startLearn: (mappingId) => {
    const prev = get().learnState;
    if (prev) clearTimeout(prev.timeoutId);

    const timeoutId = setTimeout(() => {
      set({ learnState: null });
    }, 10000);

    set({ learnState: { mappingId, timeoutId } });
  },

  cancelLearn: () => {
    const prev = get().learnState;
    if (prev) clearTimeout(prev.timeoutId);
    set({ learnState: null });
  },

  dispatch: (nodeId, command) => {
    const seq = get()._seq + 1;
    set({
      _seq: seq,
      commands: { ...get().commands, [nodeId]: { ...command, seq } },
    });
  },

  dispatchChannel: (nodeId, channelId, command) => {
    const seq = get()._seq + 1;
    const key = `${nodeId}:${channelId}`;
    set({
      _seq: seq,
      channelCommands: { ...get().channelCommands, [key]: { ...command, seq } },
    });
  },
}));

function handleMidiMessage(event: MIDIMessageEvent) {
  const data = event.data;
  if (!data || data.length < 3) return;

  const status = data[0];
  const channel = status & 0x0f;
  const messageType = status & 0xf0;
  const ccNumber = data[1];
  const value = data[2];

  // Determine if CC (0xB0) or Note On (0x90)
  let type: 'cc' | 'note' | null = null;
  if (messageType === 0xb0) type = 'cc';
  else if (messageType === 0x90) type = 'note';
  else return;

  const store = useMidiStore.getState();

  // Learn mode: intercept and assign
  if (store.learnState) {
    const { mappingId, timeoutId } = store.learnState;
    clearTimeout(timeoutId);
    store.updateMapping(mappingId, {
      messageType: type,
      midiChannel: channel,
      ccNumber: ccNumber,
    });
    useMidiStore.setState({ learnState: null });
    return;
  }

  // Find matching mappings
  const matches = store.mappings.filter(
    (m) => m.messageType === type && m.midiChannel === channel && m.ccNumber === ccNumber
  );

  for (const mapping of matches) {
    const normalizedValue = value / 127;

    switch (mapping.targetType) {
      case 'audio-channel-volume':
        store.dispatch(mapping.nodeId, { type: 'setVolume', value: normalizedValue });
        break;
      case 'audio-channel-play':
        // Note on with velocity > 0 = toggle, velocity 0 = note off (ignore)
        if (type === 'note' && value === 0) break;
        store.dispatch(mapping.nodeId, { type: 'togglePlay' });
        break;
      case 'audio-scene-channel-volume':
        if (mapping.channelId) {
          store.dispatchChannel(mapping.nodeId, mapping.channelId, {
            type: 'setVolume',
            value: normalizedValue,
          });
        }
        break;
      case 'audio-scene-master':
        // Note on with velocity > 0 = toggle, velocity 0 = note off (ignore)
        if (type === 'note' && value === 0) break;
        store.dispatch(mapping.nodeId, { type: 'togglePlay' });
        break;
    }
  }
}
