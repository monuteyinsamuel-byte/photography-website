# Photography Business Website

A lightweight website foundation for an individual photographer's business. Each deployed copy is intended to connect to its own Supabase project.

## Technology

- React and TypeScript
- Vite
- Supabase JavaScript client
- CSS, without a UI framework or external image/font dependency

## Local development

Requirements: Node.js 20.19+ or 22.12+ and npm.

```sh
npm install
cp .env.example .env.local
npm run dev
```

Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` in `.env.local` when connecting a Supabase project. The publishable key is intended for browser use only when database access is protected by correctly configured Row Level Security. Never put a Supabase secret or service-role key in a `VITE_` variable.

The public shell can run without Supabase configuration. Code that requests the Supabase client throws a clear configuration error until both variables are set.

## Public website

The public site includes Home, Portfolio, Services, Booking, About, Contact,
Journal, and published Journal Article views. The pages read settings, published
portfolio images, categories, services, approved testimonials, and published
articles from Supabase. The gallery filters by category, lazy-loads images,
supports a keyboard-accessible lightbox, and loads additional pages on demand.
Image objects live in a private `business-images` Storage bucket. The public
site requests short-lived signed URLs only for images referenced by public
settings, published portfolio items, or published articles.

The pages use a custom hash-based router to avoid a routing dependency. All
business content is database-driven; no example prices, client reviews, articles,
or photographs are seeded. CSS artwork appears when no hero/profile photo exists.

## Public data contract

The Phase 3 migration creates these tables and applies the matching Row Level
Security policies:

- `site_settings`: `business_name`, `photographer_name`, branding image paths,
  homepage/about copy, contact details, social links, SEO fields, `currency`.
- `gallery_categories`: `id`, `name`, `slug`, `sort_order`.
- `portfolio_images`: `image_path`, `caption`, `alt_text`, `category_id`,
  `sort_order`, `is_published`.
- `services`: `name`, `description`, `pricing_type`, `price_amount`,
  `is_published`, `sort_order`.
- `testimonials`: `customer_name`, `rating`, `review`,
  `photographer_response`, `status`, `created_at`.
- `journal_articles`: `title`, `slug`, `cover_image_path`, `excerpt`, `content`,
  `category`, `publication_date`, `seo_description`, `is_published`.
- Public form submissions insert booking requests into `bookings` with
  `status: pending`, and contact messages into `enquiries`.

The browser only uses the Supabase publishable key. Never expose a secret or
service-role key in frontend code. Public forms include client-side validation
and a honeypot; database constraints and RLS still apply, but rate limiting and
stronger abuse protection are not implemented.

## Phase 3: Authentication and initial setup

The project now includes administrator login, a protected admin landing page,
one-time setup, RLS policies and the `setup-admin` Edge Function. The dashboard
does not yet manage content; that belongs to a later approved phase.

1. Create a Supabase project for this website. The Supabase CLI can be run
   through `npx`, without adding it to this project's dependencies. Log in and
   link the project:

   ```sh
   npx supabase@latest login
   npx supabase@latest link --project-ref <project-ref>
   ```
2. Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` in `.env.local`
   using the project URL and publishable key. These are the only Supabase
   credentials used by the browser.
3. Apply the schema, RLS policies and private Storage bucket:

   ```sh
   npx supabase@latest db push
   ```

4. Generate a 64-character setup token with `openssl rand -hex 32`. Save it in
   a password manager and keep it available for the one-time setup. Set it as
   an Edge Function secret without putting it in the frontend or source control:

   ```sh
   read -r -s -p "Paste the setup token: " ADMIN_SETUP_TOKEN
   printf '\n'
   npx supabase@latest secrets set ADMIN_SETUP_TOKEN="$ADMIN_SETUP_TOKEN"
   unset ADMIN_SETUP_TOKEN
   ```

   Supabase provides `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` to the Edge
   Function runtime. Do not copy the service-role key into `.env.local`.
5. Deploy the unauthenticated-at-the-gateway setup function. It verifies the
   one-time token itself; the database lock is claimed atomically:

   ```sh
   npx supabase@latest functions deploy setup-admin
   ```

6. Open `https://<your-site>/#/admin/setup` (or the local Vite URL with that
   hash) and enter the token, administrator email and a strong password. The
   setup function creates and confirms this Auth user, then records that user's
   ID as the only administrator. After successful setup, remove the token:

   ```sh
   npx supabase@latest secrets unset ADMIN_SETUP_TOKEN
   ```

7. Sign in at `https://<your-site>/#/admin/login`. Disable public email sign-up
   in Supabase Auth settings; users created outside the setup function are not
   administrators and are denied by RLS regardless.

The setup token is a bearer credential: anyone who obtains it before the first
claim can attempt to become the initial administrator. Generate it privately,
share it only with the photographer, and remove it immediately after setup.
The initial account is confirmed by the server-side setup function without
email ownership verification, so verify the email address carefully before
submitting. RLS protects booking and enquiry records from public reads; public
content reads are restricted to published rows. Storage reads are authorized
only for public branding and published image references, and object writes are
restricted to the administrator. Referenced objects cannot be deleted through
the Storage policy. The setup endpoint has no application-level IP rate limit;
its protection relies on a high-entropy setup token and the database one-time
lock. Add operational monitoring and stronger abuse controls before a high-risk
production launch.

## Current scope and setup still required

No Supabase project is configured in this workspace. Database-backed pages,
login and setup require the project migration, Edge Function secret and
deployment described above. Booking availability and conflict prevention,
content management, notifications, and abuse protection beyond the current
client-side honeypot remain out of scope. Use `npm run build` and `npm run lint`
for local validation.
