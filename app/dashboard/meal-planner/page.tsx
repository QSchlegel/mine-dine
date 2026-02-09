import MealPlannerClient from './MealPlannerClient'
import { getMealPlannerInitialData } from '@/lib/server/meal-planner-data'

export const dynamic = 'force-dynamic'

export default async function MealPlannerPage() {
  const initialData = await getMealPlannerInitialData()
  return <MealPlannerClient initialData={initialData} />
}
