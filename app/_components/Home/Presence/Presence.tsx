'use client';

import dynamic from 'next/dynamic';
import { useSyncExternalStore } from 'react';

import siteConfig from '@/config/site';
import { usePresenceStore } from '@/hooks/use-presence-store';
import { FINE_POINTER } from '@/lib/presence/pointer';

const Room = dynamic(() => import('./Room').then((module) => module.Room), { ssr: false });

const onPointerChange = (change: () => void) => {
  const query = window.matchMedia(FINE_POINTER);
  query.addEventListener('change', change);
  return () => query.removeEventListener('change', change);
};

export function Presence({ className }: { className?: string }) {
  const hidden = usePresenceStore((state) => state.hidden);
  const finePointer = useSyncExternalStore(
    onPointerChange,
    () => window.matchMedia(FINE_POINTER).matches,
    () => false
  );
  const url = siteConfig.presenceUrl;

  return url && finePointer && !hidden ? <Room url={url} className={className} /> : null;
}
