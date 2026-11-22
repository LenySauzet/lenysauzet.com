'use client';

import { useTranslations } from 'next-intl';

import { AnimatedDownloadIcon } from '@/components/icons/AnimatedDownloadIcon';
import { AnimatedMailIcon } from '@/components/icons/AnimatedMailIcon';
import siteConfig from '@/config/site';
import { useResumeAnchor } from '@/hooks/use-resume-anchor';
import { cn } from '@/lib/utils';

import { BookCall } from './BookCall';
import { PillLink } from './PillLink';

export function Actions({ className }: { className?: string }) {
  const t = useTranslations('Hero');
  const resumeAnchor = useResumeAnchor();

  return (
    <div
      data-presence="actions"
      className={cn('grid w-full max-w-sm grid-cols-2 gap-3 sm:flex sm:max-w-none sm:justify-center', className)}
    >
      <BookCall className="col-span-2 justify-center" />
      <PillLink href={`mailto:${siteConfig.email}`} icon={AnimatedMailIcon} label={t('email')} className="justify-center" />
      <PillLink {...resumeAnchor} icon={AnimatedDownloadIcon} label={t('resume')} className="justify-center" />
    </div>
  );
}
