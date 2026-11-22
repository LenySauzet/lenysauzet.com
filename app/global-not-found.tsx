import type { Metadata } from 'next';

import siteConfig from '@/config/site';
import en from '@/messages/en.json';

import { bodyClassName } from './_components/document';
import { HomeLink } from './_components/HomeLink';
import { StatusPage } from './_components/StatusPage';
import { StoredTheme } from './_components/StoredTheme';
import './globals.css';

const { Status: t } = en;

export const metadata: Metadata = { title: `${t.notFoundTitle} · ${siteConfig.author.name}` };

export default function GlobalNotFound() {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={bodyClassName}>
        <StoredTheme />
        <main>
          <StatusPage status="404" title={t.notFoundHeading}>
            <p>{t.notFoundBody}</p>
            <HomeLink href="/" label={t.home} />
          </StatusPage>
        </main>
      </body>
    </html>
  );
}
