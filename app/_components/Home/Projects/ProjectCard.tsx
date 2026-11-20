import { ArrowRight02Icon, ArrowUpRight01Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react';
import Image from 'next/image';

import siteConfig from '@/config/site';
import type { Project } from '@/content/projects';
import { resolveMedia } from '@/lib/media/cdn';
import type { Dimensions } from '@/lib/media/measure';
import { cn } from '@/lib/utils';

import { ProjectVideo } from './ProjectVideo';

const WELL = 'flex h-11 flex-1 items-center justify-center gap-1.5 rounded-xl bg-well text-sm';

interface ProjectCardProps {
  project: Project;
  dimensions: Dimensions;
  className?: string;
}

function Action({ href, label, icon, external }: { href: string; label: string; icon: IconSvgElement; external?: boolean }) {
  return (
    <a
      href={href}
      {...(external && { target: '_blank', rel: 'noopener noreferrer' })}
      className={cn(
        WELL,
        'group/action text-muted-foreground outline-none transition-colors duration-200 hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary'
      )}
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

export function ProjectCard({ project, dimensions, className }: ProjectCardProps) {
  const image = resolveMedia(project.image);

  return (
    <article className={cn('flex flex-col gap-1.5 rounded-2xl border bg-card p-1.5', className)}>
      <div
        className="relative overflow-hidden rounded-xl bg-well"
        style={{ aspectRatio: `${dimensions.width} / ${dimensions.height}` }}
      >
        {project.video ? (
          <ProjectVideo src={resolveMedia(project.video)} poster={image} className="size-full object-cover" />
        ) : (
          <Image
            src={image}
            alt=""
            width={dimensions.width}
            height={dimensions.height}
            sizes="(min-width: 64rem) 33vw, (min-width: 48rem) 50vw, 100vw"
            className="size-full object-cover"
          />
        )}
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

      {(project.article || project.app) && (
        <div className="flex gap-1.5">
          {project.article && (
            <Action href={`${siteConfig.blogUrl}/posts/${project.article}`} label="Read article" icon={ArrowRight02Icon} />
          )}
          {project.app && <Action href={project.app} label="View app" icon={ArrowUpRight01Icon} external />}
        </div>
      )}
    </article>
  );
}
