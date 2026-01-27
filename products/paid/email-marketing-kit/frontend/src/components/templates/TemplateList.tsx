import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Copy, Trash } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';

type Template = {
  id: number;
  name: string;
  created_at: string;
};

export default function TemplateList() {
  const { data: templates, isLoading } = useQuery({
    queryKey: ['templates'],
    queryFn: async () => {
      // Mock data
      return [
        { id: 1, name: 'Welcome Email', created_at: new Date().toISOString() },
        { id: 2, name: 'Monthly Newsletter', created_at: new Date().toISOString() },
        { id: 3, name: 'Password Reset', created_at: new Date().toISOString() }
      ] as Template[];
    }
  });

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Templates</h1>
          <p className="text-muted-foreground mt-2">
            Create and manage email templates.
          </p>
        </div>
        <Button asChild>
          <Link to="/templates/new">
            <Plus className="mr-2 h-4 w-4" />
            Create Template
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          <div>Loading...</div>
        ) : (
          templates?.map((template) => (
            <Card key={template.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle>{template.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-100 rounded-md h-[150px] mb-4 flex items-center justify-center text-muted-foreground text-sm">
                  Preview Unavailable
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" size="sm">
                    <Copy className="mr-2 h-3 w-3" />
                    Duplicate
                  </Button>
                  <Button variant="ghost" size="sm" className="text-destructive">
                    <Trash className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
