const studio = {
  name: "jayantcreativeportfolio",
  headline: "Hi, I’m",
  headlineAccent: "Jayant.",
  intro: "I create across graphic design, video editing, UI/UX design, and full stack development.",
  bio: "I’m Jayant, a multidisciplinary creative exploring the space between design and technology. My work brings together visual identities, moving images, digital interfaces, and web applications. This portfolio is where I share my projects and the thinking behind them.",
  email: "jayantsharmacreates@gmail.com",
  resume: "",
  socials: [],
};

const disciplines = [
  { slug: "graphic-design", title: "Graphic design", label: "Graphics", icon: "✳", color: "coral", image: "design-2", tagline: "Identity, type, and image.", description: "Visual identities and graphic systems for print and digital, from the first layout through to production-ready artwork.", skills: ["Art direction", "Visual identity", "Poster design", "Editorial layout"], tools: ["Illustrator", "Photoshop", "InDesign"] },
  { slug: "video-editing", title: "Video editing", label: "Video", icon: "◈", color: "blue", image: "video-15", tagline: "Rhythm, story, and motion.", description: "Short-form edits, promos, and moving-image studies shaped through pacing, sound, and color.", skills: ["Narrative editing", "Color grading", "Sound editing", "Motion graphics"], tools: ["DaVinci Resolve", "Premiere Pro", "After Effects"] },
  { slug: "ui-ux", title: "UI/UX design", label: "UI/UX", icon: "◫", color: "sage", image: "food-app", tagline: "Interfaces with intent.", description: "Interfaces that make complex tasks easier to understand, with room to explore, prototype, and refine the details.", skills: ["Interaction design", "Prototyping", "Design systems", "Usability"], tools: ["Figma", "FigJam"] },
  { slug: "development", title: "Full stack development", label: "Development", icon: "⌘", color: "violet", image: "food-app", tagline: "Digital products, built end to end.", description: "Web applications, content systems, and the services that keep them useful after launch.", skills: ["Frontend development", "API design", "Data modeling", "Accessibility"], tools: ["TypeScript", "React", "PostgreSQL"] },
];

function sampleImage(name, alt, caption = "") {
  return { type: "image", src: "/media/" + name + ".webp", small: "/media/" + name + "-small.webp", alt, caption };
}

