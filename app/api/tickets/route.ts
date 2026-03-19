import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { createClient } from '@supabase/supabase-js'
import { resend } from '@/lib/resend'

export const dynamic = 'force-dynamic'

// Helper: get authenticated user from request
async function getUser(request: NextRequest) {
  const authHeader = request.headers.get('Authorization')
  if (!authHeader) return null

  const token = authHeader.replace('Bearer ', '')
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  const { data: { user }, error } = await supabase.auth.getUser(token)
  if (error || !user) return null
  return user
}

// Helper: check if user is an agent
async function isAgent(userId: string): Promise<boolean> {
  const { data } = await supabaseAdmin
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single()

  return data?.role === 'agent' || data?.role === 'admin'
}

// SLA defaults (in hours)
const SLA_FIRST_RESPONSE_HOURS = 4
const SLA_RESOLUTION_HOURS = 24

function calculateSLADue(priority: string, type: 'first_response' | 'resolution'): string {
  const multipliers: Record<string, number> = {
    urgent: 0.25,
    high: 0.5,
    medium: 1,
    low: 2,
  }
  const baseHours = type === 'first_response' ? SLA_FIRST_RESPONSE_HOURS : SLA_RESOLUTION_HOURS
  const hours = baseHours * (multipliers[priority] || 1)
  return new Date(Date.now() + hours * 60 * 60 * 1000).toISOString()
}

// GET /api/tickets — list tickets
export async function GET(request: NextRequest) {
  const user = await getUser(request)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')
  const priority = searchParams.get('priority')
  const category = searchParams.get('category')
  const assignedTo = searchParams.get('assigned_to')
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '50')
  const offset = (page - 1) * limit

  const userIsAgent = await isAgent(user.id)

  let query = supabaseAdmin
    .from('support_tickets')
    .select('*, profiles:user_id(first_name, last_name, email), agent:assigned_agent_id(first_name, last_name, email)', { count: 'exact' })

  // Customers only see their own tickets
  if (!userIsAgent) {
    query = query.eq('user_id', user.id)
  }

  // Apply filters
  if (status) query = query.eq('status', status)
  if (priority) query = query.eq('priority', priority)
  if (category) query = query.eq('category', category)
  if (assignedTo === 'me' && userIsAgent) query = query.eq('assigned_agent_id', user.id)
  if (assignedTo === 'unassigned') query = query.is('assigned_agent_id', null)

  query = query
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  const { data, error, count } = await query

  if (error) {
    console.error('Error fetching tickets:', error)
    return NextResponse.json({ error: 'Failed to fetch tickets' }, { status: 500 })
  }

  return NextResponse.json({
    tickets: data || [],
    total: count || 0,
    page,
    limit,
  })
}

// POST /api/tickets — create a ticket
export async function POST(request: NextRequest) {
  const user = await getUser(request)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { subject, description, category, priority, device_id, source } = body

    if (!subject || !description) {
      return NextResponse.json(
        { error: 'Subject and description are required' },
        { status: 400 }
      )
    }

    const ticketPriority = priority || 'medium'
    const ticketSource = source || 'customer_portal'

    const ticketData: Record<string, any> = {
      subject,
      description,
      category: category || 'General',
      priority: ticketPriority,
      source: ticketSource,
      user_id: user.id,
      status: 'open',
      first_response_due: calculateSLADue(ticketPriority, 'first_response'),
      resolution_due: calculateSLADue(ticketPriority, 'resolution'),
    }

    if (device_id) ticketData.device_id = device_id

    const { data, error } = await supabaseAdmin
      .from('support_tickets')
      .insert(ticketData)
      .select()
      .single()

    if (error) {
      console.error('Error creating ticket:', error)
      return NextResponse.json({ error: 'Failed to create ticket' }, { status: 500 })
    }

    // 3. Send email notification to smartsasstech.com
    try {
      await resend.emails.send({
        from: 'SmartSassTech <notifications@resend.dev>',
        to: 'smartsasstech@gmail.com', // Replace with the actual address if different
        subject: `New Support Ticket: ${subject}`,
        html: `
          <h1>New Support Ticket Submitted</h1>
          <p><strong>Ticket ID:</strong> ${data?.id}</p>
          <p><strong>Customer ID:</strong> ${user.id}</p>
          <p><strong>Subject:</strong> ${subject}</p>
          <p><strong>Category:</strong> ${category || 'General'}</p>
          <p><strong>Priority:</strong> ${ticketPriority}</p>
          <p><strong>Description:</strong></p>
          <p>${description}</p>
          <hr />
          <p><a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://www.smartsasstech.com'}/admin/support/${data?.id}">View Ticket in Admin Dashboard</a></p>
        `
      })
    } catch (emailError) {
      console.error('Email error:', emailError)
    }

    // 4. Notify agents via in-app notification
    await import('@/lib/notifications').then(m => m.notifyAgents(
      'New Support Ticket',
      `A new support ticket was created: ${subject}`,
      'system',
      { ticket_id: data?.id }
    )).catch(console.error)

    return NextResponse.json({ ticket: data }, { status: 201 })
  } catch (err) {
    console.error('Error processing ticket creation:', err)
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 })
  }
}
