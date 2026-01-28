'use client'

import { useState, useEffect, useRef } from 'react'
import { Search, X } from 'lucide-react'
import { useRouter } from 'next/navigation'

// Simple debounce implementation (KISS - avoid lodash dependency)
function debounce<T extends (...args: any[]) => any>(func: T, wait: number): T {
  let timeout: NodeJS.Timeout | null = null
  return ((...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }) as T
}

interface AutocompleteResult {
  title: string
  type: 'user' | 'transaction' | 'audit'
  id: string
}

export function SearchBar({ onSearch }: { onSearch?: (query: string) => void }) {
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState<AutocompleteResult[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  // We need to use a ref to keep the debounced function stable across renders
  // or use useCallback properly. However, lodash debounce returns a new function each call if defined inside render.
  // Ideally define outside or use useMemo.

  // Actually, for simplicity in this environment without installing use-debounce or similar hooks:
  const fetchSuggestionsRef = useRef(
    debounce(async (q: string) => {
      if (q.length < 2) {
        setSuggestions([])
        return
      }

      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/search/autocomplete?q=${encodeURIComponent(q)}`
        )
        if (res.ok) {
          const data = await res.json()
          setSuggestions(data.suggestions || [])
          setShowSuggestions(true)
        }
      } catch (e) {
        console.error('Autocomplete fetch error', e)
      }
    }, 200)
  )

  useEffect(() => {
    fetchSuggestionsRef.current(query)
  }, [query])

  const handleSearch = () => {
    if (onSearch) {
      onSearch(query)
    } else {
      // Default behavior: navigate to search page
      if (query.trim()) {
        router.push(`/dashboard/search?q=${encodeURIComponent(query)}`)
      }
    }
    setShowSuggestions(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  return (
    <div className="relative w-full max-w-2xl">
      <div className="flex items-center border rounded-lg px-4 py-2 bg-white shadow-sm focus-within:ring-2 focus-within:ring-blue-500">
        <Search size={20} className="text-gray-400" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Search users, transactions, logs..."
          className="flex-1 ml-2 outline-none text-sm"
        />
        {query && (
          <button onClick={() => setQuery('')} className="ml-2 hover:bg-gray-100 rounded-full p-1">
            <X size={16} className="text-gray-400" />
          </button>
        )}
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute top-full mt-2 w-full bg-white border rounded-lg shadow-lg max-h-64 overflow-y-auto z-50">
          {suggestions.map((suggestion, idx) => (
            <button
              key={idx}
              onClick={() => {
                setQuery(suggestion.title)
                handleSearch()
              }}
              className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-2 border-b last:border-b-0"
            >
              <span className="text-[10px] uppercase font-bold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                {suggestion.type}
              </span>
              <span className="text-sm text-gray-700 truncate">{suggestion.title}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
