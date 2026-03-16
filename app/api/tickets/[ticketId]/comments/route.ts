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

// GET /api/tickets/[ticketId]/comments — list comments
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

  // Verify ticket access
  const { data: ticket } = await supabaseAdmin
    .from('support_tickets')
    .select('user_id')
    .eq('id', ticketId)
    .single()

  if (!ticket) {
    return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
  }

  if (!userIsAgent && ticket.user_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  let query = supabaseAdmin
    .from('ticket_comments')
    .select('*, author:author_id(first_name, last_name, email, profile_type)')
    .eq('ticket_id', ticketId)
    .order('created_at', { ascending: true })

  // Customers can't see internal notes
  if (!userIsAgent) {
    query = query.eq('is_internal', false)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching comments:', error)
    return NextResponse.json({ error: 'Failed to fetch comments' }, { status: 500 })
  }

  return NextResponse.json({ comments: data || [] })
}

// POST /api/tickets/[ticketId]/comments — add a comment
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ ticketId: string }> }
) {
  const user = await getUser(request)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { ticketId } = await params
  const userIsAgent = await isAgent(user.id)
  const body = await request.json()
  const { content, is_internal } = body

  if (!content || !content.trim()) {
    return NextResponse.json({ error: 'Content is required' }, { status: 400 })
  }

  // Verify ticket access
  const { data: ticket } = await supabaseAdmin
    .from('support_tickets')
    .select('user_id, status, first_responded_at')
    .eq('id', ticketId)
    .single()

  if (!ticket) {
    return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
  }

  if (!userIsAgent && ticket.user_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Only agents can post internal notes
  const isInternalNote = userIsAgent && is_internal === true

  // Customers can't comment on closed tickets
  if (!userIsAgent && ticket.status === 'closed') {
    return NextResponse.json({ error: 'Cannot comment on closed tickets' }, { status: 400 })
  }

  // Insert the comment
  const { data: comment, error } = await supabaseAdmin
    .from('ticket_comments')
    .insert({
      ticket_id: ticketId,
      author_id: user.id,
      content: content.trim(),
      is_internal: isInternalNote,
    })
    .select('*, author:author_id(first_name, last_name, email, profile_type)')
    .single()

  if (error) {
    console.error('Error creating comment:', error)
    return NextResponse.json({ error: 'Failed to create comment' }, { status: 500 })
  }

  // Auto-update ticket status based on who commented
  const statusUpdate: Record<string, any> = {}

  if (userIsAgent && !isInternalNote) {
    // Agent public reply → set status to 'replied'
    if (ticket.status === 'open') {
      statusUpdate.status = 'replied'
    }
    // Track first response
    if (!ticket.first_responded_at) {
      statusUpdate.first_responded_at = new Date().toISOString()
    }
  } else if (!userIsAgent) {
    // Customer reply → reopen ticket if it was resolved/replied
    if (ticket.status === 'replied' || ticket.status === 'resolved') {
      statusUpdate.status = 'open'
    }
  }

  if (Object.keys(statusUpdate).length > 0) {
    await supabaseAdmin
      .from('support_tickets')
      .update(statusUpdate)
      .eq('id', ticketId)
  }

  return NextResponse.json({ comment }, { status: 201 })
}
