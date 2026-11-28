'use client';

import { Briefcase01Icon, Calendar03Icon, Layers01Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { motion } from 'motion/react';
import { useTranslations } from 'next-intl';
import { useLayoutEffect, useRef, useState, type CSSProperties } from 'react';

import { focusRing } from '@/components/shared/styles';
import { edgesOf, type Edges } from '@/lib/ask/edges';
import { cn } from '@/lib/utils';

import { Letters } from './Letters';
import { MORPH } from './motion';
import { glass } from './styles';

const TOPICS = [
  { key: 'role', icon: Briefcase01Icon },
  { key: 'availability', icon: Calendar03Icon },
  { key: 'built', icon: Layers01Icon },
] as const;

const STAGGER = 0.05;
const FADE = '40px';

export function Topics({ onPick, className }: { onPick: (question: string) => void; className?: string }) {
  const t = useTranslations('Ask.topics');
  const row = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState<Edges>({ start: false, end: false });

  useLayoutEffect(() => {
    const element = row.current;
    if (!element) return;
    const measure = () => setEdges(edgesOf(element));
    measure();
    const resized = new ResizeObserver(measure);
    resized.observe(element);
    for (const child of element.children) resized.observe(child);
    element.addEventListener('scroll', measure, { passive: true });
    return () => {
      resized.disconnect();
      element.removeEventListener('scroll', measure);
    };
  }, []);

  return (
    <div
      ref={row}
      style={{ '--fade-start': edges.start ? FADE : '0px', '--fade-end': edges.end ? FADE : '0px' } as CSSProperties}
      className={cn(
        'flex justify-center-safe gap-1.5 overflow-x-auto [scrollbar-width:none] transition-[--fade-start,--fade-end] duration-300 [mask-image:linear-gradient(to_right,transparent,black_var(--fade-start),black_calc(100%-var(--fade-end)),transparent)]',
        className
      )}
    >
      {TOPICS.map(({ key, icon }, index) => {
        const delay = index * STAGGER;
        const label = t(key);
        return (
          <motion.button
            key={key}
            type="button"
            onPointerDown={(event) => event.preventDefault()}
            onClick={() => onPick(label)}
            initial={{ opacity: 0, scale: 0.7, '--glass-blur': '0px' }}
            animate={{ opacity: 1, scale: 1, '--glass-blur': '16px' }}
            exit={{ opacity: 0, scale: 0.85, '--glass-blur': '0px', transition: { duration: 0.18 } }}
            transition={{ ...MORPH, delay, opacity: { duration: 0.25, delay } }}
            style={glass('16px')}
            className={cn(
              'relative flex h-7 shrink-0 cursor-pointer items-center overflow-hidden rounded-full border border-foreground/12 bg-card/85 px-2.5 text-xs whitespace-nowrap text-muted-foreground transition-[color,scale] duration-200 hover:scale-[1.02] hover:text-foreground active:scale-[0.98] motion-reduce:hover:scale-100 motion-reduce:active:scale-100',
              focusRing
            )}
          >
            <motion.span
              className="flex items-center gap-1.5"
              initial={{ x: 28 }}
              animate={{ x: 0 }}
              transition={{ ...MORPH, delay }}
            >
              <HugeiconsIcon icon={icon} size={13} strokeWidth={2} />
              <Letters text={label} delay={delay + 0.05} stagger={0.018} />
            </motion.span>
          </motion.button>
        );
      })}
    </div>
  );
}
