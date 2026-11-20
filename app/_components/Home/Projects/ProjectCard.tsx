import type { Project } from '@/content/projects';
import { resolveMedia } from '@/lib/media/cdn';
import type { Probe } from '@/lib/media/probe';
import { cn } from '@/lib/utils';

import { ProjectLink } from './ProjectLink';
import { ProjectMedia } from './ProjectMedia';

interface ProjectCardProps {
  project: Project;
  probe: Probe;
  className?: string;
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
          className="absolute inset-x-0 bottom-0 h-20 backdrop-blur-[3px] mask-[linear-gradient(to_top,black_30%,transparent)]"
        />
        <div aria-hidden className="absolute inset-x-0 bottom-0 h-20 bg-linear-to-t from-scrim/95 via-scrim/50 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 flex items-baseline justify-between gap-4 px-4 pb-3.5 text-sm text-media-ink">
          <h3 className="truncate font-medium">{project.title}</h3>
          <span className="shrink-0 tabular-nums">{project.year}</span>
        </div>
      </div>

      {project.action && <ProjectLink action={project.action} />}
    </article>
  );
}
