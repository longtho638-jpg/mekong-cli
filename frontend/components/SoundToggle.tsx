'use client'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSoundEffects } from '@/hooks/useSoundEffects'

export default function SoundToggle() {
    const { isMuted, toggleMute, volume, setVolume, play } = useSoundEffects()
    const [showVolume, setShowVolume] = useState(false)

    const handleToggle = () => {
        toggleMute()
        if (isMuted) {
            // Will be unmuted, play a sound
            setTimeout(() => play('pop'), 100)
        }
    }

    return (
        <div
            style={{
                position: 'fixed',
                bottom: '1rem',
                right: '4.5rem',
                zIndex: 1000,
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
            }}
            onMouseEnter={() => setShowVolume(true)}
            onMouseLeave={() => setShowVolume(false)}
        >
            {/* Sound Toggle Button */}
            <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleToggle}
                style={{
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    background: isMuted ? 'rgba(255,255,255,0.03)' : 'rgba(0,255,136,0.1)',
                    border: isMuted ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,255,136,0.3)',
                    color: isMuted ? '#666' : '#00ff88',
                    fontSize: '1.1rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.3s ease',
                }}
                title={isMuted ? 'Unmute sounds' : 'Mute sounds'}
            >
                {isMuted ? '🔇' : '🔊'}
            </motion.button>

            {/* Volume Slider */}
            <AnimatePresence>
                {showVolume && !isMuted && (
                    <motion.div
                        initial={{ opacity: 0, width: 0 }}
                        animate={{ opacity: 1, width: 100 }}
                        exit={{ opacity: 0, width: 0 }}
                        style={{
                            height: 36,
                            background: 'rgba(0,0,0,0.8)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '18px',
                            padding: '0 1rem',
                            display: 'flex',
                            alignItems: 'center',
                            overflow: 'hidden',
                        }}
                    >
                        <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.1"
                            value={volume}
                            onChange={(e) => {
                                setVolume(parseFloat(e.target.value))
                                play('hover')
                            }}
                            style={{
                                width: '100%',
                                height: 4,
                                appearance: 'none',
                                background: `linear-gradient(90deg, #00ff88 ${volume * 100}%, #333 ${volume * 100}%)`,
                                borderRadius: 2,
                                outline: 'none',
                                cursor: 'pointer',
                            }}
                        />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