const projects = [
  {
    "slug": "back-notebook",
    "service": "graphic-design",
    "title": "back notebook",
    "category": "Graphic artwork",
    "summary": "back notebook — graphic design by Jayant.",
    "cover": {
      "type": "image",
      "src": "/media/design-0.webp",
      "alt": "back notebook",
      "small": "/media/design-0-small.webp"
    },
    "tools": [],
    "featured": false,
    "sort": 0,
    "sections": [],
    "links": [
      {
        "label": "View original",
        "url": "https://drive.google.com/file/d/1TKT-FBcjP0Ot5VNUFbXFa-FMBitKr3k_/view"
      }
    ]
  },
  {
    "slug": "council-batch",
    "service": "graphic-design",
    "title": "Council Batch",
    "category": "Graphic artwork",
    "summary": "Council Batch — graphic design by Jayant.",
    "cover": {
      "type": "image",
      "src": "/media/design-1.webp",
      "alt": "Council Batch",
      "small": "/media/design-1-small.webp"
    },
    "tools": [],
    "featured": false,
    "sort": 1,
    "sections": [],
    "links": [
      {
        "label": "View original",
        "url": "https://drive.google.com/file/d/1ZqRyx5MA0m1jdKVYN__vVGGNYWXf68ck/view"
      }
    ]
  },
  {
    "slug": "dilli-meri-jaan",
    "service": "graphic-design",
    "title": "Dilli meri jaan",
    "category": "Graphic artwork",
    "summary": "Dilli meri jaan — graphic design by Jayant.",
    "cover": {
      "type": "image",
      "src": "/media/design-2.webp",
      "alt": "Dilli meri jaan",
      "small": "/media/design-2-small.webp"
    },
    "tools": [],
    "featured": true,
    "sort": 2,
    "sections": [],
    "links": [
      {
        "label": "View original",
        "url": "https://drive.google.com/file/d/1ikmdiAudAM6818GQOGXUQPe1TqKK8nk1/view"
      }
    ]
  },
  {
    "slug": "directors-batches",
    "service": "graphic-design",
    "title": "Directors Batches",
    "category": "Graphic artwork",
    "summary": "Directors Batches — graphic design by Jayant.",
    "cover": {
      "type": "image",
      "src": "/media/design-3.webp",
      "alt": "Directors Batches",
      "small": "/media/design-3-small.webp"
    },
    "tools": [],
    "featured": false,
    "sort": 3,
    "sections": [],
    "links": [
      {
        "label": "View original",
        "url": "https://drive.google.com/file/d/1xu5z5dgql5imtzoyk0SctKMxGVDhcBnv/view"
      }
    ]
  },
  {
    "slug": "gift-card",
    "service": "graphic-design",
    "title": "gift card",
    "category": "Graphic artwork",
    "summary": "gift card — graphic design by Jayant.",
    "cover": {
      "type": "image",
      "src": "/media/design-4.webp",
      "alt": "gift card",
      "small": "/media/design-4-small.webp"
    },
    "tools": [],
    "featured": false,
    "sort": 4,
    "sections": [],
    "links": [
      {
        "label": "View original",
        "url": "https://drive.google.com/file/d/1Hvyl_uWsCdyHn4mTe7npfQjgOswczBWo/view"
      }
    ]
  },
  {
    "slug": "internal-page-1-notebook",
    "service": "graphic-design",
    "title": "internal page 1 notebook",
    "category": "Graphic artwork",
    "summary": "internal page 1 notebook — graphic design by Jayant.",
    "cover": {
      "type": "image",
      "src": "/media/design-5.webp",
      "alt": "internal page 1 notebook",
      "small": "/media/design-5-small.webp"
    },
    "tools": [],
    "featured": false,
    "sort": 5,
    "sections": [],
    "links": [
      {
        "label": "View original",
        "url": "https://drive.google.com/file/d/1g73JcUcetlFKa9FjCM7HauTCXkDTvsBF/view"
      }
    ]
  },
  {
    "slug": "internal-page-2-nb",
    "service": "graphic-design",
    "title": "internal page 2 nb",
    "category": "Graphic artwork",
    "summary": "internal page 2 nb — graphic design by Jayant.",
    "cover": {
      "type": "image",
      "src": "/media/design-6.webp",
      "alt": "internal page 2 nb",
      "small": "/media/design-6-small.webp"
    },
    "tools": [],
    "featured": false,
    "sort": 6,
    "sections": [],
    "links": [
      {
        "label": "View original",
        "url": "https://drive.google.com/file/d/1GN-eJv_6_t3WvP6o33lxenhVC22TJA_C/view"
      }
    ]
  },
  {
    "slug": "ngo-grid",
    "service": "graphic-design",
    "title": "NGO GRID",
    "category": "Graphic artwork",
    "summary": "NGO GRID — graphic design by Jayant.",
    "cover": {
      "type": "image",
      "src": "/media/design-7.webp",
      "alt": "NGO GRID",
      "small": "/media/design-7-small.webp"
    },
    "tools": [],
    "featured": false,
    "sort": 7,
    "sections": [],
    "links": [
      {
        "label": "View original",
        "url": "https://drive.google.com/file/d/1q664IyXp16on7l63t_M59URhJc3lRmml/view"
      }
    ]
  },
  {
    "slug": "notebook-cover",
    "service": "graphic-design",
    "title": "notebook cover",
    "category": "Graphic artwork",
    "summary": "notebook cover — graphic design by Jayant.",
    "cover": {
      "type": "image",
      "src": "/media/design-8.webp",
      "alt": "notebook cover",
      "small": "/media/design-8-small.webp"
    },
    "tools": [],
    "featured": true,
    "sort": 8,
    "sections": [],
    "links": [
      {
        "label": "View original",
        "url": "https://drive.google.com/file/d/1ZdZz6mPAwK5-DPTKIPRbFGw9AMMVAdaL/view"
      }
    ]
  },
  {
    "slug": "party",
    "service": "graphic-design",
    "title": "PARTY",
    "category": "Graphic artwork",
    "summary": "PARTY — graphic design by Jayant.",
    "cover": {
      "type": "image",
      "src": "/media/design-9.webp",
      "alt": "PARTY",
      "small": "/media/design-9-small.webp"
    },
    "tools": [],
    "featured": false,
    "sort": 9,
    "sections": [],
    "links": [
      {
        "label": "View original",
        "url": "https://drive.google.com/file/d/1IRdzwEzfsb5wk7FHV7hbOOesManYcLgZ/view"
      }
    ]
  },
  {
    "slug": "passport-cover-1",
    "service": "graphic-design",
    "title": "PASSPORT COVER (1)",
    "category": "Graphic artwork",
    "summary": "PASSPORT COVER (1) — graphic design by Jayant.",
    "cover": {
      "type": "image",
      "src": "/media/design-10.webp",
      "alt": "PASSPORT COVER (1)",
      "small": "/media/design-10-small.webp"
    },
    "tools": [],
    "featured": false,
    "sort": 10,
    "sections": [],
    "links": [
      {
        "label": "View original",
        "url": "https://drive.google.com/file/d/14kY7JHwLKGcOqJJjBf3Rb_gL57nTuDvs/view"
      }
    ]
  },
  {
    "slug": "passport-cover",
    "service": "graphic-design",
    "title": "PASSPORT COVER",
    "category": "Graphic artwork",
    "summary": "PASSPORT COVER — graphic design by Jayant.",
    "cover": {
      "type": "image",
      "src": "/media/design-11.webp",
      "alt": "PASSPORT COVER",
      "small": "/media/design-11-small.webp"
    },
    "tools": [],
    "featured": false,
    "sort": 11,
    "sections": [],
    "links": [
      {
        "label": "View original",
        "url": "https://drive.google.com/file/d/11Cx408XyTJ7V8-RzOWXKvRGfPued4nQ7/view"
      }
    ]
  },
  {
    "slug": "teeshirt",
    "service": "graphic-design",
    "title": "Teeshirt",
    "category": "Graphic artwork",
    "summary": "Teeshirt — graphic design by Jayant.",
    "cover": {
      "type": "image",
      "src": "/media/design-12.webp",
      "alt": "Teeshirt",
      "small": "/media/design-12-small.webp"
    },
    "tools": [],
    "featured": false,
    "sort": 12,
    "sections": [],
    "links": [
      {
        "label": "View original",
        "url": "https://drive.google.com/file/d/15BZt44ZkUn47XUBYOiRnW1MMtFBUEKcG/view"
      }
    ]
  },
  {
    "slug": "tour",
    "service": "graphic-design",
    "title": "TOUR",
    "category": "Graphic artwork",
    "summary": "TOUR — graphic design by Jayant.",
    "cover": {
      "type": "image",
      "src": "/media/design-13.webp",
      "alt": "TOUR",
      "small": "/media/design-13-small.webp"
    },
    "tools": [],
    "featured": false,
    "sort": 13,
    "sections": [],
    "links": [
      {
        "label": "View original",
        "url": "https://drive.google.com/file/d/1n8yUhhyn4PCD2eWyDjaHtTFi5wQsA5LV/view"
      }
    ]
  },
  {
    "slug": "yugarambh",
    "service": "graphic-design",
    "title": "Yugarambh",
    "category": "Graphic artwork",
    "summary": "Yugarambh — graphic design by Jayant.",
    "cover": {
      "type": "image",
      "src": "/media/design-14.webp",
      "alt": "Yugarambh",
      "small": "/media/design-14-small.webp"
    },
    "tools": [],
    "featured": false,
    "sort": 14,
    "sections": [],
    "links": [
      {
        "label": "View original",
        "url": "https://drive.google.com/file/d/1UFZQ9tTSZ20OL1vrPaX37EwDd7flC01O/view"
      }
    ]
  },
  {
    "slug": "chhath-puja-reel",
    "service": "video-editing",
    "title": "chhath puja reel",
    "category": "Reel",
    "summary": "chhath puja reel — video edit by Jayant.",
    "cover": {
      "type": "image",
      "src": "/media/video-15.webp",
      "alt": "chhath puja reel"
    },
    "tools": [],
    "featured": true,
    "sort": 15,
    "sections": [],
    "links": [
      {
        "label": "View original",
        "url": "https://drive.google.com/file/d/11kQnicYRSoSwiToHAtZxcgoKwREP0gL6/view"
      }
    ],
    "video": {
      "type": "video",
      "src": "/clips/15.mp4",
      "alt": "chhath puja reel"
    }
  },
  {
    "slug": "chhath-reel-2",
    "service": "video-editing",
    "title": "chhath reel 2",
    "category": "Reel",
    "summary": "chhath reel 2 — video edit by Jayant.",
    "cover": {
      "type": "image",
      "src": "/media/video-16.webp",
      "alt": "chhath reel 2"
    },
    "tools": [],
    "featured": false,
    "sort": 16,
    "sections": [],
    "links": [
      {
        "label": "View original",
        "url": "https://drive.google.com/file/d/1LUVrxwWLbbTFxM78W37FYZl25vKrj1Rs/view"
      }
    ],
    "video": {
      "type": "video",
      "src": "/clips/16.mp4",
      "alt": "chhath reel 2"
    }
  },
  {
    "slug": "cinematic-reel-1",
    "service": "video-editing",
    "title": "cinematic reel 1",
    "category": "Reel",
    "summary": "cinematic reel 1 — video edit by Jayant.",
    "cover": {
      "type": "image",
      "src": "/media/video-17.webp",
      "alt": "cinematic reel 1"
    },
    "tools": [],
    "featured": true,
    "sort": 17,
    "sections": [],
    "links": [
      {
        "label": "View original",
        "url": "https://drive.google.com/file/d/17lFf3nhtM--mGY74b6pQvPA2Kxg3hDcw/view"
      }
    ],
    "video": {
      "type": "video",
      "src": "/clips/17.mp4",
      "alt": "cinematic reel 1"
    }
  },
  {
    "slug": "cooked-1",
    "service": "video-editing",
    "title": "cooked 1",
    "category": "Reel",
    "summary": "cooked 1 — video edit by Jayant.",
    "cover": {
      "type": "image",
      "src": "/media/video-18.webp",
      "alt": "cooked 1"
    },
    "tools": [],
    "featured": false,
    "sort": 18,
    "sections": [],
    "links": [
      {
        "label": "View original",
        "url": "https://drive.google.com/file/d/1CBOcrdp9ussQOaF_UPJCxfYs8p4B847h/view"
      }
    ],
    "video": {
      "type": "video",
      "src": "/clips/18.mp4",
      "alt": "cooked 1"
    }
  },
  {
    "slug": "cooked-2",
    "service": "video-editing",
    "title": "cooked 2",
    "category": "Reel",
    "summary": "cooked 2 — video edit by Jayant.",
    "cover": {
      "type": "image",
      "src": "/media/video-19.webp",
      "alt": "cooked 2"
    },
    "tools": [],
    "featured": false,
    "sort": 19,
    "sections": [],
    "links": [
      {
        "label": "View original",
        "url": "https://drive.google.com/file/d/1oTmgkgVFgXnlqQ70e_e10COCcvJSidYD/view"
      }
    ],
    "video": {
      "type": "video",
      "src": "/clips/19.mp4",
      "alt": "cooked 2"
    }
  },
  {
    "slug": "cooked-3",
    "service": "video-editing",
    "title": "cooked 3",
    "category": "Reel",
    "summary": "cooked 3 — video edit by Jayant.",
    "cover": {
      "type": "image",
      "src": "/media/video-20.webp",
      "alt": "cooked 3"
    },
    "tools": [],
    "featured": false,
    "sort": 20,
    "sections": [],
    "links": [
      {
        "label": "View original",
        "url": "https://drive.google.com/file/d/1KVlaPbNk3JyzBLTylJnW_nHIkVzBnKrn/view"
      }
    ],
    "video": {
      "type": "video",
      "src": "/clips/20.mp4",
      "alt": "cooked 3"
    }
  },
  {
    "slug": "random-reel-1",
    "service": "video-editing",
    "title": "random reel 1",
    "category": "Reel",
    "summary": "random reel 1 — video edit by Jayant.",
    "cover": {
      "type": "image",
      "src": "/media/video-21.webp",
      "alt": "random reel 1"
    },
    "tools": [],
    "featured": false,
    "sort": 21,
    "sections": [],
    "links": [
      {
        "label": "View original",
        "url": "https://drive.google.com/file/d/1-t0op8qcSAY0MgiHGbBsv52zvv3QvOTz/view"
      }
    ],
    "video": {
      "type": "video",
      "src": "/clips/21.mp4",
      "alt": "random reel 1"
    }
  },
  {
    "slug": "viral-1",
    "service": "video-editing",
    "title": "viral 1",
    "category": "Reel",
    "summary": "viral 1 — video edit by Jayant.",
    "cover": {
      "type": "image",
      "src": "/media/video-22.webp",
      "alt": "viral 1"
    },
    "tools": [],
    "featured": false,
    "sort": 22,
    "sections": [],
    "links": [
      {
        "label": "View original",
        "url": "https://drive.google.com/file/d/1tj-STKn4o8m68XsjE_OkEdVPG7gRCOdG/view"
      }
    ],
    "video": {
      "type": "video",
      "src": "/clips/22.mp4",
      "alt": "viral 1"
    }
  },
  {
    "slug": "viral-2",
    "service": "video-editing",
    "title": "viral 2",
    "category": "Reel",
    "summary": "viral 2 — video edit by Jayant.",
    "cover": {
      "type": "image",
      "src": "/media/video-23.webp",
      "alt": "viral 2"
    },
    "tools": [],
    "featured": false,
    "sort": 23,
    "sections": [],
    "links": [
      {
        "label": "View original",
        "url": "https://drive.google.com/file/d/1h2egfFfnWvIbbuQfuJn7UAw2fMb26SYO/view"
      }
    ],
    "video": {
      "type": "video",
      "src": "/clips/23.mp4",
      "alt": "viral 2"
    }
  }
];

