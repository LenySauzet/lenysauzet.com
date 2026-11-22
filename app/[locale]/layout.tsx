import type { Metadata, Viewport } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getTranslations } from 'next-intl/server';
import { ThemeProvider } from 'next-themes';
import type { ReactNode } from 'react';

import { TooltipProvider } from '@/components/ui/tooltip';
import siteConfig from '@/config/site';
import { OPEN_GRAPH_LOCALES, otherLocale } from '@/i18n/locales';
import { getPathname } from '@/i18n/navigation';
import { routing } from '@/i18n/routing';
import { DEFAULT_THEME, THEME_STORAGE_KEY } from '@/lib/theme/stored-theme';

import { PaletteLauncher } from '../_components/CommandPalette';
import { bodyClassName } from '../_components/document';
import { Island } from '../_components/Island';
import { OtherVersion } from '../_components/OtherVersion';
import { PageBlur } from '../_components/PageBlur';
import { ThemeColor } from '../_components/ThemeColor';
import '../globals.css';
import { alt, size } from '../opengraph-image';

const { url, author } = siteConfig;
const image = { url: '/opengraph-image', ...size, alt };

export const dynamicParams = false;

export const generateStaticParams = () => routing.locales.map((locale) => ({ locale }));

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = await getTranslations('Site');
  const title = `${author.name} · ${t('role')}`;
  const description = t('description');
  const home = getPathname({ href: '/', locale });
  const languages = Object.fromEntries(
    routing.locales.map((language) => [language, getPathname({ href: '/', locale: language })])
  );

  return {
    metadataBase: new URL(url),
    title: { default: title, template: `%s · ${author.name}` },
    description,
    applicationName: author.name,
    authors: [{ name: author.name, url }],
    creator: author.name,
    alternates: { canonical: home, languages: { ...languages, 'x-default': '/' } },
    openGraph: {
      type: 'website',
      url: home,
      title,
      description,
      siteName: author.name,
      locale: OPEN_GRAPH_LOCALES[locale],
      alternateLocale: OPEN_GRAPH_LOCALES[otherLocale(locale)],
      images: [image],
    },
    twitter: { card: 'summary_large_image', title, description, creator: `@${author.handle}`, images: [image] },
    robots: { index: true, follow: true },
  };
}

export const viewport: Viewport = { themeColor: '#080b0f' };

export default async function LocaleLayout({ children }: { children: ReactNode }) {
  const locale = await getLocale();

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className={bodyClassName}>
        <NextIntlClientProvider>
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
              <OtherVersion />
              {children}
              <PageBlur />
            </TooltipProvider>
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
