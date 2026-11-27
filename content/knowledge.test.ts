import { describe, expect, it } from 'vitest';

import { coreTokens, CORE_TOKEN_BUDGET, problemsOf } from '@/lib/assistant/knowledge/check';
import { readKnowledge } from '@/lib/assistant/knowledge/load';

import { projects } from './projects';

describe('the knowledge in content/knowledge', () => {
  it('reads, matches the cards and fits the prompt budget', async () => {
    const corpus = { ...(await readKnowledge()), posts: [] };

    expect(problemsOf(corpus, projects, false)).toEqual([]);
    expect(coreTokens(corpus)).toBeLessThanOrEqual(CORE_TOKEN_BUDGET);
  });

  it('gives every card a unique slug that names its folder on the CDN', () => {
    expect(new Set(projects.map((project) => project.slug)).size).toBe(projects.length);
    for (const project of projects) expect(project.image).toMatch(new RegExp(`^projects/${project.slug}/`));
  });
});
