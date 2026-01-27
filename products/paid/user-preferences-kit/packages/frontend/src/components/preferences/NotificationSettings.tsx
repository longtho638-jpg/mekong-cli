
'use client';

import React from 'react';
import { PreferenceRenderer } from './PreferencePanel';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export const NotificationSettings = () => {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Notifications</CardTitle>
                <CardDescription>Manage how we communicate with you.</CardDescription>
            </CardHeader>
            <CardContent>
                <PreferenceRenderer category="notifications" />
            </CardContent>
        </Card>
    );
};
