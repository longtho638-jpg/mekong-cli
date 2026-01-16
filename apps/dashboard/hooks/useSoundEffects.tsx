 
'use client'
import type { ReactNode } from 'react'
import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { logger } from '@/lib/utils/logger'

export type SoundType = 'click' | 'hover' | 'success' | 'error' | 'notification' | 'whoosh' | 'pop'

interface SoundContextType {
  play: (type: SoundType) => void
  isMuted: boolean
  toggleMute: () => void
  volume: number
  setVolume: (v: number) => void
}

const SoundContext = createContext<SoundContextType | undefined>(undefined)

const STORAGE_KEY = 'agencyos-sound-settings'

// Web Audio API based sound generator (no external files needed)
function createOscillatorSound(
  audioContext: AudioContext,
  frequency: number,
  duration: number,
  type: OscillatorType = 'sine',
  volume: number = 0.1
): void {
  const oscillator = audioContext.createOscillator()
  const gainNode = audioContext.createGain()

  oscillator.connect(gainNode)
  gainNode.connect(audioContext.destination)

  oscillator.frequency.value = frequency
  oscillator.type = type

  // Envelope for smooth sound
  gainNode.gain.setValueAtTime(0, audioContext.currentTime)
  gainNode.gain.linearRampToValueAtTime(volume, audioContext.currentTime + 0.01)
  gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + duration)

  oscillator.start(audioContext.currentTime)
  oscillator.stop(audioContext.currentTime + duration)
}

function createNoiseSound(
  audioContext: AudioContext,
  duration: number,
  volume: number = 0.05
): void {
  const bufferSize = audioContext.sampleRate * duration
  const buffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate)
  const data = buffer.getChannelData(0)

  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 2)
  }

  const source = audioContext.createBufferSource()
  const gainNode = audioContext.createGain()
  const filter = audioContext.createBiquadFilter()

  source.buffer = buffer
  filter.type = 'highpass'
  filter.frequency.value = 1000

  source.connect(filter)
  filter.connect(gainNode)
  gainNode.connect(audioContext.destination)

  gainNode.gain.value = volume
  source.start()
}

export function SoundProvider({ children }: { children: ReactNode }) {
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null)
  const [isMuted, setIsMuted] = useState(false)
  const [volume, setVolume] = useState(0.3)

  // Initialize AudioContext on first user interaction
  useEffect(() => {
    const initAudio = () => {
      if (!audioContext) {
        const ctx = new (
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
        )()
        setAudioContext(ctx)
      }
      window.removeEventListener('click', initAudio)
      window.removeEventListener('keydown', initAudio)
    }

    window.addEventListener('click', initAudio)
    window.addEventListener('keydown', initAudio)

    return () => {
      window.removeEventListener('click', initAudio)
      window.removeEventListener('keydown', initAudio)
    }
  }, [audioContext])

  // Load settings
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const { muted, vol } = JSON.parse(stored)
        setIsMuted(muted ?? false)
        setVolume(vol ?? 0.3)
      }
    } catch (e) {
      logger.error('Failed to load sound settings', e)
    }
  }, [])

  // Save settings
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ muted: isMuted, vol: volume }))
  }, [isMuted, volume])

  const play = useCallback(
    (type: SoundType) => {
      if (isMuted || !audioContext) return

      const vol = volume

      switch (type) {
        case 'click':
          // Sharp click - two quick tones
          createOscillatorSound(audioContext, 800, 0.05, 'square', vol * 0.3)
          setTimeout(() => createOscillatorSound(audioContext, 600, 0.03, 'square', vol * 0.2), 50)
          break

        case 'hover':
          // Soft hover - gentle high tone
          createOscillatorSound(audioContext, 1200, 0.08, 'sine', vol * 0.15)
          break

        case 'success':
          // Success chime - ascending tones
          createOscillatorSound(audioContext, 523, 0.1, 'sine', vol * 0.3)
          setTimeout(() => createOscillatorSound(audioContext, 659, 0.1, 'sine', vol * 0.3), 100)
          setTimeout(() => createOscillatorSound(audioContext, 784, 0.15, 'sine', vol * 0.3), 200)
          break

        case 'error':
          // Error buzz - low harsh tone
          createOscillatorSound(audioContext, 200, 0.2, 'sawtooth', vol * 0.2)
          setTimeout(
            () => createOscillatorSound(audioContext, 180, 0.2, 'sawtooth', vol * 0.2),
            150
          )
          break

        case 'notification':
          // Notification ding - bell-like
          createOscillatorSound(audioContext, 880, 0.15, 'sine', vol * 0.4)
          createOscillatorSound(audioContext, 1760, 0.1, 'sine', vol * 0.2)
          break

        case 'whoosh':
          // Whoosh - noise sweep
          createNoiseSound(audioContext, 0.15, vol * 0.3)
          break

        case 'pop':
          // Pop - quick bubble
          createOscillatorSound(audioContext, 400, 0.05, 'sine', vol * 0.4)
          setTimeout(() => createOscillatorSound(audioContext, 600, 0.03, 'sine', vol * 0.2), 30)
          break
      }
    },
    [isMuted, volume, audioContext]
  )

  const toggleMute = useCallback(() => {
    setIsMuted(prev => !prev)
  }, [])

  return (
    <SoundContext.Provider value={{ play, isMuted, toggleMute, volume, setVolume }}>
      {children}
    </SoundContext.Provider>
  )
}

export function useSoundEffects() {
  const context = useContext(SoundContext)
  if (!context) {
    return {
      play: () => {},
      isMuted: true,
      toggleMute: () => {},
      volume: 0,
      setVolume: () => {},
    }
  }
  return context
}
