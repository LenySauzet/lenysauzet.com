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
          className="inline-block whitespace-pre"
          initial={{ opacity: 0, filter: 'blur(6px)', y: 2 }}
          animate={{ opacity: 1, filter: 'blur(0px)', y: 0, transitionEnd: { filter: 'none' } }}
          transition={{ duration: 0.5, delay: delay + index * step, ease: EASE_OUT }}
        >
          {letter}
        </motion.span>
      ))}
    </>
  );
}
