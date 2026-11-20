'use client';

import { AnimatePresence, useReducedMotion } from 'motion/react';
import { useCallback, useEffect, useRef, useState } from 'react';

import { connect } from '@/lib/presence/connection';
import { cn } from '@/lib/utils';

import { Cursor } from './Cursor';
import { shareOwnCursor } from './own-cursor';
import { createRemoteCursors } from './remote-cursors';

type Attach = (id: string, element: HTMLDivElement | null) => void;

export function Room({ url, className }: { url: string; className?: string }) {
  const [ids, setIds] = useState<string[]>([]);
  const still = useReducedMotion();
  const stillness = useRef(still);
  const attachTo = useRef<Attach>(() => {});
  const attach = useCallback<Attach>((id, element) => attachTo.current(id, element), []);

  useEffect(() => {
    stillness.current = still;
  }, [still]);

  useEffect(() => {
    const remotes = createRemoteCursors(setIds, () => Boolean(stillness.current));
    const connection = connect(url, remotes.receive);
    const stopSharing = shareOwnCursor(connection);
    attachTo.current = remotes.attach;

    return () => {
      stopSharing();
      connection.close();
      remotes.stop();
    };
  }, [url]);

  return (
    <div aria-hidden className={cn('pointer-events-none absolute inset-0 z-40 overflow-hidden', className)}>
      <AnimatePresence>
        {ids.map((id) => (
          <Cursor key={id} id={id} attach={attach} />
        ))}
      </AnimatePresence>
    </div>
  );
}
