import { describe, expect, it } from 'vitest';

import { postUrlsOf, readBlog } from './blog';

const BLOG = 'https://blog.test';

const posts = (...slugs: string[]) =>
  slugs.map((slug) => `<item><title>${slug}</title><link>${BLOG}/posts/${slug}</link></item>`).join('\n');

const clean = (...slugs: string[]) => `<rss><channel><link>${BLOG}</link>${posts(...slugs)}</channel></rss>`;

const feed = (...slugs: string[]) => `<rss><channel>
  <link>${BLOG}</link>
  ${posts(...slugs)}
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
  it('keeps the posts of this blog only, never the channel link, and names what it ignored', () => {
    expect(postUrlsOf(feed('shaders', 'octrees'), BLOG)).toEqual({
      urls: [`${BLOG}/posts/shaders`, `${BLOG}/posts/octrees`],
      ignored: ['https://elsewhere.test/posts/intruder', `${BLOG}/posts/shaders/comments`],
    });
  });

  it('reads a link in CDATA or with a trailing slash, and counts a repeated post once', () => {
    const items = [
      `<item><link><![CDATA[${BLOG}/posts/shaders/]]></link></item>`,
      `<item rdf:about="x"><link>${BLOG}/posts/shaders</link></item>`,
      '<item><title>No link</title></item>',
    ];

    expect(postUrlsOf(`<rss>${items.join('')}</rss>`, BLOG)).toEqual({
      urls: [`${BLOG}/posts/shaders`],
      ignored: ['an item without a link'],
    });
  });
});

describe('readBlog', () => {
  it('reads every post from its Markdown twin', async () => {
    const reading = await readBlog(
      BLOG,
      fakeFetch({
        [`${BLOG}/rss`]: clean('shaders'),
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

  it('calls a feed that answers but lists no post incomplete, never an empty blog', async () => {
    const reading = await readBlog(BLOG, fakeFetch({ [`${BLOG}/rss`]: '<html>Maintenance</html>' }));

    expect(reading).toEqual({ posts: [], complete: false, warnings: ['The feed lists no post'] });
  });

  it('calls a feed with items it cannot place incomplete, so their posts are never reported missing', async () => {
    const reading = await readBlog(
      BLOG,
      fakeFetch({ [`${BLOG}/rss`]: feed('shaders'), [`${BLOG}/posts/shaders/index.md`]: twin('Shaders') })
    );

    expect(reading.posts.map((post) => post.slug)).toEqual(['shaders']);
    expect(reading.complete).toBe(false);
    expect(reading.warnings).toEqual([
      'The feed lists an item that is not a post of the blog: https://elsewhere.test/posts/intruder',
      `The feed lists an item that is not a post of the blog: ${BLOG}/posts/shaders/comments`,
    ]);
  });

  it('keeps the posts that answered when one does not', async () => {
    const reading = await readBlog(
      BLOG,
      fakeFetch({
        [`${BLOG}/rss`]: clean('shaders', 'octrees'),
        [`${BLOG}/posts/shaders/index.md`]: twin('Shaders'),
      })
    );

    expect(reading.posts.map((post) => post.slug)).toEqual(['shaders']);
    expect(reading.complete).toBe(false);
    expect(reading.warnings).toEqual([`A post was left out: ${BLOG}/posts/octrees/index.md answered 404`]);
  });
});
