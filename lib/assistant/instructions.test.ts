import { describe, expect, it } from 'vitest';

import { sampleCorpus } from '@/test/ask';

import { buildInstructions } from './instructions';

const build = (overrides: Partial<Parameters<typeof buildInstructions>[0]> = {}) =>
  buildInstructions({ corpus: sampleCorpus(), locale: 'en', today: '2026-11-28', ...overrides });

describe('buildInstructions', () => {
  it('says it is an AI, keeps what is off limits, and holds the corpus core with its ids', () => {
    const instructions = build();
    expect(instructions).toContain('You are the AI version of Lény Sauzet');
    expect(instructions).toMatch(/salary/);
    expect(instructions).toMatch(/always use "vous"/);
    expect(instructions).toContain('<project id="project:gitglow"');
    expect(instructions).toContain('<answer id="faq:looking-for"');
    expect(instructions).toContain('<article id="post:shaders"');
    expect(instructions).toContain('<profile id="profile">');
  });

  it('leaves the stories and articles out, to be read on demand', () => {
    const instructions = build();
    expect(instructions).not.toContain('A README is judged by its cover.');
    expect(instructions).not.toContain('A shader runs per pixel.');
  });

  it('keeps the same prefix from one request to the next, with the date and language at the end', () => {
    const english = build();
    const french = build({ locale: 'fr', today: '2026-11-29' });
    const tail = english.lastIndexOf('Today is');
    expect(french.slice(0, tail)).toBe(english.slice(0, tail));
    expect(english.slice(tail)).toBe('Today is 2026-11-28. The visitor is reading the portfolio in English.');
    expect(french).toMatch(/in French\.$/);
  });
});
