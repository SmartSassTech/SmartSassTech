import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function POST(request: Request) {
  try {
    const { userId, email, firstName, lastName, phone, role } = await request.json()
    const authHeader = request.headers.get('Authorization')

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing or invalid authorization header' }, { status: 401 })
    }

    const token = authHeader.split(' ')[1]

    // 1. Verify the requester's identity and get their role
    const { data: { user: requester }, error: authError } = await supabaseAdmin.auth.getUser(token)

    if (authError || !requester) {
      console.error('[Update User API] Requester verification failed:', authError)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const requesterRole = requester.app_metadata?.role || 'client'
    const isAgent = requesterRole === 'agent' || requesterRole === 'admin'

    // 2. Authorization check
    if (!isAgent) {
      return NextResponse.json({ error: 'You do not have permission to update accounts.' }, { status: 403 })
    }

    // 3. Fetch target user to check permissions
    const { data: { user: targetUser }, error: getTargetError } = await supabaseAdmin.auth.admin.getUserById(userId)
    if (getTargetError || !targetUser) {
      return NextResponse.json({ error: 'Target user not found.' }, { status: 404 })
    }

    // NEW: Fetch current profile to see if the requester actually intended to change the email
    const { data: currentProfile, error: profileFetchError } = await supabaseAdmin
      .from('profiles')
      .select('email')
      .eq('id', userId)
      .single()

    if (profileFetchError) {
      console.error('[Update User API] Profile fetch failed:', profileFetchError)
      return NextResponse.json({ error: 'User profile not found.' }, { status: 404 })
    }

    const targetRole = targetUser.app_metadata?.role || 'client'
    
    // Authorization logic:
    // 1. Agents can only modify 'client' accounts.
    // 2. Admins can modify 'client' and 'agent'.
    // 3. No one can modify an 'admin' except themselves or another 'admin'.
    if (requesterRole === 'agent') {
      if (targetRole === 'agent' || targetRole === 'admin') {
         return NextResponse.json({ error: 'Agents cannot modify other agent or administrator accounts.' }, { status: 403 })
      }
    }
    
    // Cannot change a user to admin if requester is not admin
    if (requesterRole !== 'admin' && role === 'admin') {
      return NextResponse.json({ error: 'Only administrators can assign the administrator role.' }, { status: 403 })
    }

    // 4. Update data object for Auth
    const currentMetadata = targetUser.user_metadata || {}
    const authUpdateData: any = {
      user_metadata: {
        ...currentMetadata,
        first_name: firstName?.trim() || currentMetadata.first_name,
        last_name: lastName?.trim() || currentMetadata.last_name,
        phone: phone?.trim() || currentMetadata.phone
      }
    }

    // Only update email in Auth if:
    // 1. It's provided.
    // 2. It's different from what's currently in Auth.
    // 3. It's different from what's currently in the Profiles table.
    // This last check is crucial for avoiding duplicate email errors on anonymous users 
    // where the profile email is the same as another real account.
    const normalizedNewEmail = email?.trim().toLowerCase()
    const normalizedOldAuthEmail = targetUser.email?.toLowerCase()
    const normalizedOldProfileEmail = currentProfile.email?.toLowerCase()

    if (normalizedNewEmail && 
        normalizedNewEmail !== normalizedOldAuthEmail && 
        normalizedNewEmail !== normalizedOldProfileEmail) {
      authUpdateData.email = normalizedNewEmail
      authUpdateData.email_confirm = true 
    }

    if (role) {
      const currentAppMetadata = targetUser.app_metadata || {}
      authUpdateData.app_metadata = {
        ...currentAppMetadata,
        role: role
      }
    }

    // 5. Update Auth
    console.log('[Update User API] Updating user:', userId, JSON.stringify(authUpdateData, null, 2))
    const { error: authUpdateError } = await supabaseAdmin.auth.admin.updateUserById(userId, authUpdateData)

    if (authUpdateError) {
      console.error('[Update User API] Auth update failed:', authUpdateError)
      return NextResponse.json({ 
        error: `Failed to update auth metadata: ${authUpdateError.message}`,
        details: authUpdateError,
        payloadSent: authUpdateData,
        targetUserId: userId
      }, { status: 500 })
    }

    // 6. Update Public Profile
    const profileUpdateData: any = {}
    if (firstName) profileUpdateData.first_name = firstName.trim()
    if (lastName) profileUpdateData.last_name = lastName.trim()
    if (email) profileUpdateData.email = email.trim()
    if (phone) profileUpdateData.phone = phone.trim()
    if (role) profileUpdateData.role = role

    if (Object.keys(profileUpdateData).length > 0) {
      const { error: profileUpdateError } = await supabaseAdmin
        .from('profiles')
        .update(profileUpdateData)
        .eq('id', userId)

      if (profileUpdateError) {
        console.error('[Update User API] Profile update failed:', profileUpdateError)
        // Partial success is possible if Auth was updated but Profile wasn't.
        return NextResponse.json({ error: `Updated auth but failed to update profile: ${profileUpdateError.message}` }, { status: 500 })
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: 'User account has been updated successfully.' 
    })

  } catch (error: any) {
    console.error('[Update User API] Unexpected error:', error)
    return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 })
  }
}
