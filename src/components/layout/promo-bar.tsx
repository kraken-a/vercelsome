import { unstable_noStore as noStore } from 'next/cache'
import { getHomeData } from '@/lib/api/home'
import { PromoBarClient } from './promo-bar-client'

export async function PromoBar() {
  noStore()
  const result = await getHomeData()
  const topNotice = result.success ? result.data.top_notice : null
  return <PromoBarClient topNotice={topNotice as { message: string; badge?: string } | null} />
}
