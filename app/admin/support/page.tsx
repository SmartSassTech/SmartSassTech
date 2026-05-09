'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import withAuth from '@/components/withAuth'
import {
    LifeBuoy,
    AlertCircle,
    Clock,
    CheckCircle2,
    ArrowRight,
    User,
    MessageSquare,
    Filter,
    Inbox,
    Tag,
    Shield,
    TrendingUp,
    BarChart3,
    Users,
    Search,
    ChevronDown,
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
    first_responded_at: string | null
    resolution_due: string | null
    resolved_at: string | null
    created_at: string
    updated_at: string
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

type ViewTab = 'all' | 'mine' | 'unassigned'

function getStatusStyle(status: string) {
    switch (status) {
        case 'open': return 'bg-red-100 text-red-700 border-red-200'
        case 'replied': return 'bg-blue-100 text-blue-700 border-blue-200'
        case 'resolved': return 'bg-green-100 text-green-700 border-green-200'
        case 'closed': return 'bg-gray-100 text-gray-500 border-gray-200'
        default: return 'bg-gray-100 text-gray-600 border-gray-200'
    }
}

function getPriorityDot(priority: string) {
    switch (priority) {
        case 'urgent': return 'bg-red-500'
        case 'high': return 'bg-orange-500'
        case 'medium': return 'bg-blue-400'
        case 'low': return 'bg-gray-300'
        default: return 'bg-gray-300'
    }
}

function getPriorityBadge(priority: string) {
    switch (priority) {
        case 'urgent': return 'bg-red-50 text-red-600 border-red-200'
        case 'high': return 'bg-orange-50 text-orange-600 border-orange-200'
        case 'medium': return 'bg-blue-50 text-blue-600 border-blue-200'
        case 'low': return 'bg-gray-50 text-gray-500 border-gray-200'
        default: return 'bg-gray-50 text-gray-500 border-gray-200'
    }
}

function timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime()
    const minutes = Math.floor(diff / 60000)
    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h ago`
    const days = Math.floor(hours / 24)
    if (days < 7) return `${days}d ago`
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function SLABadge({ dueDate, respondedAt }: { dueDate: string | null; respondedAt: string | null }) {
    if (!dueDate) return null

    const due = new Date(dueDate)
    const now = new Date()
    const isResponded = !!respondedAt
    const respondedTime = respondedAt ? new Date(respondedAt) : null
    const isBreached = isResponded ? (respondedTime! > due) : (now > due)
    const isNearBreach = !isBreached && !isResponded && (due.getTime() - now.getTime()) < 3600000

    if (isResponded && !isBreached) return null // SLA met, no badge needed

    return (
        <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
            isBreached ? 'bg-red-100 text-red-600 animate-pulse' :
            isNearBreach ? 'bg-amber-100 text-amber-600' : ''
        }`}>
            {isBreached ? '⚠ SLA BREACH' : isNearBreach ? '⏰ SLA AT RISK' : ''}
        </span>
    )
}

