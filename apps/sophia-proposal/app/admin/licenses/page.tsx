'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Key, Trash2, RotateCcw, Activity, Users, DollarSign } from 'lucide-react';

interface License {
  id: string;
  key: string;
  tier: 'FREE' | 'PRO' | 'ENTERPRISE';
  status: 'active' | 'revoked' | 'expired';
  createdAt: string;
  expiresAt?: string;
  usageCount: number;
  lastUsed?: string;
}

const MOCK_LICENSES: License[] = [
  {
    id: '1',
    key: 'raas-pro-abc123xyz',
    tier: 'PRO',
    status: 'active',
    createdAt: '2026-03-01',
    expiresAt: '2027-03-01',
    usageCount: 142,
    lastUsed: '2026-03-12',
  },
  {
    id: '2',
    key: 'raas-ent-premium456',
    tier: 'ENTERPRISE',
    status: 'active',
    createdAt: '2026-02-15',
    expiresAt: '2027-12-31',
    usageCount: 856,
    lastUsed: '2026-03-12',
  },
  {
    id: '3',
    key: 'raas-free-test789',
    tier: 'FREE',
    status: 'revoked',
    createdAt: '2026-01-10',
    usageCount: 23,
    lastUsed: '2026-02-28',
  },
];

export default function AdminLicensesPage() {
  const [licenses, setLicenses] = useState<License[]>(MOCK_LICENSES);
  const [selectedTier, setSelectedTier] = useState<string>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newLicenseTier, setNewLicenseTier] = useState<'PRO' | 'ENTERPRISE'>('PRO');

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
    const newLicense: License = {
      id: String(Date.now()),
      key: `raas-${newLicenseTier.toLowerCase()}-${Math.random().toString(36).slice(2, 12)}`,
      tier: newLicenseTier,
      status: 'active',
      createdAt: new Date().toISOString().split('T')[0],
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      usageCount: 0,
    };
    setLicenses([newLicense, ...licenses]);
    setShowCreateModal(false);
  }

  function handleRevoke(id: string) {
    setLicenses(licenses.map(l =>
      l.id === id ? { ...l, status: 'revoked' as const } : l
    ));
  }

  function handleDelete(id: string) {
    setLicenses(licenses.filter(l => l.id !== id));
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
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create License
            </Button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="max-w-7xl mx-auto px-6 py-6">
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
                  <TableHead>Created</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead>Usage</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLicenses.map((license) => (
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
                      <Badge variant={license.status === 'active' ? 'default' : 'destructive'}>
                        {license.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{license.createdAt}</TableCell>
                    <TableCell>{license.expiresAt || 'Never'}</TableCell>
                    <TableCell>{license.usageCount}</TableCell>
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
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
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
