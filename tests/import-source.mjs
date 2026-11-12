import { readFile } from "node:fs/promises";
import ts from "typescript";
async function sourceUrl(path) {
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
  const withListQuery = resolved.includes('from "@/lib/list-page"')
    ? resolved.replace(
        'from "@/lib/list-page"',
        `from "${await sourceUrl("../src/lib/list-page.ts")}"`,
      )
    : resolved;
  return `data:text/javascript;base64,${Buffer.from(withListQuery).toString("base64")}`;
}
export async function importSource(path) {
  return import(await sourceUrl(path));
}
