import { afterEach, describe, expect, it, vi } from 'vitest';

import { watchOverlays } from './overlays';

const settle = () => new Promise((resolve) => setTimeout(resolve, 0));

describe('watchOverlays', () => {
  afterEach(() => {
    document.body.removeAttribute('data-scroll-locked');
    document.body.replaceChildren();
  });

  it('reports a modal dialog locking the page, then its closing', async () => {
    const changed = vi.fn();
    const stop = watchOverlays(changed);

    document.body.setAttribute('data-scroll-locked', '1');
    await settle();
    document.body.removeAttribute('data-scroll-locked');
    await settle();
    stop();

    expect(changed.mock.calls).toEqual([[true], [false]]);
  });

  it("sees cal.com's modal hidden by its close button, which leaves its state loaded", async () => {
    const changed = vi.fn();
    const stop = watchOverlays(changed);

    const modal = document.createElement('cal-modal-box');
    modal.setAttribute('state', 'loaded');
    modal.style.visibility = 'visible';
    document.body.append(modal);
    await settle();
    modal.style.visibility = 'hidden';
    await settle();
    stop();

    expect(changed.mock.calls).toEqual([[true], [false]]);
  });

  it("follows cal.com's modal from opening to closed", async () => {
    const changed = vi.fn();
    const stop = watchOverlays(changed);

    const modal = document.createElement('cal-modal-box');
    modal.setAttribute('state', 'loading');
    document.body.append(modal);
    await settle();
    modal.setAttribute('state', 'loaded');
    await settle();
    modal.setAttribute('state', 'closed');
    await settle();
    stop();

    expect(changed.mock.calls).toEqual([[true], [false]]);
  });
});
