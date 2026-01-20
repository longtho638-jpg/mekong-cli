/**
 * 🛡️ VIBE Hardened - Skeleton Loading
 */
export type SkeletonVariant = 'text' | 'circular' | 'rectangular' | 'card';

export interface SkeletonProps {
    variant: SkeletonVariant;
    width?: string | number;
    height?: string | number;
    animation?: 'pulse' | 'wave' | 'none';
}

export const skeletonStyles: Record<SkeletonVariant, string> = {
    text: 'h-4 rounded bg-gray-200 animate-pulse',
    circular: 'rounded-full bg-gray-200 animate-pulse',
    rectangular: 'rounded-md bg-gray-200 animate-pulse',
    card: 'rounded-lg bg-gray-200 animate-pulse p-4',
};