function AdminSupportDashboard() {
    const [tickets, setTickets] = useState<Ticket[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [currentAgent, setCurrentAgent] = useState<any>(null)
    const [viewTab, setViewTab] = useState<ViewTab>('all')
    const [searchQuery, setSearchQuery] = useState('')
    const [statusFilter, setStatusFilter] = useState('')
    const [priorityFilter, setPriorityFilter] = useState('')
    const [categoryFilter, setCategoryFilter] = useState('')
    const [refreshing, setRefreshing] = useState(false)

    // Also keep chat sessions for live chat queue
    const [chatSessions, setChatSessions] = useState<any[]>([])

    useEffect(() => {
        init()
    }, [])

    const init = async () => {
        const { data: { user } } = await supabase.auth.getUser()
        setCurrentAgent(user)
        await fetchAll(user)
    }

    const fetchAll = async (user?: any) => {
        setIsLoading(true)
        const agent = user || currentAgent

        try {
            const { data: { session } } = await supabase.auth.getSession()
            if (!session) return

            // Fetch tickets
            const ticketRes = await fetch('/api/tickets', {
                headers: { 'Authorization': `Bearer ${session.access_token}` },
            })
            if (ticketRes.ok) {
                const data = await ticketRes.json()
                setTickets(data.tickets || [])
            }

            // Fetch live chat sessions
            const { data: chats } = await supabase
                .from('chat_sessions')
                .select('*')
                .in('status', ['open', 'in_progress'])
                .order('created_at', { ascending: false })

            setChatSessions(chats || [])
        } catch (err) {
            console.error('Error fetching data:', err)
        } finally {
            setIsLoading(false)
        }
    }

    const handleRefresh = async () => {
        setRefreshing(true)
        await fetchAll()
        setRefreshing(false)
    }

    const handleQuickAssign = async (ticketId: string) => {
        if (!currentAgent) return
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) return

        await fetch(`/api/tickets/${ticketId}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({ assigned_agent_id: currentAgent.id }),
        })
        fetchAll()
    }

    const handleQuickStatus = async (ticketId: string, status: string) => {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) return

        await fetch(`/api/tickets/${ticketId}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({ status }),
        })
        fetchAll()
    }

    // Filtering
    const filtered = tickets.filter(t => {
        if (viewTab === 'mine' && t.assigned_agent_id !== currentAgent?.id) return false
        if (viewTab === 'unassigned' && t.assigned_agent_id !== null) return false
        if (statusFilter && t.status !== statusFilter) return false
        if (priorityFilter && t.priority !== priorityFilter) return false
        if (categoryFilter && t.category !== categoryFilter) return false
        if (searchQuery) {
            const q = searchQuery.toLowerCase()
            const ticketNum = `SST-${String(t.ticket_number).padStart(4, '0')}`.toLowerCase()
            return (
                t.subject.toLowerCase().includes(q) ||
                ticketNum.includes(q) ||
                t.profiles?.email?.toLowerCase().includes(q) ||
                t.profiles?.first_name?.toLowerCase().includes(q) ||
                t.profiles?.last_name?.toLowerCase().includes(q)
            )
        }
        return true
    })

    // Stats
    const stats = {
        open: tickets.filter(t => t.status === 'open').length,
        unassigned: tickets.filter(t => !t.assigned_agent_id && t.status !== 'closed').length,
        breached: tickets.filter(t =>
            t.first_response_due && !t.first_responded_at && new Date(t.first_response_due) < new Date()
        ).length,
        liveChats: chatSessions.length,
    }

    const customerName = (ticket: Ticket) => {
        if (ticket.profiles?.first_name || ticket.profiles?.last_name) {
            return `${ticket.profiles.first_name || ''} ${ticket.profiles.last_name || ''}`.trim()
        }
        return ticket.profiles?.email || 'Unknown'
    }

    const agentName = (ticket: Ticket) => {
        if (!ticket.agent) return null
        if (ticket.agent.first_name || ticket.agent.last_name) {
            return `${ticket.agent.first_name || ''} ${ticket.agent.last_name || ''}`.trim()
        }
        return ticket.agent.email
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* Header */}
            <header className="bg-kb-navy text-white p-6 shadow-lg">
                <div className="container mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex items-center gap-3">
                        <div className="bg-white/10 p-2 rounded-xl">
                            <LifeBuoy size={24} />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold tracking-tight">Support Command Center</h1>
                            <p className="text-white/60 text-xs">Manage tickets, track SLAs, resolve issues</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        {stats.liveChats > 0 && (
                            <Link
                                href="#live-chats"
                                className="flex items-center gap-2 px-4 py-2 bg-amber-500/20 text-amber-300 rounded-full text-xs font-bold hover:bg-amber-500/30 transition-colors"
                            >
                                <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse" />
                                {stats.liveChats} Live Chat{stats.liveChats !== 1 ? 's' : ''}
                            </Link>
                        )}
                        <div className="flex items-center gap-3 text-sm bg-white/5 px-4 py-2 rounded-full border border-white/10">
                            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                            <span className="text-white/80">{currentAgent?.email || 'Agent'}</span>
                        </div>
                    </div>
                </div>
            </header>

            <main className="flex-1 container mx-auto px-4 py-8">
                {/* Stats Row */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                        <div className="w-11 h-11 bg-red-50 rounded-xl flex items-center justify-center text-red-600">
                            <AlertCircle size={22} />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase">Open</p>
                            <p className="text-2xl font-bold text-kb-navy">{stats.open}</p>
                        </div>
                    </div>
                    <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                        <div className="w-11 h-11 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600">
                            <Users size={22} />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase">Unassigned</p>
                            <p className="text-2xl font-bold text-kb-navy">{stats.unassigned}</p>
                        </div>
                    </div>
                    <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                        <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${stats.breached > 0 ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                            <TrendingUp size={22} />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase">SLA Breaches</p>
                            <p className={`text-2xl font-bold ${stats.breached > 0 ? 'text-red-600' : 'text-green-600'}`}>{stats.breached}</p>
                        </div>
                    </div>
                    <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                        <div className="w-11 h-11 bg-green-50 rounded-xl flex items-center justify-center text-green-600">
                            <CheckCircle2 size={22} />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase">Total Tickets</p>
                            <p className="text-2xl font-bold text-kb-navy">{tickets.length}</p>
                        </div>
                    </div>
                </div>

                {/* Live Chat Banner (if active chats exist) */}
                {chatSessions.length > 0 && (
                    <div id="live-chats" className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-5 mb-8">
                        <h3 className="font-bold text-amber-800 mb-3 flex items-center gap-2">
                            <MessageSquare size={18} />
                            Active Live Chats
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {chatSessions.map(session => (
                                <Link
                                    key={session.id}
                                    href={`/admin/live-chat/${session.id}?admin=true`}
                                    className="bg-white rounded-xl p-4 border border-amber-100 hover:border-amber-300 hover:shadow-md transition-all flex items-center gap-3"
                                >
                                    <div className="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
                                        <User size={16} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-sm text-gray-800 truncate">{session.user_name || 'Visitor'}</p>
                                        <p className="text-[10px] text-gray-400 truncate">{session.initial_issue || 'No issue stated'}</p>
                                    </div>
                                    <ArrowRight size={14} className="text-amber-400 shrink-0" />
                                </Link>
                            ))}
                        </div>
                    </div>
                )}

                {/* Ticket Management */}
                <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                    {/* Toolbar */}
                    <div className="p-4 md:p-5 border-b border-gray-100 bg-gray-50/50 space-y-4">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <div className="flex items-center gap-3 flex-wrap">
                                {(['all', 'mine', 'unassigned'] as ViewTab[]).map(t => (
                                    <button
                                        key={t}
                                        onClick={() => setViewTab(t)}
                                        className={`px-4 py-2 font-bold rounded-xl text-xs transition-all capitalize ${
                                            viewTab === t
                                                ? 'bg-kb-navy text-white shadow-sm'
                                                : 'text-gray-500 hover:bg-gray-100'
                                        }`}
                                    >
                                        {t === 'all' ? 'All Tickets' : t === 'mine' ? 'My Tickets' : 'Unassigned'}
                                    </button>
                                ))}
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="relative">
                                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" />
                                    <input
                                        type="text"
                                        placeholder="Search tickets..."
                                        value={searchQuery}
                                        onChange={e => setSearchQuery(e.target.value)}
                                        className="pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-kb-navy/20 focus:border-kb-navy w-48"
                                    />
                                </div>
                                <button
                                    onClick={handleRefresh}
                                    className={`p-2 rounded-xl border border-gray-200 hover:bg-gray-50 transition-all ${refreshing ? 'animate-spin' : ''}`}
                                    title="Refresh"
                                >
                                    <RefreshCw size={14} className="text-gray-400" />
                                </button>
                            </div>
                        </div>

                        {/* Filters row */}
                        <div className="flex items-center gap-3 flex-wrap">
                            <Filter size={13} className="text-gray-300" />
                            <select
                                value={statusFilter}
                                onChange={e => setStatusFilter(e.target.value)}
                                className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs text-gray-600 focus:ring-1 focus:ring-kb-navy/20"
                            >
                                <option value="">All Statuses</option>
                                <option value="open">Open</option>
                                <option value="replied">Replied</option>
                                <option value="resolved">Resolved</option>
                                <option value="closed">Closed</option>
                            </select>
                            <select
                                value={priorityFilter}
                                onChange={e => setPriorityFilter(e.target.value)}
                                className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs text-gray-600 focus:ring-1 focus:ring-kb-navy/20"
                            >
                                <option value="">All Priorities</option>
                                <option value="urgent">Urgent</option>
                                <option value="high">High</option>
                                <option value="medium">Medium</option>
                                <option value="low">Low</option>
                            </select>
                            <select
                                value={categoryFilter}
                                onChange={e => setCategoryFilter(e.target.value)}
                                className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs text-gray-600 focus:ring-1 focus:ring-kb-navy/20"
                            >
                                <option value="">All Categories</option>
                                <option value="Device Repair">Device Repair</option>
                                <option value="Software">Software</option>
                                <option value="Network">Network</option>
                                <option value="Account">Account</option>
                                <option value="Billing">Billing</option>
                                <option value="General">General</option>
                            </select>
                            {(statusFilter || priorityFilter || categoryFilter || searchQuery) && (
                                <button
                                    onClick={() => { setStatusFilter(''); setPriorityFilter(''); setCategoryFilter(''); setSearchQuery('') }}
                                    className="text-[10px] text-red-500 font-bold hover:underline"
                                >
                                    Clear Filters
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Ticket Table */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50/80 text-[10px] uppercase font-bold text-gray-400 border-b border-gray-100">
                                <tr>
                                    <th className="px-5 py-3">Ticket</th>
                                    <th className="px-5 py-3">Customer</th>
                                    <th className="px-5 py-3">Status</th>
                                    <th className="px-5 py-3">Priority</th>
                                    <th className="px-5 py-3">Category</th>
                                    <th className="px-5 py-3">Assigned</th>
                                    <th className="px-5 py-3">Created</th>
                                    <th className="px-5 py-3 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {isLoading ? (
                                    <tr>
                                        <td colSpan={8} className="px-6 py-16 text-center">
                                            <div className="w-8 h-8 border-3 border-kb-navy border-t-transparent rounded-full animate-spin mx-auto" />
                                        </td>
                                    </tr>
                                ) : filtered.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} className="px-6 py-16 text-center">
                                            <Inbox size={32} className="text-gray-200 mx-auto mb-3" />
                                            <p className="text-gray-400 text-sm font-medium">No tickets match your filters</p>
                                        </td>
                                    </tr>
                                ) : (
                                    filtered.map(ticket => (
                                        <tr key={ticket.id} className="hover:bg-gray-50/70 transition-colors group">
                                            <td className="px-5 py-4">
                                                <Link href={`/admin/support/${ticket.id}`} className="block">
                                                    <div className="flex items-center gap-2 mb-0.5">
                                                        <div className={`w-2 h-2 rounded-full ${getPriorityDot(ticket.priority)}`} />
                                                        <span className="text-[10px] font-mono text-gray-400">
                                                            SST-{String(ticket.ticket_number).padStart(4, '0')}
                                                        </span>
                                                        <SLABadge dueDate={ticket.first_response_due} respondedAt={ticket.first_responded_at} />
                                                    </div>
                                                    <p className="font-semibold text-sm text-kb-navy leading-snug truncate max-w-[250px] group-hover:text-blue-700 transition-colors">
                                                        {ticket.subject}
                                                    </p>
                                                </Link>
                                            </td>
                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-7 h-7 rounded-full bg-kb-navy/10 flex items-center justify-center text-kb-navy shrink-0">
                                                        <User size={12} />
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-medium text-gray-800">{customerName(ticket)}</p>
                                                        <p className="text-[10px] text-gray-400">{ticket.profiles?.email}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-5 py-4">
                                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${getStatusStyle(ticket.status)}`}>
                                                    {ticket.status}
                                                </span>
                                            </td>
                                            <td className="px-5 py-4">
                                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${getPriorityBadge(ticket.priority)}`}>
                                                    {ticket.priority}
                                                </span>
                                            </td>
                                            <td className="px-5 py-4">
                                                <span className="text-xs text-gray-500 flex items-center gap-1">
                                                    <Tag size={10} /> {ticket.category}
                                                </span>
                                            </td>
                                            <td className="px-5 py-4">
                                                {ticket.agent ? (
                                                    <span className="text-xs font-medium text-kb-navy flex items-center gap-1">
                                                        <Shield size={10} /> {agentName(ticket)}
                                                    </span>
                                                ) : (
                                                    <button
                                                        onClick={() => handleQuickAssign(ticket.id)}
                                                        className="text-[10px] text-sst-primary font-bold hover:underline"
                                                    >
                                                        Claim
                                                    </button>
                                                )}
                                            </td>
                                            <td className="px-5 py-4">
                                                <span className="text-xs text-gray-400">{timeAgo(ticket.created_at)}</span>
                                            </td>
                                            <td className="px-5 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    {ticket.status === 'open' && (
                                                        <button
                                                            onClick={() => handleQuickStatus(ticket.id, 'resolved')}
                                                            className="text-[10px] text-green-600 font-bold hover:underline"
                                                        >
                                                            Resolve
                                                        </button>
                                                    )}
                                                    <Link
                                                        href={`/admin/support/${ticket.id}`}
                                                        className="inline-flex items-center gap-1 text-kb-navy hover:text-blue-700 transition-colors font-bold text-xs"
                                                    >
                                                        View <ArrowRight size={12} />
                                                    </Link>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Footer */}
                    {!isLoading && (
                        <div className="p-4 border-t border-gray-100 bg-gray-50/30 text-xs text-gray-400 text-center">
                            Showing {filtered.length} of {tickets.length} ticket{tickets.length !== 1 ? 's' : ''}
                        </div>
                    )}
                </div>
            </main>
        </div>
    )
}

export default withAuth(AdminSupportDashboard, { allowedRoles: ['agent', 'admin'] })
