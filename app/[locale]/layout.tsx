import type { Metadata } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getTranslations } from 'next-intl/server';
import type { ReactNode } from 'react';

import { TooltipProvider } from '@/components/ui/tooltip';
import siteConfig from '@/config/site';
import { homeAlternates, homeUrl, OPEN_GRAPH_LOCALES, otherLocale } from '@/i18n/locales';
import { routing } from '@/i18n/routing';

import { PaletteLauncher } from '../_components/CommandPalette';
import { bodyClassName, siteViewport } from '../_components/document';
import { Island } from '../_components/Island';
import { PageBlur } from '../_components/PageBlur';
import { SiteTheme } from '../_components/SiteTheme';
import { ThemeColor } from '../_components/ThemeColor';
import '../globals.css';

const { url, author, shareImage } = siteConfig;

export const dynamicParams = false;

export const generateStaticParams = () => routing.locales.map((locale) => ({ locale }));

export const viewport = siteViewport;

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = await getTranslations('Site');
  const title = siteConfig.titleOf(t('role'));
  const description = t('description');
  const home = homeUrl(locale);

  return {
    metadataBase: new URL(url),
    title: { default: title, template: siteConfig.titleTemplate },
    description,
    applicationName: author.name,
    authors: [{ name: author.name, url }],
    creator: author.name,
    alternates: { canonical: home, languages: homeAlternates() },
    openGraph: {
      type: 'website',
      url: home,
      title,
      description,
      siteName: author.name,
      locale: OPEN_GRAPH_LOCALES[locale],
      alternateLocale: OPEN_GRAPH_LOCALES[otherLocale(locale)],
      images: [shareImage],
    },
    twitter: { card: 'summary_large_image', title, description, creator: `@${author.handle}`, images: [shareImage] },
  };
}

export default async function LocaleLayout({ children }: { children: ReactNode }) {
  const locale = await getLocale();

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className={bodyClassName}>
        <NextIntlClientProvider>
          <SiteTheme>
            <ThemeColor />
            <TooltipProvider>
              <Island />
              <PaletteLauncher />
              {children}
              <PageBlur />
            </TooltipProvider>
          </SiteTheme>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
