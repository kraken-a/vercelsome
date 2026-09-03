import { getLocale } from 'next-intl/server'
import { getNavigation } from '@/lib/api/navigation'
import { HeaderClient } from './header-client'

export async function Header() {
  const locale = await getLocale()
  const result = await getNavigation(locale)

  const typeItems = result.success ? result.data.types : []
  const espaceItems = result.success ? result.data.spaces : []
  const collectionItems = result.success ? result.data.collections : []

  return (
    <HeaderClient
      typeItems={typeItems}
      espaceItems={espaceItems}
      collectionItems={collectionItems}
    />
  )
}
