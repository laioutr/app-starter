import { existsSync, readFileSync } from 'node:fs';
import type { Nuxt } from '@nuxt/schema';
import srcModule from '../src/module';

const rcPath = new URL('../laioutrrc.json', import.meta.url);

// Optional: `dev:prepare` in CI and on a fresh clone runs without a project, and frontend-core
// generates types without one.
const laioutrrc = existsSync(rcPath) ? JSON.parse(readFileSync(rcPath, 'utf8')) : undefined;

// Disable project secret key for playground
if (laioutrrc) laioutrrc.laioutr.projectSecretKey = false;

const requireProjectConfig = (_options: unknown, nuxt: Nuxt) => {
  if (laioutrrc || nuxt.options._prepare) return;
  throw new Error(
    'laioutrrc.json is missing, so the playground has no project to render.\n' +
      'Fetch it with: pnpm rc:fetch -p <organization-slug>/<project-slug> -s <project-secret>'
  );
};

export default defineNuxtConfig({
  modules: [
    requireProjectConfig,
    srcModule,
    '@pinia/nuxt', // Added to show in devtools
    '@laioutr-core/frontend-core',
    '@laioutr-core/devtools',
  ],
  laioutr: {
    laioutrrc,
  },
  devtools: { enabled: true },
  compatibilityDate: '2025-09-11',
});
