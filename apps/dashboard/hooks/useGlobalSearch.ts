/* eslint-disable @typescript-eslint/no-unused-vars, no-unused-vars */
'use client'
import { useState, useCallback, useEffect } from 'react'
import { logger } from '@/lib/utils/logger'

export interface SearchResult {
  id: string
  title: string
  subtitle: string
  category: 'hub' | 'action' | 'recent' | 'setting'
  icon: string
  path?: string
  action?: () => void
  keywords: string[]
}

// All searchable content
const SEARCH_INDEX: SearchResult[] = [
  // Hubs
  {
    id: 'war-room',
    title: 'War Room',
    subtitle: 'Mission Control Center',
    category: 'hub',
    icon: '🏯',
    path: '/warroom',
    keywords: ['war', 'room', 'command', 'center', 'dashboard', 'mission'],
  },
  {
    id: 'shield',
    title: 'Anti-Dilution Shield',
    subtitle: 'VC Term Sheet Calculator',
    category: 'hub',
    icon: '🛡️',
    path: '/shield',
    keywords: ['shield', 'anti', 'dilution', 'term', 'sheet', 'vc', 'calculator', 'equity'],
  },
  {
    id: 'sales',
    title: 'Sales Force',
    subtitle: 'Sales Pipeline & CRM',
    category: 'hub',
    icon: '💼',
    path: '/sales',
    keywords: ['sales', 'pipeline', 'crm', 'deals', 'revenue'],
  },
  {
    id: 'marketing',
    title: 'Marketing Ops',
    subtitle: 'Campaign Management',
    category: 'hub',
    icon: '📢',
    path: '/marketing',
    keywords: ['marketing', 'campaign', 'ads', 'promotion'],
  },
  {
    id: 'product',
    title: 'Product Lab',
    subtitle: 'Product Development',
    category: 'hub',
    icon: '🔬',
    path: '/product',
    keywords: ['product', 'lab', 'development', 'features'],
  },
  {
    id: 'finance',
    title: 'Finance Vault',
    subtitle: 'Financial Management',
    category: 'hub',
    icon: '💰',
    path: '/finance',
    keywords: ['finance', 'vault', 'money', 'budget', 'accounting'],
  },
  {
    id: 'hr',
    title: 'People Ops',
    subtitle: 'HR & Talent',
    category: 'hub',
    icon: '👥',
    path: '/hr',
    keywords: ['hr', 'people', 'talent', 'hiring', 'team'],
  },
  {
    id: 'legal',
    title: 'Legal Shield',
    subtitle: 'Contracts & Compliance',
    category: 'hub',
    icon: '⚖️',
    path: '/legal',
    keywords: ['legal', 'contracts', 'compliance', 'law'],
  },
  {
    id: 'analytics',
    title: 'Analytics Hub',
    subtitle: 'Data & Insights',
    category: 'hub',
    icon: '📊',
    path: '/analytics',
    keywords: ['analytics', 'data', 'insights', 'metrics', 'reports'],
  },
  {
    id: 'support',
    title: 'Support Desk',
    subtitle: 'Customer Support',
    category: 'hub',
    icon: '🎧',
    path: '/support',
    keywords: ['support', 'help', 'customer', 'tickets'],
  },
  {
    id: 'hubs',
    title: 'All Hubs',
    subtitle: 'Browse All Departments',
    category: 'hub',
    icon: '🏠',
    path: '/hubs',
    keywords: ['hubs', 'all', 'departments', 'browse'],
  },

  // Quick Actions
  {
    id: 'action-theme',
    title: 'Toggle Theme',
    subtitle: 'Switch light/dark mode',
    category: 'action',
    icon: '🌓',
    keywords: ['theme', 'dark', 'light', 'mode', 'toggle'],
  },
  {
    id: 'action-sound',
    title: 'Toggle Sound',
    subtitle: 'Mute/unmute UI sounds',
    category: 'action',
    icon: '🔊',
    keywords: ['sound', 'audio', 'mute', 'unmute'],
  },
  {
    id: 'action-tour',
    title: 'Start Tour',
    subtitle: 'Restart onboarding tour',
    category: 'action',
    icon: '🎯',
    keywords: ['tour', 'onboarding', 'guide', 'help'],
  },
  {
    id: 'action-shortcuts',
    title: 'Keyboard Shortcuts',
    subtitle: 'View all shortcuts',
    category: 'action',
    icon: '⌨️',
    keywords: ['keyboard', 'shortcuts', 'hotkeys', 'keys'],
  },

  // Settings
  {
    id: 'setting-notifications',
    title: 'Notifications',
    subtitle: 'Manage notification preferences',
    category: 'setting',
    icon: '🔔',
    keywords: ['notifications', 'alerts', 'bell'],
  },
  {
    id: 'setting-profile',
    title: 'Profile Settings',
    subtitle: 'Edit your profile',
    category: 'setting',
    icon: '👤',
    keywords: ['profile', 'account', 'settings', 'user'],
  },
  {
    id: 'setting-presets',
    title: 'Theme Presets',
    subtitle: 'Change color theme',
    category: 'setting',
    icon: '🎨',
    keywords: ['theme', 'presets', 'colors', 'cyberpunk', 'ocean', 'forest', 'sunset', 'midnight'],
  },
]

