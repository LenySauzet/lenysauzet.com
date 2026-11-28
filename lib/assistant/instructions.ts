import { stringify } from 'yaml';

import type { Corpus } from './knowledge/corpus';
import { ACTIONS } from './prompts/actions';
import { FORMAT } from './prompts/format';
import { GROUNDING } from './prompts/grounding';
import { PERSONA } from './prompts/persona';
import { SCOPE } from './prompts/scope';

const LANGUAGES = { en: 'English', fr: 'French' } as const;

const attribute = (value: string) => value.replaceAll('"', '&quot;');

function knowledgeOf({ profile, stories, faq, blog }: Corpus) {
  const projects = stories.map(
    (story) =>
      `<project id="${story.id}" title="${attribute(story.title)}" year="${story.year}" status="${story.status}" role="${story.role}" stack="${attribute(story.stack.join(', '))}">${story.summary}</project>`
  );
  const answers = faq.map(
    (entry) => `<answer id="${entry.id}" question="${attribute(entry.question)}">\n${entry.answer}\n</answer>`
  );
  const articles = blog.posts.map(
    (post) =>
      `<article id="${post.id}" date="${post.date}" title="${attribute(post.title)}">${post.description}</article>`
  );
  return [
    '<knowledge>',
    `<profile id="profile">\n${stringify(profile).trim()}\n</profile>`,
    `<projects>\n${projects.join('\n')}\n</projects>`,
    `<faq>\n${answers.join('\n')}\n</faq>`,
    `<articles>\n${articles.join('\n') || 'None published yet.'}\n</articles>`,
    '</knowledge>',
  ].join('\n');
}

export interface InstructionsInput {
  corpus: Corpus;
  locale: keyof typeof LANGUAGES;
  today: string;
}

export const buildInstructions = ({ corpus, locale, today }: InstructionsInput) =>
  [
    PERSONA,
    SCOPE,
    GROUNDING,
    FORMAT,
    ACTIONS,
    knowledgeOf(corpus),
    `Today is ${today}. The visitor is reading the portfolio in ${LANGUAGES[locale]}.`,
  ].join('\n\n');
