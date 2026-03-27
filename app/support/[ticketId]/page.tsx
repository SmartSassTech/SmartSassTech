'use client'

import React, { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import withAuth from '@/components/withAuth'
import { supabase } from '@/lib/supabase'
import {
    ArrowLeft,
    Clock,
    Send,
    Tag,
    AlertCircle,
    CheckCircle2,
    MessageSquare,
    User,
    Shield,
    Loader2,
    XCircle
} from 'lucide-react'
import { motion } from 'framer-motion'

interface Ticket {
    id: string
    ticket_number: number
    subject: string
    description: string
    status: string
    priority: string
    category: string
    source: string
    created_at: string
    updated_at: string
    first_response_due: string | null
    resolution_due: string | null
    first_responded_at: string | null
    resolved_at: string | null
    profiles: {
        first_name: string | null
        last_name: string | null
        email: string
    } | null
    agent: {
        first_name: string | null
        last_name: string | null
        email: string
    } | null
}

interface Comment {
    id: string
    content: string
    is_internal: boolean
    created_at: string
    author: {
        first_name: string | null
        last_name: string | null
        email: string
        role: string | null
    } | null
}

function friendlyStatus(status: string): { text: string; style: string } {
    switch (status) {
        case 'open':     return { text: "We're looking into it",      style: 'bg-amber-100 text-amber-700 border-amber-200' }
        case 'replied':  return { text: 'We responded — check below!', style: 'bg-blue-100 text-blue-700 border-blue-200' }
        case 'resolved': return { text: 'All done! ✓',                 style: 'bg-green-100 text-green-700 border-green-200' }
        case 'closed':   return { text: 'Closed',                      style: 'bg-gray-100 text-gray-500 border-gray-200' }
        default:         return { text: status,                         style: 'bg-gray-100 text-gray-600 border-gray-200' }
    }
}

function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
    })
}

