import { describe, expect, it } from 'vitest';

import { chordKey, commandFor, keyLabel, modifierLabel, platformOf, type Chord } from './keys';
import { commands } from './registry';

const chord = (fields: Partial<Chord>): Chord => ({
  key: 'd',
  code: 'KeyD',
  metaKey: true,
  ctrlKey: false,
  altKey: false,
  shiftKey: false,
  repeat: false,
  isComposing: false,
  defaultPrevented: false,
  ...fields,
});

describe('chordKey', () => {
  it('reads ⌘ on Apple systems and Ctrl elsewhere, never the other', () => {
    expect(chordKey(chord({}), 'apple')).toBe('d');
    expect(chordKey(chord({ metaKey: false, ctrlKey: true }), 'apple')).toBeUndefined();
    expect(chordKey(chord({ metaKey: false, ctrlKey: true }), 'other')).toBe('d');
    expect(chordKey(chord({}), 'other')).toBeUndefined();
  });

  it('ignores a key held down, another modifier, a composition and a key already handled', () => {
    for (const disturbance of [{ repeat: true }, { altKey: true }, { shiftKey: true }, { isComposing: true }, { defaultPrevented: true }])
      expect(chordKey(chord(disturbance), 'apple')).toBeUndefined();
  });

  it('reads the letter whatever Caps Lock or the layout says', () => {
    expect(chordKey(chord({ key: 'D' }), 'apple')).toBe('d');
    expect(chordKey(chord({ key: 'в' }), 'apple')).toBe('d');
    expect(chordKey(chord({ key: 'ArrowUp', code: 'ArrowUp' }), 'apple')).toBe('ArrowUp');
  });
});

describe('commandFor', () => {
  it('finds the command a shortcut names', () => {
    expect(commandFor(commands, 'd')?.id).toBe('toggle-theme');
    expect(commandFor(commands, 'q')).toBeUndefined();
  });
});

describe('modifierLabel', () => {
  it('names the Command key on Apple systems and Ctrl elsewhere', () => {
    expect(modifierLabel(platformOf('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)'))).toBe('⌘');
    expect(modifierLabel(platformOf('Mozilla/5.0 (Windows NT 10.0; Win64; x64)'))).toBe('Ctrl+');
  });
});

describe('keyLabel', () => {
  it('draws arrows as arrows and letters as capitals', () => {
    expect(keyLabel('ArrowUp')).toBe('↑');
    expect(keyLabel('s')).toBe('S');
  });
});
