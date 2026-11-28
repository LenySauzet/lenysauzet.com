'use client';

import {
  Calendar03Icon,
  Copy01Icon,
  Download01Icon,
  File01Icon,
  Mail01Icon,
  RefreshIcon,
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useTranslations } from 'next-intl';
import { memo, useEffect, useState, type Ref } from 'react';
import { Streamdown, type Components } from 'streamdown';

import { focusRing } from '@/components/shared/styles';
import siteConfig from '@/config/site';
import { useBooking } from '@/hooks/use-booking';
import { useResumeAnchor } from '@/hooks/use-resume-anchor';
import {
  actionOf,
  isExternal,
  labelOf,
  remediesOf,
  sourcesOf,
  textOf,
  type Failure,
  type Message,
  type Step,
} from '@/lib/ask/conversation';
import { blurred, EASE_SNAP, sharp } from '@/lib/motion';
import { cn } from '@/lib/utils';

import { Letters } from './Letters';
import { MORPH, REVEAL } from './motion';
import { Orb } from './Orb';
import { BUBBLE_RIM, glassButton, SHIMMER_TEXT } from './styles';

const COPIED_FOR_MS = 1600;

export type Activity = 'thinking' | 'reading' | 'writing' | 'idle';

const ORB: Record<Activity, { count: 1 | 2 | 4; spin: number; scale: number; x: number }> = {
  thinking: { count: 2, spin: 0.55, scale: 1, x: 12 },
  reading: { count: 4, spin: 0.8, scale: 1, x: 12 },
  writing: { count: 1, spin: 0.35, scale: 0.8, x: 0 },
  idle: { count: 1, spin: 0, scale: 0.75, x: 0 },
};

const SWAP = {
  initial: { opacity: 0, scale: 0.6, filter: 'blur(4px)' },
  animate: { opacity: 1, scale: 1, filter: 'blur(0px)', transitionEnd: { filter: 'none' } },
  exit: { opacity: 0, scale: 0.6, filter: 'blur(4px)' },
  transition: { duration: 0.18, ease: EASE_SNAP },
};

const LABEL = {
  initial: { opacity: 0, filter: 'blur(6px)', x: 6 },
  animate: { opacity: 1, filter: 'blur(0px)', x: 0, transitionEnd: { filter: 'none' } },
  exit: { opacity: 0, filter: 'blur(6px)', x: -6, transition: { duration: 0.2 } },
  transition: { duration: 0.35, ease: EASE_SNAP },
};

const PROSE = 'text-sm leading-relaxed text-foreground/90';

