import type { Metadata } from 'next';
import { getLocale, getTranslations } from 'next-intl/server';

import { homePath } from '@/i18n/locales';

import { HomeLink } from '../_components/HomeLink';
import { StatusPage } from '../_components/StatusPage';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('Status');
  return { title: t('notFoundTitle'), alternates: { canonical: null }, openGraph: null, twitter: null };
}

export default async function NotFound() {
  const locale = await getLocale();
  const t = await getTranslations('Status');

  return (
    <main>
      <StatusPage status="404" title={t('notFoundHeading')}>
        <p>{t('notFoundBody')}</p>
        <HomeLink href={homePath(locale)} label={t('home')} />
      </StatusPage>
    </main>
  );
}
