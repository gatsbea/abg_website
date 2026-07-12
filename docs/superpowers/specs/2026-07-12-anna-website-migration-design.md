# Anna Gatdula Website — Migration & Blogging Workflow Design

**Date:** 2026-07-12
**Author:** Caleb Sponheim (with Claude)
**Status:** Draft for review
**Repo:** `abg_website` (to be initialized)

---

## 1. Summary

Move Anna Gatdula's personal academic website off Squarespace onto a self-hosted,
statically-generated **Astro** site — the same stack Caleb already runs for
`calebsponheim.com`. The site keeps its existing academic pages and adds a **blog**
that Anna can publish to from **Scrivener**, using a simple, repeatable ritual that
requires no terminal, no local git, and no CMS to maintain.

The guiding constraints:

- **Anna is "light touch."** She'll learn one repeatable publishing ritual, but should
  never have to touch a terminal, run git locally, or hand-edit site code.
- **Anna writes in Scrivener** and wants to keep doing so. The workflow must be
  Scrivener-native, not "re-paste into a web editor."
- **Caleb is the maintainer.** Matching his existing stack means near-zero new tech
  for him to learn or support.
- **Not fancy.** A clean, readable, fast academic site. No unnecessary features.

---

## 2. Why this stack (chosen approach)

**Approach A: Astro static site.** Chosen on its own merits (not to mirror any other site),
over a hosted CMS (Ghost/WordPress — monthly cost, redundant with Scrivener, a platform to
babysit) and over a different SSG (Hugo/Eleventy — fine, but Astro's content-collections and
Markdown story is the strongest fit for this content-driven site).

Why static + Astro is correct for this site:

- An academic site + low-frequency blog has no need for a database, server, or login.
  Content is the same for every visitor and changes rarely.
- Astro renders everything to plain HTML/CSS at **build** time → free hosting, nothing to
  patch or hack, near-zero running cost, and no backend that can go down. It ships zero
  JavaScript by default, so pages are fast and light.
- **Content collections** — Astro's typed Markdown system — are purpose-built for exactly
  this "a folder of Markdown files becomes a blog" pattern, with schema validation as a
  built-in safety net (see §4.1).
- The "dynamic" part (Anna publishing) happens at build time via a git commit, triggered
  through GitHub's web UI — not at serve time.
- *Bonus, not a driver:* Caleb has built an Astro site before, so the ecosystem is familiar
  — but the design decisions here are made independently for Anna's site.

---

## 3. Architecture at a glance

```
abg_website/                      (new GitHub repo)
├── src/
│   ├── content/
│   │   └── blog/                 One Markdown file per post (Anna uploads here)
│   ├── content.config.ts         Zod schema for blog frontmatter (the safety net)
│   ├── pages/                    Static academic pages + blog routes + rss + og
│   │   ├── index.astro           Home
│   │   ├── about.astro
│   │   ├── research.astro
│   │   ├── publications.astro
│   │   ├── teaching.astro
│   │   ├── public-work.astro
│   │   ├── cv-and-contact.astro
│   │   ├── blog.astro            Blog index (list of posts)
│   │   ├── blog/[...slug].astro  Individual post pages
│   │   ├── rss.xml.js            RSS feed
│   │   └── og/[...slug].ts       Auto-generated share images (optional, phase 2)
│   ├── layouts/Layout.astro      <head>, SEO/OG meta, nav, footer
│   ├── components/               Header, Footer, Nav
│   └── styles/global.css         Site CSS + typography variables
├── public/
│   └── blog/<slug>/              Blog images (occasional, uploaded via GitHub)
├── .github/workflows/deploy.yml  Build + deploy on every push to main
└── docs/                         This design doc lives here
```

Static pages (About, Research, etc.) are plain Astro pages Caleb builds once. The blog is
a **content collection**: Astro reads every `.md` file in `src/content/blog/`, validates
its frontmatter against a schema, and generates a page per post.

---

## 4. The heart of it: Scrivener → published post

This is the workflow Anna performs. Everything else is one-time setup.

### 4.1 The frontmatter (metadata) approach

