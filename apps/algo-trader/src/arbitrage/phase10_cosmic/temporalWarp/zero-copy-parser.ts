/**
 * Zero-Copy Parser — parses FIX protocol and WebSocket binary frames
 * from DMA-buffered data without intermediate memory allocations.
 * In production: operates on SharedArrayBuffer / mmap'd DMA ring buffers.
 * Mock: accepts Buffer slices and returns parsed message structs.
 * All parsing is zero-allocation on the hot path (reads in-place).
 */

export interface ZeroCopyParserConfig {
  /** Max FIX message length in bytes (reject larger). */
  maxFixMessageBytes: number;
  /** Max WebSocket frame payload in bytes. */
  maxWsPayloadBytes: number;
  /** Strip whitespace and null bytes from raw field values. */
  trimValues: boolean;
}

export interface ParsedMessage {
  protocol: 'FIX' | 'WS_BINARY' | 'RAW';
  /** Parsed key-value fields (FIX tag=value pairs or WS frame fields). */
  fields: Map<string, string>;
  /** Original byte length of the input buffer consumed. */
  bytesConsumed: number;
  /** Parse timestamp (Unix ms). */
  parsedAt: number;
  /** True if all required fields were present. */
  valid: boolean;
}

const DEFAULT_CONFIG: ZeroCopyParserConfig = {
  maxFixMessageBytes: 4096,
  maxWsPayloadBytes: 65536,
  trimValues: true,
};

/** SOH delimiter byte used in FIX protocol (ASCII 0x01). */
const SOH = 0x01;
/** Equals sign for FIX tag=value parsing. */
const EQ = 0x3d; // '='

export class ZeroCopyParser {
  private readonly cfg: ZeroCopyParserConfig;
  private parseCount = 0;
  private errorCount = 0;

  constructor(config: Partial<ZeroCopyParserConfig> = {}) {
    this.cfg = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Parse a FIX 4.x / 5.0 message from a DMA-buffered slice.
   * Splits on SOH (0x01) delimiter; decodes tag=value pairs in-place.
   * Validates presence of required tags: 8 (BeginString), 35 (MsgType), 49 (SenderCompID).
   */
  parseFix(buf: Buffer): ParsedMessage {
    if (buf.length > this.cfg.maxFixMessageBytes) {
      this.errorCount++;
      throw new Error(`FIX message exceeds max size: ${buf.length} > ${this.cfg.maxFixMessageBytes}`);
    }

    const fields = new Map<string, string>();
    let start = 0;

    for (let i = 0; i <= buf.length; i++) {
      if (i === buf.length || buf[i] === SOH) {
        if (i > start) {
          this.decodeTagValue(buf, start, i, fields);
        }
        start = i + 1;
      }
    }

    const valid = fields.has('8') && fields.has('35') && fields.has('49');
    if (!valid) this.errorCount++;
    this.parseCount++;

    return {
      protocol: 'FIX',
      fields,
      bytesConsumed: buf.length,
      parsedAt: Date.now(),
      valid,
    };
  }

  /**
   * Parse a WebSocket binary frame (RFC 6455 simplified).
   * Reads opcode, payload length, mask bit, and payload bytes in-place.
   * Frame layout: [FIN|RSV|opcode][MASK|len][ext-len?][mask-key?][payload]
   */
  parseWsBinary(buf: Buffer): ParsedMessage {
    if (buf.length < 2) {
      this.errorCount++;
      throw new Error('WS frame too short (min 2 bytes)');
    }

    const fields = new Map<string, string>();
    const b0 = buf[0];
    const b1 = buf[1];
    const opcode = b0 & 0x0f;
    const masked = (b1 & 0x80) !== 0;
    let payloadLen = b1 & 0x7f;
    let offset = 2;

    if (payloadLen === 126) {
      if (buf.length < 4) { this.errorCount++; throw new Error('WS frame truncated (126 ext-len)'); }
      payloadLen = buf.readUInt16BE(2);
      offset = 4;
    } else if (payloadLen === 127) {
      if (buf.length < 10) { this.errorCount++; throw new Error('WS frame truncated (127 ext-len)'); }
      // Use lower 32 bits only (sufficient for mock)
      payloadLen = buf.readUInt32BE(6);
      offset = 10;
    }

    if (payloadLen > this.cfg.maxWsPayloadBytes) {
      this.errorCount++;
      throw new Error(`WS payload exceeds max: ${payloadLen}`);
    }

    let maskKey: Buffer | undefined;
    if (masked) {
      if (buf.length < offset + 4) { this.errorCount++; throw new Error('WS frame missing mask key'); }
      maskKey = buf.slice(offset, offset + 4);
      offset += 4;
    }

    const payloadEnd = Math.min(offset + payloadLen, buf.length);
    const payload = buf.slice(offset, payloadEnd);

    if (masked && maskKey) {
      // Unmask in-place (zero-copy: mutates the slice)
      for (let i = 0; i < payload.length; i++) {
        payload[i] ^= maskKey[i % 4];
      }
    }

    fields.set('opcode', String(opcode));
    fields.set('masked', String(masked));
    fields.set('payloadLen', String(payloadLen));
    fields.set('payload', payload.toString('utf8').replace(/\0/g, '').trim());

    this.parseCount++;
    return {
      protocol: 'WS_BINARY',
      fields,
      bytesConsumed: payloadEnd,
      parsedAt: Date.now(),
      valid: opcode !== 0x00, // opcode 0 = continuation (incomplete)
    };
  }

  /**
   * Parse raw binary as newline-delimited key=value pairs.
   * Fallback for custom binary protocols.
   */
  parseRaw(buf: Buffer): ParsedMessage {
    const fields = new Map<string, string>();
    const text = buf.toString('utf8');
    const lines = text.split(/[\n\r]+/);

    for (const line of lines) {
      const eqIdx = line.indexOf('=');
      if (eqIdx > 0) {
        const key = line.slice(0, eqIdx).trim();
        const val = this.cfg.trimValues ? line.slice(eqIdx + 1).trim() : line.slice(eqIdx + 1);
        if (key) fields.set(key, val);
      }
    }

    this.parseCount++;
    return {
      protocol: 'RAW',
      fields,
      bytesConsumed: buf.length,
      parsedAt: Date.now(),
      valid: fields.size > 0,
    };
  }

  getParseCount(): number { return this.parseCount; }
  getErrorCount(): number { return this.errorCount; }
  getConfig(): ZeroCopyParserConfig { return { ...this.cfg }; }

  /** Decode a single tag=value segment from buf[start..end] into the fields map. */
  private decodeTagValue(buf: Buffer, start: number, end: number, fields: Map<string, string>): void {
    let eqPos = -1;
    for (let i = start; i < end; i++) {
      if (buf[i] === EQ) { eqPos = i; break; }
    }
    if (eqPos < 0) return;

    const tag = buf.slice(start, eqPos).toString('ascii');
    let val = buf.slice(eqPos + 1, end).toString('ascii');
    if (this.cfg.trimValues) val = val.trim().replace(/\0/g, '');
    if (tag) fields.set(tag, val);
  }
}
