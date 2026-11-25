'use client';

import {
  AiBrain01Icon,
  ArrowUp02Icon,
  Briefcase01Icon,
  Calendar03Icon,
  Cancel01Icon,
  Download01Icon,
  File01Icon,
  Mic02Icon,
  PlusSignIcon,
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { animate, AnimatePresence, motion, useMotionValue, useReducedMotion } from 'motion/react';
import { useLocale } from 'next-intl';
import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type SubmitEvent } from 'react';

import { useBooking } from '@/hooks/use-booking';
import { useResumeAnchor } from '@/hooks/use-resume-anchor';
import { EASE_SNAP } from '@/lib/motion';
import { cn } from '@/lib/utils';

import { MORPH } from '../Island/motion';

import { Letters, TwoPassLetters, twoPassDuration } from './Letters';
import { Orb } from './Orb';
import { Rim } from './Rim';
import { copy, replyTo, type Reply } from './script';

type Message =
  { id: number; role: 'user'; text: string } | { id: number; role: 'assistant'; reply: Reply; shown: number };
type Phase = 'tiny' | 'wide' | 'lit';

const BAR = 44;
const FIELD_MAX = 200;
const ACTIONS_ROOM = 84;
const ACTIONS_ROW = 44;
const TINY = { width: 52, height: 10 };
const NUDGE = { type: 'spring', stiffness: 420, damping: 30 } as const;
const SNAPPY = { type: 'spring', stiffness: 260, damping: 22, mass: 0.8 } as const;
const PLACEHOLDER_STEP = 0.025;
const TEXT_DELAY = 0.05;
const EXPAND_AT = 180;
const LIT_AFTER = 260;
const WAKE_HEIGHT = 24;
const WAKE_HALF_WIDTH = 140;
const STAY_REACH = 64;
const TINY_DROP = 30;
const COLLAPSE_AFTER = 300;
const THINKING_MS = 1800;
const WORD_MS = 38;
const SUGGESTION_ICONS = [Briefcase01Icon, Calendar03Icon, AiBrain01Icon];
const GLASS_BLUR: CSSProperties = {
  backdropFilter: 'blur(var(--glass-blur)) saturate(150%)',
  WebkitBackdropFilter: 'blur(var(--glass-blur)) saturate(150%)',
};
const CHIP =
  'inline-flex items-center gap-1.5 rounded-full border border-foreground/10 bg-foreground/[0.04] px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:bg-foreground/[0.08] hover:text-foreground';
const SHINE_PLACEHOLDER: CSSProperties = {
  backgroundImage:
    'linear-gradient(105deg, transparent calc(var(--sweep) - 14%), var(--foreground) var(--sweep), transparent calc(var(--sweep) + 14%)), linear-gradient(var(--subtle-foreground), var(--subtle-foreground))',
  backgroundClip: 'text',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
};

