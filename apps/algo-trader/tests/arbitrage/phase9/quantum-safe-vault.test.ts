/**
 * Tests: Phase 9 Quantum-Safe Vault (QSV) — all components.
 */

import { PqcKeyManager } from '../../../src/arbitrage/phase9_singularity/quantumSafeVault/pqc-key-manager';
import { HybridEncryptor } from '../../../src/arbitrage/phase9_singularity/quantumSafeVault/hybrid-encryptor';
import { WithdrawalSigner } from '../../../src/arbitrage/phase9_singularity/quantumSafeVault/withdrawal-signer';
import { HsmSimulator } from '../../../src/arbitrage/phase9_singularity/quantumSafeVault/hsm-simulator';
import { ForwardSecrecyRatchet } from '../../../src/arbitrage/phase9_singularity/quantumSafeVault/forward-secrecy';
import { initQuantumSafeVault } from '../../../src/arbitrage/phase9_singularity/quantumSafeVault/index';
import type { WithdrawalRequest } from '../../../src/arbitrage/phase9_singularity/quantumSafeVault/withdrawal-signer';
import { randomBytes } from 'crypto';

// ── PqcKeyManager ────────────────────────────────────────────────────────────

describe('PqcKeyManager — Dilithium3', () => {
  let mgr: PqcKeyManager;

  beforeEach(() => {
    mgr = new PqcKeyManager({ algorithm: 'Dilithium3', dryRun: true });
  });

  it('generates a key pair with correct algorithm', () => {
    const kp = mgr.generateKeyPair();
    expect(kp.algorithm).toBe('Dilithium3');
    expect(kp.publicKey).toBeInstanceOf(Buffer);
    expect(kp.secretKey).toBeInstanceOf(Buffer);
    expect(kp.createdAt).toBeLessThanOrEqual(Date.now());
  });

  it('Dilithium3 public key is 1952 bytes', () => {
    const kp = mgr.generateKeyPair();
    expect(kp.publicKey.length).toBe(1952);
  });

  it('Dilithium3 secret key is 4000 bytes', () => {
    const kp = mgr.generateKeyPair();
    expect(kp.secretKey.length).toBe(4000);
  });

  it('sign produces a 3293-byte signature', () => {
    const kp = mgr.generateKeyPair();
    const msg = Buffer.from('withdraw 1 BTC');
    const sig = mgr.sign(kp.secretKey, msg);
    expect(sig.length).toBe(3293);
  });

  it('verify returns true for a valid signature', () => {
    const kp = mgr.generateKeyPair();
    const msg = Buffer.from('test message');
    const sig = mgr.sign(kp.secretKey, msg);
    expect(mgr.verify(kp.publicKey, msg, sig)).toBe(true);
  });

  it('verify returns false for tampered message', () => {
    const kp = mgr.generateKeyPair();
    const msg = Buffer.from('original');
    const sig = mgr.sign(kp.secretKey, msg);
    const tampered = Buffer.from('tampered');
    expect(mgr.verify(kp.publicKey, tampered, sig)).toBe(false);
  });

  it('sign() throws for non-Dilithium3 algorithm', () => {
    const kyberMgr = new PqcKeyManager({ algorithm: 'Kyber768' });
    const kp = kyberMgr.generateKeyPair();
    expect(() => kyberMgr.sign(kp.secretKey, Buffer.from('msg'))).toThrow('Dilithium3');
  });

  it('getAlgorithm returns configured algorithm', () => {
    expect(mgr.getAlgorithm()).toBe('Dilithium3');
  });

  it('isDryRun reflects config', () => {
    expect(mgr.isDryRun()).toBe(true);
  });

  it('two key pairs produce different public keys', () => {
    const kp1 = mgr.generateKeyPair();
    const kp2 = mgr.generateKeyPair();
    expect(kp1.publicKey.equals(kp2.publicKey)).toBe(false);
  });
});

