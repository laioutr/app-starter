<!--
Get your module up and running quickly.

Find and replace all on all files (CMD+SHIFT+F):
- Name: My Laioutr App
- Package name: my-laioutr-app
- Description: My new Laioutr App
-->

# My Laioutr App

[![Laioutr][laioutr-src]][laioutr-href]
[![npm version][npm-version-src]][npm-version-href]
[![npm downloads][npm-downloads-src]][npm-downloads-href]
[![License][license-src]][license-href]
[![Nuxt][nuxt-src]][nuxt-href]

My new [Laioutr](https://laioutr.com) App for doing amazing things using Nuxt.

See [laioutr.com](https://laioutr.com) for more information about Laioutr.

- [✨ &nbsp;Release Notes](/CHANGELOG.md)
  <!-- - [🏀 Online playground](https://stackblitz.com/github/your-org/my-laioutr-app?file=playground%2Fapp.vue) -->
  <!-- - [📖 &nbsp;Documentation](https://example.com) -->

## Features

<!-- Highlight some of the features your module provide here -->

- ⛰ &nbsp;Foo
- 🚠 &nbsp;Bar
- 🌲 &nbsp;Baz

## Quick Setup

Follow the [Laioutr NPM Guide](https://docs.laioutr.com/cockpit/project-settings/npm) for connecting to [npm.laioutr.cloud](https://npm.laioutr.cloud).

- `pnpm install`
- `npx @laioutr/cli project fetch-rc --project <organization slug>/<project slug> --secret <project secret key>` - This will load the `laioutrrc.json` file with the current remote project configuration.
- `pnpm dev:prepare`

That's it! You can now use My Laioutr App in your [Laioutr Frontend](https://laioutr.com) ✨

You can find a thorough guide on getting started with Laioutr development in our [developer guide](https://docs.laioutr.com/getting-started/next-steps/local-setup).

## Linting and Formatting

We use ESLint and Prettier to lint and format the code. This repository contains opinionated configurations for both tools. You can, of course, replace them with your own configurations.

## Publishing

Releases run through [changesets](https://github.com/changesets/changesets) and publish to npmjs.org
with [npm trusted publishing](https://docs.npmjs.com/trusted-publishers), so CI needs no npm token and
every release carries provenance.

Day to day: run `pnpm changeset` to describe your change and merge it. The release workflow opens a
"chore: release" PR collecting the pending changesets; merging **that** builds and publishes.

### One-time setup per repository

1. **Repository secrets**
   - `NPM_LAIOUTR_TOKEN` — read access to npm.laioutr.cloud, so CI can install `@laioutr-core/*`.
   - `RELEASE_TOKEN` — a fine-grained PAT owned by the org, scoped to this repo, with **Contents:
     read and write** and **Pull requests: read and write**. A PR opened with the default
     `GITHUB_TOKEN` cannot trigger workflows, so release PRs would arrive with no CI and could never
     satisfy a required-status rule.

2. **Bootstrap the package on npm.** Trusted publishing is configured on a package that already
   exists, so the very first version has to be published by hand. `publishConfig.provenance` fails
   outside CI — there is no OIDC provider — so disable it for that one publish:

   ```bash
   pnpm prepack
   npm publish --access public --no-provenance
   ```

   A brand-new package can 404 on the registry for a few minutes afterwards. That is replication lag,
   not a failed publish; check again before re-running anything.

3. **Configure the trusted publisher** on the package's npm settings page: GitHub Actions,
   this repository, workflow `release.yml`. Every release after that is tokenless.

### Private publishing

If you want to publish a private package to npm.laioutr.cloud, you need to:

1. Make sure you have a `.npmrc` with your private npm registry token.
2. Replace the `publishConfig` block in `package.json` with `{ "registry": "https://npm.laioutr.cloud/" }`.
   Drop `access` and `provenance` — provenance is npmjs-only, and leaving it on makes every publish fail.
3. Make sure your package-name follows the `@laioutr-org/<organization-slug>__<package-name>` format.

After that you can run `pnpm release` to publish the package to npm.laioutr.cloud. The trusted-publisher
setup above does not apply; authentication comes from the token in your `.npmrc`.

More information for publishing can be found in the [NPM Guide](https://docs.laioutr.com/cockpit/project-settings/npm#publish-an-organization-package).

## Contribution

Follow the [setup guide](https://docs.laioutr.com/getting-started/next-steps/local-setup) to get started.

<!-- Badges -->

[npm-version-src]: https://img.shields.io/npm/v/my-laioutr-app/latest.svg?style=flat&colorA=020420&colorB=00DC82
[npm-version-href]: https://npmjs.com/package/my-laioutr-app
[npm-downloads-src]: https://img.shields.io/npm/dm/my-laioutr-app.svg?style=flat&colorA=020420&colorB=00DC82
[npm-downloads-href]: https://npm.chart.dev/my-laioutr-app
[license-src]: https://img.shields.io/npm/l/my-laioutr-app.svg?style=flat&colorA=020420&colorB=00DC82
[license-href]: https://npmjs.com/package/my-laioutr-app
[nuxt-src]: https://img.shields.io/badge/Nuxt-020420?logo=nuxt.js
[nuxt-href]: https://nuxt.com
[laioutr-src]: https://img.shields.io/badge/%F0%9F%A6%99_Laioutr_App-702DCE
[laioutr-href]: https://www.laioutr.com/
