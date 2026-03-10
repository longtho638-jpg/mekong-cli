import * as fs from 'fs';
import * as path from 'path';
import { IOrder } from '../interfaces/IExchange';

import { logger } from '../utils/logger';

export class OrderManager {
  private orders: IOrder[] = [];
  private readonly storagePath: string;

  constructor() {
    this.storagePath = path.resolve(process.cwd(), 'data/orders.json');
    this.ensureDirectoryExists();
    this.loadOrders();
  }

  private ensureDirectoryExists() {
    const dir = path.dirname(this.storagePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  private loadOrders() {
    if (fs.existsSync(this.storagePath)) {
      try {
        const data = fs.readFileSync(this.storagePath, 'utf8');
        const parsed = JSON.parse(data);
        if (!Array.isArray(parsed)) {
          throw new Error('Orders file corrupted: expected array');
        }
        this.orders = parsed;
        logger.info(`[OrderManager] Loaded ${this.orders.length} orders from storage.`);
      } catch (error) {
        logger.error(`[OrderManager] Failed to load orders: ${error instanceof Error ? error.message : String(error)}`);
        // Backup corrupted file, start fresh
        const backupPath = this.storagePath + '.corrupted.' + Date.now();
        try {
          fs.renameSync(this.storagePath, backupPath);
          logger.warn(`[OrderManager] Corrupted file backed up to ${backupPath}`);
        } catch { /* ignore backup failure */ }
        this.orders = [];
      }
    }
  }

  private saveOrders() {
    try {
      // Atomic write: write to temp file then rename to prevent corruption
      const tmpPath = this.storagePath + '.tmp';
      fs.writeFileSync(tmpPath, JSON.stringify(this.orders, null, 2));
      fs.renameSync(tmpPath, this.storagePath);
    } catch (error) {
      logger.error(`[OrderManager] Failed to save orders: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  addOrder(order: IOrder) {
    this.orders.push(order);
    this.saveOrders();
    logger.info(`[OrderManager] Order added: ${order.side.toUpperCase()} ${order.amount} @ ${order.price}`);
  }

  getOrders(): IOrder[] {
    return this.orders;
  }

  getOpenOrders(): IOrder[] {
    return this.orders.filter(o => o.status === 'open');
  }

  getLastOrder(): IOrder | undefined {
    return this.orders[this.orders.length - 1];
  }

  /**
   * Add arbitrage trade (buy + sell order pair)
   * Logs both legs as single atomic event
   */
  addArbTrade(buyOrder: IOrder, sellOrder: IOrder): void {
    this.orders.push(buyOrder, sellOrder);
    this.saveOrders();
    logger.info(
      `[OrderManager] Arb trade: BUY ${buyOrder.amount} @ ${buyOrder.price} on ${buyOrder.symbol} | ` +
      `SELL ${sellOrder.amount} @ ${sellOrder.price}`
    );
  }
}
