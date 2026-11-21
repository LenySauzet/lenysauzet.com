'use client';

import { useSyncExternalStore } from 'react';

import siteConfig from '@/config/site';
import { browserName } from '@/lib/browser';

const PENDING = '-';

const time = new Intl.DateTimeFormat('en-US', {
  hour: 'numeric',
  minute: '2-digit',
  second: '2-digit',
  timeZone: siteConfig.author.timeZone,
});

const unchanging = () => () => {};
const pending = () => PENDING;

const onEverySecond = (change: () => void) => {
  let timer = 0;
  const tick = () => {
    change();
    timer = window.setTimeout(tick, 1000 - (Date.now() % 1000));
  };
  timer = window.setTimeout(tick, 1000 - (Date.now() % 1000));
  return () => window.clearTimeout(timer);
};

const onResize = (change: () => void) => {
  window.addEventListener('resize', change);
  return () => window.removeEventListener('resize', change);
};

export function Clock() {
  return useSyncExternalStore(onEverySecond, () => time.format(Date.now()), pending);
}

export function Dimensions() {
  return useSyncExternalStore(onResize, () => `${window.innerWidth}x${window.innerHeight}`, pending);
}

export function Browser() {
  return useSyncExternalStore(unchanging, () => browserName(navigator.userAgent), pending);
}
