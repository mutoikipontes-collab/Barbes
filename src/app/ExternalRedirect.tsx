import { useEffect } from 'react'
import { useLocation } from 'react-router'
import { FullPageLoading } from '@/components/ui'
import { siteUrl, type Site } from '@/lib/site'

/** Página que pertence ao outro site: leva para lá mantendo o caminho. */
export function ExternalRedirect({ site }: { site: Site }) {
  const location = useLocation()
  useEffect(() => {
    window.location.replace(siteUrl(site, location.pathname + location.search))
  }, [site, location.pathname, location.search])
  return <FullPageLoading />
}
