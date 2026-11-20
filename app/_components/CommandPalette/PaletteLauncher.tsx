'use client';

import { useTheme } from 'next-themes';
import dynamic from 'next/dynamic';
import { useEffect } from 'react';

import { usePaletteStore } from '@/hooks/use-palette-store';
import { chordKey, commandFor, platformOf, TOGGLE_KEY } from '@/lib/commands/keys';
import { commands } from '@/lib/commands/registry';

const CommandPalette = dynamic(() => import('./CommandPalette').then((module) => module.CommandPalette), {
  ssr: false,
});

export function PaletteLauncher() {
  const wanted = usePaletteStore((state) => state.wanted);
  const { resolvedTheme, setTheme } = useTheme();

  useEffect(() => {
    const platform = platformOf(navigator.userAgent);

    const onKeyDown = (event: KeyboardEvent) => {
      const key = chordKey(event, platform);
      if (!key) return;

      const { isOpen, setIsOpen } = usePaletteStore.getState();
      if (key === TOGGLE_KEY) {
        event.preventDefault();
        setIsOpen(!isOpen);
        return;
      }

      const command = commandFor(commands, key);
      if (!command) return;

      event.preventDefault();
      setIsOpen(false);
      void command.run({ resolvedTheme, setTheme });
    };

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [resolvedTheme, setTheme]);

  return wanted ? <CommandPalette /> : null;
}
