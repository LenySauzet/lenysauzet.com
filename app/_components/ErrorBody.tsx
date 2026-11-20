import { pillSurface } from '@/components/shared/styles';
import { cn } from '@/lib/utils';

import { HomeLink } from './HomeLink';
import { StatusPage } from './StatusPage';

export interface ErrorProps {
  error: Error & { digest?: string };
  retry: () => void;
}

interface ErrorBodyProps extends Pick<ErrorProps, 'retry'> {
  subject: string;
  className?: string;
}

export function ErrorBody({ subject, retry, className }: ErrorBodyProps) {
  return (
    <StatusPage status="Error" title="Something went wrong" className={className}>
      <p>{subject} failed to load. Trying again usually fixes it.</p>
      <div className="flex items-center gap-6">
        <HomeLink />
        <button type="button" onClick={retry} className={cn(pillSurface, 'cursor-pointer px-5 text-sm font-medium')}>
          Try again
        </button>
      </div>
    </StatusPage>
  );
}
