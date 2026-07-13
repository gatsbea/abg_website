# Scrivener → Markdown Setup (for Caleb, one time)

This is the one fiddly part of the whole system, and it's why it's *your* job, not
Anna's. You do this once: configure a Scrivener project + compile format that turns
Anna's writing into a clean Markdown file with valid YAML frontmatter. After that, Anna's
side is the four-step ritual in [ANNA-PUBLISHING-GUIDE.md](ANNA-PUBLISHING-GUIDE.md).

Menu paths below are Scrivener 3 (macOS). Exact wording shifts slightly between versions —
if a label doesn't match, look for the nearest equivalent; the *concepts* are stable.

---

## What we're producing

Astro needs each post to be a Markdown file that starts with a YAML block delimited by
`---`, like this:

```markdown
---
title: "My Post Title"
pubDate: 2026-07-12
description: "One sentence for previews and search."
tags: ["opera", "nuclear"]
draft: true
---

The body of the post starts here…
```

Two things must survive the compile intact or the build breaks:

1. **The frontmatter block, verbatim** — the `---` fences and `key: value` lines, unescaped.
2. **Straight quotes** (`"`) in the YAML — Scrivener's "smart quotes" (`"` `"`) are **invalid**
   in YAML string values and will fail Anna's build. This is the single most common failure;
   kill smart quotes in two places (below).

The good news: a broken file just fails the Cloudflare build and leaves the live site
untouched — so a misconfigured compile can't hurt anything public. You'll catch it in the
test compile.

---

## Step 1 — Make the "Blog Post" project template

The simplest model for Anna is **one Scrivener project per post**, created from a saved
template so every post starts with the frontmatter pre-filled.

1. New project → **Blank**. Name it e.g. `Blog Post`.
2. In the Draft/Manuscript folder, create a single document. At the very top, type the
   frontmatter block exactly as shown above (straight quotes, `draft: true`, today's date
   as a placeholder). Leave a blank line, then a line like "Write your post here."
3. **Mark the frontmatter block as raw/preserved so the compiler doesn't touch it:**
   select those lines (the `---` fences and the five fields) → **Format → Preserve
   Formatting**. Preserved text is passed through the Markdown compile verbatim instead of
   being escaped or "smartened." (You'll see a faint box around it in the editor.)
4. Save it as a template: **File → Save As Template…** → category "Blog", name "Blog Post".

Now each new post is **File → New Project → Blog → Blog Post**. One project = one post =
one `.md` file out. (If you'd rather Anna keep all posts as documents in a single project,
that also works — she'd just compile the *current selection* instead of the whole draft —
but separate projects keep her mental model to "new post = new project.")

> Note: [ANNA-PUBLISHING-GUIDE.md](ANNA-PUBLISHING-GUIDE.md) step 1 says "open the Blog
> Post Template project." If you go with the project-template approach here, change that
> line to "**Create a new project from the Blog Post template**" so the two docs agree.

## Step 2 — Turn off smart quotes (place #1: the editor)

**Scrivener → Settings (⌘,) → Corrections →** uncheck **"Use smart quotes"** (and, to be
safe, "Use smart dashes"). This stops Anna's typing from becoming curly quotes in the first
place. Existing curly quotes in the template: retype them straight, or Edit → Substitutions
→ Smart Quotes (toggle off), then re-type.

## Step 3 — Build the "Blog (Markdown)" compile format

1. **File → Compile…**
2. At the top, set **Compile for: MultiMarkdown** (or "Markdown" — either works; MultiMarkdown
   is the more capable converter and fine here).
3. In the **Formats** list on the left, right-click a built-in Markdown-ish format →
   **Duplicate & Edit** (or create new). Name it **Blog (Markdown)**.
4. In the format editor, find the **Transformations** pane and confirm **smart quotes / smart
   punctuation conversion is OFF** (this is place #2 — the compile can re-curl quotes even if
   the editor didn't). Also leave "Convert to plain text" style behaviors alone; we want
   Markdown, not stripped text.
5. Leave the body handling at defaults: Scrivener converts a "Heading" paragraph style to
   `#`, italics to `*…*`, bold to `**…**`, etc. Tell Anna to use real paragraph styles /
   ⌘I / ⌘B rather than typing Markdown by hand.
6. Save the format. It'll now appear under "My Formats" for reuse.

## Step 4 — Test compile (do this before handing it to Anna)

1. In the template (or a throwaway copy), fill in real values and write a couple of test
   paragraphs, one heading, and one italic phrase.
2. **Compile** → choose **Blog (Markdown)** → **Compile** → save as `test-post.md`.
3. Open `test-post.md` in a plain-text editor and check:
   - It **starts** with `---` on line 1 (no blank line or stray characters before it).
   - The five fields are intact, quotes are **straight** (`"`), the closing `---` is present.
   - The body below is clean Markdown (`#` heading, `*italic*`).
4. **Prove it end-to-end against the real site:** drop `test-post.md` into
   `src/content/blog/` in the repo and run `npm run build`. Exit 0 = the frontmatter parsed.
   A schema/YAML error here (with a clear message) means something in the compile is off —
   usually smart quotes or a stray blank line above the first `---`. Fix, recompile, retry.
   Then delete `test-post.md`.

---

## Troubleshooting the usual suspects

| Symptom (build error / bad output) | Cause | Fix |
|---|---|---|
| YAML parse error mentioning a quote | Smart quotes crept in | Recheck Step 2 **and** Step 4's Transformations pane; retype quotes straight |
| Frontmatter shows as body text / no `---` on line 1 | A blank line or title-page content compiled before it | Ensure the frontmatter doc is first and nothing is prepended; keep the block Preserve-Formatted |
| `---` or `:` got escaped (`\-\-\-`) | Frontmatter wasn't marked Preserve Formatting | Reselect the block → Format → Preserve Formatting |
| Date rejected | Wrong format | Must be `YYYY-MM-DD`, e.g. `2026-07-12` |
| `tags` error | Not a list | `tags: ["a", "b"]` with straight quotes, or delete the line |

## If you want less fiddliness later (optional)

For a more automated pipeline (Scrivener styles → Pandoc → templated frontmatter), see
[scrivomatic](https://github.com/iandol/scrivomatic). It's more powerful but needs Pandoc
installed and more setup — overkill for Anna's "light touch" workflow, but here if the
manual compile ever becomes a pain point.

## Frontmatter field reference (the contract)

Defined in [`src/content.config.ts`](../src/content.config.ts) — the source of truth:

- `title` — string, straight quotes. Required.
- `pubDate` — `YYYY-MM-DD`. Required. (Rendered as a calendar day in UTC, so it shows the
  exact date Anna types.)
- `description` — string, one sentence. Optional (omit the line to skip).
- `tags` — list of strings, e.g. `["opera", "nuclear"]`. Optional.
- `draft` — `true` (hidden from the live site) or `false` (published). Defaults to `false`
  if the line is absent.
