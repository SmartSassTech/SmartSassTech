import { type EmailOtpType } from '@supabase/supabase-js'
import { type NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

/**
 * Handles the email confirmation link redirect from Supabase.
 * This route verifies the token_hash and then redirects the user.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null
  const next = searchParams.get('next') ?? '/'

  const redirectTo = request.nextUrl.clone()
  redirectTo.pathname = next
  redirectTo.searchParams.delete('token_hash')
  redirectTo.searchParams.delete('type')
  redirectTo.searchParams.delete('next')

  if (token_hash && type) {
    // Note: Since we are using the client-side supabase instance here, 
    // it will use the browser/server environment properly if it's a standard client.
    // However, verifyOtp on the server might not set cookies automatically 
    // without the @supabase/auth-helpers or @supabase/ssr package.
    // Given the current setup, we'll try it with the standard client.
    
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    })

    if (!error) {
      return NextResponse.redirect(redirectTo)
    }

    console.error('[Auth Confirm] Verification error:', error)
  }

  // Return the user to an error page or home with an error message
  const errorRedirect = request.nextUrl.clone()
  errorRedirect.pathname = '/login'
  errorRedirect.searchParams.set('message', 'Email verification failed. The link may have expired.')
  errorRedirect.searchParams.set('type', 'error')
  
  return NextResponse.redirect(errorRedirect)
}
