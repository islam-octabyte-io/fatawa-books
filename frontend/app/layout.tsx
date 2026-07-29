import type { Metadata } from 'next';
import {
  Noto_Naskh_Arabic,
  Noto_Nastaliq_Urdu,
  Noto_Sans_Arabic,
} from 'next/font/google';
import type { ReactNode } from 'react';

import { SiteHeader } from '@/components/site-header';
import { ThemeProvider } from '@/components/theme-provider';
import { DirectionProvider } from '@/components/ui/direction';
import { cn } from '@/lib/utils';

import './globals.css';

/**
 * Three families, because none of them can do the others' job.
 *
 * Nastaliq is the script Urdu readers expect for prose — it is calligraphic, it
 * slopes, and its descenders reach far below the baseline, so it needs roughly
 * double leading (see `--leading-nastaliq` in globals.css) or successive lines
 * collide. It is also a heavy download and hard to scan in small UI chrome.
 *
 * Noto Sans Arabic is upright and compact, so it carries the interface: labels,
 * counts, page numbers. All three subset to `arabic`, which is the Unicode block
 * Urdu lives in — there is no separate `urdu` subset.
 *
 * Noto Naskh Arabic is for the Arabic *inside* the corpus (38,156 spans marked
 * `la` — Qur'anic verses and hadith quoted within Urdu prose). Setting those in
 * the sans UI face makes scripture read like interface text; naskh is the form
 * they are printed in, and the change of face does the work a blockquote would
 * do in a Latin document.
 *
 * `next/font` self-hosts all three at build time, so no request ever leaves for
 * Google and there is no layout shift from a late webfont.
 */
const nastaliq = Noto_Nastaliq_Urdu({
  subsets: ['arabic'],
  variable: '--font-nastaliq',
  display: 'swap',
});

const naskh = Noto_Sans_Arabic({
  subsets: ['arabic'],
  variable: '--font-sans',
  display: 'swap',
});

const naskhArabic = Noto_Naskh_Arabic({
  subsets: ['arabic'],
  variable: '--font-arabic',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'فتاویٰ کتب',
  description: 'اردو فتاویٰ کتب کا مجموعہ — ۲۳ کتابیں',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    // `lang="ur"` drives font fallback and hyphenation; `dir="rtl"` flips every
    // logical Tailwind utility (`ps-`/`pe-`/`start-`/`end-`) across the app.
    //
    // `suppressHydrationWarning` is required by next-themes and only by it: the
    // theme script writes `class`/`style` on this element before React hydrates,
    // so the server HTML and the client DOM legitimately differ on this one node.
    <html
      lang="ur"
      dir="rtl"
      suppressHydrationWarning
      className={cn(naskh.variable, nastaliq.variable, naskhArabic.variable)}
    >
      <body className="font-sans antialiased">
        {/*
          CSS `dir` alone is not enough for Radix: its primitives read direction
          from this context to decide arrow-key order and which side a popover
          opens on. Without it, keyboard navigation stays left-to-right even
          though the layout is mirrored.
        */}
        {/* `dir`, not the wrapper's `direction` alias: shadcn types `dir` as
            required, so the documented `direction`-only form does not compile. */}
        <DirectionProvider dir="rtl">
          <ThemeProvider>
            <SiteHeader />
            {children}
          </ThemeProvider>
        </DirectionProvider>
      </body>
    </html>
  );
}
