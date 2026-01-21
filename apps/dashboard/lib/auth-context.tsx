'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { logger } from '@/lib/utils/logger'

interface User {
  username: string
  role: string
}

interface AuthContextType {
  user: User | null
  token: string | null
  login: (token: string) => void
  logout: () => void
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // Check local storage on mount
    const storedToken = localStorage.getItem('agencyos_token')
    if (storedToken) {
      try {
        // Basic JWT decode to get username/role (in production use a library or verify endpoint)
        const payload = JSON.parse(atob(storedToken.split('.')[1]))
        setUser({ username: payload.sub, role: payload.role })
        setToken(storedToken)
      } catch (e) {
        logger.error('Invalid token in storage', e)
        localStorage.removeItem('agencyos_token')
      }
    }
    setIsLoading(false)
  }, [])

  const login = (newToken: string) => {
    localStorage.setItem('agencyos_token', newToken)
    setToken(newToken)
    try {
      const payload = JSON.parse(atob(newToken.split('.')[1]))
      setUser({ username: payload.sub, role: payload.role })
      router.push('/dashboard')
    } catch (e) {
      logger.error('Invalid token provided', e)
    }
  }

  const logout = () => {
    localStorage.removeItem('agencyos_token')
    setToken(null)
    setUser(null)
    router.push('/login')
  }

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
