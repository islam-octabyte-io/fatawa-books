/**
 * Rewrites the source page markup into what `pages.html` stores.
 *
 * Two jobs, both deliberately conservative:
 *   1. map the cryptic `m*` presentation classes to the short form documented on
 *      `pages.html`, dropping the "off" tokens;
 *   2. neutralise stray C0 control characters.
 *
 * Everything else is left EXACTLY as found. In particular the tag structure is
 * never touched: 1,264 of 12,471 source pages have unbalanced `<span>` tags
 * (usually a stray `</span>`), and "repairing" them would mean guessing where a
 * span was meant to end. Browsers already tolerate both cases — an unclosed
 * span closes at its container, a surplus close tag is ignored — so faithful
 * storage beats a guess.
 *
 * Token vocabulary was enumerated across ALL 23 source files (454,123 spans),
 * not sampled: any token outside the maps below throws rather than being
 * silently dropped, so a future source file cannot quietly lose formatting.
 */

/** `m` + language letter. `m` alone means the exporter emitted no language. */
const LANGUAGE = new Map([
  ['mu', 'lu'], // Urdu — 171,574 spans
  ['ma', 'la'], // Arabic — 38,156 spans
  ['ma1', 'la'], // Arabic variant, 7 spans total, each wrapping a stray quote
  //           or space beside Arabic. Folded into `la`: same language, and the
  //           distinction carries no content.
  ['me', 'le'], // English — 4,449 spans (`Nationality`, `Gelating`, …)
  ['m', 'lx'], // language unspecified — 241 spans, all in ijtimaee-nizam
]);

/** Present-means-on. Their `*0` counterparts are dropped entirely. */
const TOGGLES = new Map([
  ['mb1', 'b'], // bold
  ['mi1', 'i'], // italic
  ['mul1', 'u'], // underline
  ['mc1', 'hl'], // coloured / highlighted
]);

/** "Off" tokens — 69% of all class tokens, carrying no information. */
const DROPPED = new Set(['mb0', 'mi0', 'mul0', 'mc0']);

/**
 * Alignment. `mal1`/`mal2` are CONFIRMED from the corpus: `mal1` is 81% bold at
 * mean size 19.5 with mean text length 31 (headings → centred), `mal2` is 11%
 * bold at mean size 14.7 with mean length 163 (body → justified).
 *
 * `mal0` (143 spans, all parenthesised Arabic hadith) and `mal3` (8,276 spans,
 * mean text length 1 — almost all empty) are NOT determined by the evidence;
 * they are left/right in some order and nothing in the data settles which.
 * They therefore keep neutral names carrying the source number. Naming them
 * `tl`/`tr` would be a coin flip baked into 8,419 spans; with `ta0`/`ta3` the
 * eventual answer is a one-line stylesheet change and no data rewrite.
 */
const ALIGN = new Map([
  ['mal0', 'ta0'], // undetermined — see above
  ['mal1', 'tc'], // centre — confirmed
  ['mal2', 'tj'], // justify — confirmed
  ['mal3', 'ta3'], // undetermined — see above
]);

const FOOTNOTE_REF = 'mfnote';
/** Sizes actually present: ms12-ms22, ms24, ms26 (pt). */
const SIZE = /^ms(\d{1,3})$/;

export class UnknownClassTokenError extends Error {
  constructor(
    readonly token: string,
    readonly context: string,
  ) {
    super(`Unknown presentation class token "${token}" near: ${context}`);
    this.name = 'UnknownClassTokenError';
  }
}

function mapToken(token: string, context: string): string | null {
  if (DROPPED.has(token)) return null;

  const size = SIZE.exec(token);
  if (size) return `s${Number(size[1])}`;

  const mapped =
    LANGUAGE.get(token) ??
    TOGGLES.get(token) ??
    ALIGN.get(token) ??
    (token === FOOTNOTE_REF ? 'fn' : undefined);

  if (mapped === undefined) throw new UnknownClassTokenError(token, context);
  return mapped;
}

/**
 * C0 control characters found in 1,541 source pages.
 *
 * `0x0b`/`0x0c` sit BETWEEN words (`عقیقہ و<0x0b> قربانی`) so they collapse to a
 * space — stripping them outright risks welding two words together. The rest
 * (`0x01`-`0x08`, `0x0e`-`0x1f`) are export artefacts: standalone placeholders,
 * a bullet glyph before list rows, junk before a footnote marker. They are
 * removed. Tab, newline and carriage return are of course preserved.
 */
function stripControlChars(html: string): string {
  return html
    .replace(/[\x0b\x0c]/g, ' ')
    .replace(/[\x00-\x08\x0e-\x1f]/g, '');
}

/**
 * Rewrites every `class` attribute and normalises quoting to double quotes
 * (ijtimaee-nizam emits single quotes for all 41,209 of its class attributes).
 *
 * Source token order is preserved rather than canonicalised — the mapping is
 * meant to be a rename, not a reformat.
 */
export function rewritePageHtml(html: string): string {
  return stripControlChars(html).replace(
    /class\s*=\s*(["'])(.*?)\1/g,
    (match, _quote: string, value: string) => {
      const mapped = value
        .trim()
        .split(/\s+/)
        .filter((t) => t.length > 0)
        .map((t) => mapToken(t, match))
        .filter((t): t is string => t !== null);

      return `class="${mapped.join(' ')}"`;
    },
  );
}

/**
 * Footnote blocks are plain text with `[n]` markers and no class attributes, so
 * they only need the control-character pass.
 */
export function cleanFootnotes(fnotes: string | null): string | null {
  if (fnotes === null) return null;
  const cleaned = stripControlChars(fnotes).trim();
  return cleaned.length > 0 ? cleaned : null;
}

/** TOC titles: every source row ends with a trailing tab or space. */
export function cleanTitle(title: string): string {
  return stripControlChars(title).replace(/\s+/g, ' ').trim();
}
