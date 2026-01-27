
'use client';

import React from 'react';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { usePreferences } from '@/context/PreferenceContext';
import { PreferenceSchema } from '@antigravity/preferences-types';

interface ColorPickerProps {
    preferenceKey: string;
    label: string;
    description?: string;
}

export const ColorPicker = ({ preferenceKey, label, description }: ColorPickerProps) => {
    const { preferences, updatePreference } = usePreferences();
    const value = (preferences[preferenceKey] as string) || '#000000';

    return (
        <div className="flex items-center justify-between py-4">
             <div className="space-y-0.5">
              <Label htmlFor={preferenceKey} className="text-base">{label}</Label>
              {description && <p className="text-sm text-muted-foreground">{description}</p>}
            </div>
            <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full border border-gray-200 overflow-hidden relative">
                    <input
                        type="color"
                        id={preferenceKey}
                        value={value}
                        onChange={(e) => updatePreference(preferenceKey, e.target.value)}
                        className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[150%] h-[150%] p-0 border-0 cursor-pointer"
                    />
                </div>
                <span className="text-sm font-mono text-muted-foreground">{value}</span>
            </div>
        </div>
    );
};
