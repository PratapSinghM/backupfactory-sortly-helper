import { useEffect, useMemo, useState } from 'react'
import CookieForm from './components/CookieForm'
import ProductsPage from './pages/ProductsPage'
import { parseCookieString } from './utils/cookies'

const COOKIE_KEY = 'sortly_cookie'

export default function App() {
  const [cookieString, setCookieString] = useState<string | null>(
    localStorage.getItem(COOKIE_KEY)
  )

  useEffect(() => {
    if (cookieString) {
      localStorage.setItem(COOKIE_KEY, cookieString)
    }
  }, [cookieString])

  const parsed = useMemo(() => (cookieString ? parseCookieString(cookieString) : null), [cookieString])

  if (!cookieString || !parsed?.auth_token || !parsed?.ajs_group_id) {
    return (
      <CookieForm
        initialValue={cookieString ?? ''}
        onSave={(val) => setCookieString(val)}
      />
    )
  }

  return (
    <ProductsPage
      cookieString={cookieString}
      companyId={parsed.ajs_group_id}
      onChangeCookie={() => setCookieString(null)}
    />
  )
}

