import HostDashboardClient from './HostDashboardClient'
import { getHostDashboardInitialData } from '@/lib/server/host-dashboard-data'

export const dynamic = 'force-dynamic'

export default async function HostDashboardPage() {
  const initialData = await getHostDashboardInitialData()
  return <HostDashboardClient initialData={initialData} />
}
