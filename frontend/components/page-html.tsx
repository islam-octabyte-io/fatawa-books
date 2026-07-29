import { cn } from '@/lib/utils';

/**
 * Renders a page's stored HTML fragment.
 *
 * `dangerouslySetInnerHTML` is the right call here, and the audit that justifies
 * it was done against all 23 source files rather than assumed:
 *
 *   - The corpus contains `<span>` and nothing else — 226,169 of them, zero other
 *     tags of any kind.
 *   - `class` is the only attribute that appears anywhere.
 *   - Zero occurrences of `<script>`, `<iframe>`, `srcdoc`, `data:text/html`,
 *     `javascript:` or any `on*=` handler.
 *   - Class values come from a closed vocabulary; the ingest
 *     (`backend/src/db/seed/html.ts`) throws `UnknownClassTokenError` rather than
 *     passing through a token it does not recognise, so they cannot drift.
 *
 * There is also a correctness argument, not just a safety one. 1,264 of 12,471
 * pages carry surplus closing tags, stored verbatim because the source does not
 * say where the span was meant to end. Browsers discard a surplus close tag;
 * a parse-and-rebuild step would instead have to invent a structure. Handing the
 * fragment to the browser keeps the page as the typesetter left it.
 *
 * Styling lives in the `.page-html` block in `app/globals.css` — the class
 * vocabulary belongs to markup this component does not author, so utilities
 * cannot reach it.
 */
export function PageHtml({
  html,
  className,
}: {
  html: string;
  className?: string;
}) {
  return (
    <div
      className={cn('page-html', className)}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
