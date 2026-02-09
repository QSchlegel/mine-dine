import DashboardPageClient from './DashboardPageClient'
import { getDashboardInitialData } from '@/lib/server/dashboard-data'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const initialData = await getDashboardInitialData()
  return <DashboardPageClient initialData={initialData} />
}
