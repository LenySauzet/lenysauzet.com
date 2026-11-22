import { useTranslations } from 'next-intl';

import { HatchBand } from '@/components/shared/HatchBand';
import { SelectionFrame } from '@/components/shared/SelectionFrame';
import { pageGrid } from '@/components/shared/styles';
import siteConfig from '@/config/site';
import { clients } from '@/content/clients';
import { cn } from '@/lib/utils';

import { Actions } from './Actions';
import { Clients } from './Clients';

export function Hero({ className }: { className?: string }) {
  const t = useTranslations('Hero');
  const role = useTranslations('Site')('role');

  return (
    <section className={cn(pageGrid, className)}>
      <HatchBand />

      <div className="flex flex-col items-center pt-16 pb-20 text-center sm:pt-40 lg:col-start-3">
        <p data-presence="role" className="rise text-sm text-subtle-foreground">
          {role} · {siteConfig.author.location}
        </p>

        <SelectionFrame name="headline" className="rise mt-6 [--rise-step:1]">
          <h1
            data-presence="headline"
            className="font-serif text-4xl leading-[1.1] tracking-tight text-balance sm:text-5xl"
          >
            {t.rich('headline', { em: (chunks) => <em>{chunks}</em> })}
          </h1>
        </SelectionFrame>

        <p
          data-presence="intro"
          className="rise mt-8 max-w-xl text-base leading-7 text-pretty text-muted-foreground [--rise-step:2]"
        >
          {t('intro')}
        </p>

        <Actions className="rise mt-10 [--rise-step:3]" />

        <Clients clients={clients} className="rise mt-10 [--rise-step:4]" />
      </div>

      <HatchBand className="lg:col-start-5" />
    </section>
  );
}
