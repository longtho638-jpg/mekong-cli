'use client'
import { useToastHelpers } from '@/components/Toast'
import { motion } from 'framer-motion'

export default function ToastDemo() {
    const toast = useToastHelpers()

    const demos = [
        { label: '✅ Success', onClick: () => toast.success('Agent Completed', 'Scout finished market analysis') },
        { label: '❌ Error', onClick: () => toast.error('Agent Failed', 'Rate limit exceeded on API') },
        { label: '⚠️ Warning', onClick: () => toast.warning('Low Credits', 'API credits running low') },
        { label: '💡 Info', onClick: () => toast.info('Agent Running', 'Director processing video...') },
    ]

    return (
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {demos.map((demo, i) => (
                <motion.button
                    key={i}
                    onClick={demo.onClick}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    style={{
                        background: 'rgba(255, 255, 255, 0.1)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        borderRadius: '8px',
                        padding: '8px 16px',
                        color: '#fff',
                        cursor: 'pointer',
                        fontSize: '13px',
                        fontFamily: 'JetBrains Mono, monospace',
                    }}
                >
                    {demo.label}
                </motion.button>
            ))}
        </div>
    )
}
