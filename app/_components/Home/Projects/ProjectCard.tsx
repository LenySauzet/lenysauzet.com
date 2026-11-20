import { ArrowRight02Icon, ArrowUpRight01Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';

import siteConfig from '@/config/site';
import type { Project, ProjectAction } from '@/content/projects';
import { resolveMedia } from '@/lib/media/cdn';
import type { Probe } from '@/lib/media/probe';
import { cn } from '@/lib/utils';

import { ProjectMedia } from './ProjectMedia';

interface ProjectCardProps {
  project: Project;
  probe: Probe;
  className?: string;
}

const ACTIONS = {
  article: { label: 'Read article', icon: ArrowRight02Icon },
  app: { label: 'View app', icon: ArrowUpRight01Icon },
  source: { label: 'View code', icon: ArrowUpRight01Icon },
};

function Action({ action }: { action: ProjectAction }) {
  const { label, icon } = ACTIONS[action.kind];
  const external = action.kind !== 'article';

  return (
    <a
      href={external ? action.href : `${siteConfig.blogUrl}/posts/${action.slug}`}
      {...(external && { target: '_blank', rel: 'noopener noreferrer' })}
      className="group/action flex h-11 items-center justify-center gap-1.5 rounded-xl bg-well text-sm text-muted-foreground outline-none transition-colors duration-200 hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary"
    >
      {label}
      <HugeiconsIcon
        icon={icon}
        strokeWidth={2}
        className="size-4 transition-[translate] duration-200 group-hover/action:translate-x-0.5 motion-reduce:transition-none"
      />
    </a>
  );
}

export function ProjectCard({ project, probe, className }: ProjectCardProps) {
  return (
    <article className={cn('flex flex-col gap-1.5 rounded-2xl border bg-card p-1.5', className)}>
      <div className="relative overflow-hidden rounded-xl bg-well" style={{ aspectRatio: `${probe.width} / ${probe.height}` }}>
        <ProjectMedia
          image={resolveMedia(project.image)}
          video={project.video && resolveMedia(project.video)}
          probe={probe}
        />
        <div
          aria-hidden
          className="absolute inset-x-0 bottom-0 h-28 backdrop-blur-[3px] mask-[linear-gradient(to_top,black_30%,transparent)]"
        />
        <div aria-hidden className="absolute inset-x-0 bottom-0 h-28 bg-linear-to-t from-scrim/70 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 flex items-baseline justify-between gap-4 px-4 pb-3.5 text-sm text-media-ink">
          <h3 className="truncate font-medium">{project.title}</h3>
          <span className="shrink-0 tabular-nums text-media-ink/80">{project.year}</span>
        </div>
      </div>

      {project.action && <Action action={project.action} />}
    </article>
  );
}
