'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useParams } from 'next/navigation'
import ChatInterface, { Message } from '@/components/ChatInterface'
import { supabase } from '@/lib/supabase'
import withAuth from '@/components/withAuth'
import { AlertCircle, Clock, ShieldCheck, User, Laptop, MessageCircle, Loader2, Monitor, Maximize2, Minimize2, X, Send } from 'lucide-react'

function SessionPage() {
    const params = useParams()
    const sessionId = params.sessionId as string

    const [isAdmin, setIsAdmin] = useState(false)
    const [isCheckingAuth, setIsCheckingAuth] = useState(true)
    const [messages, setMessages] = useState<Message[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [sessionInfo, setSessionInfo] = useState<any>(null)
    const [isClosing, setIsClosing] = useState(false)
    const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null)
    const [isViewerFullscreen, setIsViewerFullscreen] = useState(false)
    const [miniChatInput, setMiniChatInput] = useState('')
    const [isMiniChatOpen, setIsMiniChatOpen] = useState(true)
    const videoRef = useRef<HTMLVideoElement>(null)
    const miniChatEndRef = useRef<HTMLDivElement>(null)

    const handleScreenShareStatusChange = (active: boolean) => {
        const msg = active ? '🖥️ Customer started sharing their screen' : '🖥️ Customer stopped sharing their screen'
        setMessages(prev => [...prev, { role: 'system', content: msg }])
    }

    const handleMiniChatSend = async () => {
        if (!miniChatInput.trim()) return
        const content = miniChatInput.trim()
        setMiniChatInput('')
        await handleSendMessage(content)
    }

    // Attach remote stream to video element when it arrives
    useEffect(() => {
        if (videoRef.current && remoteStream) {
            videoRef.current.srcObject = remoteStream
        }
    }, [remoteStream])

    useEffect(() => {
        if (!sessionId) return

        // Ensure user is signed in as an agent for RLS
        const ensureAuth = async () => {
            const { data: { session } } = await supabase.auth.getSession()
            
            // If no session, or if the user is anonymous, they need to log in properly
            if (!session || session.user.is_anonymous) {
                if (session?.user.is_anonymous) {
                    await supabase.auth.signOut()
                }
                window.location.href = `/login?redirect=/admin/live-chat/${sessionId}`
                return false
            }

            // Check if user is an agent in profiles table
            const { data: profile, error } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', session.user.id)
                .single()

            if (error || (profile?.role !== 'agent' && profile?.role !== 'admin')) {
                alert('Unauthorized Access: You are not registered as an agent.')
                window.location.href = '/'
                return false
            }

            setIsAdmin(true)
            setIsCheckingAuth(false)
            return true
        }

        // Fetch session info including messages
        const fetchSession = async () => {
            const { data, error } = await supabase
                .from('chat_sessions')
                .select('*')
                .eq('id', sessionId)
                .single()

            if (data) {
                setSessionInfo(data)

                // Fetch relational messages
                const { data: msgs } = await supabase
                    .from('chat_messages')
                    .select('*')
                    .eq('session_id', sessionId)
                    .order('created_at', { ascending: true })

                if (msgs && msgs.length > 0) {
                    const formattedMsgs = msgs.map((m: any) => ({
                        role: m.sender_type === 'agent' || m.sender_type === 'ai' ? 'assistant' : m.sender_type,
                        content: m.message_content
                    }))
                    setMessages(formattedMsgs)
                } else {
                    // Fallback initial connection message if none in DB
                    setMessages([{
                        role: 'system',
                        content: 'Secure connection established. You are now speaking as a support representative.'
                    }])
                }
            }
        }

        ensureAuth().then((isAuthorized) => {
            if (isAuthorized) {
                fetchSession()
            }
        })

        // Subscribe to session updates (for status changes)
        const sessionChannel = supabase
            .channel(`session-${sessionId}`)
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'chat_sessions',
                    filter: `id=eq.${sessionId}`,
                },
                (payload) => {
                    const updatedSession = payload.new as any
                    setSessionInfo(updatedSession)

                    if (updatedSession.status === 'resolved' || updatedSession.status === 'closed') {
                        setSessionInfo(updatedSession)
                    }
                }
            )
            .subscribe()

        // Subscribe to new messages
        const messageChannel = supabase
            .channel(`messages-${sessionId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'chat_messages',
                    filter: `session_id=eq.${sessionId}`,
                },
                (payload) => {
                    const newMsg = payload.new as any
                    
                    // We optimistically add messages when sending, so we only want to append
                    // messages if they come from the *other* party to avoid duplicates
                    const senderRole = newMsg.sender_type === 'agent' || newMsg.sender_type === 'ai' ? 'assistant' : newMsg.sender_type
                    
                    // On admin page, we are 'agent' and the other party is 'user'
                    const isFromMe = (senderRole === 'assistant')
                    
                    if (!isFromMe || senderRole === 'system') {
                        setMessages(prev => [...prev, { role: senderRole, content: newMsg.message_content }])
                    }
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(sessionChannel)
            supabase.removeChannel(messageChannel)
        }
    }, [sessionId, isAdmin])

    const handleSendMessage = async (content: string) => {
        if (sessionInfo?.status === 'resolved' || sessionInfo?.status === 'closed') return;
        setIsLoading(true)

        // Optimistic update
        const newMsg: Message = {
            role: 'assistant',
            content
        }

        const updatedMessages = [...messages, newMsg]
        setMessages(updatedMessages)

        try {
            const { data: { user } } = await supabase.auth.getUser()

            // Insert into the new chat_messages table
            const { error } = await supabase
                .from('chat_messages')
                .insert({
                    session_id: sessionId,
                    sender_type: 'agent',
                    message_content: content
                })

            // Also update the session updated_at timestamp
            await supabase
                .from('chat_sessions')
                .update({ updated_at: new Date().toISOString() })
                .eq('id', sessionId)

            if (error) {
                console.error('Failed to send message:', error.message, error.details, error.hint)
                alert(`Support connection error: ${error.message}. Please try again shortly.`)
            }
        } catch (err: any) {
            console.error('Error sending message:', err)
            alert(`Network error: ${err.message || 'Unknown error'}`)
        } finally {
            setIsLoading(false)
        }
    }

    const handleCloseTicket = async () => {
        if (!confirm('Are you sure you want to resolve this ticket and save the transcript to Notion?')) return
        setIsClosing(true)

        try {
            const { data: { user } } = await supabase.auth.getUser()

            // 1. Update status in Supabase
            const { error: updateError } = await supabase
                .from('chat_sessions')
                .update({
                    status: 'resolved',
                    agent_id: sessionInfo?.agent_id || user?.id,
                    updated_at: new Date().toISOString()
                })
                .eq('id', sessionId)

            if (updateError) throw updateError

            // 1.b. Insert a system message into the database
            await supabase.from('chat_messages').insert({
                session_id: sessionId,
                sender_type: 'system',
                message_content: 'The agent has resolved this session. Thank you for using our support!'
            })

            // 2. Save Transcript to Notion via our secure API
            const response = await fetch('/api/chat/save-transcript', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sessionId })
            })

            const result = await response.json()
            if (!response.ok) throw new Error(result.error || 'Failed to save to Notion')

            alert('Ticket has been resolved and transcript saved to Notion.')
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
                {isCheckingAuth ? (
                    <div className="flex justify-center items-center h-64">
                        <Loader2 className="animate-spin text-kb-navy" size={48} />
                    </div>
                ) : (
                    <>
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
                                disabled={isClosing || sessionInfo?.status === 'resolved' || sessionInfo?.status === 'closed'}
                                className="bg-red-600 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md hover:bg-red-700 transition-all disabled:opacity-50"
                            >
                                {isClosing ? 'Closing...' : (sessionInfo?.status === 'resolved' || sessionInfo?.status === 'closed') ? 'Ticket Closed' : 'Resolve Ticket'}
                            </button>
                            <div className="text-xs text-amber-900 font-mono bg-white/50 px-3 py-1 rounded-lg border border-amber-200">
                                Session: {sessionId.substring(0, 8)}
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col lg:flex-row gap-8 h-[700px]">
                        {/* Sidebar - Only visible for Agent */}
                        <div className="w-full lg:w-80 space-y-6">
                            {/* Screen Share Viewer */}
                            {remoteStream && (
                                <div className={`bg-black rounded-3xl overflow-hidden border-2 border-green-400/50 shadow-lg ${
                                    isViewerFullscreen ? 'fixed inset-4 z-[9999] rounded-2xl' : ''
                                }`}>
                                    <div className="flex items-center justify-between px-3 py-2 bg-black/80">
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                                            <span className="text-[10px] font-bold text-green-400 uppercase tracking-wider">Customer Screen</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <button
                                                onClick={() => setIsViewerFullscreen(!isViewerFullscreen)}
                                                className="p-1 text-white/50 hover:text-white transition-colors"
                                            >
                                                {isViewerFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
                                            </button>
                                        </div>
                                    </div>
                                    <video
                                        ref={videoRef}
                                        autoPlay
                                        playsInline
                                        className={`w-full bg-black ${isViewerFullscreen ? 'h-[calc(100%-32px)] object-contain' : 'max-h-[300px] object-contain'}`}
                                    />

                                    {/* Mini Chat - only in fullscreen */}
                                    {isViewerFullscreen && (
                                        <div className="absolute bottom-4 right-4 w-80 z-10">
                                            <button
                                                onClick={() => setIsMiniChatOpen(!isMiniChatOpen)}
                                                className="ml-auto mb-1 flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white text-xs font-bold rounded-lg transition-colors"
                                            >
                                                <MessageCircle size={12} />
                                                {isMiniChatOpen ? 'Hide Chat' : 'Show Chat'}
                                            </button>
                                            {isMiniChatOpen && (
                                                <div className="bg-gray-900/90 backdrop-blur-md rounded-2xl border border-white/10 shadow-2xl overflow-hidden">
                                                    <div className="max-h-48 overflow-y-auto p-3 space-y-2">
                                                        {messages.slice(-8).map((m, i) => (
                                                            <div key={i} className={`text-xs ${
                                                                m.role === 'system' ? 'text-center text-gray-400 italic' :
                                                                m.role === 'assistant' ? 'text-right' : 'text-left'
                                                            }`}>
                                                                {m.role === 'system' ? (
                                                                    <span className="bg-white/5 px-2 py-0.5 rounded-full">{m.content}</span>
                                                                ) : (
                                                                    <span className={`inline-block px-2.5 py-1.5 rounded-xl max-w-[85%] ${
                                                                        m.role === 'assistant'
                                                                            ? 'bg-blue-600 text-white'
                                                                            : 'bg-white/15 text-white'
                                                                    }`}>
                                                                        {m.content.length > 120 ? m.content.slice(0, 120) + '...' : m.content}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        ))}
                                                        <div ref={miniChatEndRef} />
                                                    </div>
                                                    <div className="p-2 border-t border-white/10 flex gap-1.5">
                                                        <input
                                                            value={miniChatInput}
                                                            onChange={(e) => setMiniChatInput(e.target.value)}
                                                            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleMiniChatSend() } }}
                                                            placeholder="Quick reply..."
                                                            className="flex-1 bg-white/10 text-white text-xs px-3 py-2 rounded-lg outline-none placeholder-white/40 focus:bg-white/15 transition-colors"
                                                        />
                                                        <button
                                                            onClick={handleMiniChatSend}
                                                            disabled={!miniChatInput.trim()}
                                                            className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 disabled:opacity-30 transition-all"
                                                        >
                                                            <Send size={14} />
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                                <h2 className="text-h3 font-bold text-kb-navy mb-4 flex items-center gap-2">
                                    <Clock size={20} className="text-kb-navy/40" />
                                    Client Info
                                </h2>
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-2xl border border-gray-100">
                                        <div className="w-10 h-10 bg-kb-navy/10 rounded-full flex items-center justify-center">
                                            <User className="text-kb-navy" size={20} />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-[10px] uppercase font-bold text-gray-400">User</p>
                                            <p className="font-semibold text-gray-800 truncate">{sessionInfo?.user_name || 'Loading...'}</p>
                                            <p className="text-[10px] text-gray-500 truncate">{sessionInfo?.user_email || 'No email'}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-2xl border border-gray-100">
                                        <div className="w-10 h-10 bg-kb-navy/10 rounded-full flex items-center justify-center">
                                            <Laptop className="text-kb-navy" size={20} />
                                        </div>
                                        <div>
                                            <p className="text-[10px] uppercase font-bold text-gray-400">Device</p>
                                            <p className="font-semibold text-gray-800">{sessionInfo?.user_device || 'Not specified'}</p>
                                        </div>
                                    </div>
                                    <div className="p-4 bg-gray-50/50 rounded-2xl border border-gray-100">
                                        <div className="flex justify-between items-center mb-1">
                                            <p className="text-[10px] uppercase font-bold text-gray-400">Status</p>
                                            <p className="text-[10px] font-mono text-kb-navy/40">#{sessionInfo?.transcript_id}</p>
                                        </div>
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

                        {/* Chat */}
                        <div className="flex-1 min-h-0">
                        <ChatInterface
                            initialMessages={messages}
                            onSendMessage={handleSendMessage}
                            isLoading={isLoading || sessionInfo?.status === 'resolved' || sessionInfo?.status === 'closed'}
                            title={isAdmin ? `Helping ${sessionInfo?.user_name || 'User'}` : "Live Expert Support"}
                            status={isAdmin ? ((sessionInfo?.status === 'resolved' || sessionInfo?.status === 'closed') ? "Chat Closed" : "Speaking as Agent") : ((sessionInfo?.status === 'resolved' || sessionInfo?.status === 'closed') ? "Conversation Ended" : "Connected to Support")}
                            placeholder={(sessionInfo?.status === 'resolved' || sessionInfo?.status === 'closed') ? "This chat has been closed." : (isAdmin ? "Reply to the client..." : "Type your message...")}
                                isAdminView={true}
                                sessionId={sessionId}
                                supabaseClient={supabase}
                                onRemoteStream={(stream) => setRemoteStream(stream)}
                                onScreenShareStatusChange={handleScreenShareStatusChange}
                            />
                        </div>
                    </div>
                    </>
                )}
            </main>

        </div>
    )
}

export default withAuth(SessionPage, { allowedRoles: ['agent', 'admin'] })
