// @ts-check
import { defineConfig, fontProviders } from "astro/config";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";

import react from "@astrojs/react";
import tailwindcss from "@tailwindcss/vite";
import netlify from "@astrojs/netlify";

// https://astro.build/config
export default defineConfig({
  site: "https://interactives.neeldhara.com",
  integrations: [mdx(), sitemap(), react()],
  output: "static",
  adapter: netlify(),

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
