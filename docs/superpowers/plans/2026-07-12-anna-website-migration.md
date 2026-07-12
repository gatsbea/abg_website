# Anna Gatdula Website Migration — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a fast, statically-generated Astro site for Anna Gatdula that replaces her Squarespace site and lets her publish blog posts from Scrivener via a drag-and-drop GitHub upload, hosted free on Cloudflare Pages.

**Architecture:** Astro static site. Academic pages are hand-authored `.astro` pages. The blog is an Astro content collection: one Markdown file per post in `src/content/blog/`, validated by a Zod schema (the safety net). Cloudflare Pages' native Git integration builds and deploys on every push to `main`; a build failure skips the deploy and leaves the last good version live. Anna publishes by editing 5 plain-text frontmatter fields in Scrivener, compiling to Markdown, and dragging the file into the repo on github.com.

**Tech Stack:** Astro 6, `@astrojs/rss`, `astro:content` (content layer / `glob` loader), Zod (bundled), Playwright (smoke tests), Node ≥22, npm, Cloudflare Pages (hosting).

**Companion design doc:** [`docs/superpowers/specs/2026-07-12-anna-website-migration-design.md`](../specs/2026-07-12-anna-website-migration-design.md)

## Global Constraints

- **Node ≥ 22.12.0.** Astro 6 requires it.
- **Package manager: npm.** Commit `package-lock.json`.
- **Site URL:** `https://www.annagatdula.com` (set as `site` in `astro.config.mjs`; used for RSS/sitemap absolute URLs). The `www` host is the current canonical.
- **Blog lives at `/blog`** on the same domain and identity.
- **Draft-safety invariant (do not break):** every query over the `blog` collection goes through the single helper `getPublishedPosts()` in `src/utils/posts.ts`, which applies `import.meta.env.DEV || !data.draft` — drafts are visible in `npm run dev`, absent from production builds. Do NOT re-inline this predicate in individual pages; the helper is the one source of truth (used by the blog index, the post route, and the RSS feed).
- **Frontmatter fields (the contract with Anna's Scrivener template):** `title` (string), `pubDate` (date), `description` (string, optional), `tags` (string array, optional), `draft` (boolean, default false). YAML uses straight quotes and spaces (never tabs).
- **Indentation/formatting:** follow Astro + Prettier defaults (2-space). No `.astro` starter cruft left behind.
- **Every deployable state builds cleanly:** `npm run build` must exit 0 at the end of every task.

---

## File Structure

```
abg_website/
├── astro.config.mjs               site URL, integrations
├── package.json                   scripts + deps
├── tsconfig.json
├── playwright.config.ts           boots `build && preview`, tests prod output
├── README.md                      dev/build/deploy commands (for Caleb/Claude)
├── src/
│   ├── content.config.ts          blog collection Zod schema (safety net)
│   ├── utils/
│   │   └── posts.ts               getPublishedPosts() — single draft-filter source
│   ├── layouts/
│   │   └── Layout.astro           <head> meta, header, footer, nav slot
│   ├── components/
│   │   ├── Header.astro           site title + nav
│   │   └── Footer.astro           copyright
│   ├── pages/
│   │   ├── index.astro            Home
│   │   ├── about.astro
│   │   ├── research.astro
│   │   ├── publications.astro
│   │   ├── teaching.astro
│   │   ├── public-work.astro
│   │   ├── cv-and-contact.astro
│   │   ├── blog.astro             blog index (published posts, newest first)
│   │   ├── blog/[...slug].astro   individual post page
│   │   └── rss.xml.js             RSS 2.0 feed at /rss.xml
│   ├── content/
│   │   └── blog/
│   │       ├── welcome.md         seed published post
│   │       └── _draft-example.md  seed draft post (proves the filter)
│   └── styles/
│       └── global.css             design tokens + base styles (re-skinnable)
├── public/
│   ├── blog/                      blog images (Anna uploads here, occasional)
│   ├── headshot.webp              migrated from Squarespace
│   └── cv.pdf                     Anna's CV (placeholder until provided)
├── tests/
│   └── smoke.spec.ts              home loads, blog lists published, draft 404s
└── docs/
    ├── ANNA-PUBLISHING-GUIDE.md   one-page cheat sheet for Anna
    └── SCRIVENER-SETUP.md         how Caleb configures Anna's Scrivener compile
```

---

## Phase A — Project scaffold & build foundation

### Task A1: Initialize the Astro project (Operational + code)

**Files:**
- Create: `package.json`, `astro.config.mjs`, `tsconfig.json`, `.gitignore`, `src/pages/index.astro` (temporary placeholder)

- [ ] **Step 1: Initialize git and Astro**

```bash
cd /Users/calebsponheim/Documents/Git/abg_website
git init
npm create astro@latest . -- --template minimal --no-install --no-git --typescript strict --yes
```
If `npm create astro` refuses because the directory is non-empty (the `docs/` folder exists), scaffold into a temp dir and copy files in:
```bash
npm create astro@latest ../_abg_tmp -- --template minimal --no-install --no-git --typescript strict --yes
rsync -a --exclude docs ../_abg_tmp/ ./
rm -rf ../_abg_tmp
```

- [ ] **Step 2: Add dependencies**

```bash
npm install
npm install @astrojs/rss
npm install -D @playwright/test
npx playwright install
```

- [ ] **Step 3: Set the site URL in `astro.config.mjs`**

```js
// @ts-check
import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://www.annagatdula.com',
});
```

- [ ] **Step 4: Verify it builds**

Run: `npm run build`
Expected: exits 0, writes `dist/`.

- [ ] **Step 5: Commit (includes the design doc + this plan)**

```bash
git add -A
git commit -m "chore: scaffold Astro project + commit design docs"
```

---

### Task A2: Layout, header, footer, global styles (re-skinnable foundation)

The visual design is deliberately minimal and token-driven so Anna's later input is a low-friction reskin (edit `global.css` variables), not a rebuild.

**Files:**
- Create: `src/layouts/Layout.astro`, `src/components/Header.astro`, `src/components/Footer.astro`, `src/styles/global.css`

**Interfaces:**
- Produces: `Layout.astro` with `interface Props { title: string; description?: string }`, rendering `<slot />` inside `<main>`. Consumed by every page.

- [ ] **Step 1: `src/styles/global.css` — design tokens + base**

```css
:root {
  /* Reskin surface: change these to change the whole look. */
  --color-bg: #ffffff;
  --color-text: #1a1a1a;
  --color-muted: #595959;
  --color-accent: #6b2d2d;
  --color-rule: #e6e6e6;
  --font-body: Georgia, 'Times New Roman', serif;
  --font-ui: system-ui, -apple-system, sans-serif;
  --measure: 68ch;
  --space: 1rem;
}

* { box-sizing: border-box; }
html { font-size: 18px; }
body {
  margin: 0;
  background: var(--color-bg);
  color: var(--color-text);
  font-family: var(--font-body);
  line-height: 1.6;
}
main { max-width: var(--measure); margin: 0 auto; padding: 2rem var(--space) 4rem; }
h1, h2, h3, nav, .site-title { font-family: var(--font-ui); }
a { color: var(--color-accent); }
img { max-width: 100%; height: auto; }
figure { margin: 1.5rem 0; }
figcaption { font: 0.85rem/1.4 var(--font-ui); color: var(--color-muted); }
hr { border: none; border-top: 1px solid var(--color-rule); margin: 2rem 0; }
```

- [ ] **Step 2: `src/components/Header.astro`**

```astro
---
const links = [
  { href: '/', label: 'Home' },
  { href: '/about', label: 'About' },
  { href: '/research', label: 'Research' },
  { href: '/publications', label: 'Publications' },
  { href: '/teaching', label: 'Teaching' },
  { href: '/public-work', label: 'Public Work' },
  { href: '/blog', label: 'Blog' },
  { href: '/cv-and-contact', label: 'CV & Contact' },
];
---
<header>
  <a class="site-title" href="/">Anna Gatdula</a>
  <nav>
    {links.map((l) => <a href={l.href}>{l.label}</a>)}
  </nav>
</header>
<style>
  header { max-width: var(--measure); margin: 0 auto; padding: 1.5rem var(--space) 0; }
  .site-title { font-size: 1.4rem; font-weight: 700; text-decoration: none; color: var(--color-text); }
  nav { display: flex; flex-wrap: wrap; gap: 0.9rem; margin-top: 0.75rem; padding-bottom: 1rem; border-bottom: 1px solid var(--color-rule); }
  nav a { font-size: 0.9rem; text-decoration: none; }
  nav a:hover { text-decoration: underline; }
</style>
```

- [ ] **Step 3: `src/components/Footer.astro`**

```astro
<footer>
  <p>© {new Date().getFullYear()} Anna Gatdula. Please request permission before reusing content.</p>
</footer>
<style>
  footer { max-width: var(--measure); margin: 0 auto; padding: 2rem var(--space); border-top: 1px solid var(--color-rule); }
  footer p { font: 0.8rem/1.5 var(--font-ui); color: var(--color-muted); }
</style>
```

- [ ] **Step 4: `src/layouts/Layout.astro`**

```astro
---
import '../styles/global.css';
import Header from '../components/Header.astro';
import Footer from '../components/Footer.astro';

interface Props {
  title: string;
  description?: string;
}
const { title, description = 'Anna Gatdula — scholar of opera, spectacle, and the cultural history of the atomic bomb.' } = Astro.props;
---
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>{title}</title>
    <meta name="description" content={description} />
    <link rel="alternate" type="application/rss+xml" title="Anna Gatdula — Blog" href="/rss.xml" />
  </head>
  <body>
    <Header />
    <main>
      <slot />
    </main>
    <Footer />
  </body>
</html>
```

- [ ] **Step 5: Build check + commit**

Run: `npm run build`
Expected: exits 0.
```bash
git add -A && git commit -m "feat: layout, header, footer, global styles"
```

---

## Phase B — Blog content collection (the core pipeline)

### Task B1: Blog collection schema + seed posts (with the draft-safety test)

This task establishes the frontmatter contract and proves the draft filter with an automated test — the single most important safety property in the design.

**Files:**
- Create: `src/content.config.ts`, `src/utils/posts.ts`, `src/content/blog/welcome.md`, `src/content/blog/_draft-example.md`, `playwright.config.ts`, `tests/smoke.spec.ts`
- Modify: `package.json` (add `test:e2e` script)

**Interfaces:**
- Produces: collection `blog` with schema `{ title: string; pubDate: Date; description?: string; tags: string[]; draft: boolean }`. Entry `id` = filename without extension (the URL slug).
- Produces: `getPublishedPosts(): Promise<CollectionEntry<'blog'>[]>` in `src/utils/posts.ts` — the ONLY approved way to query blog posts, returning them newest-first with drafts filtered per the draft-safety invariant. Consumed by Tasks B2, B3, C1.

- [ ] **Step 1: `src/content.config.ts`**

```ts
import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    pubDate: z.coerce.date(),
    description: z.string().optional(),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
  }),
});

export const collections = { blog };
```

- [ ] **Step 1b: `src/utils/posts.ts` — the single draft-filter source**

```ts
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
```

- [ ] **Step 2: Seed a published post — `src/content/blog/welcome.md`**

```markdown
---
title: "Welcome"
pubDate: 2026-07-12
description: "A first note on this new home for my writing."
tags: ["meta"]
draft: false
---

This is the first post on my new site. More soon.
```

- [ ] **Step 3: Seed a draft post — `src/content/blog/_draft-example.md`**

```markdown
---
title: "Draft Example Do Not Publish"
pubDate: 2026-07-12
description: "This should never appear on the live site."
draft: true
---

If you can see this on the live site, the draft filter is broken.
```

- [ ] **Step 4: `playwright.config.ts` — test the PRODUCTION build**

Drafts only hide in the build, so tests must run against `astro build && astro preview`, not the dev server.

```ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  webServer: {
    command: 'npm run build && npm run preview',
    url: 'http://localhost:4321',
    reuseExistingServer: false,
    timeout: 120_000,
  },
  use: { baseURL: 'http://localhost:4321' },
});
```

- [ ] **Step 5: Add the test script to `package.json`**

Add to `"scripts"`: `"test:e2e": "playwright test"`.

- [ ] **Step 6: Write the failing test — `tests/smoke.spec.ts`**

```ts
import { test, expect } from '@playwright/test';

test('home page loads', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.site-title')).toHaveText('Anna Gatdula');
});

test('blog index lists the published post', async ({ page }) => {
  await page.goto('/blog');
  await expect(page.getByRole('link', { name: 'Welcome' })).toBeVisible();
});

test('draft post is absent from the blog index', async ({ page }) => {
  await page.goto('/blog');
  await expect(page.getByText('Draft Example Do Not Publish')).toHaveCount(0);
});

test('draft post URL is not generated (404)', async ({ page }) => {
  const res = await page.goto('/blog/_draft-example');
  expect(res?.status()).toBe(404);
});
```

- [ ] **Step 7: Run — expect FAIL (blog index/route not built yet)**

Run: `npm run test:e2e`
Expected: FAIL — `/blog` has no content yet (Tasks B2/B3 build it). This test is the acceptance gate for Phase B; it passes once B2 and B3 are done. Proceed to B2.

---

### Task B2: Blog index page

**Files:**
- Create: `src/pages/blog.astro`

**Interfaces:**
- Consumes: `getPublishedPosts()` from B1 (`src/utils/posts.ts`).
- Produces: `/blog` listing published posts newest-first, each linking to `/blog/{id}`.

- [ ] **Step 1: `src/pages/blog.astro`**

```astro
---
import { getPublishedPosts } from '../utils/posts';
import Layout from '../layouts/Layout.astro';

const posts = await getPublishedPosts();

const fmt = new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
---
<Layout title="Blog — Anna Gatdula">
  <h1>Blog</h1>
  <ul class="post-list">
    {posts.map((post) => (
      <li>
        <a href={`/blog/${post.id}`}>{post.data.title}</a>
        <time datetime={post.data.pubDate.toISOString()}>{fmt.format(post.data.pubDate)}</time>
        {post.data.description && <p>{post.data.description}</p>}
      </li>
    ))}
  </ul>
</Layout>
<style>
  .post-list { list-style: none; padding: 0; }
  .post-list li { margin-bottom: 1.75rem; }
  .post-list a { font-family: var(--font-ui); font-size: 1.15rem; font-weight: 600; text-decoration: none; }
  .post-list time { display: block; font: 0.8rem/1.4 var(--font-ui); color: var(--color-muted); margin-top: 0.15rem; }
  .post-list p { margin: 0.3rem 0 0; color: var(--color-muted); }
</style>
```

- [ ] **Step 2: Build check**

Run: `npm run build`
Expected: exits 0.
```bash
git add -A && git commit -m "feat: blog collection schema, seed posts, index page"
```

---

### Task B3: Individual post page

**Files:**
- Create: `src/pages/blog/[...slug].astro`

**Interfaces:**
- Consumes: `getPublishedPosts()` from B1, `render(entry)` from `astro:content`.
- Produces: a static page per non-draft post at `/blog/{id}`. Drafts get no page (the 404 test in B1 depends on this).

- [ ] **Step 1: `src/pages/blog/[...slug].astro`**

```astro
---
import { render } from 'astro:content';
import { getPublishedPosts } from '../../utils/posts';
import Layout from '../../layouts/Layout.astro';

export async function getStaticPaths() {
  const posts = await getPublishedPosts();
  return posts.map((post) => ({ params: { slug: post.id }, props: { post } }));
}

const { post } = Astro.props;
const { Content } = await render(post);
const fmt = new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
---
<Layout title={`${post.data.title} — Anna Gatdula`} description={post.data.description}>
  <article>
    <h1>{post.data.title}</h1>
    <time datetime={post.data.pubDate.toISOString()}>{fmt.format(post.data.pubDate)}</time>
    <Content />
  </article>
</Layout>
<style>
  article time { display: block; font: 0.85rem/1.4 var(--font-ui); color: var(--color-muted); margin-bottom: 2rem; }
</style>
```

- [ ] **Step 2: Run the full Phase B test suite — expect PASS**

Run: `npm run test:e2e`
Expected: all 4 tests PASS (home loads, blog lists Welcome, draft absent from index, draft URL 404s).

- [ ] **Step 3: Commit**

```bash
git add -A && git commit -m "feat: individual blog post pages + passing draft-safety tests"
```

---

## Phase C — RSS feed

### Task C1: RSS 2.0 feed at /rss.xml

**Files:**
- Create: `src/pages/rss.xml.js`
- Modify: `tests/smoke.spec.ts` (add feed assertions)

**Interfaces:**
- Consumes: `getPublishedPosts()` from B1, `context.site` (from `astro.config.mjs`).

- [ ] **Step 1: Write the failing test — append to `tests/smoke.spec.ts`**

```ts
test('rss feed includes published post and excludes drafts', async ({ request }) => {
  const res = await request.get('/rss.xml');
  expect(res.status()).toBe(200);
  const body = await res.text();
  expect(body).toContain('<title>Welcome</title>');
  expect(body).not.toContain('Draft Example Do Not Publish');
});
```

- [ ] **Step 2: Run — expect FAIL**

Run: `npm run test:e2e -- -g "rss feed"`
Expected: FAIL (404, no feed yet).

- [ ] **Step 3: `src/pages/rss.xml.js`**

```js
import rss from '@astrojs/rss';
import { getPublishedPosts } from '../utils/posts';

export async function GET(context) {
  const posts = await getPublishedPosts();

  return rss({
    title: 'Anna Gatdula — Blog',
    description: 'Writing on opera, spectacle, and the cultural history of the atomic bomb.',
    site: context.site,
    items: posts.map((post) => ({
      title: post.data.title,
      pubDate: post.data.pubDate,
      description: post.data.description,
      link: `/blog/${post.id}/`,
    })),
  });
}
```

- [ ] **Step 4: Run — expect PASS, then commit**

Run: `npm run test:e2e -- -g "rss feed"`
Expected: PASS.
```bash
git add -A && git commit -m "feat: RSS feed at /rss.xml"
```

---

## Phase D — Static academic pages (content migration)

### Task D1: Migrate the seven academic pages from live content

Faithfully port the existing Squarespace prose. The executor pulls the current live text as a **starting draft**; Caleb/Anna refine wording later. Do not invent scholarly facts — if a page can't be fetched, leave a clearly-marked `TODO(caleb): paste content` block rather than fabricating.

**Files:**
- Create: `src/pages/index.astro`, `about.astro`, `research.astro`, `publications.astro`, `teaching.astro`, `public-work.astro`, `cv-and-contact.astro` (replace the A1 placeholder index)
- Add asset: `public/headshot.webp`, `public/cv.pdf` (placeholder if not yet provided)

- [ ] **Step 1: Fetch live text for each page**

For each of `/`, `/about`, `/research`, `/publications`, `/teaching`, `/public-work`, `/cv-and-contact` on `https://www.annagatdula.com`, fetch the visible text (WebFetch or equivalent) and save it verbatim as the body of the corresponding page. Preserve headings and paragraph structure.

- [ ] **Step 2: Author each page against the Layout**

Pattern for every page (example — `about.astro`):

```astro
---
import Layout from '../layouts/Layout.astro';
---
<Layout title="About — Anna Gatdula">
  <h1>About</h1>
  <!-- Migrated prose from https://www.annagatdula.com/about -->
  <p>…</p>
</Layout>
```

`index.astro` additionally renders the headshot:

```astro
---
import Layout from '../layouts/Layout.astro';
---
<Layout title="Anna Gatdula">
  <img src="/headshot.webp" alt="Anna Gatdula" width="240" style="border-radius:4px;" />
  <h1>Anna Gatdula</h1>
  <p><!-- intro/bio lede from home page --></p>
</Layout>
```

`cv-and-contact.astro` links the PDF: `<a href="/cv.pdf">Download CV (PDF)</a>` plus contact info.

- [ ] **Step 3: Save the headshot**

Download the headshot from the live site to `public/headshot.webp` (convert to `.webp` if the source is JPG/PNG). Add a placeholder `public/cv.pdf` if Anna hasn't provided the real one, with a `TODO(caleb)` note in the page.

- [ ] **Step 4: Build check + visual review**

Run: `npm run build` (expect 0), then `npm run dev` and eyeball each of the 8 routes at `http://localhost:4321`.
Note: the "shopping cart" from Squarespace is intentionally dropped (design §8.8).

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: migrate academic pages + assets from Squarespace"
```

---

### Task D2: README for maintainers

**Files:**
- Create: `README.md`

- [ ] **Step 1: `README.md`**

```markdown
# annagatdula.com

Astro static site. Blog posts are Markdown files in `src/content/blog/`.

## Commands
- `npm run dev` — dev server at http://localhost:4321 (drafts visible here)
- `npm run build` — static build to ./dist (drafts excluded)
- `npm run preview` — serve the production build locally
- `npm run test:e2e` — Playwright smoke tests (builds first)

## Publishing
See `docs/ANNA-PUBLISHING-GUIDE.md`. Hosting: Cloudflare Pages (auto-deploys on push to `main`).
A failed build leaves the last successful deploy live.
```

- [ ] **Step 2: Commit**

```bash
git add -A && git commit -m "docs: maintainer README"
```

---

## Phase E — Deploy on Cloudflare Pages (Operational — Caleb)

Not agent-automatable: requires a Cloudflare account and GitHub authorization. No CI YAML is needed — Cloudflare Pages' Git integration builds on push and gives every deployment a preview URL.

### Task E1: Push repo to GitHub

- [ ] Create a new GitHub repository (private or public) named `abg_website` (or `annagatdula-site`).
- [ ] `git remote add origin <url>` → `git branch -M main` → `git push -u origin main`.
- [ ] Verify the code is on GitHub, including `src/content/blog/`.

### Task E2: Connect Cloudflare Pages

- [ ] In the Cloudflare dashboard → **Workers & Pages → Create → Pages → Connect to Git** → authorize GitHub → select the repo.
- [ ] Build settings: **Framework preset = Astro**, **Build command = `npm run build`**, **Build output directory = `dist`**, **Node version = 22** (set env var `NODE_VERSION=22` if needed).
- [ ] Deploy. Confirm the site loads on the temporary `*.pages.dev` URL.
- [ ] **Verification (the whole point of the test URL):** click through all 8 pages, open `/blog`, `/blog/welcome`, `/rss.xml`. Confirm the draft example does NOT appear anywhere.

### Task E3: Prove the failure-safety property

- [ ] On a throwaway branch, commit a post with broken YAML (e.g. an unclosed quote). Push.
- [ ] Confirm Cloudflare reports a **failed build** and the previously deployed site is **unchanged** (still live).
- [ ] Delete the throwaway branch. This validates design §4.4 before Anna ever touches it.

---

## Phase F — Scrivener authoring kit (Caleb sets up once)

### Task F1: Write Anna's publishing cheat sheet

**Files:**
- Create: `docs/ANNA-PUBLISHING-GUIDE.md`

- [ ] **Step 1: `docs/ANNA-PUBLISHING-GUIDE.md`**

```markdown
# Publishing a Post (Anna's Guide)

You write in Scrivener and publish in about 5 minutes. Four steps.

## 1. Write in Scrivener
Open the **"Blog Post Template"** project. At the very top you'll see this block —
edit the five lines, then write your post below it:

    ---
    title: "Your Post Title"
    pubDate: 2026-07-12
    description: "One sentence for previews and search results."
    tags: ["opera", "nuclear"]
    draft: true
    ---

- **title** — your headline, in straight quotes.
- **pubDate** — today's date as YEAR-MONTH-DAY (e.g. 2026-07-12).
- **description** — one sentence.
- **tags** — a few topics in quotes, separated by commas. Or delete the line.
- **draft** — leave `true` while writing. Change to `false` when ready to publish.

## 2. Compile to Markdown
**File → Compile** → choose the **"Blog (Markdown)"** format → **Compile** →
save the file with a short lowercase name using hyphens, e.g. `opera-and-the-bomb.md`.
(That filename becomes the web address: /blog/opera-and-the-bomb)

## 3. Upload to GitHub
1. Go to the repository → open the folder **src/content/blog/**.
2. Click **Add file → Upload files**.
3. Drag your `.md` file in.
4. Click **Commit changes**.

## 4. Wait ~2 minutes
The site rebuilds itself and your post goes live. To check it first, ask Caleb for
the preview link.

## Fixing a typo later
Open the post's file on GitHub, click the ✏️ pencil, edit, **Commit changes**.

## Adding a picture (occasional)
1. Upload the image to **public/blog/** on GitHub (same drag-and-drop).
2. In your post, write: `![description](/blog/your-image.jpg "Optional caption")`

## If something looks wrong
You can't break the live site. If an upload has a mistake, the site simply keeps
showing the last good version until it's fixed. Ping Caleb.
```

- [ ] **Step 2: Commit**

```bash
git add -A && git commit -m "docs: Anna publishing cheat sheet"
```

### Task F2: Document + build the Scrivener compile setup (Operational — Caleb, in the Scrivener app)

**Files:**
- Create: `docs/SCRIVENER-SETUP.md`

- [ ] **Step 1: Write `docs/SCRIVENER-SETUP.md`** capturing these one-time steps so they're reproducible:
  1. Create a Scrivener project named **"Blog Post Template"**.
  2. Add a first document containing the literal frontmatter block (the 5 fields wrapped in `---`), typed as **plain text** so it compiles verbatim. Style it with a "Raw" / preserve-formatting style so Scrivener doesn't smarten the quotes.
  3. **Compile settings:** File → Compile → format **Markdown** (or MultiMarkdown). Duplicate it, name it **"Blog (Markdown)"**. Disable "smart quotes" / typographic substitutions (straight quotes required for YAML). Ensure the frontmatter document is included and output first.
  4. Test-compile the seeded content and confirm the output opens as valid Markdown with a clean `---` frontmatter block.
- [ ] **Step 2: Verify end-to-end:** compile a test post, upload it via the GitHub web flow, confirm it deploys and renders. Then delete the test post.
- [ ] **Step 3: Commit the doc.**

```bash
git add -A && git commit -m "docs: Scrivener compile setup for Caleb"
```

---

## Phase G — Domain cutover & Squarespace decommission (Operational — Caleb)

Sequenced so the live site is never broken (design §6.2). **Do not start until Phase E verification passed on the `*.pages.dev` URL.**

### Task G1: Point the domain at Cloudflare Pages

- [ ] In Cloudflare Pages → the project → **Custom domains** → add `www.annagatdula.com` and `annagatdula.com`.
- [ ] Update DNS at the current registrar (Squarespace): either change nameservers to Cloudflare (if adding the zone to Cloudflare) or add the CNAME/records Cloudflare Pages specifies. Prefer moving the DNS zone to Cloudflare for the one-dashboard benefit.
- [ ] Set the apex→www (or www→apex) redirect consistently with the canonical `site` URL (`https://www.annagatdula.com`).
- [ ] Wait for DNS propagation; confirm `https://www.annagatdula.com` serves the new site over HTTPS (Cloudflare provisions the cert automatically).

### Task G2: Verify on the real domain

- [ ] Click through all pages, the blog, a post, and `/rss.xml` on the production domain.
- [ ] Check on mobile and desktop widths.

### Task G3: Decommission Squarespace

- [ ] Only after G2 passes: cancel the Squarespace **site subscription** (stop paying for the website builder).
- [ ] Keep the **domain registration** active (do not let it lapse). Confirm auto-renew is on wherever it now lives.

### Task G4 (optional, later): Transfer the registrar

- [ ] Not on the critical path. When convenient, unlock the domain, get the auth/EPP code, and transfer registration to **Cloudflare Registrar** (at-cost renewal). Allow several days; the site stays live throughout because DNS/hosting are already on Cloudflare.

---

## Self-Review — spec coverage

- Design §2–3 (Astro static, architecture) → Phases A, B. ✅
- Design §4.1 (frontmatter contract) → Task B1 schema + Task F1 guide. ✅
- Design §4.2 (publishing ritual) → Task F1 cheat sheet + Task F2 Scrivener setup. ✅
- Design §4.3 (images) → Task F1 "Adding a picture" + `public/blog/` in structure. ✅
- Design §4.4 (broken build can't break live site) → Task E3 explicit proof + draft tests in B1/B3. ✅
- Design §5 (content migration) → Task D1. ✅
- Design §6.1 (Cloudflare Pages) → Phase E. ✅
- Design §6.2 (de-risked domain cutover) → Phase G, gated on Phase E. ✅
- Design §7 (division of labor) → Operational tasks (E, F2, G) marked Caleb; code tasks agent-buildable. ✅
- Design §8.4 (RSS at launch) → Phase C. ✅
- Design §8.5 (OG images deferred) → intentionally omitted (phase 2). ✅
- Design §8.6–8.8 (publications simple list, CV PDF, cart dropped) → Task D1. ✅
- Design §10 success criteria → the cheat sheet (F1), failure-safety proof (E3), and $0 hosting (E2) each map to a criterion. ✅

**Deferred to phase 2 (not in this plan, by design):** OG share images, comments, newsletter, analytics, tag pages, search.
```
