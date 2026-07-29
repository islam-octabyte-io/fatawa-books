'use client';

import { ThemeProvider as NextThemeProvider } from 'next-themes';
import type { ReactNode } from 'react';

/**
 * The `.dark` palette already exists in globals.css; this is what applies it.
 *
 * `attribute="class"` matches the `@custom-variant dark (&:is(.dark *))` the
 * stylesheet is written against — the default `data-theme` attribute would set
 * something no selector reads. `defaultTheme="system"` because a reference
 * library should open in whatever the reader's OS is already set to.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  return (
    <NextThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      {children}
    </NextThemeProvider>
  );
}
