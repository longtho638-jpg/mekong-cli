import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';

export default function TemplateCreate() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Success",
      description: "Template saved successfully.",
    });
    navigate('/templates');
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">New Template</h1>
        <p className="text-muted-foreground mt-2">
          Design a reusable email template.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Template Editor</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSave} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Template Name</Label>
                <Input id="name" placeholder="e.g. Welcome Email" required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="content">HTML Content</Label>
                <Textarea
                  id="content"
                  placeholder="<html>...</html>"
                  className="min-h-[400px] font-mono"
                  required
                />
              </div>

              <div className="flex justify-end gap-4 pt-4">
                <Button type="button" variant="outline" onClick={() => navigate('/templates')}>
                  Cancel
                </Button>
                <Button type="submit">Save Template</Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card className="hidden lg:block">
          <CardHeader>
            <CardTitle>Live Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="border rounded-md h-[600px] bg-white p-4">
              <div className="prose max-w-none">
                <h1 className="text-2xl font-bold mb-4">Preview Area</h1>
                <p className="text-muted-foreground">
                  The rendered HTML will appear here as you type.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