export function Ask({ className }: { className?: string }) {
  const locale = useLocale();
  const text = copy(locale);
  const book = useBooking();
  const resume = useResumeAnchor();
  const still = useReducedMotion();
  const [phase, setPhase] = useState<Phase>('tiny');
  const [full, setFull] = useState(0);
  const [entered, setEntered] = useState(false);
  const [near, setNear] = useState(false);
  const [touch, setTouch] = useState(false);
  const firstWake = useRef(true);
  const [draft, setDraft] = useState('');
  const [focused, setFocused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [pressed, setPressed] = useState(false);
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const root = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLTextAreaElement>(null);
  const mirror = useRef<HTMLSpanElement>(null);
  const [stacked, setStacked] = useState(false);
  const [fieldHeight, setFieldHeight] = useState(BAR);
  const log = useRef<HTMLDivElement>(null);
  const timers = useRef<number[]>([]);
  const count = useRef(0);
  const shineX = useMotionValue(100);
  const glow = useMotionValue(0);

  const last = messages.at(-1);
  const busy = last?.role === 'assistant' && last.shown < last.reply.text.split(' ').length;
  const thinking = last?.role === 'assistant' && last.shown === 0;

  useLayoutEffect(() => {
    const element = root.current;
    if (!element) return;
    const measure = () => setFull(element.offsetWidth);
    measure();
    const resized = new ResizeObserver(measure);
    resized.observe(element);
    return () => resized.disconnect();
  }, []);

  useEffect(() => {
    const query = window.matchMedia('(hover: hover) and (pointer: fine)');
    const update = () => setTouch(!query.matches);
    const initial = window.setTimeout(update);
    query.addEventListener('change', update);
    return () => {
      window.clearTimeout(initial);
      query.removeEventListener('change', update);
    };
  }, []);

  useEffect(() => {
    const onMove = (event: PointerEvent) => {
      const slot = root.current;
      if (event.pointerType !== 'mouse' || !slot) return;
      const bounds = slot.getBoundingClientRect();
      const middle = (bounds.left + bounds.right) / 2;
      setNear((was) =>
        was
          ? event.clientY >= bounds.top - STAY_REACH &&
            event.clientX >= bounds.left - STAY_REACH &&
            event.clientX <= bounds.right + STAY_REACH
          : event.clientY >= bounds.top - WAKE_HEIGHT && Math.abs(event.clientX - middle) <= WAKE_HALF_WIDTH
      );
    };
    const onLeave = () => setNear(false);
    window.addEventListener('pointermove', onMove, { passive: true });
    document.documentElement.addEventListener('pointerleave', onLeave);
    return () => {
      window.removeEventListener('pointermove', onMove);
      document.documentElement.removeEventListener('pointerleave', onLeave);
    };
  }, []);

  const expanded = open && messages.length > 0;
  const awake = Boolean(still) || touch || near || focused || draft.length > 0 || expanded;

  useEffect(() => {
    const local: number[] = [];
    const at = (ms: number, run: () => void) => local.push(window.setTimeout(run, ms));

    if (!awake) {
      at(COLLAPSE_AFTER, () => {
        setPhase((current) => (current === 'lit' ? 'wide' : current));
        animate(glow, 0, { duration: 0.2 });
      });
      at(COLLAPSE_AFTER + 120, () => setPhase('tiny'));
      return () => local.forEach(window.clearTimeout);
    }

    const start = firstWake.current && touch && !still ? EXPAND_AT : 0;
    at(start, () => setPhase((current) => (current === 'tiny' ? 'wide' : current)));
    at(start + (still ? 0 : LIT_AFTER), () => {
      setPhase('lit');
      if (!firstWake.current) {
        animate(glow, 0.7, { duration: 0.4 });
        return;
      }
      firstWake.current = false;
      if (still) {
        shineX.set(30);
        glow.set(0.7);
        setEntered(true);
        return;
      }
      const sweep = twoPassDuration(text.placeholder, PLACEHOLDER_STEP);
      animate(glow, [0, 1, 0.7], { duration: sweep, delay: TEXT_DELAY, times: [0, 0.2, 1] });
      animate(shineX, 30, { duration: sweep, delay: TEXT_DELAY, ease: [0.4, 0, 0.2, 1] });
      timers.current.push(window.setTimeout(() => setEntered(true), (TEXT_DELAY + sweep) * 1000));
    });
    return () => local.forEach(window.clearTimeout);
  }, [awake, touch, still, glow, shineX, text.placeholder]);

  useEffect(() => {
    const onPointer = (event: PointerEvent) => {
      if (root.current && !root.current.contains(event.target as Node)) setOpen(false);
    };
    window.addEventListener('pointerdown', onPointer);
    const pending = timers.current;
    return () => {
      window.removeEventListener('pointerdown', onPointer);
      pending.forEach(window.clearTimeout);
    };
  }, []);

  useEffect(() => {
    log.current?.scrollTo({ top: log.current.scrollHeight });
  }, [messages]);

  useLayoutEffect(() => {
    const field = input.current;
    const measure = mirror.current;
    if (!field || !measure) return;
    const next = draft.includes('\n') || measure.offsetWidth > full - 20 - ACTIONS_ROOM - 4;
    setStacked(next);
    field.style.height = 'auto';
    const content = field.scrollHeight;
    field.style.height = '';
    setFieldHeight(next ? Math.min(content, FIELD_MAX) : BAR);
  }, [draft, full, stacked]);

  useEffect(() => {
    if (!entered) return;
    animate(glow, focused ? 1 : 0.7, { duration: 0.6 });
    animate(shineX, focused ? 24 : 30, { duration: 0.8, ease: EASE_SNAP });
  }, [focused, entered, glow, shineX]);

  const ask = (question: string) => {
    const trimmed = question.trim();
    if (!trimmed || busy) return;
    const reply = replyTo(trimmed, locale);
    count.current += 2;
    const id = count.current;
    const words = reply.text.split(' ').length;
    setMessages((current) => [
      ...current,
      { id, role: 'user', text: trimmed },
      { id: id + 1, role: 'assistant', reply, shown: 0 },
    ]);
    setDraft('');
    setOpen(true);
    for (let word = 1; word <= words; word++) {
      timers.current.push(
        window.setTimeout(
          () =>
            setMessages((current) =>
              current.map((message) => (message.id === id + 1 ? { ...message, shown: word } : message))
            ),
          THINKING_MS + word * WORD_MS
        )
      );
    }
  };

  const submit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    ask(draft);
  };

  const restart = () => {
    setMessages([]);
    setOpen(false);
    input.current?.focus();
  };

  const offering = focused && !expanded && messages.length === 0 && !draft;
  const wide = phase !== 'tiny';
  const lit = phase === 'lit';
  const typed = draft.trim().length > 0;
  const nudge = !lit || expanded || stacked || still ? 0 : pressed ? -4 : hovered ? 4 : 0;

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
        onKeyDown={(event) => {
          if (event.key !== 'Escape') return;
          setOpen(false);
          input.current?.blur();
        }}
      >
        <AnimatePresence>
          {offering && (
            <div className="absolute inset-x-0 bottom-full mb-2 flex justify-center gap-1.5 overflow-x-auto [scrollbar-width:none] max-sm:justify-start max-sm:[mask-image:linear-gradient(to_right,black_80%,transparent)]">
              {text.suggestions.map((suggestion, index) => (
                <Suggestion
                  key={suggestion}
                  index={index}
                  label={suggestion}
                  icon={SUGGESTION_ICONS[index] ?? AiBrain01Icon}
                  onPick={() => ask(suggestion)}
                />
              ))}
            </div>
          )}
        </AnimatePresence>

        <div className="flex min-h-11 items-center justify-center">
          <motion.div
            initial={{ width: TINY.width, height: TINY.height, borderRadius: TINY.height / 2, y: TINY_DROP }}
            animate={{
              width: wide ? full + nudge : TINY.width,
              y: wide ? 0 : TINY_DROP,
              height: lit ? 'auto' : wide ? BAR : TINY.height,
              borderRadius: expanded ? 26 : wide ? BAR / 2 : TINY.height / 2,
            }}
            transition={{
              width: entered ? NUDGE : MORPH,
              height: lit ? { duration: 0 } : MORPH,
              borderRadius: MORPH,
              y: MORPH,
            }}
            onPointerEnter={(event) => event.pointerType === 'mouse' && setHovered(true)}
            onPointerLeave={() => {
              setHovered(false);
              setPressed(false);
            }}
            onPointerDown={() => setPressed(true)}
            onPointerUp={() => setPressed(false)}
            onPointerCancel={() => setPressed(false)}
            className="relative flex shrink-0 flex-col shadow-pill"
          >
            <div
              style={{ ...GLASS_BLUR, '--glass-blur': '20px' } as CSSProperties}
              className="relative flex flex-1 flex-col justify-end overflow-hidden rounded-[inherit] bg-card/85"
            >
              <AnimatePresence>
                {expanded && thinking && (
                  <motion.span
                    key="glow"
                    aria-hidden
                    className="pointer-events-none absolute bottom-6 left-0 h-56 w-40"
                    style={{
                      background:
                        'radial-gradient(ellipse 100% 50% at 0% 50%, oklch(from var(--shine-rim) l c h / 0.22), oklch(from var(--primary) calc(l + 0.2) 0.05 calc(h + 40) / 0.08) 45%, transparent 75%)',
                    }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0.55, 1, 0.55] }}
                    exit={{ opacity: 0, transition: { duration: 0.6 } }}
                    transition={{ duration: 2.4, ease: 'easeInOut', repeat: Infinity }}
                  />
                )}
              </AnimatePresence>
              <AnimatePresence initial={false}>
                {expanded && (
                  <motion.section
                    key="conversation"
                    aria-label={text.title}
                    className="overflow-hidden"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ height: MORPH, opacity: { duration: 0.25 } }}
                  >
                    <header className="flex items-center justify-between py-2.5 pr-2.5 pl-5">
                      <span className="text-[0.8125rem] text-subtle-foreground">{text.title}</span>
                      <span className="flex items-center gap-0.5">
                        <IconButton label={text.newChat} icon={PlusSignIcon} onClick={restart} />
                        <IconButton label={text.close} icon={Cancel01Icon} onClick={() => setOpen(false)} />
                      </span>
                    </header>
                    <div
                      ref={log}
                      role="log"
                      aria-live="polite"
                      className="flex max-h-[min(55vh,28rem)] flex-col gap-5 overflow-y-auto px-5 pt-3 pb-4 [mask-image:linear-gradient(to_bottom,transparent,black_1rem)]"
                    >
                      {messages.map((message) =>
                        message.role === 'user' ? (
                          <motion.p
                            key={message.id}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, ease: EASE_SNAP }}
                            className="max-w-[85%] self-end rounded-2xl rounded-br-md bg-foreground/[0.07] px-3.5 py-2 text-sm text-foreground"
                          >
                            {message.text}
                          </motion.p>
                        ) : (
                          <Answer
                            key={message.id}
                            reply={message.reply}
                            shown={message.shown}
                            thinkingLabel={text.thinking}
                            actionLabel={message.reply.action === 'book' ? text.book : text.resume}
                            onAction={message.reply.action === 'book' ? book : undefined}
                            resume={resume}
                          />
                        )
                      )}
                    </div>
                  </motion.section>
                )}
              </AnimatePresence>

              <form
                onSubmit={submit}
                className={cn(
                  'relative shrink-0 transition-[margin,background-color,box-shadow,border-radius] duration-300',
                  expanded && 'mx-1.5 mb-1.5 bg-foreground/[0.04] ring-1 ring-foreground/10 ring-inset',
                  expanded && (stacked ? 'rounded-[18px]' : 'rounded-full')
                )}
              >
                <AnimatePresence>
                  {!draft && lit && (
                    <motion.span
                      key="placeholder"
                      aria-hidden
                      className="pointer-events-none absolute top-0 left-5 flex h-11 items-center text-sm text-foreground"
                      initial={entered ? { opacity: 0 } : false}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0, transition: { duration: 0.18 } }}
                      transition={{ duration: 0.25 }}
                    >
                      {entered ? (
                        <span style={{ opacity: 0.5 }}>{text.placeholder}</span>
                      ) : (
                        <span>
                          <TwoPassLetters text={text.placeholder} step={PLACEHOLDER_STEP} delay={TEXT_DELAY} />
                        </span>
                      )}
                    </motion.span>
                  )}
                </AnimatePresence>
                <span
                  ref={mirror}
                  aria-hidden
                  className="pointer-events-none invisible absolute top-0 left-0 text-sm whitespace-pre"
                >
                  {draft}
                </span>
                <motion.div
                  className="relative"
                  initial={false}
                  animate={{ height: fieldHeight }}
                  transition={MORPH}
                >
                  <textarea
                    ref={input}
                    rows={1}
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key !== 'Enter' || event.shiftKey || event.nativeEvent.isComposing) return;
                      event.preventDefault();
                      ask(draft);
                    }}
                    onFocus={() => {
                      setFocused(true);
                      if (messages.length) setOpen(true);
                    }}
                    onBlur={() => setFocused(false)}
                    aria-label={text.title}
                    enterKeyHint="send"
                    className={cn(
                      'block size-full resize-none bg-transparent pt-3 pl-5 text-sm leading-5 caret-foreground outline-hidden transition-colors duration-300 [scrollbar-width:none]',
                      draft ? 'text-foreground' : 'text-transparent',
                      stacked ? 'overflow-y-auto pr-5' : 'overflow-hidden pb-3'
                    )}
                    style={{
                      paddingRight: stacked ? undefined : ACTIONS_ROOM,
                      paddingBottom: stacked ? ACTIONS_ROW : undefined,
                    }}
                  />
                </motion.div>
                <AnimatePresence>
                  {lit && (
                    <motion.span
                      key="actions"
                      className="absolute right-1.5 bottom-1.5 flex h-8 items-center"
                      initial={{ opacity: 0, scale: 0.4, filter: 'blur(6px)' }}
                      animate={{ opacity: 1, scale: 1, filter: 'blur(0px)', transitionEnd: { filter: 'none' } }}
                      exit={{ opacity: 0, scale: 0.6, filter: 'blur(4px)', transition: { duration: 0.12 } }}
                      transition={{ ...SNAPPY, filter: { duration: 0.3 } }}
                    >
                      <button
                        type="button"
                        aria-label={text.voice}
                        title={text.voice}
                          className="grid size-8 cursor-pointer place-items-center text-subtle-foreground/70 transition-[color,scale] duration-200 hover:scale-110 hover:text-foreground active:scale-95 motion-reduce:hover:scale-100"
                      >
                        <HugeiconsIcon icon={Mic02Icon} size={18} strokeWidth={1.5} />
                      </button>
                      <AnimatePresence initial={false}>
                        {typed && (
                          <motion.span
                            key="send"
                            className="flex items-center pl-1"
                            initial={{ width: 0 }}
                            animate={{ width: 'auto' }}
                            exit={{ width: 0, transition: { ...SNAPPY, delay: 0.08 } }}
                            transition={SNAPPY}
                          >
                            <motion.button
                              type="submit"
                              aria-label={text.send}
                              disabled={busy}
                              initial={{ scale: 0, opacity: 0, filter: 'blur(6px)' }}
                              animate={{ scale: 1, opacity: 1, filter: 'blur(0px)', transitionEnd: { filter: 'none' } }}
                              exit={{ scale: 0, opacity: 0, filter: 'blur(6px)' }}
                              transition={{ ...SNAPPY, delay: 0.08, filter: { duration: 0.3, delay: 0.08 } }}
                              className="grid size-8 shrink-0 cursor-pointer place-items-center rounded-full bg-foreground/[0.06] text-foreground/80 shadow-[inset_0_1px_0_oklch(from_var(--glare)_l_c_h/0.08)] ring-1 ring-foreground/15 transition-[background-color,color] ring-inset hover:bg-foreground/10 hover:text-foreground disabled:cursor-default disabled:opacity-40"
                            >
                              <HugeiconsIcon icon={ArrowUp02Icon} size={16} strokeWidth={2} />
                            </motion.button>
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </motion.span>
                  )}
                </AnimatePresence>
              </form>
            </div>
            <Rim x={shineX} glow={glow} />
          </motion.div>
        </div>
      </div>
    </div>
  );
}

