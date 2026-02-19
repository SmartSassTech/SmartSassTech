import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { resend } from '@/lib/resend'

export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        const { name, device, issue, user_id } = body

        if (!name || !device || !issue) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

        // 1. Create a session in Supabase using the secure RPC function
        // This bypasses RLS for the creation step to allow the API (anon) to get the ID back.
        const { data: sessionId, error: supabaseError } = await supabase
            .rpc('create_chat_session', {
                p_user_name: name,
                p_user_email: device,
                p_initial_issue: issue,
                p_user_id: user_id
            })

        if (supabaseError || !sessionId) {
            console.error('Supabase error:', supabaseError)
            return NextResponse.json({
                error: `Database Error: ${supabaseError?.message || 'Failed to create session'}`,
                details: supabaseError?.hint || 'Ensure the Postgres function exists and permissions are granted.'
            }, { status: 500 })
        }

        const chatLink = `${req.nextUrl.origin}/chat/${sessionId}?admin=true`

        // 2. Send email via Resend
        try {
            await resend.emails.send({
                from: 'Support <onboarding@resend.dev>',
                to: 'smartsasstech@gmail.com',
                subject: 'URGENT: New Human Chat Request',
                html: `
                    <h2>New Chat Request</h2>
                    <p><strong>User:</strong> ${name}</p>
                    <p><strong>Device:</strong> ${device}</p>
                    <p><strong>Issue:</strong> ${issue}</p>
                    <p><a href="${chatLink}" style="padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px;">Join Chat Session</a></p>
                `
            })
        } catch (emailError) {
            console.error('Resend email error:', emailError)
            // Don't fail the whole request if email fails, but log it
        }

        return NextResponse.json({ success: true, sessionId, chatLink })
    } catch (error: any) {
        console.error('Live chat API error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
