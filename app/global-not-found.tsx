import type { Metadata } from 'next';

import siteConfig from '@/config/site';
import en from '@/messages/en.json';

import { bodyClassName, siteViewport } from './_components/document';
import { HomeLink } from './_components/HomeLink';
import { SiteTheme } from './_components/SiteTheme';
import { StatusPage } from './_components/StatusPage';
import './globals.css';

const { Status: t } = en;

export const viewport = siteViewport;

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: siteConfig.titleTemplate.replace('%s', t.notFoundTitle),
};

export default function GlobalNotFound() {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={bodyClassName}>
        <SiteTheme>
          <main>
            <StatusPage status="404" title={t.notFoundHeading}>
              <p>{t.notFoundBody}</p>
              <HomeLink href="/" label={t.home} />
            </StatusPage>
          </main>
        </SiteTheme>
      </body>
    </html>
  );
}
