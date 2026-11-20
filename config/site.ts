const handle = 'LenySauzet';
const url = 'https://lenysauzet.com';
const cdnUrl = 'https://cdn.lenysauzet.com';
const resumeFile = 'Leny-Sauzet-Resume.pdf';

const author = {
  name: 'Lény Sauzet',
  firstName: 'Leny',
  handle,
  role: 'AI & Software Engineer',
  location: 'Montpellier',
  timeZone: 'Europe/Paris',
};

const social = {
  github: `https://github.com/${handle}`,
  linkedin: 'https://www.linkedin.com/in/lenysauzet/',
  x: `https://x.com/${handle}`,
  bluesky: 'https://bsky.app/profile/lenysauzet.bsky.social',
  roadmap: 'https://www.figma.com/board/CCTdvk3lomDhgiCsQu9hlb/Leny-s-Public-Roadmap',
  support: 'https://buymeacoffee.com/lenysauzet',
};

const profiles = [
  { name: 'GitHub', url: social.github },
  { name: 'LinkedIn', url: social.linkedin },
  { name: 'X', url: social.x },
  { name: 'Bluesky', url: social.bluesky },
];

const siteConfig = {
  url,
  blogUrl: 'https://blog.lenysauzet.com',
  cdnUrl,
  repository: `${social.github}/lenysauzet.com`,
  email: 'contact@lenysauzet.com',
  calHandle: 'lenysauzet',
  presenceUrl:
    process.env.NEXT_PUBLIC_PRESENCE_URL ??
    (process.env.NODE_ENV === 'production' ? 'wss://presence.lenysauzet.com' : 'ws://localhost:8787'),
  author,
  social,
  profiles,
  title: `${author.name} · ${author.role}`,
  description:
    "I'm Lény, an AI and software engineer based in Montpellier. I transform complex challenges into delightful user experiences and high-performance solutions, from the models and the architecture to the interface people touch.",
  resume: { file: resumeFile, url: `${cdnUrl}/files/${resumeFile}` },
};

export default siteConfig;
