import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

import { parseFaq, parseProfile, parseProject, type SourceFile } from './corpus';

export const KNOWLEDGE_ROOT = path.join(process.cwd(), 'content', 'knowledge');

async function filesIn(root: string, folder: string): Promise<SourceFile[]> {
  const directory = path.join(root, folder);
  const names = await readdir(directory).catch((error: NodeJS.ErrnoException) => {
    if (error.code === 'ENOENT') return [];
    throw error;
  });
  const markdown = names.filter((name) => name.endsWith('.md')).sort();
  return Promise.all(
    markdown.map(async (name) => ({
      name: `${folder}/${name}`,
      source: await readFile(path.join(directory, name), 'utf8'),
    }))
  );
}

export async function readKnowledge(root = KNOWLEDGE_ROOT) {
  const profile = parseProfile({
    name: 'profile.yaml',
    source: await readFile(path.join(root, 'profile.yaml'), 'utf8'),
  });
  const projects = (await filesIn(root, 'projects')).map(parseProject);
  const faq = (await filesIn(root, 'faq')).map(parseFaq);
  return { profile, projects, faq };
}
