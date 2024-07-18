import { defineBuildConfig } from "unbuild";

export default defineBuildConfig({
  declaration: true,
  rollup: {
    esbuild: {
      target: "ES2022",
      tsconfigRaw: {
        compilerOptions: {
          useDefineForClassFields: false,
        },
      },
    },
  },
});
