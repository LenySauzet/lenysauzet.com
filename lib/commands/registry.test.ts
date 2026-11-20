import { describe, expect, it, vi } from 'vitest';

import { useIslandStore } from '@/hooks/use-island-store';

import { commands } from './registry';
import { GROUPS } from './types';

const byId = (id: string) => commands.find((command) => command.id === id)!;
const context = { resolvedTheme: 'dark', setTheme: vi.fn() };
const announced = () => {
  const state = useIslandStore.getState().presented.at(-1);
  return state ? JSON.stringify(state.render()) : '';
};

describe('the registry', () => {
  it('gives every command its own id and every shortcut to one command', () => {
    const ids = commands.map((command) => command.id);
    const shortcuts = commands.flatMap((command) => command.shortcut ?? []);

    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(shortcuts).size).toBe(shortcuts.length);
    expect(shortcuts).not.toContain('k');
  });

  it('files every command under a group the palette draws', () => {
    for (const command of commands) expect(GROUPS).toContain(command.group);
  });
});

describe('Toggle theme', () => {
  it('flips the theme in force', () => {
    byId('toggle-theme').run(context);
    expect(context.setTheme).toHaveBeenCalledWith('light');
  });
});

describe('Copy email', () => {
  it('says so once the address is on the clipboard', async () => {
    Object.assign(navigator, { clipboard: { writeText: vi.fn().mockResolvedValue(undefined) } });

    await byId('copy-email').run(context);

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('contact@lenysauzet.com');
    expect(announced()).toContain('Email copied');
  });

  it('shows the address itself when the browser refuses the clipboard', async () => {
    Object.assign(navigator, { clipboard: { writeText: vi.fn().mockRejectedValue(new Error('denied')) } });

    await byId('copy-email').run(context);

    expect(announced()).toContain('contact@lenysauzet.com');
  });
});
