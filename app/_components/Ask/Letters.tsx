'use client';

import { motion } from 'motion/react';

import { EASE_OUT } from '@/lib/motion';

interface LettersProps {
  text: string;
  delay?: number;
  step?: number;
}

export const lettersDuration = (text: string, step = 0.022) => text.length * step + 0.5;

export function Letters({ text, delay = 0, step = 0.022 }: LettersProps) {
  return (
    <>
      {[...text].map((letter, index) => (
        <motion.span
          key={index}
          initial={{ opacity: 0, filter: 'blur(6px)' }}
          animate={{ opacity: 1, filter: 'blur(0px)', transitionEnd: { filter: 'none' } }}
          transition={{ duration: 0.5, delay: delay + index * step, ease: EASE_OUT }}
        >
          {letter}
        </motion.span>
      ))}
    </>
  );
}

export interface Pace {
  step: number;
  pass: number;
}
const REST = 0.5;

export const twoPassDuration = (text: string, { step, pass }: Pace) => text.length * step + pass;

export function TwoPassLetters({ text, pace, delay = 0 }: { text: string; pace: Pace; delay?: number }) {
  const { step, pass } = pace;
  return (
    <>
      {[...text].map((letter, index) => (
        <motion.span
          key={index}
          initial={{ opacity: 0, filter: 'blur(6px)' }}
          animate={{
            opacity: [0, 0.3, 0.3, 1, REST],
            filter: ['blur(6px)', 'blur(0px)', 'blur(0px)', 'blur(0px)', 'blur(0px)'],
            transitionEnd: { filter: 'none' },
          }}
          transition={{
            duration: pass,
            delay: delay + index * step,
            times: [0, 0.22, 0.42, 0.6, 1],
            ease: 'easeInOut',
          }}
        >
          {letter}
        </motion.span>
      ))}
    </>
  );
}
