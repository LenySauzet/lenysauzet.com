import type { Project as Card } from '@/content/projects';

import { estimateTokens, type Corpus } from './corpus';

export const CORE_TOKEN_BUDGET = 20_000;

export function problemsOf(corpus: Corpus, cards: Card[]) {
  const problems: string[] = [];
  const published = new Set(corpus.blog.posts.map((post) => post.slug));

  for (const story of corpus.stories) {
    const file = `projects/${story.slug}.md`;
    const card = cards.find((entry) => entry.slug === story.slug);
    if (!card) {
      problems.push(`${file} has no entry in content/projects.ts`);
      continue;
    }
    if (card.title !== story.title) problems.push(`${file} is titled "${story.title}", its card "${card.title}"`);
    if (card.year !== story.year) problems.push(`${file} is from ${story.year}, its card from ${card.year}`);
    if (card.action?.kind === 'article' && !story.blogPosts.includes(card.action.slug)) {
      problems.push(`${file} does not list "${card.action.slug}", the article its card links to`);
    }
    if (corpus.blog.complete) {
      for (const post of story.blogPosts.filter((slug) => !published.has(slug))) {
        problems.push(`${file} lists "${post}", which the blog does not publish`);
      }
    }
  }

  return problems;
}

export const untold = (corpus: Corpus, cards: Card[]) =>
  cards.filter((card) => !corpus.stories.some((story) => story.slug === card.slug)).map((card) => card.slug);

export const coreTokens = (corpus: Corpus) =>
  estimateTokens(
    JSON.stringify({
      profile: corpus.profile,
      stories: corpus.stories.map(({ id, title, year, stack, summary }) => ({ id, title, year, stack, summary })),
      faq: corpus.faq.map(({ id, question, answer }) => ({ id, question, answer })),
      posts: corpus.blog.posts.map(({ id, title, description, date }) => ({ id, title, description, date })),
    })
  );
