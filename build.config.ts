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
      target: "esnext",
      tsconfigRaw: {
        compilerOptions: {
          useDefineForClassFields: false,
        },
      },
    },
  },
});