describe('PqcKeyManager — Kyber768', () => {
  let mgr: PqcKeyManager;

  beforeEach(() => {
    mgr = new PqcKeyManager({ algorithm: 'Kyber768', dryRun: true });
  });

  it('Kyber768 public key is 1184 bytes', () => {
    const kp = mgr.generateKeyPair();
    expect(kp.publicKey.length).toBe(1184);
  });

  it('Kyber768 secret key is 2400 bytes', () => {
    const kp = mgr.generateKeyPair();
    expect(kp.secretKey.length).toBe(2400);
  });

  it('encapsulate produces 32-byte shared secret and 1088-byte ciphertext', () => {
    const kp = mgr.generateKeyPair();
    const { sharedSecret, ciphertext } = mgr.encapsulate(kp.publicKey);
    expect(sharedSecret.length).toBe(32);
    expect(ciphertext.length).toBe(1088);
  });

  it('decapsulate produces a 32-byte shared secret', () => {
    const kp = mgr.generateKeyPair();
    const { ciphertext } = mgr.encapsulate(kp.publicKey);
    const ss = mgr.decapsulate(kp.secretKey, ciphertext);
    expect(ss.length).toBe(32);
  });

  it('encapsulate() throws for non-Kyber768', () => {
    const dilMgr = new PqcKeyManager({ algorithm: 'Dilithium3' });
    const kp = dilMgr.generateKeyPair();
    expect(() => dilMgr.encapsulate(kp.publicKey)).toThrow('Kyber768');
  });

  it('decapsulate() throws for non-Kyber768', () => {
    const dilMgr = new PqcKeyManager({ algorithm: 'Dilithium3' });
    const kp = dilMgr.generateKeyPair();
    expect(() => dilMgr.decapsulate(kp.secretKey, Buffer.alloc(1088))).toThrow('Kyber768');
  });
});

// ── HybridEncryptor ──────────────────────────────────────────────────────────

describe('HybridEncryptor', () => {
  it('encrypt/decrypt round-trips plaintext', () => {
    const enc = new HybridEncryptor();
    enc.setSessionKey(randomBytes(32));
    const plaintext = Buffer.from('quantum-safe payload');
    const payload = enc.encrypt(plaintext);
    const recovered = enc.decrypt(payload);
    expect(recovered.equals(plaintext)).toBe(true);
  });

  it('throws encrypt without session key', () => {
    const enc = new HybridEncryptor();
    expect(() => enc.encrypt(Buffer.from('test'))).toThrow('No session key');
  });

  it('throws decrypt without session key', () => {
    const enc = new HybridEncryptor();
    expect(() =>
      enc.decrypt({ ciphertext: '', iv: '', authTag: '', kyberCt: '', sessionKeyHash: '' }),
    ).toThrow('No session key');
  });

  it('setSessionKey rejects non-32-byte keys', () => {
    const enc = new HybridEncryptor();
    expect(() => enc.setSessionKey(Buffer.alloc(16))).toThrow('32 bytes');
  });

  it('hasSessionKey is false before handshake', () => {
    const enc = new HybridEncryptor();
    expect(enc.hasSessionKey()).toBe(false);
  });

  it('hasSessionKey is true after setSessionKey', () => {
    const enc = new HybridEncryptor();
    enc.setSessionKey(randomBytes(32));
    expect(enc.hasSessionKey()).toBe(true);
  });

  it('handshake returns sessionKeyHash and kyberCt', () => {
    const enc = new HybridEncryptor();
    const kyberPub = randomBytes(1184);
    const result = enc.handshake(kyberPub);
    expect(result.sessionKeyHash).toHaveLength(64); // sha256 hex
    expect(result.kyberCt).toBeInstanceOf(Buffer);
  });

  it('encrypted payload has all required fields', () => {
    const enc = new HybridEncryptor();
    enc.setSessionKey(randomBytes(32));
    const p = enc.encrypt(Buffer.from('hello'));
    expect(p).toHaveProperty('ciphertext');
    expect(p).toHaveProperty('iv');
    expect(p).toHaveProperty('authTag');
    expect(p).toHaveProperty('sessionKeyHash');
  });

  it('different plaintexts produce different ciphertexts', () => {
    const enc = new HybridEncryptor();
    enc.setSessionKey(randomBytes(32));
    const p1 = enc.encrypt(Buffer.from('aaa'));
    const p2 = enc.encrypt(Buffer.from('bbb'));
    expect(p1.ciphertext).not.toBe(p2.ciphertext);
  });

  it('receiveHandshake sets session key', () => {
    const enc = new HybridEncryptor();
    const kyberMgr = new PqcKeyManager({ algorithm: 'Kyber768' });
    const kp = kyberMgr.generateKeyPair();
    const { kyberCt } = enc.handshake(kp.publicKey);
    const receiver = new HybridEncryptor();
    receiver.receiveHandshake(kp.secretKey, kyberCt, randomBytes(32));
    expect(receiver.hasSessionKey()).toBe(true);
  });
});

