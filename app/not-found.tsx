import { ArrowLeft02Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import type { Metadata } from 'next';
import Link from 'next/link';

import { StatusPage } from './_components/StatusPage';

export const metadata: Metadata = { title: 'Page not found' };

export default function NotFound() {
  return (
    <StatusPage status="404" title="This page does not exist">
      <p>It may have moved, or the link was mistyped. Everything else starts from the home page.</p>
      <Link
        href="/"
        className="group inline-flex items-center gap-1 text-subtle-foreground transition-colors duration-200 hover:text-foreground"
      >
        <HugeiconsIcon
          icon={ArrowLeft02Icon}
          size={22}
          strokeWidth={1.5}
          className="transition-transform duration-400 group-hover:-translate-x-[5px] motion-reduce:transition-none"
        />
        Home
      </Link>
    </StatusPage>
  );
}
