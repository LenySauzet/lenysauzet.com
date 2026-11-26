'use client';

import { useState } from 'react';

import { Orb } from '../../_components/Ask/Orb';

export function OrbLab() {
  const [count, setCount] = useState<1 | 2 | 4>(2);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-10 bg-background p-10">
      <div className="flex items-center gap-16">
        <Orb count={1} size={220} />
        <Orb count={2} size={220} />
        <Orb count={4} size={220} />
      </div>
      <div className="flex items-center gap-6">
        <Orb count={count} size={220} spin={count > 1} />
        <div className="flex gap-2">
          {([1, 2, 4] as const).map((value) => (
            <button key={value} type="button" className="rounded-full border px-3 py-1" onClick={() => setCount(value)}>
              {value}
            </button>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-6">
        <Orb count={1} size={36} />
        <Orb count={2} size={28} />
        <Orb count={4} size={28} />
      </div>
    </main>
  );
}
