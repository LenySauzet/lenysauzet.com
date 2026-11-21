import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

describe('presenceUrl', () => {
  beforeEach(() => {
    HTMLElement.prototype.showPopover = () => {};
  });

  afterEach(() => {
    Reflect.deleteProperty(HTMLElement.prototype, 'showPopover');
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  const load = async () => (await import('./availability')).presenceUrl;

  it('connects in production only from the site itself, not from another alias', async () => {
    vi.stubEnv('NEXT_PUBLIC_VERCEL_ENV', 'production');
    Reflect.deleteProperty(process.env, 'NEXT_PUBLIC_PRESENCE_URL');

    expect((await load())()).toBeUndefined();
  });

  it('connects anywhere to a room named explicitly, as a local one', async () => {
    vi.stubEnv('NEXT_PUBLIC_PRESENCE_URL', 'ws://localhost:8787');

    expect((await load())()).toBe('ws://localhost:8787');
  });

  it('stays away from a browser without popovers', async () => {
    vi.stubEnv('NEXT_PUBLIC_PRESENCE_URL', 'ws://localhost:8787');
    Reflect.deleteProperty(HTMLElement.prototype, 'showPopover');

    expect((await load())()).toBeUndefined();
  });
});