projects.push(...[{"service": "development", "slug": "food-delivery-app", "title": "Food Delivery App", "summary": "A food ordering application with a React storefront, an admin dashboard, and an Express API backed by MongoDB.", "category": "Web application", "cover": {"type": "image", "src": "/media/food-app.webp", "small": "/media/food-app-small.webp", "alt": "Food Delivery App storefront"}, "featured": true, "sort": 30, "tools": ["React", "Vite", "Express", "MongoDB", "Stripe"], "links": [{"label": "View GitHub repository", "url": "https://github.com/Jayantks/Food-Delivery-App"}], "sections": [{"type": "text", "heading": "Project overview", "text": "A food ordering application with a React storefront, an admin dashboard, and an Express API backed by MongoDB."}, {"type": "image", "heading": "Cart interface", "media": {"type": "image", "src": "/media/food-cart.webp", "small": "/media/food-cart-small.webp", "alt": "Food Delivery App cart interface"}}]}, {"service": "ui-ux", "slug": "food-delivery-ui", "title": "Food Delivery App \u00b7 UI", "summary": "The storefront and cart interface from my Food Delivery App, with category navigation, food cards, and an order summary.", "category": "Web interface", "cover": {"type": "image", "src": "/media/food-app.webp", "small": "/media/food-app-small.webp", "alt": "Food Delivery App storefront"}, "featured": true, "sort": 30, "tools": ["React", "Vite"], "links": [{"label": "View GitHub repository", "url": "https://github.com/Jayantks/Food-Delivery-App"}], "sections": [{"type": "text", "heading": "Project overview", "text": "The storefront and cart interface from my Food Delivery App, with category navigation, food cards, and an order summary."}, {"type": "image", "heading": "Cart interface", "media": {"type": "image", "src": "/media/food-cart.webp", "small": "/media/food-cart-small.webp", "alt": "Food Delivery App cart interface"}}]}]);

