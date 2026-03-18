import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function POST(request: Request) {
  try {
    const { userId } = await request.json()
    const authHeader = request.headers.get('Authorization')

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing or invalid authorization header' }, { status: 401 })
    }

    const token = authHeader.split(' ')[1]

    // 1. Verify the requester's identity and get their role
    const { data: { user: requester }, error: authError } = await supabaseAdmin.auth.getUser(token)

    if (authError || !requester) {
      console.error('[Delete User API] Requester verification failed:', authError)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const requesterRole = requester.app_metadata?.role || 'client'
    const isOwner = requester.id === userId
    const isAgent = requesterRole === 'agent' || requesterRole === 'admin'

    // 2. Authorization check
    if (!isOwner && !isAgent) {
      return NextResponse.json({ error: 'You do not have permission to delete this account.' }, { status: 403 })
    }

    // 3. Prevent agents from deleting other agents/admins unless they are admin
    if (isAgent && !isOwner) {
      const { data: { user: targetUser }, error: getTargetError } = await supabaseAdmin.auth.admin.getUserById(userId)
      if (getTargetError || !targetUser) {
        return NextResponse.json({ error: 'Target user not found.' }, { status: 404 })
      }

      const targetRole = targetUser.app_metadata?.role || 'client'
      if (targetRole === 'agent' || targetRole === 'admin') {
         if (requesterRole !== 'admin') {
            return NextResponse.json({ error: 'Only administrators can delete agent/admin accounts.' }, { status: 403 })
         }
      }
    }

    // 4. Perform the deletion
    console.log(`[Delete User API] Deleting user ${userId} requested by ${requester.id} (${requesterRole})`)
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId)

    if (deleteError) {
      console.error('[Delete User API] Deletion failed:', deleteError)
      return NextResponse.json({ error: `Failed to delete account: ${deleteError.message}` }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      message: isOwner ? 'Your account has been deleted.' : 'The user account has been deleted.' 
    })

  } catch (error: any) {
    console.error('[Delete User API] Unexpected error:', error)
    return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 })
  }
}
