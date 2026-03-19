import { NextRequest, NextResponse } from 'next/server'
import { notifyAgents } from '@/lib/notifications'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: NextRequest) {
    try {
        // Authenticate the user
        const authHeader = req.headers.get('Authorization')
        let userAuth = null
        if (authHeader) {
            const token = authHeader.replace('Bearer ', '')
            const supabase = createClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
            )
            const { data } = await supabase.auth.getUser(token)
            userAuth = data?.user
        }

        const { sessionId, action } = await req.json()

        if (!sessionId || !action) {
            return NextResponse.json({ error: 'Missing sessionId or action' }, { status: 400 })
        }

        // Fetch session to ensure it exists
        const { data: session, error } = await supabaseAdmin
            .from('chat_sessions')
            .select('*')
            .eq('id', sessionId)
            .single()

        if (error || !session) {
            return NextResponse.json({ error: 'Session not found' }, { status: 404 })
        }

        if (action === 'user_message') {
            await notifyAgents('New Message in Chat', `Client ${session.user_name} sent a new message.`, 'system', { session_id: sessionId })
        } else if (action === 'chat_ended') {
            await notifyAgents('Chat Ended', `Client ${session.user_name} has ended the chat.`, 'system', { session_id: sessionId })
        }

        return NextResponse.json({ success: true })
    } catch (error: any) {
        console.error('Notify agent error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
