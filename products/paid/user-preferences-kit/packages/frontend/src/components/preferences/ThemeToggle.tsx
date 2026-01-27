
'use client';

import React from 'react';
import { PreferenceRenderer } from './PreferencePanel';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export const ThemeToggle = () => {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Appearance</CardTitle>
                <CardDescription>Customize how the app looks on your device.</CardDescription>
            </CardHeader>
            <CardContent>
                <PreferenceRenderer category="appearance" />
            </CardContent>
        </Card>
    );
};
