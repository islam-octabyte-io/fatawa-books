import type { NextConfig } from 'next';

/**
 * Intentionally near-empty.
 *
 * In particular there is no `rewrites` proxy to the backend: pages are rendered
 * as server components that call the API directly over `API_URL`, so the browser
 * never issues a cross-origin request and no proxy hop is needed. If a client
 * component ever has to fetch, revisit this — the backend already allows any
 * origin (`CORS_ORIGIN=*`, GET only), so a rewrite would be a fallback, not a
 * requirement.
 */
const nextConfig: NextConfig = {};

export default nextConfig;
