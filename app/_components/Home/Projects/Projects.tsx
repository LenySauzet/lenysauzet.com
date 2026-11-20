import { projects as all, type Project } from '@/content/projects';
import { distribute } from '@/lib/masonry';
import { resolveMedia } from '@/lib/media/cdn';
import { probeImage, type Probe } from '@/lib/media/probe';
import { cn } from '@/lib/utils';

import { ProjectCard } from './ProjectCard';
import { Reveal } from './Reveal';

const ACTION = 0.14;

interface Measured {
  project: Project;
  probe: Probe;
}

const LAYOUTS = [
  { columns: 1, className: 'flex md:hidden' },
  { columns: 2, className: 'hidden md:flex lg:hidden' },
  { columns: 3, className: 'hidden lg:flex' },
];

export async function Projects({ className }: { className?: string }) {
  const measured: Measured[] = await Promise.all(
    all.map(async (project) => ({ project, probe: await probeImage(resolveMedia(project.image)) }))
  );
  const tiles = measured.map((item) => ({
    item,
    height: item.probe.height / item.probe.width + (item.project.action ? ACTION : 0),
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
              {column.map(({ project, probe }) => (
                <Reveal key={project.title}>
                  <ProjectCard project={project} probe={probe} />
                </Reveal>
              ))}
            </div>
          ))}
        </div>
      ))}
    </section>
  );
}
