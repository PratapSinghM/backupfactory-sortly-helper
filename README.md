# Sortly Helper (Vite + React + TS)

Single-page app to list Sortly products, filter by parent, upload CSV to bulk update prices, and export a snapshot CSV — designed to run on GitHub Pages.

Important: Browsers cannot set the `Cookie` header from JavaScript or attach third‑party cookies to a different domain. See the note below for deployment options.

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
Web apps cannot set the `Cookie` header nor write cookies for another domain. For direct calls from GitHub Pages to `https://api.sortly.com` to work, the Sortly API must:
- Allow cross-origin requests from your site via CORS, and
- Accept credentials with `Access-Control-Allow-Credentials: true`, and
- The browser must already have first‑party cookies for `api.sortly.com` (not possible to set from `github.io`).

If those conditions are not met, deploy a tiny proxy (e.g., a Cloudflare Worker) to forward requests and set the `Cookie` header server-side. Point requests to your worker’s URL.

