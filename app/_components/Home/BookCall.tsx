'use client';

import { useTranslations } from 'next-intl';
import Image from 'next/image';

import { pillSurface } from '@/components/shared/styles';
import siteConfig from '@/config/site';
import { useBooking } from '@/hooks/use-booking';
import { resolveMedia } from '@/lib/media/cdn';
import { cn } from '@/lib/utils';

const TRANSITION = 'duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] motion-reduce:transition-none';
const OPEN = 'group-hover:w-13 group-focus-visible:w-13 pointer-coarse:w-13 max-sm:w-13';
const IN_PLACE =
  'sm:pointer-fine:hover:-ml-13 sm:pointer-fine:focus-visible:-ml-13 sm:pointer-fine:motion-safe:[transition:scale_200ms,margin-left_500ms_cubic-bezier(0.32,0.72,0,1)]';
const GROWN =
  'group-hover:scale-100 group-hover:opacity-100 group-hover:filter-none group-focus-visible:scale-100 group-focus-visible:opacity-100 group-focus-visible:filter-none pointer-coarse:scale-100 pointer-coarse:opacity-100 pointer-coarse:filter-none max-sm:scale-100 max-sm:opacity-100 max-sm:filter-none';

export function BookCall({ className }: { className?: string }) {
  const t = useTranslations('Hero');
  const book = useBooking();

  return (
    <button
      type="button"
      onClick={book}
      className={cn(
        pillSurface,
        'group shine shine-border cursor-pointer pr-5 pl-1.5 text-sm font-medium',
        IN_PLACE,
        className
      )}
    >
      <span className="relative size-8 shrink-0 overflow-hidden rounded-full ring-1 ring-border">
        <Image src={resolveMedia(siteConfig.author.avatar)} alt="" fill sizes="32px" className="object-cover" />
      </span>
      <span aria-hidden className={cn('w-0 shrink-0 transition-[width]', TRANSITION, OPEN)}>
        <span
          className={cn(
            'flex w-max origin-left scale-0 items-center gap-1.5 pl-1.5 opacity-0 blur-[10px] transition-[scale,opacity,filter]',
            TRANSITION,
            GROWN
          )}
        >
          <span className="w-2 text-center text-subtle-foreground">+</span>
          <span className="grid size-8 shrink-0 place-items-center rounded-full bg-muted text-[0.6875rem] ring-1 ring-border">
            {t('you')}
          </span>
        </span>
      </span>
      <span className="shine-text pl-2.5">{t('bookCall')}</span>
    </button>
  );
}
