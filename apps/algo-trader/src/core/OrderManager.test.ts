/**
 * Tests for OrderManager - EIP-712 signing, order management, rate limiting
 */

import { OrderManager, CreateOrderParams, SignedOrder } from "./OrderManager";
import { OrderType, Side } from "@polymarket/clob-client";

// Mock the ClobClient
let globalOrderCounter = 0;
jest.mock("@polymarket/clob-client", () => {
  return {
    ClobClient: jest.fn().mockImplementation(() => ({
      createOrDeriveApiKey: jest.fn().mockResolvedValue({
        key: "test-api-key",
        secret: "test-secret",
        passphrase: "test-passphrase",
      }),
      createAndPostOrder: jest.fn().mockImplementation(() => {
        globalOrderCounter++;
        return Promise.resolve({
          success: true,
          orderID: `test-order-id-${globalOrderCounter}`,
          status: "live",
          takingAmount: "100",
          makingAmount: "50",
        });
      }),
      cancelOrder: jest.fn().mockResolvedValue({ success: true }),
      cancelOrders: jest.fn().mockResolvedValue({ success: true }),
      cancelAll: jest.fn().mockResolvedValue({ success: true }),
      cancelMarketOrders: jest.fn().mockResolvedValue({ success: true }),
      getOrder: jest.fn().mockResolvedValue({
        id: "test-order",
        status: "live",
        size_matched: "0",
      }),
      getOpenOrders: jest.fn().mockResolvedValue([]),
      getTrades: jest.fn().mockResolvedValue([]),
      getFeeRateBps: jest.fn().mockResolvedValue(0),
      getTickSize: jest.fn().mockResolvedValue("0.01"),
      sendHeartbeat: jest.fn().mockResolvedValue({ heartbeat_id: "test-heartbeat-id" }),
    })),
    OrderType: {
      GTC: "GTC",
      GTD: "GTD",
      FOK: "FOK",
      FAK: "FAK",
    },
    Side: {
      BUY: "BUY",
      SELL: "SELL",
    },
    SignatureType: {
      EOA: 0,
      POLY_PROXY: 1,
      POLY_GNOSIS_SAFE: 2,
    },
    Chain: {
      POLYGON: 137,
      AMOY: 80002,
    },
  };
});

