import type { Command } from './types';

const SYMBOLS: Record<string, string> = { ArrowUp: '↑', ArrowDown: '↓' };

export const modifierLabel = (userAgent: string) => (/Mac|iPhone|iPad/.test(userAgent) ? '⌘' : 'Ctrl+');

export const keyLabel = (key: string) => SYMBOLS[key] ?? key.toUpperCase();

export const commandFor = (commands: Command[], event: Pick<KeyboardEvent, 'key' | 'metaKey' | 'ctrlKey'>) =>
  event.metaKey || event.ctrlKey ? commands.find((command) => command.shortcut === event.key) : undefined;

export const togglesPalette = (event: Pick<KeyboardEvent, 'key' | 'metaKey' | 'ctrlKey'>) =>
  (event.metaKey || event.ctrlKey) && event.key === 'k';
