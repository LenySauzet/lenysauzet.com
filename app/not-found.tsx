import type { Metadata } from 'next';

import { HomeLink } from './_components/HomeLink';
import { StatusPage } from './_components/StatusPage';

export const metadata: Metadata = { title: 'Page not found', alternates: { canonical: null } };

export default function NotFound() {
  return (
    <main>
      <StatusPage status="404" title="This page does not exist">
        <p>It may have moved, or the link was mistyped. Everything else starts from the home page.</p>
        <HomeLink />
      </StatusPage>
    </main>
  );
}
