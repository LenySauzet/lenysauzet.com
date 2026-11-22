'use client';

import { useTranslations } from 'next-intl';

import { AnimatedArrowRightIcon } from '@/components/icons/AnimatedArrowRightIcon';
import { AnimatedArrowUpRightIcon } from '@/components/icons/AnimatedArrowUpRightIcon';
import { focusRing } from '@/components/shared/styles';
import siteConfig from '@/config/site';
import type { ProjectAction } from '@/content/projects';
import { useAnimatedIcon } from '@/hooks/use-animated-icon';
import { cn } from '@/lib/utils';

interface ProjectLinkProps {
  action: ProjectAction;
  project: string;
  className?: string;
}

export function ProjectLink({ action, project, className }: ProjectLinkProps) {
  const t = useTranslations('Projects');
  const { icon, trigger } = useAnimatedIcon();
  const external = action.kind !== 'article';
  const Icon = external ? AnimatedArrowUpRightIcon : AnimatedArrowRightIcon;
  const label = t(action.kind);

  return (
    <a
      href={external ? action.href : `${siteConfig.blogUrl}/posts/${action.slug}`}
      {...(external && { target: '_blank', rel: 'noopener noreferrer' })}
      {...trigger}
      aria-label={t(external ? 'externalLabel' : 'label', { action: label, project })}
      className={cn(
        'flex h-11 items-center justify-center gap-1.5 rounded-xl bg-well text-sm text-muted-foreground transition-colors duration-200 hover:bg-well-hover hover:text-foreground',
        focusRing,
        className
      )}
    >
      {label}
      <Icon ref={icon} className="size-4" />
    </a>
  );
}
