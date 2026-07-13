# Launch Runbook — annagatdula.com (for Caleb)

Everything from "code is on GitHub" to "live on the real domain," in the order you do it.
Each step has a **✅ verify** line — don't move on until it passes. Nothing here can break
the current live Squarespace site until Step 5, and even then it's reversible.

**Status legend:** ☐ to do · ✅ done

---

## Step 0 — GitHub repo ✅ DONE

- Repo: **https://github.com/calebsponheim/abg_website** (private, on your personal account).
- `main` is pushed and current.
- Node is pinned to 22 via `.node-version`; build command is `npm run build`; output is `dist/`.

> You'll transfer the repo to Anna's GitHub later (GitHub: Settings → Danger Zone →
> Transfer). Do that *after* launch so you're not chasing permissions mid-cutover.

---

## Step 1 — Canonical domain ✅ DECIDED: apex `annagatdula.com`

The site is built with **`https://annagatdula.com`** as canonical (`site` in
`astro.config.mjs`). `www.annagatdula.com` will 301-redirect to the apex (set up in Step 4c).
Nothing more to do here — the hostname is a DNS/hosting choice you fully control once DNS is
on Cloudflare, independent of Squarespace's current `www` and independent of the registrar.

---

## Step 2 — Deploy to Cloudflare Pages (test URL first)

Goal: get the site live on a throwaway `*.pages.dev` URL while the real domain still points
at Squarespace.

1. Cloudflare dashboard → **Workers & Pages → Create → Pages → Connect to Git**.
2. Authorize GitHub (grant access to the `abg_website` repo), then select it.
3. Build settings:
   - **Production branch:** `main`
   - **Framework preset:** Astro
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
   - (Node version needs no setting — `.node-version` pins it to 22.)
4. **Save and Deploy.** First build takes a minute or two.

✅ **verify:** the build succeeds and the `*.pages.dev` URL loads. Click through every page:
`/`, `/about`, `/research`, `/publications`, `/teaching`, `/public-work`, `/cv-and-contact`,
`/blog`, `/blog/welcome`, and `/rss.xml`. Confirm:
- The headshot and all text render.
- Publications and About links work.
- The **draft example post does NOT appear** anywhere (not in `/blog`, not in the feed).

---

## Step 3 — Prove the safety net (one time, ~5 min)

This is the reassurance that Anna can't break the live site. Do it once so you've *seen* it.

