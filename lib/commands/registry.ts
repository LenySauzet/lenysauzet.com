import {
  ArrowUp01Icon,
  BlueskyIcon,
  Calendar01Icon,
  Coffee01Icon,
  Copy01Icon,
  CopyLinkIcon,
  Cursor01Icon,
  Download01Icon,
  Github01Icon,
  Linkedin01Icon,
  Mail01Icon,
  Moon02Icon,
  NewTwitterIcon,
  News01Icon,
  PaintBoardIcon,
} from '@hugeicons/core-free-icons';

import siteConfig from '@/config/site';
import { announce } from '@/hooks/use-island-store';
import { usePresenceStore } from '@/hooks/use-presence-store';
import { prefersReducedMotion } from '@/lib/motion';
import { presenceAvailable } from '@/lib/presence/availability';
import { openBooking } from '@/lib/services/booking';
import { announceResume, RESUME_ROUTE } from '@/lib/services/resume';
import { withThemeTransition } from '@/lib/theme/theme-transition';

import type { Command } from './types';

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

const shortUrl = (url: string) => url.replace(/^https:\/\/(www\.)?/, '').replace(/\/$/, '');

interface Link {
  id: string;
  label: string;
  icon: Command['icon'];
  url: string;
  keywords: string[];
  hint?: string;
}

const link = ({ url, hint = shortUrl(url), ...rest }: Link): Command => ({
  ...rest,
  group: 'Links',
  hint,
  run: visit(url),
});

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
      announceResume();
    },
  },
  {
    id: 'toggle-theme',
    label: 'Toggle theme',
    icon: Moon02Icon,
    group: 'Tools',
    keywords: ['dark', 'light', 'mode'],
    shortcut: 'd',
    run: ({ resolvedTheme, setTheme }) =>
      withThemeTransition(() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')),
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
    id: 'toggle-cursors',
    label: 'Live cursors',
    icon: Cursor01Icon,
    group: 'Tools',
    keywords: ['toggle', 'presence', 'visitors', 'others', 'hide', 'show'],
    status: () => (usePresenceStore.getState().hidden ? 'Off' : 'On'),
    available: presenceAvailable,
    run: () => announce(usePresenceStore.getState().toggle() ? 'Cursors hidden' : 'Cursors shown', Cursor01Icon),
  },
  {
    id: 'go-to-top',
    label: 'Go to top',
    icon: ArrowUp01Icon,
    group: 'Tools',
    keywords: ['scroll', 'beginning'],
    shortcut: 'ArrowUp',
    run: () => window.scrollTo({ top: 0, behavior: prefersReducedMotion() ? 'auto' : 'smooth' }),
  },
  link({
    id: 'blog',
    label: 'Blog',
    icon: News01Icon,
    url: siteConfig.blogUrl,
    keywords: ['articles', 'writing', 'posts'],
  }),
  link({ id: 'github', label: 'GitHub', icon: Github01Icon, url: social.github, keywords: ['code', 'source'] }),
  link({ id: 'x', label: 'X', icon: NewTwitterIcon, url: social.x, keywords: ['twitter', 'social'] }),
  link({
    id: 'bluesky',
    label: 'Bluesky',
    icon: BlueskyIcon,
    url: social.bluesky,
    hint: 'lenysauzet.bsky.social',
    keywords: ['social', 'bsky'],
  }),
  link({ id: 'linkedin', label: 'LinkedIn', icon: Linkedin01Icon, url: social.linkedin, keywords: ['social', 'work'] }),
  link({
    id: 'roadmap',
    label: 'Roadmap',
    icon: PaintBoardIcon,
    url: social.roadmap,
    hint: 'figma.com',
    keywords: ['figma', 'plans', 'next'],
  }),
  link({
    id: 'support',
    label: 'Support me',
    icon: Coffee01Icon,
    url: social.support,
    keywords: ['donate', 'coffee', 'sponsor'],
  }),
];
