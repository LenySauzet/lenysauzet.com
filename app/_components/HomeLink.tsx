import { ArrowLeft02Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import Link from 'next/link';

import { focusRing } from '@/components/shared/styles';
import { cn } from '@/lib/utils';

export function HomeLink({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      className={cn(
        'group inline-flex items-center gap-1 rounded-sm text-subtle-foreground transition-colors duration-200 hover:text-foreground',
        focusRing,
        className
      )}
    >
      <HugeiconsIcon
        icon={ArrowLeft02Icon}
        size={22}
        strokeWidth={1.5}
        className="transition-transform duration-400 group-hover:-translate-x-1.25 motion-reduce:transition-none"
      />
      Home
    </Link>
  );
}
