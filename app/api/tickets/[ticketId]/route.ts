import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { createClient } from '@supabase/supabase-js'

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

async function isAgent(userId: string): Promise<boolean> {
  const { data } = await supabaseAdmin
    .from('profiles')
    .select('role, profile_type')
    .eq('id', userId)
    .single()

  return data?.role === 'agent' || data?.role === 'admin' || data?.profile_type === 'Agent'
}

// GET /api/tickets/[ticketId] — get ticket detail
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ ticketId: string }> }
) {
  const user = await getUser(request)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { ticketId } = await params
  const userIsAgent = await isAgent(user.id)

  const { data, error } = await supabaseAdmin
    .from('support_tickets')
    .select('*, profiles:user_id(first_name, last_name, email, phone), agent:assigned_agent_id(first_name, last_name, email)')
    .eq('id', ticketId)
    .single()

  if (error || !data) {
    return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
  }

  // Customers can only view their own tickets
  if (!userIsAgent && data.user_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  return NextResponse.json({ ticket: data })
}

// PATCH /api/tickets/[ticketId] — update ticket
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ ticketId: string }> }
) {
  const user = await getUser(request)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { ticketId } = await params
  const userIsAgent = await isAgent(user.id)

  // First, fetch the ticket to check ownership
  const { data: existingTicket } = await supabaseAdmin
    .from('support_tickets')
    .select('user_id, status, first_responded_at')
    .eq('id', ticketId)
    .single()

  if (!existingTicket) {
    return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
  }

  // Customers can only close their own tickets
  if (!userIsAgent && existingTicket.user_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json()
  const updateData: Record<string, any> = {}

  // Fields agents can update
  if (userIsAgent) {
    if (body.status) {
      updateData.status = body.status
      // Track resolution timestamp
      if (body.status === 'resolved' && existingTicket.status !== 'resolved') {
        updateData.resolved_at = new Date().toISOString()
      }
      // Track first response
      if (body.status === 'replied' && !existingTicket.first_responded_at) {
        updateData.first_responded_at = new Date().toISOString()
      }
    }
    if (body.priority) updateData.priority = body.priority
    if (body.category) updateData.category = body.category
    if (body.assigned_agent_id !== undefined) updateData.assigned_agent_id = body.assigned_agent_id
  } else {
    // Customers can only close their tickets
    if (body.status === 'closed') {
      updateData.status = 'closed'
    }
  }

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json({ error: 'No valid update fields provided' }, { status: 400 })
  }

  const { data, error } = await supabaseAdmin
    .from('support_tickets')
    .update(updateData)
    .eq('id', ticketId)
    .select('*, profiles:user_id(first_name, last_name, email), agent:assigned_agent_id(first_name, last_name, email)')
    .single()

  if (error) {
    console.error('Error updating ticket:', error)
    return NextResponse.json({ error: 'Failed to update ticket' }, { status: 500 })
  }

  return NextResponse.json({ ticket: data })
}
