'use client';

import { AnimatePresence, motion, MotionConfig } from 'motion/react';
import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';

import { isBusy, isThinking } from '@/lib/ask/conversation';
import { blurred, sharp } from '@/lib/motion';
import { cn } from '@/lib/utils';

import { Aura, EdgeLight } from './Aura';
import { Composer } from './Composer';
import { Conversation } from './Conversation';
import { Fit } from './Fit';
import { FOLD, MORPH, NUDGE, REVEAL, SETTLE } from './motion';
import { Rim } from './Rim';
import { BAR, glass, PANEL_RADIUS } from './styles';
import { Topics } from './Topics';
import { useConversation } from './use-conversation';
import { useWake } from './use-wake';

const CAPSULE = { width: 52, height: 10, drop: 30 };
const HOVER_GROWTH = 4;
const PRESS_SHRINK = -4;
const TOPICS_ROOM = 36;

export function Ask({ className }: { className?: string }) {
  return (
    <MotionConfig reducedMotion="user">
      <AskBar className={className} />
    </MotionConfig>
  );
}

function AskBar({ className }: { className?: string }) {
  const t = useTranslations('Ask');
  const { messages, status, step, notices, send, retry, stop, reset } = useConversation();
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
  const offering = focused && !expanded && messages.length === 0 && !draft;
  const offers = useRef(false);
  const { phase, written, shineX, glow, writeDelay } = useWake(root, {
    held: focused || draft.length > 0 || expanded,
    focused,
    placeholder: t('placeholder'),
  });
  const wide = phase !== 'tiny';
  const lit = phase === 'lit';
  const busy = isBusy(status);
  const thinking = isThinking(messages, status);
  const nudge =
    !lit || expanded || draft ? 0 : pointer === 'press' ? PRESS_SHRINK : pointer === 'hover' ? HOVER_GROWTH : 0;

  const publishClearance = useCallback(() => {
    const element = frame.current;
    if (!element) return;
    const top = element.getBoundingClientRect().top - (offers.current ? TOPICS_ROOM : 0);
    const clearance = Math.round(window.innerHeight - top);
    document.documentElement.style.setProperty('--ask-clearance', `${clearance}px`);
  }, []);

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
    const resized = new ResizeObserver(publishClearance);
    resized.observe(element);
    window.addEventListener('resize', publishClearance);
    return () => {
      resized.disconnect();
      window.removeEventListener('resize', publishClearance);
      document.documentElement.style.removeProperty('--ask-clearance');
    };
  }, [publishClearance]);

  useEffect(() => {
    offers.current = offering;
    publishClearance();
  }, [offering, publishClearance]);

  useEffect(() => {
    const close = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    window.addEventListener('pointerdown', close);
    return () => window.removeEventListener('pointerdown', close);
  }, []);

  const ask = (question: string) => {
    if (busy || !question.trim()) return;
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

  const close = (byKeyboard: boolean) => {
    setOpen(false);
    if (byKeyboard) input.current?.focus();
    else if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
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
          if (expanded) close(true);
          else if (event.target instanceof HTMLElement) event.target.blur();
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
            onUpdate={publishClearance}
            onAnimationComplete={publishClearance}
            onClick={() => !wide && input.current?.focus()}
            onPointerEnter={(event) => event.pointerType === 'mouse' && setPointer('hover')}
            onPointerLeave={() => setPointer('rest')}
            onPointerDown={() => setPointer('press')}
            onPointerUp={() => setPointer('hover')}
            onPointerCancel={() => setPointer('rest')}
            className={cn(
              'relative flex shrink-0 flex-col shadow-pill',
              !wide && "cursor-pointer after:absolute after:-inset-x-4 after:-inset-y-[17px] after:content-['']"
            )}
          >
            <div
              style={glass('20px')}
              className="relative flex flex-1 flex-col justify-end overflow-hidden rounded-[inherit] bg-card/85"
            >
              <AnimatePresence>
                {expanded && thinking && <Aura key="aura" frame={frame} avatar={avatar} />}
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
                      ...blurred(8),
                      transition: { ...FOLD, height: { ...FOLD, duration: 0.36 } },
                    }}
                  >
                    <motion.div initial={blurred(8)} animate={sharp} transition={{ ...REVEAL, delay: 0.16 }}>
                      <Conversation
                        messages={messages}
                        status={status}
                        step={step}
                        notices={notices}
                        avatarRef={avatar}
                        onRestart={restart}
                        onRetry={retry}
                        onClose={close}
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
                onStop={() => {
                  stop();
                  input.current?.focus();
                }}
                busy={busy}
                lit={lit}
                written={written}
                framed={expanded}
                width={width}
                writeDelay={writeDelay}
                onFocus={(event) => {
                  if (messages.length > 0 && !root.current?.contains(event.relatedTarget)) setOpen(true);
                }}
                onPointerDown={() => messages.length > 0 && setOpen(true)}
              />
            </div>
            <AnimatePresence>
              {expanded && thinking && <EdgeLight key="edge" frame={frame} avatar={avatar} />}
            </AnimatePresence>
            <Rim x={shineX} glow={glow} />
          </motion.div>
        </div>
        <AnimatePresence>
          {offering && <Topics onPick={ask} className="absolute inset-x-0 bottom-full mb-2" />}
        </AnimatePresence>
      </div>
    </div>
  );
}
