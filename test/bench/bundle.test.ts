import { describe, it, expect } from "vitest";
import { build } from "esbuild";
import { fileURLToPath } from "node:url";
import zlib from "node:zlib";

describe("benchmark", () => {
  it("bundle size", async () => {
    const code = /* js */ `
      import { createH3 } from "../../dist/index.mjs";
      // import { createH3 } from "../../src";
      export default createH3();
    `;
    const { bytes, gzipSize } = await getBundleSize(code);
    console.log(`Bundle size: ${bytes} (gzip: ${gzipSize})`);
    expect(bytes).toBeLessThanOrEqual(11_000); // <11kb
    expect(gzipSize).toBeLessThanOrEqual(4000); // <4kb
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
