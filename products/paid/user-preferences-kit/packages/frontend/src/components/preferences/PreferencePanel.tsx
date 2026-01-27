
'use client';

import React from 'react';
import { usePreferences } from '@/context/PreferenceContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { PreferenceSchema } from '@antigravity/preferences-types';
import { ColorPicker } from './ColorPicker';

export const PreferenceRenderer = ({ category }: { category?: string }) => {
  const { preferences, schema, updatePreference, loading } = usePreferences();

  if (loading) return <div>Loading preferences...</div>;

  const filteredSchema = category
    ? schema.filter((s) => s.category === category)
    : schema;

  if (filteredSchema.length === 0) {
    return <div className="text-muted-foreground p-4">No preferences found for this category.</div>;
  }

  const renderControl = (item: PreferenceSchema) => {
    const value = preferences[item.key] ?? item.defaultValue;

    // Special check for color type if we added it to schema (or simulate for demo)
    // Since our mock schema has basic types, we'll check logic or type
    if (item.key.includes('color') || item.type === 'string' && item.key.includes('theme.custom')) {
         return <ColorPicker key={item.key} preferenceKey={item.key} label={item.label} description={item.description} />
    }

    switch (item.type) {
      case 'boolean':
        return (
          <div className="flex items-center justify-between py-4" key={item.key}>
            <div className="space-y-0.5">
              <Label htmlFor={item.key} className="text-base">{item.label}</Label>
              {item.description && <p className="text-sm text-muted-foreground">{item.description}</p>}
            </div>
            <Switch
              id={item.key}
              checked={value as boolean}
              onCheckedChange={(checked) => updatePreference(item.key, checked)}
            />
          </div>
        );

      case 'enum':
        return (
          <div className="space-y-2 py-4" key={item.key}>
             <div className="space-y-0.5">
              <Label htmlFor={item.key} className="text-base">{item.label}</Label>
              {item.description && <p className="text-sm text-muted-foreground">{item.description}</p>}
            </div>
            <Select
              value={value as string}
              onValueChange={(val) => updatePreference(item.key, val)}
            >
              <SelectTrigger id={item.key}>
                <SelectValue placeholder={`Select ${item.label}`} />
              </SelectTrigger>
              <SelectContent>
                {item.options?.map((opt) => (
                  <SelectItem key={String(opt.value)} value={String(opt.value)}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );

      case 'string':
         // Default to simple input for strings if not enum
         return (
             <div className="space-y-2 py-4" key={item.key}>
               <div className="space-y-0.5">
                <Label htmlFor={item.key} className="text-base">{item.label}</Label>
                {item.description && <p className="text-sm text-muted-foreground">{item.description}</p>}
              </div>
              <input
                id={item.key}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={value as string}
                onChange={(e) => updatePreference(item.key, e.target.value)}
              />
            </div>
         );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-2">
      {filteredSchema.map(renderControl)}
    </div>
  );
};

export const PreferencePanel = ({ title = 'Preferences', description }: { title?: string, description?: string }) => {
  const { exportPreferences, importPreferences, resetToDefaults } = usePreferences();
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      importPreferences(file);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
            <div>
                <CardTitle>{title}</CardTitle>
                {description && <CardDescription>{description}</CardDescription>}
            </div>
            <div className="flex gap-2">
                 <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                    accept=".json"
                 />
                <Button variant="outline" size="sm" onClick={handleImportClick}>Import</Button>
                <Button variant="outline" size="sm" onClick={exportPreferences}>Export</Button>
            </div>
        </div>
      </CardHeader>
      <CardContent>
         {/* We can group by category here or just render all */}
         <div className="divide-y">
            <PreferenceRenderer />
         </div>
      </CardContent>
      <CardFooter>
          <Button variant="destructive" size="sm" onClick={resetToDefaults}>Reset to Defaults</Button>
      </CardFooter>
    </Card>
  )
}