const STORAGE_KEY = 'agencyos-recent-searches'

// Simple fuzzy match
function fuzzyMatch(query: string, text: string): number {
  const q = query.toLowerCase()
  const t = text.toLowerCase()

  // Exact match
  if (t.includes(q)) return 100

  // Word start match
  const words = t.split(/\s+/)
  for (const word of words) {
    if (word.startsWith(q)) return 80
  }

  // Character sequence match
  let qIdx = 0
  let score = 0
  for (let i = 0; i < t.length && qIdx < q.length; i++) {
    if (t[i] === q[qIdx]) {
      score += 10
      qIdx++
    }
  }

  if (qIdx === q.length) return score
  return 0
}

function scoreResult(query: string, result: SearchResult): number {
  const titleScore = fuzzyMatch(query, result.title) * 2
  const subtitleScore = fuzzyMatch(query, result.subtitle)
  const keywordScores = result.keywords.map(k => fuzzyMatch(query, k))
  const maxKeywordScore = Math.max(...keywordScores, 0)

  return titleScore + subtitleScore + maxKeywordScore
}

export function useGlobalSearch() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [recentSearches, setRecentSearches] = useState<string[]>([])

  // Load recent searches
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        setRecentSearches(JSON.parse(stored))
      }
    } catch (e) {
      logger.error('Failed to load recent searches', e)
    }
  }, [])

  // Search function
  const search = useCallback((q: string) => {
    setQuery(q)

    if (!q.trim()) {
      setResults([])
      return
    }

    const scored = SEARCH_INDEX.map(item => ({ item, score: scoreResult(q, item) }))
      .filter(({ score }) => score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 10)
      .map(({ item }) => item)

    setResults(scored)
  }, [])

  // Add to recent searches
  const addToRecent = useCallback((term: string) => {
    if (!term.trim()) return

    setRecentSearches(prev => {
      const filtered = prev.filter(t => t !== term)
      const updated = [term, ...filtered].slice(0, 5)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
      return updated
    })
  }, [])

  // Clear recent searches
  const clearRecent = useCallback(() => {
    setRecentSearches([])
    localStorage.removeItem(STORAGE_KEY)
  }, [])

  // Get suggestions (when no query)
  const getSuggestions = useCallback(() => {
    const recentItems = recentSearches.map(term => ({
      id: `recent-${term}`,
      title: term,
      subtitle: 'Recent search',
      category: 'recent' as const,
      icon: '🕐',
      keywords: [term],
    }))

    return recentItems
  }, [recentSearches])

  return {
    query,
    search,
    results,
    recentSearches,
    addToRecent,
    clearRecent,
    getSuggestions,
    allContent: SEARCH_INDEX,
  }
}
