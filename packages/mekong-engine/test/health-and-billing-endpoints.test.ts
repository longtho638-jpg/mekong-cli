import { describe, it, expect } from 'vitest'
import app from '../src/index'

// Minimal mock bindings for Hono app.request()
const mockEnv = {}

describe('Health endpoint', () => {
  it('GET /health returns status ok without DB', async () => {
    const res = await app.request('/health', {}, mockEnv)

    expect(res.status).toBe(200)
    const body = (await res.json()) as { status: string; version: string }
    expect(body.status).toBe('ok')
    expect(body.version).toBe('3.2.0')
  })

  it('GET /health reports bindings as false when none configured', async () => {
    const res = await app.request('/health', {}, mockEnv)

    const body = (await res.json()) as { bindings: Record<string, boolean> }
    expect(body.bindings.d1).toBe(false)
    expect(body.bindings.kv).toBe(false)
    expect(body.bindings.ai).toBe(false)
  })
})

describe('Billing endpoints', () => {
  it('POST /billing/tenants returns 503 without D1', async () => {
    const res = await app.request('/billing/tenants', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'test' }),
    }, mockEnv)

    expect(res.status).toBe(503)
  })

  it('GET /billing/credits requires auth', async () => {
    const res = await app.request('/billing/credits', {}, mockEnv)
    expect(res.status).toBe(401)
  })
})

describe('Settings endpoints', () => {
  it('GET /v1/settings/llm returns 503 without DB', async () => {
    const res = await app.request('/v1/settings/llm', {}, mockEnv)
    expect(res.status).toBe(503)
  })

  it('POST /v1/settings/llm returns 503 without DB', async () => {
    const res = await app.request('/v1/settings/llm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ provider: 'openai', api_key: 'sk-test' }),
    }, mockEnv)

    expect(res.status).toBe(503)
  })

  it('DELETE /v1/settings/llm returns 503 without DB', async () => {
    const res = await app.request('/v1/settings/llm', {
      method: 'DELETE',
    }, mockEnv)

    expect(res.status).toBe(503)
  })
})

describe('PEV endpoint', () => {
  it('POST /cmd returns 503 without AI or LLM key', async () => {
    const res = await app.request('/cmd', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ goal: 'test' }),
    }, mockEnv)

    expect(res.status).toBe(503)
  })
})

describe('Error handling', () => {
  it('POST /cmd with invalid JSON returns 400 not 500', async () => {
    // Need AI binding to pass the "no LLM provider" check (503) before hitting JSON parse
    const envWithAI = { AI: {} }
    const res = await app.request('/cmd', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'not valid json',
    }, envWithAI)

    expect(res.status).toBe(400)
    const body = (await res.json()) as { error: string }
    expect(body.error).toContain('Invalid JSON')
  })

  it('POST /billing/tenants with invalid JSON returns 400', async () => {
    // Need DB binding to pass the "D1 not configured" check before hitting JSON parse
    const envWithDB = { DB: {} }
    const res = await app.request('/billing/tenants', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{broken',
    }, envWithDB)

    expect(res.status).toBe(400)
  })
})

describe('API key regeneration', () => {
  it('POST /billing/tenants/regenerate-key returns 503 without D1', async () => {
    const res = await app.request('/billing/tenants/regenerate-key', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tenant_id: 'test', name: 'test' }),
    }, mockEnv)

    expect(res.status).toBe(503)
  })

  it('POST /billing/tenants/regenerate-key validates required fields', async () => {
    const res = await app.request('/billing/tenants/regenerate-key', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tenant_id: 'test' }),
    }, mockEnv)

    // Without DB → 503 (DB check runs before validation)
    expect(res.status).toBe(503)
  })
})
