import { demoContent, resolveContent, serviceSlugs } from "./content.mjs";
import { shell, homeView, workView, projectView, aboutView, contactView, notFoundView, h } from "./views.mjs";
import { databaseConfig, publicData, loginOwner, authenticateOwner, logoutOwner, rateAllowed, saveEnquiry, ownerData, uploadAsset, SiteError } from "./database.mjs";
import { adminLayout, loginView, overviewView, projectsAdminView, editorView, mediaAdminView, settingsAdminView, enquiriesAdminView, textField, emailField, parseProject, materializeProject, parseSettings } from "./admin.mjs";

const assetTypes = { css: "text/css; charset=utf-8", js: "text/javascript; charset=utf-8", webp: "image/webp", webm: "video/webm", ico: "image/x-icon" };
const smallBodyLimit = 16_000;
const editorBodyLimit = 1_100_000;
const uploadBodyLimit = 21 * 1024 * 1024;
const recordId = "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}";
const projectAdminRoute = new RegExp("^/admin/projects/(new|" + recordId + ")(/preview|/state)?$");
const libraryAdminRoute = new RegExp("^/admin/(media|enquiries)/(" + recordId + ")$");
const projectColumns = "id,slug,working,state,revision,working_edit,updated_at";
const mediaColumns = "id,public_id,cloud,type,alt,caption";

const securityHeaders = {
  "Content-Security-Policy": "default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self' https://res.cloudinary.com; media-src 'self' https://res.cloudinary.com https:; frame-src https://www.youtube-nocookie.com https://player.vimeo.com; form-action 'self'; base-uri 'none'; frame-ancestors 'none'",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
  "X-Frame-Options": "DENY",
};

function page(context, title, description, body, settings = {}) {
  const noindex = settings.noindex || context.content.demo || context.private;
  const headers = new Headers({
    ...securityHeaders,
    "Content-Type": "text/html; charset=utf-8",
    "Cache-Control": context.private || context.request.method !== "GET" ? "private, no-store" : "no-cache",
  });
  if (noindex) headers.set("X-Robots-Tag", "noindex, nofollow");
  for (const cookie of context.session?.cookies ?? []) headers.append("Set-Cookie", cookie);
  return new Response(shell(context.content, context.path, title, description, body, { origin: context.origin, noindex, image: settings.image }), { status: settings.status ?? 200, headers });
}

function redirect(location, cookies = []) {
  const headers = new Headers({ Location: location, "Cache-Control": "private, no-store" });
  for (const cookie of cookies) headers.append("Set-Cookie", cookie);
  return new Response(null, { status: 303, headers });
}

function renderAdmin(context, title, body, settings = {}) {
  const layout = adminLayout(context.path, title, body, { session: Boolean(context.session), flash: context.url.searchParams.get("notice"), notice: settings.notice });
  return page(context, title, "Private portfolio administration.", layout, settings);
}

function originFor(url, env) {
  if (env.SITE_URL) {
    const preferred = new URL(env.SITE_URL);
    if (preferred.protocol === "https:" && !preferred.username && !preferred.password) return preferred.origin;
  }
  return url.origin;
}

function checkOrigin(request, url, env) {
  const source = request.headers.get("origin") || request.headers.get("referer");
  let origin;
  try { origin = new URL(source).origin; } catch {}
  if (origin !== originFor(url, env) && origin !== url.origin) throw new SiteError("This form can only be submitted from this site.", 403);
}

async function readForm(request, limit = editorBodyLimit) {
  const type = request.headers.get("content-type") ?? "";
  if (!/^(?:application\/x-www-form-urlencoded|multipart\/form-data)(?:;|$)/i.test(type)) throw new SiteError("Submit form data using the site’s form.");
  if (!request.body || Number(request.headers.get("content-length")) > limit) throw new SiteError("This submission is too large.", 413);
  const reader = request.body.getReader();
  const chunks = [];
  let received = 0;
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    received += value.byteLength;
    if (received > limit) {
      await reader.cancel();
      throw new SiteError("This submission is too large.", 413);
    }
    chunks.push(value);
  }
  const bytes = new Uint8Array(received);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  try {
    return await new Response(bytes, { headers: { "Content-Type": type } }).formData();
  } catch {
    throw new SiteError("The form could not be read.");
  }
}

