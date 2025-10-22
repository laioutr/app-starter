import { createResolver, defineNuxtModule, installModule } from "@nuxt/kit";
import { defu } from "defu";
import { registerLaioutrApp } from "@laioutr-core/kit";
import type { NuxtModule } from "@nuxt/schema";
import { name, version } from "../package.json";

/**
 * The options the module adds to the nuxt.config.ts.
 */
export interface ModuleOptions {
  apiURL: string;
  authURL: string;
  projectKey: string;
  clientId: string;
  clientSecret: string;
}

/**
 * The config the module adds to nuxt.runtimeConfig.public['@laioutr-app/commercetools']
 */
export interface RuntimeConfigModulePublic {} // eslint-disable-line @typescript-eslint/no-empty-object-type

/**
 * The config the module adds to nuxt.runtimeConfig['@laioutr-app/commercetools']
 */
export interface RuntimeConfigModulePrivate extends ModuleOptions {} // eslint-disable-line @typescript-eslint/no-empty-object-type

const module: NuxtModule<ModuleOptions> = defineNuxtModule<ModuleOptions>({
  meta: {
    name,
    version,
    configKey: name,
  },
  defaults: {
    apiURL: "https://api.eu-central-1.aws.commercetools.com",
    authURL: "https://auth.eu-central-1.aws.commercetools.com",
    projectKey: "laioutr-demo",
  },
  async setup(options, nuxt) {
    const { resolve } = createResolver(import.meta.url);
    const resolveRuntimeModule = (path: string) => resolve("./runtime", path);

    nuxt.options.build.transpile.push(resolve("./runtime"));

    // Runtime configuration for this module
    // These two statements can be removed if you don't provide a runtime config
    nuxt.options.runtimeConfig[name] = defu(
      nuxt.options.runtimeConfig[name] as Parameters<typeof defu>[0],
      options
    );
    nuxt.options.runtimeConfig.public[name] = defu(
      nuxt.options.runtimeConfig.public[name] as Parameters<typeof defu>[0],
      options
    );

    await registerLaioutrApp({
      name,
      version,
      orchestrDirs: [resolveRuntimeModule("server/orchestr")],
    });

    // Install peer-dependency modules only on prepare-step. Needs to be added in the playground as well.
    if (nuxt.options._prepare) {
      const modulesToInstall = ["@laioutr-core/frontend-core", "@nuxt/image"];

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

export default module;

export * from "./globalExtensions";
