import { Geist, Instrument_Serif } from 'next/font/google';
import localFont from 'next/font/local';

const geist = Geist({ variable: '--font-display', subsets: ['latin'] });

const instrument = Instrument_Serif({
  variable: '--font-serif',
  subsets: ['latin'],
  weight: '400',
  style: ['normal', 'italic'],
});

const departureMono = localFont({
  src: '../../public/fonts/DepartureMono-Regular.woff2',
  variable: '--font-mono',
});

export const bodyClassName = `${geist.variable} ${instrument.variable} ${departureMono.variable} font-display antialiased selection:bg-primary/10 selection:text-primary`;