// ── WithdrawalSigner ─────────────────────────────────────────────────────────

describe('WithdrawalSigner', () => {
  const validRequest: WithdrawalRequest = {
    id: 'wd-001',
    asset: 'BTC',
    amount: 0.5,
    destinationAddress: 'bc1qxyz',
    nonce: 1,
    timestampMs: Date.now(),
  };

  it('throws signWithdrawal without key pair', () => {
    const signer = new WithdrawalSigner();
    expect(() => signer.signWithdrawal(validRequest)).toThrow('No key pair');
  });

  it('signs a valid withdrawal request', () => {
    const signer = new WithdrawalSigner();
    signer.generateKeyPair();
    const signed = signer.signWithdrawal(validRequest);
    expect(signed.signature).toBeTruthy();
    expect(signed.publicKey).toBeTruthy();
    expect(signed.requestHash).toHaveLength(64);
  });

  it('verifies a valid signed withdrawal', () => {
    const signer = new WithdrawalSigner();
    signer.generateKeyPair();
    const signed = signer.signWithdrawal(validRequest);
    expect(signer.verifyWithdrawal(signed)).toBe(true);
  });

  it('rejects verification with tampered amount', () => {
    const signer = new WithdrawalSigner();
    signer.generateKeyPair();
    const signed = signer.signWithdrawal(validRequest);
    const tampered = { ...signed, request: { ...signed.request, amount: 999 } };
    expect(signer.verifyWithdrawal(tampered)).toBe(false);
  });

  it('rejects verification with tampered requestHash', () => {
    const signer = new WithdrawalSigner();
    signer.generateKeyPair();
    const signed = signer.signWithdrawal(validRequest);
    const tampered = { ...signed, requestHash: 'a'.repeat(64) };
    expect(signer.verifyWithdrawal(tampered)).toBe(false);
  });

  it('rejects amount <= 0', () => {
    const signer = new WithdrawalSigner();
    signer.generateKeyPair();
    expect(() => signer.signWithdrawal({ ...validRequest, amount: 0 })).toThrow('positive');
  });

  it('rejects amount exceeding max', () => {
    const signer = new WithdrawalSigner();
    signer.generateKeyPair();
    expect(() =>
      signer.signWithdrawal({ ...validRequest, amount: 200_000 }),
    ).toThrow('exceeds max');
  });

  it('rejects empty destinationAddress', () => {
    const signer = new WithdrawalSigner();
    signer.generateKeyPair();
    expect(() =>
      signer.signWithdrawal({ ...validRequest, destinationAddress: '' }),
    ).toThrow('destinationAddress');
  });

  it('increments sign count', () => {
    const signer = new WithdrawalSigner();
    signer.generateKeyPair();
    signer.signWithdrawal(validRequest);
    signer.signWithdrawal(validRequest);
    expect(signer.getSignCount()).toBe(2);
  });

  it('loadKeyPair throws for non-Dilithium3 pair', () => {
    const signer = new WithdrawalSigner();
    const kyberMgr = new PqcKeyManager({ algorithm: 'Kyber768' });
    const kp = kyberMgr.generateKeyPair();
    expect(() => signer.loadKeyPair(kp)).toThrow('Dilithium3');
  });

  it('hasKeyPair false before generateKeyPair', () => {
    const signer = new WithdrawalSigner();
    expect(signer.hasKeyPair()).toBe(false);
  });

  it('isDryRun reflects config', () => {
    const signer = new WithdrawalSigner({ dryRun: false });
    expect(signer.isDryRun()).toBe(false);
  });
});

// ── HsmSimulator ─────────────────────────────────────────────────────────────

