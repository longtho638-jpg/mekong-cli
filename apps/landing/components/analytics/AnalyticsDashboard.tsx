'use client';

import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowUpRight, MousePointer, Eye, Users, Activity } from 'lucide-react';

// Mock Data
const conversionData = [
  { name: 'Variant A', views: 4000, conversions: 240, rate: 6 },
  { name: 'Variant B', views: 3000, conversions: 139, rate: 4.6 },
];

const timeSeriesData = [
  { time: '00:00', visitors: 120 },
  { time: '04:00', visitors: 80 },
  { time: '08:00', visitors: 450 },
  { time: '12:00', visitors: 980 },
  { time: '16:00', visitors: 850 },
  { time: '20:00', visitors: 340 },
];

export function AnalyticsDashboard() {
  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h2>
        <div className="flex items-center space-x-2">
          {/* Date Range Picker Placeholder */}
          <button className="px-4 py-2 bg-white border rounded hover:bg-gray-50 text-sm">Last 7 Days</button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="ab-testing">A/B Testing</TabsTrigger>
          <TabsTrigger value="heatmaps">Heatmaps</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">$45,231.89</div>
                <p className="text-xs text-muted-foreground">+20.1% from last month</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Unique Visitors</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">+2350</div>
                <p className="text-xs text-muted-foreground">+180.1% from last month</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Page Views</CardTitle>
                <Eye className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">+12,234</div>
                <p className="text-xs text-muted-foreground">+19% from last month</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Now</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">+573</div>
                <p className="text-xs text-muted-foreground">+201 since last hour</p>
              </CardContent>
            </Card>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle>Traffic Overview</CardTitle>
              </CardHeader>
              <CardContent className="pl-2">
                <ResponsiveContainer width="100%" height={350}>
                  <LineChart data={timeSeriesData}>
                    <XAxis dataKey="time" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}`} />
                    <Tooltip />
                    <Line type="monotone" dataKey="visitors" stroke="#8884d8" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card className="col-span-3">
              <CardHeader>
                <CardTitle>Top Referrers</CardTitle>
                <CardDescription>Where your traffic is coming from.</CardDescription>
              </CardHeader>
              <CardContent>
                  <div className="space-y-4">
                      <div className="flex items-center">
                          <div className="w-full space-y-1">
                              <p className="text-sm font-medium leading-none">Google</p>
                              <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                                  <div className="bg-blue-500 h-full" style={{ width: '45%' }}></div>
                              </div>
                          </div>
                          <div className="ml-4 font-medium">45%</div>
                      </div>
                      <div className="flex items-center">
                          <div className="w-full space-y-1">
                              <p className="text-sm font-medium leading-none">Direct</p>
                              <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                                  <div className="bg-green-500 h-full" style={{ width: '25%' }}></div>
                              </div>
                          </div>
                          <div className="ml-4 font-medium">25%</div>
                      </div>
                      <div className="flex items-center">
                          <div className="w-full space-y-1">
                              <p className="text-sm font-medium leading-none">Twitter / X</p>
                              <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                                  <div className="bg-sky-500 h-full" style={{ width: '20%' }}></div>
                              </div>
                          </div>
                          <div className="ml-4 font-medium">20%</div>
                      </div>
                  </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="ab-testing" className="space-y-4">
             <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Conversion Rate by Variant</CardTitle>
                        <CardDescription>Variant A is performing 30% better than Variant B</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={conversionData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}%`} />
                                <Tooltip />
                                <Legend />
                                <Bar dataKey="rate" fill="#adfa1d" radius={[4, 4, 0, 0]} name="Conversion Rate %" />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Statistical Significance</CardTitle>
                        <CardDescription>Confidence Level: 95%</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col items-center justify-center h-[300px] text-center space-y-4">
                            <div className="p-4 bg-green-50 text-green-700 rounded-full">
                                <ArrowUpRight className="w-12 h-12" />
                            </div>
                            <h3 className="text-2xl font-bold">Winner Found!</h3>
                            <p className="text-gray-500 max-w-xs">
                                Variant A has a statistically significant higher conversion rate. We recommend switching 100% traffic to Variant A.
                            </p>
                            <button className="px-4 py-2 bg-primary text-white rounded hover:bg-primary/90">
                                Apply Winner
                            </button>
                        </div>
                    </CardContent>
                </Card>
             </div>
        </TabsContent>

        <TabsContent value="heatmaps" className="space-y-4">
             <Card>
                 <CardHeader>
                     <CardTitle>Click Heatmap</CardTitle>
                     <CardDescription>Where users are clicking on the page.</CardDescription>
                 </CardHeader>
                 <CardContent>
                     <div className="relative border rounded-lg overflow-hidden h-[600px] bg-gray-50 flex items-center justify-center">
                         {/* Placeholder for heatmap visualization */}
                         <div className="absolute inset-0 bg-white opacity-50"></div>
                         <div className="z-10 text-center">
                             <MousePointer className="w-12 h-12 mx-auto text-gray-400 mb-2" />
                             <p className="text-gray-500">Select a page to view heatmap overlay</p>
                             <div className="mt-4 flex gap-2 justify-center">
                                 <div className="w-4 h-4 bg-red-500 rounded-full"></div> <span>High</span>
                                 <div className="w-4 h-4 bg-yellow-500 rounded-full"></div> <span>Medium</span>
                                 <div className="w-4 h-4 bg-blue-500 rounded-full"></div> <span>Low</span>
                             </div>
                         </div>
                         {/* Mock Heatmap points */}
                         <div className="absolute top-1/4 left-1/4 w-16 h-16 bg-red-500/30 rounded-full blur-xl"></div>
                         <div className="absolute top-1/3 right-1/4 w-24 h-24 bg-red-500/40 rounded-full blur-xl"></div>
                         <div className="absolute bottom-1/4 left-1/3 w-20 h-20 bg-yellow-500/30 rounded-full blur-xl"></div>
                     </div>
                 </CardContent>
             </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Helper component for icon consistency
function DollarSign({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <line x1="12" x2="12" y1="2" y2="22" />
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  );
}
