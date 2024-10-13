import { readdir } from "node:fs/promises";
import { listenAndWatch } from "listhen";

async function promptExample() {
  const { consola } = await import("consola");
  const exampleFiles = await readdir(new URL(".", import.meta.url)).then((r) =>
    r.filter((f) => f.endsWith(".ts")),
  );
  return await consola.prompt("Select an example to run:", {
    type: "select",
    options: exampleFiles,
  });
}

const exampleFile = process.argv[2] || (await promptExample());

listenAndWatch(new URL(exampleFile, import.meta.url), {
  name: `H3 example: ${exampleFile}`,
});
