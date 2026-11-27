import siteConfig from '@/config/site';

import { parsePost, type Post } from './corpus';

const ITEM_LINK = /<item>[\s\S]*?<link>\s*([^<\s]+)\s*<\/link>[\s\S]*?<\/item>/g;
const POST_PATH = /^\/posts\/[a-z0-9-]+$/;
const TIMEOUT_MS = 8000;

export function postUrlsOf(feed: string, blogUrl = siteConfig.blogUrl) {
  const { origin } = new URL(blogUrl);
  return [...feed.matchAll(ITEM_LINK)].flatMap((match) => {
    const url = URL.parse(match[1]!);
    return url?.origin === origin && POST_PATH.test(url.pathname) ? [url.href] : [];
  });
}

export interface BlogReading {
  posts: Post[];
  complete: boolean;
  warnings: string[];
}

export async function readBlog(blogUrl = siteConfig.blogUrl, fetcher: typeof fetch = fetch): Promise<BlogReading> {
  const get = async (url: string) => {
    const response = await fetcher(url, { signal: AbortSignal.timeout(TIMEOUT_MS) });
    if (!response.ok) throw new Error(`${url} answered ${response.status}`);
    return response.text();
  };

  let urls: string[];
  try {
    urls = postUrlsOf(await get(`${blogUrl}/rss`), blogUrl);
  } catch (error) {
    return { posts: [], complete: false, warnings: [`The blog's feed could not be read: ${(error as Error).message}`] };
  }

  const readings = await Promise.allSettled(
    urls.map(async (url) => parsePost(url.slice(url.lastIndexOf('/') + 1), url, await get(`${url}/index.md`)))
  );
  const posts = readings.flatMap((reading) => (reading.status === 'fulfilled' ? [reading.value] : []));
  const warnings = readings.flatMap((reading) =>
    reading.status === 'rejected' ? [`A post was left out: ${(reading.reason as Error).message}`] : []
  );
  return { posts, complete: warnings.length === 0, warnings };
}
