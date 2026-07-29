/**
 * Splitting a page's footnote block into individual notes.
 *
 * Unlike `PageDetail.html`, footnotes are plain text with no markup at all —
 * the ingest only strips control characters (`backend/src/db/seed/html.ts`,
 * `cleanFootnotes`). Each note begins with a bracketed marker at the start of a
 * line and runs to the next marker:
 *
 *     [1] ۔صحیح مسلم، الجنائز، حدیث:973
 *     [2] ۔سنن ابی داود، الجنائز، حدیث: 3236
 *
 * The text after the marker is left exactly as stored, leading Urdu full stop
 * included. It is source typography, not an artefact we are entitled to clean
 * up in the view layer.
 */

export type Footnote = {
  /** The bracketed number as printed, e.g. `1`. Null when the block carries no markers. */
  marker: string | null;
  text: string;
};

/** Marker at the start of a line: `[12]`. */
const MARKER_AT_LINE_START = /^\[(\d+)\]\s*/;

export function splitFootnotes(block: string | null): Footnote[] {
  if (block === null) return [];

  const trimmed = block.trim();
  if (trimmed.length === 0) return [];

  // Split *before* each line-start marker rather than on the marker itself, so
  // a note that wraps onto an unmarked continuation line stays with its own
  // marker instead of becoming a note of its own.
  const chunks = trimmed
    .split(/(?=^\[\d+\])/m)
    .map((chunk) => chunk.trim())
    .filter((chunk) => chunk.length > 0);

  // No markers found — 1,264 pages have unbalanced spans and the source is
  // uneven generally, so a block that does not match the expected shape is
  // rendered whole rather than dropped.
  if (chunks.length === 0) return [{ marker: null, text: trimmed }];

  return chunks.map((chunk) => {
    const match = MARKER_AT_LINE_START.exec(chunk);
    if (match === null) return { marker: null, text: chunk };

    return { marker: match[1], text: chunk.slice(match[0].length) };
  });
}
