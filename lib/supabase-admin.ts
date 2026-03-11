/**
 * Server-only Supabase client using the Service Role key.
 * NEVER import this in client components or expose to the browser.
 * Only use inside Next.js API routes (app/api/**).
 */
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!serviceRoleKey) {
  throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set. Add it to .env.local.')
}

export const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})
