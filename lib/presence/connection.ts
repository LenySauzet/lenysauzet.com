import { decodeServer, encodeClient, HEARTBEAT, type ClientMessage, type ServerMessage } from './protocol';

const FIRST_RETRY = 1000;
const LAST_RETRY = 30_000;
const HEARTBEAT_EVERY = 25_000;

export const retryDelay = (attempt: number, random = Math.random) =>
  Math.min(LAST_RETRY, FIRST_RETRY * 2 ** attempt) * (0.5 + random() / 2);

export function connect(url: string, onMessage: (message: ServerMessage) => void) {
  let socket: WebSocket | undefined;
  let attempt = 0;
  let retry = 0;
  let heartbeat = 0;
  let closed = false;

  const open = () => {
    socket = new WebSocket(url);
    socket.addEventListener('open', () => {
      attempt = 0;
      heartbeat = window.setInterval(() => socket?.send(HEARTBEAT), HEARTBEAT_EVERY);
    });
    socket.addEventListener('message', (event) => {
      if (typeof event.data !== 'string') return;
      const message = decodeServer(event.data);
      if (message) onMessage(message);
    });
    socket.addEventListener('close', () => {
      window.clearInterval(heartbeat);
      if (closed) return;
      retry = window.setTimeout(open, retryDelay(attempt));
      attempt += 1;
    });
  };

  open();

  return {
    send(message: ClientMessage) {
      if (socket?.readyState === WebSocket.OPEN) socket.send(encodeClient(message));
    },
    close() {
      closed = true;
      window.clearTimeout(retry);
      window.clearInterval(heartbeat);
      socket?.close(1000);
    },
  };
}

export type Connection = ReturnType<typeof connect>;
