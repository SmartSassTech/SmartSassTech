'use client'

import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Send, Bot, User, Users, ArrowLeft, ArrowRight, Loader2,
    CheckCircle2, Star, Monitor, MonitorOff
} from 'lucide-react'
import { marked } from 'marked'
import sanitizeHtml from 'sanitize-html'
import { supabase } from '@/lib/supabase'
import { ScreenShareManager } from '@/lib/webrtc-screen-share'

interface Message {
    role: 'user' | 'assistant' | 'system'
    content: string
}

type ChatMode = 'ai' | 'human-form' | 'human-live'

interface InlineChatbotProps {
    /** Start directly in human-form mode instead of AI mode */
    startWithHuman?: boolean
    /** Called when user clicks "Back to options" to return to the support hub cards */
    onBack?: () => void
}

export default function InlineChatbot({ startWithHuman = false, onBack }: InlineChatbotProps) {
    const [mode, setMode] = useState<ChatMode>(startWithHuman ? 'human-form' : 'ai')

    // AI State
    const [messages, setMessages] = useState<Message[]>([
        { role: 'assistant', content: 'Hi there! 👋 I\'m here to help you with any tech questions or issues you\'re having. What can I help you with today?' }
    ])
    const [input, setInput] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const messagesEndRef = useRef<HTMLDivElement>(null)

    // Human Form State
    const [formData, setFormData] = useState({ name: '', email: '', phone: '', device: '', issue: '', website: '' })
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [didSaveBotTranscript, setDidSaveBotTranscript] = useState(false)

    // Live Session State
    const [sessionId, setSessionId] = useState<string | null>(null)
    const [liveMessages, setLiveMessages] = useState<Message[]>([])
    const [sessionStatus, setSessionStatus] = useState<string>('open')
    const [rating, setRating] = useState(0)
    const [hasRated, setHasRated] = useState(false)
    const [isRating, setIsRating] = useState(false)
    const [isSharing, setIsSharing] = useState(false)
    const screenShareRef = useRef<ScreenShareManager | null>(null)

    // Screen sharing lifecycle
    useEffect(() => {
        if (mode !== 'human-live' || !sessionId) {
            if (screenShareRef.current) {
                screenShareRef.current.destroy()
                screenShareRef.current = null
                setIsSharing(false)
            }
            return
        }

        const manager = new ScreenShareManager(supabase, sessionId, 'sharer', {
            onSharingStarted: () => {
                setIsSharing(true)
                setLiveMessages(prev => [...prev, { role: 'system', content: '🖥️ Screen sharing started' }])
            },
            onSharingStopped: () => {
                setIsSharing(false)
                setLiveMessages(prev => [...prev, { role: 'system', content: '🖥️ Screen sharing ended' }])
            },
            onError: (err) => console.error('[ScreenShare]', err),
        })
        manager.init()
        screenShareRef.current = manager

        return () => {
            manager.destroy()
            screenShareRef.current = null
            setIsSharing(false)
        }
    }, [mode, sessionId])

    const handleShareScreen = async () => {
        if (!screenShareRef.current) return
        if (isSharing) {
            screenShareRef.current.stopSharing()
        } else {
            await screenShareRef.current.startSharing()
        }
    }

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }

    useEffect(() => {
        scrollToBottom()
    }, [messages, liveMessages, mode])

    // Live chat subscriptions
    useEffect(() => {
        if (mode !== 'human-live' || !sessionId) return

        const fetchMessages = async () => {
            const { data } = await supabase
                .from('chat_messages')
                .select('*')
                .eq('session_id', sessionId)
                .order('created_at', { ascending: true })

            if (data && data.length > 0) {
                setLiveMessages(data.map((m: any) => ({
                    role: m.sender_type === 'agent' || m.sender_type === 'ai' || m.sender_type === 'system'
                        ? (m.sender_type === 'system' ? 'system' : 'assistant')
                        : 'user',
                    content: m.message_content
                })))
            }
        }

        setTimeout(fetchMessages, 1000)

        const sessionChannel = supabase
            .channel(`inline-session-${sessionId}`)
            .on(
                'postgres_changes',
                { event: 'UPDATE', schema: 'public', table: 'chat_sessions', filter: `id=eq.${sessionId}` },
                (payload) => {
                    const updatedSession = payload.new as any
                    setSessionStatus(updatedSession.status)
                }
            ).subscribe()

        const messageChannel = supabase
            .channel(`inline-messages-${sessionId}`)
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `session_id=eq.${sessionId}` },
                (payload) => {
                    const newMsg = payload.new as any
                    const senderRole = newMsg.sender_type === 'agent' || newMsg.sender_type === 'ai' ? 'assistant' : newMsg.sender_type
                    if (senderRole !== 'user') {
                        setLiveMessages(prev => {
                            if (senderRole === 'system' && prev.some(m => m.content === newMsg.message_content)) return prev
                            return [...prev, { role: senderRole, content: newMsg.message_content }]
                        })
                    }
                }
            ).subscribe()

        return () => {
            supabase.removeChannel(sessionChannel)
            supabase.removeChannel(messageChannel)
        }
    }, [mode, sessionId])

    // ─── Handlers ─────────────────────────────────────────

    const handleAISend = async () => {
        if (!input.trim() || isLoading) return
        const userMessage: Message = { role: 'user', content: input }
        setMessages(prev => [...prev, userMessage])
        setInput('')
        setIsLoading(true)
        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ messages: [...messages, userMessage] })
            })
            const data = await response.json()
            if (!response.ok) {
                const errorMsg = data.details || data.error || 'Failed to fetch'
                setMessages(prev => [...prev, { role: 'assistant', content: `Error: ${errorMsg}` }])
            } else {
                setMessages(prev => [...prev, data])
            }
        } catch (error: any) {
            setMessages(prev => [...prev, { role: 'assistant', content: `Error: ${error.message || 'Unexpected error.'}` }])
        } finally {
            setIsLoading(false)
        }
    }

    const handleLiveSend = async () => {
        if (!input.trim() || isLoading || sessionStatus === 'resolved' || sessionStatus === 'closed') return
        const userMessage: Message = { role: 'user', content: input }
        setLiveMessages(prev => [...prev, userMessage])
        setInput('')
        setIsLoading(true)
        try {
            await supabase.from('chat_messages').insert({
                session_id: sessionId,
                sender_type: 'user',
                message_content: userMessage.content
            })
            await supabase.from('chat_sessions')
                .update({ updated_at: new Date().toISOString() })
                .eq('id', sessionId)
            fetch('/api/chat/notify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sessionId, action: 'user_message' })
            }).catch(console.error)
        } catch (error) {
            console.error('Failed to send live message', error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleSend = () => {
        if (mode === 'ai') handleAISend()
        else if (mode === 'human-live') handleLiveSend()
    }

    const handleEndChat = async () => {
        if (!confirm('Are you sure you want to end this chat?')) return
        setSessionStatus('closed')
        try {
            await supabase.from('chat_sessions')
                .update({ status: 'closed', updated_at: new Date().toISOString() })
                .eq('id', sessionId)
            await supabase.from('chat_messages').insert({
                session_id: sessionId,
                sender_type: 'system',
                message_content: 'The client has ended the chat.'
            })
            fetch('/api/chat/notify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sessionId, action: 'chat_ended' })
            }).catch(console.error)
        } catch (error) {
            console.error('Failed to close chat', error)
        }
    }

    const triggerSaveBotTranscript = () => {
        if (mode === 'ai' && messages.length > 1 && !didSaveBotTranscript) {
            setDidSaveBotTranscript(true)
            fetch('/api/chat/save-bot-transcript', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ messages })
            }).catch(console.error)
        }
    }

    const handleHumanRequest = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSubmitting(true)
        try {
            const { data: authData, error: authError } = await supabase.auth.signInAnonymously({
                options: {
                    data: {
                        first_name: formData.name,
                        email: formData.email,
                        phone: formData.phone,
                    }
                }
            })
            if (authError) throw authError

            const response = await fetch('/api/chat/live', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    user_id: authData.user?.id,
                    history: messages
                })
            })
            const data = await response.json()
            if (response.ok) {
                setSessionId(data.sessionId)
                setLiveMessages(messages)
                setMode('human-live')
                setSessionStatus('open')
            } else {
                alert('Failed to initiate live chat: ' + data.error)
            }
        } catch (error: any) {
            alert('Error connecting to support: ' + (error.message || 'Unknown error'))
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleRate = async (score: number) => {
        if (!sessionId || hasRated || isRating) return
        setRating(score)
        setIsRating(true)
        try {
            await fetch('/api/chat/rate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sessionId, score })
            })
            setHasRated(true)
        } catch (error) {
            console.error('Failed to submit rating', error)
        } finally {
            setIsRating(false)
        }
    }

    const handleBack = () => {
        triggerSaveBotTranscript()
        onBack?.()
    }

    // ─── Renderers ────────────────────────────────────────

    const currentMessages = mode === 'human-live' ? liveMessages : messages
    const isChatEnded = mode === 'human-live' && (sessionStatus === 'resolved' || sessionStatus === 'closed')

    const renderMessageContent = (m: Message) => {
        if (m.content.startsWith('Error:')) {
            return (
                <div className="font-semibold">
                    {m.content.includes('429') || m.content.includes('quota') || m.content.includes('Daily limit')
                        ? 'AI service limit reached. This usually resets shortly.'
                        : 'I encountered an issue processing your request.'}
                </div>
            )
        }
        return (
            <div
                className="max-w-none text-base leading-relaxed whitespace-normal break-words [&_p]:mb-3 last:[&_p]:mb-0 [&_b]:font-bold [&_strong]:font-bold [&_ul]:list-disc [&_ul]:pl-4 [&_ul]:mb-3 [&_ol]:list-decimal [&_ol]:pl-4 [&_ol]:mb-3 [&_li]:mb-1 [&_a]:text-sst-primary [&_a]:underline [&_a]:font-medium hover:[&_a]:text-sst-secondary"
                dangerouslySetInnerHTML={{
                    __html: sanitizeHtml(marked.parse(m.content) as string, {
                        allowedTags: ['p', 'b', 'i', 'strong', 'em', 'ul', 'ol', 'li', 'br', 'h1', 'h2', 'h3', 'code', 'a'],
                        allowedAttributes: { 'a': ['href', 'target', 'rel'] },
                        transformTags: {
                            'a': (tagName, attribs) => ({
                                tagName: 'a',
                                attribs: { ...attribs, target: '_blank', rel: 'noopener noreferrer' }
                            })
                        }
                    })
                }}
            />
        )
    }

    // ─── Human Form View ──────────────────────────────────

    if (mode === 'human-form') {
        return (
            <div className="bg-white rounded-3xl shadow-xl border border-kb-cream overflow-hidden">
                <div className="bg-kb-navy p-5 flex items-center justify-between text-white">
                    <div className="flex items-center gap-3">
                        <div className="bg-white/20 p-2 rounded-xl">
                            <Users size={22} />
                        </div>
                        <div>
                            <h3 className="font-bold text-lg">Talk to a Person</h3>
                            <p className="text-white/70 text-sm">We&apos;ll connect you with someone who can help</p>
                        </div>
                    </div>
                </div>

                <div className="p-8 md:p-10">
                    <p className="text-kb-dark mb-6 text-base">Fill in your info and briefly tell us what&apos;s happening — we&apos;ll connect you right away.</p>

                    <form onSubmit={handleHumanRequest} className="space-y-5">
                        <div>
                            <label htmlFor="human-name" className="block text-sst-primary font-bold mb-2 text-base">Your Name *</label>
                            <input
                                id="human-name" type="text" required
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                className="w-full px-5 py-4 bg-kb-bg border-none rounded-2xl focus:ring-2 focus:ring-sst-primary transition-all text-base"
                                placeholder="Jane Doe"
                            />
                        </div>
                        <div>
                            <label htmlFor="human-email" className="block text-sst-primary font-bold mb-2 text-base">Email Address *</label>
                            <input
                                id="human-email" type="email" required
                                value={formData.email}
                                onChange={e => setFormData({ ...formData, email: e.target.value })}
                                className="w-full px-5 py-4 bg-kb-bg border-none rounded-2xl focus:ring-2 focus:ring-sst-primary transition-all text-base"
                                placeholder="jane@example.com"
                            />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="human-phone" className="block text-sst-primary font-bold mb-2 text-base">Phone</label>
                                <input
                                    id="human-phone" type="tel"
                                    value={formData.phone}
                                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                    className="w-full px-5 py-4 bg-kb-bg border-none rounded-2xl focus:ring-2 focus:ring-sst-primary transition-all text-base"
                                    placeholder="(Optional)"
                                />
                            </div>
                            <div>
                                <label htmlFor="human-device" className="block text-sst-primary font-bold mb-2 text-base">Device</label>
                                <input
                                    id="human-device" type="text"
                                    value={formData.device}
                                    onChange={e => setFormData({ ...formData, device: e.target.value })}
                                    className="w-full px-5 py-4 bg-kb-bg border-none rounded-2xl focus:ring-2 focus:ring-sst-primary transition-all text-base"
                                    placeholder="e.g. iPhone 15 (Optional)"
                                />
                            </div>
                        </div>
                        <div>
                            <label htmlFor="human-issue" className="block text-sst-primary font-bold mb-2 text-base">What&apos;s going on?</label>
                            <textarea
                                id="human-issue" rows={3}
                                value={formData.issue}
                                onChange={e => setFormData({ ...formData, issue: e.target.value })}
                                className="w-full px-5 py-4 bg-kb-bg border-none rounded-2xl focus:ring-2 focus:ring-sst-primary transition-all text-base resize-none"
                                placeholder="Briefly describe your issue (Optional)"
                            />
                        </div>
                        {/* Honeypot */}
                        <input type="text" name="website" value={formData.website} onChange={e => setFormData({ ...formData, website: e.target.value })} tabIndex={-1} aria-hidden="true" style={{ display: 'none' }} />

                        <button
                            type="submit" disabled={isSubmitting}
                            className={`w-full py-5 bg-sst-primary text-white font-bold rounded-2xl hover:bg-sst-secondary transition-all shadow-lg text-lg flex items-center justify-center gap-2 ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}
                        >
                            {isSubmitting ? <><Loader2 size={20} className="animate-spin" /> Connecting...</> : <><Users size={18} /> Start Live Chat</>}
                        </button>
                    </form>

                    <div className="mt-6 flex justify-center">
                        <button onClick={handleBack} className="text-kb-muted hover:text-sst-primary text-sm font-medium flex items-center gap-1 transition-colors">
                            <ArrowLeft size={14} /> Back to support options
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    // ─── Chat View (AI or Live) ───────────────────────────

    return (
        <div className="bg-white rounded-3xl shadow-xl border border-kb-cream overflow-hidden flex flex-col" style={{ height: '85vh', minHeight: '600px', maxHeight: '1100px' }}>
            {/* Header */}
            <div className="bg-kb-navy p-5 flex items-center justify-between text-white shrink-0">
                <div className="flex items-center gap-3">
                    <div className="bg-white/20 p-2 rounded-xl">
                        {mode === 'ai' ? <Bot size={22} /> : <Users size={22} />}
                    </div>
                    <div>
                        <h3 className="font-bold text-lg">
                            {mode === 'ai' ? 'Tech Assistant' : 'Live Support'}
                        </h3>
                        <div className="flex items-center gap-1.5">
                            <div className={`w-2 h-2 rounded-full animate-pulse ${
                                mode === 'human-live' && sessionStatus !== 'open'
                                    ? (sessionStatus === 'in_progress' ? 'bg-amber-400' : 'bg-gray-400')
                                    : 'bg-green-400'
                            }`} />
                            <span className="text-sm text-white/80 capitalize">
                                {mode === 'human-live' ? sessionStatus.replace('_', ' ') : 'Online'}
                            </span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {mode === 'human-live' && !isChatEnded && (
                        <button
                            onClick={handleEndChat}
                            className="bg-white/10 hover:bg-red-500/80 px-4 py-2 rounded-xl text-sm font-bold transition-colors border border-white/20"
                        >
                            End Chat
                        </button>
                    )}
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-6 space-y-5 bg-gray-50/50">
                {currentMessages.map((m, i) => (
                    <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} ${m.role === 'system' ? 'justify-center' : ''}`}>
                        {m.role === 'system' ? (
                            <div className="bg-gray-200 text-gray-600 text-xs px-4 py-1.5 rounded-full font-medium">
                                {m.content}
                            </div>
                        ) : (
                            <div className={`flex gap-3 max-w-[85%] min-w-0 ${m.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                                    m.role === 'user'
                                        ? 'bg-kb-navy text-white'
                                        : 'bg-white text-kb-navy border border-gray-200'
                                }`}>
                                    {m.role === 'user' ? <User size={18} /> : mode === 'human-live' ? <Users size={18} /> : <Bot size={18} />}
                                </div>
                                <div className={`p-4 rounded-2xl min-w-0 overflow-hidden break-words ${
                                    m.role === 'user'
                                        ? 'bg-kb-navy text-white rounded-tr-none [&_p]:text-white'
                                        : 'bg-white text-gray-800 border border-gray-100 shadow-sm rounded-tl-none'
                                }`}>
                                    {renderMessageContent(m)}
                                </div>
                            </div>
                        )}
                    </div>
                ))}
                {isLoading && (
                    <div className="flex justify-start">
                        <div className="flex gap-3 max-w-[85%]">
                            <div className="w-10 h-10 rounded-full bg-white text-kb-navy border border-gray-200 flex items-center justify-center">
                                {mode === 'human-live' ? <Users size={18} /> : <Bot size={18} />}
                            </div>
                            <div className="bg-white p-4 rounded-2xl rounded-tl-none border border-gray-100 shadow-sm">
                                <div className="flex gap-1.5">
                                    <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce [animation-delay:-0.3s]" />
                                    <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce [animation-delay:-0.15s]" />
                                    <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" />
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Footer */}
            <div className="bg-white border-t border-gray-100 shrink-0">
                {/* Screen sharing indicator */}
                {isSharing && mode === 'human-live' && (
                    <div className="px-5 py-3 bg-amber-50 border-b border-amber-200 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                            <span className="text-sm font-bold text-amber-800">Sharing your screen</span>
                        </div>
                        <button onClick={handleShareScreen} className="px-3 py-1 bg-red-500 text-white text-xs font-bold rounded-lg hover:bg-red-600 transition-colors">
                            Stop
                        </button>
                    </div>
                )}

                {/* Escalate button (AI mode only) */}
                {mode === 'ai' && (
                    <div className="px-5 pt-3 flex justify-center">
                        <button
                            onClick={() => {
                                triggerSaveBotTranscript()
                                setMode('human-form')
                            }}
                            className="flex items-center gap-2 text-sm text-kb-navy font-bold hover:bg-kb-navy/5 py-2 px-4 rounded-full border border-kb-navy/20 transition-colors"
                        >
                            <Users size={14} />
                            Talk to a Person Instead
                            <ArrowRight size={14} />
                        </button>
                    </div>
                )}

                <div className="p-5 pt-3">
                    {isChatEnded && !hasRated ? (
                        <div className="flex flex-col items-center justify-center p-4 bg-gray-50 border border-gray-100 rounded-xl mb-3">
                            <p className="text-sm font-bold text-kb-navy mb-3">How was your support experience?</p>
                            <div className="flex gap-2">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                        key={star}
                                        disabled={isRating}
                                        onClick={() => handleRate(star)}
                                        className="text-gray-300 hover:text-amber-400 hover:scale-110 transition-all focus:outline-none"
                                        aria-label={`Rate ${star} out of 5 stars`}
                                    >
                                        <Star size={28} fill={rating >= star ? 'currentColor' : 'none'} className={rating >= star ? 'text-amber-400' : ''} />
                                    </button>
                                ))}
                            </div>
                        </div>
                    ) : isChatEnded && hasRated ? (
                        <div className="flex items-center justify-center gap-2 p-4 bg-green-50 border border-green-100 rounded-xl mb-3 text-green-700 font-bold text-sm">
                            <CheckCircle2 size={18} />
                            Thank you for your feedback!
                        </div>
                    ) : (
                        <div className="relative flex items-center">
                            <textarea
                                value={input}
                                onChange={(e) => {
                                    setInput(e.target.value)
                                    e.target.style.height = 'auto'
                                    e.target.style.height = `${e.target.scrollHeight}px`
                                }}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault()
                                        handleSend()
                                        e.currentTarget.style.height = 'auto'
                                    }
                                }}
                                placeholder={isChatEnded ? 'Session ended' : 'Type your message...'}
                                disabled={isChatEnded}
                                rows={1}
                                className={`w-full pl-5 py-4 bg-gray-100 border-none rounded-2xl text-base focus:ring-2 focus:ring-kb-navy/20 transition-all outline-none resize-y overflow-y-auto max-h-48 text-black leading-relaxed ${mode === 'human-live' ? 'pr-28' : 'pr-14'}`}
                                aria-label="Type your message"
                            />
                            <div className="absolute right-2 bottom-2 flex items-center gap-1.5">
                                {mode === 'human-live' && !isChatEnded && (
                                    <button
                                        onClick={handleShareScreen}
                                        title={isSharing ? 'Stop Sharing' : 'Share Screen'}
                                        className={`p-2.5 rounded-xl transition-all ${
                                            isSharing
                                                ? 'bg-red-500 text-white hover:bg-red-600'
                                                : 'bg-gray-200 text-gray-500 hover:bg-gray-300 hover:text-gray-700'
                                        }`}
                                    >
                                        {isSharing ? <MonitorOff size={18} /> : <Monitor size={18} />}
                                    </button>
                                )}
                                <button
                                    onClick={handleSend}
                                    disabled={!input.trim() || isLoading || isChatEnded}
                                    className="p-2.5 bg-kb-navy text-white rounded-xl hover:bg-kb-navy/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                    aria-label="Send message"
                                >
                                    <Send size={18} />
                                </button>
                            </div>
                        </div>
                    )}
                    <div className="flex items-center justify-between mt-3">
                        <button onClick={handleBack} className="text-kb-muted hover:text-sst-primary text-sm font-medium flex items-center gap-1 transition-colors">
                            <ArrowLeft size={14} /> Back to options
                        </button>
                        <p className="text-xs text-gray-400">
                            {mode === 'ai' ? 'Powered by Gemini AI' : 'Secure Chat'}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
