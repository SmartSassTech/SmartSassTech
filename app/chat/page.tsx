'use client'

import React, { useState } from 'react'
import ChatInterface, { Message } from '@/components/ChatInterface'
import { supabase } from '@/lib/supabase'
import { motion, AnimatePresence } from 'framer-motion'
import { Users, Bot, ArrowRight, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'

export default function ChatPage() {
    const [mode, setMode] = useState<'ai' | 'human-form' | 'human-session'>('ai')
    const [messages, setMessages] = useState<Message[]>([
        { role: 'assistant', content: "Hi there! 👋 I'm here to help you with any tech questions or issues you're having. What can I help you with today?" }
    ])
    const [isAILoading, setIsAILoading] = useState(false)
    const [formData, setFormData] = useState({ name: '', device: '', issue: '' })
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [sessionId, setSessionId] = useState<string | null>(null)

    const handleAISend = async (content: string) => {
        const userMessage: Message = { role: 'user', content }
        setMessages(prev => [...prev, userMessage])
        setIsAILoading(true)

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ messages: [...messages, userMessage] })
            })
            const data = await response.json()
            if (response.ok) {
                setMessages(prev => [...prev, data])
            } else {
                setMessages(prev => [...prev, { role: 'assistant', content: `Error: ${data.error || 'Failed to get AI response'}` }])
            }
        } catch (error: any) {
            setMessages(prev => [...prev, { role: 'assistant', content: 'Connection error. Please try again or speak to a human.' }])
        } finally {
            setIsAILoading(false)
        }
    }

    const handleHumanRequest = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSubmitting(true)

        try {
            // 1. Sign in anonymously to get a user ID for RLS
            const { data: authData, error: authError } = await supabase.auth.signInAnonymously()
            if (authError) throw authError

            // 2. Send request to API with the user ID
            const response = await fetch('/api/chat/live', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    user_id: authData.user?.id
                })
            })
            const data = await response.json()
            if (response.ok) {
                setSessionId(data.sessionId)
                setMode('human-session')
            } else {
                alert('Failed to initiate human chat: ' + data.error)
            }
        } catch (error: any) {
            console.error('Escalation error:', error)
            const errorMessage = error.message?.includes('disabled')
                ? 'Support authentication is currently being configured. Please enable Anonymous Sign-ins in your Supabase Dashboard (Authentication -> Providers -> Anonymous).'
                : error.message || 'Unknown error'
            alert('Error connecting to support: ' + errorMessage)
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="flex-1 bg-gray-50 flex flex-col">

            <main className="flex-1 container mx-auto px-4 py-8 max-w-4xl">
                <div className="mb-8 text-center">
                    <h1 className="text-3xl font-bold text-kb-navy mb-2">Get Help Now</h1>
                    <p className="text-gray-600">Start with our AI assistant or speak with a live expert if needed.</p>
                </div>

                <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100 flex flex-col h-[700px]">
                    {/* Chat Area */}
                    <div className="h-full relative bg-gray-50/50">
                        <AnimatePresence mode="wait">
                            {mode === 'ai' && (
                                <motion.div
                                    key="ai"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="h-full relative"
                                >
                                    <ChatInterface
                                        initialMessages={messages}
                                        onSendMessage={handleAISend}
                                        isLoading={isAILoading}
                                        title="AI Tech Assistant"
                                        status="Gemini Flash"
                                    />

                                    {/* Escalation Overlay */}
                                    <div className="absolute bottom-24 left-0 right-0 px-4 flex justify-center pointer-events-none">
                                        <button
                                            onClick={() => setMode('human-form')}
                                            className="pointer-events-auto flex items-center gap-2 bg-white/90 backdrop-blur-sm border border-kb-navy/20 text-kb-navy px-4 py-2 rounded-full text-xs font-semibold shadow-xl hover:bg-kb-navy hover:text-white transition-all transform hover:-translate-y-1"
                                        >
                                            <Users size={14} />
                                            Still need help? Speak to a Human
                                            <ArrowRight size={14} />
                                        </button>
                                    </div>
                                </motion.div>
                            )}

                            {mode === 'human-form' && (
                                <motion.div
                                    key="form"
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className="p-8 flex flex-col items-center justify-center h-full max-w-md mx-auto"
                                >
                                    <div className="text-center mb-8">
                                        <div className="w-16 h-16 bg-kb-navy/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <Users className="text-kb-navy" size={32} />
                                        </div>
                                        <h2 className="text-2xl font-bold text-kb-navy">Talk to an Expert</h2>
                                        <p className="text-gray-500 text-sm mt-2">Briefly tell us what's happening and we'll connect you.</p>
                                    </div>

                                    <form onSubmit={handleHumanRequest} className="w-full space-y-4">
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Full Name</label>
                                            <input
                                                required
                                                type="text"
                                                value={formData.name}
                                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-kb-navy/20 outline-none text-black"
                                                placeholder="John Doe"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Device Type</label>
                                            <input
                                                required
                                                type="text"
                                                value={formData.device}
                                                onChange={e => setFormData({ ...formData, device: e.target.value })}
                                                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-kb-navy/20 outline-none text-black"
                                                placeholder="e.g. iPhone 15, Dell Laptop, etc."
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">What's the problem?</label>
                                            <textarea
                                                required
                                                value={formData.issue}
                                                onChange={e => setFormData({ ...formData, issue: e.target.value })}
                                                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-kb-navy/20 outline-none h-32 resize-none text-black"
                                                placeholder="Describe the issue briefly..."
                                            />
                                        </div>
                                        <button
                                            disabled={isSubmitting}
                                            type="submit"
                                            className="w-full bg-kb-navy text-white py-4 rounded-xl font-bold shadow-lg hover:shadow-xl hover:bg-kb-navy/90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                                        >
                                            {isSubmitting ? <Loader2 className="animate-spin" /> : "Request Live Chat"}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setMode('ai')}
                                            className="w-full text-gray-400 text-sm hover:text-kb-navy transition-colors mt-2"
                                        >
                                            Back to AI Assistant
                                        </button>
                                    </form>
                                </motion.div>
                            )}

                            {mode === 'human-session' && (
                                <motion.div
                                    key="session"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="p-8 flex flex-col items-center justify-center h-full text-center"
                                >
                                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                        <CheckCircle2 className="text-green-600" size={40} />
                                    </div>
                                    <h2 className="text-3xl font-bold text-kb-navy mb-4">Connecting...</h2>
                                    <p className="text-gray-600 mb-8 max-w-md mx-auto">
                                        We've notified our support team. You can join the secure chat room now using the button below.
                                    </p>

                                    <a
                                        href={`/chat/${sessionId}`}
                                        className="inline-flex items-center gap-3 bg-kb-navy text-white px-10 py-5 rounded-2xl font-bold shadow-xl hover:shadow-kb-navy/20 transition-all transform hover:-translate-y-1"
                                    >
                                        Enter Chat Room
                                        <ArrowRight size={20} />
                                    </a>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </main>

        </div>
    )
}
