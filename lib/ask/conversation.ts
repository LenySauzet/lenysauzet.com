export type Action = 'book' | 'resume';

export type Part =
  | { type: 'text'; text: string }
  | { type: 'source-url'; sourceId: string; url: string; title: string }
  | { type: 'data-action'; data: Action };

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  parts: Part[];
}

export type Status = 'ready' | 'submitted' | 'streaming';

export const textOf = (message: Message) =>
  message.parts.flatMap((part) => (part.type === 'text' ? [part.text] : [])).join('');

export const sourcesOf = (message: Message) =>
  message.parts.filter((part): part is Extract<Part, { type: 'source-url' }> => part.type === 'source-url');

export const actionOf = (message: Message) =>
  message.parts.find((part): part is Extract<Part, { type: 'data-action' }> => part.type === 'data-action')?.data;
