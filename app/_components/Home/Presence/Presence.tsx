'use client';

import { useLocale } from 'next-intl';
import dynamic from 'next/dynamic';
import { useSyncExternalStore } from 'react';

import { usePresenceStore } from '@/hooks/use-presence-store';
import { FINE_POINTER } from '@/lib/browser';
import { presenceUrl, roomUrl } from '@/lib/presence/availability';

const Room = dynamic(() => import('./Room').then((module) => module.Room), { ssr: false });

const onPointerChange = (change: () => void) => {
  const query = window.matchMedia(FINE_POINTER);
  query.addEventListener('change', change);
  return () => query.removeEventListener('change', change);
};

export function Presence({ className }: { className?: string }) {
  const hidden = usePresenceStore((state) => state.hidden);
  const locale = useLocale();
  const finePointer = useSyncExternalStore(
    onPointerChange,
    () => window.matchMedia(FINE_POINTER).matches,
    () => false
  );
  const url = finePointer && !hidden ? presenceUrl() : undefined;

  return url ? <Room url={roomUrl(url, locale)} className={className} /> : null;
}
