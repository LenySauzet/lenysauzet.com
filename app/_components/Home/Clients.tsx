'use client';

import { Add01Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { useTheme } from 'next-themes';

import { Avatar, AvatarFallback, AvatarGroup, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import type { Client } from '@/content/clients';
import { resolveMedia } from '@/lib/media/cdn';
import { openBooking } from '@/lib/services/booking';
import { cn } from '@/lib/utils';

const RAISED =
  'outline-none transition-[scale] duration-200 ease-out hover:z-10 hover:scale-110 focus-visible:z-10 focus-visible:scale-110 *:data-[slot=avatar-fallback]:ring-0 focus-visible:ring-primary! motion-reduce:transition-none motion-reduce:hover:scale-100 motion-reduce:focus-visible:scale-100';

const initials = (name: string) => name.slice(0, 1).toUpperCase();

export function Clients({ clients, className }: { clients: Client[]; className?: string }) {
  const { resolvedTheme } = useTheme();

  return (
    <AvatarGroup className={className}>
      {clients.map((client) => (
        <Tooltip key={client.name}>
          <TooltipTrigger asChild>
            <Avatar asChild size="lg" className={RAISED}>
              <a href={client.href} target="_blank" rel="noopener noreferrer" aria-label={client.name}>
                <AvatarImage src={resolveMedia(client.logo)} alt="" />
                <AvatarFallback className="font-medium">{initials(client.name)}</AvatarFallback>
              </a>
            </Avatar>
          </TooltipTrigger>
          <TooltipContent side="bottom" sideOffset={10}>{client.name}</TooltipContent>
        </Tooltip>
      ))}
      <Tooltip>
        <TooltipTrigger asChild>
          <Avatar asChild size="lg" className={cn(RAISED, 'cursor-pointer')}>
            <button type="button" aria-label="Your company next? Book a call" onClick={() => openBooking(resolvedTheme)}>
              <AvatarFallback className="text-subtle-foreground">
                <HugeiconsIcon icon={Add01Icon} strokeWidth={2} className="size-4" />
              </AvatarFallback>
            </button>
          </Avatar>
        </TooltipTrigger>
        <TooltipContent side="bottom" sideOffset={10}>Your company next?</TooltipContent>
      </Tooltip>
    </AvatarGroup>
  );
}
