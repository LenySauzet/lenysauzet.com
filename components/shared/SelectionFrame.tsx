import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

const HANDLES = [
  'top-0 left-0 -translate-x-1/2 -translate-y-1/2',
  'top-0 right-0 translate-x-1/2 -translate-y-1/2',
  'bottom-0 left-0 -translate-x-1/2 translate-y-1/2',
  'bottom-0 right-0 translate-x-1/2 translate-y-1/2',
];

export function SelectionFrame({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('relative px-6 py-4 sm:px-9 sm:py-5', className)}>
      <div aria-hidden className="hatch absolute inset-0 opacity-60" />
      <div aria-hidden className="absolute inset-0 border border-primary/70" />
      {HANDLES.map((place) => (
        <span key={place} aria-hidden className={cn('absolute size-2 border border-primary bg-background', place)} />
      ))}
      <div className="relative">{children}</div>
    </div>
  );
}
