import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import type { Project } from '@/content/projects';

import { ProjectCard } from './ProjectCard';

const dimensions = { width: 1200, height: 630 };
const project = (fields: Partial<Project>): Project => ({ title: 'Atrean', year: '2025', image: 'atrean.jpg', ...fields });

describe('ProjectCard', () => {
  it('links the article to the blog post that tells it', () => {
    render(<ProjectCard project={project({ article: 'atrean' })} dimensions={dimensions} />);

    expect(screen.getByRole('link', { name: 'Read article' })).toHaveAttribute(
      'href',
      'https://blog.lenysauzet.com/posts/atrean'
    );
  });

  it('opens the app in a new tab', () => {
    render(<ProjectCard project={project({ app: 'https://atrean.com' })} dimensions={dimensions} />);

    const app = screen.getByRole('link', { name: 'View app' });
    expect(app).toHaveAttribute('href', 'https://atrean.com');
    expect(app).toHaveAttribute('target', '_blank');
  });

  it('names the project and its year over the media, and offers nothing to open when there is nothing', () => {
    render(<ProjectCard project={project({})} dimensions={dimensions} />);

    expect(screen.getByRole('heading', { name: 'Atrean' })).toBeInTheDocument();
    expect(screen.getByText('2025')).toBeInTheDocument();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  it('plays a video over its still when the project has one', () => {
    const { container } = render(
      <ProjectCard project={project({ video: 'atrean.mp4' })} dimensions={dimensions} />
    );

    const video = container.querySelector('video');
    expect(video).toHaveAttribute('poster', 'https://cdn.lenysauzet.com/portfolio/atrean.jpg');
    expect(video?.querySelector('source')).toHaveAttribute('src', 'https://cdn.lenysauzet.com/portfolio/atrean.mp4');
  });
});
