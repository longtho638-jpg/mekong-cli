/**
 * Tests: Quantum Internet Communication — Phase 11 Module 3.
 * Covers: QKD key generation, OTP encrypt/decrypt, eavesdropping detection,
 * key rotation, order relay, and initQuantumComm factory.
 */

import {
  QkdSimulator,
  OtpEncryptor,
  QuantumChannel,
  SecureOrderRelay,
  initQuantumComm,
} from '../../../src/arbitrage/phase11_hyperdimensional/quantumComm/index';

import type {
  QkdSimulatorConfig,
  KeyPair,
  OtpEncryptorConfig,
  EncryptResult,
  QuantumChannelConfig,
  TransmissionResult,
  SecureOrderRelayConfig,
  TradeOrder,
  RelayResult,
  QuantumCommConfig,
} from '../../../src/arbitrage/phase11_hyperdimensional/quantumComm/index';

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeOrder(overrides: Partial<TradeOrder> = {}): TradeOrder {
  return { symbol: 'BTC/USDT', side: 'buy', quantity: 1.5, price: 50_000, ...overrides };
}

function makeKey(size: number): Buffer {
  return Buffer.alloc(size, 0xab);
}

// ── QkdSimulator — generateKeyPair ────────────────────────────────────────────

describe('QkdSimulator — generateKeyPair', () => {
  it('returns localKey, remoteKey, and keyId', () => {
    const qkd = new QkdSimulator();
    const pair = qkd.generateKeyPair();
    expect(pair).toHaveProperty('localKey');
    expect(pair).toHaveProperty('remoteKey');
    expect(pair).toHaveProperty('keyId');
  });

  it('both keys are identical in value (simulated perfect QKD exchange)', () => {
    const pair = new QkdSimulator().generateKeyPair();
    expect(pair.localKey.equals(pair.remoteKey)).toBe(true);
  });

  it('both keys are independent Buffer instances', () => {
    const pair = new QkdSimulator().generateKeyPair();
    expect(pair.localKey).not.toBe(pair.remoteKey);
  });

  it('key length matches keyLengthBits / 8', () => {
    const pair = new QkdSimulator({ keyLengthBits: 512 }).generateKeyPair();
    expect(pair.localKey.length).toBe(64);
    expect(pair.remoteKey.length).toBe(64);
  });

  it('default key length is 32 bytes (256 bits)', () => {
    expect(new QkdSimulator().generateKeyPair().localKey.length).toBe(32);
  });

  it('keyId is a non-empty string', () => {
    const { keyId } = new QkdSimulator().generateKeyPair();
    expect(typeof keyId).toBe('string');
    expect(keyId.length).toBeGreaterThan(0);
  });

  it('successive keyIds are unique', () => {
    const qkd = new QkdSimulator();
    const ids = Array.from({ length: 5 }, () => qkd.generateKeyPair().keyId);
    expect(new Set(ids).size).toBe(5);
  });

  it('successive key bytes are different (random)', () => {
    const qkd = new QkdSimulator();
    const k1 = qkd.generateKeyPair().localKey;
    const k2 = qkd.generateKeyPair().localKey;
    expect(k1.equals(k2)).toBe(false);
  });

  it('throws when keyLengthBits is not a multiple of 8', () => {
    expect(() => new QkdSimulator({ keyLengthBits: 100, dryRun: true })).toThrow();
  });

  it('updates activeKeyId after generation', () => {
    const qkd = new QkdSimulator();
    const { keyId } = qkd.generateKeyPair();
    expect(qkd.getActiveKeyId()).toBe(keyId);
  });

  it('getKeyCount increments on each call', () => {
    const qkd = new QkdSimulator();
    qkd.generateKeyPair();
    qkd.generateKeyPair();
    expect(qkd.getKeyCount()).toBe(2);
  });
});

// ── QkdSimulator — rotateKey ──────────────────────────────────────────────────

