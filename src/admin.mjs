import { h, picture } from "./views.mjs";
import { SiteError } from "./database.mjs";
import { serviceSlugs } from "./content.mjs";

const sectionTypes = { text: "Text", quote: "Quote", image: "Image", grid: "Image grid", video: "Video", embed: "Video embed" };
const flashMessages = {
  saved: "Draft saved.",
  published: "Project published.",
  unpublished: "Project unpublished. Its draft is still in the dashboard.",
  archived: "Project archived.",
  deleted: "Archived project deleted.",
  settings: "Settings updated.",
  media: "Media library updated.",
  reviewed: "Enquiry marked as reviewed.",
};

function adminButton(label, value, style = "outline") {
  return '<button class="button compact-action ' + style + '" type="submit" name="intent" value="' + value + '">' + h(label) + '</button>';
}

function input(label, name, value = "", attributes = "") {
  return '<label>' + h(label) + '<input name="' + h(name) + '" value="' + h(value) + '" ' + attributes + '></label>';
}

function textarea(label, name, value = "", attributes = "") {
  return '<label>' + h(label) + '<textarea name="' + h(name) + '" ' + attributes + '>' + h(value) + '</textarea></label>';
}

function option(value, label, chosen) {
  return '<option value="' + h(value) + '"' + (chosen === value ? " selected" : "") + '>' + h(label) + '</option>';
}

function fieldSelect(label, name, options, chosen, empty) {
  return '<label>' + h(label) + '<select name="' + h(name) + '">' + (empty ? option("", empty, chosen) : "") + options.map(([value, text]) => option(value, text, chosen)).join("") + '</select></label>';
}

function adminNotice(message) {
  return message ? '<p class="notice" role="status">' + h(message) + '</p>' : "";
}

export function adminLayout(path, title, body, { session = false, notice = "", flash = "" } = {}) {
  const pages = [["/admin", "Overview"], ["/admin/projects", "Projects"], ["/admin/media", "Media"], ["/admin/settings", "Settings"], ["/admin/enquiries", "Enquiries"]];
  return `<section class="frame admin-page">
    <header class="page-intro"><p class="eyebrow"><span aria-hidden="true"></span>Portfolio dashboard</p><h1>${h(title)}</h1></header>
    ${session ? `<nav class="admin-bar" aria-label="Dashboard">${pages.map(([href, label]) => '<a class="button outline compact-action" href="' + href + '"' + ((href === "/admin" ? path === href : path.startsWith(href)) ? ' aria-current="page"' : '') + '>' + label + '</a>').join("")}<form method="post" action="/admin/logout">${adminButton("Sign out", "logout")}</form></nav>` : ""}
    ${adminNotice(notice || flashMessages[flash])}
    ${body}
  </section>`;
}

export function loginView(configured) {
  if (!configured) return '<div class="panel admin-login"><h2>Owner sign-in</h2><p>Connect Supabase and configure the owner account to enable the private dashboard.</p></div>';
  return `<form class="panel admin-login" action="/admin/login" method="post">
    <h2>Owner sign-in</h2>
    ${input("Email", "email", "", 'type="email" required autocomplete="username" maxlength="254"')}
    ${input("Password", "password", "", 'type="password" required autocomplete="current-password" maxlength="256"')}
    <button class="button primary" type="submit">Sign in</button>
  </form>`;
}

function projectRows(rows) {
  if (!rows.length) return '<p class="muted">There are no projects yet.</p>';
  return rows.map(row => '<div class="admin-row"><a href="/admin/projects/' + h(row.id) + '">' + h(row.working.title) + '</a><span>' + h(row.state === "published" && row.working_edit ? "Published · draft changes" : row.state) + '</span></div>').join("");
}

