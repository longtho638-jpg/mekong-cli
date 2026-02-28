/**
 * Vibe Auth SDK — Route Guard & Auto-Logout Utilities
 *
 * Reusable auth guards for route protection and session timeout.
 * Provider-agnostic: works with any VibeAuthProvider implementation.
 */

import type {
  RouteGuardConfig,
  RouteGuardVerdict,
  AutoLogoutConfig,
  VibeAuthUser,
} from './types';

// ─── Default Configs ────────────────────────────────────────────

const DEFAULT_AUTO_LOGOUT: AutoLogoutConfig = {
  inactivityLimitMs: 30 * 60 * 1000, // 30 minutes
  checkIntervalMs: 60 * 1000,         // 1 minute
  trackedEvents: ['mousedown', 'keydown', 'scroll', 'touchstart', 'mousemove'],
};

// ─── Route Guard Logic ──────────────────────────────────────────

/**
 * Evaluate whether a user passes a route guard.
 * Pure function — no side effects, no React dependency.
 */
export function evaluateRouteGuard(
  config: RouteGuardConfig,
  user: VibeAuthUser | null,
  isAuthenticated: boolean,
): RouteGuardVerdict {
  if (config.requireAuth && !isAuthenticated) {
    return 'redirect-login';
  }

  if (config.requiredRoles && config.requiredRoles.length > 0 && user) {
    const userRole = user.role ?? '';
    const hasRole = config.requiredRoles.includes(userRole) || user.isAdmin === true;
    if (!hasRole) {
      return 'redirect-unauthorized';
    }
  }

  return 'allow';
}

// ─── Auto-Logout Controller ─────────────────────────────────────

/**
 * Creates an auto-logout controller that tracks user activity
 * and triggers logout after inactivity period.
 *
 * Returns start/stop functions for lifecycle management.
 */
export function createAutoLogoutController(
  onLogout: () => void,
  config: Partial<AutoLogoutConfig> = {},
) {
  const mergedConfig: AutoLogoutConfig = { ...DEFAULT_AUTO_LOGOUT, ...config };
  let lastActivity = Date.now();
  let intervalId: ReturnType<typeof setInterval> | undefined;
  let throttleTimeout: ReturnType<typeof setTimeout> | undefined;

  const updateActivity = () => {
    lastActivity = Date.now();
  };

  const handleActivity = () => {
    if (!throttleTimeout) {
      updateActivity();
      throttleTimeout = setTimeout(() => {
        throttleTimeout = undefined;
      }, 1000);
    }
  };

  const checkInactivity = () => {
    const elapsed = Date.now() - lastActivity;
    if (elapsed >= mergedConfig.inactivityLimitMs) {
      stop();
      onLogout();
    }
  };

  const start = () => {
    lastActivity = Date.now();
    const events = mergedConfig.trackedEvents ?? DEFAULT_AUTO_LOGOUT.trackedEvents!;
    events.forEach(event => window.addEventListener(event, handleActivity));
    intervalId = setInterval(checkInactivity, mergedConfig.checkIntervalMs);
  };

  const stop = () => {
    const events = mergedConfig.trackedEvents ?? DEFAULT_AUTO_LOGOUT.trackedEvents!;
    events.forEach(event => window.removeEventListener(event, handleActivity));
    if (intervalId) clearInterval(intervalId);
    if (throttleTimeout) clearTimeout(throttleTimeout);
    intervalId = undefined;
    throttleTimeout = undefined;
  };

  return { start, stop };
}

// ─── Admin Check ────────────────────────────────────────────────

/**
 * Check if a user has admin privileges.
 * Checks email whitelist + role fields.
 */
export function checkAdminAccess(
  user: VibeAuthUser | null,
  adminEmails: string[] = [],
): boolean {
  if (!user) return false;

  const email = user.email?.toLowerCase().trim();
  if (email && adminEmails.some(ae => ae.toLowerCase().trim() === email)) {
    return true;
  }

  if (user.isAdmin === true) return true;
  if (user.role === 'admin' || user.role === 'super_admin') return true;

  return false;
}
