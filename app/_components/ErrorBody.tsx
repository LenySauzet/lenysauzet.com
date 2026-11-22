import type { Messages } from 'next-intl';

import { pillSurface } from '@/components/shared/styles';
import { cn } from '@/lib/utils';

import { HomeLink } from './HomeLink';
import { StatusPage } from './StatusPage';

export interface ErrorProps {
  error: Error & { digest?: string };
  retry: () => void;
}

interface ErrorBodyProps extends Pick<ErrorProps, 'retry'> {
  status: Messages['Status'];
  message: string;
  homeHref: string;
  className?: string;
}

export function ErrorBody({ status, message, homeHref, retry, className }: ErrorBodyProps) {
  return (
    <StatusPage status="Error" title={status.errorHeading} className={className}>
      <p>{message}</p>
      <div className="flex items-center gap-6">
        <HomeLink href={homeHref} label={status.home} />
        <button type="button" onClick={retry} className={cn(pillSurface, 'cursor-pointer px-5 text-sm font-medium')}>
          {status.retry}
        </button>
      </div>
    </StatusPage>
  );
}
