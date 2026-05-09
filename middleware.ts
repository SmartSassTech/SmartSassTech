import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * Next.js Middleware — Server-side route protection
 * 
 * Defense-in-depth layer for admin routes. Checks for the presence of
 * a Supabase auth token in cookies before allowing access to /admin/*.
 * 
 * The client-side withAuth HOC remains the primary auth guard with
 * role-based checks. This middleware provides an additional server-side
 * gate that blocks unauthenticated requests before they even reach
 * the client-side rendering.
 */
export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl

    // Only protect /admin routes
    if (pathname.startsWith('/admin')) {
        // Check for Supabase auth cookie (set by @supabase/supabase-js)
        // The cookie name pattern is: sb-<project-ref>-auth-token
        const cookies = request.cookies.getAll()
        const hasAuthToken = cookies.some(
            cookie => cookie.name.includes('auth-token') || cookie.name.includes('sb-')
        )

        if (!hasAuthToken) {
            // No auth cookie found — redirect to login with return URL
            const loginUrl = new URL('/login', request.url)
            loginUrl.searchParams.set('redirect', pathname)
            return NextResponse.redirect(loginUrl)
        }
    }

    return NextResponse.next()
}

export const config = {
    matcher: ['/admin/:path*'],
}
