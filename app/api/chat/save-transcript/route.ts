import { NextRequest, NextResponse } from 'next/server'
import { saveChatTranscript } from '@/lib/notion'
import { supabase } from '@/lib/supabase'

export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        const { sessionId } = body

        if (!sessionId) {
            return NextResponse.json({ error: 'Session ID is required' }, { status: 400 })
        }

        // 1. Fetch the full session data from Supabase
        const { data: session, error: fetchError } = await supabase
            .from('chat_sessions')
            .select('*')
            .eq('id', sessionId)
            .single()

        if (fetchError || !session) {
            console.error('Error fetching session for transcript:', fetchError)
            return NextResponse.json({ error: 'Session not found' }, { status: 404 })
        }

        // 2. Save to Notion
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
