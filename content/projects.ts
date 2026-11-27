import siteConfig from '@/config/site';

export type ProjectAction = { kind: 'article'; slug: string } | { kind: 'app' | 'source'; href: string };

export interface Project {
  slug: string;
  title: string;
  year: string;
  image: string;
  video?: string;
  action?: ProjectAction;
}

const source = (repository: string): ProjectAction => ({
  kind: 'source',
  href: `${siteConfig.social.github}/${repository}`,
});

export const projects: Project[] = [
  { slug: 'ankhora', title: 'Ankhora', year: '2026', image: 'projects/ankhora/cover.jpg', action: source('Ankhora') },
  {
    slug: 'gitglow',
    title: 'GitGlow',
    year: '2026',
    image: 'projects/gitglow/cover.jpg',
    action: { kind: 'app', href: 'https://gitglow.lenysauzet.com' },
  },
  {
    slug: 'blog',
    title: 'The Blog',
    year: '2026',
    image: 'projects/blog/cover.jpg',
    action: { kind: 'app', href: 'https://blog.lenysauzet.com' },
  },
  {
    slug: 'travel-order-resolver',
    title: 'Travel Order Resolver',
    year: '2026',
    image: 'projects/travel-order-resolver/cover.jpg',
    action: source('travel-order-resolver'),
  },
  {
    slug: 'python-distributed-task-queue',
    title: 'Distributed Task Queue',
    year: '2026',
    image: 'projects/python-distributed-task-queue/cover.jpg',
    action: source('python-distributed-task-queue'),
  },
  {
    slug: 'q-learning-taxi-v3',
    title: 'Taxi v3 Q-Learning',
    year: '2026',
    image: 'projects/q-learning-taxi-v3/cover.jpg',
    action: source('q-learning-taxi-v3'),
  },
  {
    slug: 'my-quest',
    title: 'Meta Quest Referral Hub',
    year: '2026',
    image: 'projects/my-quest/cover.jpg',
    action: { kind: 'app', href: 'https://my-quest-eight.vercel.app' },
  },
  {
    slug: 'lms-platform',
    title: 'LMS Platform',
    year: '2026',
    image: 'projects/lms-platform/cover.jpg',
    action: source('lms-platform'),
  },
  {
    slug: 'robot-eyes',
    title: 'Animated Robot Eyes',
    year: '2026',
    image: 'projects/robot-eyes/cover.jpg',
    action: source('OTO-BOT'),
  },
  { slug: 'trigrid', title: 'TriGrid', year: '2026', image: 'projects/trigrid/cover.jpg', action: source('TriGrid') },
  {
    slug: 'db-administration-software',
    title: 'DB Administration Software',
    year: '2026',
    image: 'projects/db-administration-software/cover.jpg',
    action: source('DB-Administration-Software'),
  },
  { slug: 'hangman', title: 'Hangman', year: '2026', image: 'projects/hangman/cover.jpg', action: source('Hangman') },
  {
    slug: 'intelligent-ai-chatbot',
    title: 'Intelligent AI Chatbot',
    year: '2025',
    image: 'projects/intelligent-ai-chatbot/cover.jpg',
    action: source('intelligent-ai-chatbot'),
  },
  {
    slug: 'pneumonia-classifier',
    title: 'Pneumonia Classifier',
    year: '2025',
    image: 'projects/pneumonia-classifier/cover.jpg',
    action: source('pneumonia-classifier'),
  },
];
