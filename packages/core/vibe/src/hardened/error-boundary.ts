// Simple console logger fallback if @mekong/shared is not available
const logger = {
    error: (message: string, context?: unknown) => {
        console.error(message, context);
    }
};

/**
 * 🛡️ VIBE Hardened - Error Boundary Patterns
 */
export interface ErrorState {
    hasError: boolean;
    error?: Error;
    errorInfo?: string;
    timestamp: Date;
}

export function createErrorState(error: Error): ErrorState {
    return {
        hasError: true,
        error,
        errorInfo: error.stack,
        timestamp: new Date(),
    };
}

export function logError(error: ErrorState): void {
    logger.error(`[VIBE Error] ${error.error?.message}`, {
        stack: error.errorInfo,
        timestamp: error.timestamp.toISOString(),
    });
}
