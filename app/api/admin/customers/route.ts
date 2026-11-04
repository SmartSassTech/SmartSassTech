import { NextRequest, NextResponse } from 'next/server'
import { getAdminSessionFromCookies, getSupabaseAdmin } from '@/lib/admin-auth'

export async function POST(request: NextRequest) {
  try {
    const session = await getAdminSessionFromCookies()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { first_name, last_name, phone, email, address, notes, device_profile } = body

    if (!first_name && !last_name) {
      return NextResponse.json(
        { error: 'Customer name is required.' },
        { status: 400 }
      )
    }

    const supabase = getSupabaseAdmin()
    const fullName = `${first_name || ''} ${last_name || ''}`.trim()
    const customerEmail = (email && email.trim()) || `${fullName.toLowerCase().replace(/[^a-z0-9]/g, '')}@client.smartsasstech.com`

    // Create user in Supabase Auth Admin
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: customerEmail,
      email_confirm: true,
      user_metadata: {
        first_name: first_name || fullName,
        last_name: last_name || '',
        phone: phone || '',
        address: address || '',
        device_profile: device_profile || {}
      }
    })

    if (authError && !authError.message.includes('already registered')) {
      console.error('Auth user creation error:', authError)
      return NextResponse.json({ error: authError.message }, { status: 500 })
    }

    const userId = authUser?.user?.id

    if (userId) {
      await supabase.from('profiles').upsert({
        id: userId,
        email: customerEmail,
        first_name: first_name || fullName,
        last_name: last_name || '',
        phone: phone || '',
        address: address || '',
        role: 'client',
        last_login: new Date().toISOString()
      })
    }

    // Insert record/note
    const combinedNotes = notes || (device_profile ? `Device Profile: ${JSON.stringify(device_profile)}` : 'Customer Profile Created')
    await supabase.from('bookings').insert([{
      user_id: userId || null,
      customer_name: fullName,
      customer_email: customerEmail,
      customer_phone: phone || 'N/A',
      customer_address: address || 'Rochester, NY',
      location_preference: 'in-home',
      service_name: 'Customer Profile Created',
      booking_date: new Date().toISOString().split('T')[0],
      booking_time: '10:00 AM',
      duration: 60,
      price: 0,
      actual_duration: '60',
      notes: combinedNotes,
      payment_status: 'paid',
      service_status: 'completed'
    }])

    return NextResponse.json({
      success: true,
      customer: {
        id: userId || fullName,
        name: fullName,
        email: customerEmail,
        phone: phone || '',
        address: address || '',
        device_profile: device_profile || {}
      }
    })
  } catch (error: any) {
    console.error('Error creating customer:', error)
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getAdminSessionFromCookies()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { id, name, first_name, last_name, phone, email, address, originalName, originalEmail, device_profile } = body

    if (!id && !originalName) {
      return NextResponse.json({ error: 'Customer ID or identifier is required' }, { status: 400 })
    }

    const supabase = getSupabaseAdmin()
    const fullName = (name || `${first_name || ''} ${last_name || ''}`).trim()

    // 1. If it's a UUID profile in `profiles` table
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
    if (isUuid) {
      const [fName, ...lNameParts] = fullName.split(' ')
      await supabase
        .from('profiles')
        .update({
          first_name: first_name || fName,
          last_name: last_name !== undefined ? last_name : lNameParts.join(' '),
          phone: phone || '',
          email: email || undefined,
          address: address || ''
        })
        .eq('id', id)

      if (device_profile) {
        try {
          await supabase.auth.admin.updateUserById(id, {
            user_metadata: { device_profile }
          })
        } catch (e) {}
      }
    }

    // 2. Also update all associated bookings for this customer
    const targetName = originalName || fullName
    const targetEmail = originalEmail || email

    if (targetName) {
      await supabase
        .from('bookings')
        .update({
          customer_name: fullName,
          customer_phone: phone || undefined,
          customer_email: email || undefined,
          customer_address: address || undefined
        })
        .ilike('customer_name', targetName)
    }

    if (targetEmail && targetEmail !== email) {
      await supabase
        .from('bookings')
        .update({
          customer_name: fullName,
          customer_phone: phone || undefined,
          customer_email: email,
          customer_address: address || undefined
        })
        .eq('customer_email', targetEmail)
    }

    return NextResponse.json({
      success: true,
      message: 'Customer updated successfully',
      customer: {
        id,
        name: fullName,
        phone,
        email,
        address,
        device_profile
      }
    })
  } catch (error: any) {
    console.error('Error updating customer:', error)
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getAdminSessionFromCookies()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const customerName = searchParams.get('name')
    const customerEmail = searchParams.get('email')

    if (!id && !customerName && !customerEmail) {
      return NextResponse.json({ error: 'Customer identifier is required' }, { status: 400 })
    }

    const supabase = getSupabaseAdmin()

    // 1. If UUID profile, delete profile & auth user
    const isUuid = id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
    if (isUuid) {
      await supabase.from('profiles').delete().eq('id', id)
      try {
        await supabase.auth.admin.deleteUser(id)
      } catch (e) {}
    }

    // 2. Also delete all bookings associated with this customer
    if (customerName) {
      await supabase.from('bookings').delete().ilike('customer_name', customerName)
    }
    if (customerEmail) {
      await supabase.from('bookings').delete().eq('customer_email', customerEmail)
    }

    return NextResponse.json({
      success: true,
      message: 'Customer and associated bookings removed successfully'
    })
  } catch (error: any) {
    console.error('Error deleting customer:', error)
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}
