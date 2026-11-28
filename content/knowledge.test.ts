import { describe, expect, it } from 'vitest';

import { coreTokens, CORE_TOKEN_BUDGET, problemsOf } from '@/lib/assistant/knowledge/check';
import { readKnowledge } from '@/lib/assistant/knowledge/load';

import { projects as cards } from './projects';

describe('the knowledge in content/knowledge', () => {
  it('reads, matches the cards and fits the prompt budget', async () => {
    const corpus = { ...(await readKnowledge()), blog: { posts: [], complete: false } };

    expect(problemsOf(corpus, cards)).toEqual([]);
    expect(coreTokens(corpus)).toBeLessThanOrEqual(CORE_TOKEN_BUDGET);
  });

  it('gives every story and answer an id no other entry uses', async () => {
    const { stories, faq } = await readKnowledge();
    const ids = [...stories, ...faq].map((entry) => entry.id);

    expect(new Set(ids).size).toBe(ids.length);
  });

  it('gives every card a unique slug that names its folder on the CDN', () => {
    expect(new Set(cards.map((card) => card.slug)).size).toBe(cards.length);
    for (const card of cards) expect(card.image).toMatch(new RegExp(`^projects/${card.slug}/`));
  });
});
