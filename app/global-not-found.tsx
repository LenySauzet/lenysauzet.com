import type { Metadata, Viewport } from 'next';
import { ThemeProvider } from 'next-themes';

import siteConfig from '@/config/site';
import { DEFAULT_THEME, THEME_STORAGE_KEY } from '@/lib/theme/stored-theme';
import en from '@/messages/en.json';

import { bodyClassName } from './_components/document';
import { HomeLink } from './_components/HomeLink';
import { StatusPage } from './_components/StatusPage';
import './globals.css';

const { Status: t } = en;

export const viewport: Viewport = { themeColor: '#080b0f' };

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: `${t.notFoundTitle} · ${siteConfig.author.name}`,
};

export default function GlobalNotFound() {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={bodyClassName}>
        <ThemeProvider attribute="class" defaultTheme={DEFAULT_THEME} storageKey={THEME_STORAGE_KEY} enableSystem>
          <main>
            <StatusPage status="404" title={t.notFoundHeading}>
              <p>{t.notFoundBody}</p>
              <HomeLink href="/" label={t.home} />
            </StatusPage>
          </main>
        </ThemeProvider>
      </body>
    </html>
  );
}
