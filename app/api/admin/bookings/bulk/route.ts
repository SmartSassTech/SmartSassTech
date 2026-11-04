import { NextRequest, NextResponse } from 'next/server'
import { getAdminSessionFromCookies, getSupabaseAdmin } from '@/lib/admin-auth'

function parseDate(dStr: string): string {
  try {
    const parts = dStr.split(/[\/\-]/).map(Number)
    if (parts.length === 3) {
      if (parts[0] > 1000) {
        // YYYY-MM-DD
        const y = parts[0]
        const m = String(parts[1]).padStart(2, '0')
        const d = String(parts[2]).padStart(2, '0')
        return `${y}-${m}-${d}`
      } else {
        // M/D/YYYY
        const m = String(parts[0]).padStart(2, '0')
        const d = String(parts[1]).padStart(2, '0')
        const y = parts[2] < 100 ? 2000 + parts[2] : parts[2]
        return `${y}-${m}-${d}`
      }
    }
  } catch (e) {}
  return new Date().toISOString().split('T')[0]
}

function parsePrice(aStr: string | number): number {
  if (typeof aStr === 'number') return aStr
  return parseFloat(String(aStr).replace(/[^0-9.]/g, '').trim()) || 30
}

export async function POST(request: NextRequest) {
  try {
    const session = await getAdminSessionFromCookies()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { csvText, jobs } = body

    let parsedJobs: any[] = []

    if (Array.isArray(jobs) && jobs.length > 0) {
      parsedJobs = jobs
    } else if (csvText && typeof csvText === 'string') {
      const lines = csvText.trim().split('\n')
      // Check if first line is header
      const startIndex = lines[0].toLowerCase().includes('client') || lines[0].toLowerCase().includes('date') ? 1 : 0

      for (let i = startIndex; i < lines.length; i++) {
        const line = lines[i].trim()
        if (!line) continue

        const parts = line.split(',').map(s => s.trim().replace(/^["']|["']$/g, ''))
        if (parts.length >= 2) {
          const clientName = parts[0]
          const dateStr = parts[1]
          const amountStr = parts[2] || '$30.00'

          parsedJobs.push({
            customer_name: clientName,
            booking_date: parseDate(dateStr),
            price: parsePrice(amountStr),
            notes: parts[3] || 'Bulk imported completed appointment',
            service_status: 'completed',
            payment_status: 'paid',
            location_preference: 'in-home',
            service_name: 'In-Home Visit'
          })
        }
      }
    }

    if (parsedJobs.length === 0) {
      return NextResponse.json({ error: 'No valid jobs found in input.' }, { status: 400 })
    }

    const supabase = getSupabaseAdmin()
    const insertPayload = parsedJobs.map(job => ({
      customer_name: job.customer_name || 'Client',
      customer_email: job.customer_email || `${(job.customer_name || 'client').toLowerCase().replace(/[^a-z0-9]/g, '')}@client.smartsasstech.com`,
      customer_phone: job.customer_phone || 'N/A',
      customer_address: job.customer_address || 'Rochester, NY',
      location_preference: job.location_preference || 'in-home',
      service_name: job.service_name || 'In-Home Visit',
      booking_date: job.booking_date || new Date().toISOString().split('T')[0],
      booking_time: job.booking_time || '10:00 AM',
      duration: 60,
      price: parsePrice(job.price || 30),
      actual_duration: '60',
      notes: job.notes || 'Bulk imported record',
      payment_status: job.payment_status || 'paid',
      service_status: job.service_status || 'completed'
    }))

    // Batch insert
    const chunkSize = 50
    let totalInserted = 0

    for (let i = 0; i < insertPayload.length; i += chunkSize) {
      const chunk = insertPayload.slice(i, i + chunkSize)
      const { data, error } = await supabase.from('bookings').insert(chunk).select()
      if (error) {
        console.error(`Bulk import chunk error:`, error)
      } else {
        totalInserted += (data ? data.length : 0)
      }
    }

    return NextResponse.json({
      success: true,
      insertedCount: totalInserted,
      message: `Successfully imported ${totalInserted} jobs.`
    })
  } catch (error: any) {
    console.error('Error in bulk import API:', error)
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}
