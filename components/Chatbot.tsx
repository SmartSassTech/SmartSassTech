'use client'

import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageCircle, X, Send, Bot, User } from 'lucide-react'
import { marked } from 'marked'
import sanitizeHtml from 'sanitize-html'

interface Message {
    role: 'user' | 'assistant'
    content: string
}

export default function Chatbot() {
    const [isOpen, setIsOpen] = useState(false)
    const [messages, setMessages] = useState<Message[]>([
        { role: 'assistant', content: 'Hi there! 👋 I\'m here to help you with any tech questions or issues you\'re having. What can I help you with today?' }
    ])
    const [input, setInput] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const messagesEndRef = useRef<HTMLDivElement>(null)

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }

    useEffect(() => {
        scrollToBottom()
    }, [messages])

    const handleSend = async () => {
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

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        className="mb-4 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-gray-100 flex flex-col overflow-hidden h-[500px]"
                    >
                        {/* Header */}
                        <div className="bg-kb-navy p-4 flex justify-between items-center text-white">
                            <div className="flex items-center gap-2">
                                <div className="bg-white/20 p-2 rounded-lg">
                                    <Bot size={20} />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-sm">Tech Assistant</h3>
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                                        <span className="text-[10px] text-white/80">Online</span>
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="hover:bg-white/10 p-1.5 rounded-lg transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4 bg-gray-50/50">
                            {messages.map((m, i) => (
                                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`flex gap-2 max-w-[85%] ${m.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${m.role === 'user' ? 'bg-kb-navy text-white' : 'bg-white text-kb-navy border border-gray-200'
                                            }`}>
                                            {m.role === 'user' ? <User size={16} /> : <Bot size={16} />}
                                        </div>
                                        <div className={`p-3 rounded-2xl text-sm ${m.role === 'user'
                                            ? 'bg-kb-navy text-white rounded-tr-none'
                                            : m.content.startsWith('Error:')
                                                ? 'bg-red-50 text-red-700 border border-red-100 shadow-sm rounded-tl-none'
                                                : 'bg-white text-gray-800 border border-gray-100 shadow-sm rounded-tl-none'
                                            }`}>
                                            {m.content.startsWith('Error:') ? (
                                                <div className="flex flex-col gap-2">
                                                    <div className="font-semibold">
                                                        {m.content.includes('429') || m.content.includes('quota') || m.content.includes('Daily limit')
                                                            ? 'AI service limit reached. This usually resets shortly or daily.'
                                                            : 'I encountered an issue processing your request.'}
                                                    </div>
                                                    <p className="text-[10px] opacity-80">
                                                        {m.content.includes('429') || m.content.includes('quota')
                                                            ? 'The free tier of Gemini has reached its current limit. Try again in a few minutes or tomorrow.'
                                                            : 'Please try rephrasing your question or check your connection.'}
                                                    </p>
                                                    <details className="text-[10px] cursor-pointer mt-1">
                                                        <summary className="hover:underline opacity-50">Technical diagnostic</summary>
                                                        <pre className="mt-2 p-2 bg-red-100/50 rounded overflow-x-auto whitespace-pre-wrap font-mono text-[9px]">
                                                            {m.content.replace('Error: ', '')}
                                                        </pre>
                                                    </details>
                                                </div>
                                            ) : (
                                                <div
                                                    className="max-w-none text-sm leading-relaxed whitespace-normal break-words [&_p]:mb-3 last:[&_p]:mb-0 [&_b]:font-bold [&_strong]:font-bold [&_ul]:list-disc [&_ul]:pl-4 [&_ul]:mb-3 [&_ol]:list-decimal [&_ol]:pl-4 [&_ol]:mb-3 [&_li]:mb-1 [&_a]:text-kb-navy [&_a]:underline [&_a]:font-medium hover:[&_a]:text-kb-navy/80"
                                                    dangerouslySetInnerHTML={{
                                                        __html: sanitizeHtml(marked.parse(m.content) as string, {
                                                            allowedTags: ['p', 'b', 'i', 'strong', 'em', 'ul', 'ol', 'li', 'br', 'h1', 'h2', 'h3', 'code', 'a'],
                                                            allowedAttributes: {
                                                                'a': ['href', 'target', 'rel']
                                                            },
                                                            transformTags: {
                                                                'a': (tagName, attribs) => ({
                                                                    tagName: 'a',
                                                                    attribs: {
                                                                        ...attribs,
                                                                        target: '_blank',
                                                                        rel: 'noopener noreferrer'
                                                                    }
                                                                })
                                                            }
                                                        })
                                                    }}
                                                />
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {isLoading && (
                                <div className="flex justify-start">
                                    <div className="flex gap-2 max-w-[85%]">
                                        <div className="w-8 h-8 rounded-full bg-white text-kb-navy border border-gray-200 flex items-center justify-center">
                                            <Bot size={16} />
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

                        {/* Input */}
                        <div className="p-4 bg-white border-t border-gray-100">
                            <div className="relative flex items-center">
                                <input
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                                    placeholder="Ask a technical question..."
                                    className="w-full pl-4 pr-12 py-3 bg-gray-100 border-none rounded-xl text-sm focus:ring-2 focus:ring-kb-navy/20 transition-all outline-none"
                                />
                                <button
                                    onClick={handleSend}
                                    disabled={!input.trim() || isLoading}
                                    className="absolute right-1.5 p-2 bg-kb-navy text-white rounded-lg hover:bg-kb-navy/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                >
                                    <Send size={18} />
                                </button>
                            </div>
                            <div className="mt-3 flex flex-col items-center gap-2">
                                <a
                                    href="/chat"
                                    className="text-[10px] text-kb-navy font-bold hover:underline py-1 px-3 bg-kb-navy/5 rounded-full border border-kb-navy/10"
                                >
                                    Speak with a Human Expert instead
                                </a>
                                <p className="text-[10px] text-center text-gray-400">
                                    Powered by Gemini AI • Always verify critical info
                                </p>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsOpen(!isOpen)}
                className="bg-kb-navy text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
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
