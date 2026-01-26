import DashboardLayout from "@/components/layout/dashboard-layout"
import { VisitorsChart, DeviceChart } from "@/components/charts/analytics-charts"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CalendarDateRangePicker } from "@/components/ui/date-range-picker"
import { Download } from "lucide-react"

export default function AnalyticsPage() {
  return (
    <DashboardLayout>
      <div className="flex-1 space-y-4 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Analytics</h2>
          <div className="flex items-center space-x-2">
            <CalendarDateRangePicker />
            <Button>
              <Download className="mr-2 h-4 w-4" />
              Download
            </Button>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          <Card className="col-span-4">
            <CardHeader>
              <CardTitle>Traffic Overview</CardTitle>
              <CardDescription>
                Daily visitors vs Bounce rate
              </CardDescription>
            </CardHeader>
            <CardContent className="pl-2">
              <VisitorsChart />
            </CardContent>
          </Card>
          <Card className="col-span-3">
            <CardHeader>
              <CardTitle>Device Distribution</CardTitle>
              <CardDescription>
                Visitors by device type
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DeviceChart />
              <div className="mt-4 grid grid-cols-2 gap-4">
                <div className="flex items-center">
                  <span className="mr-2 h-3 w-3 rounded-full bg-[#0088FE]" />
                  <span className="text-sm text-muted-foreground">Mobile (40%)</span>
                </div>
                <div className="flex items-center">
                  <span className="mr-2 h-3 w-3 rounded-full bg-[#00C49F]" />
                  <span className="text-sm text-muted-foreground">Desktop (30%)</span>
                </div>
                <div className="flex items-center">
                  <span className="mr-2 h-3 w-3 rounded-full bg-[#FFBB28]" />
                  <span className="text-sm text-muted-foreground">Tablet (30%)</span>
                </div>
                <div className="flex items-center">
                  <span className="mr-2 h-3 w-3 rounded-full bg-[#FF8042]" />
                  <span className="text-sm text-muted-foreground">Other (20%)</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
