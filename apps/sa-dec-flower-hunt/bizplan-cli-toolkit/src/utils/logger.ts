/**
 * Structured Logger
 */

export enum LogLevel {
    DEBUG = 'DEBUG',
    INFO = 'INFO',
    WARN = 'WARN',
    ERROR = 'ERROR'
}

export class Logger {
    private static instance: Logger;
    private level: LogLevel = LogLevel.INFO;

    static getInstance(): Logger {
        if (!Logger.instance) {
            Logger.instance = new Logger();
        }
        return Logger.instance;
    }

    setLevel(level: LogLevel): void {
        this.level = level;
    }

    debug(message: string, meta?: any): void {
        if (this.shouldLog(LogLevel.DEBUG)) {
            console.log(`🔍 [DEBUG] ${message}`, meta || '');
        }
    }

    info(message: string, meta?: any): void {
        if (this.shouldLog(LogLevel.INFO)) {
            console.log(`ℹ️  [INFO] ${message}`, meta || '');
        }
    }

    warn(message: string, meta?: any): void {
        if (this.shouldLog(LogLevel.WARN)) {
            console.warn(`⚠️  [WARN] ${message}`, meta || '');
        }
    }

    error(message: string, error?: Error): void {
        if (this.shouldLog(LogLevel.ERROR)) {
            console.error(`❌ [ERROR] ${message}`, error || '');
        }
    }

    private shouldLog(level: LogLevel): boolean {
        const levels = [LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR];
        return levels.indexOf(level) >= levels.indexOf(this.level);
    }
}

export const logger = Logger.getInstance();
