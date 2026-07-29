import type { Metadata } from 'next';
import { Noto_Nastaliq_Urdu, Noto_Sans_Arabic } from 'next/font/google';
import type { ReactNode } from 'react';

import { DirectionProvider } from '@/components/ui/direction';
import { cn } from '@/lib/utils';

import './globals.css';

/**
 * Two families, because one cannot do both jobs.
 *
 * Nastaliq is the script Urdu readers expect for prose — it is calligraphic, it
 * slopes, and its descenders reach far below the baseline, so it needs roughly
 * double leading (see `--leading-nastaliq` in globals.css) or successive lines
 * collide. It is also a heavy download and hard to scan in small UI chrome.
 *
 * Naskh (Noto Sans Arabic) is upright and compact, so it carries the interface:
 * labels, counts, page numbers. Both subset to `arabic`, which is the Unicode
 * block Urdu lives in — there is no separate `urdu` subset.
 *
 * `next/font` self-hosts both at build time, so no request ever leaves for
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

export const metadata: Metadata = {
  title: 'فتاویٰ کتب',
  description: 'اردو فتاویٰ کتب کا مجموعہ — ۲۳ کتابیں',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    // `lang="ur"` drives font fallback and hyphenation; `dir="rtl"` flips every
    // logical Tailwind utility (`ps-`/`pe-`/`start-`/`end-`) across the app.
    <html lang="ur" dir="rtl" className={cn(naskh.variable, nastaliq.variable)}>
      <body className="font-sans antialiased">
        {/*
          CSS `dir` alone is not enough for Radix: its primitives read direction
          from this context to decide arrow-key order and which side a popover
          opens on. Without it, keyboard navigation stays left-to-right even
          though the layout is mirrored.
        */}
        {/* `dir`, not the wrapper's `direction` alias: shadcn types `dir` as
            required, so the documented `direction`-only form does not compile. */}
        <DirectionProvider dir="rtl">{children}</DirectionProvider>
      </body>
    </html>
  );
}
