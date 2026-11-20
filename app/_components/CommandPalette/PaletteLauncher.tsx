'use client';

import { useTheme } from 'next-themes';
import dynamic from 'next/dynamic';
import { useEffect } from 'react';

import { usePaletteStore } from '@/hooks/use-palette-store';
import { commandFor, togglesPalette } from '@/lib/commands/keys';
import { commands } from '@/lib/commands/registry';

const CommandPalette = dynamic(() => import('./CommandPalette'), { ssr: false });

export function PaletteLauncher() {
  const wanted = usePaletteStore((state) => state.wanted);
  const { resolvedTheme, setTheme } = useTheme();

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (togglesPalette(event)) {
        event.preventDefault();
        const { isOpen, setIsOpen } = usePaletteStore.getState();
        setIsOpen(!isOpen);
        return;
      }

      const command = commandFor(commands, event);
      if (!command) return;

      event.preventDefault();
      usePaletteStore.getState().setIsOpen(false);
      void command.run({ resolvedTheme, setTheme });
    };

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [resolvedTheme, setTheme]);

  return wanted ? <CommandPalette /> : null;
}
