'use client';

import React from 'react';
import { useAuth } from '../../lib/auth-context';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Key, Loader2, AlertTriangle } from 'lucide-react';

interface AuthGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * AuthGuard Component
 *
 * Protects admin routes by requiring valid license authentication.
 * Shows loading state while checking auth, fallback if not authenticated,
 * or children content if authenticated.
 *
 * @example
 * ```tsx
 * <AuthGuard>
 *   <AdminLicensesPage />
 * </AuthGuard>
 * ```
 */
export function AuthGuard({ children, fallback }: AuthGuardProps) {
  const { isAuthenticated, isLoading, error } = useAuth();

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-[400px]">
          <CardHeader className="text-center">
            <Key className="h-12 w-12 text-primary mx-auto mb-4" />
            <CardTitle>Verifying License</CardTitle>
            <CardDescription>
              Checking authentication status...
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center py-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state
  if (error || !isAuthenticated) {
    // Use custom fallback if provided
    if (fallback) {
      return <>{fallback}</>;
    }

    // Default fallback - license required message
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-[500px]">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="p-4 rounded-full bg-destructive/10">
                <AlertTriangle className="h-12 w-12 text-destructive" />
              </div>
            </div>
            <CardTitle className="text-xl">Authentication Required</CardTitle>
            <CardDescription>
              A valid license key is required to access the admin panel
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted p-4 rounded-lg">
              <p className="text-sm text-muted-foreground mb-2">
                {error || 'No active license found'}
              </p>
              <p className="text-xs text-muted-foreground">
                Please ensure you have an active license key to continue.
              </p>
            </div>
            <div className="flex gap-2 justify-center">
              <Button
                variant="outline"
                onClick={() => window.location.href = '/'}
              >
                Return Home
              </Button>
              <Button
                variant="primary"
                onClick={() => window.location.reload()}
              >
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Authenticated - render children
  return <>{children}</>;
}
