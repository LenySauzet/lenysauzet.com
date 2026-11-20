export type ProjectAction = { kind: 'article'; slug: string } | { kind: 'app' | 'source'; href: string };

export interface Project {
  title: string;
  year: string;
  image: string;
  video?: string;
  action?: ProjectAction;
}

const source = (repository: string): ProjectAction => ({
  kind: 'source',
  href: `https://github.com/LenySauzet/${repository}`,
});

export const projects: Project[] = [
  { title: 'Ankhora', year: '2026', image: 'projects/ankhora/cover.jpg', action: source('Ankhora') },
  {
    title: 'GitGlow',
    year: '2026',
    image: 'projects/gitglow/cover.jpg',
    action: { kind: 'app', href: 'https://gitglow.lenysauzet.com' },
  },
  {
    title: 'The Blog',
    year: '2025',
    image: 'https://blog.lenysauzet.com/opengraph-image',
    action: { kind: 'app', href: 'https://blog.lenysauzet.com' },
  },
  {
    title: 'Travel Order Resolver',
    year: '2026',
    image: 'projects/travel-order-resolver/cover.jpg',
    action: source('travel-order-resolver'),
  },
  {
    title: 'Distributed Task Queue',
    year: '2026',
    image: 'projects/python-distributed-task-queue/cover.jpg',
    action: source('python-distributed-task-queue'),
  },
  {
    title: 'Taxi v3 Q-Learning',
    year: '2026',
    image: 'projects/q-learning-taxi-v3/cover.jpg',
    action: source('q-learning-taxi-v3'),
  },
  {
    title: 'Meta Quest Referral Hub',
    year: '2026',
    image: 'projects/my-quest/cover.jpg',
    action: { kind: 'app', href: 'https://my-quest-eight.vercel.app' },
  },
  { title: 'LMS Platform', year: '2026', image: 'projects/lms-platform/cover.jpg', action: source('lms-platform') },
  { title: 'Animated Robot Eyes', year: '2026', image: 'projects/robot-eyes/cover.jpg', action: source('OTO-BOT') },
  { title: 'TriGrid', year: '2026', image: 'projects/trigrid/cover.jpg', action: source('TriGrid') },
  {
    title: 'DB Administration Software',
    year: '2026',
    image: 'projects/db-administration-software/cover.jpg',
    action: source('DB-Administration-Software'),
  },
  { title: 'Hangman', year: '2026', image: 'projects/hangman/cover.jpg', action: source('Hangman') },
  {
    title: 'Intelligent AI Chatbot',
    year: '2025',
    image: 'projects/intelligent-ai-chatbot/cover.jpg',
    action: source('intelligent-ai-chatbot'),
  },
  {
    title: 'Pneumonia Classifier',
    year: '2025',
    image: 'projects/pneumonia-classifier/cover.jpg',
    action: source('pneumonia-classifier'),
  },
];
