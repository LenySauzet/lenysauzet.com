'use client';

import { HugeiconsIcon } from '@hugeicons/react';
import { useTheme } from 'next-themes';
import { useRef } from 'react';

import {
  Command as CommandRoot,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandHint,
  CommandInput,
  CommandItem,
  CommandShortcut,
} from '@/components/ui/command';
import { usePaletteStore } from '@/hooks/use-palette-store';
import { keyLabel, modifierLabel } from '@/lib/commands/keys';
import { commands } from '@/lib/commands/registry';
import { GROUPS, type Command } from '@/lib/commands/types';

import { FadingList } from './FadingList';

export default function CommandPalette() {
  const isOpen = usePaletteStore((state) => state.isOpen);
  const setIsOpen = usePaletteStore((state) => state.setIsOpen);
  const { resolvedTheme, setTheme } = useTheme();
  const picked = useRef<Command | null>(null);
  const modifier = modifierLabel(navigator.userAgent);

  const pick = (command: Command) => {
    picked.current = command;
    setIsOpen(false);
  };

  const runPicked = () => {
    const command = picked.current;
    picked.current = null;
    void command?.run({ resolvedTheme, setTheme });
  };

  return (
    <CommandDialog
      open={isOpen}
      onOpenChange={setIsOpen}
      onExitComplete={runPicked}
      title="Commands"
      description="Reach me, download my resume or change the theme."
    >
      <CommandRoot>
        <CommandInput placeholder="Type a command..."/>
        <FadingList>
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
                    {command.hint && <CommandHint>{command.hint}</CommandHint>}
                    {command.shortcut && (
                      <CommandShortcut className="pointer-coarse:hidden">
                        {modifier}
                        {keyLabel(command.shortcut)}
                      </CommandShortcut>
                    )}
                  </CommandItem>
                ))}
            </CommandGroup>
          ))}
        </FadingList>
      </CommandRoot>
    </CommandDialog>
  );
}
