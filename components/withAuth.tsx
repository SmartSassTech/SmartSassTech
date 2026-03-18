'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function withAuth<P extends object>(
    WrappedComponent: React.ComponentType<P>,
    options?: { allowedRoles?: string[] }
) {
    return function WithAuth(props: P) {
        const router = useRouter()
        const pathname = usePathname()
        const [isMounted, setIsMounted] = useState(false)
        const [isAuthorized, setIsAuthorized] = useState(false)
        const [authError, setAuthError] = useState<string | null>(null)
        const [isRoleAuthorized, setIsRoleAuthorized] = useState<boolean | null>(null)

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

            const checkAccess = async (session: any) => {
                if (!session) {
                    setIsAuthorized(false)
                    const redirectUrl = encodeURIComponent(pathname)
                    window.location.href = `/login?redirect=${redirectUrl}`
                    return
                }

                setIsAuthorized(true)
                clearTimeout(timeoutId)

                // Role check
                if (options?.allowedRoles) {
                    const userRole = session.user.app_metadata?.role || 'client'
                    const hasAccess = options.allowedRoles.includes(userRole)
                    setIsRoleAuthorized(hasAccess)
                    
                    if (!hasAccess && isCurrent) {
                        console.warn(`[withAuth] Role mismatch for ${pathname}. User role: ${userRole}, Allowed: ${options.allowedRoles}`)
                        // Redirect home or to a specific "unauthorized" page
                        router.push('/')
                    }
                } else {
                    setIsRoleAuthorized(true)
                }
            }

            const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
                if (!isCurrent) return
                console.log(`[withAuth] Auth event: ${event}`, session ? 'User present' : 'No user')
                
                if (session) {
                    checkAccess(session)
                } else if (event === 'SIGNED_OUT' || (event === 'INITIAL_SESSION' && !session)) {
                    const redirectUrl = encodeURIComponent(pathname)
                    window.location.href = `/login?redirect=${redirectUrl}`
                }
            })

            // Double check session immediately
            supabase.auth.getSession().then(({ data: { session } }) => {
                if (isCurrent) {
                    checkAccess(session)
                }
            })

            return () => {
                isCurrent = false
                subscription.unsubscribe()
                clearTimeout(timeoutId)
            }
        }, [pathname, router])

        // Prevent hydration mismatch
        if (!isMounted) {
            return null
        }

        // Show loading state while checking auth or role
        if (!isAuthorized || isRoleAuthorized === null) {
            return (
                <div className="bg-kb-bg min-h-screen flex flex-col items-center justify-center p-4">
                    <div className="text-center space-y-4">
                        <div className="w-12 h-12 border-4 border-sst-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
                        <p className="text-sst-primary font-bold animate-pulse">
                            {!isAuthorized ? 'Verifying Session...' : 'Checking Permissions...'}
                        </p>
                        {authError && (
                            <p className="text-sst-primary/60 text-sm mt-4 max-w-xs mx-auto">{authError}</p>
                        )}
                    </div>
                </div>
            )
        }

        // If not role authorized, we've already handled redirect in useEffect, 
        // but we return null here to be safe during the transition.
        if (isRoleAuthorized === false) {
            return null
        }

        return <WrappedComponent {...props} />
    }
}

