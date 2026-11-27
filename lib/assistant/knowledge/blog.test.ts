import { describe, expect, it } from 'vitest';

import { postUrlsOf, readBlog } from './blog';

const BLOG = 'https://blog.test';

const feed = (...slugs: string[]) => `<rss><channel>
  <link>${BLOG}</link>
  ${slugs.map((slug) => `<item><title>${slug}</title><link>${BLOG}/posts/${slug}</link></item>`).join('\n')}
  <item><link>https://elsewhere.test/posts/intruder</link></item>
  <item><link>${BLOG}/posts/shaders/comments</link></item>
</channel></rss>`;

const twin = (title: string) => `---\ntitle: ${title}\ndescription: About ${title}.\ndate: 2026-07-19\n---\n\nBody.`;

const fakeFetch =
  (pages: Record<string, string>): typeof fetch =>
  async (input) => {
    const page = pages[String(input)];
    return new Response(page ?? 'Not found', { status: page === undefined ? 404 : 200 });
  };

describe('postUrlsOf', () => {
  it('keeps the posts of this blog only, never the channel link', () => {
    expect(postUrlsOf(feed('shaders', 'octrees'), BLOG)).toEqual([`${BLOG}/posts/shaders`, `${BLOG}/posts/octrees`]);
  });
});

describe('readBlog', () => {
  it('reads every post from its Markdown twin', async () => {
    const reading = await readBlog(
      BLOG,
      fakeFetch({
        [`${BLOG}/rss`]: feed('shaders'),
        [`${BLOG}/posts/shaders/index.md`]: twin('Shaders'),
      })
    );

    expect(reading).toMatchObject({ complete: true, warnings: [] });
    expect(reading.posts.map((post) => [post.id, post.title, post.url])).toEqual([
      ['post:shaders', 'Shaders', `${BLOG}/posts/shaders`],
    ]);
  });

  it('warns instead of failing when the feed is down', async () => {
    const reading = await readBlog(BLOG, fakeFetch({}));

    expect(reading.posts).toEqual([]);
    expect(reading.complete).toBe(false);
    expect(reading.warnings[0]).toMatch(/feed could not be read/);
  });

  it('keeps the posts that answered when one does not', async () => {
    const reading = await readBlog(
      BLOG,
      fakeFetch({
        [`${BLOG}/rss`]: feed('shaders', 'octrees'),
        [`${BLOG}/posts/shaders/index.md`]: twin('Shaders'),
      })
    );

    expect(reading.posts.map((post) => post.slug)).toEqual(['shaders']);
    expect(reading.complete).toBe(false);
    expect(reading.warnings).toEqual([`A post was left out: ${BLOG}/posts/octrees/index.md answered 404`]);
  });
});
