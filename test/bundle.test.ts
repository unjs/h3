import { describe, it, expect } from "vitest";
import { build } from "esbuild";
import { fileURLToPath } from "node:url";
import zlib from "node:zlib";

describe("benchmark", () => {
  it("bundle size", async () => {
    const code = /* js */ `
      import { createApp, createRouter, toWebHandler } from "../dist/index.mjs";
      const router = createRouter();
      const app = createApp().use(router);
      export default toWebHandler(app);
    `;
    const { bytes, gzipSize } = await getBundleSize(code);
    // console.log("bundle size", { bytes, gzipSize });
    expect(bytes).toBeLessThanOrEqual(12_000); // <12kb
    expect(gzipSize).toBeLessThanOrEqual(5000); // <5kb
  });
});

async function getBundleSize(code: string) {
  const res = await build({
    bundle: true,
    metafile: true,
    write: false,
    minify: true,
    format: "esm",
    platform: "node",
    outfile: "index.mjs",
    stdin: {
      contents: code,
      resolveDir: fileURLToPath(new URL(".", import.meta.url)),
      sourcefile: "index.mjs",
      loader: "js",
    },
  });
  const { bytes } = res.metafile.outputs["index.mjs"];
  const gzipSize = zlib.gzipSync(res.outputFiles[0].text).byteLength;
  return { bytes, gzipSize };
}
