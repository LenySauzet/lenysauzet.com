import type { ReactNode } from 'react';

import siteConfig from '@/config/site';
import { buildInfo } from '@/lib/build-info';
import { RESUME_ROUTE } from '@/lib/services/resume';
import { cn } from '@/lib/utils';

import { Browser, Clock, Dimensions } from './Readings';

const VALUE = 'font-mono text-sm text-subtle-foreground';
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
      <dt className="text-sm font-medium text-foreground">{label}</dt>
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
    <ul className="flex flex-col gap-2">
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
    <footer className={cn('px-4 pt-8 pb-32 sm:pb-16 lg:px-6', className)}>
      <div className="mx-auto flex max-w-5xl flex-col gap-10 border-t border-dashed pt-10">
        <section aria-labelledby="metadata-heading" className="flex flex-col gap-6">
          <h2 id="metadata-heading" className="text-sm font-medium text-foreground">
            Metadata
          </h2>
          <dl className="grid grid-cols-2 gap-x-8 gap-y-6 sm:grid-cols-3">
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
        </section>

        <nav aria-label="Links" className="grid grid-cols-2 gap-8 border-t border-dashed pt-10 sm:grid-cols-3">
          <p className="col-span-2 text-sm font-medium text-foreground sm:col-span-1">Links</p>
          <Links links={PAGES} />
          <Links links={ELSEWHERE} external />
        </nav>
      </div>
    </footer>
  );
}
