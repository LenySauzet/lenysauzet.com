import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import localFont from 'next/font/local';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

const signature = localFont({
  src: './fonts/Signature-December.otf',
  display: 'swap',
  variable: '--font-signature',
});

export const metadata: Metadata = {
  title: "The online home of Lény's work",
  description:
    "I'm Lény, a innovation engineer based in Montpellier. Welcome to my corner of the Internet, where I showcase my work, craft, unfinished or imperfect projects.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${signature.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
