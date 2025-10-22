import srcModule from "../src/module";
import laioutrrc from "../laioutrrc.json";

const appsToUninstall = ["@laioutr-app/ui", "@laioutr-app/shopify"];

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
  "@laioutr-app/commercetools": {
    apiURL: "https://api.eu-central-1.aws.commercetools.com",
    authURL: "https://auth.eu-central-1.aws.commercetools.com",
    projectKey: "laioutr-demo",
    clientId: process.env.COMMERCETOOLS_API_CLIENT_ID,
    clientSecret: process.env.COMMERCETOOLS_API_CLIENT_SECRET,
  },
  devtools: { enabled: true },
  compatibilityDate: "2025-09-11",
  vite: {
    optimizeDeps: {
      include: ["ajv", "json-source-map", "natural-compare-lite"],
    },
  },
});
