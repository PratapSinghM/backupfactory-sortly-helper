// Cloudflare Worker to proxy Sortly API and add CORS headers.
//
// Deploy: wrangler.toml should route this worker to your chosen subdomain.
// After deployment, set VITE_API_BASE to your worker URL, e.g. https://sortly-proxy.example.workers.dev
//
// Security note: This forwards a raw cookie string provided via `x-proxy-cookie` header to Sortly.
// Only use this for your own trusted usage, not for a public multi-tenant service.

export default {
  async fetch(req, env, ctx) {
    const url = new URL(req.url)
    const origin = req.headers.get('origin') || ''
    const cors = getCorsPolicy(origin, env)

    // Preflight
    if (req.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsPreflightHeaders(cors) })
    }

    // Rewrite to Sortly API
    const upstream = new URL(url.pathname + url.search, 'https://api.sortly.com')

    const headers = new Headers(req.headers)
    const cookieFromClient = headers.get('x-proxy-cookie') || ''
    headers.delete('x-proxy-cookie')
    // Remove CORS-related headers that shouldn't be sent upstream
    headers.delete('origin')
    headers.delete('referer')
    headers.set('host', 'api.sortly.com')

    // Force JSON content-type for PATCH/POST if body is present
    if (req.method === 'PATCH' || req.method === 'POST') {
      if (!headers.has('content-type')) headers.set('content-type', 'application/json')
    }

    // Build upstream request with Cookie injected
    const init = {
      method: req.method,
      headers: new Headers(headers),
      body: ['GET', 'HEAD'].includes(req.method) ? undefined : await req.arrayBuffer(),
      redirect: 'manual',
    }
    if (cookieFromClient) {
      init.headers.set('cookie', cookieFromClient)
    }

    const upstreamRes = await fetch(upstream.toString(), init)
    const resHeaders = new Headers(upstreamRes.headers)
    // Do not forward upstream Set-Cookie to the browser in this flow
    resHeaders.delete('set-cookie')
    applyCorsHeaders(resHeaders, cors)

    return new Response(upstreamRes.body, { status: upstreamRes.status, statusText: upstreamRes.statusText, headers: resHeaders })
  },
}

function getCorsPolicy(origin, env) {
  const raw = env?.ALLOWED_ORIGINS || ''
  const list = raw
    .split(',')
    .map(s => s.trim())
    .filter(Boolean)
  if (list.length && origin && list.includes(origin)) {
    return { allowOrigin: origin, allowCredentials: true }
  }
  // Default: wildcard without credentials
  return { allowOrigin: '*', allowCredentials: false }
}

function corsPreflightHeaders(cors) {
  const h = new Headers()
  applyCorsHeaders(h, cors)
  h.set('access-control-allow-methods', 'GET,POST,PATCH,OPTIONS')
  h.set('access-control-allow-headers', 'content-type,x-proxy-cookie')
  h.set('access-control-max-age', '600')
  return h
}

function applyCorsHeaders(h, cors) {
  h.set('access-control-allow-origin', cors.allowOrigin)
  h.set('access-control-expose-headers', 'content-type')
  h.set('access-control-allow-credentials', cors.allowCredentials ? 'true' : 'false')
  if (cors.allowOrigin !== '*') {
    h.set('vary', 'origin')
  }
}
