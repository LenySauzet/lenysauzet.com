import type { Project as Shown } from '@/content/projects';

import { estimateTokens, type Corpus } from './corpus';

export const CORE_TOKEN_BUDGET = 20_000;

export function problemsOf(corpus: Corpus, shown: Shown[], postsKnown: boolean) {
  const problems: string[] = [];
  const postSlugs = new Set(corpus.posts.map((post) => post.slug));

  for (const project of corpus.projects) {
    const card = shown.find((entry) => entry.slug === project.slug);
    if (!card) {
      problems.push(`projects/${project.slug}.md has no entry in content/projects.ts`);
      continue;
    }
    if (card.title !== project.title)
      problems.push(`projects/${project.slug}.md is titled "${project.title}", its card "${card.title}"`);
    if (card.year !== project.year)
      problems.push(`projects/${project.slug}.md is from ${project.year}, its card from ${card.year}`);
    if (card.action?.kind === 'article' && !project.blogPosts.includes(card.action.slug)) {
      problems.push(`projects/${project.slug}.md does not list "${card.action.slug}", the article its card links to`);
    }
    if (postsKnown) {
      for (const post of project.blogPosts.filter((slug) => !postSlugs.has(slug))) {
        problems.push(`projects/${project.slug}.md lists "${post}", which the blog does not publish`);
      }
    }
  }

  return problems;
}

export const untold = (corpus: Corpus, shown: Shown[]) =>
  shown.filter((card) => !corpus.projects.some((project) => project.slug === card.slug)).map((card) => card.slug);

export const coreTokens = (corpus: Corpus) =>
  estimateTokens(
    JSON.stringify({
      profile: corpus.profile,
      projects: corpus.projects.map(({ id, title, year, stack, summary }) => ({ id, title, year, stack, summary })),
      faq: corpus.faq.map(({ id, question, answer }) => ({ id, question, answer })),
      posts: corpus.posts.map(({ id, title, description, date }) => ({ id, title, description, date })),
    })
  );
