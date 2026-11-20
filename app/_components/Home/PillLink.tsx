'use client';

import type { ComponentProps, ComponentType } from 'react';

import { pillSurface } from '@/components/shared/styles';
import { useAnimatedIcon, type AnimatedIconProps } from '@/hooks/use-animated-icon';
import { cn } from '@/lib/utils';

interface PillLinkProps extends ComponentProps<'a'> {
  icon: ComponentType<AnimatedIconProps>;
  label: string;
}

export function PillLink({ icon: Icon, label, className, ...anchor }: PillLinkProps) {
  const { icon, trigger } = useAnimatedIcon();

  return (
    <a {...anchor} {...trigger} className={cn(pillSurface, 'gap-2 px-5 text-sm font-medium', className)}>
      <Icon ref={icon} className="size-4" />
      {label}
    </a>
  );
}
