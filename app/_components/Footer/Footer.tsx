import type { ReactNode } from 'react';

import { SelectionFrame } from '@/components/shared/SelectionFrame';
import siteConfig from '@/config/site';
import { buildInfo } from '@/lib/build-info';
import { RESUME_ROUTE } from '@/lib/services/resume';
import { cn } from '@/lib/utils';

import { Browser, Clock, Dimensions } from './Readings';
import { RisingBand } from './RisingBand';

const VALUE = 'font-mono text-sm text-subtle-foreground';
const LABEL = 'text-sm font-medium text-muted-foreground';
const LINK = 'w-fit text-sm text-subtle-foreground transition-colors duration-200 hover:text-foreground';

const PAGES: FooterLink[] = [
  { label: 'Blog', href: siteConfig.blogUrl },
  { label: 'Resume', href: RESUME_ROUTE, download: true },
  { label: 'Email', href: `mailto:${siteConfig.email}` },
];

const ELSEWHERE: FooterLink[] = [
  { label: 'GitHub', href: siteConfig.social.github },
  { label: 'LinkedIn', href: siteConfig.social.linkedin },
  { label: 'X', href: siteConfig.social.x },
  { label: 'Bluesky', href: siteConfig.social.bluesky },
];

function Reading({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <dt className={LABEL}>{label}</dt>
      <dd className={VALUE}>{children}</dd>
    </div>
  );
}

interface FooterLink {
  label: string;
  href: string;
  download?: boolean;
}

function Links({ links, external }: { links: FooterLink[]; external?: boolean }) {
  return (
    <ul className="flex flex-col gap-1.5">
      {links.map(({ label, href, download }) => (
        <li key={label}>
          <a href={href} download={download} className={LINK} {...(external && { target: '_blank', rel: 'me noopener noreferrer' })}>
            {label}
          </a>
        </li>
      ))}
    </ul>
  );
}

export function Footer({ className }: { className?: string }) {
  return (
    <footer
      className={cn(
        'grid grid-cols-[minmax(0,1fr)] px-4 lg:grid-cols-[6rem_minmax(2rem,1fr)_minmax(0,44rem)_minmax(2rem,1fr)_6rem] lg:px-20',
        className
      )}
    >
      <RisingBand side="first" />

      <div className="flex flex-col gap-8 pt-8 pb-32 sm:pb-16 lg:col-start-3">
        <section aria-labelledby="metadata-heading" className="flex flex-col gap-4">
          <h2 id="metadata-heading" className={LABEL}>
            Metadata
          </h2>
          <SelectionFrame className="-mx-1.5 px-1.5 py-4 sm:-mx-6 sm:px-6 sm:py-5">
            <dl className="grid grid-cols-2 gap-x-8 gap-y-4 sm:grid-cols-3">
              <Reading label="Commit">
                {buildInfo.commitUrl ? (
                  <a href={buildInfo.commitUrl} className="transition-colors duration-200 hover:text-foreground">
                    {buildInfo.commit}
                  </a>
                ) : (
                  'local'
                )}
              </Reading>
              <Reading label="Browser">
                <Browser />
              </Reading>
              <Reading label="Time in Montpellier">
                <Clock />
              </Reading>
              <Reading label="Dimensions">
                <Dimensions />
              </Reading>
              <Reading label="Last updated">{buildInfo.updated}</Reading>
            </dl>
          </SelectionFrame>
        </section>

        <nav aria-label="Links" className="grid grid-cols-2 gap-x-8 gap-y-4 sm:grid-cols-3">
          <p className={cn(LABEL, 'col-span-2 sm:col-span-1')}>Links</p>
          <Links links={PAGES} />
          <Links links={ELSEWHERE} external />
        </nav>
      </div>

      <RisingBand side="last" className="lg:col-start-5" />
    </footer>
  );
}