async function publicContact(context) {
  const { request, url, env, content, config } = context;
  const selected = [...new Set(url.searchParams.getAll("service"))].filter(value => serviceSlugs.includes(value) || value === "general");
  const title = "Contact";
  const description = "Send a project enquiry about design, video, interfaces, or development.";
  const render = (chosen, values, message, success, status = 200) => page(context, title, description, contactView(content, chosen, values, message, success), { status });
  if (request.method !== "POST") {
    const sent = url.searchParams.get("status");
    const message = sent === "demo" && content.demo ? "The form passed validation. No enquiry was saved in preview mode." : sent === "sent" && !content.demo ? "Your enquiry was received. Thanks for getting in touch." : "";
    return render(selected, {}, message, Boolean(message));
  }
  const values = {};
  let chosen = [];
  try {
    const form = await readForm(request, smallBodyLimit);
    for (const field of ["name", "email", "budget", "message"]) values[field] = typeof form.get(field) === "string" ? form.get(field).slice(0, 3010) : "";
    chosen = [...new Set(form.getAll("service"))];
    if (form.get("website")) return redirect("/contact?status=" + (content.demo ? "demo" : "sent"));
    if (!chosen.length || chosen.some(service => service !== "general" && !serviceSlugs.includes(service))) throw new SiteError("Choose at least one service or General enquiry.", 422);
    if (chosen.length > 1) chosen = chosen.filter(service => service !== "general");
    const enquiry = {
      name: textField(form, "name", "Name", 100, 2), email: emailField(form, "email"), services: chosen,
      budget: textField(form, "budget", "Budget", 100), message: textField(form, "message", "Project details", 3000, 10),
    };
    if (!config) return redirect("/contact?status=demo");
    if (!await rateAllowed(config, request, "contact")) return render(chosen, values, "Too many submissions. Please try again later.", false, 429);
    await saveEnquiry(config, env, enquiry);
    return redirect("/contact?status=sent");
  } catch (error) {
    if (error instanceof SiteError && error.status < 500) return render(chosen, values, error.message, false, error.status === 400 ? 422 : error.status);
    console.error("Enquiry operation failed.", error instanceof Error ? error.name : "Unknown error");
    return render(chosen, values, "We couldn’t save your enquiry. Please try again in a moment.", false, 503);
  }
}

function adminRead(context, table, query) {
  return ownerData(context.config, context.session.token, table, query);
}

function adminWrite(context, table, query, method, body) {
  return ownerData(context.config, context.session.token, table, query, { method, body, prefer: "return=representation" });
}

function fetchAdminMedia(context) {
  return adminRead(context, "media", "?select=" + mediaColumns + "&order=created_at.desc");
}

function assertRevision(form, row) {
  if (Number(form.get("revision")) !== row.revision) throw new SiteError("This record changed while it was open. Reload the page before editing again.", 409);
}

function assertChanged(rows) {
  if (!rows.length) throw new SiteError("The record changed before your update was saved. Reload the dashboard and try again.", 409);
}

