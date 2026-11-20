'use client';

import { Download01Icon } from '@/components/ui/download-01';
import { pillSurface } from '@/components/ui/pill';
import { useAnimatedIcon } from '@/hooks/use-animated-icon';
import { cn } from '@/lib/utils';

export function ResumeLink({ className }: { className?: string }) {
  const { icon, trigger } = useAnimatedIcon();

  return (
    <a
      href="/resume"
      download
      {...trigger}
      className={cn(pillSurface, 'gap-2 px-5 text-sm font-medium text-muted-foreground hover:text-foreground', className)}
    >
      <Download01Icon ref={icon} size={16} />
      Resume
    </a>
  );
}
