import { decodeServer, encodeClient, EVICTED, HEARTBEAT, type ClientMessage, type ServerMessage } from './protocol';

const FIRST_RETRY = 1000;
const LAST_RETRY = 30_000;
const HEARTBEAT_EVERY = 25_000;
const GOING_AWAY = 1000;

export const retryDelay = (attempt: number, random = Math.random) =>
  Math.min(LAST_RETRY, FIRST_RETRY * 2 ** attempt) * (0.5 + random() / 2);

const isDismissal = (code: number) => code >= EVICTED;

interface ConnectionEvents {
  onMessage: (message: ServerMessage) => void;
  onOpen: () => void;
  onLost: () => void;
}

export function connect(url: string, { onMessage, onOpen, onLost }: ConnectionEvents) {
  let socket: WebSocket | undefined;
  let attempt = 0;
  let retry = 0;
  let heartbeat = 0;
  let asleep = false;
  let closed = false;

  const stopTimers = () => {
    window.clearTimeout(retry);
    window.clearInterval(heartbeat);
  };

  const open = () => {
    const current = new WebSocket(url);
    socket = current;
    current.addEventListener('open', () => {
      attempt = 0;
      heartbeat = window.setInterval(() => current.send(HEARTBEAT), HEARTBEAT_EVERY);
      onOpen();
    });
    current.addEventListener('message', (event) => {
      if (typeof event.data !== 'string') return;
      const message = decodeServer(event.data);
      if (message) onMessage(message);
    });
    current.addEventListener('close', (event) => {
      if (current !== socket) return;
      stopTimers();
      socket = undefined;
      onLost();
      if (asleep || closed) return;
      if (isDismissal(event.code)) {
        asleep = true;
        return;
      }
      retry = window.setTimeout(open, retryDelay(attempt));
      attempt += 1;
    });
  };

  const sleep = () => {
    asleep = true;
    stopTimers();
    const current = socket;
    socket = undefined;
    if (current) onLost();
    current?.close(GOING_AWAY);
  };

  open();

  return {
    send(message: ClientMessage) {
      if (socket?.readyState === WebSocket.OPEN) socket.send(encodeClient(message));
    },
    wake() {
      if (!asleep || closed) return;
      asleep = false;
      attempt = 0;
      open();
    },
    sleep,
    close() {
      closed = true;
      sleep();
    },
  };
}

export type Connection = ReturnType<typeof connect>;
