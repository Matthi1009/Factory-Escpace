import { defineConfig } from 'vite';

// base './' damit der Build auch unter https://<user>.github.io/<repo>/ läuft (GitHub Pages)
export default defineConfig({
  base: './',
});
