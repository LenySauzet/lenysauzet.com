import { getLocale, getTranslations } from 'next-intl/server';

import siteConfig from '@/config/site';
import { getPathname } from '@/i18n/navigation';
import { serialize, structuredData } from '@/lib/seo/structured-data';

import { Footer } from '../_components/Home/Footer';
import { Hero } from '../_components/Home/Hero';
import { Presence } from '../_components/Home/Presence';
import { Projects } from '../_components/Home/Projects/Projects';

export default async function Home() {
  const locale = await getLocale();
  const t = await getTranslations('Site');
  const data = structuredData({
    locale,
    url: new URL(getPathname({ href: '/', locale }), siteConfig.url).href,
    role: t('role'),
    description: t('description'),
  });

  return (
    <>
      <main>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serialize(data) }} />
        <Hero />
        <Projects />
      </main>
      <Footer />
      <Presence />
    </>
  );
}
