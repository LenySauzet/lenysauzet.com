'use client';

import { ImageNotFound01Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import Image from 'next/image';
import { useState } from 'react';

import type { Probe } from '@/lib/media/probe';
import { cn } from '@/lib/utils';

import { ProjectVideo } from './ProjectVideo';

const SIZES = '(min-width: 64rem) 33vw, (min-width: 48rem) 50vw, 100vw';
const ARRIVAL = 'transition-[opacity,filter,scale] duration-700 ease-out motion-reduce:transition-none';

interface ProjectMediaProps {
  image: string;
  video?: string;
  probe: Probe;
  className?: string;
}

export function ProjectMedia({ image, video, probe, className }: ProjectMediaProps) {
  const [state, setState] = useState<'loading' | 'loaded' | 'failed'>('loading');
  const loaded = state === 'loaded';

  return (
    <div data-state={state} className={cn('absolute inset-0 overflow-hidden', className)}>
      {probe.placeholder && state !== 'failed' && (
        <div
          aria-hidden
          className={cn(
            'absolute inset-0 scale-110 bg-cover bg-center blur-xl transition-opacity delay-700 duration-300',
            loaded && 'opacity-0'
          )}
          style={{ backgroundImage: `url(${probe.placeholder})` }}
        />
      )}

      {state === 'failed' ? (
        <div className="absolute inset-0 grid place-items-center">
          <div aria-hidden className="hatch absolute inset-0" />
          <HugeiconsIcon icon={ImageNotFound01Icon} strokeWidth={1.5} className="relative size-6 text-subtle-foreground" />
        </div>
      ) : (
        <Image
          src={image}
          alt=""
          width={probe.width}
          height={probe.height}
          sizes={SIZES}
          onLoad={() => setState('loaded')}
          onError={() => setState('failed')}
          className={cn('relative size-full object-cover', ARRIVAL, !loaded && 'scale-[1.03] opacity-0 blur-lg')}
        />
      )}

      {video && <ProjectVideo src={video} className={cn('absolute inset-0 size-full object-cover', ARRIVAL)} />}
    </div>
  );
}
