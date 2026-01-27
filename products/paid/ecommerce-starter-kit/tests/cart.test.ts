import { describe, it, expect, beforeEach, vi } from 'vitest'
import { act } from '@testing-library/react'

const localStorageMock = (function () {
  let store: Record<string, string> = {}
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString()
    },
    removeItem: (key: string) => {
      delete store[key]
    },
    clear: () => {
      store = {}
    },
  }
})()

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
})

// Mock zustand persistence
vi.mock('zustand/middleware', async () => {
  const actual = await vi.importActual('zustand/middleware')
  return {
    ...actual,
    persist: (config: any) => (set: any, get: any, api: any) => config(set, get, api),
  }
})

import { useCartStore } from '@/lib/cart'

describe('Cart Store', () => {
  beforeEach(() => {
    act(() => {
      useCartStore.setState({ items: [] })
    })
  })

  it('should start with an empty cart', () => {
    const { items } = useCartStore.getState()
    expect(items).toEqual([])
  })
  beforeEach(() => {
    act(() => {
      useCartStore.getState().clearCart()
    })
    localStorage.clear()
  })

  it('should start with an empty cart', () => {
    const { items } = useCartStore.getState()
    expect(items).toEqual([])
  })

  it('should add an item to the cart', () => {
    const product = {
      id: '1',
      name: 'Test Product',
      price: 100,
      description: 'Test',
      images: [],
      inventory: 10,
      category: 'test',
      created_at: 'now',
      updated_at: 'now',
      sale_price: null
    }

    act(() => {
      useCartStore.getState().addItem(product)
    })

    const { items } = useCartStore.getState()
    expect(items).toHaveLength(1)
    expect(items[0]).toEqual({ ...product, quantity: 1 })
  })

  it('should increment quantity if adding existing item', () => {
    const product = {
      id: '1',
      name: 'Test Product',
      price: 100,
      description: 'Test',
      images: [],
      inventory: 10,
      category: 'test',
      created_at: 'now',
      updated_at: 'now',
      sale_price: null
    }

    act(() => {
      useCartStore.getState().addItem(product)
      useCartStore.getState().addItem(product)
    })

    const { items } = useCartStore.getState()
    expect(items).toHaveLength(1)
    expect(items[0].quantity).toBe(2)
  })

  it('should remove an item', () => {
    const product = {
      id: '1',
      name: 'Test Product',
      price: 100,
      description: 'Test',
      images: [],
      inventory: 10,
      category: 'test',
      created_at: 'now',
      updated_at: 'now',
      sale_price: null
    }

    act(() => {
      useCartStore.getState().addItem(product)
      useCartStore.getState().removeItem('1')
    })

    const { items } = useCartStore.getState()
    expect(items).toHaveLength(0)
  })

  it('should calculate total correctly', () => {
    const product1 = {
      id: '1',
      name: 'P1',
      price: 100,
      description: '',
      images: [],
      inventory: 1,
      category: '',
      created_at: '',
      updated_at: '',
      sale_price: null
    }
    const product2 = {
      id: '2',
      name: 'P2',
      price: 50,
      description: '',
      images: [],
      inventory: 1,
      category: '',
      created_at: '',
      updated_at: '',
      sale_price: null
    }

    act(() => {
      useCartStore.getState().addItem(product1) // 100
      useCartStore.getState().addItem(product2) // 50
      useCartStore.getState().addItem(product2) // 50
    })

    const total = useCartStore.getState().total()
    expect(total).toBe(200)
  })
})
