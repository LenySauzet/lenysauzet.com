'use client';

import { useSyncExternalStore } from 'react';

import { browserName } from '@/lib/browser';

const none = () => () => {};
const unknown = () => null;

const time = new Intl.DateTimeFormat('en-US', {
  hour: 'numeric',
  minute: '2-digit',
  second: '2-digit',
  timeZone: 'Europe/Paris',
});

const everySecond = (change: () => void) => {
  const timer = setInterval(change, 1000);
  return () => clearInterval(timer);
};

const onResize = (change: () => void) => {
  window.addEventListener('resize', change);
  return () => window.removeEventListener('resize', change);
};

export function Clock() {
  return useSyncExternalStore(everySecond, () => time.format(Date.now()), unknown) ?? '—';
}

export function Dimensions() {
  return useSyncExternalStore(onResize, () => `${window.innerWidth}x${window.innerHeight}`, unknown) ?? '—';
}

export function Browser() {
  return useSyncExternalStore(none, () => browserName(navigator.userAgent), unknown) ?? '—';
}
