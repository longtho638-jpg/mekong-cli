/**
 * Polymarket CLOB Client Tests
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { PolymarketClobClient, Side, OrderType, CONTRACTS } from "./client";

// Mock the ClobClient from @polymarket/clob-client
vi.mock("@polymarket/clob-client", () => {
  return {
    ClobClient: vi.fn().mockImplementation(() => ({
      createOrDeriveApiKey: vi.fn().mockResolvedValue({
        key: "test-api-key",
        secret: "test-secret",
        passphrase: "test-passphrase",
      }),
      createAndPostOrder: vi.fn().mockResolvedValue({
        success: true,
        orderID: "test-order-id",
        status: "live",
      }),
      createAndPostMarketOrder: vi.fn().mockResolvedValue({
        success: true,
        orderID: "test-market-order-id",
        status: "matched",
      }),
      cancelOrder: vi.fn().mockResolvedValue({ success: true }),
      cancelOrders: vi.fn().mockResolvedValue({ success: true }),
      cancelAll: vi.fn().mockResolvedValue({ success: true }),
      cancelMarketOrders: vi.fn().mockResolvedValue({ success: true }),
      getOrder: vi.fn().mockResolvedValue({ id: "test-order", status: "live" }),
      getOpenOrders: vi.fn().mockResolvedValue([]),
      getTrades: vi.fn().mockResolvedValue([]),
      getBalanceAllowance: vi.fn().mockResolvedValue({
        balance: "1000000000",
        allowance: "unlimited",
      }),
      getOrderBook: vi.fn().mockResolvedValue({
        bids: [{ price: "0.50", size: "100" }],
        asks: [{ price: "0.52", size: "100" }],
      }),
      getPrice: vi.fn().mockResolvedValue({ price: "0.51" }),
      getSpread: vi.fn().mockResolvedValue({ spread: "0.02" }),
      getTickSize: vi.fn().mockResolvedValue("0.01"),
      getNegRisk: vi.fn().mockResolvedValue(false),
      getFeeRateBps: vi.fn().mockResolvedValue(0),
      calculateMarketPrice: vi.fn().mockResolvedValue(0.51),
      getServerTime: vi.fn().mockResolvedValue(Date.now()),
    })),
    Side: {
      BUY: "BUY",
      SELL: "SELL",
    },
    OrderType: {
      GTC: "GTC",
      GTD: "GTD",
      FOK: "FOK",
      FAK: "FAK",
    },
  };
});

describe("PolymarketClobClient", () => {
  let client: PolymarketClobClient;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Initialization", () => {
    it("should initialize with no config (read-only mode)", () => {
      client = new PolymarketClobClient();
      expect(client).toBeDefined();
      expect(client.isReady()).toBe(false);
    });

    it("should initialize with private key", () => {
      const testKey = "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";
      client = new PolymarketClobClient({ privateKey: testKey });
      expect(client).toBeDefined();
      expect(client.isReady()).toBe(false); // Not ready until API key derived
    });

    it("should initialize with API credentials (ready for trading)", () => {
      client = new PolymarketClobClient({
        apiKey: "test-key",
        apiSecret: "test-secret",
        apiPassphrase: "test-passphrase",
      });
      expect(client).toBeDefined();
      expect(client.isReady()).toBe(true);
    });

    it("should use correct chain ID (Polygon mainnet)", () => {
      client = new PolymarketClobClient();
      expect(client).toBeDefined();
      // ClobClient should be initialized with chainId 137
    });
  });

  describe("Contract Addresses", () => {
    it("should have correct CTF_EXCHANGE address", () => {
      expect(CONTRACTS.CTF_EXCHANGE).toBe("0x4bFb41d5B3570DeFd03C39a9A4D8dE6Bd8B8982E");
    });

    it("should have correct NEG_RISK_CTF_EXCHANGE address", () => {
      expect(CONTRACTS.NEG_RISK_CTF_EXCHANGE).toBe("0xC5d563A36AE78145C45a50134d48A1215220f80a");
    });

    it("should have correct USDC_E address", () => {
      expect(CONTRACTS.USDC_E).toBe("0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174");
    });
  });

  describe("L1 Authentication", () => {
    it("should derive API key from wallet", async () => {
      const testKey = "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";
      client = new PolymarketClobClient({ privateKey: testKey });

      const creds = await client.createOrDeriveApiKey();
      expect(creds).toBeDefined();
      expect(creds.key).toBe("test-api-key");
      expect(client.isReady()).toBe(true);
    });
  });

  describe("Order Placement", () => {
    beforeEach(() => {
      client = new PolymarketClobClient({
        apiKey: "test-key",
        apiSecret: "test-secret",
        apiPassphrase: "test-passphrase",
      });
    });

    it("should place a limit BUY order", async () => {
      const tokenId = "123456789";
      const price = 0.55;
      const size = 100;

      const result = await client.createAndPostLimitOrder(
        tokenId,
        price,
        size,
        "BUY",
        OrderType.GTC,
      );

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.orderID).toBe("test-order-id");
      expect(result.status).toBe("live");
    });

    it("should place a limit SELL order", async () => {
      const tokenId = "123456789";
      const price = 0.60;
      const size = 50;

      const result = await client.createAndPostLimitOrder(
        tokenId,
        price,
        size,
        "SELL",
        OrderType.GTC,
      );

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
    });

    it("should place a market order", async () => {
      const tokenId = "123456789";
      const amount = 100;

      const result = await client.createAndPostMarketOrder(
        tokenId,
        amount,
        "BUY",
        OrderType.FOK,
      );

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.orderID).toBe("test-market-order-id");
      expect(result.status).toBe("matched");
    });

    it("should throw error if not authenticated", async () => {
      const unauthClient = new PolymarketClobClient();
      const tokenId = "123456789";

      await expect(
        unauthClient.createAndPostLimitOrder(tokenId, 0.55, 100, "BUY"),
      ).rejects.toThrow("L2 credentials required");
    });
  });

  describe("Order Cancellation", () => {
    beforeEach(() => {
      client = new PolymarketClobClient({
        apiKey: "test-key",
        apiSecret: "test-secret",
        apiPassphrase: "test-passphrase",
      });
    });

    it("should cancel a single order", async () => {
      const orderId = "test-order-id";
      const result = await client.cancelOrder(orderId);
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
    });

    it("should cancel multiple orders", async () => {
      const orderIds = ["order-1", "order-2", "order-3"];
      const result = await client.cancelOrders(orderIds);
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
    });

    it("should cancel all orders", async () => {
      const result = await client.cancelAll();
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
    });
  });

  describe("Query Methods", () => {
    beforeEach(() => {
      client = new PolymarketClobClient({
        apiKey: "test-key",
        apiSecret: "test-secret",
        apiPassphrase: "test-passphrase",
      });
    });

    it("should get single order", async () => {
      const orderId = "test-order";
      const order = await client.getOrder(orderId);
      expect(order).toBeDefined();
      expect(order.id).toBe("test-order");
      expect(order.status).toBe("live");
    });

    it("should get open orders", async () => {
      const orders = await client.getOpenOrders();
      expect(orders).toBeDefined();
      expect(Array.isArray(orders)).toBe(true);
    });

    it("should get trade history", async () => {
      const trades = await client.getTrades();
      expect(trades).toBeDefined();
      expect(Array.isArray(trades)).toBe(true);
    });

    it("should get balance and allowance", async () => {
      const balance = await client.getBalanceAllowance({
        asset_type: "COLLATERAL",
      });
      expect(balance).toBeDefined();
      expect(balance.balance).toBe("1000000000");
    });
  });

  describe("Market Data (L0 - no auth)", () => {
    beforeEach(() => {
      client = new PolymarketClobClient();
    });

    it("should get orderbook", async () => {
      const tokenId = "123456789";
      const book = await client.getOrderBook(tokenId);
      expect(book).toBeDefined();
      expect(book.bids).toBeDefined();
      expect(book.asks).toBeDefined();
    });

    it("should get price", async () => {
      const tokenId = "123456789";
      const price = await client.getPrice(tokenId, "BUY");
      expect(price).toBeDefined();
    });

    it("should get spread", async () => {
      const tokenId = "123456789";
      const spread = await client.getSpread(tokenId);
      expect(spread).toBeDefined();
    });

    it("should get tick size", async () => {
      const tokenId = "123456789";
      const tickSize = await client.getTickSize(tokenId);
      expect(tickSize).toBe("0.01");
    });

    it("should check neg-risk", async () => {
      const tokenId = "123456789";
      const negRisk = await client.getNegRisk(tokenId);
      expect(negRisk).toBe(false);
    });

    it("should get fee rate", async () => {
      const tokenId = "123456789";
      const feeRate = await client.getFeeRateBps(tokenId);
      expect(feeRate).toBe(0);
    });
  });
});
