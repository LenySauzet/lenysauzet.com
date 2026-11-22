'use client';

import { HugeiconsIcon } from '@hugeicons/react';
import { useTranslations } from 'next-intl';
import { useTheme } from 'next-themes';
import { useEffect, useRef } from 'react';

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
import { useCommands } from '@/hooks/use-commands';
import { usePaletteStore } from '@/hooks/use-palette-store';
import { keyLabel, modifierLabel, platformOf } from '@/lib/commands/keys';
import { GROUPS, type Command } from '@/lib/commands/types';

import { FadingList } from './FadingList';

export function CommandPalette({ className }: { className?: string }) {
  const isOpen = usePaletteStore((state) => state.isOpen);
  const setIsOpen = usePaletteStore((state) => state.setIsOpen);
  const { resolvedTheme, setTheme } = useTheme();
  const t = useTranslations('Palette');
  const commands = useCommands();
  const picked = useRef<Command | null>(null);
  const modifier = modifierLabel(platformOf(navigator.userAgent));

  useEffect(() => {
    if (isOpen) picked.current = null;
  }, [isOpen]);

  const pick = (command: Command) => {
    picked.current = command;
    setIsOpen(false);
  };

  const closed = (returnFocus: () => void) => {
    usePaletteStore.setState({ returningFocus: true });
    returnFocus();
    usePaletteStore.setState({ returningFocus: false });

    const command = picked.current;
    picked.current = null;
    void command?.run({ resolvedTheme, setTheme });
  };

  return (
    <CommandDialog
      open={isOpen}
      onOpenChange={setIsOpen}
      onClosed={closed}
      title={t('title')}
      description={t('description')}
      className={className}
    >
      <CommandRoot label={t('title')}>
        <CommandInput placeholder={t('placeholder')} />
        <FadingList>
          <CommandEmpty>{t('empty')}</CommandEmpty>
          {GROUPS.map((group) => (
            <CommandGroup key={group} heading={t(group)}>
              {commands
                .filter((command) => command.group === group && (command.available?.() ?? true))
                .map((command) => (
                  <CommandItem
                    key={command.id}
                    value={[command.label, ...(command.keywords ?? [])].join(' ')}
                    onSelect={() => pick(command)}
                  >
                    <HugeiconsIcon icon={command.icon} strokeWidth={2} />
                    <span lang={command.lang}>{command.label}</span>
                    {command.hint && <CommandHint>{command.hint}</CommandHint>}
                    {command.status && <CommandHint>{command.status()}</CommandHint>}
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
