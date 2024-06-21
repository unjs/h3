import { defineBuildConfig } from "unbuild";

export default defineBuildConfig({
  declaration: true,
  rollup: {
    emitCJS: false,
    inlineDependencies: true,
    output: {
      chunkFileNames: "_shared.js",
    },
    esbuild: {
      target: "ES2020",
      tsconfigRaw: {
        compilerOptions: {
          useDefineForClassFields: false,
        },
      },
    },
  },
});
