import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "miniflare",
    // Configuration is automatically loaded from `.env`, `package.json` and
    // `wrangler.toml` files by default, but you can pass any additional Miniflare
    // API options here:
    environmentOptions: {
      bindings: { KEY: "value" },
      kvNamespaces: ["TEST_NAMESPACE"],
    },
  },
});