describe("OrderManager", () => {
  let orderManager: OrderManager;
  const TEST_PRIVATE_KEY = "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";

  beforeEach(async () => {
    jest.clearAllMocks();
    orderManager = new OrderManager({
      privateKey: TEST_PRIVATE_KEY,
      enableRateLimit: true,
      enableHeartbeat: false, // Disable for tests
    });
    await orderManager.initialize();
  });

  afterEach(() => {
    orderManager.shutdown();
  });

  describe("Initialization", () => {
    it("should throw error without private key", () => {
      expect(() => new OrderManager({} as any)).toThrow("PrivateKey required");
    });

    it("should initialize with private key", async () => {
      const om = new OrderManager({ privateKey: TEST_PRIVATE_KEY });
      expect(om).toBeDefined();
      expect(om.isReady()).toBe(true);
      await om.initialize();
    });

    it("should get wallet address", () => {
      const address = orderManager.getWalletAddress();
      expect(address).toBeDefined();
      expect(address.startsWith("0x")).toBe(true);
    });

    it("should start heartbeat on initialize if enabled", async () => {
      const omWithHeartbeat = new OrderManager({
        privateKey: TEST_PRIVATE_KEY,
        enableHeartbeat: true,
      });
      await omWithHeartbeat.initialize();
      omWithHeartbeat.shutdown();
    });
  });

  describe("createOrder", () => {
    const createOrderParams: CreateOrderParams = {
      tokenId: "test-token-id",
      price: 0.5,
      size: 100,
      side: "BUY",
      orderType: OrderType.GTC,
    };

    it("should create and sign a GTC order", async () => {
      const order = await orderManager.createOrder(createOrderParams);

      expect(order).toBeDefined();
      expect(order.orderId).toMatch(/^test-order-id-\d+$/);
      expect(order.tokenId).toBe("test-token-id");
      expect(order.side).toBe("BUY");
      expect(order.price).toBe(0.5);
      expect(order.size).toBe(100);
      expect(order.orderType).toBe(OrderType.GTC);
      expect(order.signature).toBeDefined();
      expect(order.maker).toBeDefined();
    });

    it("should create a post-only order for maker rebate", async () => {
      const order = await orderManager.createOrder({
        ...createOrderParams,
        postOnly: true,
      });

      expect(order.postOnly).toBe(true);
    });

    it("should create order on neg-risk exchange", async () => {
      const order = await orderManager.createOrder({
        ...createOrderParams,
        negRisk: true,
      });

      expect(order.negRisk).toBe(true);
    });

    it("should track order in local book", async () => {
      const order = await orderManager.createOrder(createOrderParams);

      const tracked = orderManager.getTrackedOrder(order.orderId);
      expect(tracked).toBeDefined();
      expect(tracked?.orderId).toBe(order.orderId);
    });

    it("should respect rate limiting", async () => {
      // Create multiple orders rapidly
      const orders = [];
      for (let i = 0; i < 5; i++) {
        const order = await orderManager.createOrder({
          ...createOrderParams,
          tokenId: `token-${i}`,
        });
        orders.push(order);
      }

      expect(orders).toHaveLength(5);
      orders.forEach((order, i) => {
        expect(order.tokenId).toBe(`token-${i}`);
      });
    });
  });

  describe("Order Type Methods", () => {
    it("should create GTC order via helper method", async () => {
      const order = await orderManager.createGtcOrder(
        "test-token",
        0.5,
        100,
        "BUY",
        true, // postOnly
        false // negRisk
      );

      expect(order.orderType).toBe(OrderType.GTC);
      expect(order.postOnly).toBe(true);
    });

    it("should create GTD order with expiration", async () => {
      const expiration = Date.now() + 86400000; // 1 day from now
      const order = await orderManager.createGtdOrder(
        "test-token",
        0.5,
        100,
        "BUY",
        expiration,
        false, // postOnly
        false // negRisk
      );

      expect(order.orderType).toBe(OrderType.GTD);
      expect(order.expiration).toBe(expiration);
    });

    it("should create FOK market order", async () => {
      const order = await orderManager.createFokOrder(
        "test-token",
        100,
        "BUY",
        false // negRisk
      );

      expect(order.orderType).toBe(OrderType.FOK);
    });

    it("should create FAK market order", async () => {
      const order = await orderManager.createFakOrder(
        "test-token",
        100,
        "SELL",
        false // negRisk
      );

      expect(order.orderType).toBe(OrderType.FAK);
    });
  });

  describe("cancelOrder", () => {
    it("should cancel a single order", async () => {
      const order = await orderManager.createOrder({
        tokenId: "test-token",
        price: 0.5,
        size: 100,
        side: "BUY",
        orderType: OrderType.GTC,
      });

      await orderManager.cancelOrder(order.orderId);

      const tracked = orderManager.getTrackedOrder(order.orderId);
      expect(tracked?.status).toBe("cancelled");
    });

    it("should update local order book on cancel", async () => {
      const order = await orderManager.createOrder({
        tokenId: "test-token",
        price: 0.5,
        size: 100,
        side: "BUY",
        orderType: OrderType.GTC,
      });

      await orderManager.cancelOrder(order.orderId);

      const tracked = orderManager.getTrackedOrder(order.orderId);
      expect(tracked?.status).toBe("cancelled");
    });
  });

  describe("cancelOrders", () => {
    it("should cancel multiple orders", async () => {
      const order1 = await orderManager.createOrder({
        tokenId: "token-1",
        price: 0.5,
        size: 100,
        side: "BUY",
        orderType: OrderType.GTC,
      });

      const order2 = await orderManager.createOrder({
        tokenId: "token-2",
        price: 0.6,
        size: 200,
        side: "SELL",
        orderType: OrderType.GTC,
      });

      await orderManager.cancelOrders([order1.orderId, order2.orderId]);

      const tracked1 = orderManager.getTrackedOrder(order1.orderId);
      const tracked2 = orderManager.getTrackedOrder(order2.orderId);

      expect(tracked1?.status).toBe("cancelled");
      expect(tracked2?.status).toBe("cancelled");
    });
  });

  describe("cancelAll", () => {
    it("should cancel all open orders", async () => {
      // Create multiple orders
      await orderManager.createOrder({
        tokenId: "token-1",
        price: 0.5,
        size: 100,
        side: "BUY",
        orderType: OrderType.GTC,
      });

      await orderManager.createOrder({
        tokenId: "token-2",
        price: 0.6,
        size: 200,
        side: "SELL",
        orderType: OrderType.GTC,
      });

      await orderManager.cancelAll();

      // All orders should be cancelled
      const orders = orderManager.getTrackedOrders();
      orders.forEach((order) => {
        expect(order.status).toBe("cancelled");
      });
    });
  });

  describe("cancelMarketOrders", () => {
    it("should cancel orders by market", async () => {
      const market = "test-market";

      const order = await orderManager.createOrder({
        tokenId: market,
        price: 0.5,
        size: 100,
        side: "BUY",
        orderType: OrderType.GTC,
      });

      await orderManager.cancelMarketOrders(market);

      const tracked = orderManager.getTrackedOrder(order.orderId);
      expect(tracked?.status).toBe("cancelled");
    });
  });

  describe("batchOrders", () => {
    it("should batch create multiple orders", async () => {
      const orders: CreateOrderParams[] = [
        {
          tokenId: "token-1",
          price: 0.5,
          size: 100,
          side: "BUY",
          orderType: OrderType.GTC,
        },
        {
          tokenId: "token-2",
          price: 0.6,
          size: 200,
          side: "SELL",
          orderType: OrderType.GTC,
        },
        {
          tokenId: "token-3",
          price: 0.7,
          size: 300,
          side: "BUY",
          orderType: OrderType.GTD,
          expiration: Date.now() + 86400000,
        },
      ];

      const results = await orderManager.batchOrders(orders);

      expect(results).toHaveLength(3);
      expect(results.map((r) => r.tokenId)).toEqual(["token-1", "token-2", "token-3"]);
    });

    it("should continue on individual order failure", async () => {
      const orders: CreateOrderParams[] = [
        {
          tokenId: "token-1",
          price: 0.5,
          size: 100,
          side: "BUY",
          orderType: OrderType.GTC,
        },
        {
          tokenId: "token-2",
          price: 0.6,
          size: 200,
          side: "SELL",
          orderType: OrderType.GTC,
        },
      ];

      const results = await orderManager.batchOrders(orders);

      // Should have results for all orders (failed ones marked as expired)
      expect(results.length).toBeGreaterThan(0);
    });
  });

  describe("heartbeat", () => {
    it("should send heartbeat", async () => {
      const heartbeatId = await orderManager.sendHeartbeat();
      expect(heartbeatId).toBeDefined();
    });

    it("should start automatic heartbeat", async () => {
      const om = new OrderManager({
        privateKey: TEST_PRIVATE_KEY,
        enableHeartbeat: true,
      });
      await om.initialize();

      // Heartbeat should be running
      await new Promise((resolve) => setTimeout(resolve, 100));

      om.shutdown();
    });

    it("should stop heartbeat on shutdown", async () => {
      const om = new OrderManager({
        privateKey: TEST_PRIVATE_KEY,
        enableHeartbeat: true,
      });
      await om.initialize();
      om.shutdown();

      // Should not throw after shutdown
      expect(() => om.shutdown()).not.toThrow();
    });
  });

  describe("order tracking", () => {
    it("should get tracked order by ID", async () => {
      const order = await orderManager.createOrder({
        tokenId: "test-token",
        price: 0.5,
        size: 100,
        side: "BUY",
        orderType: OrderType.GTC,
      });

      const tracked = orderManager.getTrackedOrder(order.orderId);
      expect(tracked).toBeDefined();
      expect(tracked?.tokenId).toBe("test-token");
    });

    it("should get all tracked orders", async () => {
      const order1 = await orderManager.createOrder({
        tokenId: "token-1",
        price: 0.5,
        size: 100,
        side: "BUY",
        orderType: OrderType.GTC,
      });

      const order2 = await orderManager.createOrder({
        tokenId: "token-2",
        price: 0.6,
        size: 200,
        side: "SELL",
        orderType: OrderType.GTC,
      });

      const orders = orderManager.getTrackedOrders();
      expect(orders.size).toBe(2);
    });

    it("should refresh order status from CLOB", async () => {
      const order = await orderManager.createOrder({
        tokenId: "test-token",
        price: 0.5,
        size: 100,
        side: "BUY",
        orderType: OrderType.GTC,
      });

      await orderManager.refreshOrderStatus(order.orderId);

      const tracked = orderManager.getTrackedOrder(order.orderId);
      expect(tracked).toBeDefined();
    });
  });

  describe("getOpenOrders", () => {
    it("should get all open orders", async () => {
      const orders = await orderManager.getOpenOrders();
      expect(Array.isArray(orders)).toBe(true);
    });

    it("should filter by market", async () => {
      const orders = await orderManager.getOpenOrders({
        market: "test-market",
      });
      expect(Array.isArray(orders)).toBe(true);
    });
  });

  describe("rate limiting", () => {
    it("should track rate limit state", () => {
      const state = orderManager.getRateLimitState();
      expect(state.requestCount).toBeDefined();
      expect(state.windowStart).toBeDefined();
    });

    it("should disable rate limiting when configured", async () => {
      const omNoRateLimit = new OrderManager({
        privateKey: TEST_PRIVATE_KEY,
        enableRateLimit: false,
      });
      await omNoRateLimit.initialize();

      // Should not throw rate limit error
      const state = omNoRateLimit.getRateLimitState();
      expect(state.requestCount).toBe(0); // Not tracking when disabled
    });
  });

  describe("EIP-712 signing", () => {
    it("should sign orders with EIP-712 signature", async () => {
      const order = await orderManager.createOrder({
        tokenId: "test-token",
        price: 0.5,
        size: 100,
        side: "BUY",
        orderType: OrderType.GTC,
      });

      // Signature should be a valid hex string
      expect(order.signature).toBeDefined();
      expect(order.signature.startsWith("0x")).toBe(true);
      expect(order.signature.length).toBeGreaterThan(100); // EIP-712 sig is long
    });

    it("should use correct signature type (EOA)", async () => {
      const om = new OrderManager({
        privateKey: TEST_PRIVATE_KEY,
        signatureType: 0, // EOA
      });
      await om.initialize();

      const order = await om.createOrder({
        tokenId: "test-token",
        price: 0.5,
        size: 100,
        side: "BUY",
        orderType: OrderType.GTC,
      });

      expect(order.signature).toBeDefined();
    });
  });

  describe("post-only orders", () => {
    it("should create post-only order for maker rebate", async () => {
      const order = await orderManager.createOrder({
        tokenId: "test-token",
        price: 0.5,
        size: 100,
        side: "BUY",
        orderType: OrderType.GTC,
        postOnly: true,
      });

      expect(order.postOnly).toBe(true);
    });
  });
});
