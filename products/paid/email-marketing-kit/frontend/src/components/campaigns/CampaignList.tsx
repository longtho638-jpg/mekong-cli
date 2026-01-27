import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, MoreVertical, Pencil, Trash } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { format } from 'date-fns';

type Campaign = {
  id: number;
  name: string;
  subject: string;
  status: string;
  created_at: string;
  sent_count: number;
  open_count: number;
  click_count: number;
};

export default function CampaignList() {
  const { data: campaigns, isLoading } = useQuery({
    queryKey: ['campaigns'],
    queryFn: async () => {
      // In a real implementation, this would fetch from the API
      // const res = await api.get('/campaigns');
      // return res.data;

      // Returning mock data for now since backend might not be running or populated
      return [
        {
          id: 1,
          name: 'Welcome Series #1',
          subject: 'Welcome to our platform!',
          status: 'completed',
          created_at: new Date().toISOString(),
          sent_count: 1250,
          open_count: 450,
          click_count: 120,
        },
        {
          id: 2,
          name: 'March Newsletter',
          subject: 'Product updates and more',
          status: 'draft',
          created_at: new Date().toISOString(),
          sent_count: 0,
          open_count: 0,
          click_count: 0,
        }
      ] as Campaign[];
    }
  });

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Campaigns</h1>
          <p className="text-muted-foreground mt-2">
            Manage your email campaigns and newsletters.
          </p>
        </div>
        <Button asChild>
          <Link to="/campaigns/new">
            <Plus className="mr-2 h-4 w-4" />
            Create Campaign
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Campaigns</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-4">Loading...</div>
          ) : (
            <div className="space-y-4">
              {campaigns?.map((campaign) => (
                <div
                  key={campaign.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="grid gap-1">
                    <div className="font-semibold">{campaign.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {campaign.subject}
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                      <span className={
                        campaign.status === 'completed' ? 'text-green-600 font-medium' :
                        campaign.status === 'sending' ? 'text-blue-600 font-medium' :
                        'text-gray-600 font-medium'
                      }>
                        {campaign.status.toUpperCase()}
                      </span>
                      <span>Created {format(new Date(campaign.created_at), 'MMM d, yyyy')}</span>
                      {campaign.status === 'completed' && (
                        <>
                          <span>Sent: {campaign.sent_count}</span>
                          <span>Opens: {campaign.open_count}</span>
                          <span>Clicks: {campaign.click_count}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon">
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-destructive">
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
