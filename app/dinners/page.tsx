import DinnersPageClient from './DinnersPageClient'
import { getDinnersInitialData } from '@/lib/server/dinners-data'

export const dynamic = 'force-dynamic'

export default async function BrowseDinnersPage() {
  const initialData = await getDinnersInitialData()
  return <DinnersPageClient initialData={initialData} />
}
