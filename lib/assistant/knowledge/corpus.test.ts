import { describe, expect, it } from 'vitest';

import { headingsOf, parseFaq, parsePost, parseProfile, parseProject, splitFrontmatter } from './corpus';

const story = (frontmatter: Record<string, unknown>, body = '## Context\n\nWhy it exists.') =>
  ['---', ...Object.entries(frontmatter).map(([key, value]) => `${key}: ${JSON.stringify(value)}`), '---', body].join(
    '\n'
  );

const facts = {
  slug: 'gitglow',
  title: 'GitGlow',
  year: '2026',
  status: 'shipped',
  role: 'solo',
  stack: ['Next.js'],
  summary: 'Turns a GitHub profile into a poster.',
};

describe('parseProject', () => {
  it('reads a story into a project with a stable id', () => {
    const project = parseProject({ name: 'projects/gitglow.md', source: story(facts) });

    expect(project).toMatchObject({ id: 'project:gitglow', slug: 'gitglow', blogPosts: [] });
    expect(project.body).toBe('## Context\n\nWhy it exists.');
  });

  it('refuses a slug that is not the file name', () => {
    expect(() => parseProject({ name: 'projects/glow.md', source: story(facts) })).toThrow(
      'projects/glow.md: slug "gitglow" differs from the file name'
    );
  });

  it('refuses a section outside the fixed ones, but not a heading inside code', () => {
    const fenced = '## Context\n\n```md\n## Anything\n```';
    expect(parseProject({ name: 'projects/gitglow.md', source: story(facts, fenced) }).body).toBe(fenced);
    expect(() =>
      parseProject({ name: 'projects/gitglow.md', source: story(facts, '## Context\n\nText\n\n## Lessons\n\nText') })
    ).toThrow('unknown sections Lessons');
  });

  it('refuses an empty story and names the faulty field', () => {
    expect(() => parseProject({ name: 'projects/gitglow.md', source: story(facts, '') })).toThrow('the story is empty');
    expect(() => parseProject({ name: 'projects/gitglow.md', source: story({ ...facts, status: 'done' }) })).toThrow(
      /projects\/gitglow\.md: [\s\S]*status/
    );
  });

  it('refuses a file without frontmatter', () => {
    expect(() => splitFrontmatter('projects/gitglow.md', '## Context')).toThrow('missing frontmatter');
  });
});

describe('parseFaq', () => {
  it('reads an answer keyed by its file name', () => {
    const faq = parseFaq({
      name: 'faq/looking-for.md',
      source: story({ id: 'looking-for', question: 'What are you looking for?', topics: ['career'] }, 'An AI role.'),
    });

    expect(faq).toMatchObject({ id: 'faq:looking-for', answer: 'An AI role.' });
    expect(() =>
      parseFaq({ name: 'faq/other.md', source: story({ id: 'looking-for', question: 'Q?', topics: ['career'] }, 'A.') })
    ).toThrow('differs from the file name');
  });
});

describe('parsePost', () => {
  it('reads the blog Markdown twin', () => {
    const source = story(
      { title: 'Shaders', description: 'How they work.', date: '2026-07-19', tags: ['webgl'] },
      'Body.'
    ).replace('"2026-07-19"', '2026-07-19');

    expect(parsePost('shaders', 'https://blog.lenysauzet.com/posts/shaders', source)).toMatchObject({
      id: 'post:shaders',
      date: '2026-07-19',
      tags: ['webgl'],
      body: 'Body.',
    });
  });
});

describe('parseProfile', () => {
  const profile = {
    headline: 'Engineer',
    summary: 'I build things.',
    availability: {
      status: 'open',
      start: 'immediately',
      roles: ['AI engineer'],
      locations: ['Montpellier'],
      contracts: ['permanent'],
      workAuthorization: 'EU citizen.',
    },
    languages: [{ name: 'French', level: 'native' }],
    education: [],
    experience: [
      {
        company: 'Tolk.ai',
        role: 'Engineer',
        contract: 'work-study',
        start: '2024-01',
        summary: 'Genii.',
        highlights: ['Pipelines.'],
      },
    ],
    skills: [{ area: 'AI', items: ['RAG'] }],
  };
  const read = (value: unknown) => parseProfile({ name: 'profile.yaml', source: JSON.stringify(value) });

  it('accepts a year or a month, and fills the optional lists', () => {
    expect(read(profile)).toMatchObject({ interests: [], recommendations: [] });
    expect(read({ ...profile, experience: [{ ...profile.experience[0], start: '2024' }] }).experience[0]!.start).toBe(
      '2024'
    );
  });

  it('refuses an unknown key, so a misspelt field is never silently dropped', () => {
    expect(() => read({ ...profile, salary: '50k' })).toThrow('profile.yaml');
  });

  it('starts immediately or on a given day, nothing vaguer', () => {
    const starting = (start: string) => read({ ...profile, availability: { ...profile.availability, start } });

    expect(starting('2027-01-04').availability.start).toBe('2027-01-04');
    expect(() => starting('asap')).toThrow('availability.start');
  });

  it('refuses a date that is not a month', () => {
    expect(() => read({ ...profile, experience: [{ ...profile.experience[0], start: '01/2024' }] })).toThrow('YYYY-MM');
  });
});

describe('headingsOf', () => {
  it('lists second-level headings only', () => {
    expect(headingsOf('# Title\n## Context\n### Detail\n## Results')).toEqual(['Context', 'Results']);
  });
});
