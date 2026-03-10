import { describe, it, expect } from 'vitest'
import { maskApiKey } from '../src/raas/tenant-settings'

describe('maskApiKey', () => {
  it('masks long keys showing first 3 and last 3 chars', () => {
    expect(maskApiKey('sk-proj-abcdef123456')).toBe('sk-***456')
  })

  it('masks short keys completely', () => {
    expect(maskApiKey('abc')).toBe('***')
  })

  it('masks 6-char keys completely', () => {
    expect(maskApiKey('abcdef')).toBe('***')
  })

  it('masks 7-char keys partially', () => {
    expect(maskApiKey('abcdefg')).toBe('abc***efg')
  })
})
