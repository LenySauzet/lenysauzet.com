import { parse as parseYaml } from 'yaml';
import { z } from 'zod';

import {
  faqSchema,
  PROJECT_SECTIONS,
  postSchema,
  profileSchema,
  projectSchema,
  type FaqFacts,
  type PostFacts,
  type Profile,
  type ProjectFacts,
} from './schema';

export interface Project extends ProjectFacts {
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

export interface Corpus {
  profile: Profile;
  projects: Project[];
  faq: Faq[];
  posts: Post[];
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

const FRONTMATTER = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/;

export function splitFrontmatter(file: string, source: string) {
  const match = source.match(FRONTMATTER);
  if (!match) throw new KnowledgeError(file, 'missing frontmatter between --- lines');
  return { data: parseYaml(match[1]!) as unknown, body: match[2]!.trim() };
}

function validate<T>(file: string, schema: z.ZodType<T>, data: unknown) {
  const result = schema.safeParse(data);
  if (!result.success) throw new KnowledgeError(file, z.prettifyError(result.error));
  return result.data;
}

const stem = (name: string) => name.replace(/^.*\//, '').replace(/\.md$/, '');

export const parseProfile = (file: SourceFile) => validate(file.name, profileSchema, parseYaml(file.source));

export function parseProject(file: SourceFile): Project {
  const { data, body } = splitFrontmatter(file.name, file.source);
  const facts = validate(file.name, projectSchema, data);
  if (facts.slug !== stem(file.name))
    throw new KnowledgeError(file.name, `slug "${facts.slug}" differs from the file name`);
  if (!body) throw new KnowledgeError(file.name, 'the story is empty');
  const unknown = headingsOf(body).filter((heading) => !PROJECT_SECTIONS.includes(heading));
  if (unknown.length) {
    throw new KnowledgeError(file.name, `unknown sections ${unknown.join(', ')}; use ${PROJECT_SECTIONS.join(', ')}`);
  }
  return { ...facts, id: `project:${facts.slug}`, body };
}

export function parseFaq(file: SourceFile): Faq {
  const { data, body } = splitFrontmatter(file.name, file.source);
  const facts = validate(file.name, faqSchema, data);
  if (facts.id !== stem(file.name)) throw new KnowledgeError(file.name, `id "${facts.id}" differs from the file name`);
  if (!body) throw new KnowledgeError(file.name, 'the answer is empty');
  return { ...facts, id: `faq:${facts.id}`, answer: body };
}

export function parsePost(slug: string, url: string, source: string): Post {
  const file = `post ${slug}`;
  const { data, body } = splitFrontmatter(file, source);
  const facts = validate(file, postSchema, data);
  return { ...facts, id: `post:${slug}`, slug, url, body };
}

export const headingsOf = (markdown: string) =>
  [...markdown.replace(/```[\s\S]*?```/g, '').matchAll(/^## (.+)$/gm)].map((match) => match[1]!.trim());

export const estimateTokens = (text: string) => Math.ceil(text.length / 4);
