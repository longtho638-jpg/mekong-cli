import * as ccxt from 'ccxt';
import { IDataProvider } from '../interfaces/IDataProvider';
import { ICandle } from '../interfaces/ICandle';
import { logger } from '../utils/logger';

/**
 * LiveDataProvider — Fetches real OHLCV data from exchanges via CCXT.
 * 
 * Replaces MockDataProvider for production use.
 * Uses REST polling (CCXT fetchOHLCV) with configurable interval.
 * 
 * Pattern inspired by freqtrade's DataProvider:
 * - init() loads markets
 * - getHistory() fetches historical candles
 * - start() begins polling loop
 * - subscribe() pushes new candles to listeners
 */
export class LiveDataProvider implements IDataProvider {
    private exchange: ccxt.Exchange;
    private symbol: string;
    private timeframe: string;
    private pollIntervalMs: number;
    private subscribers: ((candle: ICandle) => void)[] = [];
    private pollTimer: NodeJS.Timeout | null = null;
    private isRunning = false;
    private lastTimestamp = 0;

    constructor(
        exchangeId: string,
        symbol: string,
        timeframe: string = '1h',
        pollIntervalMs: number = 60000,
        apiKey?: string,
        secret?: string
    ) {
        const ExchangeClass = (ccxt as Record<string, any>)[exchangeId];
        if (!ExchangeClass) {
            throw new Error(`Exchange '${exchangeId}' not found in CCXT`);
        }

        this.exchange = new ExchangeClass({
            apiKey,
            secret,
            enableRateLimit: true,
            options: { defaultType: 'spot' },
        });

        this.symbol = symbol;
        this.timeframe = timeframe;
        this.pollIntervalMs = pollIntervalMs;
    }

    async init(): Promise<void> {
        logger.info(`LiveDataProvider: Connecting to ${this.exchange.id}...`);
        await this.exchange.loadMarkets();
        const marketCount = Object.keys(this.exchange.markets).length;
        logger.info(`LiveDataProvider: Loaded ${marketCount} markets. Tracking ${this.symbol} @ ${this.timeframe}`);
    }

    subscribe(callback: (candle: ICandle) => void): void {
        this.subscribers.push(callback);
    }

    async getHistory(limit: number): Promise<ICandle[]> {
        logger.info(`LiveDataProvider: Fetching ${limit} ${this.timeframe} candles for ${this.symbol}...`);
        const ohlcv = await this.exchange.fetchOHLCV(this.symbol, this.timeframe, undefined, limit);

        return ohlcv.map((candle) => ({
            timestamp: candle[0] as number,
            open: candle[1] as number,
            high: candle[2] as number,
            low: candle[3] as number,
            close: candle[4] as number,
            volume: candle[5] as number,
        }));
    }

    async start(): Promise<void> {
        if (this.isRunning) return;
        this.isRunning = true;

        // Seed lastTimestamp from most recent candle
        const recent = await this.getHistory(1);
        if (recent.length > 0) {
            this.lastTimestamp = recent[0].timestamp;
        }

        logger.info(`LiveDataProvider: Polling started (every ${this.pollIntervalMs / 1000}s)`);

        this.pollTimer = setInterval(async () => {
            try {
                await this.poll();
            } catch (error: unknown) {
                logger.error(`LiveDataProvider: Poll error — ${error instanceof Error ? error.message : String(error)}`);
            }
        }, this.pollIntervalMs);
    }

    async stop(): Promise<void> {
        if (this.pollTimer) {
            clearInterval(this.pollTimer);
            this.pollTimer = null;
        }
        this.isRunning = false;
        logger.info('LiveDataProvider: Stopped');
    }

    private async poll(): Promise<void> {
        const ohlcv = await this.exchange.fetchOHLCV(this.symbol, this.timeframe, undefined, 5);

        for (const raw of ohlcv) {
            const ts = raw[0] as number;
            if (ts > this.lastTimestamp) {
                const candle: ICandle = {
                    timestamp: ts,
                    open: raw[1] as number,
                    high: raw[2] as number,
                    low: raw[3] as number,
                    close: raw[4] as number,
                    volume: raw[5] as number,
                };
                this.lastTimestamp = ts;
                this.notifySubscribers(candle);
            }
        }
    }

    private notifySubscribers(candle: ICandle): void {
        for (const sub of this.subscribers) {
            // Wrap in Promise.resolve to handle both sync and async subscribers
            Promise.resolve(sub(candle)).catch((error: unknown) => {
                if (error instanceof Error) {
                    logger.error(`LiveDataProvider: Subscriber error — ${error.message}`);
                } else {
                    logger.error(`LiveDataProvider: Subscriber error — ${String(error)}`);
                }
            });
        }
    }
}
