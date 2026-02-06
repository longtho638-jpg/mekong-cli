import fs from 'fs/promises';
import path from 'path';

export interface AuditLogEntry {
  timestamp: string;
  action: string;
  payload: any;
}

export class AuditLogger {
  private logFilePath: string;

  constructor(logFilePath: string) {
    this.logFilePath = logFilePath;
  }

  /**
   * Appends a log entry to the JSONL file.
   */
  public async log(action: string, payload: any): Promise<void> {
    const entry: AuditLogEntry = {
      timestamp: new Date().toISOString(),
      action,
      payload
    };

    const line = JSON.stringify(entry) + '\n';

    // Ensure directory exists
    const dir = path.dirname(this.logFilePath);
    try {
      await fs.access(dir);
    } catch {
      await fs.mkdir(dir, { recursive: true });
    }

    await fs.appendFile(this.logFilePath, line, 'utf-8');
  }

  /**
   * Reads the last N lines from the log file.
   * Note: This is a simple implementation. For large files, use a proper reverse reader.
   */
  public async getRecentLogs(limit: number = 50): Promise<AuditLogEntry[]> {
    try {
      await fs.access(this.logFilePath);
      const content = await fs.readFile(this.logFilePath, 'utf-8');
      const lines = content.trim().split('\n');

      return lines
        .slice(-limit)
        .map(line => {
          try {
            return JSON.parse(line);
          } catch {
            return null;
          }
        })
        .filter((entry): entry is AuditLogEntry => entry !== null)
        .reverse();
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return [];
      }
      throw error;
    }
  }
}
