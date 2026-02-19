'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import ChatInterface, { Message } from '@/components/ChatInterface'
import { supabase } from '@/lib/supabase'
import { AlertCircle, Clock, ShieldCheck, User, Laptop, MessageCircle } from 'lucide-react'

export default function SessionPage() {
    const params = useParams()
    const searchParams = useSearchParams()
    const sessionId = params.sessionId as string
    const isAdmin = searchParams.get('admin') === 'true'

    const [messages, setMessages] = useState<Message[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [sessionInfo, setSessionInfo] = useState<any>(null)
    const [isClosing, setIsClosing] = useState(false)

    useEffect(() => {
        if (!sessionId) return

        // Ensure user is signed in for RLS
        const ensureAuth = async () => {
            const { data } = await supabase.auth.getSession()
            if (!data.session) {
                await supabase.auth.signInAnonymously()
            }
        }

        // Fetch session info
        const fetchSession = async () => {
            const { data, error } = await supabase
                .from('chat_sessions')
                .select('*')
                .eq('id', sessionId)
                .single()

            if (data) {
                setSessionInfo(data)
                // Add initial connection message once we have session info
                if (messages.length === 0) {
                    setMessages([{
                        role: 'system',
                        content: isAdmin ? 'Secure connection established. You are now speaking as a support representative.' : 'Connected to support. A technical expert will be with you shortly.'
                    }])
                }
            }
        }

        // Fetch existing messages
        const fetchMessages = async () => {
            const { data, error } = await supabase
                .from('chat_messages')
                .select('*')
                .eq('session_id', sessionId)
                .order('created_at', { ascending: true })

            if (data && data.length > 0) {
                const formattedMessages: Message[] = data.map((m: any) => ({
                    role: m.sender_role === 'agent' ? 'assistant' : 'user',
                    content: m.content
                }))
                setMessages(prev => [...prev.filter(m => m.role !== 'system'), ...formattedMessages])
            }
        }

        ensureAuth().then(() => {
            fetchSession()
            fetchMessages()
        })

        // Subscribe to new messages
        const channel = supabase
            .channel(`session-${sessionId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'chat_messages',
                    filter: `session_id=eq.${sessionId}`,
                },
                (payload) => {
                    const newMessage = payload.new as any
                    // Prevent duplicate messages if already optimistically added
                    setMessages(prev => {
                        const exists = prev.some(m => m.content === newMessage.content && (
                            (newMessage.sender_role === 'user' && m.role === 'user') ||
                            (newMessage.sender_role === 'agent' && m.role === 'assistant')
                        ))
                        if (exists) return prev
                        return [...prev, {
                            role: newMessage.sender_role === 'user' ? 'user' : 'assistant',
                            content: newMessage.content
                        }]
                    })
                }
            )
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'chat_sessions',
                    filter: `id=eq.${sessionId}`,
                },
                (payload) => {
                    setSessionInfo(payload.new)
                    if (payload.new.status === 'resolved' || payload.new.status === 'closed') {
                        setMessages(prev => [...prev, { role: 'system', content: 'This chat session has been closed. Thank you for using our support!' }])
                    }
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [sessionId, isAdmin])

    const handleSendMessage = async (content: string) => {
        if (sessionInfo?.status === 'resolved' || sessionInfo?.status === 'closed') return;
        setIsLoading(true)

        // Optimistic update
        const newMsg: Message = {
            role: isAdmin ? 'assistant' : 'user',
            content
        }
        setMessages(prev => [...prev, newMsg])

        try {
            const { data: { user } } = await supabase.auth.getUser()

            const { error } = await supabase
                .from('chat_messages')
                .insert([
                    {
                        session_id: sessionId,
                        content,
                        sender_role: isAdmin ? 'agent' : 'user',
                        sender_id: user?.id
                    }
                ])

            if (error) {
                console.error('Failed to send message:', error)
            }
        } catch (err) {
            console.error('Error sending message:', err)
        } finally {
            setIsLoading(false)
        }
    }

    const handleCloseTicket = async () => {
        if (!confirm('Are you sure you want to resolve this ticket and save the transcript?')) return
        setIsClosing(true)

        try {
            // 1. Generate Transcript
            const transcript = messages
                .filter(m => m.role !== 'system')
                .map(m => `[${m.role === 'assistant' ? 'AGENT' : 'CLIENT'}]: ${m.content}`)
                .join('\n')

            const { data: { user } } = await supabase.auth.getUser()

            // 2. Update status and save transcript
            const { error } = await supabase
                .from('chat_sessions')
                .update({
                    status: 'resolved',
                    transcript: transcript,
                    agent_id: sessionInfo?.agent_id || user?.id,
                    updated_at: new Date().toISOString()
                })
                .eq('id', sessionId)

            if (error) throw error
            alert('Ticket has been resolved and transcript saved.')
        } catch (error: any) {
            console.error('Error closing ticket:', error)
            alert('Failed to close ticket: ' + error.message)
        } finally {
            setIsClosing(false)
        }
    }

    return (
        <div className="flex-1 bg-gray-50 flex flex-col">

            <main className="flex-1 container mx-auto px-4 py-8 max-w-6xl">
                {isAdmin && (
                    <div className="mb-6 bg-amber-50 border border-amber-200 p-4 rounded-2xl flex items-center justify-between shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="bg-amber-100 p-2 rounded-xl">
                                <ShieldCheck className="text-amber-700" size={24} />
                            </div>
                            <div>
                                <h2 className="font-bold text-amber-900">Agent View Active</h2>
                                <p className="text-sm text-amber-800/80">You are replying as a technical expert.</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <button
                                onClick={handleCloseTicket}
                                disabled={isClosing || sessionInfo?.status === 'resolved'}
                                className="bg-red-600 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md hover:bg-red-700 transition-all disabled:opacity-50"
                            >
                                {isClosing ? 'Closing...' : sessionInfo?.status === 'resolved' ? 'Ticket Resolved' : 'Resolve Ticket'}
                            </button>
                            <div className="text-xs text-amber-900 font-mono bg-white/50 px-3 py-1 rounded-lg border border-amber-200">
                                Session: {sessionId.substring(0, 8)}
                            </div>
                        </div>
                    </div>
                )}

                <div className="flex flex-col lg:flex-row gap-8 h-[700px]">
                    {/* Sidebar - Only visible for Agent */}
                    {isAdmin && (
                        <div className="w-full lg:w-80 space-y-6">
                            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                                <h2 className="text-xl font-bold text-kb-navy mb-4 flex items-center gap-2">
                                    <Clock size={20} className="text-kb-navy/40" />
                                    Client Info
                                </h2>
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-2xl border border-gray-100">
                                        <div className="w-10 h-10 bg-kb-navy/10 rounded-full flex items-center justify-center">
                                            <User className="text-kb-navy" size={20} />
                                        </div>
                                        <div>
                                            <p className="text-[10px] uppercase font-bold text-gray-400">User</p>
                                            <p className="font-semibold text-gray-800">{sessionInfo?.user_name || 'Loading...'}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-2xl border border-gray-100">
                                        <div className="w-10 h-10 bg-kb-navy/10 rounded-full flex items-center justify-center">
                                            <Laptop className="text-kb-navy" size={20} />
                                        </div>
                                        <div>
                                            <p className="text-[10px] uppercase font-bold text-gray-400">Device</p>
                                            <p className="font-semibold text-gray-800">{sessionInfo?.user_email || 'Not specified'}</p>
                                        </div>
                                    </div>
                                    <div className="p-4 bg-gray-50/50 rounded-2xl border border-gray-100">
                                        <p className="text-[10px] uppercase font-bold text-gray-400 mb-1">Status</p>
                                        <div className="flex items-center gap-2">
                                            <div className={`w-2 h-2 rounded-full ${sessionInfo?.status === 'open' ? 'bg-red-500 animate-pulse' : sessionInfo?.status === 'in_progress' ? 'bg-amber-500 animate-pulse' : 'bg-green-500'}`} />
                                            <p className="text-sm font-semibold capitalize text-kb-navy">
                                                {sessionInfo?.status?.replace('_', ' ') || 'Searching...'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="p-4 bg-gray-50/50 rounded-2xl border border-gray-100">
                                        <p className="text-[10px] uppercase font-bold text-gray-400 mb-1">Issue Description</p>
                                        <p className="text-sm text-gray-600 italic leading-relaxed">"{sessionInfo?.initial_issue || '...'}"</p>
                                    </div>
                                </div>
                            </div>

                        </div>
                    )}

                    {/* Chat */}
                    <div className="flex-1 min-h-0">
                        <ChatInterface
                            initialMessages={messages}
                            onSendMessage={handleSendMessage}
                            isLoading={isLoading || sessionInfo?.status === 'resolved'}
                            title={isAdmin ? `Helping ${sessionInfo?.user_name || 'User'}` : "Live Expert Support"}
                            status={isAdmin ? (sessionInfo?.status === 'resolved' ? "Chat Closed" : "Speaking as Agent") : (sessionInfo?.status === 'resolved' ? "Conversation Ended" : "Connected to Support")}
                            placeholder={sessionInfo?.status === 'resolved' ? "This chat has been closed." : (isAdmin ? "Reply to the client..." : "Type your message...")}
                            isAdminView={isAdmin}
                        />
                    </div>
                </div>
            </main>

        </div>
    )
}
