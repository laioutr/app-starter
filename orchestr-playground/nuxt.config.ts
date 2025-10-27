import srcModule from "../src/module";
import laioutrrc from "../laioutrrc.json";

const appsToUninstall = ["@laioutr-app/ui"];

// Uncomment the below line if you don't want/need Shopify
// appsToUninstall.push("@laioutr-app/shopify")

const clean_laioutrrc = {
  ...laioutrrc,

  laioutr: {
    projectSecretKey: false,
  },
  apps: laioutrrc.apps.filter((app) => !appsToUninstall.includes(app.name)),
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
    laioutrrc: clean_laioutrrc as any,
  },
  i18n: {
    bundle: {
      optimizeTranslationDirective: false,
    },
  },
  devtools: { enabled: true },
  compatibilityDate: "2025-09-11",
  vite: {
    optimizeDeps: {
      include: ["ajv", "json-source-map", "natural-compare-lite"],
    },
  },
});
