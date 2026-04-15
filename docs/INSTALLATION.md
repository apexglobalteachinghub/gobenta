# Everything Marketplace — Installation Guide

Step-by-step setup for the Philippines marketplace (Next.js App Router, Tailwind CSS, Supabase). Follow the sections in order on a fresh machine.

---

## 1. Prerequisites

### Node.js

1. Download the **LTS** build from [https://nodejs.org/](https://nodejs.org/).
2. Run the installer. Enable the option to add Node to your `PATH`.
3. Verify in a terminal:

   ```bash
   node -v
   npm -v
   ```

   Use **Node.js 20.x or newer** (recommended for Next.js 16).

### Git (optional but recommended)

Install from [https://git-scm.com/](https://git-scm.com/) if you plan to clone or version the project.

---

## 2. Project setup (Next.js + TypeScript)

This repository is already scaffolded. To recreate from scratch:

```bash
npx create-next-app@latest everythingmarketplace --typescript --tailwind --eslint --app --no-src-dir --import-alias "@/*"
cd everythingmarketplace
```

The app uses the **App Router** (`app/` directory) and **TypeScript** throughout.

---

## 3. Install dependencies

From the project root:

```bash
npm install
```

Additional packages used by this project:

| Package | Role |
|--------|------|
| `@supabase/supabase-js` | Supabase browser/server client |
| `@supabase/ssr` | Cookie-based sessions for Next.js App Router |
| `sonner` | Toast notifications |
| `clsx` | Conditional class names |
| `lucide-react` | Icons |
| `tailwindcss` | Styling (v4) |
| `@tailwindcss/postcss` | Tailwind PostCSS plugin |
| `postcss` | CSS processing |
| `autoprefixer` | CSS vendor prefixes |

If you add packages manually:

```bash
npm install @supabase/supabase-js @supabase/ssr clsx lucide-react sonner
npm install -D autoprefixer postcss
```

---

## 4. Tailwind CSS

Tailwind **v4** is configured via:

- `app/globals.css` — `@import "tailwindcss";` and theme tokens
- `postcss.config.mjs` — `@tailwindcss/postcss` and `autoprefixer`

No separate `tailwind.config.js` is required for the default v4 setup; extend tokens in `globals.css` using `@theme` if needed.

To verify:

```bash
npm run dev
```

Edit a component and use Tailwind classes (e.g. `className="flex gap-4"`).

---

## 5. Supabase setup

1. Create a project at [https://supabase.com/](https://supabase.com/).
2. In the Supabase dashboard, open **SQL Editor**.
3. Run the SQL files from the `supabase/` folder **in this order** (after they are added in project setup):

   1. `schema.sql` — tables and constraints  
   2. `policies.sql` — Row Level Security  
   3. `storage.sql` — storage bucket and policies  
   4. `seed.sql` — categories and sample data  
   5. If the database was created **before** buyer/seller roles existed, run **`user_role.sql`** once (adds `users.role` and updates the signup trigger).

4. **Auth — Email**: Under **Authentication → Providers**, enable **Email**. Under **URL Configuration**, set **Site URL** to `http://localhost:3000` (or your production URL) and add **Redirect URLs** including:
   - `http://localhost:3000/auth/callback`
   - `https://YOUR_PRODUCTION_DOMAIN/auth/callback`  
   The app exchanges the OAuth **code** at `/auth/callback` (Google and email magic links use this pattern with the Supabase JS client).

5. **Auth — Google**: In **Authentication → Providers → Google**, enable the provider. In [Google Cloud Console](https://console.cloud.google.com/) create OAuth 2.0 credentials (Web application). Add **Authorized redirect URIs** exactly as shown in the Supabase Google provider setup (typically `https://<PROJECT_REF>.supabase.co/auth/v1/callback`). Paste the **Client ID** and **Client Secret** into Supabase and save.
6. **Storage**: Confirm bucket `listing-images` exists after running `storage.sql`.
7. **Realtime**: In **Database → Publications** (or Realtime settings), ensure the `messages` table is enabled for Realtime if chat live updates do not appear. The `policies.sql` script attempts to add `public.messages` to the `supabase_realtime` publication (safe to re-run).

---

## 6. Environment variables

Create a file named `.env.local` in the project root (never commit secrets).

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
# Used for absolute URLs in SEO metadata, sitemap, and Open Graph (no trailing slash)
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

Where to find values:

- Supabase dashboard → **Project Settings → API**
- `NEXT_PUBLIC_SUPABASE_URL` → **Project URL**
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` → **anon public** key

Optional reference file: copy from `.env.example` if present.

Restart the dev server after changing `.env.local`.

---

## 7. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Other scripts:

| Command | Description |
|--------|-------------|
| `npm run build` | Production build |
| `npm run start` | Start production server (after `build`) |
| `npm run lint` | ESLint |

---

## 8. Deploy to Vercel

1. Push the repository to GitHub, GitLab, or Bitbucket.
2. Sign in at [https://vercel.com/](https://vercel.com/) and **Import** the repository.
3. Framework preset: **Next.js** (auto-detected).
4. Add **Environment Variables** in the Vercel project settings:

   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_SITE_URL` (e.g. `https://your-app.vercel.app`)

5. Deploy. Vercel runs `npm run build` and serves the App Router app.

**Production checklist**

- Supabase **Auth** redirect URLs include your Vercel domain (Authentication → URL Configuration).
- RLS policies are enabled and tested with the anon key.
- Storage bucket policies allow only intended uploads/downloads.

---

## 9. Repository layout (high level)

| Path | Purpose |
|------|---------|
| `app/` | Next.js App Router routes, layouts, pages |
| `components/` | Reusable UI |
| `lib/` | Clients, helpers (e.g. Supabase) |
| `hooks/` | React hooks |
| `types/` | Shared TypeScript types |
| `docs/` | Documentation |
| `supabase/` | SQL migrations / seeds for Supabase |

---

## Troubleshooting

- **Module not found after install**: Delete `node_modules` and `package-lock.json`, then `npm install`.
- **Supabase “Invalid API key”**: Confirm you used the **anon** key, not the service role key, in `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- **RLS blocks queries**: Ensure policies in `policies.sql` are applied and the user is authenticated when required.

For app-specific behavior, see inline comments in the codebase and upcoming steps in the build plan.
