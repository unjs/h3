import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    typecheck2: { enabled: true },
    coverage: {
      include: ["src/**/*.ts"],
    },
  },
});
