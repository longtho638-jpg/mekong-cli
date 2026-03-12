'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/Table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/Select';
import { Plus, Key, Trash2, RotateCcw, Activity, Users, DollarSign, Loader2, AlertTriangle } from 'lucide-react';
import { LicenseService } from '../../lib/license-service';
import { UsageMetering } from '../../lib/usage-metering';
import type { License as ServiceLicense } from '../../lib/license-types';

interface License {
  id: string;
  key: string;
  tier: 'FREE' | 'PRO' | 'ENTERPRISE' | 'MASTER';
  status: 'active' | 'revoked' | 'expired';
  createdAt: string;
  expiresAt?: string;
  usageCount: number;
  lastUsed?: string;
  subscriptionId?: string;
  subscriptionStatus?: 'active' | 'cancelled' | 'uncancelled';
  usageStats?: {
    apiCallsPercent: number;
    transferMbPercent: number;
    status: 'normal' | 'warning' | 'critical' | 'exceeded';
  };
}

// Convert service license to UI license
function toUiLicense(license: ServiceLicense): License {
  const usageStats = UsageMetering.getUsageStats(license.id);

  return {
    id: license.id,
    key: (license.metadata?.licenseKey as string) || `raas-${license.tier.toLowerCase()}-${license.id}`,
    tier: license.tier,
    status: license.status,
    createdAt: license.createdAt.toISOString().split('T')[0],
    expiresAt: license.expiresAt?.toISOString().split('T')[0],
    usageCount: Math.floor(Math.random() * 1000), // Mock usage for demo
    lastUsed: new Date().toISOString().split('T')[0],
    subscriptionId: license.subscriptionId,
    subscriptionStatus: license.subscriptionStatus,
    usageStats: {
      apiCallsPercent: usageStats.apiCalls.percent,
      transferMbPercent: usageStats.transferMb.percent,
      status: usageStats.status,
    },
  };
}

