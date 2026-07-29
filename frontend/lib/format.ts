/**
 * Presentation-only numeral formatting.
 *
 * The API always speaks Western digits and so does every identifier (`BF11`,
 * `BP110026`), so nothing here ever touches a value that goes back over the
 * wire — it exists purely so counts and volume numbers read as they would in a
 * printed Urdu book.
 *
 * `ur` alone still resolves to Latin digits; the `-u-nu-arabext` extension is
 * what selects the extended Arabic-Indic set (۰۱۲۳) that Urdu print uses.
 */
const urduDigits = new Intl.NumberFormat('ur-u-nu-arabext');

export function toUrduNumerals(value: number): string {
  return urduDigits.format(value);
}
