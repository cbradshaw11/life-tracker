# Supabase setup for the iOS app

The app needs your Supabase **project URL** and **anon (public) key** to sign in and sync data. Use the same values as your web app (e.g. from the repo’s `.env` or `.env.example`: `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`).

## Option 1: Environment variables in Xcode (recommended)

1. In Xcode, choose **Product → Scheme → Edit Scheme…** (or double‑click the scheme name in the toolbar).
2. Select **Run** in the left sidebar, then open the **Arguments** tab.
3. Under **Environment Variables**, click **+** and add:
   - **Name:** `SUPABASE_URL`  
     **Value:** your project URL (e.g. `https://xxxxxxxx.supabase.co`)
   - **Name:** `SUPABASE_ANON_KEY`  
     **Value:** your anon key (the long JWT from Supabase Dashboard → Settings → API)
4. Close the scheme editor and run the app again.

These values are stored in the scheme (usually in your user project files), not in the app binary, so they’re safe for local development. Don’t commit real keys to git.

## Option 2: Same `.env` as the web app

If the iOS project lives inside the same repo as the web app (e.g. `life-tracker/life-tracker-ios/`), copy the URL and anon key from the root `.env` into the Xcode scheme as in Option 1. The iOS app reads `SUPABASE_URL` and `SUPABASE_ANON_KEY` (not `VITE_*`), but the values are the same.

## Where to find the values

- **Supabase Dashboard** → your project → **Settings** → **API**
- **Project URL** → use as `SUPABASE_URL`
- **Project API keys** → **anon public** → use as `SUPABASE_ANON_KEY`

After setting these, build and run again; login should work.
