import type { ProductNode, ProductResponse } from '../types'

const RAW_API_BASE: string = (import.meta as any).env?.VITE_API_BASE || 'https://api.sortly.com'
function resolveBase(): URL {
  // Support absolute or relative (e.g., '/sortly') bases
  try {
    return new URL(RAW_API_BASE)
  } catch {
    return new URL(RAW_API_BASE, window.location.origin)
  }
}
const API_BASE = resolveBase()

function assertOk(res: Response) {
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${res.statusText}`)
  }
}

function buildHeaders(cookieString: string, method: string): HeadersInit {
  const usingProxy = !/api\.sortly\.com$/i.test(API_BASE.hostname)
  const headers: HeadersInit = {}
  if (method !== 'GET' && method !== 'HEAD') {
    ;(headers as any)['content-type'] = 'application/json'
  }
  if (usingProxy) {
    ;(headers as any)['x-proxy-cookie'] = cookieString
  }
  return headers
}

function mapResponse(json: any): ProductResponse {
  // Expected response contains buckets[] and maybe pagination meta.
  const buckets = json?.buckets ?? json?.items ?? []
  const items: ProductNode[] = buckets.map((n: any) => ({
    node_id: String(n.node_id ?? n.id ?? ''),
    sid: String(n.sid ?? ''),
    name: String(n.name ?? ''),
    parent_node_id: n.parent_node_id ? String(n.parent_node_id) : undefined,
    updated_at: n.updated_at ?? n.updatedAt ?? undefined,
    price: n.price ?? null,
  }))
  const total = Number(json?.pagination?.total ?? json?.total ?? items.length)
  return { items, total: Number.isFinite(total) ? total : items.length }
}

export async function fetchProducts({ companyId, cookieString, limit = 10, offset = 0 }: { companyId: string; cookieString: string; limit?: number; offset?: number }): Promise<ProductResponse> {
  const url = new URL(`/v3/companies/${encodeURIComponent(companyId)}/nodes`, API_BASE)
  url.searchParams.set('limit', String(limit))
  url.searchParams.set('offset', String(offset))
  url.searchParams.set('sort_by', 'updated_at')
  url.searchParams.set('order', 'desc')
  url.searchParams.set('include', 'all')
  url.searchParams.set('with_pagination_meta', 'true')

  const res = await fetch(url.toString(), {
    method: 'GET',
    headers: buildHeaders(cookieString, 'GET'),
    credentials: /api\.sortly\.com$/i.test(API_BASE.hostname) ? 'include' : 'omit',
    mode: 'cors',
  })
  assertOk(res)
  const json = await res.json()
  return mapResponse(json)
}

export async function fetchProductsByParent({ companyId, cookieString, parentId, limit = 100, offset = 0 }: { companyId: string; cookieString: string; parentId: string; limit?: number; offset?: number }): Promise<ProductResponse> {
  const url = new URL(`/v3/companies/${encodeURIComponent(companyId)}/nodes`, API_BASE)
  url.searchParams.set('limit', String(limit))
  url.searchParams.set('offset', String(offset))
  url.searchParams.set('sort_by', 'updated_at')
  url.searchParams.set('order', 'desc')
  url.searchParams.set('include', 'all')
  url.searchParams.set('with_pagination_meta', 'true')
  url.searchParams.set('parent_id', String(parentId))

  const res = await fetch(url.toString(), {
    method: 'GET',
    headers: buildHeaders(cookieString, 'GET'),
    credentials: /api\.sortly\.com$/i.test(API_BASE.hostname) ? 'include' : 'omit',
    mode: 'cors',
  })
  assertOk(res)
  const json = await res.json()
  return mapResponse(json)
}

export async function patchProductPrice({ companyId, cookieString, nodeId, price }: { companyId: string; cookieString: string; nodeId: string; price: number }): Promise<void> {
  const url = new URL(`/v2/companies/${encodeURIComponent(companyId)}/nodes/${encodeURIComponent(nodeId)}`, API_BASE).toString()
  const body = JSON.stringify({ node: { price: price.toFixed(2) } })
  const res = await fetch(url, {
    method: 'PATCH',
    headers: buildHeaders(cookieString, 'PATCH'),
    credentials: /api\.sortly\.com$/i.test(API_BASE.hostname) ? 'include' : 'omit',
    mode: 'cors',
    body,
  })
  assertOk(res)
}
