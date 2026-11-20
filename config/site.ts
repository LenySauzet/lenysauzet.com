import type { Metadata } from 'next';

const url = 'https://lenysauzet.com';
const blogUrl = 'https://blog.lenysauzet.com';
const cdnUrl = 'https://cdn.lenysauzet.com';
const email = 'contact@lenysauzet.com';

const author = {
  name: 'Lény Sauzet',
  firstName: 'Leny',
  role: 'AI & Software Engineer',
  location: 'Montpellier',
};

const title = `${author.name} · ${author.role}`;

const description =
  "I'm Lény, an AI and software engineer based in Montpellier. I turn complex challenges into delightful user experiences and high-performance products.";

const social = {
  github: 'https://github.com/LenySauzet',
  x: 'https://x.com/LenySauzet',
  bluesky: 'https://bsky.app/profile/lenysauzet.bsky.social',
  linkedin: 'https://www.linkedin.com/in/lenysauzet/',
  roadmap: 'https://www.figma.com/board/CCTdvk3lomDhgiCsQu9hlb/Leny-s-Public-Roadmap',
  support: 'https://buymeacoffee.com/lenysauzet',
};

const siteConfig = {
  url,
  blogUrl,
  cdnUrl,
  email,
  author,
  title,
  description,
  social,
  calHandle: 'lenysauzet',
  resumeUrl: `${cdnUrl}/files/Leny-Sauzet-Resume.pdf`,
};

export default siteConfig;

export const rootMetadata: Metadata = {
  metadataBase: new URL(url),
  title: { default: title, template: `%s · ${author.name}` },
  description,
  applicationName: author.name,
  authors: [{ name: author.name, url }],
  creator: author.name,
  alternates: { canonical: '/' },
  openGraph: { type: 'website', url, title, description, siteName: author.name, locale: 'en_US' },
  twitter: { card: 'summary_large_image', title, description, creator: '@LenySauzet' },
  robots: { index: true, follow: true },
};
