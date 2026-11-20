import { HatchBand } from '@/components/shared/HatchBand';
import { SelectionFrame } from '@/components/shared/SelectionFrame';
import siteConfig from '@/config/site';
import { clients } from '@/content/clients';

import { BookCall } from './BookCall';
import { Clients } from './Clients';
import { EmailLink } from './EmailLink';
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
          I&apos;m Lény, an AI and software engineer who takes ownership and ships faster than expected. From the
          models and the architecture to the interface people touch, I bring the cross-disciplinary expertise that
          carries ambitious products to success, remote or in the office.
        </p>

        <div className="rise mt-10 flex flex-wrap items-center justify-center gap-3 [--rise-step:3] sm:grid sm:w-full sm:max-w-2xl sm:grid-cols-[1fr_auto_1fr]">
          <BookCall className="sm:justify-self-end" />
          <EmailLink />
          <ResumeLink className="sm:justify-self-start" />
        </div>

        <Clients clients={clients} className="rise mt-10 [--rise-step:4]" />
      </div>

      <HatchBand className="lg:col-start-5" />
    </section>
  );
}
