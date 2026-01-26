"use client";

import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Download, Filter, Search } from 'lucide-react';
import { AuditLogEntry } from '@/types/audit';

// Mock Data
const MOCK_LOGS: AuditLogEntry[] = Array.from({ length: 50 }).map((_, i) => ({
  id: `log_${i}`,
  userId: `user_${i % 5}`,
  userName: `Admin User ${i % 5}`,
  action: ['create', 'update', 'delete', 'login'][i % 4] as any,
  resource: ['user', 'file', 'settings', 'system'][i % 4] as any,
  details: `Performed action on item ${i}`,
  ipAddress: `192.168.1.${i % 255}`,
  timestamp: new Date(Date.now() - i * 3600000).toISOString(),
  status: Math.random() > 0.1 ? 'success' : 'failure'
}));

export default function AuditLogsPage() {
  const [logs] = useState<AuditLogEntry[]>(MOCK_LOGS);
  const [filter, setFilter] = useState('');

  const filteredLogs = logs.filter(log =>
    log.userName.toLowerCase().includes(filter.toLowerCase()) ||
    log.action.toLowerCase().includes(filter.toLowerCase()) ||
    log.resource.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Audit Logs</h2>
          <p className="text-muted-foreground">
            View system activity and security events.
          </p>
        </div>
        <Button variant="outline">
          <Download className="mr-2 h-4 w-4" /> Export Logs
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>System Activity</CardTitle>
          <CardDescription>
            Comprehensive log of all user actions.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center py-4 space-x-2">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search logs..."
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="pl-8"
              />
            </div>
            <Button variant="outline" size="icon">
              <Filter className="h-4 w-4" />
            </Button>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Resource</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>IP Address</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="font-mono text-xs">
                      {new Date(log.timestamp).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{log.userName}</div>
                      <div className="text-xs text-muted-foreground">{log.userId}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="uppercase text-xs">
                        {log.action}
                      </Badge>
                    </TableCell>
                    <TableCell className="capitalize">{log.resource}</TableCell>
                    <TableCell>
                      <Badge variant={log.status === 'success' ? 'success' : 'destructive'}>
                        {log.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {log.ipAddress}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