describe('QkdSimulator — rotateKey', () => {
  it('returns a new key pair', () => {
    const qkd = new QkdSimulator();
    const first = qkd.generateKeyPair();
    const rotated = qkd.rotateKey();
    expect(rotated.keyId).not.toBe(first.keyId);
  });

  it('updates activeKeyId to new keyId', () => {
    const qkd = new QkdSimulator();
    qkd.generateKeyPair();
    const rotated = qkd.rotateKey();
    expect(qkd.getActiveKeyId()).toBe(rotated.keyId);
  });

  it('increments keyCount', () => {
    const qkd = new QkdSimulator();
    qkd.generateKeyPair(); // count = 1
    qkd.rotateKey();       // count = 2
    expect(qkd.getKeyCount()).toBe(2);
  });

  it('new key bytes differ from old key bytes', () => {
    const qkd = new QkdSimulator();
    const first = qkd.generateKeyPair().localKey;
    const rotated = qkd.rotateKey().localKey;
    // Probabilistically true — identical keys would be astronomically unlikely
    expect(first.equals(rotated)).toBe(false);
  });

  it('getConfig returns config snapshot', () => {
    const cfg = new QkdSimulator({ keyLengthBits: 128, dryRun: true }).getConfig();
    expect(cfg.keyLengthBits).toBe(128);
    expect(cfg.dryRun).toBe(true);
  });
});

// ── OtpEncryptor — encrypt / decrypt ─────────────────────────────────────────

describe('OtpEncryptor — encrypt', () => {
  it('returns ciphertext and authTag', () => {
    const enc = new OtpEncryptor();
    const pt = Buffer.from('hello world');
    const key = makeKey(pt.length);
    const result = enc.encrypt(pt, key);
    expect(result).toHaveProperty('ciphertext');
    expect(result).toHaveProperty('authTag');
  });

  it('ciphertext has same length as plaintext', () => {
    const enc = new OtpEncryptor();
    const pt = Buffer.from('test payload');
    const key = makeKey(pt.length);
    expect(enc.encrypt(pt, key).ciphertext.length).toBe(pt.length);
  });

  it('ciphertext differs from plaintext', () => {
    const enc = new OtpEncryptor();
    const pt = Buffer.from('some data here');
    const key = makeKey(pt.length);
    expect(enc.encrypt(pt, key).ciphertext.equals(pt)).toBe(false);
  });

  it('authTag is 32 bytes (HMAC-SHA256)', () => {
    const enc = new OtpEncryptor();
    const pt = Buffer.from('msg');
    const key = makeKey(pt.length + 10);
    expect(enc.encrypt(pt, key).authTag.length).toBe(32);
  });

  it('throws when key is shorter than plaintext', () => {
    const enc = new OtpEncryptor();
    const pt = Buffer.from('long plaintext here');
    const key = makeKey(4); // too short
    expect(() => enc.encrypt(pt, key)).toThrow();
  });

  it('accepts key longer than plaintext', () => {
    const enc = new OtpEncryptor();
    const pt = Buffer.from('hi');
    const key = makeKey(100);
    expect(() => enc.encrypt(pt, key)).not.toThrow();
  });

  it('same plaintext + key = deterministic ciphertext', () => {
    const enc = new OtpEncryptor();
    const pt = Buffer.from('deterministic');
    const key = makeKey(pt.length);
    const r1 = enc.encrypt(pt, key);
    const r2 = enc.encrypt(pt, key);
    expect(r1.ciphertext.equals(r2.ciphertext)).toBe(true);
    expect(r1.authTag.equals(r2.authTag)).toBe(true);
  });
});

