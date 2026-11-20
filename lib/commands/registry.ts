import {
  ArrowUp01Icon,
  BlueskyIcon,
  Calendar01Icon,
  Coffee01Icon,
  Copy01Icon,
  CopyLinkIcon,
  Download01Icon,
  Github01Icon,
  Linkedin01Icon,
  Mail01Icon,
  Moon02Icon,
  NewTwitterIcon,
  News01Icon,
  PaintBoardIcon,
} from '@hugeicons/core-free-icons';

import { announce } from '@/app/_components/Island';
import siteConfig from '@/config/site';
import { openBooking } from '@/lib/services/booking';

import type { Command } from './types';

const RESUME_ROUTE = '/resume';

const { social, email } = siteConfig;

const visit = (url: string) => () => {
  window.open(url, '_blank', 'noopener,noreferrer');
};

const copy = async (text: string, message: string, icon: Command['icon']) => {
  try {
    await navigator.clipboard.writeText(text);
    announce(message, icon);
  } catch {
    announce(text, icon);
  }
};

const stillOrSmooth = (): ScrollBehavior =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';

const link = (
  id: string,
  label: string,
  icon: Command['icon'],
  url: string,
  hint: string,
  keywords: string[]
): Command => ({ id, label, icon, group: 'Links', keywords, hint, run: visit(url) });

export const commands: Command[] = [
  {
    id: 'book-a-call',
    label: 'Book a call',
    icon: Calendar01Icon,
    group: 'Contact',
    keywords: ['meeting', 'cal', 'hire', 'talk'],
    run: ({ resolvedTheme }) => openBooking(resolvedTheme),
  },
  {
    id: 'write-me',
    label: 'Write me',
    icon: Mail01Icon,
    group: 'Contact',
    keywords: ['email', 'mail', 'contact'],
    hint: email,
    run: () => {
      window.location.href = `mailto:${email}`;
    },
  },
  {
    id: 'copy-email',
    label: 'Copy email',
    icon: Copy01Icon,
    group: 'Contact',
    keywords: ['email', 'mail', 'address'],
    run: () => copy(email, 'Email copied', Copy01Icon),
  },
  {
    id: 'resume',
    label: 'Download resume',
    icon: Download01Icon,
    group: 'Contact',
    keywords: ['cv', 'hire', 'pdf'],
    shortcut: 's',
    run: () => {
      const anchor = document.createElement('a');
      anchor.href = RESUME_ROUTE;
      anchor.download = '';
      anchor.click();
      announce('Downloading my resume', Download01Icon);
    },
  },
  {
    id: 'toggle-theme',
    label: 'Toggle theme',
    icon: Moon02Icon,
    group: 'Tools',
    keywords: ['dark', 'light', 'mode'],
    shortcut: 'd',
    run: ({ resolvedTheme, setTheme }) => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark'),
  },
  {
    id: 'copy-link',
    label: 'Copy link',
    icon: CopyLinkIcon,
    group: 'Tools',
    keywords: ['url', 'share'],
    shortcut: 'l',
    run: () => copy(siteConfig.url, 'Link copied', CopyLinkIcon),
  },
  {
    id: 'go-to-top',
    label: 'Go to top',
    icon: ArrowUp01Icon,
    group: 'Tools',
    keywords: ['scroll', 'beginning'],
    shortcut: 'ArrowUp',
    run: () => window.scrollTo({ top: 0, behavior: stillOrSmooth() }),
  },
  link('blog', 'Blog', News01Icon, siteConfig.blogUrl, 'blog.lenysauzet.com', ['articles', 'writing', 'posts']),
  link('github', 'GitHub', Github01Icon, social.github, 'github.com/LenySauzet', ['code', 'source']),
  link('x', 'X', NewTwitterIcon, social.x, 'x.com/LenySauzet', ['twitter', 'social']),
  link('bluesky', 'Bluesky', BlueskyIcon, social.bluesky, 'lenysauzet.bsky.social', ['social', 'bsky']),
  link('linkedin', 'LinkedIn', Linkedin01Icon, social.linkedin, 'linkedin.com/in/lenysauzet', ['social', 'work']),
  link('roadmap', 'Roadmap', PaintBoardIcon, social.roadmap, 'figma.com', ['figma', 'plans', 'next']),
  link('support', 'Support me', Coffee01Icon, social.support, 'buymeacoffee.com/lenysauzet', ['donate', 'coffee', 'sponsor']),
];
