'use client';

import {
  AiBrain01Icon,
  ArrowUp02Icon,
  Briefcase01Icon,
  Calendar03Icon,
  Download01Icon,
  File01Icon,
  Mic02Icon,
  PlusSignIcon,
  Tick02Icon,
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  animate,
  AnimatePresence,
  motion,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  type TargetAndTransition,
} from 'motion/react';
import { useLocale } from 'next-intl';
import {
  useEffect,
  useLayoutEffect,
  useContext,
  useRef,
  useState,
  createContext,
  type CSSProperties,
  type ReactNode,
  type Ref,
  type RefObject,
  type SubmitEvent,
} from 'react';

import { CircleXIcon, type CircleXIconHandle } from '@/components/ui/circle-x';
import { Copy01Icon, type Copy01IconHandle } from '@/components/ui/copy-01';
import { RefreshIcon, type RefreshIconHandle } from '@/components/ui/refresh';
import { useBooking } from '@/hooks/use-booking';
import { useResumeAnchor } from '@/hooks/use-resume-anchor';
import { EASE_SNAP } from '@/lib/motion';
import { cn } from '@/lib/utils';

import { MORPH } from '../Island/motion';

import { Letters, TwoPassLetters, twoPassDuration } from './Letters';
import { guidePath, paintGlow } from './orb/glow';
import { Orb } from './Orb';
import { RING, Rim } from './Rim';
import { copy, replyTo, type Reply } from './script';

type Message =
  { id: number; role: 'user'; text: string } | { id: number; role: 'assistant'; reply: Reply; shown: number };
type Phase = 'tiny' | 'wide' | 'lit';

const BAR = 44;
const FIELD_MAX = 200;
const ACTIONS_ROOM = 84;
const ACTIONS_ROW = 44;
const TINY = { width: 52, height: 10 };
const SETTLE = { type: 'spring', stiffness: 260, damping: 34 } as const;
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
const TOP_ZONE = 64;
const COLLAPSE_AFTER = 80;
const THINKING_MS = 1800;
const HELD = 1e9;
const WORD_MS = 38;
const SUGGESTION_ICONS = [Briefcase01Icon, Calendar03Icon, AiBrain01Icon];
const GLASS_BLUR: CSSProperties = {
  backdropFilter: 'blur(var(--glass-blur)) saturate(150%)',
  WebkitBackdropFilter: 'blur(var(--glass-blur)) saturate(150%)',
};
const ACTION =
  'inline-flex cursor-pointer items-center gap-1.5 rounded-full bg-foreground/[0.06] px-3 py-1.5 text-xs font-medium text-foreground/85 shadow-[inset_0_1px_0_oklch(from_var(--glare)_l_c_h/0.08)] ring-1 ring-foreground/15 transition-[background-color,color,scale] ring-inset hover:bg-foreground/10 hover:text-foreground active:scale-95';
const SHIMMER_TEXT: CSSProperties = {
  backgroundImage:
    'linear-gradient(100deg, transparent calc(var(--sweep) - 18%), var(--foreground) var(--sweep), transparent calc(var(--sweep) + 18%)), linear-gradient(var(--subtle-foreground), var(--subtle-foreground))',
  backgroundClip: 'text',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
};

