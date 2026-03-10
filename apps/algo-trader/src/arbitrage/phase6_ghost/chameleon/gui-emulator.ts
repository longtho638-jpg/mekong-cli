/**
 * GUI Emulator — simulates browser interactions (login, balance check)
 * to mimic human behavior. In production, uses Puppeteer; in test/sim,
 * just logs actions.
 */

export interface GuiAction {
  type: 'login' | 'balanceCheck' | 'pageView' | 'scroll';
  url?: string;
  timestamp: number;
  durationMs: number;
}

export class GuiEmulator {
  private actionLog: GuiAction[] = [];
  private maxLogSize = 200;
  private enabled: boolean;

  constructor(enabled = false) {
    this.enabled = enabled;
  }

  /** Simulate a login action */
  async simulateLogin(exchangeUrl: string): Promise<GuiAction> {
    const action: GuiAction = {
      type: 'login',
      url: exchangeUrl,
      timestamp: Date.now(),
      durationMs: 2000 + Math.random() * 3000, // 2-5s like a human
    };

    if (this.enabled) {
      // In production: would use Puppeteer to actually navigate
      await this.simulateDelay(action.durationMs);
    }

    this.log(action);
    return action;
  }

  /** Simulate checking account balance via web GUI */
  async simulateBalanceCheck(exchangeUrl: string): Promise<GuiAction> {
    const action: GuiAction = {
      type: 'balanceCheck',
      url: `${exchangeUrl}/account/balance`,
      timestamp: Date.now(),
      durationMs: 1500 + Math.random() * 2000, // 1.5-3.5s
    };

    if (this.enabled) {
      await this.simulateDelay(action.durationMs);
    }

    this.log(action);
    return action;
  }

  /** Simulate page browsing */
  async simulatePageView(url: string): Promise<GuiAction> {
    const action: GuiAction = {
      type: 'pageView',
      url,
      timestamp: Date.now(),
      durationMs: 3000 + Math.random() * 5000, // 3-8s reading
    };

    if (this.enabled) {
      await this.simulateDelay(action.durationMs);
    }

    this.log(action);
    return action;
  }

  private async simulateDelay(ms: number): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, Math.min(ms, 100)));
  }

  private log(action: GuiAction): void {
    this.actionLog.push(action);
    if (this.actionLog.length > this.maxLogSize) {
      this.actionLog.shift();
    }
  }

  getActionLog(): GuiAction[] {
    return [...this.actionLog];
  }

  getActionCount(): number {
    return this.actionLog.length;
  }

  isEnabled(): boolean {
    return this.enabled;
  }
}
