import siteConfig from '@/config/site';
import { hasFinePointer } from '@/lib/browser';

const supportsPopover = () => 'showPopover' in HTMLElement.prototype;

export function presenceUrl() {
  const { presenceUrl: url, presenceOrigin } = siteConfig;
  if (!url || !supportsPopover()) return undefined;
  return presenceOrigin && window.location.origin !== presenceOrigin ? undefined : url;
}

export const presenceAvailable = () => hasFinePointer() && presenceUrl() !== undefined;
