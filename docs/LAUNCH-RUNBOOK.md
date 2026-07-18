# Launch Runbook — annagatdula.com (for Caleb)

Everything from "code is on GitHub" to "live on the real domain," in the order you do it.
Each step has a **✅ verify** line — don't move on until it passes. Nothing here can break
the current live Squarespace site until Step 5, and even then it's reversible.

**Hosting:** Cloudflare **Workers** (not Pages). The site is an Astro build served through the
`@astrojs/cloudflare` adapter as a Worker + static assets. Config lives in `wrangler.jsonc`
(`name: abg-website`, assets served from `./dist`). Deploys happen via **Workers Builds**
(Cloudflare rebuilds and deploys on every push to `main`), with `wrangler deploy` as the
manual fallback.

**Cloudflare account:** everything is under **Anna's own** account
(`anna.b.gatdula@gmail.com`, ID `6f4bfc250e8ee43c49cded3612aac19a`) — you don't have to
transfer the hosting later, it's already hers.

**Status legend:** ☐ to do · ✅ done

---

## Current state at a glance (as of 2026-07-18 — DOMAIN CUTOVER DONE ✅)

- ✅ Worker `abg-website` exists and has deployed successfully (via `wrangler deploy`).
- ✅ The zone `annagatdula.com` is on Cloudflare — nameservers are already
  `adelaide.ns.cloudflare.com` / `duke.ns.cloudflare.com` (the DNS cutover happened).
- ✅ **`annagatdula.com` (apex) is LIVE on the new site.** Attached as a Worker custom domain;
  Cloudflare auto-provisioned the TLS cert (`CN=annagatdula.com`). All pages return 200, the
  canonical tags now resolve, and the draft post is hidden. This was **Step 4b** — done.
- ✅ **`www.annagatdula.com` 301-redirects to the apex** (Redirect Rule "www to apex",
  path + query preserved). This was **Step 4c** — done. It previously served the *old
  Squarespace* site, not the new one (the earlier "www serves the site" note was wrong).
- ☐ **Squarespace not yet decommissioned** — still live as the fallback. **Step 5** remains.
  Do NOT cancel the Squarespace plan or let the domain registration lapse yet.
- ☐ Workers Builds (git-connected auto-deploy) not yet connected — deploys so far were manual
  CLI uploads. **Step 2** covers this.
- 🚨 **Active Cloudflare incident (started 2026-07-18 16:46 UTC): "Workers and Pages builds
  unable to start."** Workers Builds can't run right now, so git-connected auto-deploy is
  unavailable. **Deploy manually with `npm run deploy` until it clears** — that path builds
  locally and uploads directly, so it's unaffected. Track:
  https://new.cloudflarestatus.com/incidents/5169hjl09gpm

---

## Step 0 — GitHub repo ✅ DONE

- Repo: **https://github.com/calebsponheim/abg_website** (private, on your personal account).
- `main` is pushed and current.
- Node is pinned to 22 via `.node-version`; build command is `npm run build`; output is `dist/`.

> You'll transfer the *repo* to Anna's GitHub later (GitHub: Settings → Danger Zone →
> Transfer). Do that *after* launch. (The Cloudflare side is already on Anna's account, so
> that part needs no transfer.)

---

## Step 1 — Canonical domain ✅ DECIDED: apex `annagatdula.com`

The site is built with **`https://annagatdula.com`** as canonical (`site` in
`astro.config.mjs`, plus a per-page canonical `<link>`). `www.annagatdula.com` will
301-redirect to the apex (Step 4c). The hostname is a DNS/hosting choice you fully control now
that DNS is on Cloudflare.

> ✅ Resolved (2026-07-18): the apex is now live on the Worker and `www` 301s to it, so the
> canonical tags point at a host that resolves. (Before cutover it was backwards — `www` served
> the *old Squarespace* site and the apex was dead.)

---

## Step 2 — Deploy the Worker

Two modes. **Right now, use 2A (manual)** because Workers Builds is down (see the incident in
"Current state"). Switch to **2B (auto-deploy)** once the incident resolves — that's the
hands-off model Anna's publishing ritual depends on.

### 2A — Manual deploy (use this now, during the incident)

From your machine, on `main`:

```
npm run deploy      # = npm run build && wrangler deploy
```

This builds locally and uploads straight to the Worker, bypassing the broken build service.
The trade-off during the incident: **Anna's github pushes do NOT go live on their own** — she
can still commit posts, but you have to run `npm run deploy` to publish them. Let her know, or
just deploy when she pings you.

