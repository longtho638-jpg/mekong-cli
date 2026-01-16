/* eslint-disable @typescript-eslint/no-unused-vars, no-unused-vars */
'use client'
import { useState, useEffect, useCallback } from 'react'

const MAX_FAVORITES = 5
const STORAGE_KEY = 'agencyos-favorites'

export interface Favorite {
    path: string
    name: string
    icon: string
    pinnedAt: number
}

export function useFavorites() {
    const [favorites, setFavorites] = useState<Favorite[]>([])
    const [mounted, setMounted] = useState(false)

    // Load favorites from localStorage
    useEffect(() => {
        const stored = localStorage.getItem(STORAGE_KEY)
        if (stored) {
            try {
                setFavorites(JSON.parse(stored))
            } catch (e) {
                console.error('Failed to parse favorites:', e)
            }
        }
        setMounted(true)
    }, [])

    // Save to localStorage whenever favorites change
    useEffect(() => {
        if (mounted) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites))
        }
    }, [favorites, mounted])

    const isFavorite = useCallback((path: string) => {
        return favorites.some(f => f.path === path)
    }, [favorites])

    const addFavorite = useCallback((hub: { path: string; name: string; icon: string }) => {
        if (favorites.length >= MAX_FAVORITES) {
            return { success: false, message: `Maximum ${MAX_FAVORITES} favorites allowed` }
        }
        if (isFavorite(hub.path)) {
            return { success: false, message: 'Already in favorites' }
        }

        const newFavorite: Favorite = {
            ...hub,
            pinnedAt: Date.now()
        }
        setFavorites(prev => [newFavorite, ...prev])
        return { success: true, message: 'Added to favorites' }
    }, [favorites.length, isFavorite])

    const removeFavorite = useCallback((path: string) => {
        setFavorites(prev => prev.filter(f => f.path !== path))
        return { success: true, message: 'Removed from favorites' }
    }, [])

    const toggleFavorite = useCallback((hub: { path: string; name: string; icon: string }) => {
        if (isFavorite(hub.path)) {
            return removeFavorite(hub.path)
        } else {
            return addFavorite(hub)
        }
    }, [isFavorite, addFavorite, removeFavorite])

    const reorderFavorites = useCallback((fromIndex: number, toIndex: number) => {
        setFavorites(prev => {
            const updated = [...prev]
            const [moved] = updated.splice(fromIndex, 1)
            updated.splice(toIndex, 0, moved)
            return updated
        })
    }, [])

    return {
        favorites,
        isFavorite,
        addFavorite,
        removeFavorite,
        toggleFavorite,
        reorderFavorites,
        canAddMore: favorites.length < MAX_FAVORITES,
        maxFavorites: MAX_FAVORITES,
    }
}
