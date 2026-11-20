import { Download01Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';

import { pillSurface } from '@/components/ui/pill';
import { cn } from '@/lib/utils';

export function ResumeLink({ className }: { className?: string }) {
  return (
    <a
      href="/resume"
      download
      className={cn(pillSurface, 'group gap-2 px-5 text-sm font-medium text-muted-foreground hover:text-foreground', className)}
    >
      <HugeiconsIcon
        icon={Download01Icon}
        strokeWidth={2}
        className="size-4 transition-[translate] duration-200 group-hover:translate-y-0.5 motion-reduce:transition-none"
      />
      Resume
    </a>
  );
}
