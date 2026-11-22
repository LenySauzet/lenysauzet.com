import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useIslandStore } from '@/hooks/use-island-store';
import { usePresenceStore } from '@/hooks/use-presence-store';
import { englishCommands } from '@/test/intl';

import { GROUPS } from './types';

const goToOtherVersion = vi.fn();
const commands = englishCommands(goToOtherVersion);
const byId = (id: string) => commands.find((command) => command.id === id)!;
const context = { resolvedTheme: 'dark', setTheme: vi.fn() };
const announced = () => {
  const presence = useIslandStore.getState().presented.at(-1);
  return presence?.id === 'announcement' ? presence.message : undefined;
};
const clipboard = Object.getOwnPropertyDescriptor(navigator, 'clipboard');

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
  beforeEach(() => useIslandStore.setState({ presented: [] }));
  afterEach(() => {
    if (clipboard) Object.defineProperty(navigator, 'clipboard', clipboard);
    else Reflect.deleteProperty(navigator, 'clipboard');
  });

  it('says so once the address is on the clipboard', async () => {
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: vi.fn().mockResolvedValue(undefined) },
      configurable: true,
    });

    await byId('copy-email').run(context);

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('contact@lenysauzet.com');
    expect(announced()).toBe('Email copied');
  });

  it('shows the address itself when the browser refuses the clipboard', async () => {
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: vi.fn().mockRejectedValue(new Error('denied')) },
      configurable: true,
    });

    await byId('copy-email').run(context);

    expect(announced()).toBe('contact@lenysauzet.com');
  });
});

describe('Live cursors', () => {
  it('hides the other visitors, then shows them again, saying so and showing the state', () => {
    useIslandStore.setState({ presented: [] });
    usePresenceStore.setState({ hidden: false });
    const command = byId('toggle-cursors');
    expect(command.status?.()).toBe('On');

    command.run(context);
    expect(usePresenceStore.getState().hidden).toBe(true);
    expect(announced()).toBe('Cursors hidden');
    expect(command.status?.()).toBe('Off');

    command.run(context);
    expect(usePresenceStore.getState().hidden).toBe(false);
    expect(announced()).toBe('Cursors shown');
    expect(command.status?.()).toBe('On');
  });
});

describe('the other language', () => {
  it('switches the page to it', () => {
    expect(byId('other-version').label).toBe('Read in French');
    byId('other-version').run(context);
    expect(goToOtherVersion).toHaveBeenCalledOnce();
  });
});