async function projectAdmin(context, id, subpath) {
  const isNew = id === "new";
  const row = isNew ? null : (await adminRead(context, "projects", "?id=eq." + id + "&select=" + projectColumns))[0];
  const { request, content, session } = context;
  if ((!isNew && !row) || (isNew && subpath)) return renderAdmin(context, "Project not found", "<p>Open a project from the project library.</p>", { status: 404 });
  const href = "/admin/projects/" + id;
  const next = (slug, notice) => redirect("/admin/projects/" + slug + "?notice=" + notice, session.cookies);
  const isPost = request.method === "POST";

  if (subpath === "/state") {
    if (!isPost) return renderAdmin(context, "Project not found", "<p>Open publishing controls from the project editor.</p>", { status: 404 });
    const form = await readForm(request, smallBodyLimit);
    assertRevision(form, row);
    const query = "?id=eq." + id + "&revision=eq." + row.revision + "&select=id";
    const intent = form.get("intent");
    if (intent === "delete") {
      if (row.state !== "archived" || form.get("delete_slug") !== row.slug) throw new SiteError("Archive the project and type its slug to confirm deletion.");
      assertChanged(await adminWrite(context, "projects", query + "&state=eq.archived", "DELETE"));
      return redirect("/admin/projects?notice=deleted", session.cookies);
    }
    if (intent === "unpublish" && row.state !== "published") throw new SiteError("Only a published project can be unpublished.");
    if (!["unpublish", "archive"].includes(intent)) throw new SiteError("Choose a valid publishing action.");
    assertChanged(await adminWrite(context, "projects", query, "PATCH", {
      state: intent === "archive" ? "archived" : "draft", live: null, published_at: null,
      revision: row.revision + 1, working_edit: false, updated_at: new Date().toISOString(),
    }));
    return next(id, intent === "archive" ? "archived" : "unpublished");
  }

  const media = await fetchAdminMedia(context);
  if (subpath === "/preview") {
    if (isPost) throw new SiteError("Open the draft preview from the project editor.", 405);
    const project = { ...materializeProject(row.working, media), slug: row.slug };
    return page(context, "Preview " + project.title, "Private project preview.", '<div class="frame preview-back"><a class="button outline" href="' + href + '">Return to project editor</a></div>' + projectView(content, project, true));
  }

  const title = isNew ? "New project" : "Edit project";
  if (!isPost) return renderAdmin(context, title, editorView(row, content.services, media));
  const form = await readForm(request);
  let draft;
  try {
    if (row) assertRevision(form, row);
    const publish = form.get("intent") === "publish";
    if (!publish && form.get("intent") !== "save") throw new SiteError("Choose Save draft or Publish.");
    draft = parseProject(form, row, false);
    if (publish) parseProject(form, row, true);
    const snapshot = materializeProject(draft.working, media, publish);
    const body = { working: draft.working, updated_at: new Date().toISOString() };
    if (publish) Object.assign(body, { state: "published", live: snapshot, published_at: new Date().toISOString(), working_edit: false });
    if (row && !publish && row.state === "published") body.working_edit = true;
    const result = row
      ? await adminWrite(context, "projects", "?id=eq." + id + "&revision=eq." + row.revision + "&select=id", "PATCH", { ...body, revision: row.revision + 1 })
      : await adminWrite(context, "projects", "?select=id", "POST", { ...body, slug: draft.slug });
    assertChanged(result);
    return next(result[0].id, publish ? "published" : "saved");
  } catch (error) {
    if (!(error instanceof SiteError) || error.status >= 500) throw error;
    return renderAdmin(context, title, editorView(row, content.services, media, draft), { status: error.status, notice: error.message });
  }
}

