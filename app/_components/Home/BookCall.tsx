'use client';

import { useTheme } from 'next-themes';

import { showsAvailability } from '@/app/_components/Island';
import Logo from '@/components/shared/Logo';
import { openBooking } from '@/lib/services/booking';
import { cn } from '@/lib/utils';

export function BookCall({ className }: { className?: string }) {
  const { resolvedTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={() => openBooking(resolvedTheme)}
      {...showsAvailability}
      className={cn(
        'group shine shine-border relative inline-flex h-11 cursor-pointer items-center rounded-xl border bg-card pr-4 pl-1.5 text-sm font-medium outline-none transition-[scale,background-color] duration-200 hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 active:scale-[0.97] motion-reduce:transition-none motion-reduce:active:scale-100',
        className
      )}
    >
      <span className="grid size-8 shrink-0 place-items-center rounded-full bg-background ring-1 ring-border">
        <Logo className="size-4" />
      </span>
      <span className="grid grid-cols-[0fr] transition-[grid-template-columns] duration-300 ease-out group-hover:grid-cols-[1fr] group-focus-visible:grid-cols-[1fr] motion-reduce:transition-none">
        <span aria-hidden className="flex items-center gap-1.5 overflow-hidden">
          <span className="pl-1.5 text-subtle-foreground">+</span>
          <span className="grid size-8 shrink-0 place-items-center rounded-full bg-muted text-xs">You</span>
        </span>
      </span>
      <span className="shine-text pl-2.5 [--shine-ink:var(--foreground)]">Book a call</span>
    </button>
  );
}
