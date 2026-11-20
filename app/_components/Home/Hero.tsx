import { HatchBand } from '@/components/shared/HatchBand';
import { SelectionFrame } from '@/components/shared/SelectionFrame';
import siteConfig from '@/config/site';
import { clients } from '@/content/clients';

import { BookCall } from './BookCall';
import { Clients } from './Clients';
import { ResumeLink } from './ResumeLink';

export function Hero() {
  const { role, location } = siteConfig.author;

  return (
    <section className="grid grid-cols-[minmax(0,1fr)] px-4 lg:grid-cols-[6rem_1fr_minmax(0,44rem)_1fr_6rem] lg:px-20">
      <HatchBand />

      <div className="flex flex-col items-center pt-32 pb-20 text-center sm:pt-40 lg:col-start-3">
        <p className="rise text-sm text-subtle-foreground">
          {role} · {location}
        </p>

        <SelectionFrame className="rise mt-6 [--rise-step:1]">
          <h1 className="font-serif text-4xl leading-[1.1] tracking-tight text-balance sm:text-5xl">
            Turning complex challenges into <em>delightful</em> &amp; <em>fast</em> products.
          </h1>
        </SelectionFrame>

        <p className="rise mt-8 max-w-xl text-base leading-7 text-pretty text-muted-foreground [--rise-step:2]">
          For the past three years I have been building an enterprise conversational AI platform at Tolk.ai, 4.3
          million conversations served for public agencies, insurers and e-commerce brands. From software
          architecture to creative development, I take features from zero to one.
        </p>

        <div className="rise mt-10 flex flex-wrap items-center justify-center gap-3 [--rise-step:3] sm:grid sm:w-full sm:max-w-md sm:grid-cols-2">
          <BookCall className="sm:justify-self-end" />
          <ResumeLink className="sm:justify-self-start" />
        </div>

        <Clients clients={clients} className="rise mt-10 [--rise-step:4]" />
      </div>

      <HatchBand className="lg:col-start-5" />
    </section>
  );
}
