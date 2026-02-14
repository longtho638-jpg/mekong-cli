"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AgenticBacklog } from "./AgenticBacklog";
import { Zap, Users, Package, MessageSquare, Activity, AlertTriangle } from "lucide-react";
import { checkGuardrails, AgentMonitor } from "@/lib/agents/guardrails";

interface AgentCardProps {
  name: string;
  role: string;
  status: 'active' | 'paused' | 'learning';
  kpi: string;
  kpiValue: string;
  icon: React.ReactNode;
  monitor: AgentMonitor;
}

function AgentCard({ name, role, status, kpi, kpiValue, icon, monitor }: AgentCardProps) {
  const [enabled, setEnabled] = React.useState(status === 'active');
  const alerts = checkGuardrails(monitor);

  return (
    <Card className="border-stone-200 dark:border-stone-800">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          {icon}
          {name}
        </CardTitle>
        <Switch checked={enabled} onCheckedChange={setEnabled} />
      </CardHeader>
      <CardContent>
        <div className="text-xs text-stone-500 mb-4">{role}</div>
        <div className="flex items-baseline justify-between mb-2">
            <div className="text-2xl font-bold">{kpiValue}</div>
            <div className="text-xs font-medium text-stone-500">{kpi}</div>
        </div>
        
        <div className="space-y-2">
            <div className="flex justify-between text-xs">
                <span className="text-stone-500">Success Rate</span>
                <span className="text-green-600 font-medium">{(100 - monitor.rejectionRate * 100).toFixed(1)}%</span>
            </div>
            <div className="flex justify-between text-xs">
                <span className="text-stone-500">Avg Response</span>
                <span className={monitor.responseTime > 5 ? "text-amber-600" : "text-stone-900"}>{monitor.responseTime}s</span>
            </div>
        </div>

        {alerts.length > 0 && (
            <div className="mt-4 p-2 bg-amber-50 border border-amber-200 rounded text-[10px] text-amber-800 flex items-start gap-1">
                <AlertTriangle className="w-3 h-3 shrink-0 mt-0.5" />
                <div>
                    {alerts.map((alert, i) => <div key={i}>{alert}</div>)}
                </div>
            </div>
        )}
      </CardContent>
    </Card>
  );
}

export function AgentDashboard() {
  return (
    <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <AgentCard 
                name="LeadAgent" 
                role="Growth & Acquisition" 
                status="active" 
                kpi="Conv. Rate" 
                kpiValue="4.2%" 
                icon={<Zap className="w-4 h-4 text-yellow-500" />}
                monitor={{ rejectionRate: 0.05, responseTime: 1.2, lastActive: new Date() }}
            />
            <AgentCard 
                name="ReferralAgent" 
                role="Viral Loops" 
                status="paused" 
                kpi="K-Factor" 
                kpiValue="1.1" 
                icon={<Users className="w-4 h-4 text-blue-500" />}
                monitor={{ rejectionRate: 0.12, responseTime: 0.8, lastActive: new Date() }}
            />
            <AgentCard 
                name="FulfillmentAgent" 
                role="Logistics Ops" 
                status="active" 
                kpi="On-Time" 
                kpiValue="98.5%" 
                icon={<Package className="w-4 h-4 text-orange-500" />}
                monitor={{ rejectionRate: 0.01, responseTime: 2.4, lastActive: new Date() }}
            />
            <AgentCard 
                name="DrFlowerAgent" 
                role="Customer Support" 
                status="active" 
                kpi="CSAT" 
                kpiValue="4.8/5" 
                icon={<MessageSquare className="w-4 h-4 text-pink-500" />}
                monitor={{ rejectionRate: 0.35, responseTime: 6.2, lastActive: new Date() }}
            />
        </div>

        <div className="grid gap-4 md:grid-cols-7">
            <div className="col-span-4">
                <AgenticBacklog />
            </div>
            <div className="col-span-3">
                 <Card className="h-full border-stone-200 dark:border-stone-800">
                    <CardHeader>
                        <CardTitle>System Health</CardTitle>
                        <CardDescription>Real-time agent performance metrics</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="flex items-center gap-4">
                                <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-full">
                                    <Activity className="w-4 h-4 text-green-600" />
                                </div>
                                <div className="flex-1">
                                    <div className="text-sm font-medium">System Uptime</div>
                                    <div className="text-xs text-stone-500">99.99% this month</div>
                                </div>
                                <div className="text-sm font-bold text-green-600">Healthy</div>
                            </div>
                             <div className="flex items-center gap-4">
                                <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-full">
                                    <Zap className="w-4 h-4 text-blue-600" />
                                </div>
                                <div className="flex-1">
                                    <div className="text-sm font-medium">Total Actions</div>
                                    <div className="text-xs text-stone-500">1,234 auto-executed</div>
                                </div>
                                <div className="text-sm font-bold">1.2k</div>
                            </div>
                             <div className="flex items-center gap-4">
                                <div className="p-2 bg-amber-100 dark:bg-amber-900/20 rounded-full">
                                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                                </div>
                                <div className="flex-1">
                                    <div className="text-sm font-medium">Interventions</div>
                                    <div className="text-xs text-stone-500">Requires human review</div>
                                </div>
                                <div className="text-sm font-bold text-amber-600">12</div>
                            </div>
                        </div>
                        <div className="mt-6 pt-6 border-t border-stone-100 dark:border-stone-800">
                            <Button variant="outline" className="w-full text-xs">View Detailed Logs</Button>
                        </div>
                    </CardContent>
                 </Card>
            </div>
        </div>
    </div>
  );
}
