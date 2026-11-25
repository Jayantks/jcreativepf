import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const root = new URL("../", import.meta.url);
const at = relative => new URL(relative, root);
const modules = ["content", "views", "worker"];
const source = await Promise.all(modules.map(async name => {
  const code = await readFile(at("src/" + name + ".mjs"), "utf8");
  return code.replace(/^import [^\n]+ from "\.\/[^"\n]+";\r?\n/gm, "").replace(/^export /gm, "");
}));

async function assetEntries(directory, urlPrefix) {
  const entries = await readdir(directory, { withFileTypes: true });
  const entriesByFile = await Promise.all(entries.sort((a, b) => a.name.localeCompare(b.name)).map(async entry => {
    const route = urlPrefix + "/" + entry.name;
    const file = new URL(entry.name + (entry.isDirectory() ? "/" : ""), directory);
    if (entry.isDirectory()) return assetEntries(file, route);
    return [[route, (await readFile(file)).toString("base64")]];
  }));
  return entriesByFile.flat();
}

const assets = Object.fromEntries(await assetEntries(at("public/"), ""));
const manifest = JSON.parse(await readFile(at(".openai/hosting.json"), "utf8"));
if (!manifest.project_id || manifest.static) throw new Error("The Sites manifest must identify a Worker project.");
await Promise.all([mkdir(at("dist/server/"), { recursive: true }), mkdir(at("dist/.openai/"), { recursive: true })]);
const entry = at("dist/server/index.js");
await writeFile(entry, source.join("\n") + "\nconst embeddedAssets = " + JSON.stringify(assets) + ";\nexport default createPortfolio(path => embeddedAssets[path] ? Uint8Array.from(atob(embeddedAssets[path]), byte => byte.charCodeAt(0)) : null);\n");
await writeFile(at("dist/.openai/hosting.json"), JSON.stringify(manifest, null, 2) + "\n");
const worker = (await import(entry.href)).default;
const start = await worker.fetch(new Request("https://preview.invalid/"));
const styles = await worker.fetch(new Request("https://preview.invalid/styles.css"));
if (start.status !== 200 || !styles.ok || !(await start.text()).includes("Selected")) throw new Error("The built Worker did not serve the homepage and assets.");
console.log("Built and smoke-tested " + fileURLToPath(entry));
