import { existsSync, readFileSync } from 'node:fs';
import placeholderRc from './fixtures/laioutrrc.json';
import srcModule from '../src/module';

const rcPath = new URL('../laioutrrc.json', import.meta.url);

// Until `pnpm rc:fetch` has written your project's configuration, the playground runs on a
// placeholder project, so a fresh clone and CI start without one.
const laioutrrc = existsSync(rcPath) ? JSON.parse(readFileSync(rcPath, 'utf8')) : placeholderRc;

// Disable project secret key for playground
laioutrrc.laioutr.projectSecretKey = false;

export default defineNuxtConfig({
  modules: [
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
