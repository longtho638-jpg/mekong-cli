import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Mail, MousePointer2, AlertCircle } from 'lucide-react';

export default function Dashboard() {
  // Mock data for now - in a real app this would come from an API
  const stats = [
    { title: 'Total Subscribers', value: '12,345', icon: Users, change: '+12% from last month' },
    { title: 'Emails Sent', value: '45.2k', icon: Mail, change: '+5.4% from last month' },
    { title: 'Open Rate', value: '24.8%', icon: MousePointer2, change: '+2.1% from last month' },
    { title: 'Bounce Rate', value: '1.2%', icon: AlertCircle, change: '-0.4% from last month' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Overview of your email marketing performance.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {stat.change}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Recent Campaigns</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Chart visualization would go here (e.g., using Recharts)
            </p>
            <div className="h-[200px] flex items-center justify-center border-2 border-dashed rounded-md mt-4">
              Chart Placeholder
            </div>
          </CardContent>
        </Card>
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center">
                  <div className="ml-4 space-y-1">
                    <p className="text-sm font-medium leading-none">
                      New subscriber joined
                    </p>
                    <p className="text-sm text-muted-foreground">
                      user{i}@example.com
                    </p>
                  </div>
                  <div className="ml-auto font-medium text-sm text-muted-foreground">
                    2m ago
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
