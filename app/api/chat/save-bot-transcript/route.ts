import { NextRequest, NextResponse } from 'next/server'
import { saveBotChatTranscript } from '@/lib/notion'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        const { messages } = body

        if (!messages || !Array.isArray(messages) || messages.length === 0) {
            return NextResponse.json({ error: 'Messages are required' }, { status: 400 })
        }

        // Create a chat_session record in Supabase for AI bot chats
        const { data: sessionData } = await supabaseAdmin
            .from('chat_sessions')
            .insert({
                user_name: 'Anonymous (AI Chat)',
                user_email: null,
                initial_issue: messages.find((m: any) => m.role === 'user')?.content?.substring(0, 200) || 'AI Chat',
                status: 'resolved',
                chat_type: 'ai_bot'
            })
            .select('id')
            .single()

        const session: any = {
            id: sessionData?.id || 'ai-session-' + Date.now(),
            created_at: new Date().toISOString(),
            messages: messages,
            user_name: 'Anonymous (AI Chat)',
            user_email: null,
            status: 'resolved',
            agent_name: 'Tech Assistant (AI)',
            summary: ''
        }

        // Generate AI Summary
        try {
            const apiKey = process.env.GOOGLE_API_KEY
            if (apiKey && messages.length > 0) {
                const genAI = new GoogleGenerativeAI(apiKey)
                const model = genAI.getGenerativeModel({ model: 'gemini-flash-latest' })
                
                const transcriptText = messages.map((m: any) => 
                    `${m.role.toUpperCase()}: ${m.content}`
                ).join('\n')

                const prompt = `Please provide a concise, 2-3 sentence summary of the following AI support chat transcript. Focus on what the user was asking, what solutions the AI provided, and whether the issue seems resolved.\n\nTranscript:\n${transcriptText}`
                
                const result = await model.generateContent(prompt)
                session.summary = result.response.text()
            } else {
                 session.summary = "No summary generated (API key missing or no messages)."
            }
        } catch (aiError) {
            console.error('Error generating AI transcript summary:', aiError)
            session.summary = "Failed to generate AI summary."
        }

        // Save to Notion
        const notionResponse = await saveBotChatTranscript(session)

        return NextResponse.json({
            success: true,
            notionPageId: notionResponse?.id
        })

    } catch (error: any) {
        console.error('Save bot transcript API error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
