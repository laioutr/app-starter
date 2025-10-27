import { defineNuxtModule, createResolver, installModule } from "@nuxt/kit";
import { defu } from "defu";
import { name, version } from "../package.json";
import { registerLaioutrApp } from "@laioutr-core/kit";

/**
 * The options the module adds to the nuxt.config.ts.
 */
export interface ModuleOptions {}

/**
 * The config the module adds to nuxt.runtimeConfig.public['@laioutr-app/commercetools']
 */
export interface RuntimeConfigModulePublic {}

/**
 * The config the module adds to nuxt.runtimeConfig['@laioutr-app/commercetools']
 */
export interface RuntimeConfigModulePrivate extends ModuleOptions {}

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
    const resolveRuntimeModule = (path: string) => resolve("./runtime", path);

    nuxt.options.build.transpile.push(resolve("./runtime"));

    // Runtime configuration for this module
    // These two statements can be removed if you don't provide a runtime config
    nuxt.options.runtimeConfig[name] = defu(
      nuxt.options.runtimeConfig[name] as Parameters<typeof defu>[0],
      _options
    );
    nuxt.options.runtimeConfig.public[name] = defu(
      nuxt.options.runtimeConfig.public[name] as Parameters<typeof defu>[0],
      _options
    );

    await registerLaioutrApp({
      name,
      version,
      orchestrDirs: [resolveRuntimeModule("server/orchestr")],
    });

    // Install peer-dependency modules only on prepare-step. Needs to be added in the playground as well.
    if (nuxt.options._prepare) {
      const modulesToInstall = [
        "@laioutr-core/orchestr",
        "@laioutr-core/frontend-core",
        "@nuxt/image",
      ];

      for (const module of modulesToInstall) await installModule(module);
    }

    // Shared
    // Imports and other stuff which is shared between client and server

    // Client
    // Add plugins, composables, etc.

    // Server
    // Add server-only imports, etc.
  },
});
