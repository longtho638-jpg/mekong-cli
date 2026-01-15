import { type ClassValue, clsx } from 'clsx';

/* =====================================================
   Utility: cn (className merger)
   Pure clsx implementation - no tailwind-merge needed
   ===================================================== */

export function cn(...inputs: ClassValue[]) {
    return clsx(inputs);
}
