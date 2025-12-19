'use client'
import { Suspense } from 'react'
import { usePathname } from 'next/navigation'
import QuickNavSidebar from '@/components/QuickNavSidebar'
import CommandPalette from '@/components/CommandPalette'
import KeyboardShortcuts from '@/components/KeyboardShortcuts'
import { ToastProvider } from '@/components/Toast'
import { ThemeProvider } from '@/components/ThemeProvider'
import { TourProvider } from '@/components/OnboardingTour'
import { ThemePresetProvider } from '@/hooks/useThemePresets'
import { SoundProvider } from '@/hooks/useSoundEffects'
import dynamic from 'next/dynamic'

// Dynamic imports to avoid hydration issues
const ThemeToggle = dynamic(
    () => import('@/components/ThemeProvider').then(mod => ({ default: mod.ThemeToggle })),
    { ssr: false }
)
const NotificationBell = dynamic(
    () => import('@/components/NotificationBell'),
    { ssr: false }
)
const ThemeSelector = dynamic(
    () => import('@/components/ThemeSelector'),
    { ssr: false }
)
const SoundToggle = dynamic(
    () => import('@/components/SoundToggle'),
    { ssr: false }
)
const Breadcrumb = dynamic(
    () => import('@/components/Breadcrumb'),
    { ssr: false }
)
const ProgressBar = dynamic(
    () => import('@/components/ProgressBar'),
    { ssr: false }
)
const ScrollToTop = dynamic(
    () => import('@/components/ScrollToTop'),
    { ssr: false }
)
const PageTransition = dynamic(
    () => import('@/components/PageTransition'),
    { ssr: false }
)


export default function ClientLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname()

    // Landing page should be clean - no dashboard UI widgets
    const isLandingPage = pathname === '/'

    return (
        <ThemeProvider>
            <ThemePresetProvider>
                <SoundProvider>
                    <ToastProvider>
                        <TourProvider>
                            {!isLandingPage && (
                                <>
                                    <Suspense fallback={null}>
                                        <ProgressBar />
                                    </Suspense>
                                    <QuickNavSidebar />
                                    <CommandPalette />
                                    <KeyboardShortcuts />
                                    <ThemeToggle />
                                    <NotificationBell />
                                    <ThemeSelector />
                                    <SoundToggle />
                                    <Breadcrumb />
                                    <ScrollToTop />
                                </>
                            )}
                            <PageTransition>
                                {children}
                            </PageTransition>
                        </TourProvider>
                    </ToastProvider>
                </SoundProvider>
            </ThemePresetProvider>
        </ThemeProvider>
    )
}
