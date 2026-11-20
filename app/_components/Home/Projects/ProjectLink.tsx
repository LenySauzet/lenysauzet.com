'use client';

import { ArrowRight02Icon } from '@/components/ui/arrow-right-02';
import { ArrowUpRight01Icon } from '@/components/ui/arrow-up-right-01';
import siteConfig from '@/config/site';
import type { ProjectAction } from '@/content/projects';
import { useAnimatedIcon } from '@/hooks/use-animated-icon';

const LABELS = { article: 'Read article', app: 'View app', source: 'View code' };

export function ProjectLink({ action }: { action: ProjectAction }) {
  const { icon, trigger } = useAnimatedIcon();
  const external = action.kind !== 'article';
  const Icon = external ? ArrowUpRight01Icon : ArrowRight02Icon;

  return (
    <a
      href={external ? action.href : `${siteConfig.blogUrl}/posts/${action.slug}`}
      {...(external && { target: '_blank', rel: 'noopener noreferrer' })}
      {...trigger}
      className="flex h-11 items-center justify-center gap-1.5 rounded-xl bg-well text-sm text-muted-foreground outline-none transition-colors duration-200 hover:bg-well-hover hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary"
    >
      {LABELS[action.kind]}
      <Icon ref={icon} size={16} />
    </a>
  );
}
