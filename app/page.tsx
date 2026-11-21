import { serialize, structuredData } from '@/lib/seo/structured-data';

import { Footer } from './_components/Home/Footer';
import { Hero } from './_components/Home/Hero';
import { Presence } from './_components/Home/Presence';
import { Projects } from './_components/Home/Projects/Projects';

export default function Home() {
  return (
    <>
      <main>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serialize(structuredData()) }} />
        <Hero />
        <Projects />
      </main>
      <Footer />
      <Presence />
    </>
  );
}
