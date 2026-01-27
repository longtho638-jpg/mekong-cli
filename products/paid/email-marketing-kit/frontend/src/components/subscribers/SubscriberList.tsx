import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Trash, UserCheck, UserX } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';

type Subscriber = {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  status: string;
  created_at: string;
};

export default function SubscriberList() {
  const { data: subscribers, isLoading } = useQuery({
    queryKey: ['subscribers'],
    queryFn: async () => {
      // Mock data
      return [
        {
          id: 1,
          email: 'alice@example.com',
          first_name: 'Alice',
          last_name: 'Smith',
          status: 'active',
          created_at: new Date().toISOString(),
        },
        {
          id: 2,
          email: 'bob@example.com',
          first_name: 'Bob',
          last_name: 'Johnson',
          status: 'unsubscribed',
          created_at: new Date(Date.now() - 86400000).toISOString(),
        }
      ] as Subscriber[];
    }
  });

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Subscribers</h1>
          <p className="text-muted-foreground mt-2">
            Manage your audience and contacts.
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Subscriber
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Subscribers</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-4">Loading...</div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-md border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="p-4 text-left font-medium">Name</th>
                      <th className="p-4 text-left font-medium">Email</th>
                      <th className="p-4 text-left font-medium">Status</th>
                      <th className="p-4 text-left font-medium">Joined</th>
                      <th className="p-4 text-right font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {subscribers?.map((sub) => (
                      <tr key={sub.id} className="border-b last:border-0 hover:bg-muted/50">
                        <td className="p-4">
                          {sub.first_name} {sub.last_name}
                        </td>
                        <td className="p-4">{sub.email}</td>
                        <td className="p-4">
                          <span className={cn(
                            "inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ring-1 ring-inset",
                            sub.status === 'active'
                              ? "bg-green-50 text-green-700 ring-green-600/20"
                              : "bg-red-50 text-red-700 ring-red-600/20"
                          )}>
                            {sub.status === 'active' ? <UserCheck className="mr-1 h-3 w-3" /> : <UserX className="mr-1 h-3 w-3" />}
                            {sub.status}
                          </span>
                        </td>
                        <td className="p-4 text-muted-foreground">
                          {format(new Date(sub.created_at), 'MMM d, yyyy')}
                        </td>
                        <td className="p-4 text-right">
                          <Button variant="ghost" size="icon" className="text-destructive">
                            <Trash className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Helper util (duplicated from utils.ts but needed if not imported)
import { cn } from '@/lib/utils';
