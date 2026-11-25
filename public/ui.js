const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");

for (const gallery of document.querySelectorAll("[data-gallery]")) {
  const filters = gallery.querySelector("[data-filters]");
  if (!filters) continue;
  const key = filters.dataset.filters;
  const buttons = [...filters.querySelectorAll("button")];
  const cards = [...gallery.querySelectorAll("[data-project]")];
  const results = gallery.querySelector("[data-results]");
  const empty = gallery.querySelector("[data-empty]");

  function applyFilter(value) {
    let count = 0;
    for (const card of cards) {
      card.hidden = Boolean(value && card.dataset[key] !== value);
      if (!card.hidden) count += 1;
    }
    for (const button of buttons) button.setAttribute("aria-pressed", String(button.dataset.filter === value));
    empty.hidden = count > 0;
    results.textContent = count + (count === 1 ? " project" : " projects");
  }

  const saved = history.state?.portfolioFilter;
  if (buttons.some(item => item.dataset.filter === saved)) applyFilter(saved);
  filters.addEventListener("click", event => {
    const button = event.target.closest("[data-filter]");
    if (!button) return;
    const value = button.dataset.filter;
    applyFilter(value);
    history.replaceState({ ...history.state, portfolioFilter: value }, "");
  });
}

for (const video of document.querySelectorAll("[data-preview]")) {
  const link = video.closest("a");
  let hovering = false;
  function stopPreview() {
    hovering = false;
    video.classList.remove("is-playing");
    video.pause();
  }
  link.addEventListener("pointerenter", async event => {
    if (event.pointerType !== "mouse" || reducedMotion.matches || navigator.connection?.saveData) return;
    hovering = true;
    video.src ||= video.dataset.preview;
    try {
      await video.play();
      if (hovering) video.classList.add("is-playing");
      else video.pause();
    } catch {}
  });
  link.addEventListener("pointerleave", stopPreview);
  reducedMotion.addEventListener("change", stopPreview);
  document.addEventListener("visibilitychange", () => { if (document.hidden) stopPreview(); });
}

const motionGallery = document.querySelector(".moving-gallery");
if (motionGallery) {
  const motionButton = motionGallery.querySelector("[data-motion]");
  motionGallery.classList.add("is-moving");
  motionButton.hidden = false;
  motionButton.addEventListener("click", () => {
    const paused = motionGallery.classList.toggle("is-paused");
    motionButton.setAttribute("aria-pressed", String(paused));
    motionButton.textContent = paused ? "Resume gallery" : "Pause gallery";
    if (!paused) for (const rail of motionGallery.querySelectorAll(".rail-window")) {
      rail.classList.remove("is-browsing");
      rail.scrollLeft = 0;
    }
  });

  for (const rail of motionGallery.querySelectorAll(".rail-window")) {
    let start, dragged = false;
    rail.addEventListener("dragstart", event => event.preventDefault());
    rail.addEventListener("pointerdown", event => {
      if (event.pointerType !== "mouse" || event.button !== 0) return;
      dragged = false;
      start = { x: event.clientX, scroll: rail.scrollLeft, id: event.pointerId };
    });
    rail.addEventListener("pointermove", event => {
      if (!start || start.id !== event.pointerId || !(event.buttons & 1)) return;
      const delta = event.clientX - start.x;
      if (!dragged && Math.abs(delta) < 8) return;
      if (!dragged) {
        dragged = true;
        const track = rail.querySelector(".rail-track");
        const transform = getComputedStyle(track).transform;
        start.scroll += transform === "none" ? 0 : -new DOMMatrixReadOnly(transform).m41;
        rail.classList.add("is-browsing");
        rail.setPointerCapture(start.id);
      }
      rail.scrollLeft = start.scroll - delta;
    });
    rail.addEventListener("pointerup", () => { start = undefined; });
    rail.addEventListener("pointercancel", () => { start = undefined; dragged = false; });
    rail.addEventListener("click", event => {
      if (dragged && event.detail) {
        event.preventDefault();
        dragged = false;
      }
    }, true);
  }
}

const lightbox = document.querySelector(".lightbox");
if (lightbox) {
  const next = lightbox.querySelector("[data-lightbox-next]");
  const prev = lightbox.querySelector("[data-lightbox-prev]");
  const close = lightbox.querySelector("[data-lightbox-close]");
  const activeImage = lightbox.querySelector("img");
  const caption = lightbox.querySelector("figcaption");
  let openedBy, group = [], index = 0;

  function showImage() {
    const image = group[index].dataset;
    activeImage.src = image.image;
    activeImage.alt = image.alt;
    caption.textContent = image.caption || image.alt;
  }

  function move(step) {
    index = (index + step + group.length) % group.length;
    showImage();
  }

  for (const trigger of document.querySelectorAll("button[data-image]")) {
    trigger.addEventListener("click", () => {
      openedBy = trigger;
      group = [...document.querySelectorAll("button[data-image]")].filter(item => item.dataset.group === trigger.dataset.group);
      index = group.indexOf(trigger);
      next.hidden = prev.hidden = group.length < 2;
      showImage();
      lightbox.showModal();
      close.focus();
    });
  }
  next.addEventListener("click", () => move(1));
  prev.addEventListener("click", () => move(-1));
  close.addEventListener("click", () => lightbox.close());
  lightbox.addEventListener("click", event => { if (event.target === lightbox) lightbox.close(); });
  lightbox.addEventListener("close", () => openedBy?.focus());
  lightbox.addEventListener("keydown", event => {
    if (group.length < 2) return;
    if (event.key === "ArrowRight") { event.preventDefault(); move(1); }
    if (event.key === "ArrowLeft") { event.preventDefault(); move(-1); }
  });
}

