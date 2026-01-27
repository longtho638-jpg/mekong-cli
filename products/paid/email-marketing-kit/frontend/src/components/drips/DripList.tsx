import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '@/lib/api';
import { format } from 'date-fns';

export default function DripList() {
  const [drips, setDrips] = useState<any[]>([]);

  useEffect(() => {
    fetchDrips();
  }, []);

  const fetchDrips = async () => {
    try {
      const response = await api.get('/drips');
      setDrips(response.data);
    } catch (error) {
      console.error('Failed to fetch drip campaigns', error);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Drip Campaigns</h1>
          <p className="text-muted-foreground mt-2">
            Automated sequences triggered by user actions.
          </p>
        </div>
        <Link to="/drips/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create Drip
          </Button>
        </Link>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Trigger</TableHead>
              <TableHead>Steps</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {drips.map((drip) => (
              <TableRow key={drip.id}>
                <TableCell className="font-medium">{drip.name}</TableCell>
                <TableCell>
                  <Badge variant="outline">{drip.trigger_type}</Badge>
                </TableCell>
                <TableCell>{drip.steps?.length || 0}</TableCell>
                <TableCell>
                  <Badge variant={drip.status === 'active' ? 'default' : 'secondary'}>
                    {drip.status}
                  </Badge>
                </TableCell>
                <TableCell>{format(new Date(drip.created_at), 'MMM d, yyyy')}</TableCell>
              </TableRow>
            ))}
            {drips.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                  No drip campaigns found. Create one to get started.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
