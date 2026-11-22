'use client';

import { Command as CommandPrimitive } from 'cmdk';
import { AnimatePresence, motion, useIsPresent, useReducedMotion } from 'motion/react';
import { Dialog as DialogPrimitive } from 'radix-ui';
import * as React from 'react';

import { cn } from '@/lib/utils';

const SELECTED_TEXT =
  'any-pointer-fine:group-data-selected/command-item:text-foreground in-data-keyed:group-data-selected/command-item:text-foreground';

function Command({ className, onKeyDown, onPointerDown, ...props }: React.ComponentProps<typeof CommandPrimitive>) {
  const [keyed, setKeyed] = React.useState(false);

  return (
    <CommandPrimitive
      data-slot="command"
      data-keyed={keyed ? '' : undefined}
      onKeyDown={(event) => {
        setKeyed(true);
        onKeyDown?.(event);
      }}
      onPointerDown={(event) => {
        setKeyed(false);
        onPointerDown?.(event);
      }}
      className={cn('flex size-full flex-col overflow-hidden bg-transparent text-foreground', className)}
      {...props}
    />
  );
}

interface CommandDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onClosed?: (returnFocus: () => void) => void;
  title: string;
  description: string;
  children: React.ReactNode;
  className?: string;
}

function CommandDialog({ open, onOpenChange, onClosed, title, description, children, className }: CommandDialogProps) {
  const still = useReducedMotion();
  const returnTo = React.useRef<HTMLElement | null>(null);
  const transition = { duration: 0.15, ease: 'easeOut' } as const;
  const away = { opacity: 0, scale: still ? 1 : 0.95, '--dialog-blur': '0px' };

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open && (
          <DialogPrimitive.Portal forceMount>
            <DialogPrimitive.Overlay data-slot="dialog-overlay" forceMount asChild>
              <motion.div
                className="fixed inset-0 isolate z-50 bg-background/80"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={transition}
              />
            </DialogPrimitive.Overlay>
            <DialogPrimitive.Content
              data-slot="dialog-content"
              forceMount
              asChild
              onOpenAutoFocus={() => {
                returnTo.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
              }}
              onCloseAutoFocus={(event) => {
                event.preventDefault();
                const target = returnTo.current?.isConnected ? returnTo.current : null;
                const returnFocus = () => target?.focus({ preventScroll: true });
                if (onClosed) onClosed(returnFocus);
                else returnFocus();
              }}
            >
              <Panel
                className={cn(
                  'glass-rim fixed top-1/5 left-1/2 z-50 w-150 max-w-[95vw] -translate-x-1/2 overflow-hidden rounded-xl border border-muted-foreground/15 supports-[color:oklch(from_red_l_c_h)]:border-0 bg-card/75 text-sm text-foreground outline-hidden backdrop-blur-(--dialog-blur) backdrop-saturate-[115%]',
                  className
                )}
                initial={away}
                animate={{ opacity: 1, scale: 1, '--dialog-blur': '6px' }}
                exit={away}
                transition={transition}
              >
                <DialogPrimitive.Title className="sr-only">{title}</DialogPrimitive.Title>
                <DialogPrimitive.Description className="sr-only">{description}</DialogPrimitive.Description>
                {children}
              </Panel>
            </DialogPrimitive.Content>
          </DialogPrimitive.Portal>
        )}
      </AnimatePresence>
    </DialogPrimitive.Root>
  );
}

function Panel(props: React.ComponentProps<typeof motion.div>) {
  const present = useIsPresent();

  return (
    <motion.div
      {...props}
      inert={!present}
      onKeyDownCapture={(event) => {
        if (!present && event.key === 'Enter') event.stopPropagation();
      }}
    />
  );
}

function CommandInput({ className, ...props }: React.ComponentProps<typeof CommandPrimitive.Input>) {
  return (
    <div
      data-slot="command-input-wrapper"
      className="mx-(--rim-width) flex h-13.75 items-center border-b-[1.5px] border-foreground/10 px-[calc(--spacing(4.5)-var(--rim-width))]"
    >
      <CommandPrimitive.Input
        data-slot="command-input"
        name="search"
        enterKeyHint="go"
        data-1p-ignore
        data-lpignore="true"
        className={cn(
          'w-full bg-transparent text-base outline-hidden placeholder:text-subtle-foreground disabled:cursor-not-allowed disabled:opacity-50 sm:text-sm',
          className
        )}
        {...props}
      />
    </div>
  );
}

function CommandList({ className, ...props }: React.ComponentProps<typeof CommandPrimitive.List>) {
  return (
    <CommandPrimitive.List
      data-slot="command-list"
      className={cn(
        'no-scrollbar max-h-[min(460px,50vh)] scroll-py-2 overflow-x-hidden overflow-y-auto p-2 outline-hidden',
        className
      )}
      {...props}
    />
  );
}

function CommandEmpty({ className, ...props }: React.ComponentProps<typeof CommandPrimitive.Empty>) {
  return (
    <CommandPrimitive.Empty data-slot="command-empty" className={cn('py-6 text-center text-sm', className)} {...props} />
  );
}

function CommandGroup({ className, ...props }: React.ComponentProps<typeof CommandPrimitive.Group>) {
  return (
    <CommandPrimitive.Group
      data-slot="command-group"
      className={cn(
        'overflow-hidden not-first:mt-2 **:[[cmdk-group-heading]]:px-3 **:[[cmdk-group-heading]]:py-2 **:[[cmdk-group-heading]]:text-[0.8125rem] **:[[cmdk-group-heading]]:font-medium **:[[cmdk-group-heading]]:text-subtle-foreground',
        className
      )}
      {...props}
    />
  );
}

function CommandItem({ className, ...props }: React.ComponentProps<typeof CommandPrimitive.Item>) {
  return (
    <CommandPrimitive.Item
      data-slot="command-item"
      className={cn(
        "group/command-item relative flex h-11 cursor-pointer items-center gap-3 rounded-lg px-3 text-sm font-medium text-muted-foreground outline-hidden select-none transition-[scale] duration-100 active:scale-[0.99] data-[disabled=true]:cursor-not-allowed data-[disabled=true]:opacity-40 data-[disabled=true]:active:scale-100 any-pointer-fine:data-selected:bg-foreground/5 any-pointer-fine:data-selected:text-foreground in-data-keyed:data-selected:bg-foreground/5 in-data-keyed:data-selected:text-foreground [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-[1.15rem] any-pointer-fine:data-selected:**:[svg]:text-foreground in-data-keyed:data-selected:**:[svg]:text-foreground",
        className
      )}
      {...props}
    />
  );
}

function CommandHint({ className, ...props }: React.ComponentProps<'span'>) {
  return (
    <span
      data-slot="command-hint"
      className={cn('ml-auto truncate pl-6 text-sm font-normal text-subtle-foreground', SELECTED_TEXT, className)}
      {...props}
    />
  );
}

function CommandShortcut({ className, ...props }: React.ComponentProps<'span'>) {
  return (
    <span
      data-slot="command-shortcut"
      className={cn('ml-auto text-xs tracking-widest text-muted-foreground', SELECTED_TEXT, className)}
      {...props}
    />
  );
}

export {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandHint,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
};
