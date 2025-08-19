import { DashboardStats } from "@/components/dashboard/stats"
import { RecentSales } from "@/components/dashboard/recent-sales"
import { InventoryAlerts } from "@/components/dashboard/inventory-alerts"
import { QuickActions } from "@/components/dashboard/quick-actions"

export default function Dashboard() {
  return (
    <div className="p-3 sm:p-6 space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Overview of your collector inventory business</p>
      </div>

      <DashboardStats />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <RecentSales />
          <QuickActions />
        </div>
        <div>
          <InventoryAlerts />
        </div>
      </div>
    </div>
  )
}
