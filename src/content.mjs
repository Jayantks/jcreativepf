const studio = {
  name: "Form & Frame",
  headline: "Making the digital feel",
  headlineAccent: "human.",
  intro: "An independent practice in graphic design, video editing, UI/UX, and full stack development.",
  bio: "Form & Frame is a portfolio for work that spans graphic design, moving image, digital interfaces, and the engineering behind them. The collection explores how the same idea changes as it moves through print, film, and software.",
  email: "",
  resume: "",
  socials: [],
};

const disciplines = [
  { slug: "graphic-design", title: "Graphic design", label: "Graphics", icon: "✳", color: "coral", image: "afterhours", tagline: "Identity, type, and image.", description: "Visual identities and graphic systems for print and digital, from the first layout through to production-ready artwork.", skills: ["Art direction", "Visual identity", "Poster design", "Editorial layout"], tools: ["Illustrator", "Photoshop", "InDesign"] },
  { slug: "video-editing", title: "Video editing", label: "Video", icon: "◈", color: "blue", image: "still-motion", tagline: "Rhythm, story, and motion.", description: "Short-form edits, promos, and moving-image studies shaped through pacing, sound, and color.", skills: ["Narrative editing", "Color grading", "Sound editing", "Motion graphics"], tools: ["DaVinci Resolve", "Premiere Pro", "After Effects"] },
  { slug: "ui-ux", title: "UI/UX design", label: "UI/UX", icon: "◫", color: "sage", image: "fieldwork", tagline: "Interfaces with intent.", description: "Interfaces that make complex tasks easier to understand, with room to explore, prototype, and refine the details.", skills: ["Interaction design", "Prototyping", "Design systems", "Usability"], tools: ["Figma", "FigJam"] },
  { slug: "development", title: "Full stack development", label: "Development", icon: "⌘", color: "violet", image: "index", tagline: "Digital products, built end to end.", description: "Web applications, content systems, and the services that keep them useful after launch.", skills: ["Frontend development", "API design", "Data modeling", "Accessibility"], tools: ["TypeScript", "React", "PostgreSQL"] },
];

function sampleImage(name, alt, caption = "") {
  return { type: "image", src: "/media/" + name + ".webp", small: "/media/" + name + "-small.webp", alt, caption };
}

const projects = [
  {
    slug: "afterhours", service: "graphic-design", title: "Afterhours", category: "Visual identity", year: "2026", role: "Art direction and graphic design",
    summary: "A poster system for an imagined late-night electronic arts programme, built around oversized type and an electric vermilion palette.",
    cover: sampleImage("afterhours", "Vermilion After Hours poster with black typography and circular linework"),
    tools: ["Typography", "Print design"], featured: true, sort: 10, demo: true,
    sections: [
      { type: "text", heading: "The brief", text: "Create a visual system for an evening programme that can hold its own in a crowded street and still work as a small square on a screen." },
      { type: "text", heading: "The approach", text: "A tight grid makes room for the title to break across the poster. Fine concentric lines suggest an audio waveform and add movement across the flat block of color." },
      { type: "image", heading: "Poster study", media: sampleImage("afterhours", "Close view of the After Hours print and its black and white companion", "Concept artwork for a fictional programme.") },
    ],
  },
  {
    slug: "still-in-motion", service: "video-editing", title: "Still in Motion", category: "Short film", year: "2026", role: "Editing and color study",
    summary: "An atmospheric moving-image study that uses a coastal frame to explore timing, repetition, and restraint.",
    cover: sampleImage("still-motion", "A figure in a dark coat walks beside waves on a misty breakwater"),
    video: { type: "video", src: "/media/still-motion.webm", alt: "Silent motion study of a coastal breakwater", caption: "Silent demo motion study, made from the concept still." },
    tools: ["Editing", "Color"], featured: true, sort: 20, demo: true,
    sections: [
      { type: "text", heading: "The brief", text: "Build a short, silent sequence around a single location. Explore what small changes in crop, rhythm, and scale do to the feeling of a frame." },
      { type: "text", heading: "The approach", text: "The edits move between wide and close framing. A cool grade and a restrained cut pattern keep attention on the figure and the water." },
    ],
  },
  {
    slug: "fieldwork", service: "ui-ux", title: "Fieldwork", category: "Mobile app", year: "2026", role: "Product and interaction design",
    summary: "A trail-planning app concept that keeps terrain, distance, and the route ahead legible at a glance.",
    cover: sampleImage("fieldwork", "Two phones on a sage surface show a trail map and hiking route"),
    tools: ["Interaction design", "Prototyping"], featured: true, sort: 30, demo: true,
    sections: [
      { type: "text", heading: "The brief", text: "Design a mobile route planner that makes it easy to compare trail options before going outside and check essential information while on the move." },
      { type: "text", heading: "The approach", text: "Give the map most of the screen and group distance, elevation, and trail duration in a consistent summary. Keep the primary route action within comfortable thumb reach." },
      { type: "image", heading: "Interface concept", media: sampleImage("fieldwork", "Mockups of Fieldwork’s route summary and topographic map", "Mobile route and map views.") },
    ],
  },
  {
    slug: "index-studio", service: "development", title: "Index Studio", category: "Web application", year: "2026", role: "Application design and architecture",
    summary: "A digital archive concept for organizing visual references, tagging collections, and finding saved material again.",
    cover: sampleImage("index", "A laptop and secondary display show a dark visual archive interface"),
    tools: ["Data modeling", "Web application design"], featured: true, sort: 40, demo: true,
    sections: [
      { type: "text", heading: "The brief", text: "Explore a small archive for visual research, where users can scan thumbnails and still keep structured metadata close at hand." },
      { type: "text", heading: "The proposed architecture", text: "Separate collections, assets, and tags in the data model. A paginated library route can build stable views for bookmarked filters and keep large collections quick to navigate." },
      { type: "image", heading: "Archive prototype", media: sampleImage("index", "Index Studio archive grid and metadata views", "Concept for the library and its detail panel.") },
    ],
  },
];

const profileDefaults = studio;
const serviceDefaults = disciplines;

export function demoContent() {
  return { profile: studio, services: disciplines, projects, demo: true };
}

export function resolveContent(settings = {}, published = []) {
  return {
    profile: { ...profileDefaults, ...settings.profile },
    services: serviceDefaults.map(service => ({ ...service, ...settings.services?.[service.slug], slug: service.slug }))
      .sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0)),
    projects: published.map(row => ({ ...row.live, slug: row.slug })),
    demo: false,
  };
}

export const serviceSlugs = disciplines.map(service => service.slug);
