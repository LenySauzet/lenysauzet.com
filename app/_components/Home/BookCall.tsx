'use client';

import { useTheme } from 'next-themes';

import { Logo } from '@/components/shared/Logo';
import { pillSurface } from '@/components/ui/pill';
import { openBooking } from '@/lib/services/booking';
import { cn } from '@/lib/utils';

const EASE = 'duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] motion-reduce:transition-none';
const OPEN = 'group-hover:w-13 group-focus-visible:w-13 pointer-coarse:w-13 max-sm:w-13';
const GROWN =
  'group-hover:scale-100 group-hover:opacity-100 group-hover:filter-none group-focus-visible:scale-100 group-focus-visible:opacity-100 group-focus-visible:filter-none pointer-coarse:scale-100 pointer-coarse:opacity-100 pointer-coarse:filter-none max-sm:scale-100 max-sm:opacity-100 max-sm:filter-none';

export function BookCall({ className }: { className?: string }) {
  const { resolvedTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={() => openBooking(resolvedTheme)}
      className={cn(pillSurface, 'group shine shine-border cursor-pointer pr-5 pl-1.5 text-sm font-medium', className)}
    >
      <span className="grid size-8 shrink-0 place-items-center rounded-full bg-background ring-1 ring-border">
        <Logo className="size-4" />
      </span>
      <span aria-hidden className={cn('w-0 shrink-0 transition-[width]', EASE, OPEN)}>
        <span
          className={cn(
            'flex w-max origin-left scale-0 items-center gap-1.5 pl-1.5 opacity-0 blur-[10px] transition-[scale,opacity,filter]',
            EASE,
            GROWN
          )}
        >
          <span className="w-2 text-center text-subtle-foreground">+</span>
          <span className="grid size-8 shrink-0 place-items-center rounded-full bg-muted text-[0.6875rem] ring-1 ring-border">
            You
          </span>
        </span>
      </span>
      <span className="shine-text pl-2.5">Book a call</span>
    </button>
  );
}
