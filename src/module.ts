/* eslint-disable @typescript-eslint/no-empty-object-type */
import { createResolver, defineNuxtModule, installModule } from '@nuxt/kit';
import { defu } from 'defu';
import { registerLaioutrApp } from '@laioutr-core/kit';
import type { Nuxt } from '@nuxt/schema';
import { name, version } from '../package.json';

/**
 * The options the module adds to the nuxt.config.ts.
 */
export interface ModuleOptions {}

/**
 * The config the module adds to nuxt.runtimeConfig.public['my-laioutr-app']
 */
export interface RuntimeConfigModulePublic {}

/**
 * The config the module adds to nuxt.runtimeConfig['my-laioutr-app']
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
    const resolveRuntimeModule = (path: string) => resolve('./runtime', path);

    nuxt.options.build.transpile.push(resolve('./runtime'));

    // Runtime configuration for this module
    // These two statements can be removed if you don't provide a runtime config
    nuxt.options.runtimeConfig[name] = defu(nuxt.options.runtimeConfig[name] as Parameters<typeof defu>[0], _options);
    nuxt.options.runtimeConfig.public[name] = defu(nuxt.options.runtimeConfig.public[name] as Parameters<typeof defu>[0], _options);

    // Apply runtime config types for this module
    applyRuntimeConfigTypes(nuxt);

    // Setup TypeScript configuration for the module during development.
    // This makes type checking respect server and client separation within the module.
    applyTypeScriptConfig(nuxt, resolve);

    await registerLaioutrApp({
      name,
      version,
      orchestrDirs: [resolveRuntimeModule('server/orchestr')],
      sections: [resolveRuntimeModule('app/sections')],
      blocks: [resolveRuntimeModule('app/blocks')],
    });

    // Install peer-dependency modules only on prepare-step.
    // This makes auto-imports and import-aliases work. Remove any modules you might not need.
    if (nuxt.options._prepare) {
      await installModule('@nuxt/image');
      await installModule('@laioutr-core/frontend-core');
      await installModule('@laioutr-core/orchestr');
      await installModule('@laioutr-app/ui');
    }

    // Shared
    // Imports and other stuff which is shared between client and server

    // Client
    // Add plugins, composables, etc.

    // Server
    // Add server-only imports, etc.
  },
});

const applyRuntimeConfigTypes = (nuxt: Nuxt) => {
  const { resolve } = createResolver(import.meta.url);
  const typed = (config: unknown, type: string) => ({
    ...(config as Record<string, unknown>),
    $schema: { tsType: `import(${JSON.stringify(resolve('./module'))}).${type}` },
  });

  nuxt.hook('app:templates', (app) => {
    const index = app.templates.findIndex((template) => template.filename === 'types/schema.d.ts');
    const schema = app.templates[index];
    const getContents = schema?.getContents;
    if (!schema || !getContents) return;
    app.templates[index] = {
      ...schema,
      getContents: (data) => {
        const { runtimeConfig } = data.nuxt.options;
        const options = Object.create(data.nuxt.options, {
          runtimeConfig: {
            value: {
              ...runtimeConfig,
              [name]: typed(runtimeConfig[name], 'RuntimeConfigModulePrivate'),
              public: { ...runtimeConfig.public, [name]: typed(runtimeConfig.public[name], 'RuntimeConfigModulePublic') },
            },
          },
        });
        return getContents({ ...data, nuxt: Object.create(data.nuxt, { options: { value: options } }) });
      },
    };
  });
};

const applyTypeScriptConfig = (nuxt: Nuxt, resolve: (...path: string[]) => string) => {
  if (nuxt.options._prepare && nuxt.options.rootDir === resolve('..')) {
    const serverRuntime = resolve('./runtime/server');
    nuxt.hook('prepare:types', ({ tsConfig }) => {
      tsConfig.exclude = [...(tsConfig.exclude ?? []), serverRuntime, resolve('../playground')];
    });
    nuxt.hook('nitro:init', (nitro) => {
      nitro.hooks.hook('types:extend', ({ tsConfig }) => {
        if (!tsConfig) return;
        tsConfig.include = [...(tsConfig.include ?? []).filter((path) => !path.endsWith('**/*')), serverRuntime];
      });
    });
  }
};