1. Locally (or via GitHub's web editor), make a branch and add a post with **broken YAML** —
   e.g. a frontmatter with an unclosed quote. Push the branch.
2. In Cloudflare Pages → the project → **Deployments**, watch that commit's build **fail**.
3. Confirm the production `*.pages.dev` site is **unchanged** (last good build still served).
4. Delete the branch.

✅ **verify:** a broken commit produced a failed build and did **not** change the live site.

---

## Step 4 — Point the domain at Cloudflare (the real cutover)

`annagatdula.com` is registered at Squarespace. We move **DNS** (not the registration) to
Cloudflare so the apex domain can point at Pages and everything lives in one dashboard. The
registration stays at Squarespace for now.

### 4a. Add the domain to Cloudflare

1. Cloudflare dashboard → **Add a site** → enter `annagatdula.com` → choose the Free plan.
2. Cloudflare scans and **imports existing DNS records**. **⚠️ Review them carefully against
   Squarespace's current DNS** (Squarespace → Domains → annagatdula.com → DNS Settings).
   Make sure anything you rely on is present — especially:
   - Any **MX** (email) records. *(Anna's contact is `gatdula@unc.edu`, so she probably has
     no email on this domain — but confirm, or email to the domain will break.)*
   - Any **TXT** verification records.
   You can leave the existing A/CNAME records that point to Squarespace for now — they keep
   the old site working until 4c.
3. Cloudflare gives you **two nameservers**. In **Squarespace → Domains → annagatdula.com →
   Nameservers**, switch from Squarespace defaults to **Custom nameservers** and enter
   Cloudflare's two. Save.

✅ **verify:** Cloudflare shows the domain as **Active** (nameserver change can take
minutes–hours). The Squarespace site should still load normally throughout — DNS is now
served by Cloudflare but still pointing at Squarespace.

### 4b. Attach the domain to your Pages project

1. Cloudflare Pages → your project → **Custom domains → Set up a custom domain**.
2. Add **both** `annagatdula.com` and `www.annagatdula.com`. Cloudflare creates/updates the
   records to point at Pages automatically (CNAME flattening handles the apex).

### 4c. Set the redirect (canonical from Step 1)

Canonical is the **apex `annagatdula.com`**, so add a **Redirect Rule** (Cloudflare → your
domain → Rules → Redirect Rules) that 301s www → apex:
- redirect `www.annagatdula.com/*` → `https://annagatdula.com/$1` (status 301).

✅ **verify:** in a browser (and incognito), `https://annagatdula.com` serves the **new** site
over HTTPS (Cloudflare auto-provisions the certificate — may take a few minutes), and
`https://www.annagatdula.com` **redirects** to it. Recheck the page list from Step 2 on the
real domain, on both desktop and mobile widths.

---

## Step 5 — Decommission Squarespace (only after Step 4 verifies)

1. Confirm one more time the real domain serves the new site correctly.
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

✅ **verify:** you compiled a test post, uploaded it via GitHub's web UI, saw it deploy, then
deleted it.

---

## Pre-launch polish (do before/around Step 4)

- ☐ **Real CV:** replace `public/cv.pdf` (currently a 21-byte placeholder) with Anna's actual
  CV export. Commit & push. *(The CV & Contact page's "Download CV" link points at
  `/cv.pdf`.)*
- ☐ **Favicon:** `public/favicon.svg` is still the stock Astro logo. Replace with something
  of Anna's (even a simple monogram). Commit & push.
- ☐ **Anna's design input:** the look is a clean minimal default. It re-skins by editing the
  CSS variables at the top of `src/styles/global.css` (colors, fonts, content width) — a
  quick change, not a rebuild. Get her preferences and apply.
- ☐ **Guide wording:** if you used the "new project per post" template model in
  SCRIVENER-SETUP, change step 1 of ANNA-PUBLISHING-GUIDE.md from "open the template project"
  to "create a new project from the Blog Post template."

---

## Later / optional — transfer the registrar

Not on the launch path. When convenient, move the domain **registration** from Squarespace to
**Cloudflare Registrar** (at-cost renewal, ~$10/yr, everything in one dashboard):

1. Squarespace → unlock the domain, disable WHOIS privacy if required, request the
   **authorization/EPP code**.
2. Cloudflare → **Domain Registration → Transfer Domains** → follow the prompts with the code.
3. Approve the transfer email. Takes up to ~5 days; the site stays live the whole time
   because DNS + hosting are already on Cloudflare.

*(Note: a domain can't be transferred within 60 days of its last registration/transfer — if
that blocks you, just wait it out; nothing else depends on it.)*

---

## Rollback (if anything goes wrong at cutover)

- **New site looks broken on the real domain:** in Cloudflare Pages → Deployments, roll back
  to a previous good deployment (one click), or fix and push.
- **Need to go back to Squarespace entirely:** point the domain's DNS records back to
  Squarespace's values (you reviewed them in 4a — keep a copy), or revert the nameservers to
  Squarespace's. Because you kept the registration and (until Step 5) the Squarespace plan,
  the old site is recoverable.

---

## Quick reference

| Thing | Value |
|---|---|
| Repo | github.com/calebsponheim/abg_website (private) |
| Build command | `npm run build` |
| Output dir | `dist` |
| Node | 22 (pinned via `.node-version`) |
| Local dev | `npm run dev` → http://localhost:4321 |
| Local prod preview | `npm run preview` |
| Tests | `npm run test:e2e` |
| Canonical URL | `https://annagatdula.com` (apex; www 301s to it) |