✅ **verify:** `npx wrangler deployments list` shows your new deployment on top, and the
Worker's `*.workers.dev` URL loads. Click through every page: `/`, `/about`, `/research`,
`/publications`, `/teaching`, `/public-work`, `/contact`, `/blog`, `/blog/welcome`, and
`/rss.xml`. Confirm:
- The headshot and all text render.
- Publications and About links work.
- The **draft example post does NOT appear** anywhere (not in `/blog`, not in the feed).

### 2B — Connect Workers Builds (do this once the incident clears)

Goal: every push to `main` rebuilds and redeploys the Worker automatically.

1. Cloudflare dashboard → **Workers & Pages → `abg-website` → Settings → Builds** (or
   **Workers & Pages → Create → Workers → Connect to Git** if no Worker is linked yet).
2. Authorize GitHub (grant access to the `abg_website` repo), then select it.
3. Build settings:
   - **Production branch:** `main`
   - **Build command:** `npm run build`
   - **Deploy command:** `npx wrangler deploy`
   - **Root directory:** `/`
   - (Node version needs no setting — `.node-version` pins it to 22.)
4. **Save.** Trigger a build (push a trivial commit, or hit **Retry/Deploy** in the dashboard).

✅ **verify:** the build succeeds in **Workers & Pages → `abg-website` → Deployments**, and the
`*.workers.dev` URL still serves the site. From here on, `npm run deploy` stays available as a
manual fallback anytime.

---

## Step 3 — Prove the safety net (one time, ~5 min)

The reassurance that Anna can't break the live site: a bad post fails the **build**, so it
never deploys and the last good Worker version keeps serving. This holds in both deploy modes —
Workers Builds fails the build server-side; a manual `npm run deploy` fails locally before it
ever uploads.

1. Add a post with **broken YAML** — e.g. frontmatter with an unclosed quote.
2. Try to deploy it:
   - **Manual mode (now):** run `npm run deploy`. The `npm run build` step **fails** and
     nothing is uploaded.
   - **Workers Builds mode:** push to `main` and watch the commit's build **fail** in
     **Workers & Pages → `abg-website` → Deployments**.
3. Confirm the `*.workers.dev` site is **unchanged** (last good version still served).
4. Discard/revert the broken post.

✅ **verify:** the broken post produced a failed build and did **not** change the live site.

> If you ever need to roll back a *successful-but-wrong* deploy, use
> **Deployments → … → Rollback** in the dashboard, or `npx wrangler rollback` from the CLI.

---

## Step 4 — Point the domain at the Worker (the real cutover)

The zone is already on Cloudflare and nameservers are already switched (this was done). What
remains is attaching the domain to the Worker and fixing the missing apex record.

### 4a. DNS zone on Cloudflare ✅ DONE

`annagatdula.com`'s nameservers are `adelaide`/`duke.ns.cloudflare.com` and the zone is Active.

> One-time hygiene check while you're in **DNS → Records**: make sure any **MX** (email) and
> **TXT** verification records you rely on survived the import. Anna's contact is
> `gatdula@unc.edu`, so she likely has no email on this domain — but confirm, or mail to the
> domain would break.

### 4b. Attach the domain to the Worker ✅ DONE (2026-07-18)

Attached `annagatdula.com` as a Worker custom domain — apex is live, cert provisioned.

> **Gotcha we hit:** the apex was *not* recordless — it had **four leftover Squarespace `A`
> records** (`198.185.159.144/145`, `198.49.23.144/145`, all proxied). The "Add Custom Domain"
> dialog refused with *"Hostname already has externally managed DNS records… Delete them
> first."* Fix: **DNS → Records → delete those four apex `A` records** (kept the `www` CNAME,
> the `_domainconnect` CNAME, and the NS records), then re-add the custom domain.

Steps used:
1. **DNS → Records** → deleted the 4 apex `A` records (name `annagatdula.com`).
2. **Workers & Pages → `abg-website` → Domains & Routes → Add → Custom Domain** → left
   subdomain empty (root) → **Add domain**. Cloudflare created the record + TLS cert.

> ⚠️ Do **not** try to attach the custom domain via `wrangler.jsonc` `routes` — the CLI token
> is `zone`-read-only so it can't override the existing DNS record, and adding `routes` also
> silently **disables the `*.workers.dev` URL** unless you set `workers_dev: true`. Keep the
> custom domain in the dashboard.

✅ **verified:** `dig +short @1.1.1.1 annagatdula.com` returns Cloudflare IPs; every page
(`/`, `/about/`, … `/rss.xml`) returns 200 on the apex; TLS cert `CN=annagatdula.com`; draft
post hidden.

### 4c. Set the redirect (canonical from Step 1) ✅ DONE (2026-07-18)

