import { tool, type UIMessageStreamWriter } from 'ai';
import { stringify } from 'yaml';
import { z } from 'zod';

import siteConfig from '@/config/site';
import type { Message, Step } from '@/lib/ask/conversation';

import type { Corpus } from '../knowledge/corpus';

export interface Document {
  id: string;
  title: string;
  url?: string;
  step: Step;
  content: string;
}

export interface Library {
  find: (id: string) => Document | undefined;
}

export function libraryOf(corpus: Corpus, resume: { title: string; url: string }): Library {
  const documents = new Map<string, Document>([
    ['profile', { id: 'profile', ...resume, step: 'resume', content: stringify(corpus.profile).trim() }],
  ]);
  for (const story of corpus.stories) {
    documents.set(story.id, {
      id: story.id,
      title: story.title,
      url: story.app ?? story.repo ?? siteConfig.url,
      step: 'projects',
      content: `${story.summary}\n\n${story.body}`,
    });
  }
  for (const post of corpus.blog.posts) {
    documents.set(post.id, { id: post.id, title: post.title, url: post.url, step: 'posts', content: post.body });
  }
  for (const entry of corpus.faq) {
    documents.set(entry.id, { id: entry.id, title: entry.question, step: 'resume', content: entry.answer });
  }
  return { find: (id) => documents.get(id) };
}

const escape = (value: string) => value.replaceAll('"', '&quot;');

export const asDocument = ({ id, title, url, content }: Document) =>
  `<document id="${id}" title="${escape(title)}"${url ? ` url="${escape(url)}"` : ''}>\n${content}\n</document>`;

export function readTool(library: Library, writer: UIMessageStreamWriter<Message>) {
  const cited = new Set<string>();
  return tool({
    description:
      'Read up to three documents of your knowledge in full, by id: "profile", a project ("project:…"), an article ("post:…") or a FAQ answer ("faq:…"). Use it before giving any detail that the summaries do not contain.',
    inputSchema: z.object({ ids: z.array(z.string().max(120)).min(1).max(3) }),
    execute: async ({ ids }) => {
      const found = ids.map((id) => library.find(id));
      const first = found.find((document) => document !== undefined);
      if (first) writer.write({ type: 'data-status', data: first.step, transient: true });
      for (const document of found) {
        if (!document?.url || cited.has(document.id)) continue;
        cited.add(document.id);
        writer.write({ type: 'source-url', sourceId: document.id, url: document.url, title: document.title });
      }
      return ids
        .map((id, index) => {
          const document = found[index];
          return document ? asDocument(document) : `<missing id="${escape(id)}">No document has this id.</missing>`;
        })
        .join('\n\n');
    },
  });
}
