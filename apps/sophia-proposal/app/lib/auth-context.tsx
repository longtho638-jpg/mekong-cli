'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { LicenseService } from './license-service';
import type { License } from './license-types';

/**
 * Authentication Context for SOPHIA Admin Routes
 *
 * Provides license-based authentication state management for protecting
 * admin routes in the static export Next.js application.
 */

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  license: License | null;
  error: string | null;
}

interface AuthContextType extends AuthState {
  validateLicense: (licenseKey: string) => Promise<boolean>;
  logout: () => void;
  refreshLicense: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * AuthProvider Component
 *
 * Provides authentication context for the application.
 * License validation is done client-side using LicenseService.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    isAuthenticated: false,
    isLoading: true,
    license: null,
    error: null,
  });

  /**
   * Validate a license key
   */
  const validateLicense = useCallback(async (licenseKey: string): Promise<boolean> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // Check all licenses for matching key
      const allLicenses = LicenseService.getAll();
      const matched = allLicenses.find(
        l => (l.metadata?.licenseKey as string) === licenseKey
      );

      if (!matched) {
        setState({
          isAuthenticated: false,
          isLoading: false,
          license: null,
          error: 'Invalid license key',
        });
        return false;
      }

      if (matched.status !== 'active') {
        setState({
          isAuthenticated: false,
          isLoading: false,
          license: null,
          error: `License is ${matched.status}`,
        });
        return false;
      }

      setState({
        isAuthenticated: true,
        isLoading: false,
        license: matched,
        error: null,
      });

      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Validation failed';
      setState({
        isAuthenticated: false,
        isLoading: false,
        license: null,
        error: errorMessage,
      });
      return false;
    }
  }, []);

  /**
   * Logout - clear auth state
   */
  const logout = useCallback(() => {
    setState({
      isAuthenticated: false,
      isLoading: false,
      license: null,
      error: null,
    });
  }, []);

  /**
   * Refresh license data from service
   */
  const refreshLicense = useCallback(() => {
    if (!state.license) return;

    try {
      const refreshed = LicenseService.getById(state.license.id);
      if (refreshed) {
        setState(prev => ({
          ...prev,
          license: refreshed,
          isAuthenticated: refreshed.status === 'active',
        }));
      }
    } catch {
      // License no longer valid, logout
      logout();
    }
  }, [state.license, logout]);

  // Initial load - check if any active license exists
  useEffect(() => {
    try {
      const allLicenses = LicenseService.getAll();
      const activeLicense = allLicenses.find(l => l.status === 'active');

      setState({
        isAuthenticated: !!activeLicense,
        isLoading: false,
        license: activeLicense || null,
        error: null,
      });
    } catch {
      setState({
        isAuthenticated: false,
        isLoading: false,
        license: null,
        error: 'Failed to load license',
      });
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        ...state,
        validateLicense,
        logout,
        refreshLicense,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

/**
 * useAuth Hook
 *
 * Access authentication state and methods from any component.
 * Must be used within AuthProvider.
 */
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}
