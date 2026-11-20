'use client';

import { useCallback, useRef } from 'react';

import type { AnimatedIconHandle } from '@/lib/use-icon-animation';

export function useAnimatedIcon() {
  const icon = useRef<AnimatedIconHandle>(null);
  const play = useCallback(() => icon.current?.startAnimation(), []);

  return { icon, trigger: { onPointerEnter: play, onFocus: play } };
}
