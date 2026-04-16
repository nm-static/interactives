// @ts-check
import { defineConfig, fontProviders } from "astro/config";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";

import react from "@astrojs/react";
import tailwindcss from "@tailwindcss/vite";
// Admin API runs as a standalone Netlify Function (see netlify/functions/admin.mts)

// https://astro.build/config
export default defineConfig({
  site: "https://interactives.neeldhara.com",
  integrations: [mdx(), sitemap(), react()],
  output: "static",

  fonts: [
    {
      provider: fontProviders.fontsource(),
      name: "Imprima",
      cssVariable: "--font-imprima",
    },
  ],

  vite: {
    plugins: [tailwindcss()],
    build: {
      target: "es2022",
      minify: "esbuild",
      // Sanitize chunk filenames — Netlify esbuild chokes on ! and ~ in names
      rollupOptions: {
        output: {
          sanitizeFileName: (name) => name.replace(/[^\w./-]/g, '_'),
        },
      },
    },
    esbuild: {
      target: "es2022",
      charset: "utf8",
    },
  },
});