const MARKDOWN: Components = {
  p: ({ children }) => <p className={cn(PROSE, '[&+*]:mt-3')}>{children}</p>,
  strong: ({ children }) => <strong className="font-medium text-foreground">{children}</strong>,
  em: ({ children }) => <em className="italic">{children}</em>,
  ul: ({ children }) => (
    <ul className={cn(PROSE, 'my-3 flex list-disc flex-col gap-1.5 pl-5 marker:text-subtle-foreground')}>{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className={cn(PROSE, 'my-3 flex list-decimal flex-col gap-1.5 pl-5 marker:text-subtle-foreground')}>
      {children}
    </ol>
  ),
  li: ({ children }) => <li className="pl-1">{children}</li>,
};

export const UserMessage = memo(function UserMessage({ message, className }: { message: Message; className?: string }) {
  return (
    <p
      className={cn(
        'relative max-w-[85%] rounded-2xl rounded-br-md bg-foreground/[0.06] px-4 py-2.5 text-sm leading-relaxed text-foreground shadow-[inset_0_1px_0_oklch(from_var(--glare)_l_c_h/0.04)]',
        className
      )}
    >
      {textOf(message)}
      <span aria-hidden className="pointer-events-none absolute inset-0 rounded-[inherit] p-px" style={BUBBLE_RIM} />
    </p>
  );
});

interface AssistantMessageProps {
  message?: Message;
  activity: Activity;
  step?: Step;
  done: boolean;
  failure?: Failure;
  stopped?: boolean;
  onRetry?: () => void;
  avatarRef?: Ref<HTMLSpanElement>;
  className?: string;
}

export const AssistantMessage = memo(function AssistantMessage({
  message,
  activity,
  step,
  done,
  failure,
  stopped,
  onRetry,
  avatarRef,
  className,
}: AssistantMessageProps) {
  const t = useTranslations('Ask');
  const orb = ORB[activity];
  const thinking = activity === 'thinking' || activity === 'reading';
  const label = t(step ? `steps.${step}` : 'thinking');

  return (
    <div className={cn('flex items-start gap-3', className)}>
      <span ref={avatarRef} className="relative -mt-2.5 -ml-1 size-11 shrink-0">
        <motion.span
          className="absolute top-1/2 left-1/2 -translate-1/2"
          initial={{ scale: 0.4, x: 12, ...blurred(8) }}
          animate={{ scale: orb.scale, x: orb.x, ...sharp }}
          transition={{ ...MORPH, opacity: REVEAL, filter: { duration: 0.45 } }}
        >
          <Orb count={orb.count} spin={orb.spin} size={64} />
        </motion.span>
      </span>
      <AnimatePresence mode="wait" initial={false}>
        {thinking ? (
          <motion.span
            key="thinking"
            className="relative pt-1 pl-7 text-sm"
            exit={{ opacity: 0, filter: 'blur(6px)', x: -4, transition: { duration: 0.2 } }}
          >
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.span key={label} className="shimmer inline-block" style={SHIMMER_TEXT} {...LABEL}>
                <Letters text={label} delay={0.18} stagger={0.03} />
              </motion.span>
            </AnimatePresence>
          </motion.span>
        ) : (
          <Answer key="answer" message={message} done={done} failure={failure} stopped={stopped} onRetry={onRetry} />
        )}
      </AnimatePresence>
    </div>
  );
});

const EXTRAS = { initial: { ...blurred(8), y: 4 }, animate: { ...sharp, y: 0 } };

interface AnswerProps {
  message?: Message;
  done: boolean;
  failure?: Failure;
  stopped?: boolean;
  onRetry?: () => void;
}

function Answer({ message, done, failure, stopped, onRetry }: AnswerProps) {
  const t = useTranslations('Ask');
  const still = useReducedMotion();
  const text = message ? textOf(message) : '';

  return (
    <div className="flex min-w-0 flex-col pt-0.5">
      {text && (
        <Streamdown
          mode={done ? 'static' : 'streaming'}
          components={MARKDOWN}
          animated={still ? false : { animation: 'blurIn', sep: 'word', duration: 400 }}
          isAnimating={!done}
          controls={false}
        >
          {text}
        </Streamdown>
      )}
      <AnimatePresence>
        {failure || stopped ? (
          <motion.div
            key="failed"
            {...EXTRAS}
            transition={{ duration: 0.4, ease: EASE_SNAP }}
            className={cn('flex flex-col items-start gap-2.5', text && 'pt-3')}
          >
            <p className="text-sm leading-relaxed text-subtle-foreground">
              {failure ? t(`errors.${failure}`) : t('stopped')}
            </p>
            <Remedies {...(failure ? remediesOf(failure) : { retry: true, contact: false })} onRetry={onRetry} />
          </motion.div>
        ) : (
          done &&
          text && (
            <motion.div
              key="extras"
              {...EXTRAS}
              transition={{ duration: 0.4, delay: 0.08, ease: EASE_SNAP }}
              className="flex flex-col items-start gap-2.5 pt-3"
            >
              <Action message={message!} />
              <div className="-ml-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
                <CopyButton text={text} />
                {sourcesOf(message!).map((source) => (
                  <a
                    key={source.sourceId}
                    href={source.url}
                    {...(isExternal(source) && { target: '_blank', rel: 'noopener noreferrer' })}
                    className={cn(
                      'inline-flex items-center gap-1 rounded-sm text-xs text-subtle-foreground transition-colors hover:text-foreground',
                      focusRing
                    )}
                  >
                    <HugeiconsIcon icon={File01Icon} size={12} strokeWidth={2} />
                    {labelOf(source)}
                  </a>
                ))}
              </div>
            </motion.div>
          )
        )}
      </AnimatePresence>
    </div>
  );
}

interface RemediesProps {
  retry: boolean;
  contact: boolean;
  onRetry?: () => void;
  className?: string;
}

function Remedies({ retry, contact, onRetry, className }: RemediesProps) {
  const t = useTranslations('Ask');
  const commands = useTranslations('Commands');
  const book = useBooking();
  if (!(retry && onRetry) && !contact) return null;

  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      {retry && onRetry && (
        <button type="button" onClick={onRetry} className={ACTION}>
          <HugeiconsIcon icon={RefreshIcon} size={13} strokeWidth={2} />
          {t('retry')}
        </button>
      )}
      {contact && (
        <>
          <button type="button" onClick={book} className={ACTION}>
            <HugeiconsIcon icon={Calendar03Icon} size={13} strokeWidth={2} />
            {commands('bookCall')}
          </button>
          <a href={`mailto:${siteConfig.email}`} className={ACTION}>
            <HugeiconsIcon icon={Mail01Icon} size={13} strokeWidth={2} />
            {t('email')}
          </a>
        </>
      )}
    </div>
  );
}

const ACTION = cn('inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium', glassButton);

function Action({ message }: { message: Message }) {
  const t = useTranslations('Commands');
  const book = useBooking();
  const resume = useResumeAnchor();
  const action = actionOf(message);

  if (action === 'book') {
    return (
      <button type="button" onClick={book} className={ACTION}>
        <HugeiconsIcon icon={Calendar03Icon} size={13} strokeWidth={2} />
        {t('bookCall')}
      </button>
    );
  }
  if (action === 'resume') {
    return (
      <a {...resume} className={ACTION}>
        <HugeiconsIcon icon={Download01Icon} size={13} strokeWidth={2} />
        {t('resume')}
      </a>
    );
  }
  return null;
}

function Check({ className }: { className?: string }) {
  const still = useReducedMotion();
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <motion.path
        d="M5 12.5 9.5 17 19 7"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: still ? 1 : 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.35, delay: 0.06, ease: EASE_SNAP }}
      />
    </svg>
  );
}

function CopyButton({ text, className }: { text: string; className?: string }) {
  const t = useTranslations('Ask');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const reset = window.setTimeout(() => setCopied(false), COPIED_FOR_MS);
    return () => window.clearTimeout(reset);
  }, [copied]);

  const copy = () =>
    navigator.clipboard?.writeText(text).then(
      () => setCopied(true),
      () => setCopied(false)
    );

  return (
    <button
      type="button"
      aria-label={t('copy')}
      title={copied ? t('copied') : t('copy')}
      onClick={copy}
      className={cn(
        'grid size-7 cursor-pointer place-items-center rounded-full text-subtle-foreground transition-colors hover:text-foreground',
        focusRing,
        className
      )}
    >
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span key={copied ? 'copied' : 'copy'} className="grid place-items-center" {...SWAP}>
          {copied ? (
            <Check className="size-[15px] text-foreground" />
          ) : (
            <HugeiconsIcon icon={Copy01Icon} size={15} strokeWidth={1.8} />
          )}
        </motion.span>
      </AnimatePresence>
      <span aria-live="polite" className="sr-only">
        {copied ? t('copied') : ''}
      </span>
    </button>
  );
}
