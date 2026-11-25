'use client';

import {
  ArrowUp02Icon,
  Calendar03Icon,
  Cancel01Icon,
  Download01Icon,
  File01Icon,
  PlusSignIcon,
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { AnimatePresence, motion } from 'motion/react';
import { useLocale } from 'next-intl';
import { useEffect, useRef, useState, type SubmitEvent } from 'react';

import { useBooking } from '@/hooks/use-booking';
import { usePaletteStore } from '@/hooks/use-palette-store';
import { useResumeAnchor } from '@/hooks/use-resume-anchor';
import { EASE_SNAP } from '@/lib/motion';
import { cn } from '@/lib/utils';

import { Orb } from './Orb';
import { copy, replyTo, type Reply } from './script';

type Message = { id: number; role: 'user'; text: string } | { id: number; role: 'assistant'; reply: Reply; shown: number };

const THINKING_MS = 1400;
const WORD_MS = 38;
const GLASS = 'glass-rim bg-card/85 backdrop-blur-2xl backdrop-saturate-150';
const CHIP =
  'inline-flex items-center gap-1.5 rounded-full border border-foreground/10 bg-foreground/[0.04] px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:bg-foreground/[0.08] hover:text-foreground';

const isTyping = (target: EventTarget | null) =>
  target instanceof HTMLElement && (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName));

export function Ask({ className }: { className?: string }) {
  const locale = useLocale();
  const text = copy(locale);
  const book = useBooking();
  const resume = useResumeAnchor();
  const [draft, setDraft] = useState('');
  const [focused, setFocused] = useState(false);
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const root = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const log = useRef<HTMLDivElement>(null);
  const timers = useRef<number[]>([]);
  const count = useRef(0);

  const last = messages.at(-1);
  const busy = last?.role === 'assistant' && last.shown < last.reply.text.split(' ').length;

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === '/' && !event.metaKey && !event.ctrlKey && !isTyping(event.target)) {
        if (usePaletteStore.getState().isOpen) return;
        event.preventDefault();
        input.current?.focus();
      }
    };
    const onPointer = (event: PointerEvent) => {
      if (root.current && !root.current.contains(event.target as Node)) setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('pointerdown', onPointer);
    const pending = timers.current;
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('pointerdown', onPointer);
      pending.forEach(window.clearTimeout);
    };
  }, []);

  useEffect(() => {
    log.current?.scrollTo({ top: log.current.scrollHeight });
  }, [messages]);

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
    timers.current.forEach(window.clearTimeout);
    timers.current = [];
    setMessages([]);
    setOpen(false);
    input.current?.focus();
  };

  const offering = focused && !open && messages.length === 0;

  return (
    <div
      className={cn(
        'pointer-events-none fixed inset-x-0 bottom-0 z-50 flex justify-center px-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:pb-6 print:hidden',
        className
      )}
    >
      <motion.div
        ref={root}
        initial={{ opacity: 0, y: 16, filter: 'blur(8px)' }}
        animate={{ opacity: 1, y: 0, filter: 'blur(0px)', transitionEnd: { filter: 'none' } }}
        transition={{ duration: 0.8, delay: 1.2, ease: EASE_SNAP }}
        className="pointer-events-auto relative w-full max-w-xl"
        onKeyDown={(event) => {
          if (event.key !== 'Escape') return;
          setOpen(false);
          input.current?.blur();
        }}
      >
        <AnimatePresence>
          {offering && (
            <motion.ul
              className="absolute inset-x-0 bottom-full mb-3 flex flex-wrap justify-center gap-2"
              initial="hidden"
              animate="shown"
              exit="hidden"
              variants={{ shown: { transition: { staggerChildren: 0.05 } } }}
            >
              {text.suggestions.map((suggestion) => (
                <motion.li
                  key={suggestion}
                  variants={{
                    hidden: { opacity: 0, y: 6, filter: 'blur(6px)' },
                    shown: { opacity: 1, y: 0, filter: 'blur(0px)' },
                  }}
                  transition={{ duration: 0.35, ease: EASE_SNAP }}
                >
                  <button
                    type="button"
                    onPointerDown={(event) => event.preventDefault()}
                    onClick={() => ask(suggestion)}
                    className={cn(
                      GLASS,
                      'relative rounded-full px-3.5 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground'
                    )}
                  >
                    {suggestion}
                  </button>
                </motion.li>
              ))}
            </motion.ul>
          )}
        </AnimatePresence>

        <motion.div
          layout
          transition={{ duration: 0.45, ease: EASE_SNAP }}
          style={{ borderRadius: 22 }}
          className={cn(
            GLASS,
            'relative overflow-hidden shadow-pill',
            busy && 'shine shine-border',
            focused && !busy && 'ring-1 ring-foreground/10'
          )}
        >
          <AnimatePresence initial={false}>
            {open && messages.length > 0 && (
              <motion.section
                key="conversation"
                aria-label={text.title}
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.45, ease: EASE_SNAP }}
              >
                <header className="flex items-center justify-between px-4 pt-3 pb-1">
                  <span className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Orb className="size-4" />
                    {text.title}
                  </span>
                  <span className="flex items-center gap-0.5">
                    <IconButton label={text.newChat} icon={PlusSignIcon} onClick={restart} />
                    <IconButton label={text.close} icon={Cancel01Icon} onClick={() => setOpen(false)} />
                  </span>
                </header>
                <div
                  ref={log}
                  role="log"
                  aria-live="polite"
                  className="flex max-h-[min(55vh,30rem)] flex-col gap-5 overflow-y-auto px-4 pt-4 pb-5 [mask-image:linear-gradient(to_bottom,transparent,black_1.25rem)]"
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
                <div aria-hidden className="mx-4 h-px bg-foreground/[0.07]" />
              </motion.section>
            )}
          </AnimatePresence>

          <form onSubmit={submit} className="flex items-center gap-3 py-2 pr-2 pl-4">
            <Orb thinking={busy && !open} />
            <input
              ref={input}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onFocus={() => {
                setFocused(true);
                if (messages.length) setOpen(true);
              }}
              onBlur={() => setFocused(false)}
              placeholder={text.placeholder}
              aria-label={text.title}
              enterKeyHint="send"
              className="h-10 min-w-0 flex-1 bg-transparent text-[0.9375rem] text-foreground outline-hidden placeholder:text-subtle-foreground"
            />
            {!focused && !draft && (
              <kbd className="hidden rounded-md border border-foreground/10 px-1.5 py-0.5 font-mono text-xs text-subtle-foreground pointer-fine:inline">
                /
              </kbd>
            )}
            <button
              type="submit"
              aria-label={text.send}
              disabled={!draft.trim() || busy}
              className="grid size-9 shrink-0 cursor-pointer place-items-center rounded-full bg-foreground text-background transition-[background-color,color,scale] active:scale-95 disabled:cursor-default disabled:bg-foreground/[0.07] disabled:text-subtle-foreground"
            >
              <HugeiconsIcon icon={ArrowUp02Icon} size={18} strokeWidth={2} />
            </button>
          </form>
        </motion.div>
      </motion.div>
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
      <HugeiconsIcon icon={icon} size={16} strokeWidth={2} />
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
      <p className="shine flex items-center gap-2.5 text-sm">
        <Orb thinking className="size-6" />
        <span className="shine-text">{thinkingLabel}</span>
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-[0.9375rem] leading-relaxed text-foreground/90">
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
