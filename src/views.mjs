export function h(value = "") {
  return String(value ?? "").replace(/[&<>"']/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]);
}

function safeLink(value) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password ? url.href : "";
  } catch {
    return "";
  }
}

function siteMedia(asset, width, poster = false) {
  if (!asset) return "";
  if (!asset.id) return width <= 560 && asset.small ? asset.small : asset.src;
  const publicId = asset.id.split("/").map(encodeURIComponent).join("/");
  const root = "https://res.cloudinary.com/" + encodeURIComponent(asset.cloud) + "/";
  if (asset.type === "video") return root + "video/upload/" + (poster ? "so_auto,c_fill,w_" + width + ",q_auto/" + publicId + ".jpg" : "c_limit,w_1280,f_mp4,q_auto/" + publicId + ".mp4");
  return root + "image/upload/c_limit,w_" + width + ",f_auto,q_auto/" + publicId;
}

export function picture(asset, { lazy = true, sizes = "(max-width: 700px) 92vw, 50vw", decorative = false } = {}) {
  if (!asset) return '<div class="empty-media" aria-hidden="true">✳</div>';
  const small = siteMedia(asset, 560, true);
  const big = siteMedia(asset, 1152, true);
  return '<img src="' + h(big) + '" srcset="' + h(small) + " 560w, " + h(big) + ' 1152w" sizes="' + h(sizes) + '" alt="' + h(decorative ? "" : asset.alt) + '" width="1152" height="864" decoding="async" ' + (lazy ? 'loading="lazy"' : 'fetchpriority="high"') + '>';
}

function projectUrl(project) {
  return "/projects/" + encodeURIComponent(project.slug);
}

function serviceUrl(service) {
  return "/work/" + encodeURIComponent(service.slug);
}

function studioMark(profile) {
  return '<span class="studio-mark" aria-hidden="true">✳</span><span>' + h(profile.name) + '</span>';
}

function navItem(label, url, active) {
  return '<a href="' + url + '"' + (active ? ' aria-current="page"' : "") + '>' + label + '</a>';
}

