'use client';

import { Add01Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { useTheme } from 'next-themes';
import Image from 'next/image';

import { showsAvailability } from '@/app/_components/Island';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import type { Client } from '@/content/clients';
import { resolveImage } from '@/lib/media/cdn';
import { openBooking } from '@/lib/services/booking';
import { cn } from '@/lib/utils';

const BUBBLE =
  'relative grid size-10 place-items-center overflow-hidden rounded-full bg-card ring-2 ring-background transition-[translate] duration-200 outline-none hover:z-10 hover:-translate-y-1 focus-visible:z-10 focus-visible:-translate-y-1 focus-visible:ring-primary motion-reduce:transition-none motion-reduce:hover:translate-y-0 motion-reduce:focus-visible:translate-y-0';

export function Clients({ clients, className }: { clients: Client[]; className?: string }) {
  const { resolvedTheme } = useTheme();

  return (
    <div className={cn('flex items-center', className)}>
      {clients.length > 0 && (
        <ul aria-label="Companies I have worked with" className="flex [&>li+li]:-ml-2">
          {clients.map((client) => (
            <li key={client.name} className="flex">
              <Tooltip>
                <TooltipTrigger asChild>
                  <a href={client.href} target="_blank" rel="noopener noreferrer" className={BUBBLE}>
                    <Image
                      src={resolveImage(client.logo)}
                      alt={client.name}
                      width={40}
                      height={40}
                      className="size-full object-cover"
                    />
                  </a>
                </TooltipTrigger>
                <TooltipContent>{client.name}</TooltipContent>
              </Tooltip>
            </li>
          ))}
        </ul>
      )}
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            aria-label="Your company next? Book a call"
            onClick={() => openBooking(resolvedTheme)}
            {...showsAvailability}
            className={cn(
              BUBBLE,
              'cursor-pointer text-subtle-foreground hover:text-foreground',
              clients.length > 0 && '-ml-2'
            )}
          >
            <HugeiconsIcon icon={Add01Icon} strokeWidth={2} className="size-4" />
          </button>
        </TooltipTrigger>
        <TooltipContent>Your company next?</TooltipContent>
      </Tooltip>
    </div>
  );
}