Astro needs a small block of YAML metadata at the top of each post. Rather than fight
Scrivener's compile/metadata system, Anna types the frontmatter **as plain text** at the
very top of her Scrivener document. A template project (set up once) starts every new post
with this pre-filled block:

```yaml
---
title: "My Post Title"
pubDate: 2026-07-12
description: "One-sentence summary for search results and previews."
tags: ["opera", "nuclear"]
draft: true
---
```

Anna edits five obvious fields. That's the entire "learn a little" ask. When she compiles,
this block passes straight through to the Markdown file as valid frontmatter.

- `draft: true` → the post is invisible on the live site (visible only in local dev). This
  lets Anna commit work-in-progress safely. Flip to `false` (or delete the line) to publish.
- The schema in `content.config.ts` validates these fields at build time, so a typo produces
  a **clear, specific error** rather than a mysterious broken page.

### 4.2 The publishing ritual (Anna's repeatable steps)

1. **Write** in Scrivener as normal. Edit the five frontmatter fields at the top.
2. **Compile** → Markdown → save as `my-post-title.md` (a lowercase, hyphenated filename
   becomes the post's URL: `/blog/my-post-title`).
3. On **github.com**, open `src/content/blog/` → **Add file → Upload files** → drag the
   `.md` in → **Commit changes**.
4. GitHub Action **auto-builds and deploys** (~1–2 minutes). Post is live.

No terminal. No local git. No CMS login. The only new tool is GitHub's web uploader, which
is drag-and-drop.

**Editing a published post** (e.g. fixing a typo): open the file on github.com, click the
pencil icon, edit inline, commit. **Unpublishing:** set `draft: true` and commit.

### 4.3 Images (the occasional case)

Anna's content is text-forward scholarship, so images are treated as an **occasional,
documented add-on step**, not part of the everyday ritual:

- Upload image files to `public/blog/<slug>/` via the same GitHub drag-and-drop.
- Reference them in the post with `![alt text](/blog/<slug>/photo.jpg "Optional caption")`.

Trade-off: blog images skip Astro's build-time image optimization (which the static academic
pages can still use). For a low-traffic academic blog this is a deliberate simplicity win;
we can add optimized per-post image folders later if image-heavy posts become common.

### 4.4 Why a broken commit can't break the live site

Reassurance worth stating plainly to Anna:

- If a commit has malformed frontmatter, the **build fails** and the deploy is skipped.
  **The last successful version stays live.** A bad upload = a red ✗ in GitHub and no change
  to the site, never a broken public page.
- **Preview deploys** (see §6) give every commit its own temporary URL, so Anna can *see*
  her change before it reaches the real domain if she wants that confidence.

---

## 5. Content migration plan

The current Squarespace site has ~7 mostly-text pages and one headshot. Migration is manual
(Squarespace has no clean export for this) but small:

| Current page      | Becomes                        | Notes                                  |
|-------------------|--------------------------------|----------------------------------------|
| Home              | `index.astro`                  | Headshot + intro                       |
| About             | `about.astro`                  | Bio prose                              |
| Research          | `research.astro`               | Book project + interests               |
| Publications      | `publications.astro`           | List; consider a simple data file      |
| Teaching          | `teaching.astro`               | Pedagogy prose                         |
| Public Work       | `public-work.astro`            | Links out                              |
| CV & Contact      | `cv-and-contact.astro`         | CV (PDF?) + contact info               |
| — (new) —         | `blog.astro` + `content/blog/` | The new blogging capability            |

**Process:** Claude can pull the live text from each page (via web fetch) and scaffold the
Astro pages pre-populated, so Caleb reviews/tweaks rather than retypes. The headshot and any
CV PDF are downloaded and committed to `public/`. Estimated effort: a few hours, mostly
one-time, front-loaded onto Caleb (and Claude).

**Note on the "shopping cart":** the current site shows Squarespace commerce UI (0 items).
Assumed vestigial and dropped unless Anna actually sells something. *(Confirm — see §8.)*

---

## 6. Domain & hosting

### 6.1 Hosting — **decided: Cloudflare Pages**

Chosen on the merits for this project's shape (not to match any other site):

- Free, unlimited bandwidth, global CDN — $0/mo for a site this size.
- **Per-commit preview URLs** — makes the "Anna sees her post before it's public" safety
  story real (see §4.4).
