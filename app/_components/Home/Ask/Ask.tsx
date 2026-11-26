'use client';

import { AnimatePresence, motion, MotionConfig } from 'motion/react';
import { useTranslations } from 'next-intl';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';

import { cn } from '@/lib/utils';

import { Aura, EdgeLight } from './Aura';
import { BAR, Composer } from './Composer';
import { Conversation } from './Conversation';
import { Fit } from './Fit';
import { EASE_FOLD, MORPH, NUDGE, SETTLE } from './motion';
import { Rim } from './Rim';
import { glass } from './styles';
import { Topics } from './Topics';
import { useConversation } from './use-conversation';
import { useWake } from './use-wake';

const CAPSULE = { width: 52, height: 10, drop: 30 };
const PANEL_RADIUS = 26;
const HOVER_GROWTH = 4;
const PRESS_SHRINK = -4;
const FOLD = { duration: 0.32, ease: EASE_FOLD };

export function Ask({ className }: { className?: string }) {
  return (
    <MotionConfig reducedMotion="user">
      <AskBar className={className} />
    </MotionConfig>
  );
}

function AskBar({ className }: { className?: string }) {
  const t = useTranslations('Ask');
  const { messages, status, send, reset } = useConversation();
  const root = useRef<HTMLDivElement>(null);
  const frame = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLTextAreaElement>(null);
  const avatar = useRef<HTMLSpanElement>(null);
  const [draft, setDraft] = useState('');
  const [open, setOpen] = useState(false);
  const [focused, setFocused] = useState(false);
  const [width, setWidth] = useState(0);
  const [pointer, setPointer] = useState<'rest' | 'hover' | 'press'>('rest');

  const expanded = open && messages.length > 0;
  const { phase, written, shineX, glow, writeDelay } = useWake(root, {
    held: focused || draft.length > 0 || expanded,
    focused,
    placeholder: t('placeholder'),
  });
  const wide = phase !== 'tiny';
  const lit = phase === 'lit';
  const thinking = status === 'submitted';
  const nudge =
    !lit || expanded || draft ? 0 : pointer === 'press' ? PRESS_SHRINK : pointer === 'hover' ? HOVER_GROWTH : 0;

  useLayoutEffect(() => {
    const element = root.current;
    if (!element) return;
    const resized = new ResizeObserver(() => setWidth(element.offsetWidth));
    resized.observe(element);
    return () => resized.disconnect();
  }, []);

  useEffect(() => {
    const element = frame.current;
    if (!element) return;
    const publish = () =>
      document.documentElement.style.setProperty(
        '--ask-clearance',
        `${Math.round(window.innerHeight - element.getBoundingClientRect().top)}px`
      );
    const resized = new ResizeObserver(publish);
    resized.observe(element);
    window.addEventListener('resize', publish);
    return () => {
      resized.disconnect();
      window.removeEventListener('resize', publish);
      document.documentElement.style.removeProperty('--ask-clearance');
    };
  }, []);

  useEffect(() => {
    const close = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    window.addEventListener('pointerdown', close);
    return () => window.removeEventListener('pointerdown', close);
  }, []);

  const ask = (question: string) => {
    if (status !== 'ready' || !question.trim()) return;
    send(question);
    setDraft('');
    setOpen(true);
    input.current?.focus();
  };

  const restart = () => {
    reset();
    setOpen(false);
    input.current?.focus();
  };

  return (
    <div
      className={cn(
        'pointer-events-none fixed inset-x-0 bottom-0 z-50 flex justify-center px-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:pb-6 print:hidden',
        className
      )}
    >
      <div
        ref={root}
        data-presence-ignore
        className="pointer-events-auto relative w-full max-w-[30rem]"
        onFocus={() => setFocused(true)}
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false);
        }}
        onKeyDown={(event) => {
          if (event.key !== 'Escape') return;
          setOpen(false);
          input.current?.blur();
        }}
      >
        <div className="flex min-h-11 items-center justify-center">
          <motion.div
            ref={frame}
            initial={{
              width: CAPSULE.width,
              height: CAPSULE.height,
              borderRadius: CAPSULE.height / 2,
              y: CAPSULE.drop,
            }}
            animate={{
              width: wide ? width + nudge : CAPSULE.width,
              y: wide ? 0 : CAPSULE.drop,
              height: lit ? 'auto' : wide ? BAR : CAPSULE.height,
              borderRadius: expanded ? PANEL_RADIUS : wide ? BAR / 2 : CAPSULE.height / 2,
            }}
            transition={{
              width: !wide ? SETTLE : written ? NUDGE : MORPH,
              height: lit ? { duration: 0 } : wide ? MORPH : SETTLE,
              borderRadius: wide ? MORPH : SETTLE,
              y: wide ? MORPH : SETTLE,
            }}
            onPointerEnter={(event) => event.pointerType === 'mouse' && setPointer('hover')}
            onPointerLeave={() => setPointer('rest')}
            onPointerDown={() => setPointer('press')}
            onPointerUp={() => setPointer('hover')}
            onPointerCancel={() => setPointer('rest')}
            className="relative flex shrink-0 flex-col shadow-pill"
          >
            <div
              style={glass('20px')}
              className="relative flex flex-1 flex-col justify-end overflow-hidden rounded-[inherit] bg-card/85"
            >
              <AnimatePresence>
                {expanded && <Aura key="aura" frame={frame} avatar={avatar} thinking={thinking} />}
              </AnimatePresence>
              <AnimatePresence initial={false}>
                {expanded && (
                  <Fit
                    key="conversation"
                    className="relative"
                    fade
                    follow
                    exit={{
                      height: 0,
                      opacity: 0,
                      filter: 'blur(8px)',
                      transition: { ...FOLD, height: { ...FOLD, duration: 0.36 } },
                    }}
                  >
                    <motion.div
                      initial={{ opacity: 0, filter: 'blur(8px)' }}
                      animate={{ opacity: 1, filter: 'blur(0px)', transitionEnd: { filter: 'none' } }}
                      transition={{ duration: 0.35, delay: 0.16 }}
                    >
                      <Conversation
                        messages={messages}
                        status={status}
                        avatarRef={avatar}
                        onRestart={restart}
                        onClose={() => setOpen(false)}
                      />
                    </motion.div>
                  </Fit>
                )}
              </AnimatePresence>
              <Composer
                inputRef={input}
                draft={draft}
                onDraft={setDraft}
                onSend={() => ask(draft)}
                busy={status !== 'ready'}
                lit={lit}
                written={written}
                framed={expanded}
                width={width}
                writeDelay={writeDelay}
                onFocus={() => messages.length > 0 && setOpen(true)}
              />
            </div>
            <AnimatePresence>
              {expanded && thinking && <EdgeLight key="edge" frame={frame} avatar={avatar} />}
            </AnimatePresence>
            <Rim x={shineX} glow={glow} />
          </motion.div>
        </div>
        <AnimatePresence>
          {focused && !expanded && messages.length === 0 && !draft && (
            <Topics onPick={ask} className="absolute inset-x-0 bottom-full mb-2" />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
