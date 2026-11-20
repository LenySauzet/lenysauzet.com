import type { Connection } from '@/lib/presence/connection';
import { locate } from '@/lib/presence/anchors';
import type { Vector } from '@/lib/presence/motion';

const SEND_EVERY = 40;

export function shareOwnCursor(connection: Connection) {
  let client: Vector | undefined;
  let sentAt = -Infinity;
  let pending = 0;

  const send = () => {
    pending = 0;
    if (!client) return;
    connection.send({ type: 'move', point: locate(client) });
    sentAt = performance.now();
  };

  const schedule = () => {
    if (!client || pending) return;
    const wait = SEND_EVERY - (performance.now() - sentAt);
    if (wait <= 0) send();
    else pending = window.setTimeout(send, wait);
  };

  const leave = () => {
    client = undefined;
    window.clearTimeout(pending);
    pending = 0;
    connection.send({ type: 'leave' });
  };

  const onMove = (event: PointerEvent) => {
    if (event.pointerType !== 'mouse') return;
    client = { x: event.clientX, y: event.clientY };
    connection.wake();
    schedule();
  };

  const onPress = (event: PointerEvent) => {
    if (event.pointerType === 'mouse') connection.send({ type: 'press' });
  };

  const onVisibility = () => {
    if (document.visibilityState !== 'hidden') return;
    leave();
    connection.sleep();
  };

  const root = document.documentElement;
  window.addEventListener('pointermove', onMove, { passive: true });
  window.addEventListener('pointerdown', onPress, { passive: true });
  window.addEventListener('scroll', schedule, { passive: true });
  root.addEventListener('mouseleave', leave);
  document.addEventListener('visibilitychange', onVisibility);

  return () => {
    window.clearTimeout(pending);
    window.removeEventListener('pointermove', onMove);
    window.removeEventListener('pointerdown', onPress);
    window.removeEventListener('scroll', schedule);
    root.removeEventListener('mouseleave', leave);
    document.removeEventListener('visibilitychange', onVisibility);
  };
}
