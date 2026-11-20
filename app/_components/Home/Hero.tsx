import { HatchBand } from '@/components/shared/HatchBand';
import { SelectionFrame } from '@/components/shared/SelectionFrame';
import { pageGrid } from '@/components/shared/styles';
import siteConfig from '@/config/site';
import { clients } from '@/content/clients';
import { cn } from '@/lib/utils';

import { Actions } from './Actions';
import { Clients } from './Clients';

export function Hero({ className }: { className?: string }) {
  const { role, location } = siteConfig.author;

  return (
    <section className={cn(pageGrid, className)}>
      <HatchBand />

      <div className="flex flex-col items-center pt-16 pb-20 text-center sm:pt-40 lg:col-start-3">
        <p className="rise text-sm text-subtle-foreground">
          {role} · {location}
        </p>

        <SelectionFrame className="rise mt-6 [--rise-step:1]">
          <h1 className="font-serif text-4xl leading-[1.1] tracking-tight text-balance sm:text-5xl">
            Turning complex challenges into <em>delightful</em> &amp; <em>fast</em> products.
          </h1>
        </SelectionFrame>

        <p className="rise mt-8 max-w-xl text-base leading-7 text-pretty text-muted-foreground [--rise-step:2]">
          I&apos;m Lény, an AI and software engineer. I transform complex challenges into delightful user
          experiences and high-performance solutions. From the models and the architecture to the interface people
          touch, I bring the cross-disciplinary expertise that carries ambitious products to success. Familiar with
          both remote and in-office roles.
        </p>

        <Actions className="rise mt-10 [--rise-step:3]" />

        <Clients clients={clients} className="rise mt-10 [--rise-step:4]" />
      </div>

      <HatchBand className="lg:col-start-5" />
    </section>
  );
}
