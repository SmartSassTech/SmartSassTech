import { NextRequest, NextResponse } from 'next/server'
import { saveChatTranscript } from '@/lib/notion'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { GoogleGenerativeAI } from '@google/generative-ai'

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

        // Fetch Agent Name
        if (session.agent_id) {
            const { data: profile } = await supabaseAdmin
                .from('profiles')
                .select('first_name, last_name')
                .eq('id', session.agent_id)
                .single()
            if (profile) {
                const fullName = [profile.first_name, profile.last_name].filter(Boolean).join(' ')
                session.agent_name = fullName || 'Agent'
            }
        }

        // Generate AI Summary
        try {
            const apiKey = process.env.GOOGLE_API_KEY
            if (apiKey && session.messages.length > 0) {
                const genAI = new GoogleGenerativeAI(apiKey)
                const model = genAI.getGenerativeModel({ model: 'gemini-flash-latest' })
                
                const transcriptText = session.messages.map((m: any) => 
                    `${m.role.toUpperCase()}: ${m.content}`
                ).join('\n')

                const prompt = `Please provide a concise, 2-3 sentence summary of the following customer support chat transcript. Focus on what the user's issue was, what troubleshooting steps were taken, and whether the issue was resolved.\n\nTranscript:\n${transcriptText}`
                
                const result = await model.generateContent(prompt)
                const summaryText = result.response.text()

                session.summary = summaryText

                // Update the chat session with the summary
                await supabaseAdmin
                    .from('chat_sessions')
                    .update({ summary: summaryText })
                    .eq('id', sessionId)
            } else {
                 session.summary = "No summary generated (API key missing or no messages)."
            }
        } catch (aiError) {
            console.error('Error generating AI transcript summary:', aiError)
            session.summary = "Failed to generate AI summary."
        }

        // Save to Notion
        const notionResponse = await saveChatTranscript(session)

        // Save notion page ID and transcript URL back to session
        const domain = process.env.NEXT_PUBLIC_APP_URL || 'https://www.smartsasstech.com'
        const transcriptUrl = `${domain}/admin/live-chat/${sessionId}?admin=true`
        
        const sessionUpdate: Record<string, any> = { transcript_url: transcriptUrl }
        if (notionResponse?.id) {
            sessionUpdate.notion_page_id = notionResponse.id
        }

        const { error: updateError } = await supabaseAdmin
            .from('chat_sessions')
            .update(sessionUpdate)
            .eq('id', sessionId)
        
        if (updateError) {
            console.error('Error updating chat_sessions with transcript URL:', updateError)
        }

        // Auto-create a support ticket from the chat session
        try {
            const ticketSubject = session.initial_issue
                ? `Chat: ${session.initial_issue.substring(0, 100)}`
                : `Chat Session: ${session.user_name || 'Visitor'}`

            await supabaseAdmin
                .from('support_tickets')
                .insert({
                    subject: ticketSubject,
                    description: session.summary || session.initial_issue || 'Chat session transcript saved.',
                    status: 'resolved',
                    priority: 'medium',
                    category: 'General',
                    source: 'chat',
                    user_id: session.user_id || null,
                    chat_session_id: sessionId,
                    assigned_agent_id: session.agent_id || null,
                    resolved_at: new Date().toISOString(),
                })
        } catch (ticketErr) {
            console.error('Error auto-creating support ticket from chat:', ticketErr)
            // Don't fail the transcript save if ticket creation fails
        }

        return NextResponse.json({
            success: true,
            notionPageId: notionResponse?.id
        })

    } catch (error: any) {
        console.error('Save transcript API error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
