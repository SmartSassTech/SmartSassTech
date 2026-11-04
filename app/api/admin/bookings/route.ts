import { NextRequest, NextResponse } from 'next/server'
import { getAdminSessionFromCookies, getSupabaseAdmin } from '@/lib/admin-auth'

export async function POST(request: NextRequest) {
  try {
    const session = await getAdminSessionFromCookies()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      customer_name,
      customer_email,
      customer_phone,
      customer_address,
      location_preference = 'in-home',
      service_name,
      booking_date,
      booking_time,
      notes,
      payment_status = 'pending',
      service_status = 'scheduled',
      price
    } = body

    if (!customer_name || !customer_phone || !booking_date || !booking_time) {
      return NextResponse.json(
        { error: 'Customer name, phone, date, and time are required.' },
        { status: 400 }
      )
    }

    const calculatedPrice = price !== undefined ? Number(price) : 50
    const calculatedServiceName = service_name || (location_preference === 'in-home' ? 'In-Home Visit ($50/hr)' : 'Remote Support ($50/hr)')

    const supabase = getSupabaseAdmin()
    const { data, error } = await supabase
      .from('bookings')
      .insert([{
        customer_name,
        customer_email: customer_email || 'client@smartsasstech.com',
        customer_phone,
        customer_address: customer_address || (location_preference === 'in-home' ? 'Rochester, NY' : 'Remote'),
        location_preference,
        service_name: calculatedServiceName,
        booking_date,
        booking_time,
        duration: 60,
        price: calculatedPrice,
        actual_duration: '60',
        notes: notes || 'Booked via Admin Dashboard',
        payment_status: payment_status || 'pending',
        service_status: service_status || 'scheduled'
      }])
      .select()

    if (error) {
      console.error('Error inserting booking:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, booking: data?.[0] })
  } catch (error: any) {
    console.error('Error in POST /api/admin/bookings:', error)
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
    const { id, ids, service_status, payment_status, notes, booking_date, booking_time, price, customer_name, customer_phone, customer_email, customer_address } = body

    const supabase = getSupabaseAdmin()

    // Handle Bulk status/payment updates if array of ids provided
    if (Array.isArray(ids) && ids.length > 0) {
      const bulkPayload: Record<string, any> = { updated_at: new Date().toISOString() }
      if (service_status !== undefined) bulkPayload.service_status = service_status
      if (payment_status !== undefined) bulkPayload.payment_status = payment_status

      const { data, error } = await supabase
        .from('bookings')
        .update(bulkPayload)
        .in('id', ids)
        .select()

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
      return NextResponse.json({ success: true, updatedCount: data?.length || 0 })
    }

    if (!id) {
      return NextResponse.json({ error: 'Booking ID is required.' }, { status: 400 })
    }

    const updatePayload: Record<string, any> = {
      updated_at: new Date().toISOString()
    }

    if (service_status !== undefined) updatePayload.service_status = service_status
    if (payment_status !== undefined) updatePayload.payment_status = payment_status
    if (notes !== undefined) updatePayload.notes = notes
    if (booking_date !== undefined) updatePayload.booking_date = booking_date
    if (booking_time !== undefined) updatePayload.booking_time = booking_time
    if (price !== undefined) updatePayload.price = Number(price)
    if (customer_name !== undefined) updatePayload.customer_name = customer_name
    if (customer_phone !== undefined) updatePayload.customer_phone = customer_phone
    if (customer_email !== undefined) updatePayload.customer_email = customer_email
    if (customer_address !== undefined) updatePayload.customer_address = customer_address

    const { data, error } = await supabase
      .from('bookings')
      .update(updatePayload)
      .eq('id', id)
      .select()

    if (error) {
      console.error('Error updating booking:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, booking: data?.[0] })
  } catch (error: any) {
    console.error('Error in PATCH /api/admin/bookings:', error)
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
    const idsParam = searchParams.get('ids')

    // Also check body if request has json
    let bodyIds: string[] = []
    try {
      const body = await request.json()
      if (Array.isArray(body?.ids)) bodyIds = body.ids
    } catch (e) {}

    const targetIds = [
      ...(id ? [id] : []),
      ...(idsParam ? idsParam.split(',').filter(Boolean) : []),
      ...bodyIds
    ]

    if (targetIds.length === 0) {
      return NextResponse.json({ error: 'At least one Booking ID is required.' }, { status: 400 })
    }

    const supabase = getSupabaseAdmin()
    const { error, count } = await supabase
      .from('bookings')
      .delete({ count: 'exact' })
      .in('id', targetIds)

    if (error) {
      console.error('Error deleting bookings:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: `Successfully deleted ${targetIds.length} booking(s)`
    })
  } catch (error: any) {
    console.error('Error in DELETE /api/admin/bookings:', error)
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}
