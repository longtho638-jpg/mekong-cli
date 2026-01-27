
'use client';

import React from 'react';
import { PreferenceProvider } from '@/context/PreferenceContext';
import { PreferencePanel } from '@/components/preferences/PreferencePanel';
import { ThemeToggle } from '@/components/preferences/ThemeToggle';
import { NotificationSettings } from '@/components/preferences/NotificationSettings';
import { PrivacyControls } from '@/components/preferences/PrivacyControls';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function Home() {
  return (
    <PreferenceProvider>
      <main className="min-h-screen p-8 md:p-24 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-50">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold tracking-tight">User Preferences Kit</h1>
            <p className="text-lg text-muted-foreground">
              A comprehensive solution for managing user preferences with real-time sync.
            </p>
          </div>

          <Tabs defaultValue="all" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="all">All Settings</TabsTrigger>
              <TabsTrigger value="appearance">Appearance</TabsTrigger>
              <TabsTrigger value="notifications">Notifications</TabsTrigger>
              <TabsTrigger value="privacy">Privacy</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="mt-6">
               <PreferencePanel title="Global Settings" description="Manage all your application preferences in one place." />
            </TabsContent>

            <TabsContent value="appearance" className="mt-6">
              <ThemeToggle />
            </TabsContent>

            <TabsContent value="notifications" className="mt-6">
              <NotificationSettings />
            </TabsContent>

            <TabsContent value="privacy" className="mt-6">
              <PrivacyControls />
            </TabsContent>
          </Tabs>

        </div>
      </main>
    </PreferenceProvider>
  );
}