export default function AdminLicensesPage() {
  const [licenses, setLicenses] = useState<License[]>([]);
  const [selectedTier, setSelectedTier] = useState<string>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newLicenseTier, setNewLicenseTier] = useState<'PRO' | 'ENTERPRISE' | 'MASTER'>('PRO');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load licenses on mount
  useEffect(() => {
    setIsLoading(true);
    setError(null);
    try {
      const allLicenses = LicenseService.getAll();
      setLicenses(allLicenses.map(toUiLicense));
    } catch {
      setError('Failed to load licenses');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const filteredLicenses = selectedTier === 'all'
    ? licenses
    : licenses.filter(l => l.tier === selectedTier);

  const stats = {
    total: licenses.length,
    active: licenses.filter(l => l.status === 'active').length,
    revenue: licenses.filter(l => l.tier === 'ENTERPRISE').length * 499 +
             licenses.filter(l => l.tier === 'PRO').length * 149,
    usage: licenses.reduce((sum, l) => sum + l.usageCount, 0),
  };

  function handleCreateLicense() {
    try {
      const newLicense = LicenseService.create({
        tier: newLicenseTier,
        customerId: `cust_${Date.now()}`,
        customerName: 'New Customer',
        expiresInDays: 365,
      });
      setLicenses([toUiLicense(newLicense), ...licenses]);
      setShowCreateModal(false);
    } catch {
      setError('Failed to create license');
    }
  }

  function handleRevoke(id: string) {
    try {
      LicenseService.revoke(id);
      setLicenses(licenses.map(l =>
        l.id === id ? { ...l, status: 'revoked' as const } : l
      ));
    } catch {
      setError('Failed to revoke license');
    }
  }

  function handleDelete(id: string) {
    try {
      LicenseService.delete(id);
      setLicenses(licenses.filter(l => l.id !== id));
    } catch {
      setError('Failed to delete license');
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Key className="h-6 w-6 text-primary" />
              <div>
                <h1 className="text-2xl font-bold">License Management</h1>
                <p className="text-sm text-muted-foreground">
                  Sophia AI Video Engine — ROIaaS Phase 2
                </p>
              </div>
            </div>
            <Button onClick={() => setShowCreateModal(true)} disabled={isLoading}>
              <Plus className="h-4 w-4 mr-2" />
              Create License
            </Button>
          </div>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="bg-destructive/15 border border-destructive text-destructive px-4 py-3 rounded-md">
            {error}
            <Button
              variant="ghost"
              size="sm"
              className="ml-2"
              onClick={() => {
                setError(null);
                setIsLoading(true);
                const allLicenses = LicenseService.getAll();
                setLicenses(allLicenses.map(toUiLicense));
                setIsLoading(false);
              }}
            >
              Retry
            </Button>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2 text-muted-foreground">Loading licenses...</span>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Licenses</CardTitle>
                  <Key className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.total}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active</CardTitle>
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.active}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">${stats.revenue}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Usage</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.usage}</div>
                </CardContent>
              </Card>
            </div>

            {/* Filters */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Filter:</span>
                <Select value={selectedTier} onValueChange={setSelectedTier}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Tiers</SelectItem>
                    <SelectItem value="FREE">Free</SelectItem>
                    <SelectItem value="PRO">Pro</SelectItem>
                    <SelectItem value="ENTERPRISE">Enterprise</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* License Table */}
            <Card>
              <CardHeader>
                <CardTitle>License Keys</CardTitle>
                <CardDescription>
                  Manage API keys, track usage, and control access
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>License Key</TableHead>
                      <TableHead>Tier</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Subscription Status</TableHead>
                      <TableHead>Subscription ID</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Expires</TableHead>
                      <TableHead>Usage</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLicenses.map((license) => {
                      const maxPercent = Math.max(
                        license.usageStats?.apiCallsPercent || 0,
                        license.usageStats?.transferMbPercent || 0
                      );
                      const alertLevel = license.usageStats?.status || 'normal';
                      const showProgress = maxPercent > 0;

                      return (
                        <TableRow key={license.id}>
                          <TableCell className="font-mono text-sm">
                            {license.key.slice(0, 16)}...
                          </TableCell>
                          <TableCell>
                            <Badge variant={license.tier === 'ENTERPRISE' ? 'default' : 'secondary'}>
                              {license.tier}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Badge variant={license.status === 'active' ? 'default' : 'destructive'}>
                                {license.status}
                              </Badge>
                              {alertLevel === 'warning' && (
                                <AlertTriangle className="h-4 w-4 text-yellow-500" />
                              )}
                              {alertLevel === 'critical' && (
                                <AlertTriangle className="h-4 w-4 text-orange-500" />
                              )}
                              {alertLevel === 'exceeded' && (
                                <AlertTriangle className="h-4 w-4 text-red-500" />
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {license.subscriptionStatus ? (
                              <Badge
                                variant={
                                  license.subscriptionStatus === 'active'
                                    ? 'default'
                                    : license.subscriptionStatus === 'cancelled'
                                    ? 'destructive'
                                    : 'secondary'
                                }
                              >
                                {license.subscriptionStatus}
                              </Badge>
                            ) : (
                              <span className="text-xs text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          <TableCell className="font-mono text-xs">
                            {license.subscriptionId || (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          <TableCell>{license.createdAt}</TableCell>
                          <TableCell>{license.expiresAt || 'Never'}</TableCell>
                          <TableCell>
                            <div className="space-y-2">
                              <div className="text-xs text-muted-foreground">
                                {license.usageStats?.apiCallsPercent || 0}% API
                              </div>
                              {showProgress && (
                                <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full ${
                                      alertLevel === 'exceeded'
                                        ? 'bg-red-500'
                                        : alertLevel === 'critical'
                                        ? 'bg-orange-500'
                                        : alertLevel === 'warning'
                                        ? 'bg-yellow-500'
                                        : 'bg-green-500'
                                    }`}
                                    style={{ width: `${Math.min(100, maxPercent)}%` }}
                                  />
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              {license.status === 'active' && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleRevoke(license.id)}
                                >
                                  <RotateCcw className="h-4 w-4" />
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(license.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-[400px]">
            <CardHeader>
              <CardTitle>Create License Key</CardTitle>
              <CardDescription>Generate a new API license key</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Tier</label>
                <Select value={newLicenseTier} onValueChange={(v) => setNewLicenseTier(v as 'PRO' | 'ENTERPRISE')}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PRO">Pro ($149/mo)</SelectItem>
                    <SelectItem value="ENTERPRISE">Enterprise ($499/mo)</SelectItem>
                    <SelectItem value="MASTER">Master (Custom)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateLicense}>
                  Generate Key
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
