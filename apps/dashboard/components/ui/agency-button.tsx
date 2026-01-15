import React from 'react'
import { cn } from '@/lib/utils'

interface AgencyButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'ghost' | 'magnetic'
    size?: 'sm' | 'md' | 'lg'
    children: React.ReactNode
}

export const AgencyButton = React.forwardRef<HTMLButtonElement, AgencyButtonProps>(
    ({ className, variant = 'primary', size = 'md', children, ...props }, ref) => {
        
        const variants = {
            primary: "bg-gradient-to-r from-emerald-600 to-emerald-500 text-white shadow-catalyst hover:shadow-catalyst-lg border border-emerald-400/20 hover:border-emerald-400/40",
            secondary: "bg-white/5 text-neutral-200 border border-white/10 hover:bg-white/10 hover:text-white backdrop-blur-sm",
            ghost: "bg-transparent text-neutral-400 hover:text-white hover:bg-white/5",
            magnetic: "btn-magnetic bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-500/25 border border-purple-400/20"
        }

        const sizes = {
            sm: "px-3 py-1.5 text-xs font-medium rounded-lg",
            md: "px-4 py-2 text-sm font-medium rounded-xl",
            lg: "px-6 py-3 text-base font-semibold rounded-xl"
        }

        return (
            <button
                ref={ref}
                className={cn(
                    "inline-flex items-center justify-center gap-2 transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:pointer-events-none",
                    variants[variant],
                    sizes[size],
                    className
                )}
                {...props}
            >
                {children}
            </button>
        )
    }
)
AgencyButton.displayName = "AgencyButton"
