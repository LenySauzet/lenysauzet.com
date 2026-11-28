'use client';

import { useTranslations } from 'next-intl';
import Image from 'next/image';

import { pillSurface } from '@/components/shared/styles';
import siteConfig from '@/config/site';
import { useBooking } from '@/hooks/use-booking';
import { resolveMedia } from '@/lib/media/cdn';
import { cn } from '@/lib/utils';

const MEASURES = '[--you:--spacing(13)] [--opening:cubic-bezier(0.32,0.72,0,1)]';
const TRANSITION = 'duration-500 ease-(--opening) motion-reduce:transition-none';
const SPACE =
  'w-(--you) sm:pointer-fine:w-0 sm:pointer-fine:group-hover:w-(--you) sm:pointer-fine:group-focus-visible:w-(--you)';
const IN_PLACE =
  'sm:pointer-fine:hover:-ms-(--you) sm:pointer-fine:focus-visible:-ms-(--you) sm:pointer-fine:motion-safe:[transition:scale_200ms,margin-inline-start_500ms_var(--opening)]';
const FOLDED =
  'sm:pointer-fine:scale-0 sm:pointer-fine:opacity-0 sm:pointer-fine:blur-[10px] sm:pointer-fine:group-hover:scale-100 sm:pointer-fine:group-hover:opacity-100 sm:pointer-fine:group-hover:filter-none sm:pointer-fine:group-focus-visible:scale-100 sm:pointer-fine:group-focus-visible:opacity-100 sm:pointer-fine:group-focus-visible:filter-none';

export function BookCall({ className }: { className?: string }) {
  const t = useTranslations('Hero');
  const book = useBooking();

  return (
    <button
      type="button"
      onClick={book}
      className={cn(
        pillSurface,
        'group cursor-pointer pr-5 pl-1.5 text-sm font-medium',
        MEASURES,
        IN_PLACE,
        className
      )}
    >
      {/* The sweep runs inside: WebKit skips every transition of an element with a running animation. */}
      <span className="shine shine-border flex items-center rounded-[inherit]">
        <span className="relative size-8 shrink-0 overflow-hidden rounded-full bg-muted ring-1 ring-border">
          <Image src={resolveMedia(siteConfig.author.avatar)} alt="" fill sizes="32px" className="object-cover" />
        </span>
        <span aria-hidden className={cn('shrink-0 transition-[width]', TRANSITION, SPACE)}>
          <span
            className={cn(
              'flex w-max origin-left items-center gap-1.5 pl-1.5 transition-[scale,opacity,filter]',
              TRANSITION,
              FOLDED
            )}
          >
            <span className="w-2 text-center text-subtle-foreground">+</span>
            <span className="grid size-8 shrink-0 place-items-center rounded-full bg-muted text-[0.6875rem] ring-1 ring-border">
              {t('you')}
            </span>
          </span>
        </span>
        <span className="shine-text pl-2.5">{t('bookCall')}</span>
      </span>
    </button>
  );
}
