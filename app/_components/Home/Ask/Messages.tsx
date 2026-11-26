'use client';

import { Calendar03Icon, Download01Icon, File01Icon, Tick02Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { AnimatePresence, motion } from 'motion/react';
import { useTranslations } from 'next-intl';
import { useEffect, useState, type Ref } from 'react';

import { AnimatedCopyIcon } from '@/components/icons/AnimatedCopyIcon';
import { focusRing } from '@/components/shared/styles';
import { useAnimatedIcon } from '@/hooks/use-animated-icon';
import { useBooking } from '@/hooks/use-booking';
import { useResumeAnchor } from '@/hooks/use-resume-anchor';
import { actionOf, sourcesOf, textOf, type Message } from '@/lib/ask/conversation';
import { wordsOf } from '@/lib/ask/demo';
import { EASE_SNAP } from '@/lib/motion';
import { cn } from '@/lib/utils';

import { Letters } from './Letters';
import { BLURRED, MORPH, SHARP } from './motion';
import { Orb } from './Orb';
import { BUBBLE_RIM, glassButton, quietButton, SHIMMER_TEXT } from './styles';

const CLUSTER_EVERY_MS = 1400;
const COPIED_FOR_MS = 1600;

export function UserMessage({ message }: { message: Message }) {
  return (
    <p className="relative max-w-[85%] rounded-2xl rounded-br-md bg-foreground/[0.06] px-4 py-2.5 text-sm leading-relaxed text-foreground shadow-[inset_0_1px_0_oklch(from_var(--glare)_l_c_h/0.04)]">
      {textOf(message)}
      <span aria-hidden className="pointer-events-none absolute inset-0 rounded-[inherit] p-px" style={BUBBLE_RIM} />
    </p>
  );
}

interface AssistantMessageProps {
  message: Message;
  thinking: boolean;
  done: boolean;
  avatarRef?: Ref<HTMLSpanElement>;
}

export function AssistantMessage({ message, thinking, done, avatarRef }: AssistantMessageProps) {
  const t = useTranslations('Ask');
  const [clustered, setClustered] = useState(false);

  useEffect(() => {
    if (!thinking) return;
    const flip = window.setInterval(() => setClustered((current) => !current), CLUSTER_EVERY_MS);
    return () => window.clearInterval(flip);
  }, [thinking]);

  return (
    <div className="flex items-start gap-3">
      <span ref={avatarRef} className="relative -mt-2.5 -ml-1 size-11 shrink-0">
        <motion.span
          className="absolute top-1/2 left-1/2 -translate-1/2"
          initial={{ scale: 0.4, x: 12, opacity: 0, filter: 'blur(8px)' }}
          animate={{ scale: thinking ? 1 : 0.75, x: thinking ? 12 : 0, ...SHARP }}
          transition={{ ...MORPH, opacity: { duration: 0.35 }, filter: { duration: 0.45 } }}
        >
          <Orb count={thinking ? (clustered ? 4 : 2) : 1} spin={thinking} size={64} />
        </motion.span>
      </span>
      <AnimatePresence mode="wait" initial={false}>
        {thinking ? (
          <motion.span
            key="thinking"
            className="shimmer pt-1 pl-7 text-sm"
            style={SHIMMER_TEXT}
            exit={{ opacity: 0, filter: 'blur(6px)', x: -4, transition: { duration: 0.2 } }}
          >
            <Letters text={t('thinking')} delay={0.18} step={0.03} />
          </motion.span>
        ) : (
          <Answer key="answer" message={message} done={done} />
        )}
      </AnimatePresence>
    </div>
  );
}

function Answer({ message, done }: { message: Message; done: boolean }) {
  return (
    <div className="flex min-w-0 flex-col pt-0.5">
      <p className="text-sm leading-relaxed text-foreground/90">
        {wordsOf(textOf(message)).map((word, index) => (
          <motion.span
            key={index}
            initial={{ opacity: 0, filter: 'blur(4px)' }}
            animate={SHARP}
            transition={{ duration: 0.4 }}
          >
            {word}
          </motion.span>
        ))}
      </p>
      <AnimatePresence>
        {done && (
          <motion.div
            initial={{ ...BLURRED, y: 4 }}
            animate={{ ...SHARP, y: 0 }}
            transition={{ duration: 0.4, delay: 0.08, ease: EASE_SNAP }}
            className="flex flex-col items-start gap-2.5 pt-3"
          >
            <Action message={message} />
            <div className="-ml-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
              <CopyButton text={textOf(message)} />
              {sourcesOf(message).map((source) => (
                <a
                  key={source.sourceId}
                  href={source.url}
                  className={cn(
                    'inline-flex items-center gap-1 rounded-sm text-xs text-subtle-foreground transition-colors hover:text-foreground',
                    focusRing
                  )}
                >
                  <HugeiconsIcon icon={File01Icon} size={12} strokeWidth={2} />
                  {source.title}
                </a>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
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

  const label = copied ? t('copied') : t('copy');

  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      {...trigger}
      onClick={() => void navigator.clipboard?.writeText(text).then(() => setCopied(true))}
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
