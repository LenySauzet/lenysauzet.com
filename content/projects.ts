export type ProjectAction = { kind: 'article'; slug: string } | { kind: 'app' | 'source'; href: string };

export interface Project {
  title: string;
  year: string;
  image: string;
  video?: string;
  action?: ProjectAction;
}

export const projects: Project[] = [
  {
    title: 'The Blog',
    year: '2025',
    image: 'https://blog.lenysauzet.com/opengraph-image',
    action: { kind: 'app', href: 'https://blog.lenysauzet.com' },
  },
];
