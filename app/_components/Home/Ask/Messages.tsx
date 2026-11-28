'use client';

import {
  Calendar03Icon,
  Download01Icon,
  File01Icon,
  Mail01Icon,
  RefreshIcon,
  Tick02Icon,
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { AnimatePresence, motion } from 'motion/react';
import { useTranslations } from 'next-intl';
import { memo, useEffect, useMemo, useState, type Ref } from 'react';

import { AnimatedCopyIcon } from '@/components/icons/AnimatedCopyIcon';
import { focusRing } from '@/components/shared/styles';
import siteConfig from '@/config/site';
import { useAnimatedIcon } from '@/hooks/use-animated-icon';
import { useBooking } from '@/hooks/use-booking';
import { useResumeAnchor } from '@/hooks/use-resume-anchor';
import {
  actionOf,
  isExternal,
  labelOf,
  remediesOf,
  sourcesOf,
  textOf,
  wordsOf,
  type Failure,
  type Message,
  type Step,
} from '@/lib/ask/conversation';
import { blurred, EASE_SNAP, sharp } from '@/lib/motion';
import { cn } from '@/lib/utils';

import { Letters } from './Letters';
import { MORPH, REVEAL } from './motion';
import { Orb } from './Orb';
import { BUBBLE_RIM, glassButton, quietButton, SHIMMER_TEXT } from './styles';

const CLUSTER_EVERY_MS = 1400;
const COPIED_FOR_MS = 1600;
const SPIN = 0.55;

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
  thinking: boolean;
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
  thinking,
  step,
  done,
  failure,
  stopped,
  onRetry,
  avatarRef,
  className,
}: AssistantMessageProps) {
  const t = useTranslations('Ask');
  const [clustered, setClustered] = useState(false);

  useEffect(() => {
    if (!thinking) return;
    const flip = window.setInterval(() => setClustered((current) => !current), CLUSTER_EVERY_MS);
    return () => window.clearInterval(flip);
  }, [thinking]);

  return (
    <div className={cn('flex items-start gap-3', className)}>
      <span ref={avatarRef} className="relative -mt-2.5 -ml-1 size-11 shrink-0">
        <motion.span
          className="absolute top-1/2 left-1/2 -translate-1/2"
          initial={{ scale: 0.4, x: 12, ...blurred(8) }}
          animate={{ scale: thinking ? 1 : 0.75, x: thinking ? 12 : 0, ...sharp }}
          transition={{ ...MORPH, opacity: REVEAL, filter: { duration: 0.45 } }}
        >
          <Orb count={thinking ? (clustered ? 4 : 2) : 1} spin={thinking ? SPIN : 0} size={64} />
        </motion.span>
      </span>
      <AnimatePresence mode="wait" initial={false}>
        {thinking ? (
          <motion.span
            key={step ?? 'thinking'}
            className="shimmer pt-1 pl-7 text-sm"
            style={SHIMMER_TEXT}
            exit={{ opacity: 0, filter: 'blur(6px)', x: -4, transition: { duration: 0.2 } }}
          >
            <Letters text={t(step ? `steps.${step}` : 'thinking')} delay={0.18} stagger={0.03} />
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
  const text = message ? textOf(message) : '';
  const words = useMemo(() => wordsOf(text), [text]);

  return (
    <div className="flex min-w-0 flex-col pt-0.5">
      {text && (
        <p className="text-sm leading-relaxed text-foreground/90">
          {words.map((word, index) => (
            <motion.span key={index} initial={blurred(4)} animate={sharp} transition={{ duration: 0.4 }}>
              {word}
            </motion.span>
          ))}
        </p>
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
          message && (
            <motion.div
              key="extras"
              {...EXTRAS}
              transition={{ duration: 0.4, delay: 0.08, ease: EASE_SNAP }}
              className="flex flex-col items-start gap-2.5 pt-3"
            >
              <Action message={message} />
              <div className="-ml-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
                <CopyButton text={text} />
                {sourcesOf(message).map((source) => (
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

function CopyButton({ text }: { text: string }) {
  const t = useTranslations('Ask');
  const { icon, trigger } = useAnimatedIcon();
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

  const label = copied ? t('copied') : t('copy');

  return (
    <button
      type="button"
      aria-label={t('copy')}
      title={label}
      {...trigger}
      onClick={copy}
      className={cn('size-7', quietButton)}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={copied ? 'copied' : 'copy'}
          initial={{ opacity: 0, scale: 0.6, filter: 'blur(3px)' }}
          animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
          exit={{ opacity: 0, scale: 0.6, filter: 'blur(3px)' }}
          transition={{ duration: 0.16 }}
          className="grid place-items-center"
        >
          {copied ? (
            <HugeiconsIcon icon={Tick02Icon} size={15} strokeWidth={2} />
          ) : (
            <AnimatedCopyIcon ref={icon} className="size-[15px]" />
          )}
        </motion.span>
      </AnimatePresence>
      <span aria-live="polite" className="sr-only">
        {copied ? t('copied') : ''}
      </span>
    </button>
  );
}
