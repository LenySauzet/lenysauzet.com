import { Add01Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import type { ReactNode } from 'react';

import { focusRing } from '@/components/shared/styles';
import { Avatar, AvatarFallback, AvatarGroup, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import type { Client } from '@/content/clients';
import { resolveMedia } from '@/lib/media/cdn';
import { cn } from '@/lib/utils';

import { BookingButton } from './BookingButton';

const TRIGGER = cn('group/client relative cursor-pointer rounded-full hover:z-10 focus-visible:z-10', focusRing);
const RAISED =
  'ring-2 ring-background transition-[scale] duration-200 ease-out group-hover/client:scale-110 group-focus-visible/client:scale-110 motion-reduce:transition-none motion-reduce:group-hover/client:scale-100 motion-reduce:group-focus-visible/client:scale-100';

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
  return (
    <AvatarGroup data-presence="clients" className={className}>
      {clients.map((client) => (
        <Tip key={client.name} label={client.name}>
          <a href={client.href} target="_blank" rel="noopener noreferrer" aria-label={client.name} className={TRIGGER}>
            <Avatar size="lg" className={RAISED}>
              <AvatarImage src={resolveMedia(client.logo)} alt="" />
              <AvatarFallback className="font-medium">{client.name.charAt(0)}</AvatarFallback>
            </Avatar>
          </a>
        </Tip>
      ))}
      <Tip label="Your company next?">
        <BookingButton aria-label="Your company next? Book a call" className={TRIGGER}>
          <Avatar size="lg" className={RAISED}>
            <AvatarFallback className="text-subtle-foreground">
              <HugeiconsIcon icon={Add01Icon} strokeWidth={2} className="size-4" />
            </AvatarFallback>
          </Avatar>
        </BookingButton>
      </Tip>
    </AvatarGroup>
  );
}
