'use client';

import { AnimatePresence, useReducedMotion } from 'motion/react';
import { useEffect, useRef, useState, useSyncExternalStore } from 'react';

import siteConfig from '@/config/site';
import { usePresenceStore } from '@/hooks/use-presence-store';
import { connect } from '@/lib/presence/connection';

import { Cursor } from './Cursor';
import { shareOwnCursor } from './own-cursor';
import { createRemoteCursors } from './remote-cursors';

const FINE_POINTER = '(pointer: fine)';

const onPointerChange = (change: () => void) => {
  const query = window.matchMedia(FINE_POINTER);
  query.addEventListener('change', change);
  return () => query.removeEventListener('change', change);
};

export function Presence() {
  const hidden = usePresenceStore((state) => state.hidden);
  const finePointer = useSyncExternalStore(
    onPointerChange,
    () => window.matchMedia(FINE_POINTER).matches,
    () => false
  );

  return finePointer && !hidden ? <Room url={siteConfig.presenceUrl} /> : null;
}

function Room({ url }: { url: string }) {
  const [ids, setIds] = useState<string[]>([]);
  const still = useReducedMotion();
  const stillness = useRef(still);
  const attach = useRef<(id: string, element: HTMLDivElement | null) => void>(() => {});

  useEffect(() => {
    stillness.current = still;
  }, [still]);

  useEffect(() => {
    const remotes = createRemoteCursors(setIds, () => Boolean(stillness.current));
    const connection = connect(url, remotes.receive);
    const stopSharing = shareOwnCursor(connection);
    attach.current = remotes.attach;

    return () => {
      stopSharing();
      connection.close();
      remotes.stop();
    };
  }, [url]);

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 z-40 overflow-hidden">
      <AnimatePresence>
        {ids.map((id) => (
          <Cursor key={id} id={id} attach={(...args) => attach.current(...args)} />
        ))}
      </AnimatePresence>
    </div>
  );
}
