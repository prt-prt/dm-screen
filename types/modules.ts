export type ModuleType =
  | 'note'
  | 'statblock'
  | 'audio-channel'
  | 'audio-scene'
  | 'initiative'
  | 'calculator';

export interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface Statblock {
  id: string;
  name: string;
  size: string;
  type: string;
  alignment: string;
  armorClass: number;
  hitPoints: number;
  hitDice: string;
  speed: string;
  str: number;
  dex: number;
  con: number;
  int: number;
  wis: number;
  cha: number;
  savingThrows?: string;
  skills?: string;
  damageResistances?: string;
  damageImmunities?: string;
  conditionImmunities?: string;
  senses: string;
  languages: string;
  challenge: string;
  traits?: string;
  actions?: string;
  reactions?: string;
  legendaryActions?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AudioFile {
  id: string;
  name: string;
  filename: string;
  duration?: number;
  createdAt: string;
}

export interface AudioScene {
  id: string;
  name: string;
  channels: AudioChannel[];
  createdAt: string;
  updatedAt: string;
}

export interface AudioChannel {
  id: string;
  audioFileId: string;
  audioFile?: AudioFile;
  volume: number;
  loop: boolean;
}

export interface Combatant {
  id: string;
  name: string;
  initiative: number;
  hp: number;
  maxHp: number;
  ac: number;
  conditions?: string[];
  isPlayer: boolean;
  statblockId?: string;
}

export interface InitiativeTracker {
  id: string;
  name: string;
  combatants: Combatant[];
  currentTurn: number;
  round: number;
  createdAt: string;
  updatedAt: string;
}