export function overviewView(projects, enquiries) {
  const stats = [["Total projects", projects.length], ["Published", projects.filter(row => row.state === "published").length], ["Drafts", projects.filter(row => row.state === "draft").length]];
  return '<div class="admin-grid">' + stats.map(([label, count]) => '<div class="panel"><strong>' + count + '</strong>' + h(label) + '</div>').join("") + '</div><div class="admin-columns"><div class="panel admin-card"><h2>Recent projects</h2>' + projectRows(projects.slice(0, 5)) + '</div><div class="panel admin-card"><h2>Recent enquiries</h2>' + (enquiries.length ? enquiries.map(item => '<div class="admin-row"><a href="/admin/enquiries#enquiry-' + h(item.id) + '">' + h(item.name) + '</a><span>' + (item.reviewed_at ? 'Reviewed' : "New") + '</span></div>').join("") : '<p class="muted">No enquiries yet.</p>') + '</div></div>';
}

export function projectsAdminView(projects) {
  return '<div class="panel admin-card"><div class="section-heading"><h2>Project library</h2><a class="button primary" href="/admin/projects/new">New project</a></div>' + projectRows(projects) + '</div>';
}

function mediaOptions(media, type) {
  return media.filter(asset => !type || asset.type === type).map(asset => [asset.id, asset.alt + " (" + asset.type + ")"]);
}

function sectionEditor(section, key, media) {
  const prefix = "section_" + key + "_";
  const images = mediaOptions(media, "image");
  const select = (label, name, type, value, options) => '<div data-for-section="' + type + '">' + fieldSelect(label, prefix + name, options, value, "Select media") + '</div>';
  return `<fieldset class="admin-block">
    <input type="hidden" name="section" value="${h(key)}">
    ${fieldSelect("Block type", prefix + "type", Object.entries(sectionTypes), section.type).replace("<select ", "<select data-section-type ")}
    ${input("Heading (optional)", prefix + "heading", section.heading, 'maxlength="100"')}
    <div data-for-section="text quote">${textarea("Content", prefix + "text", section.text, 'maxlength="6000" rows="4"')}</div>
    <p class="demo-note" data-format-hint>Text blocks support Markdown emphasis, links, code, and bullet lists.</p>
    <div data-for-section="quote">${input("Attribution", prefix + "credit", section.credit, 'maxlength="100"')}</div>
    ${select("Image", "image", "image", section.mediaId, images)}
    ${select("Video", "video", "video", section.mediaId, mediaOptions(media, "video"))}
    <div data-for-section="video">${input("Captions URL (optional, WebVTT)", prefix + "captions", section.captions, 'type="url" maxlength="400"')}</div>
    ${[0, 1, 2, 3, 4, 5].map(index => select("Grid image " + (index + 1), "grid_" + index, "grid", section.mediaIds?.[index], images)).join("")}
    <div data-for-section="embed">${input("YouTube privacy-enhanced or Vimeo player URL", prefix + "url", section.url, 'type="url" maxlength="400"')}</div>
    <div class="actions"><button class="button outline compact-action" type="button" data-reorder="up">Move up</button><button class="button outline compact-action" type="button" data-reorder="down">Move down</button><button class="button outline compact-action" type="button" data-reorder="remove">Remove block</button></div>
  </fieldset>`;
}

