# Form & Frame

Jayant’s portfolio for graphic design, video editing, UI/UX, and development. The Worker renders the bundled project data and uses the committed artwork in `public/media/`. Project enquiries open in the visitor’s email app.

## Run locally

Use Node.js 22 or later.

```sh
npm start
npm test
npm run build
```

Open http://127.0.0.1:4173/ for the preview. The build creates and smoke-tests `dist/server/index.js`.

## Deploy to Cloudflare Workers

Connect this GitHub repository in Workers & Pages and select the `main` branch. Use the repository root, Worker name `jcreativepf`, build command `npm run build`, and deploy command `npx --yes wrangler deploy`. The checked-in `wrangler.jsonc` uses the built Worker and serves static files from `public/`.

The deployment runs without database or email service credentials. Set the optional `SITE_URL` runtime variable to your preferred HTTPS origin if you use a custom domain.

## Deploy to Vercel

Import this GitHub repository in Vercel and use the repository root with the **Other** framework preset. The checked-in `vercel.json` serves `public/` and routes page requests to the portfolio function. The function renders the same site from the bundled content without a separate frontend build.

## Update the portfolio

Edit project descriptions, gallery entries, and the contact address in [src/content.mjs](src/content.mjs). Save public artwork in `public/media/`, keep project slugs stable so shared links keep working, and redeploy to publish changes. Portfolio reel thumbnails are bundled, and the full-length reels are streamed from their existing Google Drive links.