function TicketDetailContent() {
    const { ticketId } = useParams() as { ticketId: string }
    const [ticket, setTicket] = useState<Ticket | null>(null)
    const [comments, setComments] = useState<Comment[]>([])
    const [loading, setLoading] = useState(true)
    const [replyContent, setReplyContent] = useState('')
    const [sending, setSending] = useState(false)
    const [closing, setClosing] = useState(false)
    const commentsEndRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        fetchTicketAndComments()
    }, [ticketId])

    useEffect(() => {
        commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [comments])

    const getToken = async () => {
        const { data: { session } } = await supabase.auth.getSession()
        return session?.access_token || ''
    }

    const fetchTicketAndComments = async () => {
        setLoading(true)
        try {
            const token = await getToken()
            const headers = { 'Authorization': `Bearer ${token}` }

            const [ticketRes, commentsRes] = await Promise.all([
                fetch(`/api/tickets/${ticketId}`, { headers }),
                fetch(`/api/tickets/${ticketId}/comments`, { headers }),
            ])

            if (ticketRes.ok) {
                const data = await ticketRes.json()
                setTicket(data.ticket)
            }
            if (commentsRes.ok) {
                const data = await commentsRes.json()
                setComments(data.comments || [])
            }
        } catch (err) {
            console.error('Error loading ticket:', err)
        } finally {
            setLoading(false)
        }
    }

    const handleReply = async () => {
        if (!replyContent.trim() || sending) return
        setSending(true)

        try {
            const token = await getToken()
            const res = await fetch(`/api/tickets/${ticketId}/comments`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ content: replyContent }),
            })

            if (res.ok) {
                setReplyContent('')
                fetchTicketAndComments()
            }
        } catch (err) {
            console.error('Error posting reply:', err)
        } finally {
            setSending(false)
        }
    }

    const handleCloseTicket = async () => {
        if (!confirm('Are you sure you want to mark this as resolved?')) return
        setClosing(true)

        try {
            const token = await getToken()
            await fetch(`/api/tickets/${ticketId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ status: 'closed' }),
            })
            fetchTicketAndComments()
        } catch (err) {
            console.error('Error closing ticket:', err)
        } finally {
            setClosing(false)
        }
    }

    if (loading) {
        return (
            <div className="bg-kb-bg min-h-screen flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-sst-primary border-t-transparent rounded-full animate-spin" />
            </div>
        )
    }

    if (!ticket) {
        return (
            <div className="bg-kb-bg min-h-screen py-16 md:py-24">
                <div className="max-w-3xl mx-auto px-4 text-center">
                    <AlertCircle size={48} className="text-red-400 mx-auto mb-4" />
                    <h1 className="text-2xl font-bold text-kb-navy mb-2">Request Not Found</h1>
                    <p className="text-kb-muted mb-6 text-lg">This request doesn&apos;t exist or you don&apos;t have access to it.</p>
                    <Link href="/support" className="text-sst-primary font-bold hover:underline text-lg">← Back to Help Center</Link>
                </div>
            </div>
        )
    }

    const isClosed = ticket.status === 'closed'
    const status = friendlyStatus(ticket.status)
    const agentName = ticket.agent
        ? `${ticket.agent.first_name || ''} ${ticket.agent.last_name || ''}`.trim() || ticket.agent.email
        : 'Not yet assigned'

    return (
        <div className="bg-kb-bg min-h-screen py-16 md:py-24">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Back link */}
                <Link href="/support" className="inline-flex items-center gap-2 text-sst-primary font-bold mb-6 hover:underline text-base">
                    <ArrowLeft size={16} /> Back to Help Center
                </Link>

                {/* Ticket Header — simplified */}
                <div className="bg-white rounded-3xl shadow-xl border border-kb-cream p-8 md:p-10 mb-6">
                    <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-6">
                        <div className="flex-1 min-w-0">
                            <div className="mb-3">
                                <span className={`inline-block px-3 py-1 rounded-full text-sm font-bold border ${status.style}`}>
                                    {status.text}
                                </span>
                            </div>
                            <h1 className="text-xl md:text-2xl font-bold text-kb-navy leading-tight">
                                {ticket.subject}
                            </h1>
                        </div>

                        {!isClosed && ticket.status !== 'resolved' && (
                            <button
                                onClick={handleCloseTicket}
                                disabled={closing}
                                className="px-5 py-2.5 border-2 border-gray-200 text-gray-500 font-bold rounded-xl text-sm hover:border-green-300 hover:text-green-600 transition-all flex items-center gap-2"
                            >
                                <CheckCircle2 size={16} />
                                {closing ? 'Resolving...' : 'Mark as Resolved'}
                            </button>
                        )}
                    </div>

                    {/* Simplified info grid — 3 items */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="bg-gray-50 rounded-xl p-4">
                            <p className="text-xs uppercase font-bold text-gray-400 mb-1">Category</p>
                            <p className="font-semibold text-kb-navy flex items-center gap-1.5 text-base">
                                <Tag size={14} /> {ticket.category}
                            </p>
                        </div>
                        <div className="bg-gray-50 rounded-xl p-4">
                            <p className="text-xs uppercase font-bold text-gray-400 mb-1">Submitted</p>
                            <p className="font-semibold text-kb-navy flex items-center gap-1.5 text-base">
                                <Clock size={14} /> {formatDate(ticket.created_at)}
                            </p>
                        </div>
                        <div className="bg-gray-50 rounded-xl p-4">
                            <p className="text-xs uppercase font-bold text-gray-400 mb-1">Your Helper</p>
                            <p className="font-semibold text-kb-navy flex items-center gap-1.5 text-base">
                                <Shield size={14} /> {agentName}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Conversation */}
                <div className="bg-white rounded-3xl shadow-xl border border-kb-cream overflow-hidden">
                    <div className="p-6 border-b border-kb-cream bg-gray-50/50 flex items-center gap-2">
                        <MessageSquare size={18} className="text-kb-navy/50" />
                        <h2 className="font-bold text-kb-navy text-lg">Conversation</h2>
                    </div>

                    <div className="p-6 md:p-8 space-y-4 max-h-[600px] overflow-y-auto">
                        {/* Original description */}
                        <div className="flex gap-3">
                            <div className="w-9 h-9 rounded-full bg-kb-navy/10 flex items-center justify-center shrink-0">
                                <User size={16} className="text-kb-navy" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="font-bold text-sm text-kb-navy">You</span>
                                    <span className="text-xs text-kb-muted">{formatDate(ticket.created_at)}</span>
                                </div>
                                <div className="bg-gray-50 rounded-2xl rounded-tl-none p-4 text-base text-gray-700 leading-relaxed whitespace-pre-wrap">
                                    {ticket.description}
                                </div>
                            </div>
                        </div>

                        {/* Comments */}
                        {comments.map(comment => {
                            const isAgent = comment.author?.role === 'agent' || comment.author?.role === 'admin'
                            const authorName = comment.author
                                ? `${comment.author.first_name || ''} ${comment.author.last_name || ''}`.trim() || comment.author.email
                                : 'Unknown'

                            return (
                                <motion.div
                                    key={comment.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="flex gap-3"
                                >
                                    <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                                        isAgent ? 'bg-sst-primary text-white' : 'bg-kb-navy/10 text-kb-navy'
                                    }`}>
                                        {isAgent ? <Shield size={16} /> : <User size={16} />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="font-bold text-sm text-kb-navy">{isAgent ? authorName : 'You'}</span>
                                            <span className="text-xs text-kb-muted">{formatDate(comment.created_at)}</span>
                                        </div>
                                        <div className={`rounded-2xl rounded-tl-none p-4 text-base leading-relaxed whitespace-pre-wrap ${
                                            isAgent
                                                ? 'bg-sst-primary/5 text-gray-700 border border-sst-primary/10'
                                                : 'bg-gray-50 text-gray-700'
                                        }`}>
                                            {comment.content}
                                        </div>
                                    </div>
                                </motion.div>
                            )
                        })}

                        <div ref={commentsEndRef} />
                    </div>

                    {/* Reply box */}
                    {!isClosed && (
                        <div className="p-6 border-t border-kb-cream bg-gray-50/30">
                            <div className="flex gap-3">
                                <textarea
                                    value={replyContent}
                                    onChange={e => setReplyContent(e.target.value)}
                                    onKeyDown={e => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault()
                                            handleReply()
                                        }
                                    }}
                                    placeholder="Type your reply..."
                                    rows={2}
                                    className="flex-1 px-5 py-3 bg-white border border-gray-200 rounded-2xl focus:ring-2 focus:ring-sst-primary/20 focus:border-sst-primary transition-all text-base resize-none"
                                />
                                <button
                                    onClick={handleReply}
                                    disabled={!replyContent.trim() || sending}
                                    className="px-5 py-3 bg-sst-primary text-white font-bold rounded-xl hover:bg-sst-secondary transition-all disabled:opacity-50 disabled:cursor-not-allowed self-end flex items-center gap-2"
                                >
                                    {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                                    Reply
                                </button>
                            </div>
                        </div>
                    )}

                    {isClosed && (
                        <div className="p-6 border-t border-kb-cream bg-gray-50/50 text-center">
                            <p className="text-base text-gray-500 flex items-center justify-center gap-2">
                                <CheckCircle2 size={16} /> This request has been resolved. Need more help? Submit a new request from the Help Center.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

function TicketDetailPage() {
    return <TicketDetailContent />
}

export default withAuth(TicketDetailPage)