async function handleAdmin(context) {
  const { request, path, config, content, env } = context;
  const isPost = request.method === "POST";
  if (!config) return renderAdmin(context, "Owner access", loginView(false), { status: isPost ? 503 : 200 });
  if (path === "/admin/login" && isPost) {
    const form = await readForm(request, smallBodyLimit);
    const email = emailField(form, "email");
    const password = form.get("password");
    if (typeof password !== "string" || !password || password.length > 256) throw new SiteError("Enter your email and password.");
    if (!await rateAllowed(config, request, "login")) return renderAdmin(context, "Owner access", loginView(true), { notice: "Too many sign-in attempts. Try again later.", status: 429 });
    const credentials = await loginOwner(request, config, email, password);
    if (!credentials) return renderAdmin(context, "Owner access", loginView(true), { notice: "The email or password could not be verified.", status: 401 });
    return redirect("/admin", credentials.cookies);
  }
  context.session = await authenticateOwner(request, config);
  const { session } = context;
  if (path === "/admin/logout" && isPost) return redirect("/admin/login", await logoutOwner(request, config, session));
  if (!session) {
    if (isPost) return renderAdmin(context, "Owner access", loginView(true), { status: 401, notice: "Sign in to perform that action." });
    return path === "/admin/login" || path === "/admin" ? renderAdmin(context, "Owner access", loginView(true)) : redirect("/admin/login");
  }
  if (path === "/admin/login") return redirect("/admin", session.cookies);

  const projectRoute = path.match(projectAdminRoute);
  if (projectRoute) return projectAdmin(context, projectRoute[1], projectRoute[2]);
  const libraryRoute = path.match(libraryAdminRoute);
  if (libraryRoute && isPost) {
    const [_, table, id] = libraryRoute;
    const form = await readForm(request, smallBodyLimit);
    const update = table === "media"
      ? { alt: textField(form, "alt", "Alt text", 220, 1), caption: textField(form, "caption", "Caption", 350) }
      : { reviewed_at: new Date().toISOString() };
    assertChanged(await adminWrite(context, table, "?id=eq." + id + "&select=id", "PATCH", update));
    return redirect("/admin/" + table + "?notice=" + (table === "media" ? "media" : "reviewed"), session.cookies);
  }

  if (path === "/admin/media") {
    const uploads = Boolean(env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET);
    if (isPost) {
      if (!uploads) throw new SiteError("Connect Cloudinary to enable media uploads.");
      const form = await readForm(request, uploadBodyLimit);
      const asset = await uploadAsset(env, form.get("file"), form);
      try {
        await adminWrite(context, "media", "?select=id", "POST", asset);
      } catch (error) {
        console.error("Media uploaded but its record could not be registered: " + asset.public_id);
        throw error;
      }
      return redirect(path + "?notice=media", session.cookies);
    }
    return renderAdmin(context, "Media library", mediaAdminView(await fetchAdminMedia(context), uploads));
  }
  if (path === "/admin/settings") {
    const [settings, media] = await Promise.all([adminRead(context, "settings", "?id=eq.1&select=revision,content"), fetchAdminMedia(context)]);
    if (isPost) {
      const form = await readForm(request, smallBodyLimit * 4);
      const version = settings[0];
      assertRevision(form, version);
      const saved = parseSettings(form, media);
      assertChanged(await adminWrite(context, "settings", "?id=eq.1&revision=eq." + version.revision + "&select=id", "PATCH", { content: saved, revision: version.revision + 1 }));
      return redirect(path + "?notice=settings", session.cookies);
    }
    return renderAdmin(context, "Site settings", settingsAdminView(content.profile, content.services, settings[0].revision, media));
  }
  if (isPost) throw new SiteError("This page does not accept form submissions.", 405);
  if (path === "/admin") {
    const [projects, recent] = await Promise.all([
      adminRead(context, "projects", "?select=" + projectColumns + "&order=updated_at.desc"),
      adminRead(context, "enquiries", "?select=id,name,reviewed_at&order=created_at.desc&limit=5"),
    ]);
    return renderAdmin(context, "Overview", overviewView(projects, recent));
  }
  if (path === "/admin/projects") {
    const projects = await adminRead(context, "projects", "?select=" + projectColumns + "&order=updated_at.desc");
    return renderAdmin(context, "Projects", projectsAdminView(projects));
  }
  if (path === "/admin/enquiries") {
    const requested = Number(context.url.searchParams.get("page") ?? 1);
    const number = Number.isSafeInteger(requested) && requested > 0 && requested < 10000 ? requested : 1;
    const enquiries = await adminRead(context, "enquiries", "?select=*&order=created_at.desc,id.desc&limit=26&offset=" + ((number - 1) * 25));
    const numbers = '<nav class="actions" aria-label="Enquiry pages">' + (number > 1 ? '<a class="button outline" href="/admin/enquiries?page=' + (number - 1) + '">Previous page</a>' : "") + (enquiries.length > 25 ? '<a class="button outline" href="/admin/enquiries?page=' + (number + 1) + '">Next page</a>' : "") + '</nav>';
    return renderAdmin(context, "Enquiries", enquiriesAdminView(enquiries.slice(0, 25)) + numbers);
  }
  return renderAdmin(context, "Page not found", "<p>Choose a section from the dashboard navigation.</p>", { status: 404 });
}

