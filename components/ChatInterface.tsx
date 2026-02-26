'use client'

import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Bot, User, AlertCircle, ShieldCheck } from 'lucide-react'
import { marked } from 'marked'
import sanitizeHtml from 'sanitize-html'

export interface Message {
    role: 'user' | 'assistant' | 'system'
    content: string
}

interface ChatInterfaceProps {
    initialMessages?: Message[]
    onSendMessage: (content: string) => Promise<void>
    isLoading?: boolean
    placeholder?: string
    title?: string
    status?: string
    isAdminView?: boolean
}

export default function ChatInterface({
    initialMessages = [],
    onSendMessage,
    isLoading = false,
    placeholder = "Type your message...",
    title = "Chat Support",
    status = "Online",
    isAdminView = false
}: ChatInterfaceProps) {
    const [messages, setMessages] = useState<Message[]>(initialMessages)
    const [input, setInput] = useState('')
    const messagesEndRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        setMessages(initialMessages)
    }, [initialMessages])

    const scrollToBottom = () => {
        if (messagesEndRef.current) {
            const container = messagesEndRef.current.parentElement;
            if (container) {
                container.scrollTo({
                    top: container.scrollHeight,
                    behavior: 'smooth'
                });
            }
        }
    }

    useEffect(() => {
        scrollToBottom()
    }, [messages])

    const handleSend = async () => {
        if (!input.trim() || isLoading) return
        const currentInput = input
        setInput('')
        await onSendMessage(currentInput)
    }

    return (
        <div className="flex flex-col h-full bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
            {/* Header */}
            <div className={`${isAdminView ? 'bg-kb-dark' : 'bg-kb-navy'} p-4 flex justify-between items-center text-white transition-colors`}>
                <div className="flex items-center gap-3">
                    <div className="bg-white/20 p-2 rounded-lg">
                        {isAdminView ? <ShieldCheck size={20} /> : <Bot size={20} />}
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-sm m-0">{title}</h3>
                            {isAdminView && <span className="bg-amber-400 text-kb-navy text-[8px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider">Agent Mode</span>}
                        </div>
                        <div className="flex items-center gap-1.5">
                            <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                            <span className="text-[10px] text-white/80">{status}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4 bg-gray-50/50">
                {messages.map((m, i) => {
                    // Logic for bubble positioning:
                    // If Admin View: Agent messages (assistant) on right, Client (user) on left
                    // If Client View: User messages on right, Agent (assistant) on left
                    const isSelf = isAdminView ? m.role === 'assistant' : m.role === 'user'

                    if (m.role === 'system') {
                        return (
                            <div key={i} className="flex justify-center my-2">
                                <div className="bg-amber-50 text-amber-800 border border-amber-100 px-4 py-1.5 rounded-full text-[10px] font-medium italic">
                                    {m.content}
                                </div>
                            </div>
                        )
                    }

                    return (
                        <div key={i} className={`flex ${isSelf ? 'justify-end' : 'justify-start'}`}>
                            <div className={`flex gap-2 max-w-[85%] ${isSelf ? 'flex-row-reverse' : 'flex-row'}`}>
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${isSelf ? 'bg-kb-navy text-white' : 'bg-white text-kb-navy border border-gray-200'
                                    }`}>
                                    {m.role === 'user' ? <User size={16} /> : <Bot size={16} />}
                                </div>
                                <div className={`p-3 rounded-2xl text-sm ${isSelf
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
                                    ) : m.role === 'assistant' && !isSelf ? (
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
                                    ) : (
                                        m.content
                                    )}
                                </div>
                            </div>
                        </div>
                    )
                })}
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
            <div className="p-4 bg-white border-t border-gray-100 text-black">
                <div className="relative flex items-center">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                        placeholder={placeholder}
                        className="w-full pl-4 pr-12 py-3 bg-gray-100 border-none rounded-xl text-sm focus:ring-2 focus:ring-kb-navy/20 transition-all outline-none"
                    />
                    <button
                        onClick={handleSend}
                        disabled={!input.trim() || isLoading}
                        className={`absolute right-1.5 p-2 ${isAdminView ? 'bg-kb-dark' : 'bg-kb-navy'} text-white rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all`}
                    >
                        <Send size={18} />
                    </button>
                </div>
            </div>
        </div>
    )
}
