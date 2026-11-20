import { cn } from '@/lib/utils';

export function HatchBand({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn(
        'relative hidden border-x border-border mask-[linear-gradient(to_bottom,black_70%,transparent)] lg:block',
        className
      )}
    >
      <div className="hatch absolute inset-0" />
    </div>
  );
}
