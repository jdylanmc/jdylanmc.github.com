// @ts-check
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  redirects: {
    // PR Sniper has its own site; keep the old project URL working.
    "/projects/pr-sniper": "https://jdylanmc.github.io/pr-sniper/",
  },
});
