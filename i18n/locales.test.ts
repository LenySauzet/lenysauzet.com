import { describe, expect, it } from 'vitest';

import { homeAlternates, homePath, homeUrl, otherLocale, otherVersionOf, versionToOffer } from './locales';

describe('the two versions', () => {
  it('pair each language with the other', () => {
    expect(otherLocale('en')).toBe('fr');
    expect(otherLocale('fr')).toBe('en');
  });

  it('give English the unprefixed home, and an absolute URL without a trailing slash', () => {
    expect(homePath('en')).toBe('/');
    expect(homePath('fr')).toBe('/fr');
    expect(homeUrl('en')).toBe('https://lenysauzet.com');
    expect(homeUrl('fr')).toBe('https://lenysauzet.com/fr');
    expect(homeAlternates()).toEqual({
      en: 'https://lenysauzet.com',
      fr: 'https://lenysauzet.com/fr',
      'x-default': 'https://lenysauzet.com',
    });
  });

  it('lead from any page to the same page in the other language', () => {
    expect(otherVersionOf('/', 'en')).toBe('/fr');
    expect(otherVersionOf('/', 'fr')).toBe('/');
    expect(otherVersionOf('/resume', 'en')).toBe('/fr/resume');
    expect(otherVersionOf('/resume', 'fr')).toBe('/resume');
  });
});

describe('versionToOffer', () => {
  it('offers the other version to a reader whose first language it is, whatever the region', () => {
    expect(versionToOffer('en', ['fr-FR', 'en-US'])).toBe('fr');
    expect(versionToOffer('fr', ['en-GB', 'fr'])).toBe('en');
  });

  it('offers nothing to a reader who put the page language, or another, first', () => {
    expect(versionToOffer('en', ['en-US', 'fr'])).toBeUndefined();
    expect(versionToOffer('en', ['de-DE', 'fr'])).toBeUndefined();
    expect(versionToOffer('en', [])).toBeUndefined();
  });
});
