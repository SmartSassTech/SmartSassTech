'use client'

import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageCircle, X, Send, Bot, User, Maximize2, Minimize2, Users, ArrowRight, Loader2, CheckCircle2, Star, Monitor, MonitorOff } from 'lucide-react'
import { marked } from 'marked'
import sanitizeHtml from 'sanitize-html'
import { supabase } from '@/lib/supabase'
import { ScreenShareManager } from '@/lib/webrtc-screen-share'

interface Message {
    role: 'user' | 'assistant' | 'system'
    content: string
}

type ChatMode = 'ai' | 'human-form' | 'human-live'

export default function Chatbot() {
    const [isOpen, setIsOpen] = useState(false)
    const [mode, setMode] = useState<ChatMode>('ai')
    
    // AI State
    const [messages, setMessages] = useState<Message[]>([
        { role: 'assistant', content: 'Hi there! 👋 I\'m here to help you with any tech questions or issues you\'re having. What can I help you with today?' }
    ])
    const [input, setInput] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [isFullScreen, setIsFullScreen] = useState(false)
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

    // Initialize/cleanup screen share manager for live chat mode
    useEffect(() => {
        if (mode !== 'human-live' || !sessionId) {
            // Clean up if we leave live mode
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
                    role: m.sender_type === 'agent' || m.sender_type === 'ai' || m.sender_type === 'system' ? (m.sender_type === 'system' ? 'system' : 'assistant') : 'user',
                    content: m.message_content
                })))
            }
        }
        
        // Initial fetch after a tiny delay to ensure API has finished bulk insert
        setTimeout(fetchMessages, 1000)

        // Subscribe to session updates
        const sessionChannel = supabase
            .channel(`widget-session-${sessionId}`)
            .on(
                'postgres_changes',
                { event: 'UPDATE', schema: 'public', table: 'chat_sessions', filter: `id=eq.${sessionId}` },
                (payload) => {
                    const updatedSession = payload.new as any
                    setSessionStatus(updatedSession.status)
                }
            ).subscribe()

        // Subscribe to messages
        const messageChannel = supabase
            .channel(`widget-messages-${sessionId}`)
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `session_id=eq.${sessionId}` },
                (payload) => {
                    const newMsg = payload.new as any
                    const senderRole = newMsg.sender_type === 'agent' || newMsg.sender_type === 'ai' ? 'assistant' : newMsg.sender_type
                    
                    // only append if it's from agent or system, because we optimistically add our own user messages
                    if (senderRole !== 'user') {
                        setLiveMessages(prev => {
                            // avoid duplicates for system messages occasionally fired twice by realtime insert bounds
                            if (senderRole === 'system' && prev.some(m => m.content === newMsg.message_content)) return prev;
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
            setMessages(prev => [...prev, { role: 'assistant', content: `Error: ${error.message || 'I encountered an unexpected network error.'}` }])
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
        if (!confirm('Are you sure you want to end this chat?')) return;
        setSessionStatus('closed');
        try {
            await supabase.from('chat_sessions')
                .update({ status: 'closed', updated_at: new Date().toISOString() })
                .eq('id', sessionId)
                
            await supabase.from('chat_messages').insert({
                session_id: sessionId,
                sender_type: 'system',
                message_content: 'The client has ended the chat.'
            })
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
                    history: messages // Pass AI history
                })
            })
            const data = await response.json()
            if (response.ok) {
                setSessionId(data.sessionId)
                setLiveMessages(messages)
                setMode('human-live')
                setSessionStatus('open')
            } else {
                alert('Failed to initiate human chat: ' + data.error)
            }
        } catch (error: any) {
            alert('Error connecting to support: ' + (error.message || 'Unknown error'))
        } finally {
            setIsSubmitting(false)
        }
    }

    const currentMessages = mode === 'human-live' ? liveMessages : messages
    const isChatEnded = mode === 'human-live' && (sessionStatus === 'resolved' || sessionStatus === 'closed')

    const handleRate = async (score: number) => {
        if (!sessionId || hasRated || isRating) return;
        setRating(score);
        setIsRating(true);
        try {
            await fetch('/api/chat/rate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sessionId, score })
            });
            setHasRated(true);
        } catch (error) {
            console.error('Failed to submit rating', error);
        } finally {
            setIsRating(false);
        }
    }

    const renderMessageContent = (m: Message) => {
         if (m.content.startsWith('Error:')) {
            return (
                <div className="flex flex-col gap-2">
                    <div className="font-semibold">
                        {m.content.includes('429') || m.content.includes('quota') || m.content.includes('Daily limit')
                            ? 'AI service limit reached. This usually resets shortly or daily.'
                            : 'I encountered an issue processing your request.'}
                    </div>
                </div>
            )
        }

        return (
            <div
                className="max-w-none text-sm leading-relaxed whitespace-normal break-words [&_p]:mb-3 last:[&_p]:mb-0 [&_b]:font-bold [&_strong]:font-bold [&_ul]:list-disc [&_ul]:pl-4 [&_ul]:mb-3 [&_ol]:list-decimal [&_ol]:pl-4 [&_ol]:mb-3 [&_li]:mb-1 [&_a]:text-kb-navy [&_a]:underline [&_a]:font-medium hover:[&_a]:text-kb-navy/80"
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

    return (
        <div className={`fixed ${isFullScreen ? 'inset-0 z-[9999]' : 'bottom-6 right-6 z-[2000]'} flex flex-col items-end overflow-hidden`}>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={isFullScreen ? { opacity: 0 } : { opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={isFullScreen ? { opacity: 0 } : { opacity: 0, y: 20, scale: 0.95 }}
                        className={`${isFullScreen
                            ? 'w-full h-full m-0 rounded-none'
                            : 'mb-4 w-80 sm:w-96 rounded-2xl h-[600px] max-h-[80vh]'
                            } bg-white shadow-2xl border border-gray-100 flex flex-col overflow-hidden transition-all duration-300 relative`}
                    >
                        {/* Header */}
                        <div className="bg-kb-navy p-4 flex justify-between items-center text-white shrink-0">
                            <div className="flex items-center gap-2">
                                <button 
                                    onClick={() => mode !== 'ai' && setMode('ai')}
                                    className={`bg-white/20 p-2 rounded-lg ${mode !== 'ai' ? 'hover:bg-white/30 cursor-pointer transition-colors' : ''}`}
                                    title={mode !== 'ai' ? "Back to AI" : ""}
                                >
                                    {mode === 'ai' ? <Bot size={20} /> : <Users size={20} />}
                                </button>
                                <div>
                                    <h3 className="font-semibold text-sm">
                                        {mode === 'ai' ? 'Tech Assistant' : mode === 'human-form' ? 'Human Request' : 'Live Support'}
                                    </h3>
                                    <div className="flex items-center gap-1.5">
                                        <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${mode === 'human-live' && sessionStatus !== 'open' ? (sessionStatus === 'in_progress' ? 'bg-amber-400' : 'bg-gray-400') : 'bg-green-400'}`} />
                                        <span className="text-[10px] text-white/80 capitalize">
                                            {mode === 'human-live' ? sessionStatus.replace('_', ' ') : 'Online'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                {mode === 'human-live' && !isChatEnded && (
                                    <button
                                        onClick={handleEndChat}
                                        className="bg-white/10 hover:bg-red-500/80 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors border border-white/20 mr-1"
                                        title="End Chat"
                                    >
                                        End Chat
                                    </button>
                                )}
                                <button
                                    onClick={() => setIsFullScreen(!isFullScreen)}
                                    className="hover:bg-white/10 p-1.5 rounded-lg transition-colors"
                                    title={isFullScreen ? "Exit Fullscreen" : "Fullscreen"}
                                >
                                    {isFullScreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
                                </button>
                                <button
                                    onClick={() => {
                                        triggerSaveBotTranscript()
                                        setIsOpen(false)
                                    }}
                                    className="hover:bg-white/10 p-1.5 rounded-lg transition-colors"
                                    title="Close"
                                >
                                    <X size={20} />
                                </button>
                            </div>
                        </div>

                        {/* Content Area */}
                        {mode === 'human-form' ? (
                            <div className="flex-1 overflow-y-auto p-6 bg-gray-50 flex flex-col items-center justify-center">
                                <div className="text-center mb-6">
                                    <h2 className="text-lg font-bold text-kb-navy">Talk to an Expert</h2>
                                    <p className="text-gray-500 text-xs mt-1">Briefly tell us what's happening connecting you.</p>
                                </div>

                                <form onSubmit={handleHumanRequest} className="w-full space-y-3">
                                    <div>
                                        <input required type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-kb-navy/20 outline-none text-sm text-black" placeholder="Your Name *" />
                                    </div>
                                    <div>
                                        <input required type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-kb-navy/20 outline-none text-sm text-black" placeholder="Email Address *" />
                                    </div>
                                    <div>
                                        <input type="tel" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-kb-navy/20 outline-none text-sm text-black" placeholder="Phone Number (Optional)" />
                                    </div>
                                    <div>
                                        <input type="text" value={formData.device} onChange={e => setFormData({ ...formData, device: e.target.value })} className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-kb-navy/20 outline-none text-sm text-black" placeholder="Device (e.g. iPhone 15) (Optional)" />
                                    </div>
                                    <div>
                                        <textarea value={formData.issue} onChange={e => setFormData({ ...formData, issue: e.target.value })} className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-kb-navy/20 outline-none h-20 resize-none text-sm text-black" placeholder="Describe the issue briefly... (Optional)" />
                                    </div>
                                    <input type="text" name="website" value={formData.website} onChange={e => setFormData({ ...formData, website: e.target.value })} tabIndex={-1} aria-hidden="true" style={{ display: 'none' }} />
                                    <button disabled={isSubmitting} type="submit" className="w-full bg-kb-navy text-white py-3 rounded-lg font-bold text-sm shadow hover:bg-kb-navy/90 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                                        {isSubmitting ? <Loader2 className="animate-spin" size={16} /> : "Request Live Chat"}
                                    </button>
                                    <button type="button" onClick={() => setMode('ai')} className="w-full text-gray-400 text-xs hover:text-kb-navy transition-colors mt-2 pb-2">
                                        Cancel & Return to AI
                                    </button>
                                </form>
                            </div>
                        ) : (
                            <>
                                {/* Messages */}
                                <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4 bg-gray-50/50">
                                    {currentMessages.map((m, i) => (
                                        <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} ${m.role === 'system' ? 'justify-center' : ''}`}>
                                            {m.role === 'system' ? (
                                                <div className="bg-gray-200 text-gray-600 text-[10px] px-3 py-1 rounded-full font-medium">
                                                    {m.content}
                                                </div>
                                            ) : (
                                                <div className={`flex gap-2 max-w-[85%] ${m.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${m.role === 'user' ? 'bg-kb-navy text-white' : 'bg-white text-kb-navy border border-gray-200'}`}>
                                                        {m.role === 'user' ? <User size={16} /> : mode === 'human-live' ? <Users size={16} /> : <Bot size={16} />}
                                                    </div>
                                                    <div className={`p-3 rounded-2xl text-sm ${m.role === 'user' ? 'bg-kb-navy text-white rounded-tr-none [&_p]:text-white' : 'bg-white text-gray-800 border border-gray-100 shadow-sm rounded-tl-none'}`}>
                                                        {renderMessageContent(m)}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                    {isLoading && (
                                        <div className="flex justify-start">
                                            <div className="flex gap-2 max-w-[85%]">
                                                <div className="w-8 h-8 rounded-full bg-white text-kb-navy border border-gray-200 flex items-center justify-center">
                                                    {mode === 'human-live' ? <Users size={16} /> : <Bot size={16} />}
                                                </div>
                                                <div className="bg-white p-3 rounded-2xl rounded-tl-none border border-gray-100 shadow-sm">
                                                    <div className="flex gap-1">
                                                        <div className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce [animation-delay:-0.3s]" />
                                                        <div className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce [animation-delay:-0.15s]" />
                                                        <div className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce" />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                    <div ref={messagesEndRef} />
                                </div>

                                {/* Input Options & Footer */}
                                <div className="bg-white border-t border-gray-100 shrink-0">
                                    {isSharing && mode === 'human-live' && (
                                        <div className="px-4 py-2 bg-amber-50 border-b border-amber-200 flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                                                <span className="text-[10px] font-bold text-amber-800">Sharing your screen</span>
                                            </div>
                                            <button
                                                onClick={handleShareScreen}
                                                className="px-2 py-0.5 bg-red-500 text-white text-[9px] font-bold rounded hover:bg-red-600 transition-colors"
                                            >
                                                Stop
                                            </button>
                                        </div>
                                    )}
                                    {mode === 'ai' && (
                                        <div className="px-4 pt-3 flex flex-col items-center">
                                            <button
                                                onClick={() => {
                                                    triggerSaveBotTranscript()
                                                    setMode('human-form')
                                                }}
                                                className="flex items-center gap-1.5 text-[10px] text-kb-navy font-bold hover:bg-kb-navy/5 py-1.5 px-3 rounded-full border border-kb-navy/20 transition-colors cursor-pointer"
                                            >
                                                <Users size={12} />
                                                Escalate to Human Expert
                                                <ArrowRight size={12} />
                                            </button>
                                        </div>
                                    )}
                                    <div className="p-4 pt-2">
                                        {isChatEnded && !hasRated ? (
                                            <div className="flex flex-col items-center justify-center p-3 bg-gray-50 border border-gray-100 rounded-xl mb-2 animate-in fade-in slide-in-from-bottom-2">
                                                <p className="text-xs font-semibold text-kb-navy mb-2">How was your support experience?</p>
                                                <div className="flex gap-1.5">
                                                    {[1, 2, 3, 4, 5].map((star) => (
                                                        <button
                                                            key={star}
                                                            disabled={isRating}
                                                            onClick={() => handleRate(star)}
                                                            className="text-gray-300 hover:text-amber-400 hover:scale-110 transition-all focus:outline-none"
                                                        >
                                                            <Star size={24} fill={rating >= star ? 'currentColor' : 'none'} className={rating >= star ? 'text-amber-400' : ''} />
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        ) : isChatEnded && hasRated ? (
                                            <div className="flex items-center justify-center gap-2 p-3 bg-green-50 border border-green-100 rounded-xl mb-2 text-green-700 font-medium text-xs">
                                                <CheckCircle2 size={16} />
                                                Thank you for your feedback!
                                            </div>
                                        ) : (
                                            <div className="relative flex items-center">
                                                <textarea
                                                    value={input}
                                                    onChange={(e) => {
                                                        setInput(e.target.value);
                                                        e.target.style.height = 'auto';
                                                        e.target.style.height = `${e.target.scrollHeight}px`;
                                                    }}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter' && !e.shiftKey) {
                                                            e.preventDefault();
                                                            handleSend();
                                                            e.currentTarget.style.height = 'auto';
                                                        }
                                                    }}
                                                    placeholder={isChatEnded ? "Session ended" : "Type your message..."}
                                                    disabled={isChatEnded}
                                                    rows={1}
                                                    className={`w-full pl-4 py-3 bg-gray-100 border-none rounded-xl text-sm focus:ring-2 focus:ring-kb-navy/20 transition-all outline-none resize-none overflow-y-auto max-h-32 text-black leading-relaxed ${mode === 'human-live' ? 'pr-24' : 'pr-12'}`}
                                                />
                                                <div className="absolute right-1.5 bottom-1.5 flex items-center gap-1">
                                                    {mode === 'human-live' && !isChatEnded && (
                                                        <button
                                                            onClick={handleShareScreen}
                                                            title={isSharing ? 'Stop Sharing' : 'Share Screen'}
                                                            className={`p-2 rounded-lg transition-all ${
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
                                                        className="p-2 bg-kb-navy text-white rounded-lg hover:bg-kb-navy/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                                    >
                                                        <Send size={18} />
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                        <p className="text-[9px] text-center text-gray-400 mt-2">
                                            {mode === 'ai' ? 'Powered by Gemini AI • Always verify critical info' : 'Secure End-to-End Chat'}
                                        </p>
                                    </div>
                                </div>
                            </>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                    if (isOpen) triggerSaveBotTranscript()
                    setIsOpen(!isOpen)
                }}
                className="bg-kb-teal text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
                style={{ boxShadow: '0 4px 20px rgba(42, 157, 143, 0.4)' }}
            >
                {isOpen ? <X size={24} /> : (
                    <>
                        <MessageCircle size={24} />
                        <span className="font-medium pr-2">Tech Help</span>
                    </>
                )}
            </motion.button>
        </div>
    )
}
