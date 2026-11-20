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

  it('says an article is coming when there is nothing to open yet', () => {
    render(<ProjectCard project={project({})} dimensions={dimensions} />);

    expect(screen.queryByRole('link')).not.toBeInTheDocument();
    expect(screen.getByText('Article coming soon')).toBeInTheDocument();
  });
});
