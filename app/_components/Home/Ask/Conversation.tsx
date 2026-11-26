'use client';

import { ArrowDown02Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { animate, AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useTranslations } from 'next-intl';
import {
  Fragment,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type MouseEvent,
  type RefObject,
} from 'react';

import { AnimatedCloseIcon } from '@/components/icons/AnimatedCloseIcon';
import { AnimatedRefreshIcon } from '@/components/icons/AnimatedRefreshIcon';
import { useAnimatedIcon } from '@/hooks/use-animated-icon';
import { isThinking, textOf, turnsOf, type Message, type Status } from '@/lib/ask/conversation';
import { EASE_SNAP } from '@/lib/motion';
import { cn } from '@/lib/utils';

import { Arrival } from './Fit';
import { AssistantMessage, UserMessage } from './Messages';
import { Orb } from './Orb';
import { glass, glassButton, quietButton } from './styles';

const STICKS_WITHIN = 2;
const AWAY_BEYOND = 48;
const FADE = '72px';

const byKeyboard = (event: MouseEvent) => event.detail === 0;

interface ConversationProps {
  messages: Message[];
  status: Status;
  avatarRef: RefObject<HTMLSpanElement | null>;
  onRestart: () => void;
  onRetry: () => void;
  onClose: (byKeyboard: boolean) => void;
}

export function Conversation({ messages, status, avatarRef, onRestart, onRetry, onClose }: ConversationProps) {
  const t = useTranslations('Ask');
  const log = useRef<HTMLDivElement>(null);
  const content = useRef<HTMLDivElement>(null);
  const stick = useRef(true);
  const glide = useRef<ReturnType<typeof animate> | null>(null);
  const [away, setAway] = useState(false);
  const still = useReducedMotion();
  const turns = useMemo(() => turnsOf(messages), [messages]);
  const thinking = isThinking(messages, status);
  const failed = status === 'error';
  const latest = turns.at(-1)?.answer;
  const announcement = thinking
    ? t('thinking')
    : failed
      ? t('error')
      : status === 'ready' && latest
        ? textOf(latest)
        : '';

  useEffect(() => {
    stick.current = true;
  }, [turns.length]);

  useEffect(() => {
    const element = log.current;
    const inner = content.current;
    if (!element || !inner) return;
    const pin = () => {
      if (stick.current) element.scrollTop = element.scrollHeight;
    };
    const resized = new ResizeObserver(pin);
    resized.observe(inner);
    resized.observe(element);
    return () => resized.disconnect();
  }, []);

  const leave = () => {
    glide.current?.stop();
    stick.current = false;
  };

  const toLatest = (event: MouseEvent) => {
    const element = log.current;
    if (!element) return;
    if (byKeyboard(event)) element.focus({ preventScroll: true });
    glide.current?.stop();
    glide.current = animate(element.scrollTop, element.scrollHeight - element.clientHeight, {
      duration: still ? 0 : 0.6,
      ease: EASE_SNAP,
      onUpdate: (top) => {
        element.scrollTop = top;
      },
      onComplete: () => {
        stick.current = true;
      },
    });
  };

  return (
    <section aria-label={t('conversation')}>
      <header className="flex items-center gap-3 py-3 pr-3 pl-4">
        <Orb count={1} size={56} className="-my-2.5 -ml-2" />
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="text-sm leading-5 text-foreground">{t('title')}</span>
          <span className="truncate text-xs leading-4 text-subtle-foreground">{t('subtitle')}</span>
        </span>
        <HeaderButton label={t('newChat')} icon={AnimatedRefreshIcon} onClick={onRestart} />
        <HeaderButton label={t('close')} icon={AnimatedCloseIcon} onClick={(event) => onClose(byKeyboard(event))} />
      </header>
      <div className="relative rounded-2xl has-[[role=log]:focus-visible]:ring-2 has-[[role=log]:focus-visible]:ring-primary has-[[role=log]:focus-visible]:ring-inset">
        <div
          ref={log}
          role="log"
          aria-live="off"
          tabIndex={0}
          onScroll={(event) => {
            const element = event.currentTarget;
            const left = element.scrollHeight - element.scrollTop - element.clientHeight;
            if (left < STICKS_WITHIN) stick.current = true;
            setAway(left > AWAY_BEYOND);
          }}
          onWheel={(event) => {
            if (event.deltaY < 0) leave();
          }}
          onTouchMove={leave}
          onKeyDown={(event) => {
            if (['ArrowUp', 'PageUp', 'Home'].includes(event.key)) leave();
          }}
          className="flex max-h-[min(55vh,28rem)] flex-col overflow-y-auto px-5 pt-3 pb-9 outline-hidden transition-[--fade] duration-300 [scrollbar-width:none] [mask-image:linear-gradient(to_bottom,transparent,black_1rem,black_calc(100%-var(--fade)),transparent)]"
          style={{ '--fade': away ? FADE : '0px' } as CSSProperties}
        >
          <div ref={content} className="flex flex-col">
            {turns.map(({ question, answer }, index) => {
              const last = index === turns.length - 1;
              const pending = last && (thinking || failed);
              return (
                <Fragment key={question.id}>
                  <Arrival className={cn('items-end', index > 0 && 'pt-2')}>
                    <UserMessage message={question} />
                  </Arrival>
                  {(answer || pending) && (
                    <Arrival delay={0.12} className="pt-5 pb-3">
                      <AssistantMessage
                        message={answer}
                        thinking={last && thinking}
                        done={!last || status === 'ready'}
                        onRetry={last && failed ? onRetry : undefined}
                        avatarRef={last ? avatarRef : undefined}
                      />
                    </Arrival>
                  )}
                </Fragment>
              );
            })}
          </div>
        </div>
        <p role="status" className="sr-only">
          {announcement}
        </p>
        <AnimatePresence>
          {away && (
            <motion.button
              type="button"
              aria-label={t('latest')}
              title={t('latest')}
              onClick={toLatest}
              initial={{ opacity: 0, scale: 0.7, filter: 'blur(4px)' }}
              animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
              exit={{ opacity: 0, scale: 0.7, filter: 'blur(4px)' }}
              transition={{ duration: 0.2 }}
              style={glass('12px')}
              className={cn(
                'absolute bottom-3 left-1/2 grid size-8 -translate-x-1/2 place-items-center rounded-full bg-card/80',
                glassButton
              )}
            >
              <HugeiconsIcon icon={ArrowDown02Icon} size={16} strokeWidth={2} />
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}

interface HeaderButtonProps {
  label: string;
  icon: typeof AnimatedCloseIcon;
  onClick: (event: MouseEvent) => void;
}

function HeaderButton({ label, icon: Icon, onClick }: HeaderButtonProps) {
  const { icon, trigger } = useAnimatedIcon();

  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      {...trigger}
      className={cn('size-8', quietButton)}
    >
      <Icon ref={icon} className="size-[17px]" />
    </button>
  );
}
