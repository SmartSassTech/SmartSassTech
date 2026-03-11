import { NextRequest, NextResponse } from 'next/server'
import { saveChatTranscript } from '@/lib/notion'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        const { sessionId } = body

        if (!sessionId) {
            return NextResponse.json({ error: 'Session ID is required' }, { status: 400 })
        }

        // Use the admin client (service role) to bypass RLS and read the session server-side
        const { data: session, error: fetchError } = await supabaseAdmin
            .from('chat_sessions')
            .select('*')
            .eq('id', sessionId)
            .single()

        if (fetchError || !session) {
            console.error('Error fetching session for transcript:', fetchError)
            return NextResponse.json({ error: 'Session not found' }, { status: 404 })
        }

        // Fetch messages separately from the new chat_messages table
        const { data: messages, error: messagesError } = await supabaseAdmin
            .from('chat_messages')
            .select('*')
            .eq('session_id', sessionId)
            .order('created_at', { ascending: true })

        if (messagesError) {
            console.error('Error fetching messages for transcript:', messagesError)
        }

        // Map messages to the format expected by notion.ts
        session.messages = messages?.map(m => ({
            role: m.sender_type === 'user' ? 'user' : 'assistant',
            content: m.message_content
        })) || []

        // Save to Notion
        const notionResponse = await saveChatTranscript(session)

        return NextResponse.json({
            success: true,
            notionPageId: notionResponse.id
        })

    } catch (error: any) {
        console.error('Save transcript API error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
