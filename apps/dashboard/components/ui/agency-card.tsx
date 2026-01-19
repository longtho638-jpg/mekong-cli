import React from 'react'
import { cn } from '@/lib/utils'

interface AgencyCardProps extends React.HTMLAttributes<HTMLDivElement> {
    variant?: 'glass' | 'glass-pro' | 'neon' | 'bento'
    children: React.ReactNode
}

export const AgencyCard = React.forwardRef<HTMLDivElement, AgencyCardProps>(
    ({ className, variant = 'glass', children, ...props }, ref) => {
        
        const variants = {
            glass: "glass-panel rounded-2xl p-6",
            'glass-pro': "glass-card-pro rounded-2xl p-6",
            neon: "glass-card-pro rounded-2xl p-6 neon-border",
            bento: "glass-catalyst rounded-2xl p-6 hover-lift"
        }

        return (
            <div
                ref={ref}
                className={cn(
                    variants[variant],
                    className
                )}
                {...props}
            >
                {children}
            </div>
        )
    }
)
AgencyCard.displayName = "AgencyCard"
