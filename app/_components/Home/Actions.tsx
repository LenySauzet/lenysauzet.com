'use client';

import { AnimatedDownloadIcon } from '@/components/icons/AnimatedDownloadIcon';
import { AnimatedMailIcon } from '@/components/icons/AnimatedMailIcon';
import siteConfig from '@/config/site';
import { resumeAnchor } from '@/lib/services/resume';
import { cn } from '@/lib/utils';

import { BookCall } from './BookCall';
import { PillLink } from './PillLink';

export function Actions({ className }: { className?: string }) {
  return (
    <div
      data-presence="actions"
      className={cn('grid w-full max-w-sm grid-cols-2 gap-3 sm:max-w-2xl sm:grid-cols-[1fr_auto_1fr]', className)}
    >
      <BookCall className="col-span-2 justify-center sm:col-span-1 sm:justify-self-end" />
      <PillLink href={`mailto:${siteConfig.email}`} icon={AnimatedMailIcon} label="Email" className="justify-center" />
      <PillLink
        {...resumeAnchor}
        icon={AnimatedDownloadIcon}
        label="Resume"
        className="justify-center sm:justify-self-start"
      />
    </div>
  );
}
