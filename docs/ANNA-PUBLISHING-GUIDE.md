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
