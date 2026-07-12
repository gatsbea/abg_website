import { getCollection, type CollectionEntry } from 'astro:content';

/**
 * Blog posts visible in the current environment, newest first.
 * Drafts are visible in `npm run dev` and absent from production builds —
 * this is the ONE place that rule lives. Query the blog through this helper only.
 */
export async function getPublishedPosts(): Promise<CollectionEntry<'blog'>[]> {
  const posts = await getCollection('blog', ({ data }) => import.meta.env.DEV || !data.draft);
  return posts.sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());
}
