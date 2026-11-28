export type Action = 'book' | 'resume';

export type Source = { type: 'source-url'; sourceId: string; url: string; title?: string };

export type Part = { type: 'text'; text: string } | Source | { type: 'data-action'; data: Action };

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  parts: Part[];
}

export type Status = 'ready' | 'submitted' | 'streaming' | 'error';

export interface Turn {
  question: Message;
  answer?: Message;
}

export const textOf = (message: Message) =>
  message.parts.flatMap((part) => (part.type === 'text' ? [part.text] : [])).join('');

export const sourcesOf = (message: Message) =>
  message.parts.filter((part): part is Source => part.type === 'source-url');

export const actionOf = (message: Message) =>
  message.parts.find((part): part is Extract<Part, { type: 'data-action' }> => part.type === 'data-action')?.data;

export const isBusy = (status: Status) => status === 'submitted' || status === 'streaming';

export const isThinking = (messages: Message[], status: Status) => {
  const last = messages.at(-1);
  return isBusy(status) && (!last || last.role === 'user' || !textOf(last));
};

export const isExternal = (source: Source) => /^https?:\/\//.test(source.url);

export const labelOf = (source: Source) =>
  source.title ?? (isExternal(source) ? new URL(source.url).hostname : source.url);

export function turnsOf(messages: Message[]) {
  const turns: Turn[] = [];
  for (const message of messages) {
    const current = turns.at(-1);
    if (message.role === 'user') turns.push({ question: message });
    else if (current) turns[turns.length - 1] = { ...current, answer: message };
  }
  return turns;
}
