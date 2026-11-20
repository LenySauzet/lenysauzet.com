import type { CSSProperties } from 'react';

import { cn } from '@/lib/utils';

export function HatchBand({ className, style }: { className?: string; style?: CSSProperties }) {
  return (
    <div
      aria-hidden
      style={style}
      className={cn(
        'relative hidden border-x border-border mask-[linear-gradient(to_bottom,black_70%,transparent)] lg:block',
        className
      )}
    >
      <div className="hatch absolute inset-0" />
    </div>
  );
}
