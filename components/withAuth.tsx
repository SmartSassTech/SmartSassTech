'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function withAuth<P extends object>(
    WrappedComponent: React.ComponentType<P>
) {
    return function WithAuth(props: P) {
        const router = useRouter()
        const pathname = usePathname()
        const [isMounted, setIsMounted] = useState(false)
        const [isAuthorized, setIsAuthorized] = useState(false)
        const [authError, setAuthError] = useState<string | null>(null)

        useEffect(() => {
            setIsMounted(true)
            let isCurrent = true

            console.log(`[withAuth] Monitoring auth state for ${pathname}...`)

            // Safety timeout
            const timeoutId = setTimeout(() => {
                if (isCurrent && !isAuthorized) {
                    console.warn(`[withAuth] Auth check timed out for ${pathname}`)
                    setAuthError('Still verifying your session. This can happen on slow connections. If it persists, please refresh.')
                }
            }, 7000)

            const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
                if (!isCurrent) return

                console.log(`[withAuth] Auth event: ${event}`, session ? 'User present' : 'No user')

                if (session) {
                    setIsAuthorized(true)
                    clearTimeout(timeoutId)
                } else if (event === 'SIGNED_OUT' || (event === 'INITIAL_SESSION' && !session)) {
                    // Only redirect if we are confirmed unauthenticated
                    const redirectUrl = encodeURIComponent(pathname)
                    console.log('[withAuth] Redirecting to login...')
                    window.location.href = `/login?redirect=${redirectUrl}`
                }
            })

            // Double check session immediately too
            supabase.auth.getSession().then(({ data: { session } }) => {
                if (isCurrent && session) {
                    setIsAuthorized(true)
                    clearTimeout(timeoutId)
                }
            })

            return () => {
                isCurrent = false
                subscription.unsubscribe()
                clearTimeout(timeoutId)
            }
        }, [pathname])

        // Prevent hydration mismatch
        if (!isMounted) {
            return null
        }

        if (!isAuthorized) {
            return (
                <div className="bg-kb-bg min-h-screen flex flex-col items-center justify-center p-4">
                    <div className="text-center space-y-4">
                        <div className="w-12 h-12 border-4 border-sst-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
                        <p className="text-sst-primary font-bold animate-pulse">Verifying Access...</p>
                        {authError && (
                            <p className="text-sst-primary/60 text-sm mt-4 max-w-xs mx-auto">{authError}</p>
                        )}
                    </div>
                </div>
            )
        }

        return <WrappedComponent {...props} />
    }
}