export function shell(content, path, title, description, body, options = {}) {
  const { profile } = content;
  const home = path === "/";
  const work = path.startsWith("/work") || path.startsWith("/projects");
  const nav = [
    navItem("Home", "/", home),
    navItem("Work", "/work", work),
    navItem("About", "/about", path === "/about"),
    navItem("Contact", "/contact", path === "/contact"),
  ].join("");
  const socials = (profile.socials ?? []).map(social => safeLink(social.url) ? '<a href="' + h(safeLink(social.url)) + '" rel="noopener noreferrer" target="_blank">' + h(social.label) + '</a>' : "").join("");
  const pageTitle = home ? profile.name + " | Introduction" : title + " | " + profile.name;
  const canonical = options.origin && !options.noindex ? options.origin + path : "";
  const metaImage = options.image ?? "/media/studio.webp";
  const imageUrl = options.origin ? new URL(metaImage, options.origin).href : "";
  const graph = home && canonical ? '<script type="application/ld+json">' + JSON.stringify({ "@context": "https://schema.org", "@type": "WebSite", name: profile.name, url: canonical, description }).replace(/</g, "\\u003c") + '</script>' : "";
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="theme-color" content="#080808">
  <title>${h(pageTitle)}</title>
  <meta name="description" content="${h(description)}">
  ${canonical ? `<link rel="canonical" href="${h(canonical)}"><meta property="og:url" content="${h(canonical)}">` : ""}
  ${options.noindex ? '<meta name="robots" content="noindex, nofollow">' : ""}
  <meta property="og:type" content="website">
  <meta property="og:title" content="${h(pageTitle)}">
  <meta property="og:description" content="${h(description)}">
  ${imageUrl ? `<meta property="og:image" content="${h(imageUrl)}">` : ""}
  <link rel="stylesheet" href="/styles.css">
  <script src="/ui.js" type="module"></script>
  ${graph}
</head>
<body>
  <a href="#main" class="skip-link">Skip to content</a>
  <header class="site-header">
    <div class="frame header-inner">
      <a href="/" class="wordmark" aria-label="${h(profile.name)} home">${studioMark(profile)}</a>
      <nav aria-label="Main navigation" class="desktop-nav">${nav}</nav>
      <a class="button outline nav-cta" href="/contact">Let’s talk</a>
      <details class="mobile-nav">
        <summary>Menu <span aria-hidden="true">☰</span></summary>
        <nav aria-label="Mobile navigation">${nav}</nav>
      </details>
    </div>
  </header>
  <main id="main" tabindex="-1">${body}</main>
  <footer class="site-footer">
    <div class="frame footer-inner">
      <a class="wordmark" href="/">${studioMark(profile)}</a>
      <nav aria-label="Footer navigation"><a href="/work">Work</a><a href="/about">About</a><a href="/contact">Contact</a>${socials}</nav>
      <small>© ${new Date().getFullYear()} ${h(profile.name)}</small>
    </div>
  </footer>
  <dialog class="lightbox" aria-label="Image viewer">
    <div class="lightbox-bar"><button type="button" data-lightbox-prev aria-label="Previous image">‹</button><button type="button" data-lightbox-next aria-label="Next image">›</button><button type="button" data-lightbox-close aria-label="Close image viewer">×</button></div>
    <figure><img alt=""><figcaption aria-live="polite"></figcaption></figure>
  </dialog>
</body>
</html>`;
}

function eyebrow(label) {
  return '<p class="eyebrow"><span aria-hidden="true"></span>' + h(label) + '</p>';
}

function sectionTitle(label, title, accent, action = "") {
  return '<header class="section-heading"><div>' + eyebrow(label) + '<h2>' + h(title) + ' <em>' + h(accent) + '</em></h2></div>' + action + '</header>';
}

function button(label, url, style = "primary") {
  return '<a class="button ' + style + '" href="' + h(url) + '">' + h(label) + '</a>';
}

function tags(items) {
  return items?.length ? '<ul class="tags">' + items.map(item => '<li>' + h(item) + '</li>').join("") + '</ul>' : "";
}

function showcaseCard(project, services) {
  const service = services.find(item => item.slug === project.service);
  const video = project.video ?? (project.cover?.type === "video" ? project.cover : undefined);
  return `<article class="project-card" data-project data-category="${h(project.category || "")}" data-service="${h(project.service)}">
    <a href="${projectUrl(project)}" class="project-link" aria-label="View ${h(project.title)}">
      <div class="project-media">
        ${picture(project.cover)}
        ${video ? `<video class="hover-preview" muted playsinline loop preload="none" data-preview="${h(siteMedia(video, 720))}" aria-hidden="true"></video><span class="play-mark" aria-hidden="true">▶</span>` : ""}
        ${project.demo ? '<span class="project-demo">Demo project</span>' : ""}
      </div>
      <div class="project-caption">
        <div><p>${h(service?.title ?? "")} ${project.category ? '· ' + h(project.category) : ""}</p><h3>${h(project.title)}</h3></div>
        ${project.year ? '<span class="year">' + h(project.year) + '</span>' : ""}
      </div>
    </a>
  </article>`;
}

function workGrid(projects, services, extra = "") {
  return '<div class="project-grid ' + extra + '">' + projects.map(project => showcaseCard(project, services)).join("") + '</div>';
}

function serviceCards(services) {
  return '<div class="service-grid">' + services.map(service => `<a class="service-card ${h(service.color)}" href="${serviceUrl(service)}">
    <span class="service-icon" aria-hidden="true">${h(service.icon)}</span><div><h3>${h(service.title)}</h3><p>${h(service.tagline)}</p></div>
  </a>`).join("") + '</div>';
}

function contactBand(label = "Have a project in mind?", href = "/contact") {
  return '<section class="frame section"><div class="contact-band">' + eyebrow("Contact") + '<h2>' + h(label) + ' <em>Let’s talk.</em></h2>' + button("Start an enquiry", href) + '</div></section>';
}

function galleryRail(projects) {
  if (projects.length < 2) return "";
  const limit = Math.min(3, projects.length);
  const rails = Array.from({ length: limit }, (_, row) => {
    const reordered = [...projects.slice(row), ...projects.slice(0, row)];
    const tiles = reordered.map(project => '<a class="rail-tile" href="' + projectUrl(project) + '" aria-label="View ' + h(project.title) + '">' + picture(project.cover, { sizes: "300px", decorative: true }) + '</a>').join("");
    const duplicate = (project, extra = "") => '<a tabindex="-1" aria-hidden="true" class="rail-tile ' + extra + '" href="' + projectUrl(project) + '">' + picture(project.cover, { sizes: "300px", decorative: true }) + '</a>';
    const extraTiles = reordered.slice(0, Math.max(0, 4 - reordered.length));
    const duplicates = [...reordered, ...extraTiles].map(project => duplicate(project)).join("");
    return '<div class="rail-window"><div class="rail-track"><div class="rail-set">' + tiles + extraTiles.map(project => duplicate(project, "rail-extra")).join("") + '</div><div class="rail-set rail-duplicate" aria-hidden="true">' + duplicates + '</div></div></div>';
  });
  return '<section class="section moving-gallery"><div class="frame">' + sectionTitle("Gallery", "Work in", "motion.", '<button class="button outline" type="button" data-motion aria-pressed="false" hidden>Pause gallery</button>') + '</div><div class="rails">' + rails.join("") + '</div></section>';
}

export function homeView(content) {
  const { profile, projects, services } = content;
  const featured = projects.filter(project => project.featured);
  const art = { src: "/media/jayant-portrait-sage.webp", small: "/media/jayant-portrait-sage-small.webp", alt: "Jayant smiling with crossed arms against a dark background with muted sage smoke" };
  return `<section class="hero">
    <div class="frame hero-inner">
      <div class="hero-copy">
        ${eyebrow("Introduction")}
        <h1>${h(profile.headline)} <em>${h(profile.headlineAccent)}</em></h1>
        <p class="hero-intro">${h(profile.intro)}</p>
        <div class="actions">${button("Explore the work", "/work")}${button("About me", "/about", "outline")}</div>
      </div>
      <figure class="hero-art">
        <div class="hero-art-image">${picture(art, { lazy: false, sizes: "(max-width: 760px) 92vw, 45vw" })}</div>
        <figcaption><span>Jayant</span><span>Design · Motion · Code</span></figcaption>
      </figure>
    </div>
  </section>
  <section class="frame section about-preview">
    <div>${eyebrow("About me")}<h2>Design, motion, <em>and code.</em></h2></div>
    <div><p>${h(profile.bio)}</p>${tags([...new Set(services.flatMap(service => service.tools))].slice(0, 6))}${button("More about me", "/about", "outline")}</div>
  </section>
  ${featured.length ? `<section class="frame section featured">${sectionTitle("Portfolio", "Selected", "work.", button("View all work", "/work", "outline"))}${workGrid(featured, services)}</section>` : ""}
  <section class="frame section">${sectionTitle("Disciplines", "Ways I", "work.")}${serviceCards(services)}</section>
  ${galleryRail(projects)}
  ${contactBand()}`;
}

function galleryFilters(items, key) {
  if (items.length < 2) return "";
  return '<div class="filter-bar" data-filters="' + key + '" aria-label="Filter projects"><button type="button" aria-pressed="true" data-filter="">All projects</button>' + items.map(([value, label]) => '<button type="button" aria-pressed="false" data-filter="' + h(value) + '">' + h(label) + '</button>').join("") + '</div>';
}

function galleryResults(projects, services, filters, variant = "") {
  return '<div data-gallery>' + filters + '<p class="sr-only" aria-live="polite" data-results></p>' + (projects.length ? workGrid(projects, services, variant) : "") + '<p class="empty-state" data-empty' + (projects.length ? ' hidden' : '') + '>' + (projects.length ? 'No projects match this filter.' : 'Projects from this discipline will appear here once published.') + '</p></div>';
}

export function workView(content, service) {
  const { services, projects } = content;
  if (!service) {
    return `<div class="frame page-intro">${eyebrow("Portfolio")}<h1>Explore the <em>work.</em></h1><p>Browse projects across identity, moving image, interfaces, and development.</p></div>
      <section class="frame browse-section" aria-label="Projects">
        ${galleryResults(projects, services, galleryFilters(services.map(item => [item.slug, item.label]), "service"))}
      </section>
      <section class="frame section">${sectionTitle("Disciplines", "Explore by", "discipline.")}${serviceCards(services)}</section>`;
  }

  const matches = projects.filter(project => project.service === service.slug);
  const featured = matches.filter(project => project.featured);
  const categories = [...new Set(matches.map(project => project.category).filter(Boolean))];
  const serviceImage = service.cover ?? (service.image ? { src: "/media/" + service.image + ".webp", small: "/media/" + service.image + "-small.webp", alt: "" } : null);
  return `<div class="frame service-intro ${h(service.color)}">
    <div class="page-intro">
      <a class="breadcrumb" href="/work">All work</a>
      ${eyebrow("Discipline")}<h1>${h(service.title)}<em>.</em></h1><p>${h(service.description)}</p>
      <div class="service-facts"><div><h2>Skills</h2>${tags(service.skills)}</div><div><h2>Tools</h2>${tags(service.tools)}</div></div>
    </div>
    ${serviceImage ? '<div class="service-cover">' + picture(serviceImage, { lazy: false, decorative: !serviceImage.alt }) + '</div>' : ""}
  </div>
  ${featured.length ? '<section class="frame section featured">' + sectionTitle("Highlights", "Featured", "work.") + workGrid(featured, services) + '</section>' : ""}
  <section class="frame section">${sectionTitle("Gallery", "All", "projects.")}${galleryResults(matches, services, galleryFilters(categories.map(category => [category, category]), "category"), "genre-" + service.slug)}</section>
  ${contactBand("Need " + service.title.toLowerCase() + "?", "/contact?service=" + service.slug)}`;
}

function lightboxImage(asset, group) {
  return `<figure class="case-image">
    <button type="button" class="zoom-image" data-image="${h(siteMedia(asset, 1800, true))}" data-alt="${h(asset.alt)}" data-caption="${h(asset.caption)}" data-group="${h(group)}" aria-label="Enlarge image: ${h(asset.alt)}">${picture(asset)}<span class="zoom-mark" aria-hidden="true">+</span></button>
    ${asset.caption ? '<figcaption>' + h(asset.caption) + '</figcaption>' : ""}
  </figure>`;
}

function videoPlayer(asset, cover) {
  return `<figure class="case-video">
    <video controls preload="none" playsinline${safeLink(asset.captions) ? ' crossorigin="anonymous"' : ""} poster="${h(siteMedia(cover ?? asset, 1152, true))}" aria-label="${h(asset.alt)}">
      <source src="${h(siteMedia(asset, 1152))}">
      ${safeLink(asset.captions) ? '<track kind="captions" src="' + h(asset.captions) + '" srclang="en" label="English" default>' : ""}
      Your browser does not support video playback.
    </video>
    ${asset.caption ? '<figcaption>' + h(asset.caption) + '</figcaption>' : ""}
  </figure>`;
}

function inlineText(value) {
  const tokens = /\*\*(?<strong>[^*\n]+)\*\*|\*(?<italic>[^*\n]+)\*|`(?<code>[^`\n]+)`|\[(?<label>[^\]\n]+)\]\((?<href>https:\/\/[^\s)]+)\)/g;
  let result = "", offset = 0;
  for (const token of value.matchAll(tokens)) {
    const { strong, italic, code, label, href } = token.groups;
    result += h(value.slice(offset, token.index));
    if (strong) result += '<strong>' + h(strong) + '</strong>';
    else if (italic) result += '<i>' + h(italic) + '</i>';
    else if (code) result += '<code>' + h(code) + '</code>';
    else {
      const url = safeLink(href);
      result += url ? '<a href="' + h(url) + '" rel="noopener noreferrer">' + h(label) + '</a>' : h(token[0]);
    }
    offset = token.index + token[0].length;
  }
  return result + h(value.slice(offset));
}

