# Form & Frame

Form & Frame is a multidisciplinary portfolio and single-owner CMS. It includes work galleries for graphic design, video editing, UI/UX, and development, plus individual case studies, an about page, and project enquiries.

## Run the preview

Use Node 22 or later. The project uses standard JavaScript and Web APIs with a Cloudflare Worker entry point for Sites. It has no package dependencies.

```sh
npm start
npm test
npm run build
```

Open `http://127.0.0.1:4173/`. The demo opens immediately with labeled fictional projects. The demo enquiry form validates inputs and reports preview success without saving or sending them. The owner login becomes available with Supabase configuration.

## Configure the live portfolio

1. In Supabase, apply [the migration](supabase/migrations/001_portfolio.sql) through the SQL editor or Supabase CLI. Create the owner user in Authentication and turn off public account creation. Register the same account ID in the single-owner table:

   ```sql
   insert into public.portfolio_owners (user_id)
   values ('REPLACE_WITH_OWNER_AUTH_UUID');
   ```

2. Copy [.env.example](.env.example) to `.env` for local use. On Sites, set the same values in the site's environment settings. Enter the Supabase project HTTPS URL, publishable key, secret key, and owner UUID. Keep the secret key, media API secret, and email API key in environment settings.
3. Add the Cloudinary credentials to enable owner uploads. The media library supports JPEG, PNG, and WebP files up to 4 MB and MP4 or WebM files up to 20 MB. Images and videos are delivered using Cloudinary transformations. Draft pages require owner access. Uploaded Cloudinary media uses unlisted delivery URLs and is suitable for artwork cleared for eventual publication.
4. Add your Resend API key, verified sender address, and enquiry inbox. Enquiries are stored before notification is attempted. The dashboard displays pending, sent, failed, and unconfigured notification states. On Sites the rate limiter uses the edge-provided client address and stores a keyed hash. The local server uses the socket address.
5. Open `/admin`. Set the brand, headline, bio, links, and service content under Settings. Upload media, create a draft, add case-study blocks, and open Preview. Publish to make the same content visible on its public route. Editing a published project updates its draft until you publish again. Unpublishing and archiving remove the live version right away.
6. Confirm the production URL and canonical origin. Verify the owner workflow, send a test enquiry, confirm receipt, and review mobile and accessible use with the real content. Update the site's audience explicitly when ready to share it publicly.

The Sites build command creates `dist/server/index.js` and the matching hosting manifest. Deployment uses the Sites source repository and its private deployment workflow. The public route reads fresh content through the published-only database function, so a project publish takes effect without a deployment. The database dashboard stays protected by server checks and row-level policies.

## Maintain the content

- Keep originals, project notes, and editable files in your private Google Drive archive. Upload cleared production exports to the media library. Supabase stores metadata, publication state, and enquiries.
- Projects use stable slugs. Delete is available after archiving and requires the project slug as confirmation. The media library retains assets so shared references survive project deletion. Check both draft and published references before removing an asset directly from Cloudinary.
- Back up the Supabase database and Cloudinary exports according to your retention needs. Remove expired rate limit rows periodically with `delete from public.portfolio_rate_limits where window_start < now() - interval '2 days';` in SQL Editor or a scheduled database job. Decide how long to keep enquiries before launch.
- Image, quote, text, video, image grid, and approved embeds can be arranged into case studies. Supply a CORS-enabled HTTPS WebVTT file for captions when the project video has dialogue or meaningful audio.

## Demo media

The built-in ImageGen tool generated the source imagery for `public/media`. Each image has a full-sized WebP and a `-small.webp` variant. The silent six-second `still-motion.webm` uses three crops of the concept still.

| Asset | Image direction |
| --- | --- |
| `studio.webp` | Photoreal editorial studio still life with ribbed brushed aluminum bent into an angular spiral, warm concrete, muted olive green paper, and grazing light. |
| `afterhours.webp` | Overhead photograph of a fictional AFTER HOURS arts poster with oversized Swiss-style typography, vermilion ink, black moiré lines, and a cropped companion print. |
| `still-motion.webp` | Cinematic image of a lone figure on a concrete breakwater, with steel-blue waves, mist, a cool grade, and 35mm grain. |
| `fieldwork.webp` | Two phones staged diagonally on a sage plinth, showing a hiking concept with topographic maps and forested terrain. |
| `index.webp` | A dark visual archive dashboard on a laptop and secondary display, photographed against a dusty violet studio backdrop. |

## Verification

`npm test` covers public routes, validation, media ranges, owner access, publishing, and enquiry storage and notification behavior using an isolated HTTP service double. Live Supabase, Cloudinary, and Resend checks require owner credentials and configured accounts.
