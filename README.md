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
