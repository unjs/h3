// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  extends: ["@nuxt/ui-pro"],
  modules: [
    "@nuxt/content",
    "@nuxt/ui",
    "@nuxthq/studio",
    "@nuxtjs/fontaine",
    "@nuxtjs/google-fonts",
    "nuxt-og-image",
  ],
  hooks: {
    // Define `@nuxt/ui` components as global to use them in `.md` (feel free to add those you need)
    "components:extend": (components) => {
      const globals = components.filter((c) =>
        ["UButton"].includes(c.pascalName),
      );

      globals.forEach((c) => (c.global = true));
    },
  },
  ui: {
    icons: ["heroicons", "simple-icons"],
  },
  // Fonts
  fontMetrics: {
    fonts: ["DM Sans"],
  },
  googleFonts: {
    display: "swap",
    download: true,
    families: {
      "DM+Sans": [400, 500, 600, 700],
    },
  },
  routeRules: {
    "/api/search.json": { prerender: true },
  },
  // Devtools / Typescript
  devtools: { enabled: true },
  typescript: { strict: false },
});
