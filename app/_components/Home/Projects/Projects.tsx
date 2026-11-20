import { projects as all, type Project } from '@/content/projects';
import { distribute } from '@/lib/masonry';
import { resolveMedia } from '@/lib/media/cdn';
import { measureImage, type Dimensions } from '@/lib/media/measure';
import { cn } from '@/lib/utils';

import { ProjectCard } from './ProjectCard';
import { Reveal } from './Reveal';

const ACTIONS = 0.14;

interface Measured {
  project: Project;
  dimensions: Dimensions;
}

const LAYOUTS = [
  { columns: 1, className: 'flex md:hidden' },
  { columns: 2, className: 'hidden md:flex lg:hidden' },
  { columns: 3, className: 'hidden lg:flex' },
];

export async function Projects({ className }: { className?: string }) {
  const measured: Measured[] = await Promise.all(
    all.map(async (project) => ({ project, dimensions: await measureImage(resolveMedia(project.image)) }))
  );
  const tiles = measured.map((item) => ({
    item,
    height: item.dimensions.height / item.dimensions.width + (item.project.article || item.project.app ? ACTIONS : 0),
  }));

  return (
    <section id="work" aria-labelledby="work-heading" className={cn('px-4 pb-32 lg:px-6', className)}>
      <h2 id="work-heading" className="sr-only">
        Work
      </h2>
      {LAYOUTS.map(({ columns, className: shown }) => (
        <div key={columns} className={cn('gap-4', shown)}>
          {distribute(tiles, columns).map((column, index) => (
            <div key={index} className="flex min-w-0 flex-1 flex-col gap-4">
              {column.map(({ project, dimensions }) => (
                <Reveal key={project.title}>
                  <ProjectCard project={project} dimensions={dimensions} />
                </Reveal>
              ))}
            </div>
          ))}
        </div>
      ))}
    </section>
  );
}
