import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createPortfolio } from "../src/worker.mjs";
import { materializeProject, parseProject } from "../src/admin.mjs";

const origin = "https://portfolio.example";
const owner = "11111111-1111-4111-8111-111111111111";
const projectId = "22222222-2222-4222-8222-222222222222";
const assetId = "33333333-3333-4333-8333-333333333333";
const enquiryId = "44444444-4444-4444-8444-444444444444";
const ownerCookie = "portfolio_access=owner-token";
const configuration = {
  SUPABASE_URL: "https://project.supabase.co",
  SUPABASE_PUBLISHABLE_KEY: "sb_publishable_example",
  SUPABASE_SECRET_KEY: "sb_secret_example",
  OWNER_USER_ID: owner,
  RESEND_API_KEY: "example",
  ENQUIRY_FROM: "studio@example.com",
  ENQUIRY_TO: "owner@example.com",
};
const server = createPortfolio(async path => {
  try { return await readFile(new URL("../public" + path, import.meta.url)); }
  catch (error) { if (error.code !== "ENOENT") throw error; return null; }
});

function resolve(path, env = {}, { form, cookie, headers = {} } = {}) {
  const request = new Request(origin + path, {
    method: form ? "POST" : "GET",
    headers: { ...(form && { Origin: origin }), ...(cookie && { Cookie: cookie }), ...headers },
    body: form ? new URLSearchParams(form) : undefined,
  });
  return server.fetch(request, env);
}

function testBackend(t) {
  const state = {
    permitted: true, project: null, enquiries: [], attempts: 0, notifications: 0,
    media: [{ id: assetId, cloud: "test", public_id: "portfolio/" + assetId, alt: "Cover image", caption: "", type: "image" }],
  };
  t.mock.method(globalThis, "fetch", async (input, options) => {
    const url = new URL(input);
    const body = options.body ? JSON.parse(options.body) : {};
    const auth = options.headers instanceof Headers ? options.headers.get("Authorization") : "";
    const result = data => Response.json(data);
    if (url.hostname === "api.resend.com") {
      state.notifications += 1;
      assert.equal(options.headers["Idempotency-Key"], "portfolio-enquiry-" + enquiryId);
      assert.equal(body.reply_to, "visitor@example.com");
      return new Response(null, { status: 502 });
    }
    assert.equal(url.origin, configuration.SUPABASE_URL);
    if (url.pathname === "/rest/v1/portfolio_settings") return result([{ content: {}, revision: 1 }]);
    if (url.pathname === "/rest/v1/rpc/portfolio_published") {
      assert.equal(auth, null);
      if (state.project?.state !== "published") return result([]);
      const { slug, live } = state.project;
      if (body.requested_slug === slug) return result([{ slug, live }]);
      const { sections, links, ...summary } = live;
      return result([{ slug, live: summary }]);
    }
    if (url.pathname === "/rest/v1/rpc/portfolio_rate_allowed") {
      assert.equal(options.headers.get("apikey"), configuration.SUPABASE_SECRET_KEY);
      assert.match(body.fingerprint, /^[0-9a-f]{64}$/);
      state.attempts += 1;
      return result(state.permitted);
    }
    if (url.pathname === "/auth/v1/user") return result({ id: auth === "Bearer owner-token" ? owner : projectId });
    if (url.pathname === "/auth/v1/token") return result({ user: { id: body.email === "owner@example.com" ? owner : projectId }, access_token: "owner-token", refresh_token: "refresh-token", expires_in: 3600 });
    if (url.pathname === "/rest/v1/portfolio_enquiries") {
      assert.equal(options.headers.get("apikey"), configuration.SUPABASE_SECRET_KEY);
      if (options.method === "POST") {
        state.enquiries.push({ id: enquiryId, ...body });
        return result([{ id: enquiryId }]);
      }
      Object.assign(state.enquiries[0], body);
      return new Response(null, { status: 204 });
    }
    assert.equal(auth, "Bearer owner-token");
    if (url.pathname === "/rest/v1/portfolio_media") return result(state.media);
    if (url.pathname === "/rest/v1/portfolio_projects") {
      if (options.method === "GET") return result(state.project ? [state.project] : []);
      if (options.method === "POST") state.project = { id: projectId, revision: 1, state: "draft", ...body };
      if (options.method === "PATCH") state.project = { ...state.project, ...body };
      if (options.method === "DELETE") state.project = null;
      return result([{ id: projectId }]);
    }
    throw new Error("Unexpected endpoint " + url.pathname);
  });
  return state;
}

test("sample pages, service routes and case studies render, and missing projects return 404", async () => {
  const home = await resolve("/");
  assert.equal(home.status, 200);
  assert.equal(home.headers.get("X-Robots-Tag"), "noindex, nofollow");
  assert.match(await home.text(), /Making the digital feel.*human/);
  for (const [service, project] of [["graphic-design", "Afterhours"], ["video-editing", "Still in Motion"], ["ui-ux", "Fieldwork"], ["development", "Index Studio"]]) {
    const response = await resolve("/work/" + service);
    assert.equal(response.status, 200);
    assert.match(await response.text(), new RegExp(project));
  }
  assert.match(await (await resolve("/projects/fieldwork")).text(), /Interface concept/);
  assert.equal((await resolve("/projects/missing")).status, 404);
  assert.match(await (await resolve("/admin")).text(), /Connect Supabase/);
});

