/**
 * Tenant LLM Settings — BYOK (Bring Your Own Key)
 * Encrypt/decrypt API keys using AES-256-GCM via Web Crypto.
 * Encryption key derived from SERVICE_TOKEN (Cloudflare secret).
 */

export const PROVIDER_PRESETS: Record<string, { baseUrl: string; model: string }> = {
  openai: { baseUrl: 'https://api.openai.com/v1', model: 'gpt-4o-mini' },
  google: { baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai', model: 'gemini-2.0-flash' },
  anthropic: { baseUrl: 'https://api.anthropic.com/v1', model: 'claude-sonnet-4-20250514' },
}

export interface TenantLLMSettings {
  provider: string
  apiKey?: string
  baseUrl: string
  model: string
}

// --- Crypto helpers (AES-256-GCM) ---

async function deriveKey(secret: string): Promise<CryptoKey> {
  const raw = new TextEncoder().encode(secret.padEnd(32, '0').slice(0, 32))
  return crypto.subtle.importKey('raw', raw, 'AES-GCM', false, ['encrypt', 'decrypt'])
}

async function encrypt(plaintext: string, secret: string): Promise<string> {
  const key = await deriveKey(secret)
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const encoded = new TextEncoder().encode(plaintext)
  const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoded)
  const combined = new Uint8Array(iv.length + new Uint8Array(ciphertext).length)
  combined.set(iv)
  combined.set(new Uint8Array(ciphertext), iv.length)
  return btoa(String.fromCharCode(...combined))
}

async function decrypt(encoded: string, secret: string): Promise<string> {
  const key = await deriveKey(secret)
  const combined = Uint8Array.from(atob(encoded), (c) => c.charCodeAt(0))
  const iv = combined.slice(0, 12)
  const ciphertext = combined.slice(12)
  const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ciphertext)
  return new TextDecoder().decode(decrypted)
}

// --- CRUD ---

export async function saveLLMSettings(
  db: D1Database,
  tenantId: string,
  input: { provider: string; apiKey: string; baseUrl?: string; model?: string },
  serviceToken: string,
): Promise<void> {
  const preset = PROVIDER_PRESETS[input.provider]
  const baseUrl = input.baseUrl || preset?.baseUrl || ''
  const model = input.model || preset?.model || ''
  const encrypted = await encrypt(input.apiKey, serviceToken)

  await db
    .prepare(
      `INSERT INTO tenant_settings (tenant_id, llm_provider, llm_api_key_encrypted, llm_base_url, llm_model, updated_at)
       VALUES (?, ?, ?, ?, ?, datetime('now'))
       ON CONFLICT(tenant_id) DO UPDATE SET
         llm_provider = excluded.llm_provider,
         llm_api_key_encrypted = excluded.llm_api_key_encrypted,
         llm_base_url = excluded.llm_base_url,
         llm_model = excluded.llm_model,
         updated_at = excluded.updated_at`,
    )
    .bind(tenantId, input.provider, encrypted, baseUrl, model)
    .run()
}

export async function getLLMSettings(
  db: D1Database,
  tenantId: string,
  serviceToken: string,
): Promise<TenantLLMSettings | null> {
  const row = await db
    .prepare('SELECT llm_provider, llm_api_key_encrypted, llm_base_url, llm_model FROM tenant_settings WHERE tenant_id = ?')
    .bind(tenantId)
    .first<{ llm_provider: string; llm_api_key_encrypted: string | null; llm_base_url: string | null; llm_model: string | null }>()

  if (!row) return null

  let apiKey: string | undefined
  if (row.llm_api_key_encrypted) {
    apiKey = await decrypt(row.llm_api_key_encrypted, serviceToken)
  }

  return {
    provider: row.llm_provider,
    apiKey,
    baseUrl: row.llm_base_url || '',
    model: row.llm_model || '',
  }
}

export async function deleteLLMSettings(db: D1Database, tenantId: string): Promise<boolean> {
  const result = await db.prepare('DELETE FROM tenant_settings WHERE tenant_id = ?').bind(tenantId).run()
  return (result.meta.changes ?? 0) > 0
}

/** Mask API key for GET response: "sk-***abc" */
export function maskApiKey(key: string): string {
  if (key.length <= 6) return '***'
  return key.slice(0, 3) + '***' + key.slice(-3)
}