Added a **Redirect Rule** ("www to apex", **Rules → Redirect Rules**) using the **Wildcard
pattern** mode:
- **Request URL:** `https://www.annagatdula.com/*`
- **Target URL:** `https://annagatdula.com/${1}`
- **Status:** 301 · **Preserve query string:** on

(The rule fires at Cloudflare's edge, so it works even though the `www` CNAME still points at
`ext-sq.squarespace.com` — the request never reaches Squarespace.)

✅ **verified:** `https://www.annagatdula.com/` → 301 → `https://annagatdula.com/`; deep paths
and query strings are preserved (`/publications/?ref=test` survives the redirect).

---

## Step 5 — Decommission Squarespace (only after Step 4 verifies)

1. Confirm one more time the real domain (apex + www) serves the new site correctly.
2. In Squarespace, **cancel the website/site subscription** (stop paying for the site
   builder). **Keep the domain registration active** — do not let it lapse; confirm
   auto-renew is on.

✅ **verify:** Squarespace billing shows the site plan cancelled; the domain still shows as
registered with auto-renew on; the live site is unaffected.

---

## Step 6 — Anna's Scrivener workflow (F2)

Follow **[SCRIVENER-SETUP.md](SCRIVENER-SETUP.md)** to build her "Blog (Markdown)" compile
format and the "Blog Post" template, then do the end-to-end test post it describes. Once that
works, hand Anna **[ANNA-PUBLISHING-GUIDE.md](ANNA-PUBLISHING-GUIDE.md)**.

✅ **verify:** you compiled a test post, uploaded it via GitHub's web UI, saw it go live (via
Workers Builds once connected, or via `npm run deploy` during the incident), then deleted it.

---

## Pre-launch polish (do before/around Step 4)

- ☐ **Anna's design input:** the look is a clean minimal default. It re-skins by editing the
  CSS variables at the top of `src/styles/global.css` (colors, fonts, content width) — a
  quick change, not a rebuild. Get her preferences and apply.
- ☐ **Guide wording:** if you used the "new project per post" template model in
  SCRIVENER-SETUP, change step 1 of ANNA-PUBLISHING-GUIDE.md from "open the template project"
  to "create a new project from the Blog Post template."

> The CV download and stock favicon are already handled — the page was renamed to **Contact**
> (CV download dropped) and the favicon is now the lowercase `abg` monogram.

---

## Later / optional — transfer the registrar

Not on the launch path. When convenient, move the domain **registration** from Squarespace to
**Cloudflare Registrar** (at-cost renewal, ~$10/yr, everything in one dashboard under Anna's
account):

1. Squarespace → unlock the domain, disable WHOIS privacy if required, request the
   **authorization/EPP code**.
2. Cloudflare → **Domain Registration → Transfer Domains** → follow the prompts with the code.
3. Approve the transfer email. Takes up to ~5 days; the site stays live the whole time
   because DNS + hosting are already on Cloudflare.

*(Note: a domain can't be transferred within 60 days of its last registration/transfer — if
that blocks you, just wait it out; nothing else depends on it.)*

---

## Rollback (if anything goes wrong at cutover)

- **New site looks broken on the real domain:** in **Workers & Pages → `abg-website` →
  Deployments**, roll back to a previous good version (one click), or `npx wrangler rollback`,
  or fix and push.
- **Need to go back to Squarespace entirely:** point the domain's DNS records back to
  Squarespace's values (keep a copy of them from the DNS zone before you change anything), or
  revert the nameservers to Squarespace's. Because you kept the registration and (until Step 5)
  the Squarespace plan, the old site is recoverable.

---

## Quick reference

| Thing | Value |
|---|---|
| Repo | github.com/calebsponheim/abg_website (private) |
| Hosting | Cloudflare Workers (`@astrojs/cloudflare` adapter) |
| Cloudflare account | anna.b.gatdula@gmail.com |
| Worker name | `abg-website` (config in `wrangler.jsonc`) |
| Deploy model | **Manual `npm run deploy` for now** (Workers Builds incident); Workers Builds auto-on-push once it clears |
| Build command | `npm run build` |
| Output dir | `dist` (served as Worker assets) |
| Node | 22 (pinned via `.node-version`) |
| Local dev | `npm run dev` → http://localhost:4321 |
| Local prod preview | `npm run preview` (`wrangler dev`) |
| Manual deploy | `npm run deploy` (`build && wrangler deploy`) |
| Check deploys | `npx wrangler deployments list` |
| Roll back | dashboard Rollback, or `npx wrangler rollback` |
| Tests | `npm run test:e2e` |
| Canonical URL | `https://annagatdula.com` (apex; www 301s to it) |