const holdThinking = () => new URLSearchParams(window.location.search).has('debugGlow');

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
  const [atTop, setAtTop] = useState(false);
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
  const frame = useRef<HTMLDivElement>(null);
  const thinkingOrb = useRef<HTMLSpanElement>(null);
  const lastPointer = useRef<{ x: number; y: number } | null>(null);
  const timers = useRef<number[]>([]);
  const count = useRef(0);
  const stick = useRef(true);
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
    const update = () => setAtTop(window.scrollY < TOP_ZONE);
    const initial = window.setTimeout(update);
    window.addEventListener('scroll', update, { passive: true });
    return () => {
      window.clearTimeout(initial);
      window.removeEventListener('scroll', update);
    };
  }, []);

  useEffect(() => {
    const onMove = (event: PointerEvent) => {
      const slot = root.current;
      if (event.pointerType !== 'mouse' || !slot) return;
      lastPointer.current = { x: event.clientX, y: event.clientY };
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
  const awake = Boolean(still) || touch || atTop || near || focused || draft.length > 0 || expanded;

  useEffect(() => {
    const local: number[] = [];
    const at = (ms: number, run: () => void) => local.push(window.setTimeout(run, ms));

    if (!awake) {
      at(COLLAPSE_AFTER, () => {
        setPhase((current) => (current === 'lit' ? 'wide' : current));
        animate(glow, 0, { duration: 0.2 });
      });
      at(COLLAPSE_AFTER + 90, () => setPhase('tiny'));
      return () => local.forEach(window.clearTimeout);
    }

    const start = firstWake.current && !still ? EXPAND_AT : 0;
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
    stick.current = true;
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
          (holdThinking() ? HELD : THINKING_MS) + word * WORD_MS
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

  useEffect(() => {
    if (expanded) return;
    const settle = window.setTimeout(() => {
      const slot = root.current;
      const pointer = lastPointer.current;
      if (!slot || !pointer) return setNear(false);
      const bounds = slot.getBoundingClientRect();
      setNear(
        pointer.y >= bounds.top - WAKE_HEIGHT &&
          Math.abs(pointer.x - (bounds.left + bounds.right) / 2) <= WAKE_HALF_WIDTH
      );
    }, 360);
    return () => window.clearTimeout(settle);
  }, [expanded]);

  useEffect(() => {
    if (!expanded) return;
    let raf = 0;
    const hold = () => {
      const element = log.current;
      if (element && stick.current) element.scrollTop = element.scrollHeight;
      raf = requestAnimationFrame(hold);
    };
    raf = requestAnimationFrame(hold);
    return () => cancelAnimationFrame(raf);
  }, [expanded]);

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
            ref={frame}
            initial={{ width: TINY.width, height: TINY.height, borderRadius: TINY.height / 2, y: TINY_DROP }}
            animate={{
              width: wide ? full + nudge : TINY.width,
              y: wide ? 0 : TINY_DROP,
              height: lit ? 'auto' : wide ? BAR : TINY.height,
              borderRadius: expanded ? 26 : wide ? BAR / 2 : TINY.height / 2,
            }}
            transition={{
              width: !wide ? SETTLE : entered ? NUDGE : MORPH,
              height: lit ? { duration: 0 } : wide ? MORPH : SETTLE,
              borderRadius: wide ? MORPH : SETTLE,
              y: wide ? MORPH : SETTLE,
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
                {expanded && <Aura key="aura" frame={frame} orb={thinkingOrb} thinking={thinking} />}
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
                      transition: {
                        height: { duration: 0.36, ease: [0.45, 0, 0.25, 1] },
                        opacity: { duration: 0.32, ease: [0.45, 0, 0.25, 1] },
                        filter: { duration: 0.32, ease: [0.45, 0, 0.25, 1] },
                      },
                    }}
                  >
                    <motion.section
                      aria-label={text.title}
                      initial={BLURRED}
                      animate={SHARP}
                      transition={{ duration: 0.35, delay: 0.16 }}
                    >
                      <header className="flex items-center gap-3 py-3 pr-3 pl-4">
                        <Orb count={1} size={56} className="-my-2.5 -ml-2" />
                        <span className="flex min-w-0 flex-1 flex-col">
                          <span className="text-sm leading-5 text-foreground">{text.title}</span>
                          <span className="truncate text-xs leading-4 text-subtle-foreground">{text.subtitle}</span>
                        </span>
                        <HeaderButton label={text.newChat} onClick={restart} icon="refresh" />
                        <HeaderButton label={text.close} onClick={() => setOpen(false)} icon="close" />
                      </header>
                      <div
                        ref={log}
                        role="log"
                        aria-live="polite"
                        onScroll={(event) => {
                          const element = event.currentTarget;
                          if (element.scrollHeight - element.scrollTop - element.clientHeight < 2) stick.current = true;
                        }}
                        onWheel={(event) => {
                          if (event.deltaY < 0) stick.current = false;
                        }}
                        onTouchMove={() => {
                          stick.current = false;
                        }}
                        onKeyDown={(event) => {
                          if (['ArrowUp', 'PageUp', 'Home'].includes(event.key)) stick.current = false;
                        }}
                        className="flex max-h-[min(55vh,28rem)] flex-col overflow-y-auto px-5 pt-3 pb-9 [scrollbar-width:none] [mask-image:linear-gradient(to_bottom,transparent,black_1rem)]"
                      >
                        {messages.map((message, index) =>
                          message.role === 'user' ? (
                            <Arrival key={message.id} className={cn('items-end', index > 0 && 'pt-2')}>
                              <motion.p className="relative max-w-[85%] rounded-2xl rounded-br-md bg-foreground/[0.06] px-4 py-2.5 text-sm leading-relaxed text-foreground shadow-[inset_0_1px_0_oklch(from_var(--glare)_l_c_h/0.04)]">
                                {message.text}
                                <span
                                  aria-hidden
                                  className="pointer-events-none absolute inset-0 rounded-[inherit] p-px"
                                  style={BUBBLE_RIM}
                                />
                              </motion.p>
                            </Arrival>
                          ) : (
                            <Arrival key={message.id} delay={0.12} className="pt-5 pb-3">
                              <Answer
                                orbRef={message.id === last?.id ? thinkingOrb : undefined}
                                reply={message.reply}
                                shown={message.shown}
                                thinkingLabel={text.thinking}
                                actionLabel={message.reply.action === 'book' ? text.book : text.resume}
                                onAction={message.reply.action === 'book' ? book : undefined}
                                resume={resume}
                                copyLabels={{ copy: text.copy, copied: text.copied }}
                              />
                            </Arrival>
                          )
                        )}
                      </div>
                    </motion.section>
                  </Fit>
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
                <motion.div className="relative" initial={false} animate={{ height: fieldHeight }} transition={MORPH}>
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
            <AnimatePresence>
              {expanded && thinking && <EdgeLight key="light" frame={frame} orb={thinkingOrb} />}
            </AnimatePresence>
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

function HeaderButton({ label, icon, onClick }: { label: string; icon: 'refresh' | 'close'; onClick: () => void }) {
  const handle = useRef<RefreshIconHandle & CircleXIconHandle>(null);
  const Icon = icon === 'refresh' ? RefreshIcon : CircleXIcon;

  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      onPointerEnter={() => handle.current?.startAnimation()}
      onFocus={() => handle.current?.startAnimation()}
      className="grid size-8 cursor-pointer place-items-center rounded-full text-subtle-foreground transition-colors hover:bg-foreground/[0.06] hover:text-foreground"
    >
      <Icon ref={handle} size={17} />
    </button>
  );
}

const BUBBLE_RIM: CSSProperties = {
  ...RING,
  background:
    'radial-gradient(ellipse 60% 140% at 22% 0%, oklch(from var(--glare) l c h / 0.3), transparent), oklch(from var(--foreground) l c h / 0.1)',
};

function useAvatarPoint(frame: RefObject<HTMLDivElement | null>, orb: RefObject<HTMLSpanElement | null>) {
  const x = useMotionValue(36);
  const y = useMotionValue(0);
  const size = useMotionValue(30);
  const height = useMotionValue(0);
  const width = useMotionValue(0);

  useEffect(() => {
    let raf = 0;
    const follow = () => {
      const box = frame.current?.getBoundingClientRect();
      const mark = (orb.current?.querySelector('canvas') ?? orb.current)?.getBoundingClientRect();
      if (box) {
        height.set(box.height);
        width.set(box.width);
        x.set(mark ? mark.left + mark.width / 2 - box.left : 36);
        y.set(mark ? mark.top + mark.height / 2 - box.top : box.height - 72);
        if (mark) size.set(mark.width * SPHERE_SHARE);
      }
      raf = requestAnimationFrame(follow);
    };
    raf = requestAnimationFrame(follow);
    return () => cancelAnimationFrame(raf);
  }, [frame, orb, x, y, height, width, size]);

  return { x, y, height, width, size };
}

const MILK = (alpha: number) => `oklch(from var(--glare) l c h / ${alpha})`;
const LAVENDER = (alpha: number) => `oklch(from var(--primary) calc(l + 0.24) 0.1 calc(h + 32) / ${alpha})`;

interface LightProps {
  frame: RefObject<HTMLDivElement | null>;
  orb: RefObject<HTMLSpanElement | null>;
  thinking: boolean;
}

const GLOW_SCALE = 2;
const SPHERE_SHARE = 0.47;

function Aura({ frame, orb, thinking }: LightProps) {
  const { x, y, height, width, size } = useAvatarPoint(frame, orb);
  const canvas = useRef<HTMLCanvasElement>(null);
  const curve = useRef<SVGPathElement>(null);
  const [debug, setDebug] = useState(false);

  useEffect(() => {
    const read = window.setTimeout(() => setDebug(new URLSearchParams(window.location.search).has('debugGlow')));
    return () => window.clearTimeout(read);
  }, []);

  useEffect(() => {
    const element = canvas.current;
    const context = element?.getContext('2d');
    if (!element || !context) return;
    let drawn = '';
    let raf = 0;
    const draw = () => {
      const columns = Math.ceil(width.get() / GLOW_SCALE);
      const rows = Math.ceil(height.get() / GLOW_SCALE);
      const key = `${columns}x${rows}@${Math.round(x.get())},${Math.round(y.get())},${Math.round(size.get())}`;
      if (columns > 0 && rows > 0 && key !== drawn) {
        drawn = key;
        element.width = columns;
        element.height = rows;
        const image = context.createImageData(columns, rows);
        const avatar = { x: x.get(), y: y.get(), size: size.get() };
        const box = { width: width.get(), height: height.get() };
        paintGlow(image, GLOW_SCALE, avatar);
        context.putImageData(image, 0, 0);
        curve.current?.setAttribute('d', guidePath(avatar, box));
      }
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [x, y, height, width, size, debug]);

  return (
    <>
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]"
        initial={{ opacity: 0 }}
        animate={{ opacity: thinking ? 1 : 0 }}
        exit={{ opacity: 0, transition: { duration: 0.4 } }}
        transition={{ duration: thinking ? 0.7 : 0.9, ease: 'easeInOut' }}
      >
        <motion.div
          className="absolute inset-0"
          animate={{ opacity: [0.82, 1, 0.82], scale: [1, 1.025, 1] }}
          transition={{ duration: 3.2, ease: 'easeInOut', repeat: Infinity }}
          style={{ transformOrigin: '0% 85%' }}
        >
          <canvas ref={canvas} className="absolute inset-0 size-full" />
        </motion.div>
      </motion.div>
      {debug && (
        <svg aria-hidden className="pointer-events-none absolute inset-0 size-full overflow-visible">
          <path ref={curve} fill="none" stroke="var(--primary)" strokeWidth={1} />
        </svg>
      )}
    </>
  );
}

function EdgeLight({ frame, orb }: Omit<LightProps, 'thinking'>) {
  const { y } = useAvatarPoint(frame, orb);
  const edge = useMotionTemplate`radial-gradient(ellipse 30px 260px at 0px ${y}px, ${LAVENDER(0.55)}, ${MILK(0.12)} 55%, transparent), oklch(from var(--foreground) l c h / 0)`;

  return (
    <motion.span
      aria-hidden
      className="pointer-events-none absolute inset-0 rounded-[inherit] p-px"
      style={{ ...RING, background: edge }}
      initial={{ opacity: 0 }}
      animate={{ opacity: [0.7, 1, 0.7] }}
      exit={{ opacity: 0, transition: { duration: 0.5 } }}
      transition={{ duration: 3.2, ease: 'easeInOut', repeat: Infinity }}
    />
  );
}

interface AnswerProps {
  copyLabels: { copy: string; copied: string };
  reply: Reply;
  shown: number;
  thinkingLabel: string;
  actionLabel: string;
  onAction?: () => void;
  resume: ReturnType<typeof useResumeAnchor>;
  orbRef?: Ref<HTMLSpanElement>;
}

function Answer({ reply, shown, thinkingLabel, actionLabel, onAction, resume, orbRef, copyLabels }: AnswerProps) {
  const words = reply.text.split(' ');
  const done = shown >= words.length;
  const thinking = shown === 0;
  const [cluster, setCluster] = useState(false);

  useEffect(() => {
    if (!thinking) return;
    const flip = window.setInterval(() => setCluster((current) => !current), 1400);
    return () => window.clearInterval(flip);
  }, [thinking]);

  return (
    <div className="flex items-start gap-3">
      <span ref={orbRef} className="relative -mt-2.5 -ml-1 size-11 shrink-0">
        <motion.span
          className="absolute top-1/2 left-1/2 -translate-1/2"
          initial={{ scale: 0.4, x: 12, opacity: 0, filter: 'blur(8px)' }}
          animate={{
            scale: thinking ? 1 : 0.75,
            x: thinking ? 12 : 0,
            opacity: 1,
            filter: 'blur(0px)',
            transitionEnd: { filter: 'none' },
          }}
          transition={{ ...MORPH, opacity: { duration: 0.35 }, filter: { duration: 0.45 } }}
        >
          <Orb count={thinking ? (cluster ? 4 : 2) : 1} spin={thinking} size={64} />
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
            <Letters text={thinkingLabel} delay={0.18} step={0.03} />
          </motion.span>
        ) : (
          <AnswerBody
            key="answer"
            words={words}
            shown={shown}
            done={done}
            reply={reply}
            actionLabel={actionLabel}
            onAction={onAction}
            resume={resume}
            copyLabels={copyLabels}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

const Opening = createContext(false);

interface FitProps {
  children: ReactNode;
  className?: string;
  contentClassName?: string;
  delay?: number;
  fade?: boolean;
  appear?: boolean;
  follow?: boolean;
  exit?: TargetAndTransition;
}

function Fit({
  children,
  className,
  contentClassName,
  delay = 0,
  fade = false,
  appear = true,
  follow = false,
  exit,
}: FitProps) {
  const content = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(0);
  const [measured, setMeasured] = useState(false);
  const [settled, setSettled] = useState(appear);
  const [arrived, setArrived] = useState(false);

  useLayoutEffect(() => {
    const element = content.current;
    if (!element) return;
    let raf = 0;
    const resized = new ResizeObserver(() => {
      setHeight(element.offsetHeight);
      setMeasured(true);
      raf = requestAnimationFrame(() => setSettled(true));
    });
    resized.observe(element);
    return () => {
      resized.disconnect();
      cancelAnimationFrame(raf);
    };
  }, []);

  const instant = !settled || (follow && arrived);

  return (
    <motion.div
      className={cn(className, 'overflow-clip')}
      initial={{ height: appear ? 0 : 'auto', opacity: fade ? 0 : 1 }}
      animate={{ height: measured ? height : appear ? 0 : 'auto', opacity: 1 }}
      exit={exit}
      transition={{
        height: instant ? { duration: 0 } : { duration: 0.42, ease: EASE_SNAP, delay: arrived ? 0 : delay },
        opacity: { duration: 0.25 },
      }}
      onAnimationComplete={() => setArrived(true)}
    >
      <Opening.Provider value={follow && !arrived}>
        <div ref={content} className={contentClassName}>
          {children}
        </div>
      </Opening.Provider>
    </motion.div>
  );
}

const BLURRED = { opacity: 0, filter: 'blur(8px)' };
const SHARP = { opacity: 1, filter: 'blur(0px)', transitionEnd: { filter: 'none' } };

function Arrival({ children, delay = 0, className }: { children: ReactNode; delay?: number; className?: string }) {
  const opening = useContext(Opening);
  const [appear] = useState(!opening);

  return (
    <Fit className="-mx-5 shrink-0 [overflow-clip-margin:16px]" contentClassName="px-5" delay={delay} appear={appear}>
      <motion.div
        className={cn('flex flex-col', className)}
        initial={appear ? BLURRED : false}
        animate={SHARP}
        transition={{ duration: 0.35, delay: delay + 0.2 }}
      >
        {children}
      </motion.div>
    </Fit>
  );
}

interface AnswerBodyProps {
  copyLabels: { copy: string; copied: string };
  words: string[];
  shown: number;
  done: boolean;
  reply: Reply;
  actionLabel: string;
  onAction?: () => void;
  resume: ReturnType<typeof useResumeAnchor>;
}

function AnswerBody({ words, shown, done, reply, actionLabel, onAction, resume, copyLabels }: AnswerBodyProps) {
  return (
    <div className="flex min-w-0 flex-col pt-0.5">
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
            initial={{ ...BLURRED, y: 4 }}
            animate={{ ...SHARP, y: 0 }}
            transition={{ duration: 0.4, delay: 0.08, ease: EASE_SNAP }}
            className="flex flex-col items-start gap-2.5 pt-3"
          >
            {onAction ? (
              <button type="button" onClick={onAction} className={ACTION}>
                <HugeiconsIcon icon={Calendar03Icon} size={13} strokeWidth={2} />
                {actionLabel}
              </button>
            ) : (
              <a {...resume} className={ACTION}>
                <HugeiconsIcon icon={Download01Icon} size={13} strokeWidth={2} />
                {actionLabel}
              </a>
            )}
            <div className="-ml-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
              <CopyAnswer text={reply.text} labels={copyLabels} />
              {reply.sources.map((source) => (
                <a
                  key={source.label}
                  href={source.href}
                  className="inline-flex items-center gap-1 text-xs text-subtle-foreground transition-colors hover:text-foreground"
                >
                  <HugeiconsIcon icon={File01Icon} size={12} strokeWidth={2} />
                  {source.label}
                </a>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function CopyAnswer({ text, labels }: { text: string; labels: { copy: string; copied: string } }) {
  const [copied, setCopied] = useState(false);
  const icon = useRef<Copy01IconHandle>(null);

  useEffect(() => {
    if (!copied) return;
    const reset = window.setTimeout(() => setCopied(false), 1600);
    return () => window.clearTimeout(reset);
  }, [copied]);

  return (
    <button
      type="button"
      aria-label={copied ? labels.copied : labels.copy}
      title={copied ? labels.copied : labels.copy}
      onPointerEnter={() => icon.current?.startAnimation()}
      onFocus={() => icon.current?.startAnimation()}
      onClick={() => {
        void navigator.clipboard?.writeText(text).then(() => setCopied(true));
      }}
      className="grid size-7 cursor-pointer place-items-center rounded-full text-subtle-foreground transition-[color,background-color,scale] hover:bg-foreground/[0.06] hover:text-foreground active:scale-95"
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
          {copied ? <HugeiconsIcon icon={Tick02Icon} size={15} strokeWidth={2} /> : <Copy01Icon ref={icon} size={15} />}
        </motion.span>
      </AnimatePresence>
      <span aria-live="polite" className="sr-only">
        {copied ? labels.copied : ''}
      </span>
    </button>
  );
}
