// `eslint-config-next/core-web-vitals` already spreads the base config, so it is
// the only entry needed — importing both would register every plugin twice.
import nextCoreWebVitals from 'eslint-config-next/core-web-vitals';

const config = [
  {
    // `.next/` holds generated output and `api-types.d.ts` is machine-written from
    // the backend's OpenAPI document; neither is ours to lint.
    ignores: ['.next/**', 'next-env.d.ts', 'lib/api-types.d.ts'],
  },
  ...nextCoreWebVitals,
];

export default config;
