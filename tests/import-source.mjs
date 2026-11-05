import { readFile } from "node:fs/promises";
import ts from "typescript";
export async function importSource(path) {
  const source = await readFile(new URL(path, import.meta.url), "utf8");
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: {
      target: ts.ScriptTarget.ES2023,
      module: ts.ModuleKind.ESNext,
    },
  });
  const resolved = outputText.replace(
    'from "zod"',
    `from "${import.meta.resolve("zod")}"`,
  );
  return import(
    `data:text/javascript;base64,${Buffer.from(resolved).toString("base64")}`
  );
}
