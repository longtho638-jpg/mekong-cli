
'use client';

import React from 'react';
import { PreferenceRenderer } from './PreferencePanel';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export const LanguageSelect = () => {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Language & Region</CardTitle>
                <CardDescription>Select your preferred language and regional settings.</CardDescription>
            </CardHeader>
            <CardContent>
                {/*
                  Note: In a real app, you might filter by 'localization' category if you added it to schema.
                  For now, we'll assume 'language' is in 'appearance' or a separate category.
                  Let's assume we want to show specific keys or just the 'language' key if it exists.
                */}
                <PreferenceRenderer category="appearance" />
                {/* Re-using appearance for now as language is there in default schema */}
            </CardContent>
        </Card>
    );
};
