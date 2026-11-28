import { describe, expect, it } from 'vitest';

import { headingsOf, parseFaq, parsePost, parseProfile, parseStory, splitFrontmatter } from './corpus';

const BODY = '## Context\n\nWhy it exists.\n\n## What I built\n\nA poster.';

const story = (frontmatter: Record<string, unknown>, body = BODY) =>
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

describe('parseStory', () => {
  it('reads a story into a project with a stable id', () => {
    const project = parseStory({ name: 'projects/gitglow.md', source: story(facts) });

    expect(project).toMatchObject({ id: 'project:gitglow', slug: 'gitglow', blogPosts: [] });
    expect(project.body).toBe(BODY);
  });

  it('refuses a slug that is not the file name', () => {
    expect(() => parseStory({ name: 'projects/glow.md', source: story(facts) })).toThrow(
      'projects/glow.md: "gitglow" differs from the file name'
    );
  });

  it('refuses a section outside the fixed ones, but not a heading inside code', () => {
    const fenced = `${BODY}\n\n\`\`\`md\n## Anything\n\`\`\`\n\n~~~\n## Other\n~~~`;
    expect(parseStory({ name: 'projects/gitglow.md', source: story(facts, fenced) }).body).toBe(fenced);
    expect(() => parseStory({ name: 'projects/gitglow.md', source: story(facts, `${BODY}\n\n## Lessons\n\nText`) })).toThrow(
      'unknown sections Lessons'
    );
  });

  it('keeps the sections in their order, once each, with the required ones present', () => {
    const read = (body: string) => () => parseStory({ name: 'projects/gitglow.md', source: story(facts, body) });

    expect(read('## What I built\n\nA.\n\n## Context\n\nB.')).toThrow('out of order');
    expect(read(`## Context\n\nOnce.\n\n${BODY}`)).toThrow('out of order or repeated');
    expect(read('## Context\n\nOnly this.')).toThrow('missing sections What I built');
  });

  it('refuses an empty story and names the faulty field', () => {
    expect(() => parseStory({ name: 'projects/gitglow.md', source: story(facts, '') })).toThrow('the body is empty');
    expect(() => parseStory({ name: 'projects/gitglow.md', source: story({ ...facts, status: 'done' }) })).toThrow(
      /projects\/gitglow\.md: [\s\S]*status/
    );
  });

  it('refuses a file without frontmatter, and names the file when its YAML is broken', () => {
    expect(() => splitFrontmatter('projects/gitglow.md', '## Context')).toThrow('missing frontmatter');
    expect(() => splitFrontmatter('projects/gitglow.md', '---\ntitle: [oops\n---\nBody')).toThrow(
      /^projects\/gitglow\.md: invalid YAML/
    );
  });

  it('reads an empty frontmatter as missing facts, not as a missing block', () => {
    expect(splitFrontmatter('faq/x.md', '---\n---\nBody')).toEqual({ data: null, body: 'Body' });
    expect(() => parseFaq({ name: 'faq/x.md', source: '---\n---\nBody' })).toThrow(/^faq\/x\.md: [\s\S]*object/);
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

  it('refuses a profile missing a required field', () => {
    expect(() => read({ ...profile, headline: undefined })).toThrow(/profile\.yaml: [\s\S]*headline/);
  });

  it('names the file when the YAML itself is broken', () => {
    expect(() => parseProfile({ name: 'profile.yaml', source: 'headline: [oops' })).toThrow(
      /^profile\.yaml: invalid YAML/
    );
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
