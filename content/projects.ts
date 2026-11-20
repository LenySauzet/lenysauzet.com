export interface Project {
  title: string;
  year: string;
  image: string;
  app?: string;
  article?: string;
}

export const projects: Project[] = [
  {
    title: 'The Blog',
    year: '2025',
    image: 'https://blog.lenysauzet.com/opengraph-image',
    app: 'https://blog.lenysauzet.com',
    article: 'design-system',
  },
];