projects.push(...[{"slug": "cultural-ceremony-proposal", "title": "Cultural Ceremony Proposal", "service": "graphic-design", "category": "Proposal design", "summary": "Sponsorship proposal cover for the Dilli Meri Jaan cultural ceremony.", "cover": {"type": "image", "src": "/media/cultural-ceremony-proposal.webp", "small": "/media/cultural-ceremony-proposal-small.webp", "alt": "Cultural Ceremony Proposal"}, "featured": false, "sort": 24, "tools": [], "sections": []}, {"slug": "district-3040", "title": "District 3040 \u00b7 Dilli Meri Jaan", "service": "graphic-design", "category": "Event poster", "summary": "Event artwork welcoming District 3040 to Dilli Meri Jaan.", "cover": {"type": "image", "src": "/media/district-3040.webp", "small": "/media/district-3040-small.webp", "alt": "District 3040 \u00b7 Dilli Meri Jaan"}, "featured": false, "sort": 25, "tools": [], "sections": []}, {"slug": "rotaract-business-card", "title": "Rotaract Business Card", "service": "graphic-design", "category": "Business card", "summary": "Business card design for a District Rotaract representative.", "cover": {"type": "image", "src": "/media/rotaract-business-card.webp", "small": "/media/rotaract-business-card-small.webp", "alt": "Rotaract Business Card"}, "featured": false, "sort": 26, "tools": [], "sections": []}]);

export const portfolioContent = { profile: studio, services: disciplines, projects };
