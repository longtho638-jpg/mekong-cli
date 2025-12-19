'use client'
import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNotifications, Notification } from '@/hooks/useNotifications'

function formatTimeAgo(timestamp: number) {
    const seconds = Math.floor((Date.now() - timestamp) / 1000)
    if (seconds < 60) return 'Just now'
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h ago`
    const days = Math.floor(hours / 24)
    return `${days}d ago`
}

function getTypeColor(type: Notification['type']) {
    switch (type) {
        case 'success': return '#00ff41'
        case 'warning': return '#ffd700'
        case 'error': return '#ff0000'
        default: return '#00bfff'
    }
}

export default function NotificationBell() {
    const { notifications, unreadCount, markAsRead, markAllAsRead, removeNotification, clearAll } = useNotifications()
    const [isOpen, setIsOpen] = useState(false)
    const panelRef = useRef<HTMLDivElement>(null)

    // Close panel when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    return (
        <div ref={panelRef} className="fixed top-4 right-4 z-[100]">
            {/* Bell Button */}
            <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsOpen(!isOpen)}
                className={`
                    w-12 h-12 rounded-full flex items-center justify-center text-xl cursor-pointer transition-all duration-300 
                    border relative
                    ${isOpen
                        ? 'bg-white/10 border-white/30 shadow-[0_0_15px_rgba(255,255,255,0.1)]'
                        : 'bg-black/20 border-white/10 hover:bg-white/10 hover:border-white/20'
                    }
                `}
            >
                🔔
                {/* Badge */}
                {unreadCount > 0 && (
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -top-1 -right-1 min-w-[20px] h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center px-1.5 shadow-[0_0_10px_rgba(239,68,68,0.6)] border border-red-400"
                    >
                        <motion.span
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                        >
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </motion.span>
                    </motion.div>
                )}
            </motion.button>

            {/* Dropdown Panel */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        className="absolute top-14 right-0 w-[380px] max-h-[500px] bg-[#0a0a0f]/90 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] ultra-glass origin-top-right flex flex-col"
                    >
                        {/* Header */}
                        <div className="p-4 border-b border-white/10 bg-white/5 flex justify-between items-center shrink-0">
                            <h3 className="text-base text-white font-bold flex items-center gap-2">
                                🔔 Notifications
                                {unreadCount > 0 && (
                                    <span className="bg-red-500/20 text-red-400 text-[10px] px-2 py-0.5 rounded-full border border-red-500/20 font-mono">
                                        {unreadCount} NEW
                                    </span>
                                )}
                            </h3>
                            <div className="flex gap-3">
                                {unreadCount > 0 && (
                                    <button
                                        onClick={markAllAsRead}
                                        className="text-[10px] text-cyan-400 hover:text-cyan-300 font-medium tracking-wide uppercase transition-colors"
                                    >
                                        Mark all read
                                    </button>
                                )}
                                {notifications.length > 0 && (
                                    <button
                                        onClick={clearAll}
                                        className="text-[10px] text-white/40 hover:text-white/70 font-medium tracking-wide uppercase transition-colors"
                                    >
                                        Clear
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Notifications List */}
                        <div className="overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent flex-1">
                            {notifications.length === 0 ? (
                                <div className="p-12 text-center text-white/30 flex flex-col items-center">
                                    <p className="text-4xl mb-3 opacity-50">🔕</p>
                                    <p className="text-sm font-medium">No notifications</p>
                                    <p className="text-[10px] mt-1 opacity-70">You're all caught up!</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-white/5">
                                    {notifications.map((notification, i) => (
                                        <motion.div
                                            key={notification.id}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: i * 0.05 }}
                                            onClick={() => markAsRead(notification.id)}
                                            className={`
                                                p-4 cursor-pointer transition-colors relative group
                                                ${notification.read ? 'bg-transparent hover:bg-white/5' : 'bg-gradient-to-r from-red-500/5 to-transparent hover:bg-white/5'}
                                            `}
                                        >
                                            {/* Unread indicator */}
                                            {!notification.read && (
                                                <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]" />
                                            )}

                                            <div className="flex items-start gap-4">
                                                <span
                                                    className="text-xl mt-0.5 filter"
                                                    style={{ filter: `drop-shadow(0 0 8px ${getTypeColor(notification.type)}60)` }}
                                                >
                                                    {notification.icon || '📌'}
                                                </span>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex justify-between items-start gap-2">
                                                        <p className={`text-sm leading-tight ${notification.read ? 'text-white/60 font-medium' : 'text-white font-bold'}`}>
                                                            {notification.title}
                                                        </p>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation()
                                                                removeNotification(notification.id)
                                                            }}
                                                            className="text-white/20 hover:text-white/60 -mt-1 -mr-1 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                                        >
                                                            ✕
                                                        </button>
                                                    </div>
                                                    <p className="text-xs text-white/50 mt-1 leading-relaxed line-clamp-2">
                                                        {notification.message}
                                                    </p>
                                                    <p className="text-[10px] text-white/30 mt-2 font-mono">
                                                        {formatTimeAgo(notification.timestamp)}
                                                    </p>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
