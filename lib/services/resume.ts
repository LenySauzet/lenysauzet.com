import { Download01Icon } from '@hugeicons/core-free-icons';

import { announce } from '@/hooks/use-island-store';

export const RESUME_ROUTE = '/resume';

export const announceResume = () => announce('Downloading my resume', Download01Icon);

export const resumeAnchor = { href: RESUME_ROUTE, download: true, onClick: announceResume };
