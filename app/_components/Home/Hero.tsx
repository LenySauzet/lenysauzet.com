import { HatchBand } from '@/components/shared/HatchBand';
import { Button } from '@/components/ui/button';
import { clients } from '@/content/clients';

import { BookCall } from './BookCall';
import { Clients } from './Clients';

export function Hero() {
  return (
    <section className="grid grid-cols-[minmax(0,1fr)] px-4 lg:grid-cols-[6rem_1fr_minmax(0,42rem)_1fr_6rem] lg:px-20">
      <HatchBand />

      <div className="flex flex-col items-center pt-32 pb-20 text-center sm:pt-40 lg:col-start-3">
        <p className="font-serif text-xl text-subtle-foreground">Innovation engineer in Montpellier</p>

        <h1 className="mt-3 font-serif text-4xl leading-tight tracking-tight text-balance sm:text-5xl">
          Building products at the <em>frontier</em> of the <em>web</em>.
        </h1>

        <p className="mt-6 max-w-xl text-base leading-7 text-pretty text-muted-foreground">
          I design and build products from the first sketch to the thing people open every morning: interfaces
          that feel alive, real-time 3D, and the engineering that keeps them fast.
        </p>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-3 sm:grid sm:w-full sm:max-w-lg sm:grid-cols-2">
          <BookCall className="sm:justify-self-end" />
          <Button asChild variant="outline" size="lg" className="h-11 rounded-xl px-4 sm:justify-self-start">
            <a href="#work">Explore my work</a>
          </Button>
        </div>

        <Clients clients={clients} className="mt-10" />
      </div>

      <HatchBand className="lg:col-start-5" />
    </section>
  );
}
