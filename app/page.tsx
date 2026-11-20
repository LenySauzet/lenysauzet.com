import { serialize, structuredData } from '@/lib/seo/structured-data';

import { Hero } from './_components/Home/Hero';
import { Projects } from './_components/Home/Projects/Projects';

export default function Home() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serialize(structuredData()) }} />
      <Hero />
      <Projects />
    </>
  );
}
