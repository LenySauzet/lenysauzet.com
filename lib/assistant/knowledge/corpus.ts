import { parse as parseYaml } from 'yaml';
import { z } from 'zod';

import {
  faqSchema,
  postSchema,
  profileSchema,
  REQUIRED_SECTIONS,
  STORY_SECTIONS,
  storySchema,
  type FaqFacts,
  type PostFacts,
  type Profile,
  type StoryFacts,
} from './schema';

export interface Story extends StoryFacts {
  id: `project:${string}`;
  body: string;
}

export interface Faq extends FaqFacts {
  id: `faq:${string}`;
  answer: string;
}

export interface Post extends PostFacts {
  id: `post:${string}`;
  slug: string;
  url: string;
  body: string;
}

export interface Blog {
  posts: Post[];
  complete: boolean;
}

export interface Corpus {
  profile: Profile;
  stories: Story[];
  faq: Faq[];
  blog: Blog;
}

export interface SourceFile {
  name: string;
  source: string;
}

export class KnowledgeError extends Error {
  constructor(file: string, problem: string) {
    super(`${file}: ${problem}`);
    this.name = 'KnowledgeError';
  }
}

const FRONTMATTER = /^---\r?\n(?:([\s\S]*?)\r?\n)?---(?:\r?\n|$)([\s\S]*)$/;
const FENCED_CODE = /^(```|~~~)[\s\S]*?^\1/gm;

function readYaml(file: string, text: string): unknown {
  try {
    return parseYaml(text);
  } catch (error) {
    throw new KnowledgeError(file, `invalid YAML: ${(error as Error).message}`);
  }
}

export function splitFrontmatter(file: string, source: string) {
  const match = source.match(FRONTMATTER);
  if (!match) throw new KnowledgeError(file, 'missing frontmatter between --- lines');
  return { data: readYaml(file, match[1] ?? ''), body: match[2]!.trim() };
}

function validate<T>(file: string, schema: z.ZodType<T>, data: unknown) {
  const result = schema.safeParse(data);
  if (!result.success) throw new KnowledgeError(file, z.prettifyError(result.error));
  return result.data;
}

function readEntry<T>(file: SourceFile, schema: z.ZodType<T>, key: (facts: T) => string) {
  const { data, body } = splitFrontmatter(file.name, file.source);
  const facts = validate(file.name, schema, data);
  const stem = file.name.replace(/^.*\//, '').replace(/\.md$/, '');
  if (key(facts) !== stem) throw new KnowledgeError(file.name, `"${key(facts)}" differs from the file name`);
  if (!body) throw new KnowledgeError(file.name, 'the body is empty');
  return { facts, body };
}

export const parseProfile = (file: SourceFile) =>
  validate(file.name, profileSchema, readYaml(file.name, file.source));

export function parseStory(file: SourceFile): Story {
  const { facts, body } = readEntry(file, storySchema, (story) => story.slug);
  const sections = headingsOf(body);
  const order = sections.map((heading) => (STORY_SECTIONS as readonly string[]).indexOf(heading));
  const unknown = sections.filter((_, index) => order[index] === -1);
  if (unknown.length) {
    throw new KnowledgeError(file.name, `unknown sections ${unknown.join(', ')}; use ${STORY_SECTIONS.join(', ')}`);
  }
  if (order.some((position, index) => index > 0 && position <= order[index - 1]!)) {
    throw new KnowledgeError(file.name, `sections out of order or repeated; keep ${STORY_SECTIONS.join(', ')}`);
  }
  const missing = REQUIRED_SECTIONS.filter((section) => !sections.includes(section));
  if (missing.length) throw new KnowledgeError(file.name, `missing sections ${missing.join(', ')}`);
  return { ...facts, id: `project:${facts.slug}`, body };
}

export function parseFaq(file: SourceFile): Faq {
  const { facts, body } = readEntry(file, faqSchema, (faq) => faq.id);
  return { ...facts, id: `faq:${facts.id}`, answer: body };
}

export function parsePost(slug: string, url: string, source: string): Post {
  const file = `post ${slug}`;
  const { data, body } = splitFrontmatter(file, source);
  const facts = validate(file, postSchema, data);
  return { ...facts, id: `post:${slug}`, slug, url, body };
}

export const headingsOf = (markdown: string) =>
  [...markdown.replace(FENCED_CODE, '').matchAll(/^## (.+)$/gm)].map((match) => match[1]!.trim());

export const estimateTokens = (text: string) => Math.ceil(text.length / 4);
