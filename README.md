# Higgsfield Prompt Hub (Production MVP)

Next.js App Router + Tailwind + Prisma + PostgreSQL.

## Stack

- Next.js App Router
- Tailwind CSS
- Prisma ORM
- PostgreSQL (self-hosted)
- Sharp (image processing)
- MDX blog content

## Environment

Create `.env` from `.env.example`:

```bash
cp .env.example .env
```

Required variables:

- `DATABASE_URL`
- `ADMIN_TOKEN`

Optional:

- `UPLOAD_ROOT` (default: `/app/uploads` in production containers, or `<project>/uploads` locally)
- `AUTO_APPROVE_SUBMISSIONS` (`true` only for local testing; default `false`)
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`
- `CLOUDINARY_BASE_FOLDER` (default: `laera-ia`)

## Database setup

```bash
npm install
npm run prisma:generate
npm run prisma:migrate -- --name init
npm run prisma:seed
```

If your database already has schema and migrate baseline conflicts:

```bash
npx prisma db push
npm run prisma:seed
```

## Run locally

```bash
npm run dev
```

## Public submission flow

### `POST /api/submissions` (public)

- Content type: `multipart/form-data`
- Fields:
  - `title`
  - `description` (optional)
  - `promptText`
  - `locale` (`es|en`)
  - `type` (`video|image|seo`)
  - `youtubeUrl` (required if `type=video`)
  - `resultUrl` (optional)
  - `category`, `style`, `mood`, `duration`, `tool`, `tags`
  - `image` (file)

Image rules:

- Allowed: JPG/JPEG, PNG, WEBP
- Max size: 10MB
- Min width: 300px
- Processed with Sharp + generated variants (WebP quality 78):
  - master: max width 1600
  - card: 800x450 (16:9 cover)
  - detail: 1080x1920 (9:16 cover)
- Stored at:
  - Cloudinary (`<base-folder>/pending/...`) when Cloudinary env vars are set
  - `/app/uploads/pending/...` when Cloudinary is not configured

Security:

- Zod validation for all fields
- YouTube URL format validation
- Rate limit: 10 submissions/hour per IP
- Prisma model APIs only (no dynamic raw SQL)
- If `AUTO_APPROVE_SUBMISSIONS=true`, submissions are published directly (skip moderation) for local testing.

## Moderation flow

### Auth session

- `POST /api/admin/session` with `{ token: ADMIN_TOKEN }`
- Sets HTTP-only cookie `admin_session`

### Admin endpoints

- `GET /api/admin/pending`
- `GET /api/admin/prompts/:id/pending-image`
- `POST /api/admin/prompts/:id/approve`
  - moves images from `pending` to `approved` (Cloudinary rename or local filesystem move)
  - sets `status=approved`
  - updates:
    - `previewImageUrl` (card URL)
    - `previewImageMasterUrl`
    - `previewImageCardUrl`
    - `previewImageDetailUrl`
- `POST /api/admin/prompts/:id/reject`
  - deletes pending image
  - sets `status=rejected`

Moderation UI:

- `/admin/moderation`
- Server-side protected: if no valid admin session cookie, login form is shown.

## Public image serving

- Approved files are served by route:
  - `GET /uploads/approved/:variant/:file`
  - legacy compatibility: `GET /uploads/approved/:file`
- If Cloudinary is enabled, approved images are served from Cloudinary URLs.
- Pending files are not publicly listed.
- Pending previews are only available through admin-protected endpoint:
  - `GET /api/admin/prompts/:id/pending-image`

## Dokploy persistence (important)

Mount a persistent volume to:

- `/app/uploads`

This preserves:

- `/app/uploads/pending`
- `/app/uploads/approved`

across redeploys and restarts.

## Netlify deploy (Cloudinary)

For Netlify, use Cloudinary because Netlify filesystem is ephemeral.

1. Add environment variables in Netlify:
   - `DATABASE_URL`
   - `ADMIN_TOKEN`
   - `NEXT_PUBLIC_SITE_URL` (your Netlify public URL, never `localhost`)
   - `CLOUDINARY_CLOUD_NAME`
   - `CLOUDINARY_API_KEY`
   - `CLOUDINARY_API_SECRET`
   - `CLOUDINARY_BASE_FOLDER` (optional)
2. Build command: `npm run build`
3. Deploy.
4. Verify:
   - `GET /api/health/db`
   - submit a prompt with image
   - approve from `/admin/moderation`

## Migrate old local images to Cloudinary

If old prompts still reference `/uploads/...`, migrate them with this script.

1. Keep old files available in local `uploads/` (or set `UPLOAD_ROOT` to that folder).
2. Ensure env vars are set: `DATABASE_URL`, `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`.
3. Dry run first:

```bash
npm run migrate:cloudinary:dry
```

4. Apply migration for approved images:

```bash
npm run migrate:cloudinary
```

5. Optional: also migrate pending images:

```bash
npm run migrate:cloudinary:all
```

Notes:
- Script updates `previewImageUrl`, `previewImageMasterUrl`, `previewImageCardUrl`, `previewImageDetailUrl` in DB.
- It skips already-remote URLs (`http/https`).
- It never logs secrets.

## Existing API routes

- `GET /api/prompts?locale=es&type=video&tag=seo&search=foo&page=1&pageSize=12`
- `GET /api/prompts/[slug]?locale=es`
- `POST /api/prompts/[id]/vote`
- `GET /api/trending?locale=es&type=video`

## Security notes

- No secrets are logged.
- `ADMIN_TOKEN` is never hardcoded in client code.
- User prompt content is rendered as plain text (no `dangerouslySetInnerHTML` for user submissions).
- Input size constraints prevent oversized payload abuse.

