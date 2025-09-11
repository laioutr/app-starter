import { defineNuxtModule, createResolver, installModule } from "@nuxt/kit";
import { name, version } from "../package.json";
import { registerLaioutrApp } from "@laioutr-core/kit";

// Module options TypeScript interface definition
export interface ModuleOptions {}

export default defineNuxtModule<ModuleOptions>({
  meta: {
    name,
    version,
    configKey: name, // configKey must match package name
  },
  // Default configuration options of the Nuxt module
  defaults: {},
  async setup(_options, nuxt) {
    const { resolve } = createResolver(import.meta.url);

    // Register various laioutr-specific functions.
    await registerLaioutrApp({
      name,
      version,
      orchestrDirs: [resolve("runtime/server/orchestr")],
    });

    // Install peer-dependency modules on prepare-step, so they can be used through their aliases and auto-imports.
    if (nuxt.options._prepare) {
      await installModule("@laioutr-core/frontend-core");
      await installModule("@laioutr-core/orchestr");
    }
  },
});
