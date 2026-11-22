import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import type { Project } from '@/content/projects';
import { InEnglish } from '@/test/intl';

import { ProjectCard } from './ProjectCard';

const image = { width: 1200, height: 630 };
const project = (fields: Partial<Project>): Project => ({
  title: 'Atrean',
  year: '2025',
  image: 'atrean.jpg',
  ...fields,
});

describe('ProjectCard', () => {
  it('links the article to the blog post that tells it', () => {
    render(<ProjectCard project={project({ action: { kind: 'article', slug: 'atrean' } })} image={image} />, {
      wrapper: InEnglish,
    });

    expect(screen.getByRole('link', { name: 'Read article: Atrean' })).toHaveAttribute(
      'href',
      'https://blog.lenysauzet.com/posts/atrean'
    );
  });

  it.each([
    ['app', 'View app'],
    ['source', 'View code'],
  ] as const)('opens the %s in a new tab', (kind, name) => {
    render(<ProjectCard project={project({ action: { kind, href: 'https://atrean.com' } })} image={image} />, {
      wrapper: InEnglish,
    });

    const link = screen.getByRole('link', { name: `${name}: Atrean, in a new tab` });
    expect(link).toHaveAttribute('href', 'https://atrean.com');
    expect(link).toHaveAttribute('target', '_blank');
  });

  it('names the project and its year over the media, and offers nothing to open when there is nothing', () => {
    render(<ProjectCard project={project({})} image={image} />, { wrapper: InEnglish });

    expect(screen.getByRole('heading', { name: 'Atrean' })).toBeInTheDocument();
    expect(screen.getByText('2025')).toBeInTheDocument();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });
});
