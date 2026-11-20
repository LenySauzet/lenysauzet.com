import { describe, expect, it } from 'vitest';

import { commandFor, keyLabel, modifierLabel, togglesPalette } from './keys';
import { commands } from './registry';

const press = (key: string, modifier: 'meta' | 'ctrl' | null = 'meta') => ({
  key,
  metaKey: modifier === 'meta',
  ctrlKey: modifier === 'ctrl',
});

describe('togglesPalette', () => {
  it('answers ⌘K and Ctrl+K, never K alone', () => {
    expect(togglesPalette(press('k'))).toBe(true);
    expect(togglesPalette(press('k', 'ctrl'))).toBe(true);
    expect(togglesPalette(press('k', null))).toBe(false);
  });
});

describe('commandFor', () => {
  it('finds the command a shortcut names, only with a modifier held', () => {
    expect(commandFor(commands, press('d'))?.id).toBe('toggle-theme');
    expect(commandFor(commands, press('d', null))).toBeUndefined();
    expect(commandFor(commands, press('q'))).toBeUndefined();
  });
});

describe('modifierLabel', () => {
  it('names the Command key on Apple systems and Ctrl elsewhere', () => {
    expect(modifierLabel('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)')).toBe('⌘');
    expect(modifierLabel('Mozilla/5.0 (Windows NT 10.0; Win64; x64)')).toBe('Ctrl+');
  });
});

describe('keyLabel', () => {
  it('draws arrows as arrows and letters as capitals', () => {
    expect(keyLabel('ArrowUp')).toBe('↑');
    expect(keyLabel('s')).toBe('S');
  });
});