describe('OtpEncryptor — decrypt roundtrip', () => {
  it('decrypt(encrypt(pt)) returns original plaintext', () => {
    const enc = new OtpEncryptor();
    const pt = Buffer.from('round trip test');
    const key = makeKey(pt.length);
    const { ciphertext, authTag } = enc.encrypt(pt, key);
    expect(enc.decrypt(ciphertext, key, authTag).equals(pt)).toBe(true);
  });

  it('decrypt with wrong authTag throws', () => {
    const enc = new OtpEncryptor();
    const pt = Buffer.from('message');
    const key = makeKey(pt.length);
    const { ciphertext } = enc.encrypt(pt, key);
    const badTag = Buffer.alloc(32, 0xff);
    expect(() => enc.decrypt(ciphertext, key, badTag)).toThrow();
  });

  it('decrypt with wrong key throws', () => {
    const enc = new OtpEncryptor();
    const pt = Buffer.from('message');
    const key = Buffer.alloc(pt.length, 0xab); // encrypt key: 0xab
    const { ciphertext, authTag } = enc.encrypt(pt, key);
    const wrongKey = Buffer.alloc(pt.length, 0xcd); // different key: 0xcd
    // Wrong key produces wrong HMAC → verification fails
    expect(() => enc.decrypt(ciphertext, wrongKey, authTag)).toThrow();
  });
});

describe('OtpEncryptor — verify', () => {
  it('returns true for valid tag', () => {
    const enc = new OtpEncryptor();
    const pt = Buffer.from('verify me');
    const key = makeKey(pt.length);
    const { ciphertext, authTag } = enc.encrypt(pt, key);
    expect(enc.verify(ciphertext, key, authTag)).toBe(true);
  });

  it('returns false for tampered ciphertext', () => {
    const enc = new OtpEncryptor();
    const pt = Buffer.from('verify me');
    const key = makeKey(pt.length);
    const { ciphertext, authTag } = enc.encrypt(pt, key);
    ciphertext[0] ^= 0xff; // flip bits
    expect(enc.verify(ciphertext, key, authTag)).toBe(false);
  });

  it('returns false for wrong tag length', () => {
    const enc = new OtpEncryptor();
    const pt = Buffer.from('x');
    const key = makeKey(pt.length);
    const { ciphertext } = enc.encrypt(pt, key);
    expect(enc.verify(ciphertext, key, Buffer.alloc(16, 0))).toBe(false);
  });

  it('getConfig returns config snapshot', () => {
    expect(new OtpEncryptor({ dryRun: false }).getConfig().dryRun).toBe(false);
  });
});

// ── QuantumChannel — send ─────────────────────────────────────────────────────

describe('QuantumChannel — send', () => {
  it('returns a TransmissionResult with required fields', () => {
    const ch = new QuantumChannel();
    const result = ch.send(Buffer.from('payload'), 'key-001');
    expect(result).toHaveProperty('channelId');
    expect(result).toHaveProperty('keyId');
    expect(result).toHaveProperty('transmitted');
    expect(result).toHaveProperty('eavesdroppingDetected');
    expect(result).toHaveProperty('timestamp');
  });

  it('transmitted is true when no eavesdropping', () => {
    expect(new QuantumChannel().send(Buffer.from('data'), 'kid').transmitted).toBe(true);
  });

  it('eavesdroppingDetected is false by default', () => {
    expect(new QuantumChannel().send(Buffer.from('data'), 'kid').eavesdroppingDetected).toBe(false);
  });

  it('keyId is echoed in result', () => {
    const result = new QuantumChannel().send(Buffer.from('x'), 'my-key-id');
    expect(result.keyId).toBe('my-key-id');
  });

  it('channelId is consistent across transmissions', () => {
    const ch = new QuantumChannel();
    const r1 = ch.send(Buffer.from('a'), 'k1');
    const r2 = ch.send(Buffer.from('b'), 'k2');
    expect(r1.channelId).toBe(r2.channelId);
  });

  it('timestamp is a recent millisecond timestamp', () => {
    const before = Date.now();
    const result = new QuantumChannel().send(Buffer.from('ts'), 'k');
    expect(result.timestamp).toBeGreaterThanOrEqual(before);
    expect(result.timestamp).toBeLessThanOrEqual(Date.now());
  });

  it('throws on empty payload without eavesdropping', () => {
    expect(() => new QuantumChannel().send(Buffer.alloc(0), 'k')).toThrow();
  });
});

// ── QuantumChannel — simulateEavesdropping ────────────────────────────────────

