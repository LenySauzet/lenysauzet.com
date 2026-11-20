'use client';

import { Mail01Icon } from '@/components/ui/mail-01';
import { pillSurface } from '@/components/ui/pill';
import siteConfig from '@/config/site';
import { useAnimatedIcon } from '@/hooks/use-animated-icon';
import { cn } from '@/lib/utils';

export function EmailLink({ className }: { className?: string }) {
  const { icon, trigger } = useAnimatedIcon();

  return (
    <a
      href={`mailto:${siteConfig.email}`}
      {...trigger}
      className={cn(pillSurface, 'gap-2 px-5 text-sm font-medium text-foreground', className)}
    >
      <Mail01Icon ref={icon} size={16} />
      Email
    </a>
  );
}
