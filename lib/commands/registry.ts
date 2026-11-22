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
  LanguageCircleIcon,
  Linkedin01Icon,
  Mail01Icon,
  Moon02Icon,
  NewTwitterIcon,
  News01Icon,
  PaintBoardIcon,
} from '@hugeicons/core-free-icons';
import type { Messages } from 'next-intl';

import siteConfig from '@/config/site';
import { announce } from '@/hooks/use-island-store';
import { usePresenceStore } from '@/hooks/use-presence-store';
import { otherLocale } from '@/i18n/locales';
import { getPathname } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import { prefersReducedMotion } from '@/lib/motion';
import { presenceAvailable } from '@/lib/presence/availability';
import { openBooking } from '@/lib/services/booking';
import { announceResume, resumeRoute } from '@/lib/services/resume';
import { withThemeTransition } from '@/lib/theme/theme-transition';

import type { Command } from './types';

type Translate = (key: keyof Messages['Commands']) => string;

interface CommandSetup {
  t: Translate;
  locale: Locale;
  switchLanguage: () => void;
}

const { social, email } = siteConfig;

const visit = (url: string) => () => {
  window.open(url, '_blank', 'noopener,noreferrer');
};

const copy = async (text: string, message: string, icon: Command['icon']) => {
  try {
    await navigator.clipboard.writeText(text);
    announce(message, { icon });
  } catch {
    announce(text, { icon });
  }
};

const shortUrl = (url: string) => url.replace(/^https:\/\/(www\.)?/, '').replace(/\/$/, '');
const words = (keywords: string) => keywords.split(' ');

interface Link {
  id: string;
  label: string;
  icon: Command['icon'];
  url: string;
  keywords: string;
  hint?: string;
}

const link = ({ url, hint = shortUrl(url), keywords, ...rest }: Link): Command => ({
  ...rest,
  group: 'Links',
  hint,
  keywords: words(keywords),
  run: visit(url),
});

export function createCommands({ t, locale, switchLanguage }: CommandSetup): Command[] {
  return [
    {
      id: 'book-a-call',
      label: t('bookCall'),
      icon: Calendar01Icon,
      group: 'Contact',
      keywords: words(t('bookCallKeywords')),
      run: ({ resolvedTheme }) => openBooking(resolvedTheme, t('bookingUnreachable')),
    },
    {
      id: 'write-me',
      label: t('writeMe'),
      icon: Mail01Icon,
      group: 'Contact',
      keywords: words(t('writeMeKeywords')),
      hint: email,
      run: () => {
        window.location.href = `mailto:${email}`;
      },
    },
    {
      id: 'copy-email',
      label: t('copyEmail'),
      icon: Copy01Icon,
      group: 'Contact',
      keywords: words(t('copyEmailKeywords')),
      run: () => copy(email, t('emailCopied'), Copy01Icon),
    },
    {
      id: 'resume',
      label: t('resume'),
      icon: Download01Icon,
      group: 'Contact',
      keywords: words(t('resumeKeywords')),
      shortcut: 's',
      run: () => {
        const anchor = document.createElement('a');
        anchor.href = resumeRoute(locale);
        anchor.download = '';
        anchor.click();
        announceResume(t('downloadingResume'));
      },
    },
    {
      id: 'toggle-theme',
      label: t('toggleTheme'),
      icon: Moon02Icon,
      group: 'Tools',
      keywords: words(t('toggleThemeKeywords')),
      shortcut: 'd',
      run: ({ resolvedTheme, setTheme }) =>
        withThemeTransition(() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')),
    },
    {
      id: 'other-language',
      label: t('otherLanguage'),
      lang: otherLocale(locale),
      icon: LanguageCircleIcon,
      group: 'Tools',
      keywords: words(t('otherLanguageKeywords')),
      run: switchLanguage,
    },
    {
      id: 'copy-link',
      label: t('copyLink'),
      icon: CopyLinkIcon,
      group: 'Tools',
      keywords: words(t('copyLinkKeywords')),
      shortcut: 'l',
      run: () => copy(new URL(getPathname({ href: '/', locale }), siteConfig.url).href, t('linkCopied'), CopyLinkIcon),
    },
    {
      id: 'toggle-cursors',
      label: t('cursors'),
      icon: Cursor01Icon,
      group: 'Tools',
      keywords: words(t('cursorsKeywords')),
      status: () => (usePresenceStore.getState().hidden ? t('cursorsOff') : t('cursorsOn')),
      available: presenceAvailable,
      run: () =>
        announce(usePresenceStore.getState().toggle() ? t('cursorsHidden') : t('cursorsShown'), { icon: Cursor01Icon }),
    },
    {
      id: 'go-to-top',
      label: t('goToTop'),
      icon: ArrowUp01Icon,
      group: 'Tools',
      keywords: words(t('goToTopKeywords')),
      shortcut: 'ArrowUp',
      run: () => window.scrollTo({ top: 0, behavior: prefersReducedMotion() ? 'auto' : 'smooth' }),
    },
    link({ id: 'blog', label: t('blog'), icon: News01Icon, url: siteConfig.blogUrl, keywords: t('blogKeywords') }),
    link({ id: 'github', label: 'GitHub', icon: Github01Icon, url: social.github, keywords: t('githubKeywords') }),
    link({ id: 'x', label: 'X', icon: NewTwitterIcon, url: social.x, keywords: t('xKeywords') }),
    link({
      id: 'bluesky',
      label: 'Bluesky',
      icon: BlueskyIcon,
      url: social.bluesky,
      hint: 'lenysauzet.bsky.social',
      keywords: t('blueskyKeywords'),
    }),
    link({
      id: 'linkedin',
      label: 'LinkedIn',
      icon: Linkedin01Icon,
      url: social.linkedin,
      keywords: t('linkedinKeywords'),
    }),
    link({
      id: 'roadmap',
      label: t('roadmap'),
      icon: PaintBoardIcon,
      url: social.roadmap,
      hint: 'figma.com',
      keywords: t('roadmapKeywords'),
    }),
    link({
      id: 'support',
      label: t('support'),
      icon: Coffee01Icon,
      url: social.support,
      keywords: t('supportKeywords'),
    }),
  ];
}
