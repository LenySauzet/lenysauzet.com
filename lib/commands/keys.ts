import type { Command } from './types';

export type Platform = 'apple' | 'other';

export type Chord = Pick<
  KeyboardEvent,
  'key' | 'code' | 'metaKey' | 'ctrlKey' | 'altKey' | 'shiftKey' | 'repeat' | 'isComposing' | 'defaultPrevented'
>;

const SYMBOLS: Record<string, string> = { ArrowUp: '↑', ArrowDown: '↓' };
const LETTER = /^[a-z]$/i;

export const platformOf = (userAgent: string): Platform => (/Mac|iPhone|iPad/.test(userAgent) ? 'apple' : 'other');

export const modifierLabel = (platform: Platform) => (platform === 'apple' ? '⌘' : 'Ctrl+');

export const keyLabel = (key: string) => SYMBOLS[key] ?? key.toUpperCase();

const keyOf = ({ key, code }: Chord) => {
  if (LETTER.test(key)) return key.toLowerCase();
  if (code.startsWith('Key')) return code.slice(3).toLowerCase();
  return key;
};

export function chordKey(event: Chord, platform: Platform) {
  const modifier = platform === 'apple' ? event.metaKey && !event.ctrlKey : event.ctrlKey && !event.metaKey;
  const disturbed = event.altKey || event.shiftKey || event.repeat || event.isComposing || event.defaultPrevented;

  return modifier && !disturbed ? keyOf(event) : undefined;
}

export const commandFor = (commands: Command[], key: string) => commands.find((command) => command.shortcut === key);

export const TOGGLE_KEY = 'k';
