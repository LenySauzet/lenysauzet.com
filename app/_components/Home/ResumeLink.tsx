'use client';

import { Download01Icon } from '@/components/ui/download-01';
import { pillSurface } from '@/components/ui/pill';
import { useAnimatedIcon } from '@/hooks/use-animated-icon';
import { announceResume, RESUME_ROUTE } from '@/lib/services/resume';
import { cn } from '@/lib/utils';

export function ResumeLink({ className }: { className?: string }) {
  const { icon, trigger } = useAnimatedIcon();

  return (
    <a
      href={RESUME_ROUTE}
      download
      onClick={announceResume}
      {...trigger}
      className={cn(pillSurface, 'gap-2 px-5 text-sm font-medium text-foreground', className)}
    >
      <Download01Icon ref={icon} size={16} />
      Resume
    </a>
  );
}
