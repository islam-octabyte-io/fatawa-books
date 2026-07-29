'use client';

import { MoonIcon, SunIcon } from 'lucide-react';
import { useTheme } from 'next-themes';

import { Button } from '@/components/ui/button';

/**
 * Light/dark switch.
 *
 * The active theme is only knowable in the browser — it can come from the OS —
 * so the icon cannot be rendered on the server. Rather than suppress a hydration
 * warning, this leans on the fact that `resolvedTheme` is `undefined` until
 * next-themes has read the stored preference: server render and first client
 * render agree on an empty button, and the icon appears once the answer is real.
 * The button keeps its size throughout, so the header never reflows and no wrong
 * icon flashes.
 *
 * That also replaces the usual `useState` + `useEffect` mounted flag, which sets
 * state synchronously in an effect and triggers a cascading render.
 */
export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();

  const resolved = resolvedTheme !== undefined;
  const isDark = resolvedTheme === 'dark';

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      aria-label={isDark ? 'روشن انداز' : 'تاریک انداز'}
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      disabled={!resolved}
    >
      {resolved ? isDark ? <SunIcon /> : <MoonIcon /> : null}
    </Button>
  );
}
