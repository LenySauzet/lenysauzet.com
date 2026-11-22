import { describe, expect, it } from 'vitest';

import en from '@/messages/en.json';
import fr from '@/messages/fr.json';

type Tree = { [key: string]: string | Tree };

const entries = (tree: Tree, prefix = ''): [string, string][] =>
  Object.entries(tree).flatMap(([key, value]) =>
    typeof value === 'string' ? [[`${prefix}${key}`, value]] : entries(value, `${prefix}${key}.`)
  );

const argumentsOf = (message: string) =>
  [...message.matchAll(/\{(\w+)\}|<(\w+)>/g)].map((match) => match[1] ?? match[2]).sort();

describe('the French messages', () => {
  const english = new Map(entries(en));
  const french = new Map(entries(fr));

  it('cover every English message and nothing else', () => {
    expect([...french.keys()].sort()).toEqual([...english.keys()].sort());
  });

  it('take the same arguments and tags as the English ones', () => {
    for (const [key, message] of english) expect(argumentsOf(french.get(key) ?? ''), key).toEqual(argumentsOf(message));
  });

  it('follow French typography', () => {
    for (const [key, message] of french) {
      expect(message, key).not.toMatch(/'|\.\.\.| [?!;]|[^\u00a0]:/u);
      expect(message, key).not.toMatch(/[^ ][?!;]/u);
    }
  });
});
