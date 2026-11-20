'use client';

import { useTheme } from 'next-themes';

import { Logo } from '@/components/shared/Logo';
import { pillSurface } from '@/components/ui/pill';
import { openBooking } from '@/lib/services/booking';
import { cn } from '@/lib/utils';

const REVEALED = 'group-hover:grid-cols-[1fr] group-focus-visible:grid-cols-[1fr] pointer-coarse:grid-cols-[1fr]';
const SHOWN =
  'group-hover:opacity-100 group-hover:filter-none group-focus-visible:opacity-100 group-focus-visible:filter-none pointer-coarse:opacity-100 pointer-coarse:filter-none';

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
      <span
        className={cn(
          'grid grid-cols-[0fr] transition-[grid-template-columns] duration-500 ease-[cubic-bezier(0.22,0.61,0.36,1)] motion-reduce:transition-none',
          REVEALED
        )}
      >
        <span aria-hidden className="overflow-hidden">
          <span
            className={cn(
              'flex items-center gap-1.5 pl-1.5 opacity-0 blur-[6px] transition-[opacity,filter] duration-500 motion-reduce:transition-none',
              SHOWN
            )}
          >
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
