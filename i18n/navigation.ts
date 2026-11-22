import { createNavigation } from 'next-intl/navigation';

import { routing } from './routing';

export const { getPathname, usePathname } = createNavigation(routing);
