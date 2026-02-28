/**
 * @agencyos/vibe-auth — Provider-Agnostic Auth SDK
 *
 * Reusable across all RaaS projects.
 * Route guards, auto-logout, admin checks — framework-independent.
 *
 * Usage:
 *   import { evaluateRouteGuard, checkAdminAccess } from '@agencyos/vibe-auth';
 *   const verdict = evaluateRouteGuard(config, user, isAuthenticated);
 *   const isAdmin = checkAdminAccess(user, adminEmails);
 */

// Re-export all types
export type {
  AuthProviderName,
  VibeAuthUser,
  VibeAuthResult,
  VibeAuthError,
  VibeAuthState,
  VibeAuthSession,
  AuthEventType,
  VibeAuthEvent,
  AuthEventCallback,
  RouteGuardVerdict,
  RouteGuardConfig,
  AutoLogoutConfig,
  AdminCheckConfig,
  VibeAuthProvider,
} from './types';

// Auth guard utilities
export {
  evaluateRouteGuard,
  createAutoLogoutController,
  checkAdminAccess,
} from './auth-guard-utils';
