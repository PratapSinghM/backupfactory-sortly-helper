export function parseCookieString(cookieString: string): Record<string, string> & { auth_token?: string; ajs_group_id?: string } {
  const result: Record<string, string> = {}
  cookieString
    .split(';')
    .map((s) => s.trim())
    .filter(Boolean)
    .forEach((pair) => {
      const eq = pair.indexOf('=')
      if (eq > -1) {
        const key = decodeURIComponent(pair.slice(0, eq).trim())
        const val = decodeURIComponent(pair.slice(eq + 1).trim())
        result[key] = val
      }
    })
  return result as any
}

