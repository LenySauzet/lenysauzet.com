import { ArrowRight02Icon, ArrowUpRight01Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import Image from 'next/image';

import { Button } from '@/components/ui/button';
import siteConfig from '@/config/site';
import type { Project } from '@/content/projects';
import { resolveImage } from '@/lib/media/cdn';
import type { Dimensions } from '@/lib/media/measure';
import { cn } from '@/lib/utils';

interface ProjectCardProps {
  project: Project;
  dimensions: Dimensions;
  className?: string;
}

export function ProjectCard({ project, dimensions, className }: ProjectCardProps) {
  return (
    <article className={cn('flex flex-col gap-1.5 rounded-2xl border bg-card p-1.5', className)}>
      <div className="overflow-hidden rounded-xl bg-muted" style={{ aspectRatio: `${dimensions.width} / ${dimensions.height}` }}>
        <Image
          src={resolveImage(project.image)}
          alt=""
          width={dimensions.width}
          height={dimensions.height}
          sizes="(min-width: 64rem) 33vw, (min-width: 48rem) 50vw, 100vw"
          className="size-full object-cover"
        />
      </div>

      <div className="flex items-baseline justify-between gap-4 px-2.5 py-1.5">
        <h3 className="truncate text-sm font-medium">{project.title}</h3>
        <span className="shrink-0 font-mono text-xs text-subtle-foreground">{project.year}</span>
      </div>

      <div className="flex gap-1.5">
        {project.article && (
          <Button asChild variant="secondary" className="h-10 flex-1 rounded-xl">
            <a href={`${siteConfig.blogUrl}/posts/${project.article}`}>
              Read article
              <HugeiconsIcon icon={ArrowRight02Icon} strokeWidth={2} data-icon="inline-end" />
            </a>
          </Button>
        )}
        {project.app && (
          <Button asChild variant="secondary" className="h-10 flex-1 rounded-xl">
            <a href={project.app} target="_blank" rel="noopener noreferrer">
              View app
              <HugeiconsIcon icon={ArrowUpRight01Icon} strokeWidth={2} data-icon="inline-end" />
            </a>
          </Button>
        )}
        {!project.article && !project.app && (
          <p className="grid h-10 flex-1 place-items-center rounded-xl bg-muted/50 text-sm text-subtle-foreground">
            Article coming soon
          </p>
        )}
      </div>
    </article>
  );
}