export function editorView(row, services, media, override) {
  const draft = override?.working ?? row?.working ?? {};
  const path = row?.id ? "/admin/projects/" + row.id : "/admin/projects/new";
  const projectSlug = row?.slug ?? override?.slug;
  return `<div class="admin-columns">
    <form method="post" action="${path}" class="panel admin-card">
      <h2>Project details</h2>
      <input type="hidden" name="revision" value="${row?.revision ?? 0}">
      <div class="form-pair">${input("Title", "title", draft.title, 'required maxlength="100"')}${input("Slug", "slug", projectSlug, (row?.id ? 'readonly ' : 'placeholder="generated-from-title" ') + 'maxlength="80" pattern="[a-z0-9]+(-[a-z0-9]+)*"')}</div>
      <div class="form-pair">${fieldSelect("Discipline", "service", services.map(service => [service.slug, service.title]), draft.service)}${input("Subcategory", "category", draft.category, 'maxlength="70"')}</div>
      ${textarea("Summary", "summary", draft.summary, 'rows="3" maxlength="500"')}
      <div class="form-pair">${input("Year", "year", draft.year, 'inputmode="numeric" pattern="[0-9]{4}" maxlength="4"')}${input("Role", "role", draft.role, 'maxlength="140"')}</div>
      ${input("Tools (comma-separated)", "tools", draft.tools?.join(", "), 'maxlength="260"')}
      ${fieldSelect("Cover media", "coverId", mediaOptions(media), draft.coverId, "Select media")}
      ${fieldSelect("Project video (optional)", "videoId", mediaOptions(media, "video"), draft.videoId, "None")}
      ${input("Captions URL (optional, WebVTT)", "captions", draft.captions, 'type="url" maxlength="400"')}
      <fieldset class="fieldset-panel"><legend>External links</legend>${[["Live demo", "demo"], ["GitHub repository", "github"], ["Figma prototype", "figma"]].map(([label, name]) => input(label, "link_" + name, draft.links?.find(link => link.key === name)?.url, 'type="url" maxlength="400"')).join("")}</fieldset>
      <fieldset class="fieldset-panel"><legend>Case study</legend>
        <div class="admin-blocks" data-sections>${(draft.sections ?? []).map((section, index) => sectionEditor(section, String(index), media)).join("")}</div>
        <template data-section-template>${sectionEditor({ type: "text" }, "TEMPLATE", media)}</template>
        <button class="button outline compact-action" type="button" data-add-section>Add block</button>
      </fieldset>
      <div class="form-pair">${input("Sort order", "sort", draft.sort ?? 0, 'type="number" min="-9999" max="9999" step="1"')}<label class="check"><input type="checkbox" name="featured" value="yes"${draft.featured ? " checked" : ""}> Feature this project</label></div>
      <div class="actions">${adminButton("Save draft", "save", "primary")}${adminButton("Publish", "publish")}</div>
    </form>
    <div><div class="panel admin-card">
      <h2>Publishing</h2>
      <p class="muted">${row ? 'Current state: ' + h(row.state) + '. Saving a draft keeps the public version intact.' : 'Saving a draft creates a private project you can preview before publishing.'}</p>
      ${row?.id ? `<div class="actions admin-spaced"><a class="button outline compact-action" href="/admin/projects/${h(row.id)}/preview">Preview saved draft</a>${row.state === "published" ? '<a class="button outline compact-action" href="/projects/' + h(row.slug) + '">View live project</a>' : ""}</div>
      <form method="post" action="${path}/state" class="actions admin-spaced"><input type="hidden" name="revision" value="${row.revision}">
        ${row.state === "published" ? adminButton("Unpublish", "unpublish") : ""}
        ${row.state !== "archived" ? adminButton("Archive", "archive") : ""}
      </form>` : ""}
    </div>
    ${row?.state === "archived" ? `<form class="panel admin-card" method="post" action="${path}/state">
      <h2>Delete archived project</h2><p>Type <strong>${h(row.slug)}</strong> to confirm permanent deletion. Media stays in the library.</p>
      <input type="hidden" name="revision" value="${row.revision}">${input("Confirm project slug", "delete_slug", "", "required maxlength=80")}
      ${adminButton("Delete project", "delete")}
    </form>` : ""}
    <div class="panel admin-card"><h2>Media</h2><p>Upload images and video in the <a href="/admin/media" class="admin-link">media library</a>, then select them here.</p></div>
    </div>
  </div>`;
}

