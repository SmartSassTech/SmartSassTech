import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function POST(request: Request) {
  try {
    const { userId, role } = await request.json()
    const authHeader = request.headers.get('Authorization')

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing or invalid authorization header' }, { status: 401 })
    }

    const token = authHeader.split(' ')[1]

    // 1. Verify the requester's identity and get their role
    const { data: { user: requester }, error: authError } = await supabaseAdmin.auth.getUser(token)

    if (authError || !requester) {
      console.error('[Update Role API] Requester verification failed:', authError)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const requesterRole = requester.app_metadata?.role || 'client'
    
    // Authorization logic:
    // 1. Clients cannot change any roles.
    if (requesterRole === 'client') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // 2. Agents can change roles to 'client' or 'agent', but NOT 'admin'.
    if (requesterRole === 'agent') {
      if (role === 'admin') {
        return NextResponse.json({ error: 'Agents cannot assign the administrator role.' }, { status: 403 })
      }
      
      // Also prevent agents from changing an existing admin's role
      const { data: targetUser, error: fetchError } = await supabaseAdmin.from('profiles').select('role').eq('id', userId).single()
      if (fetchError || (targetUser && targetUser.role === 'admin')) {
        return NextResponse.json({ error: 'Agents cannot modify administrator accounts.' }, { status: 403 })
      }
    }

    // 3. Admins can do anything (already covered by fallthrough)

    // Validate role
    const validRoles = ['client', 'agent', 'admin']
    if (!validRoles.includes(role)) {
      return NextResponse.json({ error: 'Invalid role specified.' }, { status: 400 })
    }

    console.log(`[Update Role API] Updating user ${userId} to role ${role} requested by ${requester.id}`)

    // 2. Update Auth User Metadata
    const { error: authUpdateError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      app_metadata: { role }
    })

    if (authUpdateError) {
      console.error('[Update Role API] Auth update failed:', authUpdateError)
      return NextResponse.json({ error: `Failed to update auth metadata: ${authUpdateError.message}` }, { status: 500 })
    }

    // 3. Update Public Profile
    const { error: profileUpdateError } = await supabaseAdmin.from('profiles').update({ role }).eq('id', userId)

    if (profileUpdateError) {
      console.error('[Update Role API] Profile update failed:', profileUpdateError)
      // Note: Auth metadata was updated but profile wasn't. This is a partial success/failure state.
      return NextResponse.json({ error: `Updated auth but failed to update profile: ${profileUpdateError.message}` }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      message: `User role has been updated to ${role}.` 
    })

  } catch (error: any) {
    console.error('[Update Role API] Unexpected error:', error)
    return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 })
  }
}
