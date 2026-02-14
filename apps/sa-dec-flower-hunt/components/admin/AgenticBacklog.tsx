"use client";

import React from 'react';
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CheckCircle2, Circle, AlertCircle } from "lucide-react";
import { Domain } from "@/lib/agents/guardrails";

type Priority = 'P0' | 'P1' | 'P2';
type Effort = 'S' | 'M' | 'L' | 'XL';

interface AgentTask {
  id: string;
  agent: string;
  title: string;
  priority: Priority;
  effort: Effort;
  domain: Domain;
  status: 'pending' | 'in_progress' | 'done';
}

const MOCK_TASKS: AgentTask[] = [
  { id: '1', agent: 'LeadAgent', title: 'Optimize lead scoring model', priority: 'P0', effort: 'M', domain: 'GROWTH', status: 'in_progress' },
  { id: '2', agent: 'ReferralAgent', title: 'Implement double-sided rewards', priority: 'P1', effort: 'L', domain: 'GROWTH', status: 'pending' },
  { id: '3', agent: 'FulfillmentAgent', title: 'Integrate GHN API for real-time tracking', priority: 'P0', effort: 'XL', domain: 'OPS', status: 'pending' },
  { id: '4', agent: 'DrFlowerAgent', title: 'Add orchid care knowledge base', priority: 'P2', effort: 'S', domain: 'SUPPORT', status: 'done' },
  { id: '5', agent: 'FulfillmentAgent', title: 'Automate stock alerts', priority: 'P1', effort: 'M', domain: 'OPS', status: 'in_progress' },
];

export function AgenticBacklog() {
  const [filter, setFilter] = React.useState<Domain | 'ALL'>('ALL');

  const filteredTasks = filter === 'ALL' 
    ? MOCK_TASKS 
    : MOCK_TASKS.filter(t => t.domain === filter);

  const getPriorityColor = (p: Priority) => {
    switch(p) {
      case 'P0': return 'bg-red-500 hover:bg-red-600';
      case 'P1': return 'bg-orange-500 hover:bg-orange-600';
      case 'P2': return 'bg-blue-500 hover:bg-blue-600';
      default: return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
      switch(status) {
          case 'done': return <CheckCircle2 className="w-4 h-4 text-green-500" />;
          case 'in_progress': return <Circle className="w-4 h-4 text-yellow-500 fill-yellow-200" />;
          default: return <Circle className="w-4 h-4 text-stone-300" />;
      }
  };

  return (
    <Card className="h-full bg-stone-50/50 dark:bg-stone-900/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-medium">Agentic Backlog</CardTitle>
          <div className="flex gap-1">
            {(['ALL', 'GROWTH', 'OPS', 'SUPPORT'] as const).map((d) => (
              <button
                key={d}
                onClick={() => setFilter(d)}
                className={`text-xs px-2 py-1 rounded-md transition-colors ${
                  filter === d 
                    ? 'bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900' 
                    : 'hover:bg-stone-200 dark:hover:bg-stone-800 text-stone-500'
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[300px] pr-4">
          <div className="space-y-3">
            {filteredTasks.map((task) => (
              <div key={task.id} className="flex items-center justify-between p-3 bg-white dark:bg-stone-800 rounded-lg border border-stone-100 dark:border-stone-700 shadow-sm hover:shadow-md transition-all">
                <div className="flex items-center gap-3">
                   {getStatusIcon(task.status)}
                   <div>
                      <p className="text-sm font-medium text-stone-900 dark:text-stone-100">{task.title}</p>
                      <p className="text-xs text-stone-500 flex items-center gap-2">
                          <span>{task.agent}</span>
                          <span className="w-1 h-1 rounded-full bg-stone-300"></span>
                          <span>{task.domain}</span>
                      </p>
                   </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-[10px] h-5 font-mono">{task.effort}</Badge>
                  <Badge className={`text-[10px] h-5 ${getPriorityColor(task.priority)} border-0`}>{task.priority}</Badge>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
