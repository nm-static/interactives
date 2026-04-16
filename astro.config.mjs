// @ts-check
import { defineConfig, fontProviders } from "astro/config";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";

import react from "@astrojs/react";
import tailwindcss from "@tailwindcss/vite";
import node from "@astrojs/node";

// https://astro.build/config
export default defineConfig({
  site: "https://interactives.neeldhara.com",
  integrations: [mdx(), sitemap(), react()],
  output: "static",
  adapter: node({ mode: "standalone" }),

  fonts: [
    {
      provider: fontProviders.fontsource(),
      name: "Imprima",
      cssVariable: "--font-imprima",
    },
  ],

  vite: {
    plugins: [tailwindcss()],
  },
});
