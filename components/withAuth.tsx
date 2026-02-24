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

        useEffect(() => {
            setIsMounted(true)
            const checkAuth = async () => {
                const {
                    data: { session },
                } = await supabase.auth.getSession()

                if (!session) {
                    // If not logged in, build redirect url
                    const redirectUrl = encodeURIComponent(pathname)
                    // Use hard redirect to bypass any Next.js client-side freezing
                    window.location.href = `/login?redirect=${redirectUrl}`
                } else {
                    setIsAuthorized(true)
                }
            }

            checkAuth()
        }, [pathname, router])

        // Prevent hydration mismatch by not rendering anything until mounted
        if (!isMounted) {
            return null
        }

        if (!isAuthorized) {
            // Return a full screen branded loader so there is no flicker of the protected content
            return (
                <div className="bg-kb-bg min-h-screen flex flex-col items-center justify-center p-4">
                    <div className="text-center space-y-4">
                        <div className="w-12 h-12 border-4 border-sst-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
                        <p className="text-sst-primary font-bold animate-pulse">Verifying Access...</p>
                    </div>
                </div>
            )
        }

        return <WrappedComponent {...props} />
    }
}