interface SuggestionProps {
  index: number;
  label: string;
  icon: typeof PlusSignIcon;
  onPick: () => void;
}

function Suggestion({ index, label, icon, onPick }: SuggestionProps) {
  const delay = index * 0.05;

  return (
    <motion.button
      type="button"
      onPointerDown={(event) => event.preventDefault()}
      onClick={onPick}
      initial={{ opacity: 0, scale: 0.7, '--glass-blur': '0px' }}
      animate={{ opacity: 1, scale: 1, '--glass-blur': '16px' }}
      exit={{ opacity: 0, scale: 0.85, '--glass-blur': '0px', transition: { duration: 0.18 } }}
      transition={{ ...MORPH, delay, opacity: { duration: 0.25, delay } }}
      style={GLASS_BLUR}
      className="relative flex h-7 shrink-0 cursor-pointer items-center gap-1.5 overflow-hidden rounded-full border border-foreground/12 bg-card/85 px-2.5 text-xs whitespace-nowrap text-muted-foreground transition-[color,scale] duration-200 hover:scale-[1.02] hover:text-foreground active:scale-[0.98] motion-reduce:hover:scale-100 motion-reduce:active:scale-100"
    >
      <motion.span
        className="flex items-center gap-1.5"
        initial={{ x: 28 }}
        animate={{ x: 0 }}
        transition={{ ...MORPH, delay }}
      >
        <HugeiconsIcon icon={icon} size={13} strokeWidth={2} />
        <span>
          <Letters text={label} delay={delay + 0.05} step={0.018} />
        </span>
      </motion.span>
    </motion.button>
  );
}

