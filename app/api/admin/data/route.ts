import { NextResponse } from 'next/server'
import { getAdminSessionFromCookies, getSupabaseAdmin } from '@/lib/admin-auth'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    // 1. Verify Admin Session
    const session = await getAdminSessionFromCookies()
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized: Admin authentication required.' },
        { status: 401 }
      )
    }

    const supabase = getSupabaseAdmin()

    // 2. Fetch all bookings
    const { data: bookingsData, error: bookingsError } = await supabase
      .from('bookings')
      .select('*')
      .order('booking_date', { ascending: false })

    if (bookingsError) {
      console.error('Error fetching bookings:', bookingsError)
    }

    const bookings = bookingsData || []

    // 3. Fetch customer profiles
    const { data: profilesData, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError)
    }

    const profiles = profilesData || []

    // 4. Fetch contact submissions / inquiries
    const { data: contactsData, error: contactsError } = await supabase
      .from('contact_submissions')
      .select('*')
      .order('created_at', { ascending: false })

    if (contactsError) {
      console.error('Error fetching contact submissions:', contactsError)
    }

    const contactSubmissions = contactsData || []

    // 5. Calculate Metrics & Aggregates
    const now = new Date()
    const todayStr = now.toISOString().split('T')[0]

    let totalRevenue = 0
    let completedJobsCount = 0
    let upcomingVisitsCount = 0
    let pendingVisitsCount = 0
    let inHomeCount = 0
    let remoteCount = 0

    bookings.forEach((b: any) => {
      const price = Number(b.price) || (b.location_preference === 'in-home' ? 50 : 40)
      
      if (b.service_status === 'completed' || b.payment_status === 'paid') {
        totalRevenue += price
        if (b.service_status === 'completed') {
          completedJobsCount++
        }
      }

      if (b.booking_date >= todayStr && b.service_status !== 'cancelled' && b.service_status !== 'completed') {
        upcomingVisitsCount++
      }

      if (b.service_status === 'scheduled' || b.service_status === 'pending') {
        pendingVisitsCount++
      }

      if (b.location_preference === 'in-home' || (b.service_name && b.service_name.toLowerCase().includes('in-home'))) {
        inHomeCount++
      } else {
        remoteCount++
      }
    })

    // 6. Build unified Customer Directory
    const customerMap = new Map<string, any>()

    // Add registered profiles
    profiles.forEach((p: any) => {
      const key = (p.email || p.phone || p.id).toLowerCase().trim()
      customerMap.set(key, {
        id: p.id,
        name: `${p.first_name || ''} ${p.last_name || ''}`.trim() || 'Client',
        email: p.email || '',
        phone: p.phone || '',
        address: p.address || '',
        role: p.role || 'client',
        registeredAt: p.created_at,
        device_profile: p.device_profile || {
          devices: '',
          printer: '',
          wifi_info: '',
          tech_notes: ''
        },
        totalBookings: 0,
        completedBookings: 0,
        totalSpent: 0,
        lastBookingDate: null,
        history: []
      })
    })

    // Integrate booking history into customer directory
    bookings.forEach((b: any) => {
      const clientEmail = (b.customer_email || '').toLowerCase().trim()
      const clientPhone = (b.customer_phone || '').trim()
      const clientName = (b.customer_name || '').trim()
      const key = clientEmail || clientPhone || clientName.toLowerCase() || b.id

      let customer = customerMap.get(key)
      if (!customer && clientEmail) {
        customer = customerMap.get(clientEmail)
      }

      if (!customer) {
        customer = {
          id: b.user_id || b.id,
          name: clientName || 'Guest Client',
          email: clientEmail,
          phone: clientPhone,
          address: b.customer_address || '',
          role: 'client',
          registeredAt: b.created_at,
          device_profile: {
            devices: '',
            printer: '',
            wifi_info: '',
            tech_notes: ''
          },
          totalBookings: 0,
          completedBookings: 0,
          totalSpent: 0,
          lastBookingDate: null,
          history: []
        }
        customerMap.set(key, customer)
      }

      customer.totalBookings++
      const price = Number(b.price) || (b.location_preference === 'in-home' ? 50 : 40)
      if (b.service_status === 'completed' || b.payment_status === 'paid') {
        customer.completedBookings++
        customer.totalSpent += price
      }

      if (!customer.lastBookingDate || b.booking_date > customer.lastBookingDate) {
        customer.lastBookingDate = b.booking_date
      }

      const cleanServiceName = (b.service_name === 'Historical completed appointment' || b.service_name?.toLowerCase().includes('historical') || b.service_name === 'Customer Profile Created')
        ? (b.location_preference === 'in-home' ? 'In-Home Tech Session' : 'Tech Support Session')
        : (b.service_name || 'Tech Support Session')

      const cleanNotes = (b.notes === 'Historical completed appointment' || b.notes === 'Bulk imported record' || b.notes === 'Bulk imported completed appointment' || b.notes === 'Customer Profile Created')
        ? ''
        : (b.notes || '')

      customer.history.push({
        id: b.id,
        serviceName: cleanServiceName,
        date: b.booking_date,
        time: b.booking_time,
        status: b.service_status,
        paymentStatus: b.payment_status,
        price: price,
        notes: cleanNotes,
        location: b.location_preference
      })
    })

    const customers = Array.from(customerMap.values()).sort((a, b) => {
      return (b.totalBookings - a.totalBookings) || (new Date(b.registeredAt || 0).getTime() - new Date(a.registeredAt || 0).getTime())
    })

    return NextResponse.json({
      success: true,
      stats: {
        totalBookings: bookings.length,
        upcomingVisits: upcomingVisitsCount,
        completedJobs: completedJobsCount,
        pendingVisits: pendingVisitsCount,
        totalRevenue: totalRevenue,
        inHomeCount,
        remoteCount,
        totalCustomers: customers.length
      },
      bookings,
      customers,
      contactSubmissions,
      admin: session
    })
  } catch (error: any) {
    console.error('Error in Admin Data API:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to retrieve admin data' },
      { status: 500 }
    )
  }
}