function robotsView(context) {
  const bots = context.content.demo ? "User-agent: *\nDisallow: /\n" : "User-agent: *\nDisallow: /admin\nSitemap: " + context.origin + "/sitemap.xml\n";
  return new Response(bots, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}

function sitemapView(context) {
  const { origin, content } = context;
  const routes = ["/", "/work", "/about", "/contact", ...content.services.map(service => "/work/" + service.slug), ...content.projects.map(project => "/projects/" + encodeURIComponent(project.slug))];
  const entries = content.demo ? "" : routes.map(route => "<url><loc>" + h(origin + route) + "</loc></url>").join("");
  return new Response('<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' + entries + "</urlset>", { headers: { "Content-Type": "application/xml; charset=utf-8" } });
}

function publicPage(context) {
  const { path, content } = context;
  if (path === "/") return page(context, "Home", content.profile.intro, homeView(content));
  if (path === "/about") return page(context, "About", content.profile.intro, aboutView(content));
  if (path === "/work") return page(context, "Work", "Explore design, video, UI/UX, and development projects.", workView(content));
  if (path === "/robots.txt") return robotsView(context);
  if (path === "/sitemap.xml") return sitemapView(context);
  const service = content.services.find(item => path === "/work/" + item.slug);
  if (service) return page(context, service.title, service.description, workView(content, service));
  const project = content.projects.find(item => path === "/projects/" + item.slug);
  if (project) {
    const cover = project.cover;
    const image = cover?.id ? "https://res.cloudinary.com/" + cover.cloud + "/" + (cover.type === "video" ? "video/upload/so_auto/" + cover.id + ".jpg" : "image/upload/f_auto,q_auto/" + cover.id) : cover?.src;
    return page(context, project.title, project.summary, projectView(content, project), { image });
  }
  return page(context, "Page not found", "The requested portfolio page could not be found.", notFoundView(), { status: 404, noindex: true });
}

function staticResponse(request, path, bytes) {
  const type = assetTypes[path.split(".").at(-1)];
  if (!bytes || !type) return new Response("Not found", { status: 404 });
  const headers = new Headers({ "Content-Type": type, "Content-Length": bytes.byteLength, "Cache-Control": "public, max-age=3600", "X-Content-Type-Options": "nosniff" });
  if (type === "video/webm") {
    headers.set("Accept-Ranges", "bytes");
    const range = request.headers.get("range");
    if (range) {
      const size = bytes.byteLength;
      const bounds = range.match(/^bytes=(\d*)-(\d*)$/);
      const start = bounds?.[1] ? Number(bounds[1]) : Math.max(0, size - Number(bounds?.[2] || "0"));
      const end = bounds?.[1] && bounds?.[2] ? Math.min(Number(bounds[2]), size - 1) : size - 1;
      if (!bounds || start > end || start >= size) return new Response(null, { status: 416, headers: { "Content-Range": "bytes */" + size } });
      headers.set("Content-Range", "bytes " + start + "-" + end + "/" + size);
      headers.set("Content-Length", end - start + 1);
      return new Response(request.method === "HEAD" ? null : bytes.subarray(start, end + 1), { status: 206, headers });
    }
  }
  return new Response(request.method === "HEAD" ? null : bytes, { headers });
}

export function createPortfolio(getAsset) {
  return {
    async fetch(request, env = {}) {
      const url = new URL(request.url);
      const path = url.pathname.replace(/\/+$/, "") || "/";
      if (!["GET", "HEAD", "POST"].includes(request.method)) return new Response("Method not allowed", { status: 405, headers: { Allow: "GET, HEAD, POST" } });
      if (request.method !== "POST" && /^\/(?:styles\.css|ui\.js|favicon\.ico|media\/[a-z0-9-]+\.(?:webp|webm))$/.test(path)) {
        return staticResponse(request, path, await getAsset(path));
      }
      const clip = path.match(/^\/clips\/(\d+)\.mp4$/);
      const clipIds = {"15": "11kQnicYRSoSwiToHAtZxcgoKwREP0gL6", "16": "1LUVrxwWLbbTFxM78W37FYZl25vKrj1Rs", "17": "17lFf3nhtM--mGY74b6pQvPA2Kxg3hDcw", "18": "1CBOcrdp9ussQOaF_UPJCxfYs8p4B847h", "19": "1oTmgkgVFgXnlqQ70e_e10COCcvJSidYD", "20": "1KVlaPbNk3JyzBLTylJnW_nHIkVzBnKrn", "21": "1-t0op8qcSAY0MgiHGbBsv52zvv3QvOTz", "22": "1tj-STKn4o8m68XsjE_OkEdVPG7gRCOdG", "23": "1h2egfFfnWvIbbuQfuJn7UAw2fMb26SYO"};
      if (clip && clipIds[clip[1]] && request.method !== "POST") {
        const headers = new Headers();
        if (request.headers.has("range")) headers.set("Range", request.headers.get("range"));
        const upstream = await fetch("https://drive.google.com/uc?export=download&id=" + clipIds[clip[1]], { headers, redirect: "follow" });
        if (!upstream.ok || !(upstream.headers.get("content-type") ?? "").includes("video")) return new Response("Video temporarily unavailable. Open the original project link.", { status: 502 });
        const output = new Headers({ "Content-Type": "video/mp4", "Cache-Control": "public, max-age=3600", "Accept-Ranges": "bytes" });
        for (const key of ["content-range", "content-length"]) if (upstream.headers.has(key)) output.set(key, upstream.headers.get(key));
        return new Response(request.method === "HEAD" ? null : upstream.body, { status: upstream.status, headers: output });
      }
      const context = { content: demoContent(), request, env, url, path, origin: url.origin, private: path === "/admin" || path.startsWith("/admin/") };
      let response;
      try {
        context.origin = originFor(url, env);
        context.config = databaseConfig(env);
        if (request.method === "POST") checkOrigin(request, url, env);
        if (context.config) {
          const { settings, published } = await publicData(context.config, path.match(/^\/projects\/([a-z0-9-]{1,80})$/)?.[1]);
          context.content = resolveContent(settings, published);
        }
        if (context.private) response = await handleAdmin(context);
        else if (path === "/contact") response = await publicContact(context);
        else if (request.method === "POST") response = new Response("Method not allowed", { status: 405, headers: { Allow: "GET, HEAD" } });
        else response = publicPage(context);
      } catch (error) {
        const expected = error instanceof SiteError && error.status < 500;
        const status = expected ? error.status : 503;
        const notice = expected ? error.message : "The portfolio service is temporarily unavailable. Try again in a moment.";
        if (!expected) console.error("Portfolio request failed.", error instanceof Error ? error.name : "Unknown error");
        response = context.private ? renderAdmin(context, "Dashboard", context.session ? '<a class="button outline" href="/admin">Return to dashboard</a>' : loginView(Boolean(context.config)), { status, notice }) : page(context, "Request unavailable", notice, '<section class="frame page-intro"><h1>Request unavailable</h1><p>' + h(notice) + '</p></section>', { status, noindex: true });
      }
      return request.method === "HEAD" ? new Response(null, response) : response;
    },
  };
}
