/**
 * 🛡️ VIBE Hardened - Production-Ready Patterns (Proxy)
 */
import hardened from './src/hardened/checklist';

export * from './src/hardened/skeleton';
export * from './src/hardened/error-boundary';
export * from './src/hardened/shortcuts';
export * from './src/hardened/deployment';
export * from './src/hardened/diagnostics';
export * from './src/hardened/checklist';

/** @deprecated Use src/hardened modules directly */
export const shortcuts = hardened.shortcuts;

export default hardened;
