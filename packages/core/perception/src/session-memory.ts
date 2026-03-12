import * as fs from 'fs/promises';
import * as path from 'path';

export interface SessionContext {
  sessionId: string;
  startTime: number;
  lastActive: number;
  environment: {
    cwd: string;
    user: string;
    platform: string;
  };
  shortTermMemory: string[]; // Recent prompts/responses
  longTermMemory: Record<string, unknown>; // Key-value store for facts
}

export class SessionMemory {
  private memoryPath: string;
  private currentSession: SessionContext | null = null;

  constructor(storageDir: string) {
    this.memoryPath = path.join(storageDir, 'sessions.json');
  }

  async initSession(sessionId: string = 'default'): Promise<SessionContext> {
    const sessions = await this.loadSessions();
    
    if (sessions[sessionId]) {
      this.currentSession = sessions[sessionId];
      this.currentSession!.lastActive = Date.now();
    } else {
      this.currentSession = {
        sessionId,
        startTime: Date.now(),
        lastActive: Date.now(),
        environment: {
          cwd: process.cwd(),
          user: process.env.USER || 'unknown',
          platform: process.platform
        },
        shortTermMemory: [],
        longTermMemory: {}
      };
      sessions[sessionId] = this.currentSession;
    }
    
    await this.saveSessions(sessions);
    return this.currentSession!;
  }

  async addShortTerm(entry: string): Promise<void> {
    if (!this.currentSession) throw new Error('No active session');
    
    this.currentSession.shortTermMemory.push(entry);
    // Keep last 50 entries
    if (this.currentSession.shortTermMemory.length > 50) {
      this.currentSession.shortTermMemory.shift();
    }
    this.currentSession.lastActive = Date.now();
    await this.sync();
  }

  async setFact(key: string, value: unknown): Promise<void> {
    if (!this.currentSession) throw new Error('No active session');

    this.currentSession.longTermMemory[key] = value;
    this.currentSession.lastActive = Date.now();
    await this.sync();
  }

  async getFact(key: string): Promise<unknown> {
    if (!this.currentSession) throw new Error('No active session');
    return this.currentSession.longTermMemory[key];
  }

  private async sync(): Promise<void> {
    if (!this.currentSession) return;
    const sessions = await this.loadSessions();
    sessions[this.currentSession.sessionId] = this.currentSession;
    await this.saveSessions(sessions);
  }

  private async loadSessions(): Promise<Record<string, SessionContext>> {
    try {
      const content = await fs.readFile(this.memoryPath, 'utf-8');
      return JSON.parse(content);
    } catch {
      return {};
    }
  }

  private async saveSessions(sessions: Record<string, SessionContext>): Promise<void> {
    await fs.mkdir(path.dirname(this.memoryPath), { recursive: true });
    await fs.writeFile(this.memoryPath, JSON.stringify(sessions, null, 2));
  }
}
