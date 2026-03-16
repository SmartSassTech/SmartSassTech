'use client'

import React, { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
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
    XCircle,
    Eye,
    EyeOff,
    ChevronDown,
    Mail,
    Phone,
    Smartphone,
    CalendarDays,
    StickyNote,
    RefreshCw
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
    assigned_agent_id: string | null
    first_response_due: string | null
    resolution_due: string | null
    first_responded_at: string | null
    resolved_at: string | null
    created_at: string
    updated_at: string
    profiles: {
        first_name: string | null
        last_name: string | null
        email: string
        phone: string | null
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
        profile_type: string | null
    } | null
}

function getStatusStyle(status: string) {
    switch (status) {
        case 'open': return 'bg-red-100 text-red-700'
        case 'replied': return 'bg-blue-100 text-blue-700'
        case 'resolved': return 'bg-green-100 text-green-700'
        case 'closed': return 'bg-gray-100 text-gray-500'
        default: return 'bg-gray-100 text-gray-600'
    }
}

function getPriorityStyle(priority: string) {
    switch (priority) {
        case 'urgent': return 'bg-red-100 text-red-600'
        case 'high': return 'bg-orange-100 text-orange-600'
        case 'medium': return 'bg-blue-100 text-blue-600'
        case 'low': return 'bg-gray-100 text-gray-500'
        default: return 'bg-gray-100 text-gray-500'
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

function SLARow({ label, dueDate, respondedAt }: { label: string; dueDate: string | null; respondedAt: string | null }) {
    if (!dueDate) return null

    const due = new Date(dueDate)
    const now = new Date()
    const isResponded = !!respondedAt
    const respondedTime = respondedAt ? new Date(respondedAt) : null
    const isBreached = isResponded ? (respondedTime! > due) : (now > due)

    return (
        <div className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
            <span className="text-xs text-gray-500">{label}</span>
            <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                isResponded ? (isBreached ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600')
                : isBreached ? 'bg-red-50 text-red-600' : 'bg-gray-50 text-gray-500'
            }`}>
                {isResponded ? (isBreached ? 'Breached' : 'Met ✓') : isBreached ? 'Overdue ⚠' : formatDate(dueDate)}
            </span>
        </div>
    )
}

export default function AdminTicketDetail() {
    const { ticketId } = useParams() as { ticketId: string }
    const [ticket, setTicket] = useState<Ticket | null>(null)
    const [comments, setComments] = useState<Comment[]>([])
    const [loading, setLoading] = useState(true)
    const [replyContent, setReplyContent] = useState('')
    const [isInternal, setIsInternal] = useState(false)
    const [sending, setSending] = useState(false)
    const [currentAgent, setCurrentAgent] = useState<any>(null)
    const commentsEndRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        loadAgent()
        fetchAll()
    }, [ticketId])

    useEffect(() => {
        commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [comments])

    const loadAgent = async () => {
        const { data: { user } } = await supabase.auth.getUser()
        setCurrentAgent(user)
    }

    const getToken = async () => {
        const { data: { session } } = await supabase.auth.getSession()
        return session?.access_token || ''
    }

    const fetchAll = async () => {
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
                body: JSON.stringify({ content: replyContent, is_internal: isInternal }),
            })

            if (res.ok) {
                setReplyContent('')
                fetchAll()
            }
        } catch (err) {
            console.error('Error posting reply:', err)
        } finally {
            setSending(false)
        }
    }

    const handleUpdateField = async (updates: Record<string, any>) => {
        try {
            const token = await getToken()
            await fetch(`/api/tickets/${ticketId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(updates),
            })
            fetchAll()
        } catch (err) {
            console.error('Error updating ticket:', err)
        }
    }

    const handleClaim = () => {
        if (currentAgent) handleUpdateField({ assigned_agent_id: currentAgent.id })
    }

    const customerName = () => {
        if (!ticket?.profiles) return 'Unknown'
        return `${ticket.profiles.first_name || ''} ${ticket.profiles.last_name || ''}`.trim() || ticket.profiles.email
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-kb-navy border-t-transparent rounded-full animate-spin" />
            </div>
        )
    }

    if (!ticket) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <AlertCircle size={48} className="text-red-400 mx-auto mb-4" />
                    <h1 className="text-2xl font-bold text-kb-navy mb-2">Ticket Not Found</h1>
                    <Link href="/admin/support" className="text-sst-primary font-bold hover:underline">← Back to Dashboard</Link>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-kb-navy text-white p-4 shadow-lg">
                <div className="container mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/admin/support" className="text-white/60 hover:text-white transition-colors">
                            <ArrowLeft size={20} />
                        </Link>
                        <div>
                            <div className="flex items-center gap-2 mb-0.5">
                                <span className="text-xs font-mono text-white/50">
                                    SST-{String(ticket.ticket_number).padStart(4, '0')}
                                </span>
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${getStatusStyle(ticket.status)}`}>
                                    {ticket.status}
                                </span>
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${getPriorityStyle(ticket.priority)}`}>
                                    {ticket.priority}
                                </span>
                            </div>
                            <h1 className="text-lg font-bold leading-tight">{ticket.subject}</h1>
                        </div>
                    </div>
                    <button
                        onClick={fetchAll}
                        className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                        title="Refresh"
                    >
                        <RefreshCw size={16} />
                    </button>
                </div>
            </header>

            <main className="container mx-auto px-4 py-6">
                <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
                    {/* Left: Conversation */}
                    <div className="space-y-6">
                        {/* Conversation thread */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex items-center gap-2">
                                <MessageSquare size={16} className="text-gray-400" />
                                <h2 className="font-bold text-sm text-kb-navy">Conversation</h2>
                                <span className="text-[10px] text-gray-400 ml-auto">{comments.length + 1} message{comments.length !== 0 ? 's' : ''}</span>
                            </div>

                            <div className="p-5 space-y-4 max-h-[600px] overflow-y-auto">
                                {/* Original description */}
                                <div className="flex gap-3">
                                    <div className="w-8 h-8 rounded-full bg-kb-navy/10 flex items-center justify-center shrink-0">
                                        <User size={14} className="text-kb-navy" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="font-bold text-xs text-kb-navy">{customerName()}</span>
                                            <span className="text-[10px] text-gray-400">{formatDate(ticket.created_at)}</span>
                                            <span className="px-1.5 py-0.5 bg-gray-100 text-gray-400 text-[9px] rounded font-bold">ORIGINAL</span>
                                        </div>
                                        <div className="bg-gray-50 rounded-xl rounded-tl-none p-4 text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                                            {ticket.description}
                                        </div>
                                    </div>
                                </div>

                                {/* Comments */}
                                {comments.map(comment => {
                                    const isAgent = comment.author?.profile_type === 'Agent'
                                    const authorName = comment.author
                                        ? `${comment.author.first_name || ''} ${comment.author.last_name || ''}`.trim() || comment.author.email
                                        : 'Unknown'

                                    return (
                                        <motion.div
                                            key={comment.id}
                                            initial={{ opacity: 0, y: 8 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className={`flex gap-3 ${comment.is_internal ? '' : ''}`}
                                        >
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                                                comment.is_internal ? 'bg-amber-100 text-amber-600' :
                                                isAgent ? 'bg-sst-primary text-white' : 'bg-kb-navy/10 text-kb-navy'
                                            }`}>
                                                {comment.is_internal ? <StickyNote size={14} /> : isAgent ? <Shield size={14} /> : <User size={14} />}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="font-bold text-xs text-kb-navy">{authorName}</span>
                                                    <span className="text-[10px] text-gray-400">{formatDate(comment.created_at)}</span>
                                                    {comment.is_internal && (
                                                        <span className="px-1.5 py-0.5 bg-amber-100 text-amber-600 text-[9px] rounded font-bold flex items-center gap-0.5">
                                                            <EyeOff size={8} /> INTERNAL NOTE
                                                        </span>
                                                    )}
                                                </div>
                                                <div className={`rounded-xl rounded-tl-none p-4 text-sm leading-relaxed whitespace-pre-wrap ${
                                                    comment.is_internal
                                                        ? 'bg-amber-50 text-amber-900 border border-amber-200 border-dashed'
                                                        : isAgent
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
                            <div className="p-5 border-t border-gray-100 bg-gray-50/30">
                                <div className="flex items-center gap-3 mb-3">
                                    <button
                                        onClick={() => setIsInternal(false)}
                                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                            !isInternal
                                                ? 'bg-sst-primary text-white shadow-sm'
                                                : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                                        }`}
                                    >
                                        <Eye size={12} /> Reply to Customer
                                    </button>
                                    <button
                                        onClick={() => setIsInternal(true)}
                                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                            isInternal
                                                ? 'bg-amber-500 text-white shadow-sm'
                                                : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                                        }`}
                                    >
                                        <EyeOff size={12} /> Internal Note
                                    </button>
                                </div>

                                <div className="flex gap-3">
                                    <textarea
                                        value={replyContent}
                                        onChange={e => setReplyContent(e.target.value)}
                                        onKeyDown={e => {
                                            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                                                e.preventDefault()
                                                handleReply()
                                            }
                                        }}
                                        placeholder={isInternal ? 'Add an internal note (not visible to customer)...' : 'Type your reply to the customer...'}
                                        rows={3}
                                        className={`flex-1 px-4 py-3 border rounded-xl text-sm resize-none focus:ring-2 transition-all ${
                                            isInternal
                                                ? 'bg-amber-50/50 border-amber-200 focus:ring-amber-200/50 focus:border-amber-300'
                                                : 'bg-white border-gray-200 focus:ring-sst-primary/20 focus:border-sst-primary'
                                        }`}
                                    />
                                    <button
                                        onClick={handleReply}
                                        disabled={!replyContent.trim() || sending}
                                        className={`px-5 py-3 font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed self-end flex items-center gap-2 text-sm ${
                                            isInternal
                                                ? 'bg-amber-500 text-white hover:bg-amber-600'
                                                : 'bg-sst-primary text-white hover:bg-sst-secondary'
                                        }`}
                                    >
                                        {sending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                                        {isInternal ? 'Add Note' : 'Send'}
                                    </button>
                                </div>
                                <p className="text-[10px] text-gray-300 mt-2">⌘ + Enter to send</p>
                            </div>
                        </div>
                    </div>

                    {/* Right: Sidebar */}
                    <div className="space-y-4">
                        {/* Customer Info */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                            <h3 className="text-xs font-bold text-gray-400 uppercase mb-3">Customer</h3>
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-10 h-10 rounded-full bg-kb-navy/10 flex items-center justify-center text-kb-navy">
                                    <User size={18} />
                                </div>
                                <div>
                                    <p className="font-bold text-sm text-kb-navy">{customerName()}</p>
                                    <p className="text-[10px] text-gray-400">{ticket.profiles?.email}</p>
                                </div>
                            </div>
                            {ticket.profiles?.phone && (
                                <div className="flex items-center gap-2 text-xs text-gray-500 mt-2">
                                    <Phone size={12} /> {ticket.profiles.phone}
                                </div>
                            )}
                        </div>

                        {/* Ticket Actions */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                            <h3 className="text-xs font-bold text-gray-400 uppercase mb-3">Actions</h3>
                            <div className="space-y-3">
                                <div>
                                    <label className="text-[10px] font-bold text-gray-400 uppercase">Status</label>
                                    <select
                                        value={ticket.status}
                                        onChange={e => handleUpdateField({ status: e.target.value })}
                                        className="w-full mt-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-semibold focus:ring-1 focus:ring-sst-primary/20"
                                    >
                                        <option value="open">Open</option>
                                        <option value="replied">Replied</option>
                                        <option value="resolved">Resolved</option>
                                        <option value="closed">Closed</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="text-[10px] font-bold text-gray-400 uppercase">Priority</label>
                                    <select
                                        value={ticket.priority}
                                        onChange={e => handleUpdateField({ priority: e.target.value })}
                                        className="w-full mt-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-semibold focus:ring-1 focus:ring-sst-primary/20"
                                    >
                                        <option value="low">Low</option>
                                        <option value="medium">Medium</option>
                                        <option value="high">High</option>
                                        <option value="urgent">Urgent</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="text-[10px] font-bold text-gray-400 uppercase">Category</label>
                                    <select
                                        value={ticket.category}
                                        onChange={e => handleUpdateField({ category: e.target.value })}
                                        className="w-full mt-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-semibold focus:ring-1 focus:ring-sst-primary/20"
                                    >
                                        <option value="General">General</option>
                                        <option value="Device Repair">Device Repair</option>
                                        <option value="Software">Software</option>
                                        <option value="Network">Network</option>
                                        <option value="Account">Account</option>
                                        <option value="Billing">Billing</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="text-[10px] font-bold text-gray-400 uppercase">Assigned Agent</label>
                                    {ticket.agent ? (
                                        <div className="mt-1 flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg">
                                            <Shield size={12} className="text-sst-primary" />
                                            <span className="text-xs font-medium text-kb-navy">
                                                {`${ticket.agent.first_name || ''} ${ticket.agent.last_name || ''}`.trim() || ticket.agent.email}
                                            </span>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={handleClaim}
                                            className="w-full mt-1 px-3 py-2 bg-sst-primary text-white text-xs font-bold rounded-lg hover:bg-sst-secondary transition-all"
                                        >
                                            Assign to Me
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* SLA Tracking */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                            <h3 className="text-xs font-bold text-gray-400 uppercase mb-3">SLA Tracking</h3>
                            <SLARow label="First Response" dueDate={ticket.first_response_due} respondedAt={ticket.first_responded_at} />
                            <SLARow label="Resolution" dueDate={ticket.resolution_due} respondedAt={ticket.resolved_at} />
                        </div>

                        {/* Ticket Meta */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                            <h3 className="text-xs font-bold text-gray-400 uppercase mb-3">Details</h3>
                            <div className="space-y-2 text-xs">
                                <div className="flex justify-between text-gray-500">
                                    <span>Source</span>
                                    <span className="font-medium text-gray-700 capitalize">{ticket.source.replace('_', ' ')}</span>
                                </div>
                                <div className="flex justify-between text-gray-500">
                                    <span>Created</span>
                                    <span className="font-medium text-gray-700">{formatDate(ticket.created_at)}</span>
                                </div>
                                <div className="flex justify-between text-gray-500">
                                    <span>Updated</span>
                                    <span className="font-medium text-gray-700">{formatDate(ticket.updated_at)}</span>
                                </div>
                                {ticket.resolved_at && (
                                    <div className="flex justify-between text-gray-500">
                                        <span>Resolved</span>
                                        <span className="font-medium text-green-600">{formatDate(ticket.resolved_at)}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}
