'use client';

import { motion } from 'motion/react';

import { blurred, EASE_OUT } from '@/lib/motion';
import { cn } from '@/lib/utils';

const BLURRED_LETTER = blurred(6);
const PACE = { step: 0.015, pass: 0.8 };

export const RESTING_OPACITY = 0.5;

export const writingDuration = (text: string) => text.length * PACE.step + PACE.pass;

interface LettersProps {
  text: string;
  delay?: number;
  stagger?: number;
  className?: string;
}

export function Letters({ text, delay = 0, stagger = 0.022, className }: LettersProps) {
  return (
    <>
      <span aria-hidden className={className}>
        {[...text].map((letter, index) => (
          <motion.span
            key={index}
            initial={BLURRED_LETTER}
            animate={{ opacity: 1, filter: 'blur(0px)', transitionEnd: { filter: 'none' } }}
            transition={{ duration: 0.5, delay: delay + index * stagger, ease: EASE_OUT }}
          >
            {letter}
          </motion.span>
        ))}
      </span>
      <span className="sr-only">{text}</span>
    </>
  );
}

export const Spelled = ({ text, className }: { text: string; className?: string }) => (
  <span className={cn(className)}>
    {[...text].map((letter, index) => (
      <span key={index}>{letter}</span>
    ))}
  </span>
);

export function WrittenTwice({ text, delay = 0, className }: { text: string; delay?: number; className?: string }) {
  return (
    <span className={cn(className)}>
      {[...text].map((letter, index) => (
        <motion.span
          key={index}
          initial={BLURRED_LETTER}
          animate={{
            opacity: [0, 0.3, 0.3, 1, RESTING_OPACITY],
            filter: ['blur(6px)', 'blur(0px)', 'blur(0px)', 'blur(0px)', 'blur(0px)'],
            transitionEnd: { filter: 'none' },
          }}
          transition={{
            duration: PACE.pass,
            delay: delay + index * PACE.step,
            times: [0, 0.22, 0.42, 0.6, 1],
            ease: 'easeInOut',
          }}
        >
          {letter}
        </motion.span>
      ))}
    </span>
  );
}
