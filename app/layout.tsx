import type { Metadata, Viewport } from 'next';
import { ThemeProvider } from 'next-themes';
import type { ReactNode } from 'react';

import { TooltipProvider } from '@/components/ui/tooltip';
import siteConfig from '@/config/site';
import { DEFAULT_THEME, THEME_STORAGE_KEY } from '@/lib/theme/stored-theme';

import { PaletteLauncher } from './_components/CommandPalette';
import { bodyClassName } from './_components/document';
import { Footer } from './_components/Footer';
import { Island } from './_components/Island';
import { ThemeColor } from './_components/ThemeColor';
import './globals.css';

const { url, title, description, author } = siteConfig;

export const metadata: Metadata = {
  metadataBase: new URL(url),
  title: { default: title, template: `%s · ${author.name}` },
  description,
  applicationName: author.name,
  authors: [{ name: author.name, url }],
  creator: author.name,
  alternates: { canonical: '/' },
  openGraph: { type: 'website', url, title, description, siteName: author.name, locale: 'en_US' },
  twitter: { card: 'summary_large_image', title, description, creator: `@${author.handle}` },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = { themeColor: '#080b0f' };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={bodyClassName}>
        <ThemeProvider
          attribute="class"
          defaultTheme={DEFAULT_THEME}
          storageKey={THEME_STORAGE_KEY}
          enableSystem
          disableTransitionOnChange
        >
          <ThemeColor />
          <TooltipProvider>
            <Island />
            <PaletteLauncher />
            <main>{children}</main>
            <Footer />
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