export function mediaAdminView(media, uploads) {
  return `<div class="admin-columns"><form class="panel admin-card" action="/admin/media" method="post" enctype="multipart/form-data">
    <h2>Upload media</h2><p class="muted">JPEG, PNG, WebP up to 4 MB. MP4 or WebM up to 20 MB.</p>
    ${uploads ? `<label>File<input type="file" name="file" accept="image/jpeg,image/png,image/webp,video/mp4,video/webm" required></label>${input("Alt text or video description", "alt", "", 'required maxlength="220"')}${input("Caption", "caption", "", 'maxlength="350"')}${adminButton("Upload", "upload", "primary")}` : '<p class="notice">Connect Cloudinary to enable media uploads.</p>'}
  </form><div class="panel admin-card"><h2>Media library</h2><p>Existing published projects keep their saved descriptions until republished.</p></div></div>
  <div class="media-admin-grid">${media.map(item => `<form class="panel admin-card" action="/admin/media/${h(item.id)}" method="post">
    ${picture({ id: item.public_id, cloud: item.cloud, type: item.type, alt: item.alt })}<p class="muted">${h(item.type)}</p>
    ${input("Alt text", "alt", item.alt, 'required maxlength="220"')}${input("Caption", "caption", item.caption, 'maxlength="350"')}${adminButton("Save media details", "edit")}
  </form>`).join("")}</div>`;
}

export function settingsAdminView(profile, services, settingsRevision, media) {
  const profileFields = [
    input("Name or brand", "name", profile.name, 'required maxlength="80"'),
    input("Hero headline", "headline", profile.headline, 'required maxlength="115"'),
    input("Hero accent text", "headlineAccent", profile.headlineAccent, 'maxlength="42"'),
    textarea("Short introduction", "intro", profile.intro, 'required rows="2" maxlength="280"'),
    textarea("Biography", "bio", profile.bio, 'required rows="5" maxlength="2000"'),
    input("Public email (optional)", "email", profile.email, 'type="email" maxlength="254"'),
    input("Résumé URL (optional)", "resume", profile.resume, 'type="url" maxlength="400"'),
    textarea("Social links (one Label | URL pair per line)", "socials", profile.socials?.map(link => link.label + " | " + link.url).join("\n"), 'rows="4" maxlength="1800"'),
  ].join("");
  return `<form class="panel admin-card" action="/admin/settings" method="post">
    <input type="hidden" name="revision" value="${settingsRevision}">
    <h2>Site content</h2>
    ${profileFields}
    ${services.map((service, index) => {
      const prefix = service.slug + "_";
      return '<fieldset class="fieldset-panel"><legend>' + h(service.title) + '</legend>' +
        input("Title", prefix + "title", service.title, 'required maxlength="65"') +
        input("Short filter label", prefix + "label", service.label, 'required maxlength="24"') +
        input("Tagline", prefix + "tagline", service.tagline, 'required maxlength="110"') +
        textarea("Service introduction", prefix + "description", service.description, 'required maxlength="600" rows="2"') +
        input("Skills (comma-separated)", prefix + "skills", service.skills.join(", "), 'maxlength="300"') +
        input("Tools (comma-separated)", prefix + "tools", service.tools.join(", "), 'maxlength="300"') +
        fieldSelect("Cover image", prefix + "coverId", mediaOptions(media, "image"), service.coverId, "Use default cover") +
        input("Sort order", prefix + "sort", service.sort ?? index * 10, 'type="number" min="-9999" max="9999" required') + '</fieldset>';
    }).join("")}
    <div>${adminButton("Save settings", "settings", "primary")}</div>
  </form>`;
}

export function enquiriesAdminView(enquiries) {
  if (!enquiries.length) return '<p class="empty-state">No enquiries have been submitted.</p>';
  return enquiries.map(item => `<article class="panel admin-card" id="enquiry-${h(item.id)}">
    <h2>${h(item.name)}</h2><p class="muted">${h(item.email)} · ${h(new Date(item.created_at).toISOString().slice(0, 10))}</p>
    <p>${h(item.services.join(", "))}${item.budget ? ' · ' + h(item.budget) : ''}</p><p>${h(item.message)}</p>
    <p class="muted">Email: ${h(item.notification.replace("_", " "))}</p>
    ${item.reviewed_at ? '<p>Reviewed</p>' : '<form class="admin-spaced" method="post" action="/admin/enquiries/' + h(item.id) + '">' + adminButton("Mark reviewed", "review") + '</form>'}
  </article>`).join("");
}

