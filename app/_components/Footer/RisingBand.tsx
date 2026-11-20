'use client';

import { useEffect, useRef, useState } from 'react';

import { HatchBand } from '@/components/shared/HatchBand';
import { cn } from '@/lib/utils';

const CLEARANCE = 32;

function laneBottom(side: 'first' | 'last') {
  const lane = [...document.querySelectorAll<HTMLElement>(`#work [data-lane="${side}"]`)].find(
    (candidate) => candidate.offsetParent
  );
  return lane && lane.getBoundingClientRect().bottom;
}

export function RisingBand({ side, className }: { side: 'first' | 'last'; className?: string }) {
  const cell = useRef<HTMLDivElement>(null);
  const [reach, setReach] = useState<number>();

  useEffect(() => {
    const measure = () => {
      const bottom = laneBottom(side);
      if (!cell.current || bottom === undefined) return;
      setReach(Math.min(0, bottom + CLEARANCE - cell.current.getBoundingClientRect().top));
    };

    measure();
    const watched = new ResizeObserver(measure);
    watched.observe(document.documentElement);
    return () => watched.disconnect();
  }, [side]);

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
