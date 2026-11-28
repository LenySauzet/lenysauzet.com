import type { SourceUrlUIPart, UIMessage } from 'ai';

export type Action = 'book' | 'resume';

export type Step = 'resume' | 'projects' | 'posts';

export type AskData = { action: Action; status: Step };

export type Message = UIMessage<never, AskData>;

export type Part = Message['parts'][number];

export type Source = SourceUrlUIPart;

export type Status = 'ready' | 'submitted' | 'streaming' | 'error';

export type Failure = 'disabled' | 'rate-limited' | 'unavailable' | 'invalid';

export type Notice = Failure | 'stopped';

const FAILURES: readonly Failure[] = ['disabled', 'rate-limited', 'unavailable', 'invalid'];

export function failureFrom(error: unknown): Failure {
  try {
    const { code } = JSON.parse(error instanceof Error ? error.message : String(error)) as { code?: unknown };
    if (FAILURES.includes(code as Failure)) return code as Failure;
  } catch {}
  return 'unavailable';
}

export const remediesOf = (failure: Failure) => ({
  retry: failure === 'unavailable',
  contact: failure === 'unavailable' || failure === 'disabled',
});

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

export const wordsOf = (text: string) => text.split(/(?<=\s)/);

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