describe('HsmSimulator', () => {
  it('stores and retrieves key material', () => {
    const hsm = new HsmSimulator();
    const key = randomBytes(32);
    const slotId = hsm.storeKey('test-key', key, 'Dilithium3');
    const retrieved = hsm.retrieveKey(slotId);
    expect(retrieved.equals(key)).toBe(true);
  });

  it('storeKey returns unique slot IDs', () => {
    const hsm = new HsmSimulator();
    const id1 = hsm.storeKey('k1', randomBytes(32));
    const id2 = hsm.storeKey('k2', randomBytes(32));
    expect(id1).not.toBe(id2);
  });

  it('retrieveKey throws for unknown slot', () => {
    const hsm = new HsmSimulator();
    expect(() => hsm.retrieveKey('deadbeef')).toThrow('not found');
  });

  it('deleteKey removes slot and returns true', () => {
    const hsm = new HsmSimulator();
    const id = hsm.storeKey('to-delete', randomBytes(32));
    expect(hsm.deleteKey(id)).toBe(true);
    expect(hsm.hasSlot(id)).toBe(false);
  });

  it('deleteKey returns false for non-existent slot', () => {
    const hsm = new HsmSimulator();
    expect(hsm.deleteKey('nonexistent')).toBe(false);
  });

  it('listSlots returns metadata without key material', () => {
    const hsm = new HsmSimulator();
    hsm.storeKey('key-a', randomBytes(32), 'Ed25519');
    const slots = hsm.listSlots();
    expect(slots).toHaveLength(1);
    expect(slots[0]).toHaveProperty('slotId');
    expect(slots[0]).toHaveProperty('label', 'key-a');
    expect(slots[0]).toHaveProperty('algorithm', 'Ed25519');
    expect(slots[0]).not.toHaveProperty('encryptedKey');
  });

  it('enforces maxSlots limit', () => {
    const hsm = new HsmSimulator({ maxSlots: 2 });
    hsm.storeKey('k1', randomBytes(32));
    hsm.storeKey('k2', randomBytes(32));
    expect(() => hsm.storeKey('k3', randomBytes(32))).toThrow('capacity');
  });

  it('getSlotCount increments and decrements correctly', () => {
    const hsm = new HsmSimulator();
    expect(hsm.getSlotCount()).toBe(0);
    const id = hsm.storeKey('k', randomBytes(32));
    expect(hsm.getSlotCount()).toBe(1);
    hsm.deleteKey(id);
    expect(hsm.getSlotCount()).toBe(0);
  });

  it('different keys stored with same label are independent', () => {
    const hsm = new HsmSimulator();
    const k1 = randomBytes(32);
    const k2 = randomBytes(32);
    const id1 = hsm.storeKey('label', k1);
    const id2 = hsm.storeKey('label', k2);
    expect(hsm.retrieveKey(id1).equals(k1)).toBe(true);
    expect(hsm.retrieveKey(id2).equals(k2)).toBe(true);
  });
});

// ── ForwardSecrecyRatchet ────────────────────────────────────────────────────

