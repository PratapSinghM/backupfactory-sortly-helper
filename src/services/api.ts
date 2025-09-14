import type { ProductNode, ProductResponse } from '../types'

const BASE = 'https://api.sortly.com'

function assertOk(res: Response) {
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${res.statusText}`)
  }
}

function buildHeaders(cookieString: string): HeadersInit {
  // WARNING: Browsers forbid setting the Cookie header. This is kept to
  // express intent; requests will only include cookies if the browser has
  // first-party cookies for the API origin and credentials: 'include'.
  return {
    // 'cookie': cookieString, // forbidden in browsers
    'content-type': 'application/json',
  }
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
  const url = new URL(`${BASE}/v3/companies/${encodeURIComponent(companyId)}/nodes`)
  url.searchParams.set('limit', String(limit))
  url.searchParams.set('offset', String(offset))
  url.searchParams.set('sort_by', 'updated_at')
  url.searchParams.set('order', 'desc')
  url.searchParams.set('include', 'all')
  url.searchParams.set('with_pagination_meta', 'true')

  const res = await fetch(url.toString(), {
    method: 'GET',
    headers: buildHeaders(cookieString),
    credentials: 'include',
    mode: 'cors',
  })
  assertOk(res)
  const json = await res.json()
  return mapResponse(json)
}

export async function fetchProductsByParent({ companyId, cookieString, parentId, limit = 100, offset = 0 }: { companyId: string; cookieString: string; parentId: string; limit?: number; offset?: number }): Promise<ProductResponse> {
  const url = new URL(`${BASE}/v3/companies/${encodeURIComponent(companyId)}/nodes`)
  url.searchParams.set('limit', String(limit))
  url.searchParams.set('offset', String(offset))
  url.searchParams.set('sort_by', 'updated_at')
  url.searchParams.set('order', 'desc')
  url.searchParams.set('include', 'all')
  url.searchParams.set('with_pagination_meta', 'true')
  url.searchParams.set('parent_id', String(parentId))

  const res = await fetch(url.toString(), {
    method: 'GET',
    headers: buildHeaders(cookieString),
    credentials: 'include',
    mode: 'cors',
  })
  assertOk(res)
  const json = await res.json()
  return mapResponse(json)
}

export async function patchProductPrice({ companyId, cookieString, nodeId, price }: { companyId: string; cookieString: string; nodeId: string; price: number }): Promise<void> {
  const url = `${BASE}/v2/companies/${encodeURIComponent(companyId)}/nodes/${encodeURIComponent(nodeId)}`
  const body = JSON.stringify({ node: { price: price.toFixed(2) } })
  const res = await fetch(url, {
    method: 'PATCH',
    headers: buildHeaders(cookieString),
    credentials: 'include',
    mode: 'cors',
    body,
  })
  assertOk(res)
}

