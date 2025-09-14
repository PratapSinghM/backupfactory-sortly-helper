# Sortly Helper (Vite + React + TS)

Single-page app to list Sortly products, filter by parent, upload CSV to bulk update prices, and export a snapshot CSV — designed to run on GitHub Pages.

Important: Browsers cannot set the `Cookie` header from JavaScript or attach third‑party cookies to a different domain. See the note below for proxy deployment to bypass CORS.

## Tech
- Vite + React + TypeScript
- Material UI + DataGrid
- React Query
- PapaParse

## Scripts
- `npm install`
- `npm run dev`
- `npm run build` → static files in `dist/`

## Environment & Auth
- Paste your Sortly cookie string (expects at least `auth_token` and `ajs_group_id`).
- The parsed `ajs_group_id` is used as `company_id`.
- Cookie string is stored in `localStorage` under `sortly_cookie`.

## CORS and Cookies (Important)
Browsers enforce CORS; you cannot “skip” it. Because we must use Sortly cookies, direct calls from localhost or GitHub Pages to `https://api.sortly.com` will fail without CORS support on Sortly’s side.

Solution: deploy a tiny proxy that:
- Accepts your requests from the browser with a custom header `x-proxy-cookie: <raw cookie string>`
- Forwards the call to Sortly with `Cookie: <raw cookie string>`
- Adds permissive CORS headers on the response

This repo includes a Cloudflare Worker at `proxy/cloudflare-worker.js` that does exactly that.

### Using the Cloudflare Worker
1. Create a Worker in the Cloudflare dashboard and paste `proxy/cloudflare-worker.js`.
2. In the Worker settings, add an environment variable `ALLOWED_ORIGINS` with a comma‑separated list of allowed sites (for credentialed CORS), for example:
   - `ALLOWED_ORIGINS=http://localhost:5173,https://pratapsinghm.github.io`
   If you omit `ALLOWED_ORIGINS`, the worker will allow `*` without credentials.
3. Deploy it and note the URL, e.g. `https://sortly-proxy.yourname.workers.dev`.
4. Create `.env` and set:
   - `VITE_API_BASE=https://sortly-proxy.yourname.workers.dev`
5. Run `npm run dev` and the app will route through your proxy.

Security note: The raw cookie is sent to your Worker. Keep the Worker private and only use it for your own account.

## Local development without CORS
- Option A (recommended): Use the Cloudflare Worker proxy and set `VITE_API_BASE` to the Worker URL.
- Option B: Use the built-in Vite dev proxy.
  - Create `.env.local` with:
    - `VITE_API_BASE=/sortly`
  - Start dev server: `npm run dev`
  - The app sends `x-proxy-cookie` to the dev server; Vite proxies to `https://api.sortly.com` and injects `Cookie` server-side. Requests stay same-origin so CORS doesn’t apply.
