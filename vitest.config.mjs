import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    setupFiles: ["./test/_setup"],
    typecheck: { enabled: true },
    coverage: {
      include: ["src/**/*.ts"],
      reporter: ["text", "clover", "json"],
    },
  },
});
