import { describe, expect, it } from 'vitest';

import type { Project as Shown } from '@/content/projects';

import { coreTokens, problemsOf, untold } from './check';
import type { Corpus, Post, Project } from './corpus';

const card = (fields: Partial<Shown> = {}): Shown => ({
  slug: 'gitglow',
  title: 'GitGlow',
  year: '2026',
  image: 'projects/gitglow/cover.jpg',
  ...fields,
});

const told = (fields: Partial<Project> = {}): Project => ({
  id: 'project:gitglow',
  slug: 'gitglow',
  title: 'GitGlow',
  year: '2026',
  status: 'shipped',
  role: 'solo',
  stack: ['Next.js'],
  blogPosts: [],
  summary: 'A poster from a profile.',
  body: '## Context\n\nText.',
  ...fields,
});

const post = (slug: string): Post => ({
  id: `post:${slug}`,
  slug,
  url: `https://blog.lenysauzet.com/posts/${slug}`,
  title: slug,
  description: 'About it.',
  date: '2026-07-19',
  tags: [],
  body: 'Body.',
});

const corpus = (fields: Partial<Corpus> = {}): Corpus => ({
  profile: {} as Corpus['profile'],
  projects: [told()],
  faq: [],
  posts: [],
  ...fields,
});

describe('problemsOf', () => {
  it('finds nothing wrong when a story matches its card', () => {
    expect(problemsOf(corpus(), [card()], true)).toEqual([]);
  });

  it('reports a story without a card, and a title or year that drifted from it', () => {
    expect(problemsOf(corpus(), [card({ slug: 'other' })], true)).toEqual([
      'projects/gitglow.md has no entry in content/projects.ts',
    ]);
    expect(problemsOf(corpus(), [card({ title: 'Git Glow', year: '2025' })], true)).toEqual([
      'projects/gitglow.md is titled "GitGlow", its card "Git Glow"',
      'projects/gitglow.md is from 2026, its card from 2025',
    ]);
  });

  it('requires the article a card links to among the story posts', () => {
    const linked = card({ action: { kind: 'article', slug: 'gitglow-story' } });

    expect(problemsOf(corpus({ posts: [post('gitglow-story')] }), [linked], true)).toEqual([
      'projects/gitglow.md does not list "gitglow-story", the article its card links to',
    ]);
  });

  it('reports a post the blog does not publish, only when the blog was read in full', () => {
    const listing = corpus({ projects: [told({ blogPosts: ['ghost'] })] });

    expect(problemsOf(listing, [card()], true)).toEqual([
      'projects/gitglow.md lists "ghost", which the blog does not publish',
    ]);
    expect(problemsOf(listing, [card()], false)).toEqual([]);
  });
});

describe('untold', () => {
  it('lists the cards still waiting for their story', () => {
    expect(untold(corpus(), [card(), card({ slug: 'trigrid', title: 'TriGrid' })])).toEqual(['trigrid']);
  });
});

describe('coreTokens', () => {
  it('counts summaries but not the stories read on demand', () => {
    const long = corpus({ projects: [told({ body: 'x'.repeat(40_000) })] });

    expect(coreTokens(long)).toBe(coreTokens(corpus()));
    expect(coreTokens(corpus({ posts: [post('shaders')] }))).toBeGreaterThan(coreTokens(corpus()));
  });
});
