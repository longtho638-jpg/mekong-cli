import { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';
import { Trash, Plus, Clock, Mail } from 'lucide-react';
import api from '@/lib/api';

const stepSchema = z.object({
  action_type: z.enum(['email', 'delay']),
  delay_seconds: z.coerce.number().min(0).optional(),
  template_id: z.string().optional(),
  subject: z.string().optional(),
});

const formSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  trigger_type: z.enum(['signup', 'tag_added', 'manual']),
  steps: z.array(stepSchema),
});

export default function DripCreate() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [templates, setTemplates] = useState<any[]>([]);

  useEffect(() => {
    api.get('/templates').then((res) => setTemplates(res.data));
  }, []);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      trigger_type: 'signup',
      steps: [
        { action_type: 'delay', delay_seconds: 0 },
        { action_type: 'email' }
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "steps"
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      const payload = {
        ...values,
        steps: values.steps.map((step, index) => ({
          ...step,
          step_order: index + 1,
          template_id: step.template_id ? parseInt(step.template_id) : undefined,
        }))
      };

      await api.post('/drips', payload);

      toast({
        title: "Success",
        description: "Drip campaign created successfully.",
      });
      navigate('/drips');
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create drip campaign.",
        variant: "destructive",
      });
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Create Drip Campaign</h1>
        <p className="text-muted-foreground mt-2">
          Build an automated sequence.
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Campaign Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Campaign Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Welcome Series" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="trigger_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Trigger</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select trigger" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="signup">On Signup</SelectItem>
                        <SelectItem value="tag_added">On Tag Added</SelectItem>
                        <SelectItem value="manual">Manual Enrollment</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      When should subscribers enter this sequence?
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Sequence Steps</h2>
              <Button type="button" variant="outline" size="sm" onClick={() => append({ action_type: 'email' })}>
                <Plus className="h-4 w-4 mr-2" /> Add Step
              </Button>
            </div>

            {fields.map((field, index) => (
              <Card key={field.id}>
                <CardContent className="pt-6 relative">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 text-muted-foreground hover:text-destructive"
                    onClick={() => remove(index)}
                  >
                    <Trash className="h-4 w-4" />
                  </Button>

                  <div className="flex gap-2 mb-4">
                    <Badge variant="outline" className="h-6">Step {index + 1}</Badge>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name={`steps.${index}.action_type`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Action Type</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="email">
                                <span className="flex items-center"><Mail className="w-4 h-4 mr-2" /> Send Email</span>
                              </SelectItem>
                              <SelectItem value="delay">
                                <span className="flex items-center"><Clock className="w-4 h-4 mr-2" /> Wait / Delay</span>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {form.watch(`steps.${index}.action_type`) === 'delay' ? (
                      <FormField
                        control={form.control}
                        name={`steps.${index}.delay_seconds`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Wait Time (Seconds)</FormLabel>
                            <FormControl>
                              <Input type="number" {...field} />
                            </FormControl>
                            <FormDescription>
                              Use 86400 for 1 day.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    ) : (
                      <FormField
                        control={form.control}
                        name={`steps.${index}.template_id`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email Template</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select template" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {templates.map((t) => (
                                  <SelectItem key={t.id} value={t.id.toString()}>{t.name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" onClick={() => navigate('/drips')}>
              Cancel
            </Button>
            <Button type="submit">Create Sequence</Button>
          </div>
        </form>
      </Form>
    </div>
  );
}

function Badge({ children, variant, className }: any) {
    return <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${className} ${variant === 'outline' ? 'text-foreground' : 'bg-primary text-primary-foreground'}`}>{children}</span>
}
