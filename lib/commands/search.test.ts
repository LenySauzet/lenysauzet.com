import { describe, expect, it } from 'vitest';

import { matchCommand } from './search';

describe('matchCommand', () => {
  it('finds a command typed without its accents, or with accents it does not have', () => {
    expect(matchCommand('Télécharger le CV', 'telecharger')).toBeGreaterThan(0);
    expect(matchCommand('Revenir en haut', 'révenir')).toBeGreaterThan(0);
  });

  it('still tells unrelated words apart', () => {
    expect(matchCommand('Télécharger le CV', 'thème')).toBe(0);
  });
});
