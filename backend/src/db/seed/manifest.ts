/**
 * The catalogue: source file → `books.number` → slug, in order.
 *
 * This is a DELIBERATE, CHECKED-IN DECISION, not something derived from
 * filenames. `books.number` is the browse order AND forms every `BF`/`BP`/`BT`
 * UCI in the corpus, so it freezes on publish — reordering this array after a
 * public seed would renumber identifiers that are supposed to be permanent.
 *
 * Order rule: multi-volume sets first and consecutive, then single works
 * alphabetically, then the anthology last.
 *
 * Volume sets present in `data-collection/` (note the inconsistent source
 * spellings — `Fataawa-ashaab-ul-hadees-jild-02` vs
 * `Fatawa-Ashaab-Ul-Hadees-Jild-01`, and `Jild-5` vs `Jild-04`):
 *   - Ashaab-ul-Hadees   jild 1-5   → numbers 1-5   (complete)
 *   - Ibn Baz            jild 1-2   → numbers 6-7   (complete)
 *   - Saniyya Madaniyya  jild 2-4   → numbers 8-10  (jild 1 NOT in the source set)
 *   - Fatawa Islamia     jild 2     → number 11     (jild 1 NOT in the source set)
 *
 * The two incomplete sets are seeded as-is. When a missing volume turns up it
 * gets APPENDED at the next free number (24, 25, …) rather than inserted in
 * sequence — reading order within a series is expressed by `slug`/title, never
 * by renumbering a published UCI.
 */
export type ManifestEntry = {
  /** `books.number`. Frozen once seeded publicly. */
  number: number;
  /** File in `data-collection/`, verified to exist before any insert runs. */
  file: string;
  /** `books.slug` — the human handle; renameable, unlike the UCI. */
  slug: string;
};

export const MANIFEST: readonly ManifestEntry[] = [
  // Fatawa Ashaab-ul-Hadees — 5 volumes, Hafiz Abdul Sattar Hammad
  { number: 1, file: 'Fatawa-Ashaab-Ul-Hadees-Jild-01.db', slug: 'fatawa-ashaab-ul-hadees-jild-1' },
  { number: 2, file: 'Fataawa-ashaab-ul-hadees-jild-02.db', slug: 'fatawa-ashaab-ul-hadees-jild-2' },
  { number: 3, file: 'Fatawa-Ashaab-Ul-Hadees-Jild-03.db', slug: 'fatawa-ashaab-ul-hadees-jild-3' },
  { number: 4, file: 'Fatawa-Ashaab-Ul-Hadees-Jild-04.db', slug: 'fatawa-ashaab-ul-hadees-jild-4' },
  { number: 5, file: 'Fatawa-Ashaab-Ul-Hadees-Jild-5.db', slug: 'fatawa-ashaab-ul-hadees-jild-5' },

  // Fatawa Ibn Baz — 2 volumes
  { number: 6, file: 'Fatawa-Ebne-Baaz-jild-1.db', slug: 'fatawa-ibn-baz-jild-1' },
  { number: 7, file: 'Fatawa-Ebne-Baaz-jild-2.db', slug: 'fatawa-ibn-baz-jild-2' },

  // Fatawa Saniyya Madaniyya — volumes 2-4 present, Hafiz Sanaullah Madani
  { number: 8, file: 'Ftawa-Saniya-Madniya-Jild-2.db', slug: 'fatawa-saniyya-madaniyya-jild-2' },
  { number: 9, file: 'Ftawa-Saniya-Madniya-Jild-3.db', slug: 'fatawa-saniyya-madaniyya-jild-3' },
  { number: 10, file: 'Ftawa-Saniya-Madniya-Jild-4.db', slug: 'fatawa-saniyya-madaniyya-jild-4' },

  // Fatawa Islamia — volume 2 present
  { number: 11, file: 'Fataawa-Islamia-Jlid-2.db', slug: 'fatawa-islamia-jild-2' },

  // Single works
  { number: 12, file: 'Arkan-E-Islam-Say-Mutaliq-Ahm-Fataway.db', slug: 'arkan-e-islam-say-mutaliq-aham-fatawa' },
  { number: 13, file: 'Fatawa-Arkan-e-Islam.db', slug: 'fatawa-arkan-e-islam' },
  { number: 14, file: 'Fatawa-Barai-Khawateen.db', slug: 'fatawa-barai-khawateen' },
  { number: 15, file: 'Fatawa-Nawab-Saddique-Hassan-Khan.db', slug: 'fatawa-nawab-siddique-hasan-khan' },
  { number: 16, file: 'Fatawa-Nikaah-o-Talaaq.db', slug: 'fatawa-nikah-o-talaq' },
  { number: 17, file: 'Fatawa-Rashdiya.db', slug: 'fatawa-rashidiya' },
  { number: 18, file: 'Fatawa-Sira-te-Mustaqeem.db', slug: 'fatawa-sirat-e-mustaqeem' },
  { number: 19, file: 'Majmoua-Fatawa.db', slug: 'majmua-fatawa' },
  { number: 20, file: 'Maqalat-wa-Fatawa-Bin-Baaz.db', slug: 'maqalat-wa-fatawa-bin-baz' },
  { number: 21, file: 'Tafheem-E-Deen.db', slug: 'tafheem-e-deen' },
  { number: 22, file: 'silsilah-Fatawa-Ulama-e-Ahlehadith-3-Abdulrehman-mubark-Pori.db', slug: 'silsila-fatawa-ulama-e-ahlehadith-3' },

  // Anthology last: `Writer`/`Publisher`/`Volume` are all `متفرق` ("various"),
  // pages are ~1 fatwa each, and it is the only file with a `txtSearch` column.
  { number: 23, file: 'ijtimaee-nizam.db', slug: 'ijtimaee-nizam' },
];
