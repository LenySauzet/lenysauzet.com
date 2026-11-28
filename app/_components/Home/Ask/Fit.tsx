'use client';

import { motion, useReducedMotion, type TargetAndTransition } from 'motion/react';
import { createContext, useContext, useLayoutEffect, useRef, useState, type ReactNode } from 'react';

import { blurred, sharp } from '@/lib/motion';
import { cn } from '@/lib/utils';

import { GROW, REVEAL } from './motion';

const Opening = createContext(false);

interface FitProps {
  children: ReactNode;
  className?: string;
  contentClassName?: string;
  delay?: number;
  fade?: boolean;
  appear?: boolean;
  follow?: boolean;
  exit?: TargetAndTransition;
}

export function Fit({
  children,
  className,
  contentClassName,
  delay = 0,
  fade = false,
  appear = true,
  follow = false,
  exit,
}: FitProps) {
  const content = useRef<HTMLDivElement>(null);
  const still = useReducedMotion();
  const [height, setHeight] = useState(0);
  const [measured, setMeasured] = useState(false);
  const [settled, setSettled] = useState(appear);
  const [arrived, setArrived] = useState(false);

  useLayoutEffect(() => {
    const element = content.current;
    if (!element) return;
    let frame = 0;
    const resized = new ResizeObserver(() => {
      setHeight(element.offsetHeight);
      setMeasured(true);
      frame = requestAnimationFrame(() => setSettled(true));
    });
    resized.observe(element);
    return () => {
      resized.disconnect();
      cancelAnimationFrame(frame);
    };
  }, []);

  const instant = still || !settled || (follow && arrived);

  return (
    <motion.div
      className={cn(className, 'overflow-clip')}
      initial={{ height: appear ? 0 : 'auto', opacity: fade ? 0 : 1 }}
      animate={{ height: measured ? height : appear ? 0 : 'auto', opacity: 1 }}
      exit={exit}
      transition={{
        height: instant ? { duration: 0 } : { ...GROW, delay: arrived ? 0 : delay },
        opacity: { duration: 0.25 },
      }}
      onAnimationComplete={() => setArrived(true)}
    >
      <Opening.Provider value={follow && !arrived}>
        <div ref={content} className={contentClassName}>
          {children}
        </div>
      </Opening.Provider>
    </motion.div>
  );
}

interface ArrivalProps {
  children: ReactNode;
  delay?: number;
  className?: string;
}

export function Arrival({ children, delay = 0, className }: ArrivalProps) {
  const opening = useContext(Opening);
  const [appear] = useState(!opening);

  return (
    <Fit className="-mx-5 shrink-0 [overflow-clip-margin:16px]" contentClassName="px-5" delay={delay} appear={appear}>
      <motion.div
        className={cn('flex flex-col', className)}
        initial={appear ? blurred(8) : false}
        animate={sharp}
        transition={{ ...REVEAL, delay: delay + 0.2 }}
      >
        {children}
      </motion.div>
    </Fit>
  );
}
