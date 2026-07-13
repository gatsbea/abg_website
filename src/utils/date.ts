/**
 * Format a post's publication date for display, e.g. "July 12, 2026".
 *
 * A frontmatter `pubDate: 2026-07-12` is coerced to UTC midnight. We MUST format
 * in UTC — omitting `timeZone` renders it in the build machine's local zone, which
 * shifts the date back a day in any negative-offset timezone (e.g. US Eastern shows
 * July 11 for July 12). The date is a calendar day, not a moment in time.
 */
export function formatPostDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  }).format(date);
}
