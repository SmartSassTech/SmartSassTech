import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { updateChatSatisfaction } from '@/lib/notion'

export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        const { sessionId, score } = body

        if (!sessionId || !score || typeof score !== 'number' || score < 1 || score > 5) {
            return NextResponse.json({ error: 'Valid Session ID and a score between 1-5 are required' }, { status: 400 })
        }

        // 1. Fetch Session to get the notion_page_id
        const { data: session, error: fetchError } = await supabaseAdmin
            .from('chat_sessions')
            .select('notion_page_id')
            .eq('id', sessionId)
            .single()

        if (fetchError || !session) {
            return NextResponse.json({ error: 'Session not found' }, { status: 404 })
        }

        // 2. Update Supabase with the score
        const { error: updateError } = await supabaseAdmin
            .from('chat_sessions')
            .update({ satisfaction_score: score })
            .eq('id', sessionId)

        if (updateError) {
            console.error('Failed to update satisfaction score in Supabase:', updateError)
        }

        // 3. Update Notion if a page exists
        if (session.notion_page_id) {
            try {
                await updateChatSatisfaction(session.notion_page_id, score)
            } catch (notionError) {
                console.error('Failed to sync satisfaction score to Notion:', notionError)
                // We don't fail the whole request if Notion sync fails, the DB has it at least.
            }
        }

        return NextResponse.json({ success: true })

    } catch (error: any) {
        console.error('Rate chat API error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