describe('QuantumChannel — simulateEavesdropping', () => {
  it('next send detects eavesdropping and fails transmission', () => {
    const ch = new QuantumChannel();
    ch.simulateEavesdropping();
    const result = ch.send(Buffer.from('intercepted'), 'k1');
    expect(result.eavesdroppingDetected).toBe(true);
    expect(result.transmitted).toBe(false);
  });

  it('eavesdropping flag resets after one transmission', () => {
    const ch = new QuantumChannel();
    ch.simulateEavesdropping();
    ch.send(Buffer.from('first'), 'k1'); // triggers + resets
    const second = ch.send(Buffer.from('second'), 'k2');
    expect(second.eavesdroppingDetected).toBe(false);
    expect(second.transmitted).toBe(true);
  });

  it('eavesdropping disabled when eavesdroppingDetection=false', () => {
    const ch = new QuantumChannel({ eavesdroppingDetection: false });
    ch.simulateEavesdropping();
    const result = ch.send(Buffer.from('data'), 'k');
    expect(result.eavesdroppingDetected).toBe(false);
    expect(result.transmitted).toBe(true);
  });

  it('getTransmissionLog returns all results', () => {
    const ch = new QuantumChannel();
    ch.send(Buffer.from('a'), 'k1');
    ch.send(Buffer.from('b'), 'k2');
    expect(ch.getTransmissionLog()).toHaveLength(2);
  });

  it('getTransmissionLog returns a copy (not mutating internal state)', () => {
    const ch = new QuantumChannel();
    ch.send(Buffer.from('msg'), 'k');
    const log = ch.getTransmissionLog();
    log.pop();
    expect(ch.getTransmissionLog()).toHaveLength(1);
  });

  it('getChannelId is a non-empty string', () => {
    expect(typeof new QuantumChannel().getChannelId()).toBe('string');
    expect(new QuantumChannel().getChannelId().length).toBeGreaterThan(0);
  });

  it('getConfig returns config snapshot', () => {
    const cfg = new QuantumChannel({ dryRun: false, eavesdroppingDetection: false }).getConfig();
    expect(cfg.dryRun).toBe(false);
    expect(cfg.eavesdroppingDetection).toBe(false);
  });
});

// ── SecureOrderRelay — relayOrder ─────────────────────────────────────────────

describe('SecureOrderRelay — relayOrder', () => {
  function makeRelayKey(order: TradeOrder): Buffer {
    const size = Buffer.byteLength(JSON.stringify(order), 'utf8');
    return Buffer.allocUnsafe(size).fill(0x37);
  }

  it('returns a RelayResult with required fields', () => {
    const relay = new SecureOrderRelay();
    const order = makeOrder();
    const key = makeRelayKey(order);
    const result = relay.relayOrder(order, key, 'kId-1');
    expect(result).toHaveProperty('relayId');
    expect(result).toHaveProperty('encrypted');
    expect(result).toHaveProperty('transmitted');
    expect(result).toHaveProperty('keyId');
    expect(result).toHaveProperty('timestamp');
  });

  it('encrypted is always true', () => {
    const relay = new SecureOrderRelay();
    const order = makeOrder();
    expect(relay.relayOrder(order, makeRelayKey(order), 'k').encrypted).toBe(true);
  });

  it('transmitted is true for normal relay', () => {
    const relay = new SecureOrderRelay();
    const order = makeOrder();
    expect(relay.relayOrder(order, makeRelayKey(order), 'k').transmitted).toBe(true);
  });

  it('keyId is echoed in result', () => {
    const relay = new SecureOrderRelay();
    const order = makeOrder();
    expect(relay.relayOrder(order, makeRelayKey(order), 'my-key').keyId).toBe('my-key');
  });

  it('relayId is unique per call', () => {
    const relay = new SecureOrderRelay();
    const order = makeOrder();
    const key = makeRelayKey(order);
    const r1 = relay.relayOrder(order, key, 'k');
    const r2 = relay.relayOrder(order, key, 'k');
    expect(r1.relayId).not.toBe(r2.relayId);
  });

  it('throws for empty symbol', () => {
    const relay = new SecureOrderRelay();
    const order = makeOrder({ symbol: '' });
    expect(() => relay.relayOrder(order, makeKey(128), 'k')).toThrow();
  });

  it('throws for invalid side', () => {
    const relay = new SecureOrderRelay();
    const order = makeOrder({ side: 'hold' as 'buy' });
    expect(() => relay.relayOrder(order, makeKey(128), 'k')).toThrow();
  });

  it('throws for quantity <= 0', () => {
    const relay = new SecureOrderRelay();
    expect(() => relay.relayOrder(makeOrder({ quantity: 0 }), makeKey(128), 'k')).toThrow();
  });

  it('throws for price <= 0', () => {
    const relay = new SecureOrderRelay();
    expect(() => relay.relayOrder(makeOrder({ price: -1 }), makeKey(128), 'k')).toThrow();
  });

  it('getRelayLog returns all relayed results', () => {
    const relay = new SecureOrderRelay();
    const order = makeOrder();
    const key = makeRelayKey(order);
    relay.relayOrder(order, key, 'k1');
    relay.relayOrder(order, key, 'k2');
    expect(relay.getRelayLog()).toHaveLength(2);
  });

  it('getRelayLog returns a copy', () => {
    const relay = new SecureOrderRelay();
    const order = makeOrder();
    relay.relayOrder(order, makeRelayKey(order), 'k');
    const log = relay.getRelayLog();
    log.pop();
    expect(relay.getRelayLog()).toHaveLength(1);
  });
});

