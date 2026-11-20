'use client';

import { Add01Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { useTheme } from 'next-themes';
import type { ReactNode } from 'react';

import { Avatar, AvatarFallback, AvatarGroup, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import type { Client } from '@/content/clients';
import { resolveMedia } from '@/lib/media/cdn';
import { openBooking } from '@/lib/services/booking';

const TRIGGER =
  'group/client relative cursor-pointer rounded-full outline-none hover:z-10 focus-visible:z-10 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background';
const RAISED =
  'ring-2 ring-background transition-[scale] duration-200 ease-out group-hover/client:scale-110 group-focus-visible/client:scale-110 motion-reduce:transition-none motion-reduce:group-hover/client:scale-100 motion-reduce:group-focus-visible/client:scale-100';

const initials = (name: string) => name.slice(0, 1).toUpperCase();

function Tip({ label, children }: { label: string; children: ReactNode }) {
  return (
    <Tooltip disableHoverableContent>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent side="bottom" sideOffset={10}>
        {label}
      </TooltipContent>
    </Tooltip>
  );
}

export function Clients({ clients, className }: { clients: Client[]; className?: string }) {
  const { resolvedTheme } = useTheme();

  return (
    <AvatarGroup className={className}>
      {clients.map((client) => (
        <Tip key={client.name} label={client.name}>
          <a href={client.href} target="_blank" rel="noopener noreferrer" aria-label={client.name} className={TRIGGER}>
            <Avatar size="lg" className={RAISED}>
              <AvatarImage src={resolveMedia(client.logo)} alt="" />
              <AvatarFallback className="font-medium">{initials(client.name)}</AvatarFallback>
            </Avatar>
          </a>
        </Tip>
      ))}
      <Tip label="Your company next?">
        <button
          type="button"
          aria-label="Your company next? Book a call"
          onClick={() => openBooking(resolvedTheme)}
          className={TRIGGER}
        >
          <Avatar size="lg" className={RAISED}>
            <AvatarFallback className="text-subtle-foreground">
              <HugeiconsIcon icon={Add01Icon} strokeWidth={2} className="size-4" />
            </AvatarFallback>
          </Avatar>
        </button>
      </Tip>
    </AvatarGroup>
  );
}