- Connects directly to the GitHub repo and auto-builds on every push; Astro static output
  is trivial to deploy.
- **Registrar + DNS + hosting + previews in one dashboard.** Because this project also
  involves a domain, consolidating everything at Cloudflare is the single biggest reducer of
  Caleb's future support burden — one place to look when something's wrong — and Cloudflare
  Registrar renews domains at cost (~$10/yr) if `annagatdula.com` is transferred there later.

Netlify would be an equally capable choice; the domain-consolidation angle is what tips the
decision to Cloudflare here.

### 6.2 Domain: de-risked cutover

`annagatdula.com` is currently registered through Squarespace (which absorbed Google Domains).
The migration is sequenced to **never leave the live site broken**:

1. **Build and deploy to a temporary URL first** (e.g. `abg-website.pages.dev`). Verify the
   whole site there while the real domain still points at Squarespace.
2. **Cut over DNS** to the new host once verified. The domain can stay registered at
   Squarespace initially — we only need to repoint DNS/nameservers, not transfer ownership.
3. **Cancel the Squarespace site subscription** (stop paying for the website builder) once
   the new site is confirmed live on the real domain.
4. **(Optional, later)** Transfer the domain registrar to Cloudflare Registrar or Porkbun
   (at-cost renewal, ~$10/yr vs. Squarespace's markup). Done as an unhurried follow-up, not
   on the critical path — domain transfers involve unlock codes and a multi-day window and
   shouldn't gate launch.

This ordering means the site is verifiably working on a test URL before any public change,
and the last safe state is always recoverable.

---

## 7. Division of labor

**Caleb — one-time setup:**
- Create the GitHub repo; scaffold the Astro project from scratch for Anna's site.
- Migrate the 7 static pages (Claude pre-scaffolds from live content).
- Set up hosting + the deploy GitHub Action.
- Build Anna's Scrivener template project + Markdown compile format.
- Write Anna a one-page illustrated cheat sheet for the publishing ritual.
- Sequence the domain/DNS cutover.

**Anna — ongoing, per post:**
- Write in Scrivener; edit five frontmatter fields.
- Compile to Markdown.
- Drag-drop the `.md` into `src/content/blog/` on github.com and commit.
- (Occasionally) upload an image and reference it.
- (As needed) fix typos via GitHub's inline web editor.

---

## 8. Decisions

**Resolved:**

1. **Hosting** — **Cloudflare Pages** (see §6.1). ✅
2. **Visual design** — **Deferred to Anna's input.** The site is built structurally first
   with a clean, minimal, readable default (serif long-form body), and the CSS is organized
   so re-skinning is a low-friction change, not a rebuild. ✅
3. **Blog location** — `annagatdula.com/blog`, same domain and identity (not a separate
   brand). ✅ *(default; flag if wrong)*
4. **RSS at launch** — **Yes.** Cheap to include and genuinely useful for a blog (lets
   readers subscribe). ✅
5. **OG share images** — **Deferred to phase 2.** Auto-generated share images are a nice
   polish but not needed for launch. ✅

**Sensible defaults (override anytime — none block starting):**

6. **Publications page** — start as a simple hand-maintained list; can graduate to a
   structured data file with consistent citation formatting later if the list grows.
7. **CV** — link to a hosted PDF, with key contact info rendered on the page. (Simplest;
   Anna updates one PDF.)
8. **Shopping cart / commerce** — dropped (assumed vestigial Squarespace UI).

---

## 9. Out of scope (YAGNI)

- No comments system (add a hosted one like Giscus later only if Anna wants it).
- No newsletter/email integration at launch.
- No analytics beyond a lightweight privacy-friendly option if desired (deferred).
- No multi-author support — single author.
- No search at launch (a static site this small doesn't need it; tags cover discovery).

---

## 10. Success criteria

- Anna can take a finished Scrivener piece to live-on-the-web in under ~5 minutes without
  Caleb's help, following the cheat sheet.
- A malformed post never takes down the live site.
- The existing academic content is faithfully migrated and the site loads fast.
- Monthly running cost ≈ $0 (plus domain renewal).
- Caleb can support the site using only knowledge he already has.
```