// ── SecureOrderRelay — receiveOrder ───────────────────────────────────────────

describe('SecureOrderRelay — receiveOrder (encrypt/decrypt roundtrip)', () => {
  it('recovers original order after encrypt → relay → receive', () => {
    const enc = new OtpEncryptor();
    const relay = new SecureOrderRelay();
    const order = makeOrder();
    const pt = Buffer.from(JSON.stringify(order), 'utf8');
    const key = makeKey(pt.length);
    const { ciphertext, authTag } = enc.encrypt(pt, key);
    const recovered = relay.receiveOrder(ciphertext, key, authTag);
    expect(recovered.symbol).toBe(order.symbol);
    expect(recovered.side).toBe(order.side);
    expect(recovered.quantity).toBe(order.quantity);
    expect(recovered.price).toBe(order.price);
  });

  it('throws on tampered ciphertext', () => {
    const enc = new OtpEncryptor();
    const relay = new SecureOrderRelay();
    const pt = Buffer.from(JSON.stringify(makeOrder()), 'utf8');
    const key = makeKey(pt.length);
    const { ciphertext, authTag } = enc.encrypt(pt, key);
    ciphertext[0] ^= 0xff;
    expect(() => relay.receiveOrder(ciphertext, key, authTag)).toThrow();
  });
});

// ── initQuantumComm factory ───────────────────────────────────────────────────

