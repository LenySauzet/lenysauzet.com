import { decodeServer, encodeClient, EVICTED, HEARTBEAT, type ClientMessage, type ServerMessage } from './protocol';

const FIRST_RETRY = 1000;
const LAST_RETRY = 30_000;
const HEARTBEAT_EVERY = 25_000;
const GOING_AWAY = 1000;

export const retryDelay = (attempt: number, random = Math.random) =>
  Math.min(LAST_RETRY, FIRST_RETRY * 2 ** attempt) * (0.5 + random() / 2);

export function connect(url: string, onMessage: (message: ServerMessage) => void) {
  let socket: WebSocket | undefined;
  let attempt = 0;
  let retry = 0;
  let heartbeat = 0;
  let asleep = false;

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
      if (asleep) return;
      if (event.code === EVICTED) {
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
    current?.close(GOING_AWAY);
  };

  open();

  return {
    send(message: ClientMessage) {
      if (socket?.readyState === WebSocket.OPEN) socket.send(encodeClient(message));
    },
    wake() {
      if (!asleep) return;
      asleep = false;
      attempt = 0;
      open();
    },
    sleep,
    close: sleep,
  };
}

export type Connection = ReturnType<typeof connect>;