// A viewport-sized fog field carries the pointer's direction into a soft wake.
const mistCanvas = document.querySelector(".page-mist");
if (mistCanvas) {
  const context = mistCanvas.getContext("2d");
  const pointer = { x: -1000, y: -1000, vx: 0, vy: 0, time: 0 };
  let width = 0, height = 0, particles = [], frame = 0, previous = 0;
  const sprite = document.createElement("canvas");
  sprite.width = sprite.height = 128;
  const brush = sprite.getContext("2d");
  const gradient = brush.createRadialGradient(64, 64, 0, 64, 64, 64);
  gradient.addColorStop(0, "rgba(180,205,160,.20)");
  gradient.addColorStop(.35, "rgba(147,183,126,.11)");
  gradient.addColorStop(1, "rgba(142,163,131,0)");
  brush.fillStyle = gradient;
  brush.fillRect(0, 0, 128, 128);
  function resizeMist() {
    width = innerWidth;
    height = innerHeight;
    const ratio = Math.min(devicePixelRatio || 1, 1.5);
    mistCanvas.width = Math.round(width * ratio);
    mistCanvas.height = Math.round(height * ratio);
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    particles = Array.from({ length: width < 700 ? 40 : 85 }, () => ({
      x: Math.random() * width, y: Math.random() * height,
      vx: 0, vy: 0, radius: 65 + Math.random() * 105,
      phase: Math.random() * Math.PI * 2,
    }));
  }
  function drawMist(time) {
    frame = 0;
    if (reducedMotion.matches || document.hidden) return;
    const step = Math.min((time - previous) / 16.67 || 1, 2);
    previous = time;
    context.clearRect(0, 0, width, height);
    const active = time - pointer.time < 350;
    pointer.vx *= Math.pow(.93, step);
    pointer.vy *= Math.pow(.93, step);
    for (const particle of particles) {
      const dx = particle.x - pointer.x, dy = particle.y - pointer.y;
      const distance = Math.hypot(dx, dy);
      if (active && distance < 220 && distance > 1) {
        const influence = Math.pow(1 - distance / 220, 2) * step;
        particle.vx += (pointer.vx * .07 + dx / distance * .18 - dy / distance * .06) * influence;
        particle.vy += (pointer.vy * .07 + dy / distance * .18 + dx / distance * .06) * influence;
      }
      particle.vx *= Math.pow(.97, step);
      particle.vy *= Math.pow(.97, step);
      particle.x += (particle.vx + .08 + Math.sin(time * .00015 + particle.phase) * .12) * step;
      particle.y += (particle.vy + Math.cos(time * .00012 + particle.phase) * .12) * step;
      const r = particle.radius;
      if (particle.x > width + r) particle.x = -r;
      if (particle.x < -r) particle.x = width + r;
      if (particle.y > height + r) particle.y = -r;
      if (particle.y < -r) particle.y = height + r;
      context.drawImage(sprite, particle.x - r, particle.y - r, r * 2, r * 2);
    }
    frame = requestAnimationFrame(drawMist);
  }
  function syncMist() {
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
    previous = 0;
    if (!reducedMotion.matches && !document.hidden) frame = requestAnimationFrame(drawMist);
    else context.clearRect(0, 0, width, height);
  }
  window.addEventListener("pointermove", event => {
    const now = performance.now();
    const elapsed = Math.max(8, now - pointer.time);
    const fresh = now - pointer.time < 150;
    pointer.vx = fresh ? Math.max(-25, Math.min(25, (event.clientX - pointer.x) / elapsed * 16.67)) : 0;
    pointer.vy = fresh ? Math.max(-25, Math.min(25, (event.clientY - pointer.y) / elapsed * 16.67)) : 0;
    pointer.x = event.clientX;
    pointer.y = event.clientY;
    pointer.time = now;
  }, { passive: true });
  document.addEventListener("pointerleave", () => { pointer.time = -1000; });
  window.addEventListener("resize", resizeMist, { passive: true });
  document.addEventListener("visibilitychange", syncMist);
  reducedMotion.addEventListener("change", syncMist);
  resizeMist();
  syncMist();
}
