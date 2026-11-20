'use client';

import { useTheme } from 'next-themes';

import { Logo } from '@/components/shared/Logo';
import { pillSurface } from '@/components/ui/pill';
import { openBooking } from '@/lib/services/booking';
import { cn } from '@/lib/utils';

const WIDTH =
  'grid grid-cols-[0fr] transition-[grid-template-columns] delay-150 duration-500 ease-[cubic-bezier(0.22,0.61,0.36,1)] group-hover:grid-cols-[1fr] group-hover:delay-0 group-focus-visible:grid-cols-[1fr] group-focus-visible:delay-0 pointer-coarse:grid-cols-[1fr] motion-reduce:transition-none';
const ARRIVAL =
  'flex items-center gap-1.5 pl-1.5 opacity-0 blur-[6px] transition-[opacity,filter] duration-200 group-hover:opacity-100 group-hover:filter-none group-hover:delay-300 group-hover:duration-400 group-focus-visible:opacity-100 group-focus-visible:filter-none group-focus-visible:delay-300 pointer-coarse:opacity-100 pointer-coarse:filter-none motion-reduce:transition-none';

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
      <span className={WIDTH}>
        <span aria-hidden className="min-w-0">
          <span className={ARRIVAL}>
            <span className="text-subtle-foreground">+</span>
            <span className="grid size-8 shrink-0 place-items-center rounded-full bg-muted text-[0.6875rem] ring-1 ring-border">
              You
            </span>
          </span>
        </span>
      </span>
      <span className="shine-text pl-2.5">Book a call</span>
    </button>
  );
}
