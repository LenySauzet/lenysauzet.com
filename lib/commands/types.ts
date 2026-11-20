import type { IconSvgElement } from '@hugeicons/react';

export const GROUPS = ['Contact', 'Tools', 'Links'] as const;

export type Group = (typeof GROUPS)[number];

interface CommandContext {
  resolvedTheme: string | undefined;
  setTheme: (theme: string) => void;
}

export interface Command {
  id: string;
  label: string;
  icon: IconSvgElement;
  group: Group;
  keywords?: string[];
  hint?: string;
  shortcut?: string;
  available?: () => boolean;
  run: (context: CommandContext) => void | Promise<void>;
}
