import { portfolioContent } from "./content.mjs";
import { shell, homeView, workView, projectView, aboutView, contactView, notFoundView, h } from "./views.mjs";
const assetTypes = { css: "text/css; charset=utf-8", js: "text/javascript; charset=utf-8", webp: "image/webp", webm: "video/webm", ico: "image/x-icon" };
const securityHeaders = {
  "Content-Security-Policy": "default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self'; media-src 'self' https:; frame-src https://www.youtube-nocookie.com https://player.vimeo.com; form-action 'none'; base-uri 'none'; frame-ancestors 'none'",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
  "X-Frame-Options": "DENY",
};

function page(context, title, description, body, settings = {}) {
  const headers = new Headers({
    ...securityHeaders,
    "Content-Type": "text/html; charset=utf-8",
    "Cache-Control": "no-cache",
  });
  if (settings.noindex) headers.set("X-Robots-Tag", "noindex, nofollow");
  return new Response(shell(context.content, context.path, title, description, body, { origin: context.origin, ...settings }), { status: settings.status ?? 200, headers });
}

function originFor(url, env) {
  if (env.SITE_URL && URL.canParse(env.SITE_URL)) {
    const preferred = new URL(env.SITE_URL);
    if (preferred.protocol === "https:" && !preferred.username && !preferred.password) return preferred.origin;
  }
  return url.origin;
}

function robotsView(context) {
  const bots = "User-agent: *\nSitemap: " + context.origin + "/sitemap.xml\n";
  return new Response(bots, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}

function sitemapView(context) {
  const { origin, content } = context;
  const routes = ["/", "/work", "/about", "/contact", ...content.services.map(service => "/work/" + service.slug), ...content.projects.map(project => "/projects/" + encodeURIComponent(project.slug))];
  const entries = routes.map(route => "<url><loc>" + h(origin + route) + "</loc></url>").join("");
  return new Response('<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' + entries + "</urlset>", { headers: { "Content-Type": "application/xml; charset=utf-8" } });
}

function publicPage(context) {
  const { path, content, url } = context;
  if (path === "/") return page(context, "Home", content.profile.intro, homeView(content));
  if (path === "/about") return page(context, "About", content.profile.intro, aboutView(content));
  if (path === "/work") return page(context, "Work", "Explore design, video, UI/UX, and development projects.", workView(content));
  if (path === "/contact") return page(context, "Contact", "Get in touch about a design, video, or development project.", contactView(content, url.searchParams.get("service")));
  if (path === "/robots.txt") return robotsView(context);
  if (path === "/sitemap.xml") return sitemapView(context);
  const service = content.services.find(item => path === "/work/" + item.slug);
  if (service) return page(context, service.title, service.description, workView(content, service));
  const project = content.projects.find(item => path === "/projects/" + item.slug);
  if (project) return page(context, project.title, project.summary, projectView(content, project), { image: project.cover?.src });
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
      if (!["GET", "HEAD"].includes(request.method)) return new Response("Method not allowed", { status: 405, headers: { Allow: "GET, HEAD" } });
      if (/^\/(?:styles\.css|ui\.js|favicon\.ico|media\/[a-z0-9-]+\.(?:webp|webm))$/.test(path)) {
        return staticResponse(request, path, await getAsset(path));
      }
      const clip = path.match(/^\/clips\/(\d+)\.mp4$/);
      const clipIds = {"15": "11kQnicYRSoSwiToHAtZxcgoKwREP0gL6", "16": "1LUVrxwWLbbTFxM78W37FYZl25vKrj1Rs", "17": "17lFf3nhtM--mGY74b6pQvPA2Kxg3hDcw", "18": "1CBOcrdp9ussQOaF_UPJCxfYs8p4B847h", "19": "1oTmgkgVFgXnlqQ70e_e10COCcvJSidYD", "20": "1KVlaPbNk3JyzBLTylJnW_nHIkVzBnKrn", "21": "1-t0op8qcSAY0MgiHGbBsv52zvv3QvOTz", "22": "1tj-STKn4o8m68XsjE_OkEdVPG7gRCOdG", "23": "1h2egfFfnWvIbbuQfuJn7UAw2fMb26SYO"};
      if (clip && clipIds[clip[1]]) {
        const headers = new Headers();
        if (request.headers.has("range")) headers.set("Range", request.headers.get("range"));
        const upstream = await fetch("https://drive.google.com/uc?export=download&id=" + clipIds[clip[1]], { headers, redirect: "follow" });
        if (!upstream.ok || !(upstream.headers.get("content-type") ?? "").includes("video")) return new Response("Video temporarily unavailable. Open the original project link.", { status: 502 });
        const output = new Headers({ "Content-Type": "video/mp4", "Cache-Control": "public, max-age=3600", "Accept-Ranges": "bytes" });
        for (const key of ["content-range", "content-length"]) if (upstream.headers.has(key)) output.set(key, upstream.headers.get(key));
        return new Response(request.method === "HEAD" ? null : upstream.body, { status: upstream.status, headers: output });
      }
      const response = publicPage({ content: portfolioContent, url, path, origin: originFor(url, env) });
      return request.method === "HEAD" ? new Response(null, response) : response;
    },
  };
}