function richText(value) {
  return value.split(/\n\s*\n/).map(paragraph => {
    const lines = paragraph.split(/\r?\n/);
    if (lines.every(line => line.startsWith("- "))) return "<ul>" + lines.map(line => "<li>" + inlineText(line.slice(2)) + "</li>").join("") + "</ul>";
    return "<p>" + inlineText(paragraph) + "</p>";
  }).join("");
}

function caseBlock(section, slug) {
  const heading = section.heading ? '<h2>' + h(section.heading) + '</h2>' : "";
  let body = "";
  switch (section.type) {
    case "text":
      body = richText(section.text);
      break;
    case "quote":
      body = '<blockquote>' + h(section.text) + (section.credit ? '<cite>' + h(section.credit) + '</cite>' : '') + '</blockquote>';
      break;
    case "image":
      body = lightboxImage(section.media, slug);
      break;
    case "grid":
      body = '<div class="case-image-grid">' + section.images.map(asset => lightboxImage(asset, slug)).join("") + '</div>';
      break;
    case "video":
      body = videoPlayer(section.media);
      break;
    case "embed": {
      const embed = section.url.match(/^https:\/\/(?:www\.youtube-nocookie\.com\/embed\/[\w-]{11}|player\.vimeo\.com\/video\/\d+)(?:\?[^#]*)?$/);
      if (embed) body = '<iframe loading="lazy" src="' + h(embed[0]) + '" title="' + h(section.heading || "External video") + '" referrerpolicy="strict-origin-when-cross-origin" allow="fullscreen; picture-in-picture" allowfullscreen></iframe>';
      break;
    }
  }
  return body ? '<section class="case-section">' + heading + body + '</section>' : "";
}

export function projectView(content, project, preview = false) {
  const { services, projects } = content;
  const service = services.find(item => item.slug === project.service);
  const related = projects.filter(item => item.slug !== project.slug).sort((a, b) => Number(b.service === project.service) - Number(a.service === project.service)).slice(0, 3);
  const videos = project.video ?? (project.cover?.type === "video" ? project.cover : null);
  const external = (project.links ?? []).filter(link => safeLink(link.url));
  return `<article>
    <div class="frame page-intro case-intro">
      ${preview ? '<p class="notice">Private draft preview. Public visitors only see the published version.</p>' : ""}
      <a href="${service ? serviceUrl(service) : "/work"}" class="breadcrumb">${h(service?.title ?? "All work")}</a>
      ${eyebrow(project.demo ? "Demo case study" : (project.category || "Case study"))}
      <h1>${h(project.title)}</h1><p>${h(project.summary)}</p>
      <dl class="case-facts">
        ${project.role ? '<div><dt>Role</dt><dd>' + h(project.role) + '</dd></div>' : ""}
        ${project.year ? '<div><dt>Year</dt><dd>' + h(project.year) + '</dd></div>' : ""}
        ${project.tools?.length ? '<div><dt>Tools</dt><dd>' + project.tools.map(h).join(", ") + '</dd></div>' : ""}
      </dl>
      ${external.length ? '<div class="actions">' + external.map(link => '<a class="button outline" href="' + h(safeLink(link.url)) + '" rel="noopener noreferrer" target="_blank">' + h(link.label) + '</a>').join("") + '</div>' : ""}
    </div>
    <div class="frame case-hero">${videos ? videoPlayer(videos, project.cover) : project.cover ? lightboxImage(project.cover, project.slug) : ""}</div>
    <div class="frame case-body">${(project.sections ?? []).map(section => caseBlock(section, project.slug)).join("")}</div>
  </article>
  ${!preview && related.length ? '<section class="frame section">' + sectionTitle("Portfolio", "More", "work.") + workGrid(related, services, "related-grid") + '</section>' : ""}`;
}

export function aboutView(content) {
  const { profile, services } = content;
  return `<section class="frame service-intro about-page"><div class="page-intro">
    ${eyebrow("About")}<h1>A practice across <em>disciplines.</em></h1><p>${h(profile.bio)}</p>
    <div class="actions">${safeLink(profile.resume) ? button("View résumé", safeLink(profile.resume), "outline") : ""}${button("Get in touch", "/contact")}</div>
  </div><div class="service-cover about-artwork">${picture({ src: "/media/cultural-ceremony-proposal.webp", small: "/media/cultural-ceremony-proposal-small.webp", alt: "Jayant’s Dilli Meri Jaan cultural ceremony sponsorship proposal design" }, { lazy: false })}</div></section>
  <section class="frame section">${sectionTitle("Capabilities", "Skills and", "tools.")}<div class="about-skills">${services.map(service => '<article><h3><a href="' + serviceUrl(service) + '">' + h(service.title) + '</a></h3><p>' + h(service.description) + '</p>' + tags([...(service.skills ?? []), ...(service.tools ?? [])]) + '</article>').join("")}</div></section>`;
}

export function contactView(content, selected = [], values = {}, notice = "", success = false) {
  const { services, profile } = content;
  return `<section class="frame contact-page">
    <div class="page-intro">${eyebrow("Contact")}<h1>Let’s make <em>something.</em></h1><p>Tell me what you’re working on and where you could use a hand.</p>${profile.email ? '<a class="contact-email" href="mailto:' + h(profile.email) + '">' + h(profile.email) + '</a>' : ""}</div>
    <form class="panel enquiry-form" method="post" action="/contact">
      <h2>Project enquiry</h2>
      ${notice ? '<p class="notice' + (success ? ' success' : '') + '" role="status">' + h(notice) + '</p>' : ""}
      <div class="form-pair">
        <label>Name <input name="name" autocomplete="name" required minlength="2" maxlength="100" value="${h(values.name)}"></label>
        <label>Email <input name="email" type="email" autocomplete="email" required maxlength="254" value="${h(values.email)}"></label>
      </div>
      <fieldset><legend>What do you need?</legend><div class="check-grid">${[...services.map(service => [service.slug, service.title]), ["general", "General enquiry"]].map(([value, label]) => '<label class="check"><input type="checkbox" name="service" value="' + h(value) + '"' + (selected.includes(value) ? " checked" : "") + '> ' + h(label) + '</label>').join("")}</div></fieldset>
      <label>Budget <span class="muted">(optional)</span><input name="budget" maxlength="100" value="${h(values.budget)}" placeholder="Your estimated range"></label>
      <label>Project details <textarea name="message" required minlength="10" maxlength="3000" rows="5" placeholder="A little about the project, timing, or deliverables…">${h(values.message)}</textarea></label>
      <div class="trap" aria-hidden="true"><label>Website <input name="website" tabindex="-1" autocomplete="off"></label></div>
      <button type="submit" class="button primary">Send enquiry</button>
      ${content.demo ? '<p class="demo-note">Preview mode. This form validates input without saving or sending it.</p>' : ""}
    </form>
  </section>`;
}

export function notFoundView() {
  return '<section class="frame page-intro empty-page">' + eyebrow("Page not found") + '<h1>That page is <em>missing.</em></h1><p>Explore the portfolio to find published work.</p>' + button("Browse work", "/work") + '</section>';
}
