import { pillSurface } from '@/components/shared/styles';
import { cn } from '@/lib/utils';

import { HomeLink, type HomeLinkProps } from './HomeLink';
import { StatusPage } from './StatusPage';

export interface ErrorProps {
  error: Error & { digest?: string };
  retry: () => void;
}

interface ErrorBodyProps extends Pick<ErrorProps, 'retry'> {
  heading: string;
  message: string;
  home: Omit<HomeLinkProps, 'className'>;
  retryLabel: string;
  className?: string;
}

export function ErrorBody({ heading, message, home, retryLabel, retry, className }: ErrorBodyProps) {
  return (
    <StatusPage status="Error" title={heading} className={className}>
      <p>{message}</p>
      <div className="flex items-center gap-6">
        <HomeLink {...home} />
        <button type="button" onClick={retry} className={cn(pillSurface, 'cursor-pointer px-5 text-sm font-medium')}>
          {retryLabel}
        </button>
      </div>
    </StatusPage>
  );
}
