'use client';

import { ImageNotFound01Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import Image from 'next/image';
import { useState } from 'react';

import type { ImageMeta } from '@/lib/media/probe';
import { cn } from '@/lib/utils';

import { ProjectVideo } from './ProjectVideo';

const SIZES = '(min-width: 64rem) 33vw, (min-width: 48rem) 50vw, 100vw';
const ARRIVAL = 'transition-[opacity,filter,scale] duration-700 ease-out motion-reduce:transition-none';
const PENDING = 'scale-[1.03] opacity-0 blur-lg';

interface ProjectMediaProps {
  image: string;
  meta: ImageMeta;
  video?: string;
  className?: string;
}

export function ProjectMedia({ image, meta, video, className }: ProjectMediaProps) {
  const [state, setState] = useState<'loading' | 'loaded' | 'failed'>('loading');
  const [playing, setPlaying] = useState(false);
  const loaded = state === 'loaded';

  return (
    <div data-state={state} className={cn('absolute inset-0 overflow-hidden', className)}>
      {meta.placeholder && state !== 'failed' && (
        <div
          aria-hidden
          data-slot="placeholder"
          className={cn(
            'absolute inset-0 scale-110 bg-cover bg-center blur-xl transition-opacity delay-700 duration-300',
            loaded && 'opacity-0'
          )}
          style={{ backgroundImage: `url(${meta.placeholder})` }}
        />
      )}

      {state === 'failed' ? (
        <div data-slot="fallback" className="absolute inset-0 grid place-items-center">
          <div aria-hidden className="hatch absolute inset-0" />
          <HugeiconsIcon
            icon={ImageNotFound01Icon}
            strokeWidth={1.5}
            className="relative size-6 text-subtle-foreground"
          />
        </div>
      ) : (
        <Image
          src={image}
          alt=""
          width={meta.width}
          height={meta.height}
          sizes={SIZES}
          onLoad={() => setState('loaded')}
          onError={() => setState('failed')}
          className={cn('relative size-full object-cover', ARRIVAL, !loaded && PENDING)}
        />
      )}

      {video && (
        <ProjectVideo
          src={video}
          onPlaying={() => setPlaying(true)}
          className={cn('absolute inset-0 size-full object-cover', ARRIVAL, !playing && PENDING)}
        />
      )}
    </div>
  );
}
