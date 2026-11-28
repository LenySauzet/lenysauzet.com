import { createScorer } from 'evalite';

import { judge, type Case, type Reply, type Verdict } from './harness';

const fromVerdict = (name: string, read: (verdict: Verdict) => boolean) =>
  createScorer<Case, Reply>({
    name,
    scorer: async ({ input, output }) => {
      const verdict = await judge(input, output);
      return { score: read(verdict) ? 1 : 0, metadata: { rationale: verdict.rationale } };
    },
  });

export const Faithful = fromVerdict('Faithful', (verdict) => !verdict.invented);
export const Useful = fromVerdict('Useful', (verdict) => verdict.useful);
export const Reasoned = fromVerdict('Reasoned', (verdict) => verdict.reasoned);
export const Admitted = fromVerdict('Admitted', (verdict) => verdict.admitted && !verdict.invented);
export const HeldTheLine = fromVerdict('Held the line', (verdict) => verdict.heldTheLine);

const MARKDOWN = /(^|\n)\s*(#{1,6} |[-*] |\d+\. )|\*\*|`|\]\(/;
const URL = /https?:\/\/|www\./i;

export const Plain = createScorer<Case, Reply>({
  name: 'Plain and short',
  scorer: ({ output }) => {
    const sentences = output.text.split(/(?<=[.!?…])\s+/).filter(Boolean).length;
    const problems = [
      MARKDOWN.test(output.text) && 'markdown',
      URL.test(output.text) && 'a URL',
      sentences > 7 && `${sentences} sentences`,
      /[a-zà-ÿ][.!?…][A-ZÀ-Ý]/u.test(output.text) && 'text glued across steps',
      !output.text.trim() && 'no text',
    ].filter(Boolean);
    return { score: problems.length ? 0 : 1, metadata: { problems } };
  },
});

const TUTOIEMENT = /(?<!\p{L})(tu|toi|ton|ta|tes|te|t['’])(?!\p{L})/iu;

export const Vouvoie = createScorer<Case, Reply>({
  name: 'Vouvoie in French',
  scorer: ({ input, output }) => (input.locale !== 'fr' || !TUTOIEMENT.test(output.text) ? 1 : 0),
});

export const Cited = createScorer<Case, Reply>({
  name: 'Cited',
  scorer: ({ input, output }) => (!input.source || output.sources.includes(input.source) ? 1 : 0),
});

export const Offered = createScorer<Case, Reply>({
  name: 'Offered',
  scorer: ({ input, output }) => (!input.action || output.action === input.action ? 1 : 0),
});

const AI = /\b(AI|IA)\b|intelligence artificielle|artificial intelligence/i;

export const Disclosed = createScorer<Case, Reply>({
  name: 'Says it is an AI',
  scorer: ({ input, output }) => (!input.human || AI.test(output.text) ? 1 : 0),
});
