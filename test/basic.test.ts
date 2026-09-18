import { fileURLToPath } from 'node:url';
import { $fetch, setup } from '@nuxt/test-utils/e2e';
import { describe, expect, it } from 'vitest';

describe('ssr', async () => {
  await setup({
    rootDir: fileURLToPath(new URL('./fixtures/basic', import.meta.url)),
  });

  it('renders the index page', async () => {
    // Get response to a server-rendered page with `$fetch`.
    const html = await $fetch('/');
    // The fixture renders `<LfcApp />`, so frontend-core's generator tag proves the module booted with it.
    expect(html).toContain('<meta name="generator" content="Laioutr">');
  });
});
