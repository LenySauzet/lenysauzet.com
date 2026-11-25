'use client';

import {
  AiBrain01Icon,
  ArrowUp02Icon,
  Briefcase01Icon,
  Calendar03Icon,
  Cancel01Icon,
  Download01Icon,
  File01Icon,
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

import { Letters, lettersDuration } from './Letters';
import { Orb } from './Orb';
import { copy, replyTo, type Reply } from './script';
import { Spotlight } from './Spotlight';

type Message = { id: number; role: 'user'; text: string } | { id: number; role: 'assistant'; reply: Reply; shown: number };
type Phase = 'hidden' | 'pill' | 'wide' | 'lit';

const BAR = 44;
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
  const [phase, setPhase] = useState<Phase>('hidden');
  const [inset, setInset] = useState(0);
  const [placeholderSettled, setPlaceholderSettled] = useState(false);
  const [draft, setDraft] = useState('');
  const [focused, setFocused] = useState(false);
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const root = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const log = useRef<HTMLDivElement>(null);
  const timers = useRef<number[]>([]);
  const count = useRef(0);
  const spotX = useMotionValue(92);
  const rim = useMotionValue(0);
  const flare = useMotionValue(0);

  const last = messages.at(-1);
  const busy = last?.role === 'assistant' && last.shown < last.reply.text.split(' ').length;
  const thinking = last?.role === 'assistant' && last.shown === 0;

  useLayoutEffect(() => {
    const width = root.current?.offsetWidth ?? 0;
    setInset(Math.max(0, (width - BAR) / 2));
  }, []);

  useEffect(() => {
    const at = (ms: number, run: () => void) => timers.current.push(window.setTimeout(run, ms));
    if (still) {
      spotX.set(30);
      rim.set(1);
      flare.set(0.3);
      at(0, () => {
        setPhase('lit');
        setPlaceholderSettled(true);
      });
      return;
    }
    at(1200, () => setPhase('pill'));
    at(1700, () => setPhase('wide'));
    at(2250, () => {
      setPhase('lit');
      animate(rim, 1, { duration: 0.5 });
      animate(spotX, 30, { duration: 1.7, ease: [0.65, 0, 0.35, 1] });
      animate(flare, [0, 1, 0.3], { duration: 1.9, times: [0, 0.45, 1] });
    });
    at(2250 + lettersDuration(text.placeholder) * 1000 + 100, () => setPlaceholderSettled(true));
  }, [still, spotX, rim, flare, text.placeholder]);

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

  useEffect(() => {
    if (phase !== 'lit') return;
    animate(flare, focused ? 0.6 : 0.3, { duration: 0.6 });
    animate(spotX, focused ? 24 : 30, { duration: 0.8, ease: EASE_SNAP });
  }, [focused, phase, flare, spotX]);

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

  const expanded = open && messages.length > 0;
  const offering = focused && !expanded && messages.length === 0;
  const shown = phase !== 'hidden';
  const wide = phase === 'wide' || phase === 'lit';

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
            <div className="absolute bottom-full left-1/2 mb-2.5 flex max-w-[calc(100vw-2rem)] -translate-x-1/2 gap-2 overflow-x-auto [scrollbar-width:none] max-sm:[mask-image:linear-gradient(to_right,black_80%,transparent)]">
              {text.suggestions.map((suggestion, index) => (
                <motion.button
                  key={suggestion}
                  type="button"
                  onPointerDown={(event) => event.preventDefault()}
                  onClick={() => ask(suggestion)}
                  initial={{ opacity: 0, y: 8, '--glass-blur': '0px' }}
                  animate={{ opacity: 1, y: 0, '--glass-blur': '16px' }}
                  exit={{ opacity: 0, y: 6, '--glass-blur': '0px', transition: { duration: 0.2 } }}
                  transition={{ duration: 0.45, delay: index * 0.06, ease: EASE_SNAP }}
                  style={GLASS_BLUR}
                  className="glass-rim relative flex h-8 shrink-0 cursor-pointer items-center gap-1.5 rounded-full bg-card/85 px-3 text-[0.8125rem] whitespace-nowrap text-muted-foreground transition-colors hover:text-foreground"
                >
                  <HugeiconsIcon icon={SUGGESTION_ICONS[index] ?? AiBrain01Icon} size={14} strokeWidth={2} />
                  <span>
                    <Letters text={suggestion} delay={0.1 + index * 0.06} step={0.016} />
                  </span>
                </motion.button>
              ))}
            </div>
          )}
        </AnimatePresence>

        <div className="relative">
          <motion.div
            initial={{
              opacity: 0,
              y: 28,
              '--glass-blur': '0px',
              clipPath: `inset(0px ${inset}px round ${BAR / 2}px)`,
            }}
            animate={{
              opacity: shown ? 1 : 0,
              y: shown ? 0 : 28,
              '--glass-blur': shown ? '20px' : '0px',
              clipPath: wide ? `inset(0px 0px round ${BAR / 2}px)` : `inset(0px ${inset}px round ${BAR / 2}px)`,
              borderRadius: expanded ? 26 : BAR / 2,
              transitionEnd: phase === 'lit' ? { clipPath: 'none' } : {},
            }}
            transition={{
              default: { duration: 0.6, ease: EASE_SNAP },
              clipPath: { duration: 0.65, ease: [0.65, 0, 0.35, 1] },
              borderRadius: { duration: 0.45, ease: EASE_SNAP },
            }}
            style={GLASS_BLUR}
            className="glass-rim relative overflow-hidden bg-card/85 shadow-pill"
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
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.45, ease: EASE_SNAP }}
                >
                  <header className="flex items-center justify-between py-2.5 pr-2.5 pl-4">
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
                    className="flex max-h-[min(55vh,28rem)] flex-col gap-5 overflow-y-auto px-4 pt-3 pb-4 [mask-image:linear-gradient(to_bottom,transparent,black_1rem)]"
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
                'relative flex h-11 items-center gap-2 pr-1.5 pl-4 transition-[margin,background-color,box-shadow] duration-300',
                expanded && 'mx-1.5 mb-1.5 rounded-full bg-foreground/[0.04] ring-1 ring-foreground/10 ring-inset'
              )}
            >
              {!draft && wide && (
                <span aria-hidden className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-sm">
                  {placeholderSettled ? (
                    <span className="shine" style={SHINE_PLACEHOLDER}>
                      {text.placeholder}
                    </span>
                  ) : (
                    <span className="text-subtle-foreground">
                      <Letters text={text.placeholder} delay={0.55} />
                    </span>
                  )}
                </span>
              )}
              <input
                ref={input}
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                onFocus={() => {
                  setFocused(true);
                  if (messages.length) setOpen(true);
                }}
                onBlur={() => setFocused(false)}
                aria-label={text.title}
                enterKeyHint="send"
                className="h-full min-w-0 flex-1 bg-transparent text-sm text-foreground outline-hidden"
              />
              <motion.button
                type="submit"
                aria-label={text.send}
                disabled={!draft.trim() || busy}
                animate={{ opacity: wide ? 1 : 0, scale: wide ? 1 : 0.6 }}
                transition={{ duration: 0.4, delay: wide ? 0.35 : 0, ease: EASE_SNAP }}
                className="grid size-8 shrink-0 cursor-pointer place-items-center rounded-full bg-foreground text-background shadow-[inset_0_1px_0_oklch(from_var(--shine-rim)_l_c_h/0.3)] transition-[background-color,color] active:scale-95 disabled:cursor-default disabled:bg-foreground/[0.06] disabled:text-subtle-foreground disabled:ring-1 disabled:ring-foreground/10 disabled:ring-inset"
              >
                <HugeiconsIcon icon={ArrowUp02Icon} size={16} strokeWidth={2} />
              </motion.button>
            </form>
          </motion.div>
          <Spotlight x={spotX} rim={rim} flare={flare} />
        </div>
      </div>
    </div>
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
