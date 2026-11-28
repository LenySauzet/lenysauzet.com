import siteConfig from '@/config/site';

import { parsePost, type Blog } from './corpus';

const ITEM = /<item\b[^>]*>([\s\S]*?)<\/item>/g;
const LINK = /<link>\s*(?:<!\[CDATA\[\s*)?([^<\s\]]+)/;
const POST_PATH = /^\/posts\/([a-z0-9-]+)\/?$/;
const TIMEOUT_MS = 8000;

export function postUrlsOf(feed: string, blogUrl = siteConfig.blogUrl) {
  const { origin } = new URL(blogUrl);
  const urls = new Set<string>();
  const ignored: string[] = [];
  for (const [, item] of feed.matchAll(ITEM)) {
    const link = item!.match(LINK)?.[1];
    const url = link ? URL.parse(link) : null;
    const slug = url?.origin === origin ? url.pathname.match(POST_PATH)?.[1] : undefined;
    if (slug) urls.add(`${origin}/posts/${slug}`);
    else ignored.push(link ?? 'an item without a link');
  }
  return { urls: [...urls], ignored };
}

export interface BlogReading extends Blog {
  warnings: string[];
}

export async function readBlog(blogUrl = siteConfig.blogUrl, fetcher: typeof fetch = fetch): Promise<BlogReading> {
  const get = async (url: string) => {
    const response = await fetcher(url, { signal: AbortSignal.timeout(TIMEOUT_MS) });
    if (!response.ok) throw new Error(`${url} answered ${response.status}`);
    return response.text();
  };

  let feed: ReturnType<typeof postUrlsOf>;
  try {
    feed = postUrlsOf(await get(`${blogUrl}/rss`), blogUrl);
  } catch (error) {
    return { posts: [], complete: false, warnings: [`The blog's feed could not be read: ${(error as Error).message}`] };
  }
  const warnings = feed.ignored.map((link) => `The feed lists an item that is not a post of the blog: ${link}`);
  if (!feed.urls.length) warnings.push('The feed lists no post');

  const readings = await Promise.allSettled(
    feed.urls.map(async (url) => parsePost(url.slice(url.lastIndexOf('/') + 1), url, await get(`${url}/index.md`)))
  );
  const posts = readings.flatMap((reading) => (reading.status === 'fulfilled' ? [reading.value] : []));
  for (const reading of readings) {
    if (reading.status === 'rejected') warnings.push(`A post was left out: ${(reading.reason as Error).message}`);
  }
  return { posts, complete: warnings.length === 0, warnings };
}
