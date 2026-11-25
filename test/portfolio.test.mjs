import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createPortfolio } from "../src/worker.mjs";

const origin = "https://portfolio.example";
const server = createPortfolio(async path => {
  try {
    return await readFile(new URL("../public" + path, import.meta.url));
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
    return null;
  }
});

function resolve(path, options, env) {
  return server.fetch(new Request(origin + path, options), env);
}

test("bundled portfolio pages render without network calls or service credentials", async t => {
  t.mock.method(globalThis, "fetch", () => assert.fail("Bundled pages should not fetch remote data"));
  const home = await resolve("/");
  assert.equal(home.status, 200);
  assert.match(await home.text(), /Hi, I’m.*Jayant/);
  for (const [service, project] of [
    ["graphic-design", "Dilli meri jaan"],
    ["video-editing", "chhath puja reel"],
    ["ui-ux", "Food Delivery App"],
    ["development", "Food Delivery App"],
  ]) {
    const response = await resolve("/work/" + service);
    assert.equal(response.status, 200);
    assert.match(await response.text(), new RegExp(project));
  }
  assert.match(await (await resolve("/projects/food-delivery-ui")).text(), /Cart interface/);
  assert.match(await (await resolve("/projects/district-3040")).text(), /media\/district-3040\.webp/);
  assert.equal((await resolve("/media/district-3040.webp")).headers.get("Content-Type"), "image/webp");
});

test("bundled video is served as a playable byte range", async () => {
  const response = await resolve("/media/still-motion.webm", { headers: { Range: "bytes=0-3" } });
  assert.equal(response.status, 206);
  assert.equal(response.headers.get("Content-Type"), "video/webm");
  assert.deepEqual([...new Uint8Array(await response.arrayBuffer())], [26, 69, 223, 163]);
});

test("contact opens an email draft with the appropriate subject", async () => {
  const contact = await resolve("/contact");
  assert.equal(contact.status, 200);
  assert.match(await contact.text(), /mailto:jayantsharmacreates@gmail\.com\?subject=Portfolio%20enquiry/);
  const fromService = await resolve("/contact?service=graphic-design");
  assert.match(await fromService.text(), /subject=Graphic%20design%20enquiry/);
  const unknownService = await resolve("/contact?service=unknown");
  assert.match(await unknownService.text(), /subject=Portfolio%20enquiry/);
});

test("retired admin and enquiry submission paths cannot write data", async () => {
  for (const path of ["/admin", "/admin/projects", "/projects/missing"]) {
    const response = await resolve(path);
    assert.equal(response.status, 404);
    assert.equal(response.headers.get("X-Robots-Tag"), "noindex, nofollow");
  }
  const response = await resolve("/contact", { method: "POST", body: new URLSearchParams() });
  assert.equal(response.status, 405);
  assert.equal(response.headers.get("Allow"), "GET, HEAD");
});

test("public pages and sitemap use the configured canonical origin", async () => {
  const env = { SITE_URL: "https://design.example" };
  const home = await resolve("/", undefined, env);
  assert.equal(home.headers.get("X-Robots-Tag"), null);
  assert.match(await home.text(), /rel="canonical" href="https:\/\/design\.example\/"/);
  const robots = await resolve("/robots.txt", undefined, env);
  assert.match(await robots.text(), /Sitemap: https:\/\/design\.example\/sitemap\.xml/);
  const sitemap = await resolve("/sitemap.xml", undefined, env);
  assert.match(await sitemap.text(), /<loc>https:\/\/design\.example\/projects\/district-3040<\/loc>/);
});
