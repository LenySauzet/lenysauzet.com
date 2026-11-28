'use client';

import { ArrowUp02Icon, Mic02Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { AnimatePresence, motion } from 'motion/react';
import { useTranslations } from 'next-intl';
import {
  useLayoutEffect,
  useRef,
  useState,
  type FocusEventHandler,
  type PointerEventHandler,
  type RefObject,
  type SubmitEvent,
} from 'react';

import { focusRing } from '@/components/shared/styles';
import { cn } from '@/lib/utils';

import { RESTING_OPACITY, Spelled, WrittenTwice } from './Letters';
import { MORPH, SNAPPY } from './motion';
import { BAR, glassButton } from './styles';
import { useDictation } from './use-dictation';

const FIELD_MAX = 200;
const ACTIONS_ROOM = 84;
const ACTIONS_ROW = 44;
const SIDE_PADDING = 20;
const COMPOSING = 229;

interface ComposerProps {
  inputRef: RefObject<HTMLTextAreaElement | null>;
  draft: string;
  onDraft: (draft: string) => void;
  onSend: () => void;
  busy: boolean;
  lit: boolean;
  written: boolean;
  framed: boolean;
  width: number;
  writeDelay: number;
  onFocus: FocusEventHandler<HTMLTextAreaElement>;
  onPointerDown: PointerEventHandler<HTMLTextAreaElement>;
  className?: string;
}

export function Composer({
  inputRef,
  draft,
  onDraft,
  onSend,
  busy,
  lit,
  written,
  framed,
  width,
  writeDelay,
  onFocus,
  onPointerDown,
  className,
}: ComposerProps) {
  const t = useTranslations('Ask');
  const mirror = useRef<HTMLSpanElement>(null);
  const [stacked, setStacked] = useState(false);
  const [height, setHeight] = useState(BAR);
  const spokenAfter = useRef('');
  const dictation = useDictation((spoken) => onDraft(spokenAfter.current + spoken));
  const typed = draft.trim().length > 0;

  useLayoutEffect(() => {
    const textarea = inputRef.current;
    const line = mirror.current;
    if (!textarea || !line) return;
    const overflows = draft.includes('\n') || line.offsetWidth > width - SIDE_PADDING - ACTIONS_ROOM;
    setStacked(overflows);
    if (overflows !== stacked) return;
    textarea.style.height = 'auto';
    const content = textarea.scrollHeight;
    textarea.style.height = '';
    setHeight(overflows ? Math.min(content, FIELD_MAX) : BAR);
  }, [draft, width, stacked, inputRef]);

  const send = () => {
    dictation.cancel();
    onSend();
  };

  const submit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    send();
  };

  return (
    <form
      onSubmit={submit}
      className={cn(
        'relative shrink-0 transition-[margin,background-color,box-shadow,border-radius] duration-300',
        framed && 'mx-1.5 mb-1.5 bg-foreground/[0.04] ring-1 ring-foreground/10 ring-inset',
        framed && (stacked ? 'rounded-[20px]' : 'rounded-full'),
        className
      )}
    >
      <AnimatePresence>
        {!draft && lit && (
          <motion.span
            key="placeholder"
            aria-hidden
            className="pointer-events-none absolute top-0 left-5 flex h-11 items-center text-base text-foreground sm:text-sm"
            initial={written ? { opacity: 0 } : false}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.18 } }}
            transition={{ duration: 0.25 }}
          >
            {written ? (
              <span style={{ opacity: RESTING_OPACITY }}>
                <Spelled text={t('placeholder')} />
              </span>
            ) : (
              <WrittenTwice text={t('placeholder')} delay={writeDelay} />
            )}
          </motion.span>
        )}
      </AnimatePresence>
      <span
        ref={mirror}
        aria-hidden
        className="pointer-events-none invisible absolute top-0 left-0 text-base whitespace-pre sm:text-sm"
      >
        {draft}
      </span>
      <motion.div className="relative" initial={false} animate={{ height }} transition={MORPH}>
        <textarea
          ref={inputRef}
          rows={1}
          value={draft}
          onChange={(event) => {
            dictation.cancel();
            onDraft(event.target.value);
          }}
          onKeyDown={(event) => {
            const composing = event.nativeEvent.isComposing || event.nativeEvent.keyCode === COMPOSING;
            if (event.key !== 'Enter' || event.shiftKey || composing) return;
            event.preventDefault();
            send();
          }}
          onFocus={onFocus}
          onPointerDown={onPointerDown}
          aria-label={t('title')}
          aria-placeholder={t('placeholder')}
          enterKeyHint="send"
          className={cn(
            'block size-full resize-none bg-transparent pt-3 pl-5 text-base leading-5 caret-foreground outline-hidden transition-colors duration-300 [scrollbar-width:none] sm:text-sm',
            draft ? 'text-foreground' : 'text-transparent',
            stacked ? 'overflow-y-auto pr-5' : 'overflow-hidden pb-3'
          )}
          style={{ paddingRight: stacked ? undefined : ACTIONS_ROOM, paddingBottom: stacked ? ACTIONS_ROW : undefined }}
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
            {dictation.supported && (
              <button
                type="button"
                aria-label={dictation.listening ? t('stopDictating') : t('dictate')}
                aria-pressed={dictation.listening}
                title={dictation.listening ? t('stopDictating') : t('dictate')}
                onClick={() => {
                  if (!dictation.listening) spokenAfter.current = draft.trim() ? `${draft.trimEnd()} ` : '';
                  dictation.toggle();
                }}
                className={cn(
                  'grid size-8 cursor-pointer place-items-center rounded-full transition-[color,scale] duration-200 hover:scale-110 hover:text-foreground active:scale-95 motion-reduce:hover:scale-100',
                  dictation.listening ? 'text-primary' : 'text-subtle-foreground/70',
                  focusRing
                )}
              >
                <HugeiconsIcon icon={Mic02Icon} size={18} strokeWidth={1.5} />
              </button>
            )}
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
                    aria-label={t('send')}
                    disabled={busy}
                    initial={{ scale: 0, opacity: 0, filter: 'blur(6px)' }}
                    animate={{ scale: 1, opacity: 1, filter: 'blur(0px)', transitionEnd: { filter: 'none' } }}
                    exit={{ scale: 0, opacity: 0, filter: 'blur(6px)' }}
                    transition={{ ...SNAPPY, delay: 0.08, filter: { duration: 0.3, delay: 0.08 } }}
                    className={cn('grid size-8 shrink-0 place-items-center rounded-full', glassButton)}
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
  );
}