test("demo video is served as a playable byte range", async () => {
  const response = await resolve("/media/still-motion.webm", {}, { headers: { Range: "bytes=0-3" } });
  assert.equal(response.status, 206);
  assert.equal(response.headers.get("Content-Type"), "video/webm");
  assert.deepEqual([...new Uint8Array(await response.arrayBuffer())], [26, 69, 223, 163]);
});

test("enquiry validation, stored lead, failed email and rate limiting", async t => {
  const state = testBackend(t);
  const form = { name: "Visitor", email: "Visitor@example.com", service: "graphic-design", message: "I would like a poster design." };
  assert.equal((await resolve("/contact", {}, { form })).headers.get("Location"), "/contact?status=demo");
  assert.equal((await resolve("/contact", configuration, { form, headers: { Origin: "https://elsewhere.example" } })).status, 403);
  assert.equal((await resolve("/contact", configuration, { form: { ...form, email: "wrong" } })).status, 422);
  const contact = await resolve("/contact", configuration, { form });
  assert.equal(contact.headers.get("Location"), "/contact?status=sent");
  assert.equal(state.enquiries.length, 1);
  assert.equal(state.enquiries[0].notification, "failed");
  assert.equal(state.notifications, 1);
  state.permitted = false;
  assert.equal((await resolve("/contact", configuration, { form })).status, 429);
  assert.equal(state.enquiries.length, 1);
});

test("owner draft, preview, publish, edit, unpublish, archive and confirmed deletion", async t => {
  const state = testBackend(t);
  const edit = "/admin/projects/" + projectId;
  const form = { intent: "save", title: "Test Draft", service: "ui-ux", summary: "A portfolio publishing test.", role: "Testing", year: "2026", coverId: assetId };
  const payload = overrides => ({ cookie: ownerCookie, form: { ...form, ...overrides } });
  const unauthorized = await resolve("/admin/projects/new", configuration, { form, cookie: "portfolio_access=other-token" });
  assert.equal(unauthorized.status, 401);
  assert.equal(state.project, null);
  const login = await resolve("/admin/login", configuration, { form: { email: "owner@example.com", password: "test-only" } });
  assert.equal(login.status, 303);
  assert.match(login.headers.getSetCookie().join(";"), /HttpOnly; SameSite=Strict; Secure/);
  const created = await resolve("/admin/projects/new", configuration, payload());
  assert.equal(created.headers.get("Location"), edit + "?notice=saved");
  assert.equal((await resolve("/projects/test-draft", configuration)).status, 404);
  assert.equal((await resolve(edit + "/preview", configuration)).headers.get("Location"), "/admin/login");
  const preview = await resolve(edit + "/preview", configuration, { cookie: ownerCookie });
  assert.equal(preview.headers.get("Cache-Control"), "private, no-store");
  assert.match(await preview.text(), /Test Draft/);
  assert.equal((await resolve(edit, configuration, payload({ revision: 1, intent: "publish" }))).status, 303);
  assert.equal((await resolve("/projects/test-draft", configuration)).status, 200);
  assert.equal((await resolve(edit, configuration, payload({ revision: 1, title: "Stale" }))).status, 409);
  assert.equal((await resolve(edit, configuration, payload({ revision: 2, title: "Fresh draft" }))).status, 303);
  assert.match(await (await resolve("/projects/test-draft", configuration)).text(), /Test Draft/);
  assert.doesNotMatch(await (await resolve("/projects/test-draft", configuration)).text(), /Fresh draft/);
  assert.equal((await resolve(edit, configuration, payload({ revision: 3, title: "Fresh draft", intent: "publish" }))).status, 303);
  assert.match(await (await resolve("/projects/test-draft", configuration)).text(), /Fresh draft/);
  assert.equal((await resolve(edit + "/state", configuration, payload({ revision: 4, intent: "unpublish" }))).status, 303);
  assert.equal((await resolve("/projects/test-draft", configuration)).status, 404);
  assert.equal((await resolve(edit + "/state", configuration, payload({ revision: 5, intent: "archive" }))).status, 303);
  assert.equal((await resolve(edit + "/state", configuration, payload({ revision: 6, intent: "delete", delete_slug: "wrong" }))).status, 400);
  assert.equal((await resolve(edit + "/state", configuration, payload({ revision: 6, intent: "delete", delete_slug: "test-draft" }))).status, 303);
  assert.equal(state.project, null);
  assert.equal(state.media.length, 1);
});

test("unsafe case-study embeds and unknown media are rejected", () => {
  const form = new FormData();
  for (const [key, value] of Object.entries({ title: "Draft", service: "video-editing", section: "1", section_1_type: "embed", section_1_url: "https://untrusted.example/anything" })) form.set(key, value);
  assert.throws(() => parseProject(form, null, false), /embed URL/);
  assert.throws(() => materializeProject({ coverId: assetId, sections: [] }, [], true), /from the media library/);
});
