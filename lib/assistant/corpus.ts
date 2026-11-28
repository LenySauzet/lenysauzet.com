import type { Blog, Corpus } from './knowledge/corpus';
import { readBlog } from './knowledge/blog';
import { readKnowledge } from './knowledge/load';

const BLOG_FRESH_MS = 15 * 60 * 1000;

let knowledge: ReturnType<typeof readKnowledge> | undefined;
let blog: { reading: Promise<Blog>; at: number } | undefined;

const freshBlog = (now: number) => {
  if (!blog || now - blog.at > BLOG_FRESH_MS) {
    const reading = readBlog().then(({ posts, complete }) => ({ posts, complete }));
    blog = { reading, at: now };
    reading.catch(() => (blog = undefined));
  }
  return blog.reading;
};

export async function currentCorpus(now = Date.now()): Promise<Corpus> {
  if (!knowledge) {
    knowledge = readKnowledge();
    knowledge.catch(() => (knowledge = undefined));
  }
  const [facts, posts] = await Promise.all([knowledge, freshBlog(now)]);
  return { ...facts, blog: posts };
}
