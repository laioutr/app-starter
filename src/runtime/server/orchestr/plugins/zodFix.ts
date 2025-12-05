import { defineNitroPlugin } from '#imports';
import { applyZodFix } from '@laioutr-core/core-types/utils';

export default defineNitroPlugin(() => {
  applyZodFix();
});
