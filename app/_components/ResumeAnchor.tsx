'use client';

import type { ComponentProps } from 'react';

import { useResumeAnchor } from '@/hooks/use-resume-anchor';
import type { resumeLink } from '@/lib/services/resume';

export function ResumeAnchor(props: Omit<ComponentProps<'a'>, keyof ReturnType<typeof resumeLink>>) {
  return <a {...useResumeAnchor()} {...props} />;
}