function IconButton({ label, icon, onClick }: { label: string; icon: typeof PlusSignIcon; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className="grid size-7 cursor-pointer place-items-center rounded-full text-subtle-foreground transition-colors hover:bg-foreground/[0.07] hover:text-foreground"
    >
      <HugeiconsIcon icon={icon} size={15} strokeWidth={2} />
    </button>
  );
}

interface AnswerProps {
  reply: Reply;
  shown: number;
  thinkingLabel: string;
  actionLabel: string;
  onAction?: () => void;
  resume: ReturnType<typeof useResumeAnchor>;
}

function Answer({ reply, shown, thinkingLabel, actionLabel, onAction, resume }: AnswerProps) {
  const words = reply.text.split(' ');
  const done = shown >= words.length;

  if (shown === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="relative flex items-center gap-3 py-1"
      >
        <Orb thinking />
        <span className="shine text-sm" style={SHINE_PLACEHOLDER}>
          {thinkingLabel}
        </span>
      </motion.div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm leading-relaxed text-foreground/90">
        {words.slice(0, shown).map((word, index) => (
          <motion.span
            key={index}
            initial={{ opacity: 0, filter: 'blur(4px)' }}
            animate={{ opacity: 1, filter: 'blur(0px)' }}
            transition={{ duration: 0.4 }}
          >
            {word}{' '}
          </motion.span>
        ))}
      </p>
      <AnimatePresence>
        {done && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: EASE_SNAP }}
            className="flex flex-wrap items-center gap-2"
          >
            {reply.sources.map((source) => (
              <a key={source.label} href={source.href} className={CHIP}>
                <HugeiconsIcon icon={File01Icon} size={12} strokeWidth={2} />
                {source.label}
              </a>
            ))}
            {onAction ? (
              <button
                type="button"
                onClick={onAction}
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-full bg-foreground px-3 py-1 text-xs font-medium text-background transition-[scale] active:scale-95"
              >
                <HugeiconsIcon icon={Calendar03Icon} size={13} strokeWidth={2} />
                {actionLabel}
              </button>
            ) : (
              <a
                {...resume}
                className="inline-flex items-center gap-1.5 rounded-full bg-foreground px-3 py-1 text-xs font-medium text-background transition-[scale] active:scale-95"
              >
                <HugeiconsIcon icon={Download01Icon} size={13} strokeWidth={2} />
                {actionLabel}
              </a>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
