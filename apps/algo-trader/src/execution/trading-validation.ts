/**
 * Trading Input Validation
 *
 * Validates trading inputs to prevent erroneous orders and protect against
 * common trading mistakes (fat finger, invalid symbols, etc.)
 */

/**
 * Custom error for validation failures
 */
export class TradingValidationError extends Error {
  constructor(
    message: string,
    public readonly field?: string,
    public readonly value?: unknown
  ) {
    super(message);
    this.name = 'TradingValidationError';
  }
}

/**
 * Symbol format validation
 * Validates common crypto trading pair formats:
 * - BTC/USDT (CCXT format)
 * - BTCUSDT (Binance format)
 */
export function validateSymbol(symbol: string): { valid: boolean; normalizedSymbol: string } {
  if (!symbol || typeof symbol !== 'string') {
    throw new TradingValidationError(
      'Symbol must be a non-empty string',
      'symbol',
      symbol
    );
  }

  const trimmed = symbol.trim();

  if (trimmed.length === 0) {
    throw new TradingValidationError(
      'Symbol cannot be empty or whitespace',
      'symbol',
      symbol
    );
  }

  // CCXT format: BTC/USDT
  const ccxtFormat = /^([A-Z0-9]{2,10})\/([A-Z0-9]{2,10})$/i;
  const ccxtMatch = trimmed.match(ccxtFormat);

  if (ccxtMatch) {
    return { valid: true, normalizedSymbol: trimmed.toUpperCase() };
  }

  // Binance format: BTCUSDT
  const binanceFormat = /^([A-Z0-9]{2,10})(USDT|USDC|BUSD|BTC|ETH|BNB|USD|EUR)$/i;
  const binanceMatch = trimmed.match(binanceFormat);

  if (binanceMatch) {
    // Normalize to CCXT format
    const base = binanceMatch[1];
    const quote = binanceMatch[2];
    return { valid: true, normalizedSymbol: `${base.toUpperCase()}/${quote.toUpperCase()}` };
  }

  throw new TradingValidationError(
    `Invalid symbol format. Expected: BTC/USDT or BTCUSDT, got: ${symbol}`,
    'symbol',
    symbol
  );
}

/**
 * Amount validation
 * Ensures amount is a positive finite number
 */
export function validateAmount(amount: number, fieldName: string = 'amount'): number {
  if (typeof amount !== 'number') {
    throw new TradingValidationError(
      `${fieldName} must be a number`,
      fieldName,
      amount
    );
  }

  if (!isFinite(amount)) {
    throw new TradingValidationError(
      `${fieldName} must be a finite number (not Infinity or NaN)`,
      fieldName,
      amount
    );
  }

  if (isNaN(amount)) {
    throw new TradingValidationError(
      `${fieldName} cannot be NaN`,
      fieldName,
      amount
    );
  }

  if (amount <= 0) {
    throw new TradingValidationError(
      `${fieldName} must be greater than 0`,
      fieldName,
      amount
    );
  }

  if (amount > 1e12) {
    throw new TradingValidationError(
      `${fieldName} exceeds maximum allowed value (1 trillion)`,
      fieldName,
      amount
    );
  }

  return amount;
}

/**
 * Price validation
 * Ensures price is a positive finite number
 */
export function validatePrice(price: number, fieldName: string = 'price'): number {
  if (typeof price !== 'number') {
    throw new TradingValidationError(
      `${fieldName} must be a number`,
      fieldName,
      price
    );
  }

  if (!isFinite(price)) {
    throw new TradingValidationError(
      `${fieldName} must be a finite number`,
      fieldName,
      price
    );
  }

  if (isNaN(price)) {
    throw new TradingValidationError(
      `${fieldName} cannot be NaN`,
      fieldName,
      price
    );
  }

  if (price <= 0) {
    throw new TradingValidationError(
      `${fieldName} must be greater than 0`,
      fieldName,
      price
    );
  }

  if (price > 1e15) {
    throw new TradingValidationError(
      `${fieldName} exceeds maximum allowed value`,
      fieldName,
      price
    );
  }

  return price;
}

/**
 * Order side validation
 */
export function validateSide(side: string): 'buy' | 'sell' {
  if (typeof side !== 'string') {
    throw new TradingValidationError(
      'Side must be a string',
      'side',
      side
    );
  }

  const normalizedSide = side.toLowerCase().trim();

  if (normalizedSide !== 'buy' && normalizedSide !== 'sell') {
    throw new TradingValidationError(
      `Side must be 'buy' or 'sell', got: ${side}`,
      'side',
      side
    );
  }

  return normalizedSide as 'buy' | 'sell';
}

/**
 * Validate complete order input
 */
export function validateOrderInput(params: {
  side: string;
  symbol: string;
  amount: number;
  price?: number;
}): {
  side: 'buy' | 'sell';
  symbol: string;
  amount: number;
  price?: number;
} {
  const side = validateSide(params.side);
  const { normalizedSymbol } = validateSymbol(params.symbol);
  const amount = validateAmount(params.amount);
  const price = params.price !== undefined ? validatePrice(params.price) : undefined;

  return { side, symbol: normalizedSymbol, amount, price };
}

/**
 * Validate arbitrage opportunity
 */
export function validateArbitrageOpportunity(params: {
  buyPrice: number;
  sellPrice: number;
  amount: number;
  minProfitPercent: number;
}): { valid: boolean; profitPercent: number } {
  const buyPrice = validatePrice(params.buyPrice, 'buyPrice');
  const sellPrice = validatePrice(params.sellPrice, 'sellPrice');
  const amount = validateAmount(params.amount);
  const minProfitPercent = params.minProfitPercent ?? 0;

  // Calculate profit percent
  const profitPercent = ((sellPrice - buyPrice) / buyPrice) * 100;

  if (profitPercent < minProfitPercent) {
    throw new TradingValidationError(
      `Profit ${profitPercent.toFixed(4)}% below minimum ${minProfitPercent}%`,
      'profitPercent',
      profitPercent
    );
  }

  if (profitPercent <= 0) {
    throw new TradingValidationError(
      'Arbitrage opportunity would result in a loss',
      'profitPercent',
      profitPercent
    );
  }

  return { valid: true, profitPercent };
}

/**
 * Safe number conversion with validation
 */
export function safeNumber(value: unknown, defaultValue: number = 0): number {
  if (typeof value === 'number' && isFinite(value) && !isNaN(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const parsed = parseFloat(value);
    if (isFinite(parsed) && !isNaN(parsed)) {
      return parsed;
    }
  }

  return defaultValue;
}

/**
 * Validate API key format (basic check)
 */
export function validateApiKeyFormat(apiKey: string): boolean {
  if (!apiKey || typeof apiKey !== 'string') {
    return false;
  }

  // API keys are typically alphanumeric, at least 16 chars
  return apiKey.length >= 16 && /^[A-Za-z0-9_-]+$/.test(apiKey);
}

/**
 * Validate secret format (basic check)
 */
export function validateSecretFormat(secret: string): boolean {
  if (!secret || typeof secret !== 'string') {
    return false;
  }

  // Secrets are typically longer, base64-like
  return secret.length >= 32;
}
