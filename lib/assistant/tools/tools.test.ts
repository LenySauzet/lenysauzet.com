import type { UIMessageStreamWriter } from 'ai';
import { describe, expect, it, vi } from 'vitest';

import type { Message } from '@/lib/ask/conversation';
import { sampleCorpus } from '@/test/ask';

import { offerTool } from './offer';
import { libraryOf, readTool } from './read';

const recorder = () => {
  const write = vi.fn();
  return { write, writer: { write, merge: vi.fn(), onError: undefined } as unknown as UIMessageStreamWriter<Message> };
};

const run = <I, O>(tool: { execute?: (input: I, options: never) => O }, input: I) =>
  tool.execute!(input, { toolCallId: 'call', messages: [] } as never);

const library = libraryOf(sampleCorpus(), { title: 'Resume', url: '/resume' });

describe('read', () => {
  it('returns each document tagged, names its step and cites each one once', async () => {
    const { write, writer } = recorder();
    const read = readTool(library, writer);
    const result = await run(read, { ids: ['project:gitglow', 'post:shaders'] });

    expect(result).toContain('<document id="project:gitglow" title="GitGlow" url="https://gitglow.lenysauzet.com">');
    expect(result).toContain('A README is judged by its cover.');
    expect(result).toContain('<document id="post:shaders"');
    expect(write.mock.calls.map(([part]) => part)).toEqual([
      { type: 'data-status', data: 'projects', transient: true },
      { type: 'source-url', sourceId: 'project:gitglow', url: 'https://gitglow.lenysauzet.com', title: 'GitGlow' },
      {
        type: 'source-url',
        sourceId: 'post:shaders',
        url: 'https://blog.lenysauzet.com/posts/shaders',
        title: 'Shaders',
      },
    ]);

    write.mockClear();
    await run(read, { ids: ['project:gitglow'] });
    expect(write.mock.calls.filter(([part]) => part.type === 'source-url')).toEqual([]);
  });

  it('cites the resume for the profile, and no source for a FAQ answer', async () => {
    const { write, writer } = recorder();
    await run(readTool(library, writer), { ids: ['profile', 'faq:looking-for'] });
    expect(write.mock.calls.map(([part]) => part)).toEqual([
      { type: 'data-status', data: 'resume', transient: true },
      { type: 'source-url', sourceId: 'profile', url: '/resume', title: 'Resume' },
    ]);
  });

  it('tells the model an id does not exist, without throwing or citing it', async () => {
    const { write, writer } = recorder();
    const result = await run(readTool(library, writer), { ids: ['project:nope'] });
    expect(result).toBe('<missing id="project:nope">No document has this id.</missing>');
    expect(write).not.toHaveBeenCalled();
  });
});

describe('offer', () => {
  it('writes the action part once per answer', async () => {
    const { write, writer } = recorder();
    const offer = offerTool(writer);
    await run(offer, { action: 'book' });
    await run(offer, { action: 'resume' });
    expect(write.mock.calls.map(([part]) => part)).toEqual([{ type: 'data-action', data: 'book' }]);
  });
});