export function textField(form, key, label, maximum, minimum = 0) {
  const raw = form.get(key);
  const value = typeof raw === "string" ? raw.trim() : "";
  if (value.length < minimum || value.length > maximum) throw new SiteError(label + " must be " + (minimum ? minimum + " to " : "at most ") + maximum + " characters.");
  return value;
}

function linkField(form, key, label) {
  const value = textField(form, key, label, 400);
  if (!value) return "";
  let url;
  try { url = new URL(value); } catch {}
  if (!url || url.protocol !== "https:" || url.username || url.password) throw new SiteError(label + " must be an HTTPS URL.");
  return url.href;
}

function commaList(value) {
  return [...new Set(value.split(",").map(text => text.trim()).filter(Boolean))].slice(0, 15);
}

function orderValue(form, key) {
  const value = Number(form.get(key) || "0");
  if (!Number.isInteger(value) || Math.abs(value) > 9999) throw new SiteError("Sort order must be a whole number from −9999 to 9999.");
  return value;
}

export function emailField(form, key, required = true) {
  const value = textField(form, key, "Email", 254, required ? 3 : 0).toLowerCase();
  if (value && !/^[^\s@]+@[^\s@.]+(?:\.[^\s@.]+)+$/.test(value)) throw new SiteError("Enter a valid email address.");
  return value;
}

