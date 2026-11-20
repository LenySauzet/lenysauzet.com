import type { ReactNode } from 'react';

import { HatchBand } from '@/components/shared/HatchBand';
import { cn } from '@/lib/utils';

const FADED = 'mask-[linear-gradient(to_bottom,transparent,black_20%,black_80%,transparent)]';

interface StatusPageProps {
  status: string;
  title: string;
  children: ReactNode;
  className?: string;
}

export function StatusPage({ status, title, children, className }: StatusPageProps) {
  return (
    <section
      className={cn(
        'grid min-h-dvh grid-cols-[minmax(0,1fr)] px-4 lg:grid-cols-[6rem_minmax(2rem,1fr)_minmax(0,42rem)_minmax(2rem,1fr)_6rem] lg:px-20',
        className
      )}
    >
      <HatchBand className={FADED} />

      <div className="flex flex-col items-center justify-center py-24 text-center lg:col-start-3">
        <p className="rise relative font-mono text-[clamp(4.5rem,24vw,9rem)] leading-none text-transparent mask-[linear-gradient(to_bottom,black_40%,transparent_80%)]">
          <span className="[-webkit-text-stroke:2px_var(--subtle-foreground)]">{status}</span>
          <span aria-hidden className="absolute inset-0 text-background">
            {status}
          </span>
        </p>

        <h1 className="rise relative mt-4 font-serif text-4xl leading-tight tracking-tight text-balance [--rise-step:1] sm:text-5xl">
          {title}
        </h1>

        <div className="rise mt-6 flex max-w-md flex-col items-center gap-6 text-base leading-7 text-muted-foreground [--rise-step:2]">
          {children}
        </div>
      </div>

      <HatchBand className={cn('lg:col-start-5', FADED)} />
    </section>
  );
}
