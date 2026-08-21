# Fail-Soft Resilience

Applies to everything this app ships at runtime — Orchestr handlers
(`src/runtime/server/orchestr/**`), server routes, section and block data paths — and to any
code path reachable from customer data.

Untrusted inputs — anything here can be malformed and must not hard-fail the system:
laioutrrc / Studio-edited config (markets, languages, domains, redirects, pages, section
props), upstream platform API responses, request data (host, cookies, query, bodies), and
the environment (env vars, cache backends).

## The rule

**Data we do not control must never fail a build or take down a whole request.**

1. **Blast radius = the unit of bad data.** Guard inside the loop, not above it. One bad
   redirect row, market, page variant, section prop, or product record costs exactly that
   unit — never the build, the Nitro function, or the page. The archetype: one Magento
   price with excess decimals made `Money.fromDecimal` throw, which failed the whole
   query and blanked every product slider.
2. **Degrade loudly.** Fallback + `console.warn` naming the offending unit's id (market
   slug, redirect id, entity id) and what was substituted. A silent fallback is as wrong
   as a crash — it just moves the debugging to someone with less context.
3. **Fail-soft lives in the data path, not in components.** Vue's server renderer wraps
   the render in `try/finally` with no catch: `onErrorCaptured` and error boundaries
   never fire during SSR. `<ErrorBoundary>` protects the hydrated client only — never
   count on it for resilience.
4. **Module scope is boot scope.** Code at module scope of a server route/middleware, or
   running during `nuxt build`, executes before any per-request error handling exists.
   Per-item guarding is mandatory there.
5. **Wrap dependency calls that throw on data** whenever the input is untrusted:
   ts-money (`fromDecimal` needs the `'round'` argument), `Intl.*` constructors,
   `new URL()`, `JSON.parse`, zod `.parse` (prefer `.safeParse`). And the inverse trap:
   `Number()`/`parseInt` producing `NaN` that flows into money or quantity math is
   corruption, not resilience — guard both directions.

Gold standard: `buildI18nConfig` in `@laioutr-core/frontend-core` — per-item try/catch,
synthesized fallback objects, warnings with docs links, output that is degraded but
serviceable.

## When to fail hard — deliberately

Fail hard when serving would be wrong or dangerous, then attribute precisely instead of
softening:

- **Security boundaries** get no fallback (the project-secret gate on `/api/laioutr/*`).
- **A commerce connector that fails to install or register.** A storefront silently
  serving without its products is worse than a failed deploy.
- **Hard dependencies with no substitute** (registry unreachable during install).

On these paths the resilience work is diagnostics, not softening: the error must name
the failing `app@version`, credential, or config unit so the customer is never left
decoding someone else's opaque stack trace (a missing plugin file must not surface as a
Rollup `node_modules` resolve error).

## Boundaries

- Fail-soft is not error-swallowing. A bare `catch {}` without a fallback value and a
  warning fails review.
- Where a fallback would _corrupt_ (wrong prices, wrong redirects to the homepage,
  wrong legal state), the correct policy is validate-early with a clear, attributed
  error — not a guess.
