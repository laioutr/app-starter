import srcModule from "../src/module";
import laioutrrc from "../laioutrrc.json";

export default defineNuxtConfig({
  modules: [
    srcModule,
    "@pinia/nuxt", // Added to show in devtools
    "@laioutr-core/frontend-core",
    "@laioutr-core/orchestr",
    "@laioutr-core/orchestr-devtools",
  ],
  laioutr: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    laioutrrc: laioutrrc as any,
  },
  i18n: {
    bundle: {
      optimizeTranslationDirective: false,
    },
  },
  myModule: {},
  devtools: { enabled: true },
  compatibilityDate: "2025-09-11",
});
