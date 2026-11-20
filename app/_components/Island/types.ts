import type { ReactNode } from 'react';

export interface IslandState {
  id: string;
  width?: string;
  message?: string;
  render: () => ReactNode;
}
