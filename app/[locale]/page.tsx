import { getLocale, getTranslations } from 'next-intl/server';

import { homeUrl } from '@/i18n/locales';
import { askEnabled } from '@/lib/ask/enabled';
import { serialize, structuredData } from '@/lib/seo/structured-data';

import { Ask } from '../_components/Home/Ask';
import { Footer } from '../_components/Home/Footer';
import { Hero } from '../_components/Home/Hero';
import { Presence } from '../_components/Home/Presence';
import { Projects } from '../_components/Home/Projects/Projects';
import { OtherVersion } from '../_components/OtherVersion';

export default async function Home() {
  const locale = await getLocale();
  const t = await getTranslations('Site');
  const data = structuredData({ locale, url: homeUrl(locale), role: t('role'), description: t('description') });

  return (
    <>
      <main>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serialize(data) }} />
        <Hero />
        <Projects />
      </main>
      <Footer />
      <Presence />
      <OtherVersion />
      {askEnabled() && <Ask />}
    </>
  );
}
