'use client';

import type { ComponentProps } from 'react';

import { resumeAnchor } from '@/lib/services/resume';

export function ResumeAnchor(props: Omit<ComponentProps<'a'>, keyof typeof resumeAnchor>) {
  return <a {...resumeAnchor} {...props} />;
}
