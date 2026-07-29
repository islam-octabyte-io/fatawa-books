import { Separator } from '@/components/ui/separator';
import { splitFootnotes } from '@/lib/footnotes';

/**
 * The footnote apparatus at the bottom of a page.
 *
 * Footnotes are plain text, unlike the page body — no markup at all — so they
 * are rendered as real elements rather than injected. The markers are styled to
 * echo the `.fn` spans in the body, which is what ties a `[1]` in the prose to
 * its citation down here.
 *
 * Almost every note is a source citation, typically Arabic book titles with
 * volume and hadith numbers. They are set smaller than the body and in the naskh
 * face because they are reference matter, not reading matter.
 */
export function Footnotes({ block }: { block: string | null }) {
  const notes = splitFootnotes(block);
  if (notes.length === 0) return null;

  return (
    <section className="mt-12" aria-labelledby="footnotes-heading">
      <Separator />

      <h2
        id="footnotes-heading"
        className="text-muted-foreground mt-6 mb-3 text-xs tracking-wide"
      >
        حوالہ جات
      </h2>

      <ol className="flex flex-col gap-2 text-sm">
        {notes.map((note, index) => (
          // Markers repeat across pages and can be absent, so the index is the
          // only stable key available here.
          <li key={index} className="flex gap-2.5">
            {note.marker === null ? null : (
              <span
                dir="ltr"
                className="text-primary shrink-0 tabular-nums"
                aria-hidden
              >
                [{note.marker}]
              </span>
            )}
            <span className="text-muted-foreground min-w-0 text-pretty">
              {note.text}
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}