export function parseProject(form, old, publishing) {
  const title = textField(form, "title", "Title", 100, 1);
  const slug = old?.slug || (textField(form, "slug", "Slug", 80) || title.normalize("NFKD").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80).replace(/-$/, ""));
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) throw new SiteError("Enter a slug made of lowercase letters, numbers, and hyphens.");
  const service = form.get("service");
  if (!serviceSlugs.includes(service)) throw new SiteError("Choose a valid discipline.");
  const year = textField(form, "year", "Year", 4, publishing ? 4 : 0);
  if (year && !/^\d{4}$/.test(year)) throw new SiteError("Enter a four-digit year.");
  const keys = form.getAll("section");
  if (keys.length > 20 || new Set(keys).size !== keys.length || keys.some(key => typeof key !== "string" || !/^[a-zA-Z0-9-]{1,36}$/.test(key))) throw new SiteError("Use up to 20 unique case-study blocks.");
  const sections = keys.map(key => {
    const prefix = "section_" + key + "_";
    const type = form.get(prefix + "type");
    if (!Object.hasOwn(sectionTypes, type)) throw new SiteError("Select a supported case-study block.");
    const block = { type, heading: textField(form, prefix + "heading", "Block heading", 100) };
    if (type === "text" || type === "quote") block.text = textField(form, prefix + "text", "Block content", 6000, publishing ? 1 : 0);
    if (type === "quote") block.credit = textField(form, prefix + "credit", "Attribution", 100);
    if (type === "image" || type === "video") block.mediaId = textField(form, prefix + type, "Media", 36);
    if (type === "video") block.captions = linkField(form, prefix + "captions", "Captions");
    if (type === "grid") block.mediaIds = [...new Set(Array.from({ length: 6 }, (_, index) => textField(form, prefix + "grid_" + index, "Grid image", 36)).filter(Boolean))];
    if (type === "embed") {
      block.url = linkField(form, prefix + "url", "Embed");
      if ((publishing || block.url) && !/^https:\/\/(?:www\.youtube-nocookie\.com\/embed\/[\w-]{11}|player\.vimeo\.com\/video\/\d+)(?:\?[^#]*)?$/.test(block.url)) {
        throw new SiteError("Use a youtube-nocookie.com embed URL or a player.vimeo.com video URL.");
      }
    }
    return block;
  });
  const links = [["demo", "Live demo"], ["github", "GitHub repository"], ["figma", "Figma prototype"]].map(([key, label]) => ({ key, label, url: linkField(form, "link_" + key, label) })).filter(link => link.url);
  return { slug, working: {
    title, service, year, links, sections, sort: orderValue(form, "sort"),
    summary: textField(form, "summary", "Summary", 500, publishing ? 10 : 0),
    role: textField(form, "role", "Role", 140, publishing ? 1 : 0),
    category: textField(form, "category", "Subcategory", 70),
    tools: commaList(textField(form, "tools", "Tools", 260)),
    coverId: textField(form, "coverId", "Cover media", 36, publishing ? 36 : 0),
    videoId: textField(form, "videoId", "Video", 36),
    captions: linkField(form, "captions", "Captions"),
    featured: form.get("featured") === "yes",
  } };
}

function mediaSnapshot(asset) {
  return { id: asset.public_id, cloud: asset.cloud, type: asset.type, alt: asset.alt, caption: asset.caption };
}

export function materializeProject(work, media, publishing = false) {
  const assets = new Map(media.map(asset => [asset.id, asset]));
  function findAsset(id, type, required = false) {
    if (!id && !required) return undefined;
    const asset = assets.get(id);
    if (!asset || (type && asset.type !== type)) throw new SiteError("Select an available " + (type ?? "cover image or video") + " from the media library.");
    return mediaSnapshot(asset);
  }
  const { coverId, videoId, captions, sections, ...publicFields } = work;
  const cover = findAsset(coverId, null, publishing);
  let video = findAsset(videoId, "video") ?? (cover?.type === "video" ? cover : undefined);
  if (video && captions) video = { ...video, captions };
  const blocks = sections.map(section => {
    if (section.type === "image" || section.type === "video") {
      const { mediaId, captions, ...fields } = section;
      const asset = findAsset(mediaId, section.type, publishing);
      return { ...fields, media: asset && captions ? { ...asset, captions } : asset };
    }
    if (section.type === "grid") {
      const { mediaIds, ...fields } = section;
      if (publishing && !mediaIds.length) throw new SiteError("Select at least one image for each image grid.");
      return { ...fields, images: mediaIds.map(id => findAsset(id, "image", true)) };
    }
    return section;
  }).filter(section => section.media !== undefined || !["image", "video"].includes(section.type));
  return { ...publicFields, cover, video, sections: blocks };
}

export function parseSettings(form, media) {
  const socials = textField(form, "socials", "Social links", 1800).split(/\r?\n/).filter(line => line.trim()).map(line => {
    const [label, value, ...rest] = line.split("|").map(piece => piece.trim());
    if (!label || !value || rest.length || label.length > 40) throw new SiteError("Enter each social link as Label | https://address.");
    const params = new FormData();
    params.set("url", value);
    return { label, url: linkField(params, "url", "Social link") };
  });
  const profile = {
    name: textField(form, "name", "Name", 80, 1), headline: textField(form, "headline", "Headline", 115, 1),
    headlineAccent: textField(form, "headlineAccent", "Accent text", 42), intro: textField(form, "intro", "Introduction", 280, 1),
    bio: textField(form, "bio", "Biography", 2000, 1), email: emailField(form, "email", false), resume: linkField(form, "resume", "Résumé"), socials,
  };
  const services = Object.fromEntries(serviceSlugs.map(slug => {
    const prefix = slug + "_";
    const coverId = textField(form, prefix + "coverId", "Service cover", 36);
    const asset = media.find(item => item.id === coverId && item.type === "image");
    if (coverId && !asset) throw new SiteError("Select an available service cover image.");
    return [slug, {
      title: textField(form, prefix + "title", "Service title", 65, 1), label: textField(form, prefix + "label", "Filter label", 24, 1),
      tagline: textField(form, prefix + "tagline", "Tagline", 110, 1), description: textField(form, prefix + "description", "Service introduction", 600, 1),
      skills: commaList(textField(form, prefix + "skills", "Skills", 300)), tools: commaList(textField(form, prefix + "tools", "Tools", 300)),
      sort: orderValue(form, prefix + "sort"), coverId, cover: asset ? mediaSnapshot(asset) : null,
    }];
  }));
  return { profile, services };
}
