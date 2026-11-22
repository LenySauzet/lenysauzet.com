import { getTranslations } from 'next-intl/server';

import { projects, type Project } from '@/content/projects';
import { distribute, laneOf, WORK_ID } from '@/lib/masonry';
import { resolveMedia } from '@/lib/media/cdn';
import { probeImage, type ImageMeta } from '@/lib/media/probe';
import { cn } from '@/lib/utils';

import { ProjectCard } from './ProjectCard';
import { Reveal } from './Reveal';

const ACTION_ROW_RATIO = 0.14;

const LAYOUTS = [
  { columns: 1, className: 'flex md:hidden' },
  { columns: 2, className: 'hidden md:flex lg:hidden' },
  { columns: 3, className: 'hidden lg:flex' },
];

interface Tile {
  project: Project;
  image: ImageMeta;
}

export async function Projects({ className }: { className?: string }) {
  const t = await getTranslations('Projects');
  const tiles: Tile[] = await Promise.all(
    projects.map(async (project) => ({ project, image: await probeImage(resolveMedia(project.image)) }))
  );
  const sized = tiles.map((tile) => ({
    item: tile,
    height: tile.image.height / tile.image.width + (tile.project.action ? ACTION_ROW_RATIO : 0),
  }));

  return (
    <section id={WORK_ID} aria-labelledby="work-heading" className={cn('px-4 pb-16 lg:px-6', className)}>
      <h2 id="work-heading" className="sr-only">
        {t('heading')}
      </h2>
      {LAYOUTS.map(({ columns, className: shown }) => (
        <div key={columns} className={cn('gap-4', shown)}>
          {distribute(sized, columns).map((lane, index, lanes) => (
            <div
              key={index}
              data-lane={laneOf(index, lanes.length)}
              className="flex min-w-0 flex-1 flex-col gap-4 self-start"
            >
              {lane.map(({ project, image }) => (
                <Reveal key={project.title}>
                  <ProjectCard project={project} image={image} />
                </Reveal>
              ))}
            </div>
          ))}
        </div>
      ))}
    </section>
  );
}