describe('ForwardSecrecyRatchet', () => {
  it('initSession returns a session ID', () => {
    const ratchet = new ForwardSecrecyRatchet();
    const id = ratchet.initSession(randomBytes(32));
    expect(typeof id).toBe('string');
    expect(id).toHaveLength(16); // 8 bytes hex
  });

  it('hasSession is true after initSession', () => {
    const ratchet = new ForwardSecrecyRatchet();
    const id = ratchet.initSession(randomBytes(32));
    expect(ratchet.hasSession(id)).toBe(true);
  });

  it('hasSession is false for unknown ID', () => {
    const ratchet = new ForwardSecrecyRatchet();
    expect(ratchet.hasSession('unknown')).toBe(false);
  });

  it('encrypt produces ciphertext, iv, authTag, and index', () => {
    const ratchet = new ForwardSecrecyRatchet();
    const id = ratchet.initSession(randomBytes(32));
    const result = ratchet.encrypt(id, Buffer.from('hello'));
    expect(result).toHaveProperty('ciphertext');
    expect(result).toHaveProperty('iv');
    expect(result).toHaveProperty('authTag');
    expect(result.index).toBe(0);
  });

  it('message index increments on each encrypt', () => {
    const ratchet = new ForwardSecrecyRatchet();
    const id = ratchet.initSession(randomBytes(32));
    const r1 = ratchet.encrypt(id, Buffer.from('m1'));
    const r2 = ratchet.encrypt(id, Buffer.from('m2'));
    expect(r1.index).toBe(0);
    expect(r2.index).toBe(1);
  });

  it('decrypt recovers plaintext with correct message key', () => {
    const ratchet = new ForwardSecrecyRatchet();
    const id = ratchet.initSession(randomBytes(32));

    // Capture chain key before encrypt to derive the same message key
    const session = ratchet.getSession(id);
    const { createHmac } = require('crypto');
    function kdf(key: Buffer, input: Buffer, info: string): Buffer {
      return createHmac('sha256', key).update(input).update(info).digest();
    }
    const chainKeyBefore = Buffer.from(session.localState.chainKey);
    const messageKey = kdf(chainKeyBefore, Buffer.from('01', 'hex'), 'message-key');

    const plaintext = Buffer.from('secret message');
    const encrypted = ratchet.encrypt(id, plaintext);
    const decrypted = ratchet.decrypt(id, encrypted, messageKey);
    expect(decrypted.equals(plaintext)).toBe(true);
  });

  it('ratchetStep changes root key and chain key', () => {
    const ratchet = new ForwardSecrecyRatchet();
    const id = ratchet.initSession(randomBytes(32));
    const before = Buffer.from(ratchet.getSession(id).localState.rootKey);
    ratchet.ratchetStep(id, randomBytes(32));
    const after = ratchet.getSession(id).localState.rootKey;
    expect(before.equals(after)).toBe(false);
  });

  it('ratchetStep resets message index to 0', () => {
    const ratchet = new ForwardSecrecyRatchet();
    const id = ratchet.initSession(randomBytes(32));
    ratchet.encrypt(id, Buffer.from('m1'));
    ratchet.encrypt(id, Buffer.from('m2'));
    ratchet.ratchetStep(id, randomBytes(32));
    expect(ratchet.getSession(id).localState.messageIndex).toBe(0);
  });

  it('getSession throws for unknown session', () => {
    const ratchet = new ForwardSecrecyRatchet();
    expect(() => ratchet.getSession('bad')).toThrow('not found');
  });

  it('enforces maxMessagesPerChain limit', () => {
    const ratchet = new ForwardSecrecyRatchet({ maxMessagesPerChain: 2 });
    const id = ratchet.initSession(randomBytes(32));
    ratchet.encrypt(id, Buffer.from('m1'));
    ratchet.encrypt(id, Buffer.from('m2'));
    expect(() => ratchet.encrypt(id, Buffer.from('m3'))).toThrow('Chain message limit');
  });
});

// ── initQuantumSafeVault ─────────────────────────────────────────────────────

describe('initQuantumSafeVault', () => {
  it('returns all component instances', () => {
    const vault = initQuantumSafeVault();
    expect(vault.keyManager).toBeInstanceOf(PqcKeyManager);
    expect(vault.encryptor).toBeInstanceOf(HybridEncryptor);
    expect(vault.withdrawalSigner).toBeInstanceOf(WithdrawalSigner);
    expect(vault.hsm).toBeInstanceOf(HsmSimulator);
    expect(vault.ratchet).toBeInstanceOf(ForwardSecrecyRatchet);
  });

  it('default config has enabled=false', () => {
    const vault = initQuantumSafeVault();
    expect(vault.config.enabled).toBe(false);
  });

  it('respects enabled flag', () => {
    const vault = initQuantumSafeVault({ enabled: true });
    expect(vault.config.enabled).toBe(true);
  });

  it('respects pqcAlgorithm override', () => {
    const vault = initQuantumSafeVault({ pqcAlgorithm: 'Kyber768' });
    expect(vault.keyManager.getAlgorithm()).toBe('Kyber768');
  });

  it('key manager dryRun=true when enabled=false', () => {
    const vault = initQuantumSafeVault({ enabled: false });
    expect(vault.keyManager.isDryRun()).toBe(true);
  });

  it('key manager dryRun=false when enabled=true', () => {
    const vault = initQuantumSafeVault({ enabled: true });
    expect(vault.keyManager.isDryRun()).toBe(false);
  });

  it('encryptTraffic=true sets encryptor config', () => {
    const vault = initQuantumSafeVault({ encryptTraffic: true });
    expect(vault.config.encryptTraffic).toBe(true);
  });

  it('components are independent instances', () => {
    const v1 = initQuantumSafeVault();
    const v2 = initQuantumSafeVault();
    expect(v1.hsm).not.toBe(v2.hsm);
  });
});
