'use client';

import { useEffect, useRef, useState } from 'react';

import { HatchBand } from '@/components/shared/HatchBand';
import { WORK_ID, type Lane } from '@/lib/masonry';
import { cn } from '@/lib/utils';

const CLEARANCE = 32;

function laneBottom(lane: Lane) {
  const shown = [...document.querySelectorAll<HTMLElement>(`#${WORK_ID} [data-lane="${lane}"]`)].find(
    (candidate) => candidate.offsetParent
  );
  return shown?.getBoundingClientRect().bottom;
}

export function RisingBand({ lane, className }: { lane: Lane; className?: string }) {
  const cell = useRef<HTMLDivElement>(null);
  const [reach, setReach] = useState<number>();

  useEffect(() => {
    const measure = () => {
      const bottom = laneBottom(lane);
      if (!cell.current || bottom === undefined) return;
      setReach(Math.min(0, bottom + CLEARANCE - cell.current.getBoundingClientRect().top));
    };

    measure();
    const watched = new ResizeObserver(measure);
    watched.observe(document.documentElement);
    return () => watched.disconnect();
  }, [lane]);

  return (
    <div ref={cell} aria-hidden className={cn('relative hidden lg:block', className)}>
      <HatchBand
        className={cn(
          'absolute inset-x-0 bottom-0 mask-[linear-gradient(to_bottom,transparent,black_8rem)] transition-opacity duration-700',
          reach === undefined && 'opacity-0'
        )}
        style={{ top: reach ?? 0 }}
      />
    </div>
  );
}
