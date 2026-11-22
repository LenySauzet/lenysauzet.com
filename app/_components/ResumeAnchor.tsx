'use client';

import type { ComponentProps } from 'react';

import { useResumeAnchor } from '@/hooks/use-resume-anchor';

export function ResumeAnchor(props: Omit<ComponentProps<'a'>, 'href' | 'download' | 'onClick'>) {
  return <a {...useResumeAnchor()} {...props} />;
}
