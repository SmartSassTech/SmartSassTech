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
    Bot,
    Shield,
    Loader2,
    XCircle
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

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

function getStatusStyle(status: string) {
    switch (status) {
        case 'open': return 'bg-red-100 text-red-700 border-red-200'
        case 'replied': return 'bg-blue-100 text-blue-700 border-blue-200'
        case 'resolved': return 'bg-green-100 text-green-700 border-green-200'
        case 'closed': return 'bg-gray-100 text-gray-500 border-gray-200'
        default: return 'bg-gray-100 text-gray-600 border-gray-200'
    }
}

function getPriorityStyle(priority: string) {
    switch (priority) {
        case 'urgent': return 'bg-red-50 text-red-600 border-red-200'
        case 'high': return 'bg-orange-50 text-orange-600 border-orange-200'
        case 'medium': return 'bg-blue-50 text-blue-600 border-blue-200'
        case 'low': return 'bg-gray-50 text-gray-500 border-gray-200'
        default: return 'bg-gray-50 text-gray-500 border-gray-200'
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

function SLAIndicator({ dueDate, respondedAt, label }: { dueDate: string | null; respondedAt: string | null; label: string }) {
    if (!dueDate) return null

    const due = new Date(dueDate)
    const now = new Date()
    const isResponded = !!respondedAt
    const respondedTime = respondedAt ? new Date(respondedAt) : null
    const isBreached = isResponded ? (respondedTime! > due) : (now > due)
    const isNearBreach = !isBreached && !isResponded && (due.getTime() - now.getTime()) < 3600000

    return (
        <div className={`flex items-center gap-2 text-xs px-3 py-1.5 rounded-lg ${
            isResponded ? (isBreached ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600')
            : isBreached ? 'bg-red-50 text-red-600 animate-pulse'
            : isNearBreach ? 'bg-amber-50 text-amber-600'
            : 'bg-gray-50 text-gray-500'
        }`}>
            <Clock size={12} />
            <span className="font-medium">{label}:</span>
            {isResponded ? (
                <span>{isBreached ? 'Breached' : 'Met'}</span>
            ) : isBreached ? (
                <span>Overdue</span>
            ) : (
                <span>Due {formatDate(dueDate)}</span>
            )}
        </div>
    )
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
        if (!confirm('Are you sure you want to close this ticket?')) return
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
                    <h1 className="text-2xl font-bold text-kb-navy mb-2">Ticket Not Found</h1>
                    <p className="text-kb-muted mb-6">This ticket doesn&apos;t exist or you don&apos;t have access to it.</p>
                    <Link href="/support" className="text-sst-primary font-bold hover:underline">← Back to Support</Link>
                </div>
            </div>
        )
    }

    const isClosed = ticket.status === 'closed'

    return (
        <div className="bg-kb-bg min-h-screen py-16 md:py-24">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Back link */}
                <Link href="/support" className="inline-flex items-center gap-2 text-sst-primary font-bold mb-6 hover:underline">
                    <ArrowLeft size={16} /> Back to Support Center
                </Link>

                {/* Ticket Header */}
                <div className="bg-white rounded-[2rem] shadow-xl border border-kb-cream p-8 md:p-10 mb-6">
                    <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-6">
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 mb-2 flex-wrap">
                                <span className="text-xs font-mono text-kb-muted bg-gray-100 px-2 py-0.5 rounded">
                                    SST-{String(ticket.ticket_number).padStart(4, '0')}
                                </span>
                                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${getStatusStyle(ticket.status)}`}>
                                    {ticket.status}
                                </span>
                                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${getPriorityStyle(ticket.priority)}`}>
                                    {ticket.priority}
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
                                className="px-4 py-2 border-2 border-gray-200 text-gray-500 font-bold rounded-xl text-xs hover:border-red-200 hover:text-red-500 transition-all"
                            >
                                {closing ? 'Closing...' : 'Close Ticket'}
                            </button>
                        )}
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div className="bg-gray-50 rounded-xl p-3">
                            <p className="text-[10px] uppercase font-bold text-gray-400 mb-0.5">Category</p>
                            <p className="font-semibold text-kb-navy flex items-center gap-1.5">
                                <Tag size={13} /> {ticket.category}
                            </p>
                        </div>
                        <div className="bg-gray-50 rounded-xl p-3">
                            <p className="text-[10px] uppercase font-bold text-gray-400 mb-0.5">Created</p>
                            <p className="font-semibold text-kb-navy flex items-center gap-1.5">
                                <Clock size={13} /> {formatDate(ticket.created_at)}
                            </p>
                        </div>
                        <div className="bg-gray-50 rounded-xl p-3">
                            <p className="text-[10px] uppercase font-bold text-gray-400 mb-0.5">Agent</p>
                            <p className="font-semibold text-kb-navy flex items-center gap-1.5">
                                <Shield size={13} />
                                {ticket.agent
                                    ? `${ticket.agent.first_name || ''} ${ticket.agent.last_name || ''}`.trim() || ticket.agent.email
                                    : 'Unassigned'}
                            </p>
                        </div>
                        <div className="bg-gray-50 rounded-xl p-3">
                            <p className="text-[10px] uppercase font-bold text-gray-400 mb-0.5">Source</p>
                            <p className="font-semibold text-kb-navy capitalize">
                                {ticket.source.replace('_', ' ')}
                            </p>
                        </div>
                    </div>

                    {/* SLA indicators */}
                    <div className="flex flex-wrap gap-3 mt-4">
                        <SLAIndicator
                            dueDate={ticket.first_response_due}
                            respondedAt={ticket.first_responded_at}
                            label="First Response"
                        />
                        <SLAIndicator
                            dueDate={ticket.resolution_due}
                            respondedAt={ticket.resolved_at}
                            label="Resolution"
                        />
                    </div>
                </div>

                {/* Conversation */}
                <div className="bg-white rounded-[2rem] shadow-xl border border-kb-cream overflow-hidden">
                    <div className="p-6 border-b border-kb-cream bg-gray-50/50 flex items-center gap-2">
                        <MessageSquare size={18} className="text-kb-navy/50" />
                        <h2 className="font-bold text-kb-navy">Conversation</h2>
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
                                    <span className="text-[10px] text-kb-muted">{formatDate(ticket.created_at)}</span>
                                </div>
                                <div className="bg-gray-50 rounded-2xl rounded-tl-none p-4 text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
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
                                            <span className="font-bold text-sm text-kb-navy">{isAgent ? `Agent: ${authorName}` : 'You'}</span>
                                            <span className="text-[10px] text-kb-muted">{formatDate(comment.created_at)}</span>
                                        </div>
                                        <div className={`rounded-2xl rounded-tl-none p-4 text-sm leading-relaxed whitespace-pre-wrap ${
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
                                    className="flex-1 px-5 py-3 bg-white border border-gray-200 rounded-2xl focus:ring-2 focus:ring-sst-primary/20 focus:border-sst-primary transition-all text-sm resize-none"
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
                            <p className="text-sm text-gray-500 flex items-center justify-center gap-2">
                                <XCircle size={16} /> This ticket is closed. No further replies can be added.
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
