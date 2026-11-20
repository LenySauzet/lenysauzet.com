import type { Pull } from './protocol';

export type FrameEvent = { type: 'pull'; pull: Pull } | { type: 'drop'; frame: string };

type Listener = (event: FrameEvent) => void;

const frameOf = (event: FrameEvent) => (event.type === 'pull' ? event.pull.frame : event.frame);

export function createFrameChannel() {
  const shared = new Set<Listener>();
  const received = new Map<string, Set<Listener>>();

  return {
    share(event: FrameEvent) {
      for (const listener of shared) listener(event);
    },
    onShared(listener: Listener) {
      shared.add(listener);
      return () => void shared.delete(listener);
    },
    receive(event: FrameEvent) {
      for (const listener of received.get(frameOf(event)) ?? []) listener(event);
    },
    onReceived(frame: string, listener: Listener) {
      const listeners = received.get(frame) ?? new Set<Listener>();
      received.set(frame, listeners);
      listeners.add(listener);
      return () => void listeners.delete(listener);
    },
  };
}

export const frames = createFrameChannel();
