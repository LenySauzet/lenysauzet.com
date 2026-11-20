'use client';

import { useAnimation, useReducedMotion } from 'motion/react';
import { useCallback, useImperativeHandle, useRef, type Ref } from 'react';

interface AnimatedIconHandle {
  play: () => void;
}

export interface AnimatedIconProps {
  ref?: Ref<AnimatedIconHandle>;
  className?: string;
}

export function useIconControls(ref: AnimatedIconProps['ref']) {
  const controls = useAnimation();
  const still = useReducedMotion();
  const playing = useRef(false);

  useImperativeHandle(
    ref,
    () => ({
      play: () => {
        if (still || playing.current) return;
        playing.current = true;
        controls.set('normal');
        void controls.start('animate').then(() => {
          playing.current = false;
        });
      },
    }),
    [controls, still]
  );

  return controls;
}

export function useAnimatedIcon() {
  const icon = useRef<AnimatedIconHandle>(null);
  const play = useCallback(() => icon.current?.play(), []);

  return { icon, trigger: { onPointerEnter: play, onFocus: play } };
}
