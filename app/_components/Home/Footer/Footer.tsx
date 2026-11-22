import { useFormatter, useLocale, useTranslations } from 'next-intl';
import Link from 'next/link';
import type { ReactNode } from 'react';

import { SelectionFrame } from '@/components/shared/SelectionFrame';
import { focusRing, pageGrid } from '@/components/shared/styles';
import siteConfig from '@/config/site';
import { getPathname } from '@/i18n/navigation';
import { otherLocale } from '@/i18n/locales';
import { buildInfo } from '@/lib/build-info';
import { cn } from '@/lib/utils';

import { ResumeAnchor } from '../../ResumeAnchor';
import { Browser, Clock, Dimensions } from './Readings';
import { RisingBand } from './RisingBand';

const LABEL = 'text-sm font-medium text-muted-foreground';
const LINK = cn(
  'w-fit rounded-sm text-sm text-subtle-foreground transition-colors duration-200 hover:text-foreground',
  focusRing
);

interface ReadingProps {
  label: string;
  live?: boolean;
  children: ReactNode;
}

function Reading({ label, live = false, children }: ReadingProps) {
  return (
    <div className="flex flex-col gap-1">
      <dt className={LABEL}>{label}</dt>
      <dd data-presence-volatile={live || undefined} className="font-mono text-sm text-subtle-foreground">
        {children}
      </dd>
    </div>
  );
}

function LinkList({ children }: { children: ReactNode }) {
  return <ul className="flex flex-col gap-1.5">{children}</ul>;
}

export function Footer({ className }: { className?: string }) {
  const t = useTranslations('Footer');
  const format = useFormatter();
  const locale = useLocale();
  const other = otherLocale(locale);
  const { commit, builtAt } = buildInfo;

  return (
    <footer className={cn(pageGrid, className)}>
      <RisingBand lane="first" />

      <div className="flex flex-col gap-8 pt-8 pb-32 sm:pb-16 lg:col-start-3">
        <section data-presence="metadata" aria-labelledby="metadata-heading" className="flex flex-col gap-4">
          <h2 id="metadata-heading" className={LABEL}>
            {t('metadata')}
          </h2>
          <SelectionFrame name="metadata" className="lg:-mx-6 lg:px-6">
            <dl className="grid grid-cols-2 gap-x-8 gap-y-4 sm:grid-cols-3">
              <Reading label={t('commit')}>
                {commit ? (
                  <a href={commit.url} className={cn(LINK, 'font-mono')}>
                    {commit.short}
                  </a>
                ) : (
                  t('local')
                )}
              </Reading>
              <Reading label={t('browser')} live>
                <Browser />
              </Reading>
              <Reading label={t('time')} live>
                <Clock />
              </Reading>
              <Reading label={t('dimensions')} live>
                <Dimensions />
              </Reading>
              <Reading label={t('updated')}>
                {format.dateTime(builtAt, { month: 'short', year: 'numeric', timeZone: siteConfig.author.timeZone })}
              </Reading>
              <Reading label={t('source')}>
                <a
                  href={siteConfig.repository}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(LINK, 'font-mono')}
                >
                  GitHub
                </a>
              </Reading>
            </dl>
          </SelectionFrame>
        </section>

        <nav data-presence="links" aria-label={t('links')} className="grid grid-cols-2 gap-x-8 gap-y-4 sm:grid-cols-3">
          <p className={cn(LABEL, 'col-span-2 sm:col-span-1')}>{t('links')}</p>
          <LinkList>
            <li>
              <a href={siteConfig.blogUrl} hrefLang="en" className={LINK}>
                {t('blog')}
              </a>
            </li>
            <li>
              <ResumeAnchor className={LINK}>{t('resume')}</ResumeAnchor>
            </li>
            <li>
              <a href={`mailto:${siteConfig.email}`} className={LINK}>
                {t('email')}
              </a>
            </li>
            <li>
              <Link href={getPathname({ href: '/', locale: other })} hrefLang={other} lang={other} className={LINK}>
                {t('otherLanguage')}
              </Link>
            </li>
          </LinkList>
          <LinkList>
            {siteConfig.profiles.map(({ name, url }) => (
              <li key={name}>
                <a href={url} target="_blank" rel="me noopener noreferrer" className={LINK}>
                  {name}
                </a>
              </li>
            ))}
          </LinkList>
        </nav>
      </div>

      <RisingBand lane="last" className="lg:col-start-5" />
    </footer>
  );
}
