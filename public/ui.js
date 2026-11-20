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

const sectionsEditor = document.querySelector("[data-sections]");
if (sectionsEditor) {
  const template = document.querySelector("[data-section-template]");
  for (const block of sectionsEditor.querySelectorAll(".admin-block")) updateSectionFields(block);

  document.querySelector("[data-add-section]").addEventListener("click", () => {
    if (sectionsEditor.children.length >= 20) return;
    const block = template.content.firstElementChild.cloneNode(true);
    const key = crypto.randomUUID();
    for (const field of block.querySelectorAll("[name]")) {
      field.name = field.name.replace("TEMPLATE", key);
      if (field.name === "section") field.value = key;
    }
    sectionsEditor.append(block);
    updateSectionFields(block);
    block.querySelector("select").focus();
  });
  sectionsEditor.addEventListener("change", event => {
    if (event.target.matches("[data-section-type]")) updateSectionFields(event.target.closest(".admin-block"));
  });
  sectionsEditor.addEventListener("click", event => {
    const button = event.target.closest("[data-reorder]");
    if (!button) return;
    const block = button.closest(".admin-block");
    if (button.dataset.reorder === "up" && block.previousElementSibling) block.previousElementSibling.before(block);
    if (button.dataset.reorder === "down" && block.nextElementSibling) block.nextElementSibling.after(block);
    if (button.dataset.reorder === "remove") {
      const successor = block.nextElementSibling ?? block.previousElementSibling;
      block.remove();
      (successor?.querySelector("select") ?? document.querySelector("[data-add-section]")).focus();
    } else button.focus();
  });
}

function updateSectionFields(block) {
  const type = block.querySelector("[data-section-type]").value;
  block.querySelector("[data-format-hint]").hidden = type !== "text";
  for (const field of block.querySelectorAll("[data-for-section]")) {
    field.hidden = !field.dataset.forSection.split(" ").includes(type);
    field.querySelector("input, textarea, select").disabled = field.hidden;
  }
}
