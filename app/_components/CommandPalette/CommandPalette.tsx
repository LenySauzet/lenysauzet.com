'use client';

import { HugeiconsIcon } from '@hugeicons/react';
import { useTheme } from 'next-themes';
import { useRef } from 'react';

import {
  Command as CommandRoot,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
} from '@/components/ui/command';
import { usePaletteStore } from '@/hooks/use-palette-store';
import { keyLabel } from '@/lib/commands/keys';
import { commands } from '@/lib/commands/registry';
import { GROUPS, type Command } from '@/lib/commands/types';

export default function CommandPalette() {
  const isOpen = usePaletteStore((state) => state.isOpen);
  const setIsOpen = usePaletteStore((state) => state.setIsOpen);
  const { resolvedTheme, setTheme } = useTheme();
  const picked = useRef<Command | null>(null);
  const openedFrom = useRef<HTMLElement | null>(null);

  const pick = (command: Command) => {
    picked.current = command;
    setIsOpen(false);
  };

  return (
    <CommandDialog
      open={isOpen}
      onOpenChange={setIsOpen}
      title="Commands"
      description="Reach me, download my resume or change the theme."
      onOpenAutoFocus={() => {
        openedFrom.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      }}
      onCloseAutoFocus={(event) => {
        event.preventDefault();
        usePaletteStore.setState({ returningFocus: true });
        openedFrom.current?.focus({ preventScroll: true });
        usePaletteStore.setState({ returningFocus: false });

        const command = picked.current;
        picked.current = null;
        void command?.run({ resolvedTheme, setTheme });
      }}
    >
      <CommandRoot>
        <CommandInput placeholder="Type a command..." />
        <CommandList>
        <CommandEmpty>Nothing matches that.</CommandEmpty>
        {GROUPS.map((group) => (
          <CommandGroup key={group} heading={group}>
            {commands
              .filter((command) => command.group === group)
              .map((command) => (
                <CommandItem
                  key={command.id}
                  value={[command.label, ...(command.keywords ?? [])].join(' ')}
                  onSelect={() => pick(command)}
                >
                  <HugeiconsIcon icon={command.icon} strokeWidth={2} />
                  {command.label}
                  {command.hint && (
                    <span className="ml-auto truncate text-xs text-muted-foreground group-data-selected/command-item:text-foreground">
                      {command.hint}
                    </span>
                  )}
                  {command.shortcut && <CommandShortcut>⌘{keyLabel(command.shortcut)}</CommandShortcut>}
                </CommandItem>
              ))}
          </CommandGroup>
        ))}
        </CommandList>
      </CommandRoot>
    </CommandDialog>
  );
}