describe('initQuantumComm factory', () => {
  it('returns all required component fields (short + full names)', () => {
    const qc = initQuantumComm();
    expect(qc.qkd).toBeInstanceOf(QkdSimulator);
    expect(qc.encryptor).toBeInstanceOf(OtpEncryptor);
    expect(qc.channel).toBeInstanceOf(QuantumChannel);
    expect(qc.relay).toBeInstanceOf(SecureOrderRelay);
    expect(qc.qkdSimulator).toBeInstanceOf(QkdSimulator);
    expect(qc.otpEncryptor).toBeInstanceOf(OtpEncryptor);
    expect(qc.quantumChannel).toBeInstanceOf(QuantumChannel);
    expect(qc.secureOrderRelay).toBeInstanceOf(SecureOrderRelay);
    expect(typeof qc.secureRelay).toBe('function');
    expect(qc).toHaveProperty('config');
  });

  it('short and full aliases point to same instance', () => {
    const qc = initQuantumComm();
    expect(qc.qkd).toBe(qc.qkdSimulator);
    expect(qc.encryptor).toBe(qc.otpEncryptor);
    expect(qc.channel).toBe(qc.quantumChannel);
    expect(qc.relay).toBe(qc.secureOrderRelay);
  });

  it('default config has enabled=false (dryRun=true)', () => {
    const qc = initQuantumComm();
    expect(qc.config.enabled).toBe(false);
    expect(qc.qkdSimulator.getConfig().dryRun).toBe(true);
    expect(qc.otpEncryptor.getConfig().dryRun).toBe(true);
    expect(qc.quantumChannel.getConfig().dryRun).toBe(true);
  });

  it('enabled=true sets dryRun=false on all components', () => {
    const qc = initQuantumComm({ enabled: true });
    expect(qc.qkdSimulator.getConfig().dryRun).toBe(false);
    expect(qc.otpEncryptor.getConfig().dryRun).toBe(false);
    expect(qc.quantumChannel.getConfig().dryRun).toBe(false);
  });

  it('applies custom keyLengthBits to qkdSimulator', () => {
    const qc = initQuantumComm({ keyLengthBits: 512 });
    const pair = qc.qkdSimulator.generateKeyPair();
    expect(pair.localKey.length).toBe(64);
  });

  it('applies eavesdroppingDetection=false to channel', () => {
    const qc = initQuantumComm({ eavesdroppingDetection: false });
    expect(qc.quantumChannel.getConfig().eavesdroppingDetection).toBe(false);
  });

  it('config field reflects resolved config', () => {
    const qc = initQuantumComm({ keyLengthBits: 128 });
    expect(qc.config.keyLengthBits).toBe(128);
    expect(qc.config.eavesdroppingDetection).toBe(true);
  });
});

// ── initQuantumComm — secureRelay integration ─────────────────────────────────

describe('initQuantumComm — secureRelay', () => {
  it('returns a RelayResult with all required fields', () => {
    const qc = initQuantumComm();
    const result = qc.secureRelay(makeOrder());
    expect(result).toHaveProperty('relayId');
    expect(result).toHaveProperty('encrypted');
    expect(result).toHaveProperty('transmitted');
    expect(result).toHaveProperty('keyId');
    expect(result).toHaveProperty('timestamp');
  });

  it('encrypted is true', () => {
    expect(initQuantumComm().secureRelay(makeOrder()).encrypted).toBe(true);
  });

  it('transmitted is true for normal (no eavesdropping) relay', () => {
    expect(initQuantumComm().secureRelay(makeOrder()).transmitted).toBe(true);
  });

  it('transmitted is false when eavesdropping simulated on channel', () => {
    const qc = initQuantumComm();
    qc.quantumChannel.simulateEavesdropping();
    const result = qc.secureRelay(makeOrder());
    expect(result.transmitted).toBe(false);
  });

  it('each secureRelay call generates a fresh keyId', () => {
    const qc = initQuantumComm();
    const r1 = qc.secureRelay(makeOrder());
    const r2 = qc.secureRelay(makeOrder());
    expect(r1.keyId).not.toBe(r2.keyId);
  });

  it('increments qkdSimulator keyCount on each secureRelay call', () => {
    const qc = initQuantumComm();
    qc.secureRelay(makeOrder());
    qc.secureRelay(makeOrder());
    // secureRelay calls generateKeyPair once per relay
    expect(qc.qkdSimulator.getKeyCount()).toBeGreaterThanOrEqual(2);
  });

  it('relay log grows with each secureRelay call', () => {
    const qc = initQuantumComm();
    qc.secureRelay(makeOrder());
    qc.secureRelay(makeOrder());
    expect(qc.secureOrderRelay.getRelayLog()).toHaveLength(2);
  });

  it('transmission log on channel grows with each secureRelay call', () => {
    const qc = initQuantumComm();
    qc.secureRelay(makeOrder());
    qc.secureRelay(makeOrder());
    expect(qc.quantumChannel.getTransmissionLog()).toHaveLength(2);
  });

  it('works with sell-side orders', () => {
    const qc = initQuantumComm();
    const result = qc.secureRelay(makeOrder({ side: 'sell' }));
    expect(result.encrypted).toBe(true);
    expect(result.transmitted).toBe(true);
  });
});
