import laioutrrc from '../laioutrrc.json';
import srcModule from '../src/module';

// Disable project secret key for playground
laioutrrc.laioutr.projectSecretKey = false as any;

export default defineNuxtConfig({
  modules: [
    srcModule,
    '@pinia/nuxt', // Added to show in devtools
    '@laioutr-core/frontend-core',
    '@laioutr-core/orchestr-devtools',
  ],
  laioutr: {
    laioutrrc: laioutrrc as any,
  },
  devtools: { enabled: true },
  compatibilityDate: '2025-09-11',
});
