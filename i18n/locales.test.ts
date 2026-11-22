import { describe, expect, it } from 'vitest';

import { otherLocale, versionToOffer } from './locales';

describe('the other version', () => {
  it('is the other language of the site', () => {
    expect(otherLocale('en')).toBe('fr');
    expect(otherLocale('fr')).toBe('en');
  });

  it('is offered to a reader whose first language it is, whatever the region', () => {
    expect(versionToOffer('en', ['fr-FR', 'en-US'])).toBe('fr');
    expect(versionToOffer('fr', ['en-GB', 'fr'])).toBe('en');
  });

  it('is not offered to a reader who put the page language, or another, first', () => {
    expect(versionToOffer('en', ['en-US', 'fr'])).toBeUndefined();
    expect(versionToOffer('en', ['de-DE', 'fr'])).toBeUndefined();
    expect(versionToOffer('en', [])).toBeUndefined();
  });
});
