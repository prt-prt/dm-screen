/**
 * Shared constants for the DM Screen application
 */

// Module colors for canvas elements
export const MODULE_COLORS = {
  note: '#fbbf24',
  statblock: '#f87171',
  'audio-channel': '#34d399',
  'audio-scene': '#34d399',
  initiative: '#60a5fa',
  calculator: '#a78bfa',
} as const;

// Canvas collision detection
export const COLLISION_GAP = 10;
export const COLLISION_MAX_RADIUS = 20;

// D&D statblock options
export const CREATURE_SIZES = [
  'Tiny',
  'Small',
  'Medium',
  'Large',
  'Huge',
  'Gargantuan',
] as const;

export const ALIGNMENTS = [
  'Lawful Good',
  'Neutral Good',
  'Chaotic Good',
  'Lawful Neutral',
  'True Neutral',
  'Chaotic Neutral',
  'Lawful Evil',
  'Neutral Evil',
  'Chaotic Evil',
  'Unaligned',
] as const;

export type CreatureSize = (typeof CREATURE_SIZES)[number];
export type Alignment = (typeof ALIGNMENTS)[number];
