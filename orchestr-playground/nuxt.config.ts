import srcModule from "../src/module";
import laioutrrc from "../laioutrrc.json";

// Do not install ui-app to avoid conflicts with unocss.
const rcWithoutUi = {
  ...laioutrrc,

  laioutr: {
    projectSecretKey: false,
  },
  apps: laioutrrc.apps.filter((app) => app.name !== "@laioutr-app/ui"),
};

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
    laioutrrc: rcWithoutUi as any,
  },
  myModule: {},
  devtools: { enabled: true },
  compatibilityDate: "2025-09-11",
  vite: {
    optimizeDeps: {
      include: ["ajv", "json-source-map", "natural-compare-lite"],
    },
  },
});
