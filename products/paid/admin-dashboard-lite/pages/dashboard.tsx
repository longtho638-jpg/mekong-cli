import DashboardLayout from "@/components/layout/dashboard-layout"
import { StatCard } from "@/components/stats/stat-card"
import { OverviewChart } from "@/components/charts/overview-chart"
import { RecentSales } from "@/components/stats/recent-sales"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { DollarSign, Users, CreditCard, Activity } from "lucide-react"

export default function DashboardPage() {
  return (
    <DashboardLayout>
      <div className="flex-1 space-y-4 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Revenue"
            value="$45,231.89"
            description="+20.1% from last month"
            icon={DollarSign}
            trend={{ value: 20.1, label: "from last month" }}
          />
          <StatCard
            title="Subscriptions"
            value="+2350"
            description="+180.1% from last month"
            icon={Users}
            trend={{ value: 180.1, label: "from last month" }}
          />
          <StatCard
            title="Sales"
            value="+12,234"
            description="+19% from last month"
            icon={CreditCard}
            trend={{ value: 19, label: "from last month" }}
          />
          <StatCard
            title="Active Now"
            value="+573"
            description="+201 since last hour"
            icon={Activity}
            trend={{ value: 201, label: "since last hour" }}
          />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          <Card className="col-span-4">
            <CardHeader>
              <CardTitle>Overview</CardTitle>
            </CardHeader>
            <CardContent className="pl-2">
              <OverviewChart />
            </CardContent>
          </Card>
          <Card className="col-span-3">
            <CardHeader>
              <CardTitle>Recent Sales</CardTitle>
              <CardDescription>
                You made 265 sales this month.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RecentSales />
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
