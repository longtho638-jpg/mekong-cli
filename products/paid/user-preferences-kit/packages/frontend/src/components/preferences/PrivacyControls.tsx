
'use client';

import React from 'react';
import { PreferenceRenderer } from './PreferencePanel';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export const PrivacyControls = () => {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Privacy & Security</CardTitle>
                <CardDescription>Control your data privacy and security settings.</CardDescription>
            </CardHeader>
            <CardContent>
                <PreferenceRenderer category="privacy" />
            </CardContent>
        </Card>
    );
};
